import React from 'react';
import './InfoPage.css';

const Contact = () => {
  return (
    <div className="info-page container">
      <h1>Contact</h1>
      <p>Need help with booking, payment, or account issues? Reach us through the channels below.</p>
      <section>
        <h2>Support Channels</h2>
        <ul>
          <li>Email: support@rentgo.bd</li>
          <li>Phone: +880 1700-000000</li>
          <li>Support Hours: 8:00 AM - 11:00 PM (Daily)</li>
        </ul>
      </section>
      <section>
        <h2>Office</h2>
        <p>RentGo Operations, Dhaka, Bangladesh</p>
      </section>
    </div>
  );
};

export default Contact;
