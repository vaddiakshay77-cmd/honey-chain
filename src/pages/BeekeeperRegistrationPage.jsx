import React, { useState } from 'react';
import { useHoneyChain } from '../context/HoneyChainContext';

export function BeekeeperRegistrationPage() {
  const { registerBeekeeper, navigateTo } = useHoneyChain();

  // Screen steps: 'FORM' | 'OTP' | 'SUCCESS'
  const [step, setStep] = useState('FORM');

  // Form fields: name, Aadhaar number, apiary location
  const [formData, setFormData] = useState({
    name: '',
    aadhaar: '',
    location: ''
  });

  // Single OTP input state
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [registeredBeekeeper, setRegisteredBeekeeper] = useState(null);

  // Handle form text changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  // Auto-format Aadhaar as 12 digits (with spaces for readability)
  const handleAadhaarChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.slice(i, i + 4));
    }
    setFormData(prev => ({ ...prev, aadhaar: parts.join(' ') }));
    if (errorMsg) setErrorMsg('');
  };

  // Step 1: Submit Form -> Show single OTP input
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    const cleanAadhaar = formData.aadhaar.replace(/\D/g, '');
    if (cleanAadhaar.length < 12) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMsg('Please enter your apiary location.');
      return;
    }

    setErrorMsg('');
    setOtp('');
    setStep('OTP');
  };

  // Step 2: Submit Single OTP -> Accept any 6 digits -> Mark verified=true & generate beekeeperId
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim().replace(/\D/g, '');

    // Accept any 6 digits
    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter any 6-digit OTP (e.g. 123456).');
      return;
    }

    setErrorMsg('');

    // Generate unique beekeeperId
    const beekeeperId = `BEE-IND-${Math.floor(1000 + Math.random() * 9000)}`;

    // Save to Context with verified=true
    const newBeekeeper = registerBeekeeper({
      beekeeperId,
      name: formData.name.trim(),
      beekeeperName: formData.name.trim(),
      aadhaar: formData.aadhaar.trim(),
      location: formData.location.trim(),
      region: formData.location.trim(),
      verified: true,
      status: 'Verified (UIDAI e-KYC)',
      createdAt: new Date().toISOString()
    });

    setRegisteredBeekeeper(newBeekeeper);
    setStep('SUCCESS');
  };

  const handleReset = () => {
    setFormData({ name: '', aadhaar: '', location: '' });
    setOtp('');
    setErrorMsg('');
    setStep('FORM');
    setRegisteredBeekeeper(null);
  };

  return (
    <div className="page-container beekeeper-reg-page">
      {/* Header */}
      <div className="page-header-wrap">
        <div className="page-tag-pill">Producer Onboarding</div>
        <h1 className="page-title">Beekeeper Registration</h1>
        <p className="page-subtitle">
          Register your apiary to establish an authenticated producer node on the HoneyChain ledger.
        </p>

        {/* Required Disclaimer Text */}
        <div className="aadhaar-disclaimer-note" id="aadhaar-simulated-disclaimer">
          <span className="note-badge">Notice</span>
          <span className="note-text">Aadhaar verification simulated for demo.</span>
        </div>
      </div>

      <div className="form-card-container">
        <div className="form-card">
          {/* Error Alert */}
          {errorMsg && (
            <div className="form-error-alert">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          {/* STEP 1: REGISTRATION FORM */}
          {step === 'FORM' && (
            <form onSubmit={handleFormSubmit} className="standard-form">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">
                  Beekeeper Name <span className="req">*</span>
                </label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar or Sunita Sharma"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-aadhaar">
                  Aadhaar Number <span className="req">*</span>
                </label>
                <input
                  id="reg-aadhaar"
                  name="aadhaar"
                  type="text"
                  maxLength={14}
                  className="form-input font-mono"
                  placeholder="XXXX XXXX XXXX (12 digits)"
                  value={formData.aadhaar}
                  onChange={handleAadhaarChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-location">
                  Apiary Location <span className="req">*</span>
                </label>
                <input
                  id="reg-location"
                  name="location"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Kangra Valley, Himachal Pradesh"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="simulated-demo-subtext">
                ℹ️ Aadhaar verification simulated for demo.
              </div>

              <button
                id="reg-submit-btn"
                type="submit"
                className="btn-primary btn-block btn-lg"
              >
                <span>Proceed to Verification →</span>
              </button>
            </form>
          )}

          {/* STEP 2: SINGLE OTP INPUT SCREEN */}
          {step === 'OTP' && (
            <div className="otp-step-wrap">
              <div className="otp-icon-header">
                <div className="otp-icon-circle">🔐</div>
                <h2 className="form-card-title">Enter OTP Verification</h2>
                <p className="form-card-sub">
                  Enter any 6-digit OTP code to complete simulated Aadhaar verification for{' '}
                  <strong>{formData.name}</strong>.
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="standard-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="single-otp-input">
                    One-Time Password (OTP) <span className="req">*</span>
                  </label>
                  <input
                    id="single-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    className="form-input font-mono text-center otp-single-field"
                    placeholder="Enter any 6 digits (e.g. 123456)"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(val);
                      if (errorMsg) setErrorMsg('');
                    }}
                    required
                  />
                  <span className="field-subtext text-center">
                    Accepts any 6 digits for demonstration
                  </span>
                </div>

                <div className="simulated-demo-subtext text-center mb-4">
                  Aadhaar verification simulated for demo.
                </div>

                <button
                  id="otp-verify-btn"
                  type="submit"
                  className="btn-primary btn-block btn-lg"
                >
                  <span>✓ Verify OTP & Register Beekeeper</span>
                </button>

                <button
                  type="button"
                  className="btn-tertiary btn-block mt-3"
                  onClick={() => setStep('FORM')}
                >
                  ← Back to Details
                </button>
              </form>
            </div>
          )}

          {/* STEP 3: SUCCESS STATE */}
          {step === 'SUCCESS' && registeredBeekeeper && (
            <div className="success-step-wrap text-center">
              <div className="success-icon-badge">✅</div>
              <h2 className="form-card-title">Registration Verified!</h2>
              <p className="form-card-sub">
                Beekeeper successfully verified and added to the HoneyChain ledger.
              </p>

              <div className="beekeeper-credential-card">
                <div className="credential-row">
                  <span className="credential-lbl">Beekeeper ID:</span>
                  <span className="credential-val font-mono text-amber" id="registered-beekeeper-id">
                    {registeredBeekeeper.beekeeperId}
                  </span>
                </div>
                <div className="credential-row">
                  <span className="credential-lbl">Name:</span>
                  <span className="credential-val">{registeredBeekeeper.name}</span>
                </div>
                <div className="credential-row">
                  <span className="credential-lbl">Apiary Location:</span>
                  <span className="credential-val">{registeredBeekeeper.location}</span>
                </div>
                <div className="credential-row">
                  <span className="credential-lbl">Verification Status:</span>
                  <span className="badge-verified-inline">Verified ✅</span>
                </div>
              </div>

              <div className="simulated-demo-subtext mb-4">
                Aadhaar verification simulated for demo.
              </div>

              <div className="success-actions-row">
                <button
                  id="go-to-batch-entry-btn"
                  className="btn-primary btn-lg"
                  onClick={() => navigateTo('batch-entry')}
                >
                  <span>🍯 Proceed to Batch Entry →</span>
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleReset}
                >
                  <span>Register Another Apiary</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
