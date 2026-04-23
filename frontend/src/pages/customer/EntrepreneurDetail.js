import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import api, { resolveMediaUrl } from '../../services/api';
import { toast } from 'react-toastify';
import './EntrepreneurDetail.css';

const EntrepreneurDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [entrepreneur, setEntrepreneur] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [serviceDescription, setServiceDescription] = useState('');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isCustomer = currentUser?.role === 'CUSTOMER';
  const isCobbler = (entrepreneur?.businessCategory || '').toLowerCase().includes('cobbler');

  const fetchEntrepreneur = useCallback(async () => {
    try {
      const response = await api.get(`/entrepreneurs/${id}`);
      setEntrepreneur(response.data);
    } catch (error) {
      console.error('Error fetching entrepreneur:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get(`/entrepreneurs/${id}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [id]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await api.get(`/entrepreneurs/${id}/reviews`);
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  }, [id]);

  useEffect(() => {
    fetchEntrepreneur();
    fetchProducts();
    fetchReviews();
  }, [fetchEntrepreneur, fetchProducts, fetchReviews]);

  const handleServiceRequest = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/requests', {
        entrepreneurId: parseInt(id),
        serviceDescription
      });
      toast.success('Service request submitted successfully!');
      setShowServiceForm(false);
      setServiceDescription('');
      navigate('/profile');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit request';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleOrder = async (productId, quantity) => {
    try {
      await api.post('/orders', {
        productId,
        quantity: parseInt(quantity)
      });
      toast.success('Order placed successfully!');
      navigate('/orders/my');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    try {
      await api.post('/reviews', {
        entrepreneurId: parseInt(id, 10),
        rating: parseInt(rating, 10),
        comment: reviewComment,
      });
      toast.success('Review submitted successfully!');
      setReviewComment('');
      setRating(5);
      fetchReviews();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit review';
      setReviewError(errorMsg);
      toast.error(errorMsg);
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (!entrepreneur) return <div className="container">Entrepreneur not found</div>;

  return (
    <div className="container">
      <div className="entrepreneur-detail">
        <div className="card">
          <h1>{entrepreneur.name}</h1>
          {entrepreneur.businessCategory && (
            <p><strong>Category:</strong> {entrepreneur.businessCategory}</p>
          )}
          <p><strong>Email:</strong> {entrepreneur.email}</p>
          <p><strong>Skills:</strong> {entrepreneur.skills || 'N/A'}</p>
          <p><strong>Experience:</strong> {entrepreneur.experience || 'N/A'}</p>
          {entrepreneur.shopName && (
            <p><strong>Shop name:</strong> {entrepreneur.shopName}</p>
          )}
          {entrepreneur.ownerName && (
            <p><strong>Owner’s name:</strong> {entrepreneur.ownerName}</p>
          )}
          {entrepreneur.shopAddress && (
            <p><strong>Location:</strong> {entrepreneur.shopAddress}</p>
          )}
          {entrepreneur.shopPhone && (
            <p><strong>Phone / WhatsApp:</strong> {entrepreneur.shopPhone}</p>
          )}
          {entrepreneur.shopEmail && (
            <p><strong>Shop email:</strong> {entrepreneur.shopEmail}</p>
          )}
          {entrepreneur.shopExperience && (
            <p><strong>Shop experience:</strong> {entrepreneur.shopExperience}</p>
          )}
          <p><strong>Description:</strong> {entrepreneur.shopDescription || entrepreneur.description || 'No description'}</p>
          <p><strong>Total Earnings:</strong> ₹{entrepreneur.earnings || 0}</p>
          
          <button 
            onClick={() => setShowServiceForm(!showServiceForm)} 
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
          >
            Request Service
          </button>

          {showServiceForm && (
            <form onSubmit={handleServiceRequest} style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label>Service Description</label>
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  required
                  placeholder="Describe the service you need..."
                />
              </div>
              {error && <div className="error">{error}</div>}
              <button type="submit" className="btn btn-success">Submit Request</button>
            </form>
          )}
        </div>

        <div className="products-section">
          <h2>{isCobbler ? 'Services' : 'Products'}</h2>
          <div className="grid">
            {products.map(product => (
              <div key={product.id} className="card">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p><strong>Price:</strong> ₹{product.price}</p>
                {product.imageUrl && (
                  <img src={resolveMediaUrl(product.imageUrl)} alt={product.name} style={{ maxWidth: '100%', height: 'auto' }} />
                )}
                {product.available ? (
                  isCobbler ? (
                    <div style={{ marginTop: '15px' }}>
                      <button
                        onClick={() => {
                          setServiceDescription(`Service needed: ${product.name}`);
                          setShowServiceForm(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="btn btn-primary"
                      >
                        Book Service
                      </button>
                    </div>
                  ) : (
                  <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="number"
                      id={`qty-${product.id}`}
                      min="1"
                      defaultValue="1"
                      style={{ width: '60px', padding: '5px' }}
                    />
                    <button
                      onClick={() => {
                        const qty = parseInt(document.getElementById(`qty-${product.id}`).value, 10) || 1;
                        addToCart(product, qty);
                        toast.success('Added to cart');
                      }}
                      className="btn btn-secondary"
                    >
                      Add to cart
                    </button>
                    <button
                      onClick={() => {
                        const qty = document.getElementById(`qty-${product.id}`).value;
                        handleOrder(product.id, qty);
                      }}
                      className="btn btn-primary"
                    >
                      Order Now
                    </button>
                  </div>
                  )
                ) : (
                  <p className="error">{isCobbler ? 'Not Available Right Now' : 'Out of Stock'}</p>
                )}
              </div>
            ))}
          </div>
          {products.length === 0 && (
            <p>{isCobbler ? 'No services available from this entrepreneur yet.' : 'No products available from this entrepreneur.'}</p>
          )}
        </div>

        <div className="products-section">
          <h2>Reviews</h2>
          {isCustomer && (
            <form onSubmit={handleReviewSubmit} style={{ marginBottom: '20px' }}>
              <div className="form-group">
                <label>Rating</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>
              </div>
              <div className="form-group">
                <label>Comment (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience..."
                />
              </div>
              {reviewError && <div className="error">{reviewError}</div>}
              <button type="submit" className="btn btn-success">Submit Review</button>
            </form>
          )}

          {reviews.length > 0 ? (
            <div className="grid">
              {reviews.map(review => (
                <div key={review.id} className="card">
                  <p><strong>{review.customerName}</strong></p>
                  <p><strong>Rating:</strong> {review.rating}/5</p>
                  <p>{review.comment || 'No comment provided.'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntrepreneurDetail;
