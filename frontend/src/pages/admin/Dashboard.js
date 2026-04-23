import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import PendingEntrepreneurs from './PendingEntrepreneurs';
import Entrepreneurs from './Entrepreneurs';
import Users from './Users';
import AllOrders from './AllOrders';
import AllRequests from './AllRequests';
import CategoryManagement from './CategoryManagement';
import DisputeManagement from './DisputeManagement';
import Analytics from './Analytics';
import './Dashboard.css';

const Dashboard = () => {
  const location = useLocation();

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">Manage platform operations and monitor activity</p>
      </div>
      <div className="dashboard-layout">
        <nav className="dashboard-nav">
          <Link 
            to="/admin/users" 
            className={location.pathname.includes('/users') ? 'active' : ''}
          >
            <span className="nav-icon" />
            Users
          </Link>
          <Link 
            to="/admin/analytics" 
            className={location.pathname.includes('/analytics') ? 'active' : ''}
          >
            <span className="nav-icon" />
            Analytics & Reports
          </Link>
          <Link 
            to="/admin/entrepreneurs" 
            className={location.pathname.includes('/entrepreneurs') ? 'active' : ''}
          >
            <span className="nav-icon" />
            Entrepreneurs
          </Link>
          <Link 
            to="/admin/categories" 
            className={location.pathname.includes('/categories') ? 'active' : ''}
          >
            <span className="nav-icon" />
            Categories
          </Link>
          <Link 
            to="/admin/orders" 
            className={location.pathname.includes('/orders') ? 'active' : ''}
          >
            <span className="nav-icon" />
            Orders
          </Link>
          <Link 
            to="/admin/requests" 
            className={location.pathname.includes('/requests') ? 'active' : ''}
          >
            <span className="nav-icon" />
            Service Requests
          </Link>
          <Link 
            to="/admin/disputes" 
            className={location.pathname.includes('/disputes') ? 'active' : ''}
          >
            <span className="nav-icon" />
            Disputes & Complaints
          </Link>
        </nav>
        <div className="dashboard-content">
          <Routes>
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/users" element={<Users />} />
            <Route path="/entrepreneurs" element={<Entrepreneurs />} />
            <Route path="/entrepreneurs/pending" element={<PendingEntrepreneurs />} />
            <Route path="/categories" element={<CategoryManagement />} />
            <Route path="/orders" element={<AllOrders />} />
            <Route path="/requests" element={<AllRequests />} />
            <Route path="/disputes" element={<DisputeManagement />} />
            <Route path="/" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
