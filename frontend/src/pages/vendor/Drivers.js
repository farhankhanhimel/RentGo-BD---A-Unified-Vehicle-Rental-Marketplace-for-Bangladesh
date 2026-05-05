import React, { useEffect, useState } from 'react';
import {
  createDriver,
  deleteDriver,
  getVendorDrivers,
  updateDriver,
} from '../../services/driverService';
import '../../styles/BookingPages.css';

const emptyForm = {
  fullName: '',
  photoUrl: '',
  nidNumber: '',
  licenseNumber: '',
  licenseExpiry: '',
  experienceYears: '',
  languages: '',
};

const VendorDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const data = await getVendorDrivers();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = {
      ...formData,
      experienceYears: formData.experienceYears ? Number(formData.experienceYears) : undefined,
      languages: formData.languages,
    };

    try {
      if (editingId) {
        await updateDriver(editingId, payload);
        setMessage('Driver updated successfully');
      } else {
        await createDriver(payload);
        setMessage('Driver added to roster');
      }
      resetForm();
      await loadDrivers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to save driver');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (driver) => {
    setEditingId(driver._id);
    setFormData({
      fullName: driver.fullName || '',
      photoUrl: driver.photoUrl || '',
      nidNumber: driver.nidNumber || '',
      licenseNumber: driver.licenseNumber || '',
      licenseExpiry: driver.licenseExpiry ? String(driver.licenseExpiry).slice(0, 10) : '',
      experienceYears: driver.experienceYears ?? '',
      languages: Array.isArray(driver.languages) ? driver.languages.join(', ') : '',
    });
  };

  const handleDelete = async (driverId) => {
    try {
      await deleteDriver(driverId);
      setMessage('Driver removed from roster');
      await loadDrivers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to delete driver');
    }
  };

  return (
    <div className="booking-form-container" style={{ maxWidth: '1200px' }}>
      <div className="booking-card">
        <h1>Driver Roster</h1>
        <p style={{ color: '#718096' }}>Add, update, and remove your driver team.</p>
      </div>

      {message && <div className="toast success">{message}</div>}

      <div className="booking-card" style={{ marginTop: '1.5rem' }}>
        <h2>{editingId ? 'Edit Driver' : 'Add Driver'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group"><label>Full Name</label><input name="fullName" value={formData.fullName} onChange={handleChange} required /></div>
            <div className="form-group"><label>Photo URL</label><input name="photoUrl" value={formData.photoUrl} onChange={handleChange} required /></div>
            <div className="form-group"><label>NID Number</label><input name="nidNumber" value={formData.nidNumber} onChange={handleChange} required /></div>
            <div className="form-group"><label>License Number</label><input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required /></div>
            <div className="form-group"><label>License Expiry</label><input type="date" name="licenseExpiry" value={formData.licenseExpiry} onChange={handleChange} required /></div>
            <div className="form-group"><label>Experience Years</label><input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} required /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Languages</label><input name="languages" value={formData.languages} onChange={handleChange} placeholder="Bangla, English" /></div>
          </div>
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn-prev" onClick={resetForm}>Reset</button>
            <button type="submit" className="btn-submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Driver' : 'Add Driver'}</button>
          </div>
        </form>
      </div>

      <div className="booking-card" style={{ marginTop: '1.5rem' }}>
        <h2>Current Drivers</h2>
        {loading ? (
          <p>Loading drivers...</p>
        ) : drivers.length === 0 ? (
          <p style={{ color: '#718096' }}>No drivers in roster yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            {drivers.map((driver) => (
              <div key={driver._id} className="cost-summary-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="driver-avatar" style={{ width: '64px', height: '64px', overflow: 'hidden' }}>
                    {driver.photoUrl ? <img src={driver.photoUrl} alt={driver.fullName} /> : <span>{driver.fullName?.charAt(0)?.toUpperCase()}</span>}
                  </div>
                  <div>
                    <h3 style={{ margin: 0 }}>{driver.fullName}</h3>
                    <p style={{ margin: '0.2rem 0', color: '#718096' }}>🪪 {driver.licenseNumber}</p>
                    <p style={{ margin: '0.2rem 0', color: '#718096' }}>⭐ {driver.averageRating || 0}/5 • {driver.yearsExperience ?? driver.experienceYears ?? 0} years</p>
                    <p style={{ margin: '0.2rem 0', color: '#718096' }}>{Array.isArray(driver.languages) ? driver.languages.join(', ') : ''}</p>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-prev" onClick={() => handleEdit(driver)}>Edit</button>
                  <button type="button" className="btn-prev" onClick={() => handleDelete(driver._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDrivers;
