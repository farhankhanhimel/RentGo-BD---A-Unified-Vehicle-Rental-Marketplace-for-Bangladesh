import React from 'react';
import './InfoPage.css';

const Terms = () => {
  return (
    <div className="info-page container">
      <h1>Terms of Service</h1>
      <p>These terms govern your use of RentGo services and booking platform.</p>
      <section>
        <h2>Usage</h2>
        <p>
          Users must provide accurate information during registration and booking. Misuse, fraud attempts,
          or abusive behavior can lead to account suspension.
        </p>
      </section>
      <section>
        <h2>Bookings & Payments</h2>
        <p>
          Booking availability, fare, cancellation rules, and payment terms may vary by vehicle and vendor.
          By confirming a booking, you agree to the listed policy for that trip.
        </p>
      </section>
      <section>
        <h2>Liability</h2>
        <p>
          RentGo acts as a platform connecting users and vendors. Operational responsibilities for service
          delivery remain with the listed vendor, subject to applicable law.
        </p>
      </section>
    </div>
  );
};

export default Terms;
