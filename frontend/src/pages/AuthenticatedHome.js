import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import api, { resolveMediaUrl } from '../services/api';
import { toast } from 'react-toastify';
import Pagination from '../components/Pagination';
import './AuthenticatedHome.css';

const AuthenticatedHome = () => {
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState({ content: [], totalPages: 0 });
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const productsSectionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data || [])).catch(() => setCategories([]));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (search.trim()) params.search = search.trim();
      const response = await api.get('/products', { params });
      const data = response.data;
      setProducts({
        content: data.content || data || [],
        totalPages: data.totalPages ?? 1
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, size]);

  const fetchProductsByCategory = useCallback(async (categoryId) => {
    try {
      const response = await api.get('/products', { params: { categoryId, page: 0, size: 4 } });
      const data = response.data;
      const list = data.content || (Array.isArray(data) ? data : []);
      setCategoryProducts(prev => ({ ...prev, [categoryId]: list.slice(0, 4) }));
    } catch {
      setCategoryProducts(prev => ({ ...prev, [categoryId]: [] }));
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (categories.length) {
      categories.forEach(cat => fetchProductsByCategory(cat.id));
    }
  }, [categories, fetchProductsByCategory]);

  useEffect(() => {
    const onFocus = () => {
      if (categories.length) {
        categories.forEach(cat => fetchProductsByCategory(cat.id));
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [categories, fetchProductsByCategory]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchProducts();
  };

  const handleCategoryNav = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    setPage(0);
    setTimeout(() => {
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const handleProductClick = (product) => {
    navigate(`/products/${product.id}`);
  };

  // When a category is selected, only show that category in the "Shop by category" grid
  const visibleCategories = selectedCategory
    ? categories.filter(c => c.id === selectedCategory)
    : categories;

  return (
    <div className="authenticated-home">
      {/* Top bar: search + account */}
      <header className="home-header">
        <div className="home-header-inner">
          <form onSubmit={handleSearch} className="home-search-form">
            <select className="home-search-select" aria-label="Category">
              <option>All</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              className="home-search-input"
              placeholder="Search HunarHub"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="home-search-btn">Search</button>
          </form>
          <div className="home-header-right">
            <Link to="/profile" className="home-account-link">
              Hello, {user?.name || 'User'}
            </Link>
            <span className="home-account-label">Account & Lists</span>
          </div>
        </div>
      </header>

      {/* Secondary nav: categories */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <button
            className={`home-nav-item ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`home-nav-item ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategoryNav(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero banner */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-text">
            <h2 className="home-hero-title">Shop local. Support artisans.</h2>
            <p className="home-hero-sub">Handmade products from local entrepreneurs</p>
          </div>
          <div className="home-hero-visual" />
        </div>
      </section>

      <div className="home-main" style={{ background: '#f8f9fa' }}>
        {/* Shop by category - 2x2 grid cards */}
        <section
          className="home-section home-categories-section"
          style={{ background: '#ffffff' }}
        >
          <div className="home-container">
            <h3 className="home-section-title">Shop by category</h3>
            <div className="category-cards-grid">
              {visibleCategories.map(cat => {
                const items = categoryProducts[cat.id] || [];
                return (
                  <div
                    key={cat.id}
                    className="category-card-block"
                    onClick={() => handleCategoryNav(cat.id)}
                  >
                    <h4 className="category-card-heading">{cat.name}</h4>
                    <div className="category-card-grid">
                      {[0, 1, 2, 3].map(i => {
                        const p = items[i];
                        return (
                          <div key={p ? p.id : `ph-${cat.id}-${i}`} className="category-card-cell">
                            {p ? (
                              p.imageUrl ? (
                                <img src={resolveMediaUrl(p.imageUrl)} alt={p.name} />
                              ) : (
                                <div className="category-card-placeholder" />
                              )
                            ) : (
                              <div className="category-card-placeholder" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <span className="category-card-link">See more</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured / category products */}
        <section
          className="home-section home-products-section"
          style={{ background: '#ffffff' }}
          ref={productsSectionRef}
        >
          <div className="home-container">
            <h3 className="home-section-title">
              {selectedCategory
                ? `${categories.find(c => c.id === selectedCategory)?.name || 'Category'} products`
                : 'Featured products'}
            </h3>

            {loading ? (
              <div className="home-loading">
                <div className="loading-spinner" />
                <p>Loading products...</p>
              </div>
            ) : products.content && products.content.length > 0 ? (
              <>
                <div className="products-grid">
                  {products.content.map(product => (
                    <div key={product.id} className="product-card">
                      <div
                        className="product-card-clickable"
                        onClick={() => handleProductClick(product)}
                      >
                        {product.imageUrl ? (
                          <div className="product-image-wrapper">
                            <img src={resolveMediaUrl(product.imageUrl)} alt={product.name} className="product-image" />
                          </div>
                        ) : (
                          <div className="product-image-placeholder" />
                        )}
                        <div className="product-info">
                          <h3 className="product-name">{product.name}</h3>
                          <p className="product-description">
                            {product.description?.substring(0, 80)}
                            {product.description?.length > 80 ? '...' : ''}
                          </p>
                          <div className="product-meta">
                            <span className="product-price">₹{product.price}</span>
                            <span className="product-category">{product.categoryName}</span>
                          </div>
                          <div className="product-seller">
                            <span className="seller-label">by</span>
                            <span className="seller-name">{product.entrepreneurName}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="product-add-cart"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product, 1);
                          toast.success('Added to cart');
                        }}
                      >
                        Add to cart
                      </button>
                    </div>
                  ))}
                </div>
                {products.totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={products.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </>
            ) : (
              <div className="home-empty">
                <p>
                  {selectedCategory
                    ? 'No products available yet!'
                    : 'No products yet. Check back soon or browse entrepreneurs.'}
                </p>
                {!selectedCategory && (
                  <Link to="/entrepreneurs" className="btn btn-primary">Browse entrepreneurs</Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Quick links */}
        <section
          className="home-section home-quicklinks"
          style={{ background: '#f8f9fa' }}
        >
          <div className="home-container">
            <h3 className="home-section-title">Quick links</h3>
            <div className="quick-links-row">
              <Link to="/entrepreneurs" className="quick-link-card">
                <span className="quick-link-label">Browse entrepreneurs</span>
                <span className="quick-link-arrow">›</span>
              </Link>
              <Link to="/orders/my" className="quick-link-card">
                <span className="quick-link-label">My Orders</span>
                <span className="quick-link-arrow">›</span>
              </Link>
              {user?.role === 'ENTREPRENEUR' && (
                <Link to="/entrepreneur/products" className="quick-link-card">
                  <span className="quick-link-label">Add product</span>
                  <span className="quick-link-arrow">›</span>
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthenticatedHome;
