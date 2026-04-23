import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';
import './DisputeManagement.css';

const DisputeManagement = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [adminResponse, setAdminResponse] = useState('');

  const fetchDisputes = useCallback(async () => {
    try {
      const url = statusFilter 
        ? `/admin/disputes?status=${statusFilter}`
        : '/admin/disputes';
      const response = await api.get(url);
      setDisputes(response.data);
    } catch (error) {
      toast.error('Failed to load disputes');
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const handleStatusUpdate = async (disputeId, newStatus) => {
    try {
      await api.put(`/admin/disputes/${disputeId}/status`, {
        status: newStatus,
        adminResponse: adminResponse || 'Status updated by admin'
      });
      toast.success('Dispute status updated successfully');
      setSelectedDispute(null);
      setAdminResponse('');
      fetchDisputes();
    } catch (error) {
      toast.error('Failed to update dispute status');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'OPEN':
        return 'status-open';
      case 'IN_REVIEW':
        return 'status-review';
      case 'RESOLVED':
        return 'status-resolved';
      case 'CLOSED':
        return 'status-closed';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="dispute-management">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dispute-management">
      <div className="dispute-header">
        <h2 className="section-title">Disputes & Complaints Management</h2>
        <div className="filter-controls">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="disputes-list">
        {disputes.map(dispute => (
          <div key={dispute.id} className="dispute-card">
            <div className="dispute-header-section">
              <div>
                <h3>{dispute.title}</h3>
                <p className="dispute-meta">
                  Reported by: {dispute.reporterName} ({dispute.reporterEmail})
                </p>
                {dispute.reportedUserName && (
                  <p className="dispute-meta">
                    Against: {dispute.reportedUserName}
                  </p>
                )}
              </div>
              <span className={`status-badge ${getStatusBadgeClass(dispute.status)}`}>
                {dispute.status.replace('_', ' ')}
              </span>
            </div>

            <div className="dispute-body">
              <p className="dispute-type">
                <strong>Type:</strong> {dispute.disputeType.replace('_', ' ')}
              </p>
              <p className="dispute-description">{dispute.description}</p>
              
              {dispute.orderId && (
                <p className="dispute-reference">
                  Related Order ID: {dispute.orderId}
                </p>
              )}
              
              {dispute.serviceRequestId && (
                <p className="dispute-reference">
                  Related Service Request ID: {dispute.serviceRequestId}
                </p>
              )}

              {dispute.adminResponse && (
                <div className="admin-response">
                  <strong>Admin Response:</strong>
                  <p>{dispute.adminResponse}</p>
                </div>
              )}

              <p className="dispute-date">
                Created: {new Date(dispute.createdAt).toLocaleString()}
              </p>
              {dispute.resolvedAt && (
                <p className="dispute-date">
                  Resolved: {new Date(dispute.resolvedAt).toLocaleString()}
                </p>
              )}
            </div>

            <div className="dispute-actions">
              {dispute.status === 'OPEN' && (
                <>
                  <button 
                    className="btn btn-review"
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setAdminResponse('');
                    }}
                  >
                    Review
                  </button>
                  <button 
                    className="btn btn-resolve"
                    onClick={() => handleStatusUpdate(dispute.id, 'RESOLVED')}
                  >
                    Mark Resolved
                  </button>
                </>
              )}
              {dispute.status === 'IN_REVIEW' && (
                <>
                  <button 
                    className="btn btn-resolve"
                    onClick={() => handleStatusUpdate(dispute.id, 'RESOLVED')}
                  >
                    Mark Resolved
                  </button>
                  <button 
                    className="btn btn-close"
                    onClick={() => handleStatusUpdate(dispute.id, 'CLOSED')}
                  >
                    Close
                  </button>
                </>
              )}
              {dispute.status === 'RESOLVED' && (
                <button 
                  className="btn btn-close"
                  onClick={() => handleStatusUpdate(dispute.id, 'CLOSED')}
                >
                  Close Dispute
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedDispute && (
        <div className="modal-overlay" onClick={() => setSelectedDispute(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Update Dispute Status</h3>
            <div className="form-group">
              <label>Admin Response (Optional)</label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Enter your response or notes..."
                rows="4"
                className="form-textarea"
              />
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleStatusUpdate(selectedDispute.id, 'IN_REVIEW')}
              >
                Mark as In Review
              </button>
              <button 
                className="btn btn-resolve"
                onClick={() => handleStatusUpdate(selectedDispute.id, 'RESOLVED')}
              >
                Mark as Resolved
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedDispute(null);
                  setAdminResponse('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {disputes.length === 0 && (
        <div className="empty-state">
          <p>No disputes found.</p>
        </div>
      )}
    </div>
  );
};

export default DisputeManagement;
