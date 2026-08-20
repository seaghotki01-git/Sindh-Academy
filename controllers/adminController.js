const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Attempt = require('../models/Attempt');
const Exam = require('../models/Exam');
const PaymentMethod = require('../models/PaymentMethod');
const { grantFolderAccess, revokeFolderAccess } = require('../services/googleDriveService');

// @desc    Get dashboard telemetry statistics
// @route   GET /api/v1/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const verifiedStudents = await User.countDocuments({ role: 'student', isVerified: true });
    const paidStudents = await User.countDocuments({ role: 'student', isPaid: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalClerks = await User.countDocuments({ role: 'clerk' });

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        verifiedStudents,
        paidStudents,
        totalTeachers,
        totalClerks
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all users list
// @route   GET /api/v1/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a user (role, verification, payment)
// @route   PUT /api/v1/admin/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { name, role, isPaid, isVerified } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousState = {
      name: user.name,
      role: user.role,
      isPaid: user.isPaid,
      isVerified: user.isVerified
    };

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (isPaid !== undefined) user.isPaid = isPaid;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    // Log Administrative Change in Audit Logs
    await AuditLog.create({
      operatorId: req.user.id,
      action: 'USER_MUTATION',
      targetModel: 'User',
      targetId: user._id,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      changeDelta: {
        previousState,
        newState: {
          name: user.name,
          role: user.role,
          isPaid: user.isPaid,
          isVerified: user.isVerified
        }
      }
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await User.deleteOne({ _id: req.params.id });

    // Log deletion
    await AuditLog.create({
      operatorId: req.user.id,
      action: 'USER_DELETE',
      targetModel: 'User',
      targetId: req.params.id,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      changeDelta: {
        deletedUserEmail: user.email
      }
    });

    res.status(200).json({ success: true, message: 'User account removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all administrative mutation logs
// @route   GET /api/v1/admin/logs
// @access  Private (Admin)
exports.getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('operatorId', 'name email role')
      .sort('-timestamp')
      .limit(100);

    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get exam telemetry grade results & comparisons
// @route   GET /api/v1/admin/analytics/grades
// @access  Private (Admin)
exports.getGradeAnalytics = async (req, res) => {
  try {
    const attempts = await Attempt.find({ isCompleted: true })
      .populate('studentId', 'name email')
      .populate('examId', 'title subject');

    if (attempts.length === 0) {
      return res.status(200).json({
        success: true,
        analytics: {
          globalStats: { avg: 0, high: 0, low: 0, totalAttempts: 0 },
          studentSubjectAverages: []
        }
      });
    }

    let totalScore = 0;
    let high = -Infinity;
    let low = Infinity;
    const studentMap = {};

    attempts.forEach(att => {
      const score = att.score || 0;
      totalScore += score;
      if (score > high) high = score;
      if (score < low) low = score;

      const studentIdStr = att.studentId ? att.studentId._id.toString() : 'removed';
      const studentName = att.studentId ? att.studentId.name : 'Removed Student';
      const studentEmail = att.studentId ? att.studentId.email : '-';
      const subject = att.examId ? att.examId.subject : 'General';

      if (!studentMap[studentIdStr]) {
        studentMap[studentIdStr] = {
          id: studentIdStr,
          name: studentName,
          email: studentEmail,
          subjects: { Biology: [], Physics: [], Chemistry: [], English: [] }
        };
      }

      if (studentMap[studentIdStr].subjects[subject]) {
        studentMap[studentIdStr].subjects[subject].push(score);
      } else {
        studentMap[studentIdStr].subjects[subject] = [score];
      }
    });

    const studentSubjectAverages = Object.values(studentMap).map(std => {
      const subjectAverages = {};
      Object.keys(std.subjects).forEach(sub => {
        const scores = std.subjects[sub];
        if (scores.length === 0) {
          subjectAverages[sub] = null;
        } else {
          const sum = scores.reduce((a, b) => a + b, 0);
          subjectAverages[sub] = Math.round(sum / scores.length);
        }
      });

      return {
        id: std.id,
        name: std.name,
        email: std.email,
        averages: subjectAverages
      };
    });

    res.status(200).json({
      success: true,
      analytics: {
        globalStats: {
          avg: Math.round(totalScore / attempts.length),
          high: high === -Infinity ? 0 : high,
          low: low === Infinity ? 0 : low,
          totalAttempts: attempts.length
        },
        studentSubjectAverages
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get unverified pending students list
// @route   GET /api/v1/admin/pending-students
// @access  Private (Clerk / Admin)
exports.getPendingStudents = async (req, res) => {
  try {
    const pending = await User.find({ role: 'student', isVerified: false })
      .select('-password')
      .sort('-createdAt');
    res.status(200).json({ success: true, pending });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Approve student registration and grant drive access
// @route   PUT /api/v1/admin/approve-student/:id
// @access  Private (Clerk / Admin)
exports.approveStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.isVerified = true;
    student.isPaid = true;

    // Grant Google Drive folder access
    try {
      if (student.email && process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
        const permissionId = await grantFolderAccess(student.email, process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
        student.drivePermissionId = permissionId;
      }
    } catch (driveErr) {
      console.error('[GOOGLE DRIVE ERROR] Failed to grant drive access:', driveErr.message);
    }

    await student.save();

    // Create Audit Log
    await AuditLog.create({
      operatorId: req.user.id,
      action: 'STUDENT_APPROVE',
      targetModel: 'User',
      targetId: student._id,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      changeDelta: {
        email: student.email,
        name: student.name
      },
      timestamp: Date.now()
    });

    res.status(200).json({ success: true, message: 'Student approved successfully', student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject and delete student registration
// @route   PUT /api/v1/admin/reject-student/:id
// @access  Private (Clerk / Admin)
exports.rejectStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Unlink receipt file if present
    if (student.receiptImage) {
      try {
        if (fs.existsSync(student.receiptImage)) {
          fs.unlinkSync(student.receiptImage);
        }
      } catch (err) {
        console.error('Failed to delete receipt image file:', err);
      }
    }

    await User.deleteOne({ _id: req.params.id });

    // Create Audit Log
    await AuditLog.create({
      operatorId: req.user.id,
      action: 'STUDENT_REJECT',
      targetModel: 'User',
      targetId: student._id,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      changeDelta: {
        email: student.email,
        name: student.name
      },
      timestamp: Date.now()
    });

    res.status(200).json({ success: true, message: 'Student rejected and account removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all payment methods
// @route   GET /api/v1/admin/payment-methods
// @access  Private (Admin)
exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find().sort('-createdAt');
    res.status(200).json({ success: true, methods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create payment method
// @route   POST /api/v1/admin/payment-methods
// @access  Private (Admin)
exports.createPaymentMethod = async (req, res) => {
  try {
    const { name, accountHolderName, accountNumber, amount, extraDetails, isActive } = req.body;
    if (!name || !accountHolderName || !accountNumber) {
      return res.status(400).json({ success: false, message: 'Name, Account Holder Name, and Account Number are required.' });
    }

    const method = await PaymentMethod.create({
      name,
      accountHolderName,
      accountNumber,
      amount: amount || 5000,
      extraDetails: extraDetails || '',
      isActive: isActive !== undefined ? isActive : true
    });

    // Log administrative action
    await AuditLog.create({
      operatorId: req.user.id,
      action: 'PAYMENT_METHOD_CREATE',
      targetModel: 'PaymentMethod',
      targetId: method._id,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      timestamp: Date.now()
    });

    res.status(201).json({ success: true, method });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update payment method
// @route   PUT /api/v1/admin/payment-methods/:id
// @access  Private (Admin)
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { name, accountHolderName, accountNumber, amount, extraDetails, isActive } = req.body;
    const method = await PaymentMethod.findById(req.params.id);
    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    if (name !== undefined) method.name = name;
    if (accountHolderName !== undefined) method.accountHolderName = accountHolderName;
    if (accountNumber !== undefined) method.accountNumber = accountNumber;
    if (amount !== undefined) method.amount = amount;
    if (extraDetails !== undefined) method.extraDetails = extraDetails;
    if (isActive !== undefined) method.isActive = isActive;

    await method.save();

    // Log administrative action
    await AuditLog.create({
      operatorId: req.user.id,
      action: 'PAYMENT_METHOD_UPDATE',
      targetModel: 'PaymentMethod',
      targetId: method._id,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      timestamp: Date.now()
    });

    res.status(200).json({ success: true, method });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete payment method
// @route   DELETE /api/v1/admin/payment-methods/:id
// @access  Private (Admin)
exports.deletePaymentMethod = async (req, res) => {
  try {
    const method = await PaymentMethod.findByIdAndDelete(req.params.id);
    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    // Log administrative action
    await AuditLog.create({
      operatorId: req.user.id,
      action: 'PAYMENT_METHOD_DELETE',
      targetModel: 'PaymentMethod',
      targetId: req.params.id,
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      timestamp: Date.now()
    });

    res.status(200).json({ success: true, message: 'Payment method removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get active payment methods for guest registration
// @route   GET /api/v1/resources/payment-methods
// @access  Public
exports.getActivePaymentMethods = async (req, res) => {
  try {
    const methods = await PaymentMethod.find({ isActive: true }).select('name accountHolderName accountNumber amount extraDetails');
    res.status(200).json({ success: true, methods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Securely fetch registration receipt image
// @route   GET /api/v1/admin/registration-receipt/:id
// @access  Private (Clerk, Admin)
exports.getRegistrationReceiptImage = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!student.receiptImage || !fs.existsSync(student.receiptImage)) {
      return res.status(404).json({ success: false, message: 'Receipt proof not found' });
    }

    const ext = path.extname(student.receiptImage).toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.pdf') mimeType = 'application/pdf';

    res.setHeader('Content-Type', mimeType);
    fs.createReadStream(student.receiptImage).pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
