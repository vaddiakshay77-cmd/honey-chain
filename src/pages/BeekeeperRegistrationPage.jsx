import React, { useState, useEffect, useRef } from 'react';
import { useHoneyChain } from '../context/HoneyChainContext';

export function BeekeeperRegistrationPage() {
  const { registerBeekeeper, navigateTo, beekeepers } = useHoneyChain();

  // Wizard steps: 'FORM' -> 'OTP' -> 'SUCCESS'
  const [currentStep, setCurrentStep] = useState('FORM');

  // Form inputs: name, phone, aadhaar, apiary location
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    aadhaar: '',
    location: '',
    hiveCount: 50,
    flora: 'Wild Multifloral & Mustard Blossom'
  });

  // 6-digit OTP array
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  // Timer & feedback
  const [resendTimer, setResendTimer] = useState(30);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [registeredBeekeeper, setRegisteredBeekeeper] = useState(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (currentStep === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, resendTimer]);

  // Aadhaar auto-formatting: XXXX XXXX XXXX
  const handleAadhaarChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < rawDigits.length; i += 4) {
      parts.push(rawDigits.slice(i, i + 4));
    }
    setFormData(prev => ({ ...prev, aadhaar: parts.join(' ') }));
    if (errorMsg) setErrorMsg('');
  };

  // Phone formatting: 10 digits
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: raw }));
    if (errorMsg) setErrorMsg('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  // Step 1: Submit Details -> Trigger Simulated OTP Screen
  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrorMsg('Please enter the Beekeeper / Apiary Name.');
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    const cleanAadhaar = formData.aadhaar.replace(/\D/g, '');
    if (cleanAadhaar.length < 12) {
      setErrorMsg('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!formData.location.trim()) {
      setErrorMsg('Please specify the Apiary Location.');
      return;
    }

    setErrorMsg('');
    setCurrentStep('OTP');
    setResendTimer(30);
    setOtpDigits(['', '', '', '', '', '']);

    // Auto-focus first OTP digit box after state transition
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 150);
  };

  // OTP digit handling
  const handleOtpDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    if (errorMsg) setErrorMsg('');

    // Auto-advance focus to next digit box
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Backspace handling
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const updated = [...otpDigits];
      for (let i = 0; i < pastedData.length; i++) {
        updated[i] = pastedData[i];
      }
      setOtpDigits(updated);
      const nextIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    }
  };

  // Step 2: Verify OTP (accept ANY 6 digits)
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');

    if (enteredCode.length < 6) {
      setErrorMsg('Please enter all 6 digits of the OTP.');
      return;
    }

    // Accept ANY 6 digits as valid
    setIsVerifyingOtp(true);
    setErrorMsg('');

    setTimeout(() => {
      setIsVerifyingOtp(false);

      // Generate unique beekeeperId
      const beekeeperId = `BEE-IND-${Math.floor(1000 + Math.random() * 9000)}`;

      // Store in shared Context state (in-memory, verified: true)
      const created = registerBeekeeper({
        beekeeperId,
        nodeId: beekeeperId,
        name: formData.name.trim(),
        beekeeperName: formData.name.trim(),
        phone: formData.phone.trim(),
        aadhaar: formData.aadhaar.trim(),
        location: formData.location.trim(),
        region: formData.location.trim(),
        regionCode: 'IN',
        hiveCount: Number(formData.hiveCount) || 45,
        flora: formData.flora,
        verified: true,
        certifications: ['100% Raw Honey', 'Aadhaar e-KYC Verified', 'FSSAI Apiary Standard']
      });

      setRegisteredBeekeeper(created);
      setCurrentStep('SUCCESS');
    }, 700);
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setOtpDigits(['', '', '', '', '', '']);
    setErrorMsg('');
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  const handleResetRegistration = () => {
    setFormData({
      name: '',
      phone: '',
      aadhaar: '',
      location: '',
      hiveCount: 50,
      flora: 'Wild Multifloral & Mustard Blossom'
    });
    setOtpDigits(['', '', '', '', '', '']);
    setCurrentStep('FORM');
    setRegisteredBeekeeper(null);
    setErrorMsg('');
  };

  // Masked display helpers
  const cleanAadhaar = formData.aadhaar.replace(/\D/g, '');
  const maskedAadhaar = cleanAadhaar.length >= 4 
    ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}`
    : 'XXXX-XXXX-XXXX';
  const maskedPhone = formData.phone.length >= 4
    ? `+91 XXXXX ${formData.phone.slice(-4)}`
    : '+91 XXXXX XXXXX';

  return (
    <div className="page-container beekeeper-reg-page">
      {/* Header */}
      <div className="page-header-wrap">
        <div className="page-tag-pill">Producer Onboarding • UIDAI e-KYC</div>
        <h1 className="page-title">Beekeeper Registration</h1>
        <p className="page-subtitle">
          Register your apiary with simulated Aadhaar e-KYC identity verification.
          Every verified producer receives an immutable beekeeper node ID to mint authentic honey batches.
        </p>

        {/* Mandatory UIDAI Disclaimer Note Banner */}
        <div className="aadhaar-disclaimer-note" id="aadhaar-uidai-note">
          <span className="note-badge">Simulated KYC</span>
          <span className="note-text">
            Aadhaar verification simulated for demo — production integrates with UIDAI e-KYC via licensed AUA.
          </span>
        </div>
      </div>

      <div className="form-preview-layout">
        {/* Main Step Container */}
        <div className="form-card">
          {/* STEP 1: REGISTRATION FORM */}
          {currentStep === 'FORM' && (
            <div className="step-fade-in">
              <div className="form-step-indicator">
                <span className="step-circle active">1</span>
                <span className="step-text-lbl">Apiary & Aadhaar Credentials</span>
              </div>

              <h2 className="form-card-title">Beekeeper Identity Details</h2>
              <p className="form-card-sub">
                Please enter your personal details and apiary location to initiate UIDAI e-KYC verification.
              </p>

              {errorMsg && (
                <div className="form-error-alert">
                  <span>⚠️ {errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="standard-form">
                {/* Beekeeper Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="beekeeper-name-input">
                    Beekeeper Full Name / Apiary Name <span className="req">*</span>
                  </label>
                  <input
                    id="beekeeper-name-input"
                    name="name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Kumar / Himalayan Wild Reserves"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Phone & Aadhaar in 2-column grid */}
                <div className="form-grid-2">
                  {/* Phone Number */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="beekeeper-phone-input">
                      Mobile Number (Linked to Aadhaar) <span className="req">*</span>
                    </label>
                    <div className="input-prefix-group">
                      <span className="input-addon-prefix">🇮🇳 +91</span>
                      <input
                        id="beekeeper-phone-input"
                        name="phone"
                        type="tel"
                        maxLength={10}
                        className="form-input font-mono"
                        placeholder="98765 43210"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        required
                      />
                    </div>
                    <span className="field-subtext">OTP will be simulated for this number</span>
                  </div>

                  {/* Aadhaar Number */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="beekeeper-aadhaar-input">
                      12-Digit Aadhaar Number <span className="req">*</span>
                    </label>
                    <div className="input-prefix-group">
                      <span className="input-addon-prefix">🆔</span>
                      <input
                        id="beekeeper-aadhaar-input"
                        name="aadhaar"
                        type="text"
                        maxLength={14}
                        className="form-input font-mono"
                        placeholder="5544 3322 1100"
                        value={formData.aadhaar}
                        onChange={handleAadhaarChange}
                        required
                      />
                    </div>
                    <span className="field-subtext">Format: 12 digits (auto-spaced)</span>
                  </div>
                </div>

                {/* Apiary Location */}
                <div className="form-group">
                  <label className="form-label" htmlFor="beekeeper-location-input">
                    Apiary Location & Geographic Flora Zone <span className="req">*</span>
                  </label>
                  <input
                    id="beekeeper-location-input"
                    name="location"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Kangra Valley, Himachal Pradesh (or Coorg, Karnataka)"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Additional Harvest Details */}
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="beekeeper-flora-input">
                      Primary Forage Flora
                    </label>
                    <input
                      id="beekeeper-flora-input"
                      name="flora"
                      type="text"
                      className="form-input"
                      value={formData.flora}
                      onChange={handleInputChange}
                      placeholder="e.g. Mustard, Acacia, Wild Jamun"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="beekeeper-hives-input">
                      Managed Bee Colonies (Hives)
                    </label>
                    <input
                      id="beekeeper-hives-input"
                      name="hiveCount"
                      type="number"
                      min="1"
                      max="5000"
                      className="form-input font-mono"
                      value={formData.hiveCount}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Submit to Trigger OTP */}
                <button
                  id="submit-aadhaar-form-btn"
                  type="submit"
                  className="btn-primary btn-block btn-lg"
                >
                  <span>📲 Proceed to Aadhaar OTP Verification</span>
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: SIMULATED OTP SCREEN */}
          {currentStep === 'OTP' && (
            <div className="step-fade-in otp-screen-container">
              <div className="form-step-indicator">
                <span className="step-circle active">2</span>
                <span className="step-text-lbl">Simulated Aadhaar OTP Verification</span>
              </div>

              <div className="otp-icon-header">
                <div className="otp-icon-circle">🔐</div>
                <h2 className="form-card-title">Enter 6-Digit OTP</h2>
                <p className="form-card-sub">
                  A simulated 6-digit one-time password has been issued for Aadhaar ending in{' '}
                  <strong className="text-amber">{maskedAadhaar}</strong>.
                </p>
              </div>

              <div className="otp-phone-pill">
                <span>Sent to: <strong>{maskedPhone}</strong></span>
              </div>

              {/* Demo Helper Hint Banner */}
              <div className="otp-demo-hint-box">
                <span className="hint-icon">💡</span>
                <div>
                  <strong>Demo Mode:</strong> Enter <em>any 6 digits</em> (e.g. <code>1 2 3 4 5 6</code>) to successfully verify the beekeeper.
                </div>
              </div>

              {errorMsg && (
                <div className="form-error-alert">
                  <span>⚠️ {errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="otp-form-wrap">
                {/* 6 Individual Digit Inputs */}
                <div className="otp-inputs-grid" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className={`otp-digit-input ${digit ? 'filled' : ''}`}
                      value={digit}
                      onChange={e => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      autoComplete="one-time-code"
                      aria-label={`Digit ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="otp-resend-row">
                  {resendTimer > 0 ? (
                    <span className="resend-timer-text">
                      Resend OTP in <strong>00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-resend-link"
                      onClick={handleResendOtp}
                    >
                      ↻ Resend Simulated OTP
                    </button>
                  )}
                </div>

                <div className="otp-actions-row">
                  <button
                    id="verify-otp-submit-btn"
                    type="submit"
                    className="btn-primary btn-block btn-lg"
                    disabled={isVerifyingOtp}
                  >
                    {isVerifyingOtp ? (
                      <span>⏳ Verifying e-KYC with UIDAI...</span>
                    ) : (
                      <span>✓ Verify OTP & Complete Registration</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-tertiary btn-block"
                    onClick={() => {
                      setCurrentStep('FORM');
                      setErrorMsg('');
                    }}
                  >
                    ← Edit Mobile or Aadhaar Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: SUCCESS STATE */}
          {currentStep === 'SUCCESS' && registeredBeekeeper && (
            <div className="step-fade-in success-state-container">
              <div className="success-badge-large">
                <div className="success-check-icon">✓</div>
              </div>

              <div className="success-tag-pill">UIDAI e-KYC VERIFIED</div>
              <h2 className="success-heading">Beekeeper Registered Successfully!</h2>
              <p className="success-description">
                Identity verified via simulated Aadhaar authentication. The beekeeper has been
                stored in session memory with a unique, unalterable Beekeeper ID.
              </p>

              {/* Generated Beekeeper ID Showcase Card */}
              <div className="generated-id-card">
                <div className="id-card-label">ASSIGNED BEEKEEPER ID (NODE)</div>
                <div className="id-card-value font-mono">
                  {registeredBeekeeper.beekeeperId}
                </div>
                <div className="id-card-meta">
                  <span>Producer: <strong>{registeredBeekeeper.name}</strong></span>
                  <span>Location: <strong>{registeredBeekeeper.location}</strong></span>
                  <span>Aadhaar: <strong className="font-mono">{maskedAadhaar}</strong></span>
                </div>
                <div className="id-status-badge">
                  <span className="dot-green"></span>
                  <span>Status: Verified (UIDAI e-KYC)</span>
                </div>
              </div>

              <div className="success-button-group">
                <button
                  id="success-mint-first-batch-btn"
                  className="btn-primary btn-lg"
                  onClick={() => navigateTo('batch-entry')}
                >
                  <span>⛓️ Mint First Honey Batch for this Beekeeper</span>
                </button>

                <button
                  id="success-register-another-btn"
                  className="btn-secondary"
                  onClick={handleResetRegistration}
                >
                  <span>+ Register Another Beekeeper</span>
                </button>

                <button
                  className="btn-tertiary"
                  onClick={() => navigateTo('admin')}
                >
                  <span>📊 View in Admin Registry</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Identity Badge Preview Sidebar */}
        <div className="preview-sidebar">
          <div className="preview-sticky-wrap">
            <div className="preview-header-label">
              <span>LIVE BEEKEEPER BADGE PREVIEW</span>
              <span className="preview-status-pill">
                {currentStep === 'SUCCESS' ? '✓ Verified' : 'Draft'}
              </span>
            </div>

            <div className="apiary-preview-badge">
              <div className="badge-watermark-hex">⬡</div>

              <div className="badge-top-row">
                <div className="badge-logo-icon">🐝</div>
                <div className="badge-node-tag font-mono">
                  {registeredBeekeeper?.beekeeperId || 'BEE-IND-XXXX'}
                </div>
              </div>

              <h3 className="badge-apiary-name">
                {formData.name || 'Beekeeper / Apiary Name'}
              </h3>
              <div className="badge-beekeeper">
                Mobile: <strong>{maskedPhone}</strong>
              </div>

              <div className="badge-divider"></div>

              <div className="badge-meta-grid">
                <div className="badge-meta-item">
                  <span className="badge-meta-lbl">Aadhaar Status</span>
                  <span className="badge-meta-val font-mono">
                    {currentStep === 'SUCCESS' ? '✓ Verified' : maskedAadhaar}
                  </span>
                </div>
                <div className="badge-meta-item">
                  <span className="badge-meta-lbl">Apiary Location</span>
                  <span className="badge-meta-val">
                    {formData.location || 'Location Pending'}
                  </span>
                </div>
                <div className="badge-meta-item">
                  <span className="badge-meta-lbl">Forage Flora</span>
                  <span className="badge-meta-val">{formData.flora}</span>
                </div>
                <div className="badge-meta-item">
                  <span className="badge-meta-lbl">Managed Hives</span>
                  <span className="badge-meta-val font-mono">{formData.hiveCount} Hives</span>
                </div>
              </div>

              <div className="badge-certs-row">
                <span className="badge-cert-tag">✓ 100% Raw Honey</span>
                <span className="badge-cert-tag">
                  {currentStep === 'SUCCESS' ? '✓ UIDAI e-KYC Verified' : '⏳ Aadhaar Pending'}
                </span>
                <span className="badge-cert-tag">✓ FSSAI Apiary Ready</span>
              </div>

              <div className="badge-footer-row">
                <span className="badge-status-dot"></span>
                <span>HoneyChain Protocol Compliant (Session Memory)</span>
              </div>
            </div>

            {/* List of Verified Beekeepers in Current Session */}
            <div className="registered-nodes-summary">
              <div className="nodes-summary-head">
                <span>Verified Apiary Nodes in Session ({beekeepers.length})</span>
              </div>
              <div className="nodes-mini-list">
                {beekeepers.map(b => (
                  <div key={b.id} className="nodes-mini-item">
                    <div className="mini-item-name">{b.name}</div>
                    <div className="mini-item-region">{b.location || b.region}</div>
                    <div className="mini-item-node font-mono">
                      {b.beekeeperId || b.nodeId} {b.verified && '• ✓ Verified'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
