const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sea_ghotki');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed default Reviews if collection is empty
    const Review = require('../models/Review');
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      await Review.insertMany([
        {
          studentName: 'Dr. Sanaullah Mahar',
          achievement: 'Admitted to PMC (MDCAT Score: 182/200)',
          reviewText: 'SEA was a game-changer for my MDCAT prep. The state-preserving mock tests helped me manage my time perfectly, and the weakness analysis focused my efforts where they mattered most.',
          avatarName: 'student1',
          isFeatured: true
        },
        {
          studentName: 'Engr. Asif Ali Kalwar',
          achievement: 'Admitted to MUET (ECAT Score: 340/400)',
          reviewText: 'The ECAT practice tests were identical to the actual exam layout. The negative marking simulation prepared me mentally to avoid guess-work and score highly in math and physics.',
          avatarName: 'student2',
          isFeatured: true
        },
        {
          studentName: 'Zainab Chachar',
          achievement: 'Admitted to Dow Medical College (DUHS)',
          reviewText: 'Since I live in a rural area, having secure video lecture streaming allowed me to study at my own convenience without travelling. The daily streak kept me highly motivated!',
          avatarName: 'student3',
          isFeatured: true
        }
      ]);
      console.log('[SEED] Default success stories reviews successfully seeded.');
    }

    // Auto-seed default Payment Methods if collection is empty
    const PaymentMethod = require('../models/PaymentMethod');
    const paymentCount = await PaymentMethod.countDocuments();
    if (paymentCount === 0) {
      await PaymentMethod.insertMany([
        {
          name: 'EasyPaisa Mobile Wallet',
          accountHolderName: 'Rizwan Ali',
          accountNumber: '03009314064',
          amount: 5000,
          extraDetails: 'Send fee and copy transaction ID',
          isActive: true
        },
        {
          name: 'JazzCash Mobile Wallet',
          accountHolderName: 'Rizwan Ali',
          accountNumber: '03009314064',
          amount: 5000,
          extraDetails: 'Send fee and copy transaction ID',
          isActive: true
        },
        {
          name: 'Allied Bank Limited (ABL)',
          accountHolderName: 'Rizwan Ali',
          accountNumber: '01100081002834012',
          amount: 5000,
          extraDetails: 'Ghotki Branch, Code: 0283',
          isActive: true
        }
      ]);
      console.log('[SEED] Default payment methods successfully seeded.');
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
