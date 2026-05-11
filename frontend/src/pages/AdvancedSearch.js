import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AdvancedSearch = () => {
  const [vehicles, setVehicles] = useState([]);
  
  // This holds the actual active search data
  const [activeFilters, setActiveFilters] = useState({ city: '', vehicleType: '', tripType: '', sort: 'newest' });
  
  // This holds what you are currently typing (before you hit search)
  const [tempFilters, setTempFilters] = useState({ city: '', vehicleType: '', tripType: '', sort: 'newest' });

  useEffect(() => {
    const fetchVehicles = async () => {
      const query = new URLSearchParams(activeFilters).toString();
      const res = await axios.get(`http://localhost:5000/api/advanced-search?${query}`);
      setVehicles(res.data.data);
    };
    fetchVehicles();
  }, [activeFilters]);

  // Only updates the temporary typing state
  const handleType = (e) => setTempFilters({ ...tempFilters, [e.target.name]: e.target.value });

  // Pushes the temporary state to the active state, triggering the search
  const executeSearch = () => setActiveFilters(tempFilters);

  return (
    <div style={{ display: 'flex', height: '90vh' }}>
      <div style={{ width: '320px', padding: '20px', overflowY: 'auto', background: '#f8f9fa', borderRight: '1px solid #ddd' }}>
        <h3 style={{ marginBottom: '20px', color: '#333' }}>Smart Search Filters</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Trip Purpose</label>
            <select name="tripType" onChange={handleType} value={tempFilters.tripType} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
              <option value="">Any Purpose</option>
              <option value="tourism">Tourism (Recommended)</option>
              <option value="wedding">Wedding</option>
              <option value="airport_transfer">Airport Transfer</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>City Location</label>
            <input name="city" placeholder="e.g., Dhaka" onChange={handleType} value={tempFilters.city} style={{ width: '100%', padding: '8px', marginTop: '5px' }} />
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Sort By</label>
            <select name="sort" onChange={handleType} value={tempFilters.sort} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {/* THE NEW SEARCH BUTTON */}
          <button onClick={executeSearch} style={{ width: '100%', padding: '12px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            Apply Filters & Search
          </button>
        </div>
        
        <hr />
        
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '10px' }}>Results ({vehicles.length})</h4>
          {vehicles.map(v => (
            <div key={v._id} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h5 style={{ margin: '0 0 5px 0', color: '#0056b3' }}>{v.make} {v.model}</h5>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}><strong>City:</strong> {v.location?.city}</p>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}><strong>Price:</strong> BDT {v.pricing?.dailyRate}/day</p>
              <button onClick={() => window.location.href=`/checkout/${v._id}`} style={{ width: '100%', padding: '8px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Book Now</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <MapContainer center={[23.8103, 90.4125]} zoom={7} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {vehicles.map(v => v.location?.coordinates?.lat ? (
            <Marker key={v._id} position={[v.location.coordinates.lat, v.location.coordinates.lng]}>
              <Popup>{v.make} {v.model} - BDT {v.pricing?.dailyRate}</Popup>
            </Marker>
          ) : null)}
        </MapContainer>
      </div>
    </div>
  );
};

export default AdvancedSearch;