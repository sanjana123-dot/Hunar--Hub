import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import api, { resolveMediaUrl } from '../../services/api';
import { CartContext } from '../../context/CartContext';
import { toast } from 'react-toastify';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const orderFromState = location.state?.order || null;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        if (!cancelled) {
          setProduct(res.data);
        }
      } catch (err) {
        console.error('Error fetching product', err);
        // Fallback to order snapshot, if we have it
        if (!cancelled && orderFromState) {
          setProduct({
            id: orderFromState.productId,
            name: orderFromState.productName,
            description: orderFromState.productDescription,
            price: orderFromState.productPrice,
            imageUrl: orderFromState.productImageUrl,
            categoryName: orderFromState.categoryName,
          });
        } else if (!cancelled) {
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id, orderFromState]);

  if (loading) {
    return <div className="product-detail-page">Loading...</div>;
  }

  if (!product) {
    return <div className="product-detail-page">Product not found.</div>;
  }

  const galleryImages = [
    product.imageUrl,
    ...(product.additionalImageUrls
      ? product.additionalImageUrls.split(',').map(s => s.trim()).filter(Boolean)
      : []),
  ]
    .filter(Boolean)
    .map(resolveMediaUrl);

  const handleAddToCart = () => {
    addToCart({ ...product, selectedSize }, 1);
    toast.success('Added to cart');
  };

  const handleBuyNow = () => {
    addToCart({ ...product, selectedSize }, 1);
    navigate('/checkout');
  };

  const availableSizes = (product.availableSizes || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const isTailor = product.categoryName === 'Tailor';
  const isCobbler = product.categoryName === 'Cobbler';

  const hasTailorDetails =
    isTailor &&
    (product.fabric ||
      product.color ||
      product.fit ||
      product.washCare ||
      product.styleNotes ||
      product.spec1 ||
      product.spec2);

  const hasCobblerDetails =
    isCobbler &&
    (product.fabric ||
      product.color ||
      product.fit ||
      product.washCare ||
      product.spec1 ||
      product.spec2);

  return (
    <div className="product-detail-page">
      <div className="product-breadcrumb">
        <Link to="/home">Home</Link>
        <span>/</span>
        <span>{product.categoryName || 'Product'}</span>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <div className="product-detail-layout">
        <div className="product-images">
          {galleryImages.length > 0 ? (
            <>
              <div className="product-main-image">
                <img src={galleryImages[activeImageIndex]} alt={product.name} />
              </div>
              {galleryImages.length > 1 && (
                <div className="product-thumbnails">
                  {galleryImages.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`${product.name} ${idx + 1}`}
                      onClick={() => setActiveImageIndex(idx)}
                      className={idx === activeImageIndex ? 'thumb-active' : ''}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="product-main-image placeholder" />
          )}
        </div>

        <div className="product-info-panel">
          <h1 className="product-title">{product.name}</h1>
          <p className="product-subtitle">{product.categoryName}</p>

          <div className="product-price-row">
            {product.price != null ? (
              <span className="product-price-main">₹{product.price}</span>
            ) : (
              <span className="product-price-main">Price not available</span>
            )}
          </div>

          {availableSizes.length > 0 && (
            <div className="product-sizes-block">
              <div className="product-sizes-label">SELECT SIZE</div>
              <div className="product-sizes-row">
                {(isCobbler ? ['4', '5', '6', '7', '8', '9'] : ['S', 'M', 'L', 'XL', 'XXL']).map(size => {
                  if (!availableSizes.includes(size)) return null;
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      className={`size-chip${active ? ' active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="product-description-block">
            <h2>Product details</h2>
            <p>{product.description || 'No description available.'}</p>
          </div>

          {hasTailorDetails && (
            <div className="product-specs-block">
              <h2>Specifications</h2>
              <div className="product-specs-grid">
                {product.fabric && (
                  <>
                    <span className="spec-label">Fabric</span>
                    <span className="spec-value">{product.fabric}</span>
                  </>
                )}
                {product.color && (
                  <>
                    <span className="spec-label">Color</span>
                    <span className="spec-value">{product.color}</span>
                  </>
                )}
                {product.fit && (
                  <>
                    <span className="spec-label">Fit / Shape</span>
                    <span className="spec-value">{product.fit}</span>
                  </>
                )}
                {product.washCare && (
                  <>
                    <span className="spec-label">Wash Care</span>
                    <span className="spec-value">{product.washCare}</span>
                  </>
                )}
                {product.spec1 && (
                  <>
                    <span className="spec-label">Detail 1</span>
                    <span className="spec-value">{product.spec1}</span>
                  </>
                )}
                {product.spec2 && (
                  <>
                    <span className="spec-label">Detail 2</span>
                    <span className="spec-value">{product.spec2}</span>
                  </>
                )}
                {product.styleNotes && (
                  <>
                    <span className="spec-label">Style Notes</span>
                    <span className="spec-value">{product.styleNotes}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {hasCobblerDetails && (
            <div className="product-specs-block">
              <h2>Product details</h2>
              <div className="product-specs-grid">
                {product.fabric && (
                  <>
                    <span className="spec-label">Material used</span>
                    <span className="spec-value">{product.fabric}</span>
                  </>
                )}
                {product.color && (
                  <>
                    <span className="spec-label">Color options</span>
                    <span className="spec-value">{product.color}</span>
                  </>
                )}
                {product.spec1 && (
                  <>
                    <span className="spec-label">Stock availability</span>
                    <span className="spec-value">{product.spec1}</span>
                  </>
                )}
                {product.fit && (
                  <>
                    <span className="spec-label">Service price</span>
                    <span className="spec-value">{product.fit}</span>
                  </>
                )}
                {product.washCare && (
                  <>
                    <span className="spec-label">Estimated time</span>
                    <span className="spec-value">{product.washCare}</span>
                  </>
                )}
              </div>

              {product.spec2 && (
                <div style={{ marginTop: 10 }}>
                  <h2>Repair services</h2>
                  <ul style={{ paddingLeft: 18, margin: '4px 0 0' }}>
                    {product.spec2
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map(service => (
                        <li key={service}>{service}</li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="product-actions-row">
            <button className="btn btn-primary product-buy-btn" onClick={handleBuyNow}>
              Buy now
            </button>
            <button className="btn btn-secondary product-cart-btn" onClick={handleAddToCart}>
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

