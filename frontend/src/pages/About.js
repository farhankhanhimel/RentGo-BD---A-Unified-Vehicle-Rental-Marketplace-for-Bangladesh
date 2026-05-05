import React from 'react';
import './InfoPage.css';

const About = () => {
  return (
    <div className="info-page container">
      <h1>About Us</h1>
      <p>
        RentGo is a unified vehicle rental marketplace built for Bangladesh. We connect riders with trusted
        vendors so every booking is transparent, safe, and easy to manage.
      </p>
      <section>
        <h2>Our Mission</h2>
        <p>
          Make daily mobility and travel booking simple for everyone, from customers planning short rides to
          businesses managing fleets.
        </p>
      </section>
      <section>
        <h2>What We Offer</h2>
        <ul>
          <li>Vehicle search across multiple vendors</li>
          <li>Fare estimation and route-aware booking flows</li>
          <li>Real-time notifications and dashboard management</li>
          <li>Vendor verification and admin moderation for trust</li>
        </ul>
      </section>
    </div>
  );
};

export default About;
