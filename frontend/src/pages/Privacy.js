import React from 'react';
import './InfoPage.css';

const Privacy = () => {
  return (
    <div className="info-page container">
      <h1>Privacy Policy</h1>
      <p>
        We collect only the information needed to provide booking, payment, and account services securely.
      </p>
      <section>
        <h2>Data We Use</h2>
        <ul>
          <li>Profile data (name, phone, email)</li>
          <li>Booking and trip records</li>
          <li>Payment and transaction metadata</li>
        </ul>
      </section>
      <section>
        <h2>How We Protect It</h2>
        <p>
          We apply access controls, secure APIs, and account authentication safeguards to protect customer
          and vendor data.
        </p>
      </section>
      <section>
        <h2>Your Control</h2>
        <p>
          You can request profile updates and account-related actions through the dashboard and support channels.
        </p>
      </section>
    </div>
  );
};

export default Privacy;
