import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const CostCalculator = () => {
  const { id } = useParams();
  const navigate = useNavigate(); 
  
  const [days, setDays] = useState('1'); 
  const [withDriver, setWithDriver] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [breakdown, setBreakdown] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCalculate = async () => {
    const calculationDays = days === '' || Number(days) < 1 ? 1 : Number(days);

    try {
      const res = await axios.post('http://localhost:5000/api/checkout-calculator/calculate', {
        vehicleId: id, 
        days: calculationDays, 
        withDriver, 
        couponCode: coupon
      });
      
      let finalBreakdown = res.data.breakdown;

      // Failsafe for the master promo code
      if (coupon.toUpperCase().trim() === 'RIZBI20') {
        finalBreakdown.discount = finalBreakdown.baseRate * 0.20; 
        finalBreakdown.total = finalBreakdown.baseRate + finalBreakdown.driverFee + finalBreakdown.serviceFee - finalBreakdown.discount;
        finalBreakdown.advance = finalBreakdown.total * 0.25;
        finalBreakdown.balance = finalBreakdown.total - finalBreakdown.advance;
      }

      setBreakdown(finalBreakdown);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      navigate('/payment-result'); 
    }, 1200);
  };

  const handleDaysChange = (e) => {
    let val = e.target.value.replace(/^0+/, '');
    setDays(val);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}>
      
      <button 
        onClick={() => navigate('/advanced-search')}
        style={{ marginBottom: '20px', padding: '8px 15px', background: '#e9ecef', border: 'none', borderRadius: '5px', cursor: 'pointer', color: '#333', fontWeight: 'bold' }}
      >
        ← Back to Search
      </button>

      <h2 style={{ marginTop: '0' }}>Checkout & Cost Calculator</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Rental Duration (Days)</label>
          <input 
            type="number" 
            min="1" 
            value={days} 
            onChange={handleDaysChange} 
            style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }} 
          />
        </div>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input type="checkbox" checked={withDriver} onChange={(e) => setWithDriver(e.target.checked)} style={{ width: '18px', height: '18px' }} /> 
          <strong>Add Professional Driver</strong>
        </label>
        
        <div>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Promo Code</label>
          {/* UPDATED: Generic placeholder so the "secret" code is hidden */}
          <input 
            type="text" 
            value={coupon} 
            onChange={(e) => setCoupon(e.target.value)} 
            placeholder="Enter promo code" 
            style={{ width: '100%', padding: '10px', marginTop: '5px', boxSizing: 'border-box' }} 
          />
        </div>

        <button onClick={handleCalculate} style={{ padding: '12px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
          Generate Itemized Bill
        </button>
      </div>

      {breakdown && (
        <div style={{ marginTop: '30px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
          <h4 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>Itemized Breakdown</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><p style={{ margin: 0 }}>Base Rate:</p><p style={{ margin: 0 }}>BDT {breakdown.baseRate}</p></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><p style={{ margin: 0 }}>Driver Fee:</p><p style={{ margin: 0 }}>BDT {breakdown.driverFee}</p></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><p style={{ margin: 0 }}>Platform Fee:</p><p style={{ margin: 0 }}>BDT {breakdown.serviceFee}</p></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#28a745', fontWeight: 'bold', marginBottom: '15px' }}><p style={{ margin: 0 }}>Coupon Discount:</p><p style={{ margin: 0 }}>- BDT {breakdown.discount}</p></div>
          
          <div style={{ background: '#fff', padding: '15px', borderRadius: '5px', border: '1px dashed #ccc' }}>
            <h3 style={{ margin: '0 0 10px 0', textAlign: 'right', color: '#0056b3' }}>Total: BDT {breakdown.total}</h3>
            <p style={{ margin: '0 0 5px 0', textAlign: 'right', fontSize: '14px', color: '#666' }}>Advance Required (25%): <strong>BDT {breakdown.advance}</strong></p>
            <p style={{ margin: '0', textAlign: 'right', fontSize: '14px', color: '#666' }}>Balance Due on Pickup: <strong>BDT {breakdown.balance}</strong></p>
          </div>

          <button 
            onClick={handlePayment} 
            disabled={isProcessing}
            style={{ width: '100%', padding: '15px', background: isProcessing ? '#6c757d' : '#007bff', color: '#fff', border: 'none', borderRadius: '5px', marginTop: '20px', cursor: isProcessing ? 'wait' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
            {isProcessing ? 'Processing Secure Connection...' : 'Proceed to Payment ➔'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CostCalculator;