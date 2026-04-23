import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { resolveMediaUrl } from '../services/api';
import './Cart.css';

const Cart = () => {
  const { user } = useContext(AuthContext);
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (!user) {
    return (
      <div className="cart-page">
        <p>Please log in to view your cart.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1 className="cart-title">Cart</h1>
      {cart.length === 0 ? (
        <div className="cart-empty">
          <p>Your cart is empty.</p>
          <Link to="/home" className="btn btn-primary">Continue shopping</Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {cart.map(item => (
              <div key={item.product.id} className="cart-item">
                <div className="cart-item-image">
                  {item.product.imageUrl ? (
                    <img src={resolveMediaUrl(item.product.imageUrl)} alt={item.product.name} />
                  ) : (
                    <div className="cart-item-placeholder" />
                  )}
                </div>
                <div className="cart-item-details">
                  <h3>{item.product.name}</h3>
                  <p className="cart-item-seller">by {item.product.entrepreneurName}</p>
                  <p className="cart-item-price">₹{item.product.price}</p>
                </div>
                <div className="cart-item-qty">
                  <label>Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="cart-item-subtotal">
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </div>
                <button
                  type="button"
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="cart-footer">
            <p className="cart-total">Total: ₹{total.toFixed(2)}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/checkout')}
            >
              Buy now
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
