import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = user?.role === 'admin'
    ? '/dashboard/admin'
    : user?.role === 'vendor'
      ? '/dashboard/vendor'
      : '/dashboard/customer';

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
              <Link to="/vehicle-comparison">Compare Vendors</Link>
            </li>
            <li>
              <Link to="/route-packages">Route Packages</Link>
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
                {user?.role === 'vendor' && (
                  <>
                    <li>
                      <Link to="/vendor/route-packages">Route Offers</Link>
                    </li>
                    <li>
                      <Link to="/vendor/drivers">Drivers</Link>
                    </li>
                  </>
                )}
                <li>
                  <Link to={dashboardPath}>Dashboard</Link>
                </li>
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
