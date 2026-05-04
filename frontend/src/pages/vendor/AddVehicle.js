import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/VehiclePages.css';

const AddVehicle = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [photos, setPhotos] = useState([]);
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        if (photos.length + files.length > 10) {
            setToast({ type: 'error', msg: 'Maximum 10 photos allowed' });
            setTimeout(() => setToast(null), 3000);
            return;
        }
        const newPhotos = files.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
        setPhotos((prev) => [...prev, ...newPhotos]);
    };

    const removePhoto = (index) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
        if (primaryPhotoIndex >= photos.length - 1) setPrimaryPhotoIndex(0);
    };

    const validateStep = () => {
        switch (step) {
            case 1:
                return formData.vehicleType && formData.make && formData.model && formData.year && formData.registrationNo && formData.city;
            case 2:
                return formData.seats;
            case 3:
                return formData.dailyRate;
            case 4:
                return true;
            default:
                return false;
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('vehicleType', formData.vehicleType);
            fd.append('specs', JSON.stringify({
                make: formData.make, model: formData.model,
                year: Number(formData.year), registrationNo: formData.registrationNo,
                seats: Number(formData.seats), ac: formData.ac, gps: formData.gps,
                transmission: formData.transmission, fuelType: formData.fuelType,
                insuranceExpiry: formData.insuranceExpiry || undefined,
                conditionDescription: formData.conditionDescription,
            }));
            fd.append('pricing', JSON.stringify({
                dailyRate: Number(formData.dailyRate),
                hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined,
                multiDayDiscount: formData.multiDayDiscount ? Number(formData.multiDayDiscount) : 0,
                driverSurcharge: formData.driverSurcharge ? Number(formData.driverSurcharge) : 0,
                fuelIncluded: formData.fuelIncluded,
                securityDeposit: formData.securityDeposit ? Number(formData.securityDeposit) : 0,
            }));
            fd.append('location', JSON.stringify({
                city: formData.city, district: formData.district, area: formData.area,
            }));
            fd.append('rentalModes', JSON.stringify({
                selfDrive: formData.selfDrive, withDriver: formData.withDriver,
            }));
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

            photos.forEach((p) => fd.append('photos', p.file));

            await api.post('/vehicles/create', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setToast({ type: 'success', msg: 'Vehicle listed successfully! Pending admin approval.' });
            setTimeout(() => navigate('/vendor/fleet'), 2000);
        } catch (err) {
            setToast({ type: 'error', msg: err.response?.data?.message || 'Failed to create listing' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const stepLabels = ['Basic Info', 'Specifications', 'Pricing', 'Photos & Submit'];

    if (user?.vendorDetails?.isVerified === false) {
        return (
            <div className="add-vehicle-container">
                <h1>List a New Vehicle</h1>
                <div
                    style={{
                        background: '#fff3cd',
                        border: '1px solid #ffeeba',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        color: '#856404',
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>Verification Required</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Your vendor account must be verified before you can list vehicles.
                    </p>
                    <button className="btn-prev" onClick={() => navigate('/dashboard/vendor')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="add-vehicle-container">
            <h1>List a New Vehicle</h1>
            <p style={{ color: '#718096', marginBottom: '1rem' }}>Fill in the details to list your vehicle on RentGo BD</p>

            {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

            {/* Progress Bar */}
            <div className="progress-bar-container">
                {stepLabels.map((label, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                        <div className={`progress-step ${i + 1 < step ? 'completed' : ''} ${i + 1 === step ? 'active' : ''}`} />
                        <div className="step-label">{label}</div>
                    </div>
                ))}
            </div>

            {/* Step 1 — Basic Info */}
            {step === 1 && (
                <div className="form-step">
                    <h2>🚗 Basic Information</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Vehicle Type *</label>
                            <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}>
                                <option value="car">Car</option>
                                <option value="motorcycle">Motorcycle</option>
                                <option value="microbus">Microbus</option>
                                <option value="van">Van</option>
                                <option value="pickup">Pickup</option>
                                <option value="bus">Bus</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Make *</label>
                            <input name="make" placeholder="e.g. Toyota" value={formData.make} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Model *</label>
                            <input name="model" placeholder="e.g. Corolla" value={formData.model} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Year *</label>
                            <input name="year" type="number" placeholder="e.g. 2022" value={formData.year} onChange={handleChange} />
                        </div>
                        <div className="form-group full-width">
                            <label>Registration Number *</label>
                            <input name="registrationNo" placeholder="e.g. DHK-12-3456" value={formData.registrationNo} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>City *</label>
                            <input name="city" placeholder="e.g. Dhaka" value={formData.city} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>District</label>
                            <input name="district" placeholder="e.g. Gulshan" value={formData.district} onChange={handleChange} />
                        </div>
                        <div className="form-group full-width">
                            <label>Area</label>
                            <input name="area" placeholder="e.g. Banani, Road 11" value={formData.area} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <div />
                        <button className="btn-next" disabled={!validateStep()} onClick={() => setStep(2)}>Next →</button>
                    </div>
                </div>
            )}

            {/* Step 2 — Specifications */}
            {step === 2 && (
                <div className="form-step">
                    <h2>⚙️ Specifications</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Seats *</label>
                            <input name="seats" type="number" placeholder="e.g. 5" value={formData.seats} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Transmission</label>
                            <select name="transmission" value={formData.transmission} onChange={handleChange}>
                                <option value="manual">Manual</option>
                                <option value="automatic">Automatic</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fuel Type</label>
                            <select name="fuelType" value={formData.fuelType} onChange={handleChange}>
                                <option value="petrol">Petrol</option>
                                <option value="diesel">Diesel</option>
                                <option value="cng">CNG</option>
                                <option value="electric">Electric</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Insurance Expiry</label>
                            <input name="insuranceExpiry" type="date" value={formData.insuranceExpiry} onChange={handleChange} />
                        </div>
                        <div className="form-group full-width">
                            <label>Condition Description</label>
                            <textarea name="conditionDescription" placeholder="Describe the vehicle condition..." value={formData.conditionDescription} onChange={handleChange} />
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" name="ac" checked={formData.ac} onChange={handleChange} id="ac" />
                            <label htmlFor="ac">Air Conditioning</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" name="gps" checked={formData.gps} onChange={handleChange} id="gps" />
                            <label htmlFor="gps">GPS Navigation</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" name="selfDrive" checked={formData.selfDrive} onChange={handleChange} id="selfDrive" />
                            <label htmlFor="selfDrive">Self-Drive Available</label>
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" name="withDriver" checked={formData.withDriver} onChange={handleChange} id="withDriver" />
                            <label htmlFor="withDriver">With Driver Available</label>
                        </div>
                    </div>

                    {formData.withDriver && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ marginBottom: '0.75rem' }}>Driver Profile (Optional)</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Driver Name</label>
                                    <input name="driverName" value={formData.driverName} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Driver Phone</label>
                                    <input name="driverPhone" value={formData.driverPhone} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>License Number</label>
                                    <input name="driverLicenseNumber" value={formData.driverLicenseNumber} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>License Expiry</label>
                                    <input type="date" name="driverLicenseExpiry" value={formData.driverLicenseExpiry} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Experience (years)</label>
                                    <input type="number" name="driverExperienceYears" value={formData.driverExperienceYears} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Languages (comma separated)</label>
                                    <input name="driverLanguages" value={formData.driverLanguages} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Rating (0-5)</label>
                                    <input type="number" step="0.1" name="driverRating" value={formData.driverRating} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Photo URL</label>
                                    <input name="driverPhotoUrl" value={formData.driverPhotoUrl} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="form-actions">
                        <button className="btn-prev" onClick={() => setStep(1)}>← Back</button>
                        <button className="btn-next" disabled={!validateStep()} onClick={() => setStep(3)}>Next →</button>
                    </div>
                </div>
            )}

            {/* Step 3 — Pricing */}
            {step === 3 && (
                <div className="form-step">
                    <h2>💰 Pricing</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Daily Rate (BDT) *</label>
                            <input name="dailyRate" type="number" placeholder="e.g. 3000" value={formData.dailyRate} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Hourly Rate (BDT)</label>
                            <input name="hourlyRate" type="number" placeholder="e.g. 500" value={formData.hourlyRate} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Multi-Day Discount (%)</label>
                            <input name="multiDayDiscount" type="number" placeholder="e.g. 10" value={formData.multiDayDiscount} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Driver Surcharge (BDT/day)</label>
                            <input name="driverSurcharge" type="number" placeholder="e.g. 1000" value={formData.driverSurcharge} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Security Deposit (BDT)</label>
                            <input name="securityDeposit" type="number" placeholder="e.g. 5000" value={formData.securityDeposit} onChange={handleChange} />
                        </div>
                        <div className="checkbox-group">
                            <input type="checkbox" name="fuelIncluded" checked={formData.fuelIncluded} onChange={handleChange} id="fuelIncluded" />
                            <label htmlFor="fuelIncluded">Fuel Included</label>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button className="btn-prev" onClick={() => setStep(2)}>← Back</button>
                        <button className="btn-next" disabled={!validateStep()} onClick={() => setStep(4)}>Next →</button>
                    </div>
                </div>
            )}

            {/* Step 4 — Photos & Submit */}
            {step === 4 && (
                <div className="form-step">
                    <h2>📸 Photos & Submit</h2>
                    <div className="photo-upload-area" onClick={() => document.getElementById('photo-input').click()}>
                        <p style={{ fontSize: '2rem' }}>📷</p>
                        <p><strong>Click to upload photos</strong></p>
                        <p style={{ fontSize: '0.8rem' }}>Up to 10 photos, max 5MB each (JPG, PNG, WebP)</p>
                        <input id="photo-input" type="file" accept="image/*" multiple onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </div>

                    {photos.length > 0 && (
                        <div className="photo-preview-grid">
                            {photos.map((p, i) => (
                                <div key={i} className={`photo-preview-item ${i === primaryPhotoIndex ? 'primary' : ''}`}>
                                    <img src={p.preview} alt={`Upload ${i + 1}`} />
                                    <button className="remove-photo" onClick={() => removePhoto(i)}>×</button>
                                    {i !== primaryPhotoIndex && (
                                        <button className="set-primary" onClick={() => setPrimaryPhotoIndex(i)}>Set Cover</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="form-actions" style={{ marginTop: '2rem' }}>
                        <button className="btn-prev" onClick={() => setStep(3)}>← Back</button>
                        <button className="btn-submit" disabled={loading} onClick={handleSubmit}>
                            {loading ? 'Submitting...' : '🚀 Submit Vehicle Listing'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddVehicle;
