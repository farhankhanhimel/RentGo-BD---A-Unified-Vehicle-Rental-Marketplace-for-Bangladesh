import React, { useCallback, useEffect, useState } from 'react';
import routeService from '../services/routeService';
import api from '../utils/api';
import './ManageRoutePackages.css';

const initialForm = {
  routeName: '',
  origin: '',
  destination: '',
  vehicle: '',
  description: '',
  priceMin: '',
  priceMax: '',
  recommendedVehicleTypes: 'car, microbus',
  inclusions: 'Driver, Toll assistance, Flexible pickup',
  pickupPoints: '',
  dropPoints: '',
  durationDays: '1',
  maxPassengers: '4',
  withDriver: true,
  returnTripAvailable: false,
  fuelIncluded: false,
  active: true,
};

const formatCurrency = (value) => `BDT ${Number(value || 0).toLocaleString()}`;

const normalizeVehicle = (vehicle) => ({
  id: vehicle._id,
  name: vehicle.specs?.make
    ? `${vehicle.specs.make} ${vehicle.specs.model} (${vehicle.specs.year})`
    : `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
  type: vehicle.vehicleType,
  city: vehicle.location?.city,
});

const ManageRoutePackages = () => {
  const [packages, setPackages] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingPackage, setEditingPackage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await routeService.getMyRoutePackages();
      setPackages(data.packages || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your route packages');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const response = await api.get('/vehicles/my');
      setVehicles((response.data.vehicles || []).map(normalizeVehicle));
    } catch (err) {
      setVehicles([]);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
    fetchVehicles();
  }, [fetchPackages, fetchVehicles]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingPackage(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setForm(initialForm);
    setEditingPackage(null);
    setShowForm(true);
  };

  const openEditForm = (pkg) => {
    setForm({
      routeName: pkg.routeName || '',
      origin: pkg.origin || '',
      destination: pkg.destination || '',
      vehicle: pkg.vehicle?._id || pkg.vehicle || '',
      description: pkg.description || '',
      priceMin: String(pkg.priceMin || ''),
      priceMax: String(pkg.priceMax || ''),
      recommendedVehicleTypes: (pkg.recommendedVehicleTypes || []).join(', '),
      inclusions: (pkg.inclusions || []).join(', '),
      pickupPoints: (pkg.pickupPoints || []).join(', '),
      dropPoints: (pkg.dropPoints || []).join(', '),
      durationDays: String(pkg.durationDays || 1),
      maxPassengers: String(pkg.maxPassengers || 4),
      withDriver: Boolean(pkg.withDriver),
      returnTripAvailable: Boolean(pkg.returnTripAvailable),
      fuelIncluded: Boolean(pkg.fuelIncluded),
      active: pkg.active !== false,
    });
    setEditingPackage(pkg);
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const payload = {
      ...form,
      priceMin: Number(form.priceMin),
      priceMax: Number(form.priceMax || form.priceMin),
      durationDays: Number(form.durationDays || 1),
      maxPassengers: Number(form.maxPassengers || 1),
    };

    try {
      if (editingPackage) {
        await routeService.updateRoutePackage(editingPackage._id, payload);
        setSuccess('Route package updated');
      } else {
        await routeService.createRoutePackage(payload);
        setSuccess('Route package created');
      }
      resetForm();
      fetchPackages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save route package');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (packageId) => {
    if (!window.confirm('Delete this route package?')) return;
    try {
      await routeService.deleteRoutePackage(packageId);
      setSuccess('Route package deleted');
      fetchPackages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete route package');
    }
  };

  return (
    <div className="mrp-container">
      <div className="mrp-header">
        <div>
          <h1>Intercity Route Packages</h1>
          <p>Create vendor offers for popular city-to-city trips.</p>
        </div>
        <button type="button" className="mrp-primary-btn" onClick={openCreateForm}>New Route Package</button>
      </div>

      {error && <div className="mrp-error">{error}</div>}
      {success && <div className="mrp-success">{success}</div>}

      {showForm && (
        <section className="mrp-form-card">
          <div className="mrp-section-header">
            <h2>{editingPackage ? 'Edit Route Package' : 'Create Route Package'}</h2>
            <button type="button" className="mrp-ghost-btn" onClick={resetForm}>Close</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mrp-form-grid">
              <label className="mrp-full">
                Package title
                <input name="routeName" value={form.routeName} onChange={handleChange} placeholder="Dhaka to Cox's Bazar family microbus" required />
              </label>
              <label>
                Origin city
                <input name="origin" value={form.origin} onChange={handleChange} placeholder="Dhaka" required />
              </label>
              <label>
                Destination city
                <input name="destination" value={form.destination} onChange={handleChange} placeholder="Cox's Bazar" required />
              </label>
              <label>
                Attach vehicle
                <select name="vehicle" value={form.vehicle} onChange={handleChange}>
                  <option value="">No specific vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} - {vehicle.type} - {vehicle.city}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Starting price
                <input name="priceMin" type="number" min="0" value={form.priceMin} onChange={handleChange} placeholder="8500" required />
              </label>
              <label>
                Maximum price
                <input name="priceMax" type="number" min="0" value={form.priceMax} onChange={handleChange} placeholder="15000" required />
              </label>
              <label>
                Duration days
                <input name="durationDays" type="number" min="1" value={form.durationDays} onChange={handleChange} />
              </label>
              <label>
                Max passengers
                <input name="maxPassengers" type="number" min="1" value={form.maxPassengers} onChange={handleChange} />
              </label>
              <label className="mrp-full">
                Description
                <textarea name="description" rows={3} value={form.description} onChange={handleChange} placeholder="Describe pickup flexibility, comfort, route plan, and customer expectations." />
              </label>
              <label className="mrp-full">
                Recommended vehicle types
                <input name="recommendedVehicleTypes" value={form.recommendedVehicleTypes} onChange={handleChange} placeholder="car, microbus, van" />
              </label>
              <label className="mrp-full">
                Included benefits
                <input name="inclusions" value={form.inclusions} onChange={handleChange} placeholder="Driver, AC, Toll assistance" />
              </label>
              <label>
                Pickup points
                <input name="pickupPoints" value={form.pickupPoints} onChange={handleChange} placeholder="Uttara, Dhanmondi, Airport" />
              </label>
              <label>
                Drop points
                <input name="dropPoints" value={form.dropPoints} onChange={handleChange} placeholder="Hotel zone, Bus terminal" />
              </label>
            </div>

            <div className="mrp-toggle-row">
              <label><input type="checkbox" name="withDriver" checked={form.withDriver} onChange={handleChange} /> Driver included</label>
              <label><input type="checkbox" name="returnTripAvailable" checked={form.returnTripAvailable} onChange={handleChange} /> Return trip available</label>
              <label><input type="checkbox" name="fuelIncluded" checked={form.fuelIncluded} onChange={handleChange} /> Fuel included</label>
              <label><input type="checkbox" name="active" checked={form.active} onChange={handleChange} /> Active</label>
            </div>

            <div className="mrp-form-actions">
              <button type="button" className="mrp-secondary-btn" onClick={resetForm}>Cancel</button>
              <button type="submit" className="mrp-primary-btn" disabled={saving}>{saving ? 'Saving...' : 'Save package'}</button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <section className="mrp-empty">Loading route packages...</section>
      ) : packages.length === 0 ? (
        <section className="mrp-empty">
          <h2>No intercity packages yet</h2>
          <p>Create your first city-to-city offer so customers can book it from the route package marketplace.</p>
          <button type="button" className="mrp-primary-btn" onClick={openCreateForm}>Create package</button>
        </section>
      ) : (
        <section className="mrp-grid">
          {packages.map((pkg) => {
            const vehicleName = pkg.vehicle?.make ? `${pkg.vehicle.make} ${pkg.vehicle.model}` : 'Flexible vehicle';
            const vendorPrice = `${formatCurrency(pkg.priceMin)} - ${formatCurrency(pkg.priceMax)}`;
            return (
              <article key={pkg._id} className="mrp-package-card">
                <div className="mrp-card-top">
                  <span className={pkg.active ? 'mrp-status active' : 'mrp-status'}>{pkg.active ? 'Active' : 'Inactive'}</span>
                  <span>{pkg.bookingsCount || 0} bookings</span>
                </div>
                <h3>{pkg.routeName}</h3>
                <p>{pkg.origin} to {pkg.destination}</p>
                <div className="mrp-card-price">{vendorPrice}</div>
                <div className="mrp-card-meta">
                  <span>{vehicleName}</span>
                  <span>{pkg.maxPassengers || 1} passengers</span>
                  <span>{pkg.durationDays || 1} day package</span>
                  {pkg.withDriver && <span>Driver</span>}
                  {pkg.returnTripAvailable && <span>Return option</span>}
                  {pkg.fuelIncluded && <span>Fuel included</span>}
                </div>
                {pkg.inclusions?.length > 0 && (
                  <div className="mrp-inclusions">
                    {pkg.inclusions.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
                  </div>
                )}
                <div className="mrp-card-actions">
                  <button type="button" className="mrp-secondary-btn" onClick={() => openEditForm(pkg)}>Edit</button>
                  <button type="button" className="mrp-danger-btn" onClick={() => handleDelete(pkg._id)}>Delete</button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default ManageRoutePackages;
