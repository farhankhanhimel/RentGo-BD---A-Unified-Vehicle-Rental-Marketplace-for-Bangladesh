import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VendorCompare = () => {
  const [allVehicles, setAllVehicles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);

  useEffect(() => {
    // Fetch all vehicles to populate the dropdown
    axios.get('http://localhost:5000/api/advanced-search').then(res => setAllVehicles(res.data.data));
  }, []);

  useEffect(() => {
    // Fetch the specific details for the selected vehicles
    if (selectedIds.length > 0) {
      axios.post('http://localhost:5000/api/vendor-compare', { ids: selectedIds })
        .then(res => setComparisonData(res.data.data));
    } else {
      setComparisonData([]);
    }
  }, [selectedIds]);

  const addVehicle = (id) => {
    if (!selectedIds.includes(id) && selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const removeVehicle = (idToRemove) => {
    setSelectedIds(selectedIds.filter(id => id !== idToRemove));
  };

  // NEW: Function to clear all selections at once
  const removeAllVehicles = () => {
    setSelectedIds([]);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* THE BLUE BANNER */}
      <div style={{ background: 'linear-gradient(to right, #003b8e, #0066cc)', color: 'white', padding: '30px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Multi-Vendor Vehicle Comparison</h1>
        <p style={{ margin: 0, fontSize: '16px', opacity: '0.9' }}>Pick a route, fetch live offers, and compare up to four vendors side by side.</p>
      </div>

      {/* THE ADD SELECTOR & CLEAR ALL BUTTON */}
      <div style={{ marginBottom: '30px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <label style={{ fontWeight: 'bold' }}>Add Vehicle to Compare:</label>
        
        <select 
          onChange={(e) => addVehicle(e.target.value)} 
          value="" 
          style={{ padding: '10px', width: '350px', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value="" disabled>+ Select a vehicle (Max 4)</option>
          {allVehicles.map(v => (
            <option key={v._id} value={v._id} disabled={selectedIds.includes(v._id)}>
              {v.make} {v.model} - {v.location?.city} (BDT {v.pricing?.dailyRate})
            </option>
          ))}
        </select>
        
        <span style={{ color: '#666', fontWeight: '500' }}>{selectedIds.length} / 4 Selected</span>

        {/* THE NEW CLEAR ALL BUTTON */}
        {selectedIds.length > 0 && (
          <button 
            onClick={removeAllVehicles} 
            style={{ marginLeft: 'auto', padding: '10px 20px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Clear All 🗑️
          </button>
        )}
      </div>
      
      {/* THE COMPARISON CARDS */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {comparisonData.length === 0 && (
          <div style={{ width: '100%', textAlign: 'center', padding: '50px', color: '#666', background: '#f8f9fa', borderRadius: '8px' }}>
            No vehicles selected yet. Use the dropdown above to start comparing!
          </div>
        )}

        {comparisonData.map(v => (
          <div key={v._id} style={{ border: '2px solid #0066cc', padding: '20px', flex: '1 1 250px', borderRadius: '10px', background: '#fff', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            
            <h3 style={{ margin: '0 0 15px 0', color: '#003b8e' }}>{v.make} {v.model}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
              <div style={{ background: '#e9ecef', padding: '8px', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Vendor</span>
                <strong>{v.vendor?.name || 'Verified Partner'} ✓</strong>
              </div>
              
              <div style={{ background: '#e9ecef', padding: '8px', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Daily Rate</span>
                <strong style={{ color: '#28a745' }}>BDT {v.pricing?.dailyRate}</strong>
              </div>

              <div style={{ background: '#e9ecef', padding: '8px', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Location</span>
                <strong>{v.location?.city}</strong>
              </div>

              <div style={{ background: '#e9ecef', padding: '8px', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: '#666', display: 'block' }}>Specifications</span>
                <strong>{v.features?.seats} Seats • {v.features?.ac ? 'AC' : 'Non-AC'} • {v.features?.transmission}</strong>
              </div>
            </div>

            <button 
              onClick={() => removeVehicle(v._id)} 
              style={{ width: '100%', padding: '10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Remove ❌
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorCompare;