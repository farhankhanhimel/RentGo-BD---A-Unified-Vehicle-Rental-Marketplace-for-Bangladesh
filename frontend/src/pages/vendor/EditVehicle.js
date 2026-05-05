import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import '../../styles/VehiclePages.css';

const EditVehicle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [newPhotos, setNewPhotos] = useState([]);
    const [existingPhotos, setExistingPhotos] = useState([]);
    const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState(0);

    const [formData, setFormData] = useState({
        vehicleType: 'car',
        make: '', model: '', year: '', registrationNo: '',
        city: '', district: '', area: '',
        seats: '', ac: false, gps: false,
        transmission: 'manual', fuelType: 'petrol',
        insuranceExpiry: '', conditionDescription: '',
        selfDrive: true, withDriver: false,
        dailyRate: '', hourlyRate: '', multiDayDiscount: '',
        driverSurcharge: '', fuelIncluded: false, securityDeposit: '',
        driverName: '', driverPhone: '', driverLicenseNumber: '',
        driverLicenseExpiry: '', driverExperienceYears: '',
        driverLanguages: '', driverRating: '', driverPhotoUrl: '',
    });

    useEffect(() => {
        const fetchVehicle = async () => {
            try {
                const res = await api.get(`/vehicles/${id}/detail`);
                const v = res.data.vehicle;
                const driverProfile = v.driverProfile || {};
                setFormData({
                    vehicleType: v.vehicleType,
                    make: v.specs.make, model: v.specs.model, year: v.specs.year,
                    registrationNo: v.specs.registrationNo, seats: v.specs.seats,
                    ac: v.specs.ac, gps: v.specs.gps,
                    transmission: v.specs.transmission || 'manual',
                    fuelType: v.specs.fuelType || 'petrol',
                    insuranceExpiry: v.specs.insuranceExpiry ? v.specs.insuranceExpiry.split('T')[0] : '',
                    conditionDescription: v.specs.conditionDescription || '',
                    selfDrive: v.rentalModes?.selfDrive ?? true,
                    withDriver: v.rentalModes?.withDriver ?? false,
                    dailyRate: v.pricing.dailyRate, hourlyRate: v.pricing.hourlyRate || '',
                    multiDayDiscount: v.pricing.multiDayDiscount || '',
                    driverSurcharge: v.pricing.driverSurcharge || '',
                    fuelIncluded: v.pricing.fuelIncluded || false,
                    securityDeposit: v.pricing.securityDeposit || '',
                    city: v.location.city, district: v.location.district || '',
                    area: v.location.area || '',
                    driverName: driverProfile.name || '',
                    driverPhone: driverProfile.phone || '',
                    driverLicenseNumber: driverProfile.licenseNumber || '',
                    driverLicenseExpiry: driverProfile.licenseExpiry ? driverProfile.licenseExpiry.split('T')[0] : '',
                    driverExperienceYears: driverProfile.yearsExperience || '',
                    driverLanguages: driverProfile.languages ? driverProfile.languages.join(', ') : '',
                    driverRating: driverProfile.rating || '',
                    driverPhotoUrl: driverProfile.photoUrl || '',
                });
                setExistingPhotos(v.media?.photos || []);
                setPrimaryPhotoIndex(v.media?.primaryPhotoIndex || 0);
            } catch (err) {
                setToast({ type: 'error', msg: 'Failed to load vehicle data' });
            } finally {
                setLoading(false);
            }
        };
        fetchVehicle();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleNewPhotos = (e) => {
        const files = Array.from(e.target.files);
        const total = existingPhotos.length + newPhotos.length + files.length;
        if (total > 10) {
            setToast({ type: 'error', msg: 'Max 10 photos total' });
            setTimeout(() => setToast(null), 3000);
            return;
        }
        setNewPhotos((prev) => [...prev, ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))]);
    };

    const deleteExistingPhoto = async (publicId) => {
        try {
            await api.delete(`/vehicles/${id}/photos`, { data: { publicId } });
            setExistingPhotos((prev) => prev.filter((p) => p.publicId !== publicId));
            setToast({ type: 'success', msg: 'Photo deleted' });
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            setToast({ type: 'error', msg: 'Failed to delete photo' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('vehicleType', formData.vehicleType);
            fd.append('specs', JSON.stringify({
                make: formData.make, model: formData.model, year: Number(formData.year),
                registrationNo: formData.registrationNo, seats: Number(formData.seats),
                ac: formData.ac, gps: formData.gps, transmission: formData.transmission,
                fuelType: formData.fuelType, insuranceExpiry: formData.insuranceExpiry || undefined,
                conditionDescription: formData.conditionDescription,
            }));
            fd.append('pricing', JSON.stringify({
                dailyRate: Number(formData.dailyRate), hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
                multiDayDiscount: formData.multiDayDiscount ? Number(formData.multiDayDiscount) : 0,
                driverSurcharge: formData.driverSurcharge ? Number(formData.driverSurcharge) : 0,
                fuelIncluded: formData.fuelIncluded, securityDeposit: formData.securityDeposit ? Number(formData.securityDeposit) : 0,
            }));
            fd.append('location', JSON.stringify({ city: formData.city, district: formData.district, area: formData.area }));
            fd.append('rentalModes', JSON.stringify({ selfDrive: formData.selfDrive, withDriver: formData.withDriver }));
            fd.append('primaryPhotoIndex', primaryPhotoIndex);

            if (formData.withDriver) {
                const languages = formData.driverLanguages
                    ? formData.driverLanguages.split(',').map((l) => l.trim()).filter(Boolean)
                    : [];

                fd.append('driverProfile', JSON.stringify({
                    name: formData.driverName || undefined,
                    phone: formData.driverPhone || undefined,
                    licenseNumber: formData.driverLicenseNumber || undefined,
                    licenseExpiry: formData.driverLicenseExpiry || undefined,
                    yearsExperience: formData.driverExperienceYears
                        ? Number(formData.driverExperienceYears)
                        : undefined,
                    languages,
                    rating: formData.driverRating ? Number(formData.driverRating) : undefined,
                    photoUrl: formData.driverPhotoUrl || undefined,
                }));
            }
            newPhotos.forEach((p) => fd.append('photos', p.file));

            await api.put(`/vehicles/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setToast({ type: 'success', msg: 'Vehicle updated successfully!' });
            setTimeout(() => navigate('/vendor/fleet'), 2000);
        } catch (err) {
            setToast({ type: 'error', msg: err.response?.data?.message || 'Update failed' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="add-vehicle-container"><div className="empty-state-card"><div className="emoji">⏳</div><h3>Loading...</h3></div></div>;

    return (
        <div className="add-vehicle-container">
            <h1>Edit Vehicle</h1>
            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-step" style={{ marginBottom: '1.5rem' }}>
                    <h2>🚗 Basic Info & Specs</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Vehicle Type</label>
                            <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                                {['car', 'motorcycle', 'microbus', 'van', 'pickup', 'bus'].map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Make</label><input name="make" value={formData.make} onChange={handleChange} /></div>
                        <div className="form-group"><label>Model</label><input name="model" value={formData.model} onChange={handleChange} /></div>
                        <div className="form-group"><label>Year</label><input name="year" type="number" value={formData.year} onChange={handleChange} /></div>
                        <div className="form-group"><label>Registration No.</label><input name="registrationNo" value={formData.registrationNo} onChange={handleChange} /></div>
                        <div className="form-group"><label>Seats</label><input name="seats" type="number" value={formData.seats} onChange={handleChange} /></div>
                        <div className="form-group"><label>City</label><input name="city" value={formData.city} onChange={handleChange} /></div>
                        <div className="form-group"><label>District</label><input name="district" value={formData.district} onChange={handleChange} /></div>
                        <div className="form-group"><label>Transmission</label><select name="transmission" value={formData.transmission} onChange={handleChange}><option value="manual">Manual</option><option value="automatic">Automatic</option></select></div>
                        <div className="form-group"><label>Fuel Type</label><select name="fuelType" value={formData.fuelType} onChange={handleChange}>{['petrol', 'diesel', 'cng', 'electric'].map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
                        <div className="checkbox-group">
                            <input type="checkbox" name="ac" checked={formData.ac} onChange={handleChange} id="edit-ac" />
                            <label htmlFor="edit-ac">Air Conditioning</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" name="gps" checked={formData.gps} onChange={handleChange} id="edit-gps" />
                            <label htmlFor="edit-gps">GPS Navigation</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" name="selfDrive" checked={formData.selfDrive} onChange={handleChange} id="edit-selfDrive" />
                            <label htmlFor="edit-selfDrive">Self-Drive Available</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" name="withDriver" checked={formData.withDriver} onChange={handleChange} id="edit-withDriver" />
                            <label htmlFor="edit-withDriver">With Driver Available</label>
                        </div>
                    </div>
                    {formData.withDriver && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ marginBottom: '0.75rem' }}>Driver Profile (Optional)</h3>
                            <div className="form-grid">
                                <div className="form-group"><label>Driver Name</label><input name="driverName" value={formData.driverName} onChange={handleChange} /></div>
                                <div className="form-group"><label>Driver Phone</label><input name="driverPhone" value={formData.driverPhone} onChange={handleChange} /></div>
                                <div className="form-group"><label>License Number</label><input name="driverLicenseNumber" value={formData.driverLicenseNumber} onChange={handleChange} /></div>
                                <div className="form-group"><label>License Expiry</label><input type="date" name="driverLicenseExpiry" value={formData.driverLicenseExpiry} onChange={handleChange} /></div>
                                <div className="form-group"><label>Experience (years)</label><input type="number" name="driverExperienceYears" value={formData.driverExperienceYears} onChange={handleChange} /></div>
                                <div className="form-group"><label>Languages (comma separated)</label><input name="driverLanguages" value={formData.driverLanguages} onChange={handleChange} /></div>
                                <div className="form-group"><label>Rating (0-5)</label><input type="number" step="0.1" name="driverRating" value={formData.driverRating} onChange={handleChange} /></div>
                                <div className="form-group"><label>Photo URL</label><input name="driverPhotoUrl" value={formData.driverPhotoUrl} onChange={handleChange} /></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-step" style={{ marginBottom: '1.5rem' }}>
                    <h2>💰 Pricing</h2>
                    <div className="form-grid">
                        <div className="form-group"><label>Daily Rate (BDT)</label><input name="dailyRate" type="number" value={formData.dailyRate} onChange={handleChange} /></div>
                        <div className="form-group"><label>Hourly Rate</label><input name="hourlyRate" type="number" value={formData.hourlyRate} onChange={handleChange} /></div>
                        <div className="form-group"><label>Multi-Day Discount (%)</label><input name="multiDayDiscount" type="number" value={formData.multiDayDiscount} onChange={handleChange} /></div>
                        <div className="form-group"><label>Driver Surcharge/day</label><input name="driverSurcharge" type="number" value={formData.driverSurcharge} onChange={handleChange} /></div>
                        <div className="form-group"><label>Security Deposit</label><input name="securityDeposit" type="number" value={formData.securityDeposit} onChange={handleChange} /></div>
                    </div>
                </div>

                <div className="form-step" style={{ marginBottom: '1.5rem' }}>
                    <h2>📸 Photos</h2>
                    {existingPhotos.length > 0 && (
                        <div className="photo-preview-grid">
                            {existingPhotos.map((p, i) => (
                                <div key={p.publicId || i} className={`photo-preview-item ${i === primaryPhotoIndex ? 'primary' : ''}`}>
                                    <img src={p.url} alt={`Photo ${i + 1}`} />
                                    <button type="button" className="remove-photo" onClick={() => deleteExistingPhoto(p.publicId)}>×</button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="photo-upload-area" style={{ marginTop: '1rem' }} onClick={() => document.getElementById('new-photos').click()}>
                        <p>📷 <strong>Add more photos</strong></p>
                        <input id="new-photos" type="file" accept="image/*" multiple onChange={handleNewPhotos} style={{ display: 'none' }} />
                    </div>
                    {newPhotos.length > 0 && (
                        <div className="photo-preview-grid" style={{ marginTop: '0.5rem' }}>
                            {newPhotos.map((p, i) => (
                                <div key={i} className="photo-preview-item">
                                    <img src={p.preview} alt={`New ${i + 1}`} />
                                    <button type="button" className="remove-photo" onClick={() => setNewPhotos((prev) => prev.filter((_, j) => j !== i))}>×</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-prev" onClick={() => navigate('/vendor/fleet')}>← Cancel</button>
                    <button type="submit" className="btn-submit" disabled={saving}>{saving ? 'Saving...' : '💾 Save Changes'}</button>
                </div>
            </form>
        </div>
    );
};

export default EditVehicle;
