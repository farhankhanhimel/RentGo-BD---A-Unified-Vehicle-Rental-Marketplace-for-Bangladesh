import React, { useState, useEffect } from 'react';
import { vehicleService } from '../services/vehicleService';

const SearchFilterPage = () => {
  const [location, setLocation] = useState('');
  const [filters, setFilters] = useState({ type: '', minPrice: '', maxPrice: '', transmission: '' });
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await vehicleService.searchVehicles({ location, ...filters });
        setVehicles(data.data);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };
    fetchVehicles();
  }, [location, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
      <div style={{ width: '25%', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Find a Vehicle</h3>
        
        <label>Location:</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Dhaka" style={{ width: '100%', marginBottom: '15px' }} />

        <label>Vehicle Type:</label>
        <select name="type" onChange={handleFilterChange} style={{ width: '100%', marginBottom: '15px' }}>
          <option value="">All</option>
          <option value="car">Car</option>
          <option value="microbus">Microbus</option>
        </select>

        <label>Transmission:</label>
        <select name="transmission" onChange={handleFilterChange} style={{ width: '100%', marginBottom: '15px' }}>
          <option value="">All</option>
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <div style={{ width: '75%' }}>
        <h2>Available Vehicles ({vehicles.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          {vehicles.map((v) => (
            <div key={v._id} style={{ border: '1px solid #eee', padding: '15px', borderRadius: '8px' }}>
              <h4>{v.make} {v.model}</h4>
              <p>📍 {v.operatingArea}</p>
              <p>💰 BDT {v.dailyRate} / day</p>
              <p>⚙️ {v.transmission}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchFilterPage;