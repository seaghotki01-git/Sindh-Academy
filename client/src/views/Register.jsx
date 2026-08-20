import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ShieldAlert, Phone, MapPin, Eye, EyeOff, Loader2, Check, Landmark, Wallet, X } from 'lucide-react';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [waNumber, setWaNumber] = useState('');
  const [city, setCity] = useState('');
  const [religion, setReligion] = useState('');
  const [fatherNumber, setFatherNumber] = useState('');
  const [planName, setPlanName] = useState('mdcat/ecat');

  // Payment tracking fields
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal payment state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [fetchingPayments, setFetchingPayments] = useState(false);

  const [strength, setStrength] = useState({ score: 0, text: 'Weak', color: 'var(--danger)' });
  const navigate = useNavigate();

  // Password strength checker
  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, text: 'Weak', color: 'var(--danger)' });
      return;
    }

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let text = 'Weak';
    let color = 'var(--danger)';

    if (score >= 4) {
      text = 'Strong';
      color = 'var(--success)';
    } else if (score >= 2) {
      text = 'Medium';
      color = 'var(--warning)';
    }

    setStrength({ score, text, color });
  }, [password]);

  // Fetch payment accounts
  const openPaymentModal = async () => {
    setPaymentModalOpen(true);
    setFetchingPayments(true);
    try {
      const res = await fetch('/api/v1/resources/payment-methods');
      const data = await res.json();
      if (data.success) {
        setPaymentMethods(data.methods);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingPayments(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Strong password check
    if (strength.text === 'Weak') {
      setError('Please choose a stronger password (Medium or Strong).');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('fatherName', fatherName);
      formData.append('waNumber', waNumber);
      formData.append('city', city);
      formData.append('religion', religion);
      formData.append('fatherNumber', fatherNumber);
      formData.append('planName', planName);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId);
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('Registration submitted successfully! Please proceed to WhatsApp verification.');
      } else {
        setError(data.message || 'Registration failed. Please verify credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('A network communication failure occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Generate WhatsApp prefilled message
  const triggerWhatsAppRedirect = () => {
    const message = `Hello Sindh Educational Academy. I have registered my student account on the website. 
Here are my details:
Name: ${name}
Father Name: ${fatherName}
Gmail: ${email}
WhatsApp No: ${waNumber}
City: ${city}
Plan: ${planName.toUpperCase()}
Payment Method Used: ${paymentMethod || 'None'}
Transaction ID: ${transactionId || 'None'}

Please verify and approve my account.`;

    const cleanNum = '923009314064'; // Ghotki Admin WhatsApp Line
    const url = `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (success) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', alignSelf: 'center' }}>
            <Check size={36} color="var(--success)" />
          </div>
          <div>
            <h2 style={{ fontSize: '28px', color: 'var(--gold)', marginBottom: '12px' }}>Registration Submitted!</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Your account has been successfully created and queued for manual approval by the academy clerks.
              To accelerate verification, please share your details via WhatsApp.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', textAlign: 'left' }}>
            <h4 style={{ color: 'var(--gold)', marginBottom: '8px', fontSize: '15px' }}>Next Steps:</h4>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px' }}>
              <li>Send your fee to one of the academy payment accounts.</li>
              <li>Click the WhatsApp button below to submit your details directly.</li>
              <li>Once verified, your login will be activated with premium access.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={triggerWhatsAppRedirect} className="btn-gold" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Check size={18} /> Share Details on WhatsApp
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary" style={{ width: '100%', padding: '14px' }}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90vh', padding: '40px 20px' }}>
      <style>{`
        .register-grid {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 20px !important;
          width: 100% !important;
        }
        @media (max-width: 768px) {
          .register-grid {
            grid-template-columns: 1fr !important;
          }
          .register-grid .form-group {
            grid-column: span 1 !important;
          }
        }
      `}</style>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', color: 'var(--gold)', marginBottom: '8px' }}>Create Student Profile</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Register your account details for admission approval</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '14px', borderRadius: '10px', fontSize: '14px' }}>
            <ShieldAlert size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', color: 'var(--gold)', fontSize: '18px' }}>1. Personal Profile</h3>

          <div className="register-grid">
            <div className="form-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" required className="form-input" style={{ paddingLeft: '48px' }} placeholder="Dr./Engr. Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Father's Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" required className="form-input" style={{ paddingLeft: '48px' }} placeholder="Father's Full Name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address (Gmail)</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" required className="form-input" style={{ paddingLeft: '48px' }} placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type={showPassword ? "text" : "password"} required className="form-input" style={{ paddingLeft: '48px', paddingRight: '48px' }} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>

              {password && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                    <span style={{ color: strength.color, fontWeight: 'bold' }}>{strength.text}</span>
                  </div>
                  <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(strength.score / 5) * 100}%`, height: '100%', background: strength.color, transition: 'all 0.3s ease' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', color: 'var(--gold)', fontSize: '18px', marginTop: '10px' }}>2. Contact & Demographics</h3>

          <div className="register-grid">
            <div className="form-group">
              <label>WhatsApp Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" required className="form-input" style={{ paddingLeft: '48px' }} placeholder="e.g. 03001234567" value={waNumber} onChange={(e) => setWaNumber(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Father's Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" required className="form-input" style={{ paddingLeft: '48px' }} placeholder="e.g. 03331234567" value={fatherNumber} onChange={(e) => setFatherNumber(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>City</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" required className="form-input" style={{ paddingLeft: '48px' }} placeholder="e.g. Ghotki, Sukkur" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Religion</label>
              <input type="text" required className="form-input" placeholder="Islam, Hinduism, etc." value={religion} onChange={(e) => setReligion(e.target.value)} />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Class/Preparation Program</label>
              <select className="form-input" value={planName} onChange={(e) => setPlanName(e.target.value)}>
                <option value="mdcat/ecat">MDCAT & ECAT Entry Test Prep Portal </option>
                <option value="coaching">Matric & Intermediate Board Exams Coaching </option>
              </select>
            </div>
          </div>

          <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', color: 'var(--gold)', fontSize: '18px', marginTop: '10px' }}>3. Fee Payment Details</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '14px 20px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div>
                <h4 style={{ color: 'var(--gold)', fontSize: '14px', marginBottom: '4px' }}>Need Academy Account Details?</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Click to view EasyPaisa, JazzCash, and Bank account holder details</p>
              </div>
              <button type="button" onClick={openPaymentModal} className="btn-gold" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Get Account Details
              </button>
            </div>

            <div className="register-grid">
              <div className="form-group">
                <label>Payment Method Used</label>
                <input type="text" className="form-input" placeholder="e.g. EasyPaisa, JazzCash, Allied Bank" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Transaction ID (Trx ID)</label>
                <input type="text" className="form-input" placeholder="Enter Transaction Code" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Upload Receipt Proof (Optional)</label>
                <input type="file" accept="image/*,application/pdf" className="form-input" style={{ padding: '10px' }} onChange={(e) => setReceiptFile(e.target.files[0])} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Supported formats: JPG, PNG, PDF. Max size: 5MB.</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
            <button type="submit" disabled={loading} className="btn-gold" style={{ flex: 2, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" /> Registering...
                </>
              ) : (
                'Submit Registration'
              )}
            </button>
            <button type="button" onClick={() => navigate('/login')} className="btn-secondary" style={{ flex: 1, padding: '16px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Account Info Modal */}
      {paymentModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '550px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            <button onClick={() => setPaymentModalOpen(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <h3 style={{ color: 'var(--gold)', fontSize: '22px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px' }}>Online Fee Account Details</h3>

            {fetchingPayments ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '12px' }}>
                <Loader2 size={32} className="spin" color="var(--gold)" />
                <span style={{ color: 'var(--text-muted)' }}>Loading account information...</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                {paymentMethods.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No active payment methods found. Please contact administration.</p>
                ) : (
                  paymentMethods.map((m) => (
                    <div key={m._id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', display: 'flex', gap: '16px' }}>
                      <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid var(--gold)', borderRadius: '8px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {m.name.toLowerCase().includes('bank') ? <Landmark size={22} color="var(--gold)" /> : <Wallet size={22} color="var(--gold)" />}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <h4 style={{ color: 'var(--gold)', fontSize: '15px', fontWeight: 'bold' }}>{m.name}</h4>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <strong>Account Holder:</strong> {m.accountHolderName}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <strong>Number:</strong> <span style={{ fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px' }}>{m.accountNumber}</span>
                        </div>
                        {m.extraDetails && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                            * {m.extraDetails}
                          </div>
                        )}
                        <div style={{ alignSelf: 'flex-end', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: '1px solid var(--success)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', marginTop: '4px' }}>
                          Fee: {m.amount} PKR
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <button onClick={() => setPaymentModalOpen(false)} className="btn-gold" style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
              I've Copied Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
