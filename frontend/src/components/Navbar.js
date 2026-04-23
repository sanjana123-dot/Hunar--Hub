import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import api from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = localStorage.getItem('token');
      if (!user || !token) {
        setUnreadNotifications(0);
        return;
      }
      try {
        const res = await api.get('/notifications/my/unread-count');
        const count = Number(res.data?.unreadCount || 0);
        if (!cancelled) setUnreadNotifications(Number.isFinite(count) ? count : 0);
      } catch {
        if (!cancelled) setUnreadNotifications(0);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleLogout = () => {
    logout();
    // Force a full reload so the latest landing-page styles are applied
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to={user ? "/home" : "/"} className="navbar-brand">HunarHub</Link>
        <div className="navbar-menu">
          {user ? (
            <>
              <Link to="/home">Home</Link>
              <Link to="/entrepreneurs">Browse Entrepreneurs</Link>
              {user.role === 'CUSTOMER' && (
                <>
                  <Link to="/orders/my">My Orders</Link>
                </>
              )}
              {user.role === 'ENTREPRENEUR' && (
                <Link to="/entrepreneur">Dashboard</Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin">Admin Panel</Link>
              )}
              <Link to="/profile?section=notifications" className="navbar-cart" title="Notifications">
                Notifications {unreadNotifications > 0 && <span className="cart-badge">{unreadNotifications}</span>}
              </Link>
              <Link to="/cart" className="navbar-cart">
                Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/profile" className="navbar-user">Hello, {user.name}</Link>
              <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <Link to="/admin/login" className="admin-link">Admin</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
