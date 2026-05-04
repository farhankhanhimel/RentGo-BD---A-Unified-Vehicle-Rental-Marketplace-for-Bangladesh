import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>RentGo</h3>
            <p>Your trusted rental services platform</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: info@rentgo.com</p>
            <p>Phone: +1 234 567 8900</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 RentGo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
