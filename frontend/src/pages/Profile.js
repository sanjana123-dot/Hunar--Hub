import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api, { resolveMediaUrl } from '../services/api';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profile, setProfile] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: '',
    experience: '',
    description: '',
    businessCategory: '',
    shopName: '',
    ownerName: '',
    shopAddress: '',
    shopPhone: '',
    shopEmail: '',
    shopExperience: '',
    shopDescription: '',
  });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersTab, setOrdersTab] = useState('placed');
  const [cancellingId, setCancellingId] = useState(null);
  const [serviceRequestsSent, setServiceRequestsSent] = useState([]);
  const [serviceRequestsReceived, setServiceRequestsReceived] = useState([]);
  const [serviceRequestsLoading, setServiceRequestsLoading] = useState(false);
  const [serviceRequestsTab, setServiceRequestsTab] = useState('received');
  const [disputes, setDisputes] = useState([]);
  const [disputesAgainstMe, setDisputesAgainstMe] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [creatingDispute, setCreatingDispute] = useState(false);
  const [disputeHistoryTab, setDisputeHistoryTab] = useState('raised');
  const [disputeForm, setDisputeForm] = useState({
    disputeType: 'ORDER_ISSUE',
    title: '',
    description: '',
    orderId: '',
    serviceRequestId: '',
    reportedUserIdentifier: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section === 'notifications') {
      setActiveSection('notifications');
    }
  }, [location.search]);

  useEffect(() => {
    if (activeSection === 'orders' && (user?.role === 'CUSTOMER' || user?.role === 'ENTREPRENEUR')) {
      fetchOrders();
    }
  }, [activeSection, user?.role]);

  useEffect(() => {
    if (activeSection === 'services' && (user?.role === 'CUSTOMER' || user?.role === 'ENTREPRENEUR')) {
      setServiceRequestsTab(user?.role === 'CUSTOMER' ? 'sent' : 'received');
      fetchServiceRequests();
    }
  }, [activeSection, user?.role]);

  useEffect(() => {
    if (activeSection === 'disputes') {
      fetchMyDisputes();
      fetchDisputesAgainstMe();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'notifications') {
      fetchNotifications();
    }
  }, [activeSection]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders/my');
    const list = res.data?.content ?? (Array.isArray(res.data) ? res.data : []);
    // Newest orders first
    list.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await api.put(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const ordersPlaced = orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'RETURN_REQUESTED');
  const ordersCancelled = orders.filter(o => o.status === 'CANCELLED');
  const ordersReturn = orders.filter(o => o.status === 'RETURN_REQUESTED');

  const handleOrderClick = (order) => {
    if (order.productId) {
      navigate(`/products/${order.productId}`, { state: { order } });
    }
  };

  const fetchServiceRequests = async () => {
    setServiceRequestsLoading(true);
    try {
      const [sentRes, receivedRes] = await Promise.allSettled([
        api.get('/requests/my'),
        api.get('/entrepreneur/requests'),
      ]);

      const sentList = sentRes.status === 'fulfilled'
        ? (sentRes.value.data?.content ?? (Array.isArray(sentRes.value.data) ? sentRes.value.data : []))
        : [];
      const receivedList = receivedRes.status === 'fulfilled'
        ? (receivedRes.value.data?.content ?? (Array.isArray(receivedRes.value.data) ? receivedRes.value.data : []))
        : [];

      sentList.sort((a, b) => new Date(b.requestedDate || 0) - new Date(a.requestedDate || 0));
      receivedList.sort((a, b) => new Date(b.requestedDate || 0) - new Date(a.requestedDate || 0));

      setServiceRequestsSent(sentList);
      setServiceRequestsReceived(receivedList);
    } catch {
      setServiceRequestsSent([]);
      setServiceRequestsReceived([]);
    } finally {
      setServiceRequestsLoading(false);
    }
  };

  const fetchMyDisputes = async () => {
    try {
      const res = await api.get('/disputes/my');
      const list = Array.isArray(res.data) ? res.data : [];
      setDisputes(list);
    } catch {
      setDisputes([]);
    }
  };

  const fetchDisputesAgainstMe = async () => {
    try {
      const res = await api.get('/disputes/against-me');
      const list = Array.isArray(res.data) ? res.data : [];
      setDisputesAgainstMe(list);
    } catch {
      setDisputesAgainstMe([]);
    }
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const res = await api.get('/notifications/my');
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(list);
      const unread = list.filter((n) => !n.read);
      await Promise.all(unread.map((n) => api.put(`/notifications/${n.id}/read`)));
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const formatNotificationType = (type) => {
    if (!type || type === 'GENERAL') return '';
    const labels = {
      COMPLAINT_RAISED: 'Complaint',
      COMPLAINT_RESOLVED: 'Complaint',
      ORDER_PLACED: 'Order',
      NEW_PRODUCT: 'Listing',
      ENTREPRENEUR_PENDING: 'Approvals',
      ENTREPRENEUR_APPROVED: 'Account',
      ENTREPRENEUR_REJECTED: 'Account',
    };
    return labels[type] || type.replace(/_/g, ' ');
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    setCreatingDispute(true);
    try {
      const payload = {
        disputeType: disputeForm.disputeType,
        title: disputeForm.title,
        description: disputeForm.description,
        reportedUserIdentifier: disputeForm.reportedUserIdentifier,
      };
      if (disputeForm.orderId) payload.orderId = Number(disputeForm.orderId);
      if (disputeForm.serviceRequestId) payload.serviceRequestId = Number(disputeForm.serviceRequestId);
      await api.post('/disputes', payload);
      toast.success('Complaint submitted successfully');
      setDisputeForm({
        disputeType: 'ORDER_ISSUE',
        title: '',
        description: '',
        orderId: '',
        serviceRequestId: '',
        reportedUserIdentifier: '',
      });
      fetchMyDisputes();
      fetchDisputesAgainstMe();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setCreatingDispute(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        skills: response.data.skills || '',
        experience: response.data.experience || '',
        description: response.data.description || '',
        businessCategory: response.data.businessCategory || '',
        shopName: response.data.shopName || '',
        ownerName: response.data.ownerName || '',
        shopAddress: response.data.shopAddress || '',
        shopPhone: response.data.shopPhone || '',
        shopEmail: response.data.shopEmail || '',
        shopExperience: response.data.shopExperience || '',
        shopDescription: response.data.shopDescription || '',
      });
    } catch (error) {
      toast.error('Failed to load profile');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/profile', formData);
      await fetchProfile();
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/profile');
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete account');
      console.error('Error deleting account:', error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await api.put('/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const msg = error.response?.data?.message
        || error.response?.data?.error
        || Object.values(error.response?.data || {}).find(v => typeof v === 'string')
        || 'Failed to change password';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post('/profile/photo', fd, { headers: { 'Content-Type': undefined } });
      await fetchProfile();
      toast.success('Profile photo updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload profile photo');
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error-state">
          <p>Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Link to="/" className="back-link">
        <span className="back-arrow">←</span> Back to Home
      </Link>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`sidebar-item ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              <span className="sidebar-icon">○</span>
              Profile
            </button>
            {(user?.role === 'CUSTOMER' || user?.role === 'ENTREPRENEUR') && (
              <button
                className={`sidebar-item ${activeSection === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveSection('orders')}
              >
                <span className="sidebar-icon">◇</span>
                My Orders
              </button>
            )}
            {(user?.role === 'CUSTOMER' || user?.role === 'ENTREPRENEUR') && (
              <button
                className={`sidebar-item ${activeSection === 'services' ? 'active' : ''}`}
                onClick={() => setActiveSection('services')}
              >
                <span className="sidebar-icon">▣</span>
                Service requests
              </button>
            )}
            <button
              className={`sidebar-item ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveSection('notifications')}
            >
              <span className="sidebar-icon">●</span>
              Notifications
            </button>
            <button
              className={`sidebar-item ${activeSection === 'disputes' ? 'active' : ''}`}
              onClick={() => setActiveSection('disputes')}
            >
              <span className="sidebar-icon">!</span>
              Complaints & disputes
            </button>
            <button
              className={`sidebar-item ${activeSection === 'password' ? 'active' : ''}`}
              onClick={() => setActiveSection('password')}
            >
              <span className="sidebar-icon">◆</span>
              Update password
            </button>
          </nav>
        </aside>

        <main className="profile-main">
          <h1 className="profile-page-title">Account</h1>
          <p className="profile-page-subtitle">
            {activeSection === 'overview' && 'Profile details'}
            {activeSection === 'password' && 'Update password'}
            {activeSection === 'orders' && 'My Orders'}
            {activeSection === 'services' && 'Service requests'}
            {activeSection === 'notifications' && 'Notifications'}
            {activeSection === 'disputes' && 'Complaints & disputes'}
          </p>

          {activeSection === 'overview' && (
            <>
              <div className="profile-details-card">
                <div className="profile-details-header">
                  {profile.profilePhoto ? (
                    <img
                      src={resolveMediaUrl(profile.profilePhoto)}
                      alt="Profile"
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar-placeholder" />
                  )}
                  <div className="profile-details-info">
                    <span className="member-badge">
                      Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                    </span>
                    <h2 className="profile-name">{profile.name}</h2>
                    <p className="profile-email">{profile.email}</p>
                    <div className="profile-badges">
                      <span className="role-badge">{profile.role}</span>
                      {profile.role === 'ENTREPRENEUR' && profile.approvalStatus && (
                        <span className={`status-badge status-${profile.approvalStatus.toLowerCase()}`}>
                          {profile.approvalStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {editing ? (
                  <form onSubmit={handleSubmit} className="profile-edit-form">
                    <div className="form-row">
                      <label>Photo</label>
                      <label className="photo-upload-label">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => { const f = e.target.files[0]; if (f) handlePhotoUpload(f); }}
                          style={{ display: 'none' }}
                        />
                        <span className="upload-link">{profile.profilePhoto ? 'Change photo' : 'Upload photo'}</span>
                      </label>
                    </div>
                    <div className="form-row">
                      <label>Full Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                      <label>Email</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    {profile.role === 'ENTREPRENEUR' && (
                      <>
                        <div className="form-row">
                          <label>Business category</label>
                          <input
                            type="text"
                            name="businessCategory"
                            value={formData.businessCategory}
                            onChange={handleChange}
                            placeholder="e.g., Cobbler, Tailor"
                          />
                        </div>
                        <div className="form-row">
                          <label>Skills & Expertise</label>
                          <textarea name="skills" value={formData.skills} onChange={handleChange} rows="2" />
                        </div>
                        <div className="form-row">
                          <label>Experience</label>
                          <textarea name="experience" value={formData.experience} onChange={handleChange} rows="2" />
                        </div>
                        <div className="form-row">
                          <label>About You</label>
                          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" />
                        </div>
                        <div className="form-row">
                          <label>Shop name</label>
                          <input
                            type="text"
                            name="shopName"
                            value={formData.shopName}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="form-row">
                          <label>Owner’s name</label>
                          <input
                            type="text"
                            name="ownerName"
                            value={formData.ownerName}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="form-row">
                          <label>Location / address</label>
                          <textarea
                            name="shopAddress"
                            value={formData.shopAddress}
                            onChange={handleChange}
                            rows="2"
                          />
                        </div>
                        <div className="form-row">
                          <label>Phone number / WhatsApp</label>
                          <input
                            type="text"
                            name="shopPhone"
                            value={formData.shopPhone}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="form-row">
                          <label>Shop email (optional)</label>
                          <input
                            type="email"
                            name="shopEmail"
                            value={formData.shopEmail}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="form-row">
                          <label>Years of experience</label>
                          <input
                            type="text"
                            name="shopExperience"
                            value={formData.shopExperience}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="form-row">
                          <label>Short description about the shop</label>
                          <textarea
                            name="shopDescription"
                            value={formData.shopDescription}
                            onChange={handleChange}
                            rows="3"
                          />
                        </div>
                      </>
                    )}
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">Save changes</button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); fetchProfile(); }}>Cancel</button>
                    </div>
                  </form>
                ) : null}
              </div>

              <div className="quick-links-card">
                <h3 className="quick-links-title">Quick links</h3>
                <button className="quick-link" onClick={() => setEditing(true)}>
                  <span className="quick-link-icon">✎</span>
                  <span className="quick-link-text">Edit profile</span>
                  <span className="quick-link-chevron">›</span>
                </button>
                <button className="quick-link" onClick={() => setActiveSection('password')}>
                  <span className="quick-link-icon">◈</span>
                  <span className="quick-link-text">Update password</span>
                  <span className="quick-link-chevron">›</span>
                </button>
                {!showDeleteConfirm ? (
                  <button className="quick-link quick-link-danger" onClick={() => setShowDeleteConfirm(true)}>
                    <span className="quick-link-icon">!</span>
                    <span className="quick-link-text">Permanently delete my account</span>
                    <span className="quick-link-chevron">›</span>
                  </button>
                ) : (
                  <div className="delete-confirm-inline">
                    <p>Are you sure? This action cannot be undone.</p>
                    <div className="delete-actions">
                      <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Yes, delete my account'}
                      </button>
                      <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeSection === 'orders' && (user?.role === 'CUSTOMER' || user?.role === 'ENTREPRENEUR') && (
            <div className="profile-orders-card">
              <div className="orders-tabs">
                <button
                  className={`orders-tab ${ordersTab === 'placed' ? 'active' : ''}`}
                  onClick={() => setOrdersTab('placed')}
                >
                  Orders placed
                </button>
                <button
                  className={`orders-tab ${ordersTab === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setOrdersTab('cancelled')}
                >
                  Orders cancelled
                </button>
                <button
                  className={`orders-tab ${ordersTab === 'return' ? 'active' : ''}`}
                  onClick={() => setOrdersTab('return')}
                >
                  Return/Exchange
                </button>
              </div>
              {ordersLoading ? (
                <p className="orders-loading">Loading orders...</p>
              ) : (
                <>
                  {ordersTab === 'placed' && (
                    <div className="orders-list">
                      {ordersPlaced.length === 0 ? (
                        <p className="orders-empty">No orders placed yet.</p>
                      ) : (
                        ordersPlaced.map(order => (
                          <div
                            key={order.id}
                            className="order-row"
                            onClick={() => handleOrderClick(order)}
                          >
                            <div className="order-info">
                              <strong>{order.productName}</strong>
                              <span>Qty: {order.quantity} · ₹{order.totalPrice} · {new Date(order.orderDate).toLocaleString()}</span>
                              <span className={`order-status order-status-${order.status?.toLowerCase()}`}>{order.status}</span>
                            </div>
                            {(order.status === 'PLACED' || order.status === 'CONFIRMED') && (
                              <button
                                type="button"
                                className="btn-cancel-order"
                                onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                                disabled={cancellingId === order.id}
                              >
                                {cancellingId === order.id ? 'Cancelling...' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {ordersTab === 'cancelled' && (
                    <div className="orders-list">
                      {ordersCancelled.length === 0 ? (
                        <p className="orders-empty">No cancelled orders.</p>
                      ) : (
                        ordersCancelled.map(order => (
                          <div
                            key={order.id}
                            className="order-row"
                            onClick={() => handleOrderClick(order)}
                          >
                            <div className="order-info">
                              <strong>{order.productName}</strong>
                              <span>Qty: {order.quantity} · ₹{order.totalPrice} · {new Date(order.orderDate).toLocaleString()}</span>
                              <span className="order-status order-status-cancelled">Cancelled</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {ordersTab === 'return' && (
                    <div className="orders-list">
                      {ordersReturn.length === 0 ? (
                        <p className="orders-empty">No return or exchange requests.</p>
                      ) : (
                        ordersReturn.map(order => (
                          <div
                            key={order.id}
                            className="order-row"
                            onClick={() => handleOrderClick(order)}
                          >
                            <div className="order-info">
                              <strong>{order.productName}</strong>
                              <span>Qty: {order.quantity} · ₹{order.totalPrice} · Return requested</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeSection === 'services' && (user?.role === 'CUSTOMER' || user?.role === 'ENTREPRENEUR') && (
            <div className="profile-orders-card">
              <div className="orders-tabs">
                <button
                  className={`orders-tab ${serviceRequestsTab === 'received' ? 'active' : ''}`}
                  onClick={() => setServiceRequestsTab('received')}
                  type="button"
                >
                  Received
                </button>
                <button
                  className={`orders-tab ${serviceRequestsTab === 'sent' ? 'active' : ''}`}
                  onClick={() => setServiceRequestsTab('sent')}
                  type="button"
                >
                  Sent
                </button>
              </div>
              {serviceRequestsLoading ? (
                <p className="orders-loading">Loading service requests...</p>
              ) : (serviceRequestsTab === 'received' ? serviceRequestsReceived : serviceRequestsSent).length === 0 ? (
                <p className="orders-empty">
                  {serviceRequestsTab === 'received'
                    ? 'No service requests received yet.'
                    : 'No service requests sent yet.'}
                </p>
              ) : (
                <div className="services-table-wrap">
                  <table className="services-table">
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>{serviceRequestsTab === 'received' ? 'Sent By' : 'Received By'}</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Requested On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(serviceRequestsTab === 'received' ? serviceRequestsReceived : serviceRequestsSent).map((request) => (
                        <tr key={request.id}>
                          <td>#{request.id}</td>
                          <td>
                            {serviceRequestsTab === 'received'
                              ? (request.customerName || '—')
                              : (request.entrepreneurName || '—')}
                          </td>
                          <td className="service-description-cell">{request.serviceDescription || '—'}</td>
                          <td>
                            <span className={`order-status order-status-${String(request.status || '').toLowerCase()}`}>
                              {request.status || '—'}
                            </span>
                          </td>
                          <td>
                            {request.requestedDate ? new Date(request.requestedDate).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === 'password' && (
            <div className="password-card">
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-row">
                  <label>Current password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter your current password"
                    required
                  />
                </div>
                <div className="form-row">
                  <label>New password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-row">
                  <label>Confirm new password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  {changingPassword ? 'Changing...' : 'Update password'}
                </button>
              </form>
            </div>
          )}

          {activeSection === 'disputes' && (
            <div className="profile-disputes-card">
              <div className="dispute-form-section">
                <h3>Raise a complaint</h3>
                <p className="dispute-help">
                  If you faced an issue with an order, service request, payment, or behavior, raise a dispute here.
                </p>
                <form onSubmit={handleDisputeSubmit} className="dispute-form">
                  <div className="form-row">
                    <label>Type of issue</label>
                    <select
                      value={disputeForm.disputeType}
                      onChange={(e) => setDisputeForm({ ...disputeForm, disputeType: e.target.value })}
                    >
                      <option value="ORDER_ISSUE">Order issue</option>
                      <option value="SERVICE_ISSUE">Service issue</option>
                      <option value="PAYMENT_ISSUE">Payment issue</option>
                      <option value="BEHAVIOR_ISSUE">Behavior issue</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Title</label>
                    <input
                      type="text"
                      value={disputeForm.title}
                      onChange={(e) => setDisputeForm({ ...disputeForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Details</label>
                    <textarea
                      rows="4"
                      value={disputeForm.description}
                      onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label>Related order ID (optional)</label>
                    <input
                      type="number"
                      value={disputeForm.orderId}
                      onChange={(e) => setDisputeForm({ ...disputeForm, orderId: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label>Related service request ID (optional)</label>
                    <input
                      type="number"
                      value={disputeForm.serviceRequestId}
                      onChange={(e) => setDisputeForm({ ...disputeForm, serviceRequestId: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label>Reported user email / username</label>
                    <input
                      type="text"
                      value={disputeForm.reportedUserIdentifier}
                      onChange={(e) => setDisputeForm({ ...disputeForm, reportedUserIdentifier: e.target.value })}
                      placeholder="Enter email or username"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingDispute}
                  >
                    {creatingDispute ? 'Submitting...' : 'Submit complaint'}
                  </button>
                </form>
              </div>

              <div className="dispute-history-section">
                <div className="orders-tabs" style={{ marginBottom: 12 }}>
                  <button
                    className={`orders-tab ${disputeHistoryTab === 'raised' ? 'active' : ''}`}
                    onClick={() => setDisputeHistoryTab('raised')}
                    type="button"
                  >
                    Raised by you
                  </button>
                  <button
                    className={`orders-tab ${disputeHistoryTab === 'against' ? 'active' : ''}`}
                    onClick={() => setDisputeHistoryTab('against')}
                    type="button"
                  >
                    Against you
                  </button>
                </div>

                {disputeHistoryTab === 'raised' && (
                  <>
                    <h3>Your previous complaints</h3>
                    {disputes.length === 0 ? (
                      <p className="orders-empty">You have not raised any disputes yet.</p>
                    ) : (
                      <div className="disputes-list">
                        {disputes.map(d => (
                          <div key={d.id} className="dispute-row">
                            <div className="dispute-info">
                              <strong>{d.title}</strong>
                              <span className="dispute-meta">
                                {new Date(d.createdAt).toLocaleString()} · {d.disputeType.replace('_', ' ')}
                              </span>
                              <span className={`order-status order-status-${d.status.toLowerCase()}`}>
                                {d.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {disputeHistoryTab === 'against' && (
                  <>
                    <h3>Complaints raised against you</h3>
                    {disputesAgainstMe.length === 0 ? (
                      <p className="orders-empty">No complaints have been raised against you.</p>
                    ) : (
                      <div className="disputes-list">
                        {disputesAgainstMe.map(d => (
                          <div key={d.id} className="dispute-row">
                            <div className="dispute-info">
                              <strong>{d.title}</strong>
                              <span className="dispute-meta">
                                By {d.reporterName} · {new Date(d.createdAt).toLocaleString()} · {d.disputeType.replace('_', ' ')}
                              </span>
                              <span className={`order-status order-status-${d.status.toLowerCase()}`}>
                                {d.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="password-card notifications-panel" style={{ maxWidth: '100%' }}>
              {notificationsLoading ? (
                <p className="orders-loading">Loading notifications...</p>
              ) : notifications.length === 0 ? (
                <p className="orders-empty">No notifications yet.</p>
              ) : (
                <div className="disputes-list notification-list">
                  {notifications.map((n) => (
                    <div key={n.id} className="dispute-row notification-item">
                      <div className="dispute-info">
                        {n.notificationType && (
                          <span className="notification-type">{formatNotificationType(n.notificationType)}</span>
                        )}
                        <strong>{n.title}</strong>
                        <span className="dispute-meta">{n.message}</span>
                        <span className="dispute-meta">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;
