import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Profile.css';

const Profile = () => {
  const { user, updateProfile, uploadAvatar, changePassword, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await uploadAvatar(file);
      setSuccess('Avatar uploaded successfully!');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        setLoading(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      await changePassword(
        passwordData.oldPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      setSuccess('Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="cover-photo"></div>
        <div className="profile-info">
          <div className="avatar-section">
            <img 
              src={user?.avatar || 'https://via.placeholder.com/150'} 
              alt="Profile"
              className="avatar-image"
            />
            <label className="avatar-upload">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={loading}
              />
              <span>📷 Change</span>
            </label>
          </div>
          <div className="user-info">
            <h1>{user?.name}</h1>
            <p className="role-badge">{user?.role}</p>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Settings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button 
          className={`tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          Saved Addresses
        </button>
      </div>

      <div className="profile-content">
        {/* Profile Settings Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            <h2>Edit Profile</h2>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (Read-only)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="tab-content">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label htmlFor="oldPassword">Current Password</label>
                <input
                  type="password"
                  id="oldPassword"
                  name="oldPassword"
                  value={passwordData.oldPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              {error && <div className="error">{error}</div>}
              {success && <div className="success">{success}</div>}

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>

            <div className="security-section">
              <h3>Account Security</h3>
              <div className="security-item">
                <span>Two-Factor Authentication</span>
                <button className="btn btn-secondary btn-small">Enable</button>
              </div>
              <div className="security-item">
                <span>Login Activity</span>
                <button className="btn btn-secondary btn-small">View</button>
              </div>
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="tab-content">
            <h2>Saved Addresses</h2>
            <div className="addresses-list">
              <div className="empty-state">
                <p>No saved addresses yet</p>
                <button className="btn btn-primary">Add Address</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="profile-footer">
        <button className="btn btn-danger" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
