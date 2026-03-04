import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState('role'); // role, register, otp
  const [selectedRole, setSelectedRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessType: '',
    businessAddress: '',
    companyRegistration: '',
  });

  const [otpData, setOtpData] = useState({
    code: '',
    attempts: 0,
  });

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep('register');
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      businessType: '',
      businessAddress: '',
      companyRegistration: '',
    });
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      // Prepare registration data
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: selectedRole,
      };

      if (selectedRole === 'vendor') {
        registrationData.vendorDetails = {
          businessName: formData.businessName,
          businessType: formData.businessType,
          businessAddress: formData.businessAddress,
          companyRegistration: formData.companyRegistration,
        };
      }

      const response = await register(registrationData);
      setUserId(response.userId);
      setPhoneNumber(response.phone);
      setStep('otp');
      setOtpData({ code: '', attempts: 0 });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otpData.code || otpData.code.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        setLoading(false);
        return;
      }

      // OTP verification will be done via AuthContext
      // For now, redirect to dashboard
      navigate(`/dashboard/${selectedRole}`);
    } catch (err) {
      setError(err);
      setOtpData({ ...otpData, attempts: otpData.attempts + 1 });
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Role Selection
  if (step === 'role') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Register for RentGo</h2>
          <p className="role-description">Choose your role to get started</p>
          
          <div className="role-selector">
            <div 
              className={`role-card ${selectedRole === 'customer' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('customer')}
            >
              <div className="role-icon">👤</div>
              <h3>Customer</h3>
              <p>Book vehicles for rent</p>
            </div>

            <div 
              className={`role-card ${selectedRole === 'vendor' ? 'active' : ''}`}
              onClick={() => handleRoleSelect('vendor')}
            >
              <div className="role-icon">🏢</div>
              <h3>Vendor</h3>
              <p>List vehicles for rent</p>
            </div>
          </div>

          <p className="auth-switch">
            Already have an account?{' '}
            <span onClick={() => navigate('/login')}>Login here</span>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Registration Form
  if (step === 'register') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <button className="back-btn" onClick={() => setStep('role')}>← Back</button>
          <h2>Register as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+880XXXXXXXXXX"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>

            {/* Vendor-specific fields */}
            {selectedRole === 'vendor' && (
              <>
                <h4 className="vendor-section">Business Details</h4>
                
                <div className="form-group">
                  <label htmlFor="businessName">Business Name</label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Your business name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="businessType">Business Type</label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                  >
                    <option value="">Select business type</option>
                    <option value="rental_agency">Rental Agency</option>
                    <option value="individual">Individual</option>
                    <option value="fleet_operator">Fleet Operator</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="businessAddress">Business Address</label>
                  <input
                    type="text"
                    id="businessAddress"
                    name="businessAddress"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    placeholder="Your business address"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="companyRegistration">Company Registration Number</label>
                  <input
                    type="text"
                    id="companyRegistration"
                    name="companyRegistration"
                    value={formData.companyRegistration}
                    onChange={handleChange}
                    placeholder="Registration number"
                  />
                </div>
              </>
            )}

            {error && <div className="error">{error}</div>}
            
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <span onClick={() => navigate('/login')}>Login here</span>
          </p>
        </div>
      </div>
    );
  }

  // Step 3: OTP Verification
  if (step === 'otp') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Verify Your Phone Number</h2>
          <p className="otp-info">We've sent a 6-digit code to {phoneNumber}</p>
          
          <form onSubmit={handleOTPVerify}>
            <div className="form-group">
              <label htmlFor="otp">Enter OTP Code</label>
              <input
                type="text"
                id="otp"
                value={otpData.code}
                onChange={(e) => setOtpData({ ...otpData, code: e.target.value.slice(0, 6) })}
                placeholder="000000"
                maxLength="6"
                required
                className="otp-input"
              />
              <p className="otp-hint">Code expires in 15 minutes</p>
            </div>

            {error && <div className="error">{error}</div>}
            
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Activate Account'}
            </button>
          </form>

          <div className="otp-actions">
            <p>Didn't receive the code? 
              <span className="resend-link"> Resend OTP</span>
            </p>
            <button className="back-btn" onClick={() => setStep('register')}>← Back to Registration</button>
          </div>
        </div>
      </div>
    );
  }
};

export default Register;
