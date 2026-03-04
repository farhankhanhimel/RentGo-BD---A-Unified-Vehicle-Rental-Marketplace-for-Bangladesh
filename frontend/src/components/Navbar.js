import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="logo">
            RentGo
          </Link>
          <ul className="nav-links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/fare-estimator">Fare Estimator</Link>
            </li>
            <li>
              <Link to="/event-packages">Events</Link>
            </li>

            {isAuthenticated ? (
              <>
                {user?.role === 'customer' && (
                  <li>
                    <Link to="/wishlist">Wishlist</Link>
                  </li>
                )}
                <li>
                  <NotificationBell />
                </li>
                <li>
                  <Link to="/profile">Profile</Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register" className="btn btn-primary">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
