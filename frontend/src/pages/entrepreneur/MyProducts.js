import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import api, { resolveMediaUrl } from '../../services/api';
import { toast } from 'react-toastify';
import Pagination from '../../components/Pagination';
import ImageUpload from '../../components/ImageUpload';
import './MyProducts.css';

const MyProducts = () => {
  const [data, setData] = useState({ content: [], totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    available: true,
    availableSizes: '',
    // Tailor-specific optional fields
    fabric: '',
    color: '',
    fit: '',
    washCare: '',
    styleNotes: '',
    spec1: '',
    spec2: '',
    quantityAvailable: '',
    shortDescription: '',
    potterProductType: '',
    detailedDescription: '',
    height: '',
    diameterTop: '',
    diameterBottom: '',
    capacity: '',
    material: '',
    finishType: '',
    handmadeOrMachine: '',
    suitableFor: '',
    usageEnvironment: '',
    foodSafe: null,
    drainageHole: null,
    weightApprox: '',
    fragile: null,
    handlingInstructions: '',
    deliveryTime: '',
    packagingDetails: '',
    handmadeByArtisan: null,
    originStory: '',
    ecoFriendly: null,
    returnPolicy: '',
    replacementPolicy: '',
    artisanBrandName: '',
    artisanProductType: '',
    artisanMakingProcess: '',
    artisanUniqueFeatures: '',
    artisanDimensions: '',
    artisanWeight: '',
    artisanMaterial: '',
    artisanColorVariants: '',
    artisanQuantityType: '',
    artisanDiscount: '',
    artisanTaxesIncluded: null,
    artisanShippingCost: '',
    artisanStockQuantity: '',
    artisanStockMode: '',
    artisanRestockTimeline: '',
    artisanShippingLocations: '',
    artisanCourierPartner: '',
    artisanReturnWindow: '',
    artisanReturnConditions: '',
    artisanRefundReplacementDetails: '',
  });
  const [categories, setCategories] = useState([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [error, setError] = useState('');
  const editFormRef = useRef(null);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data || [])).catch(() => setCategories([]));
    api.get('/profile')
      .then(res => setBusinessCategory((res.data?.businessCategory || '').trim()))
      .catch(() => setBusinessCategory(''));
  }, []);

  const isArtisanEntrepreneur = businessCategory.toLowerCase() === 'artisan';

  /** Includes current listing category if API hides legacy rows (e.g. Vendor). */
  const categoriesForForm = useMemo(() => {
    const base = categories || [];
    const id = formData.categoryId;
    if (id === '' || id === undefined || id === null) return base;
    if (base.some((c) => String(c.id) === String(id))) return base;
    const label = selectedCategoryName || 'Previous category';
    const nid = typeof id === 'string' && id !== '' ? Number(id) : id;
    return [...base, { id: nid, name: label }];
  }, [categories, formData.categoryId, selectedCategoryName]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/entrepreneur/products', {
        params: { page, size }
      });
      if (response.data.content) {
        setData(response.data);
      } else {
        setData({ content: response.data, totalPages: 1 });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      ...formData,
      categoryId: formData.categoryId ? Number(formData.categoryId) : formData.categoryId,
      quantityAvailable:
        formData.quantityAvailable === '' || formData.quantityAvailable === null
          ? null
          : Number(formData.quantityAvailable),
      artisanStockQuantity:
        formData.artisanStockQuantity === '' || formData.artisanStockQuantity === null
          ? null
          : Number(formData.artisanStockQuantity),
      additionalImageUrls: extraImages.filter(Boolean).join(','),
      availableSizes: formData.availableSizes,
    };

    if (isArtisanEntrepreneur) {
      const requiredArtisanFields = [
        ['name', 'Product name'],
        ['description', 'Product description'],
        ['price', 'Selling price'],
        ['artisanBrandName', 'Brand/Artisan name'],
        ['artisanProductType', 'Product type/category'],
        ['artisanMakingProcess', 'How it is made'],
        ['artisanUniqueFeatures', 'Unique features'],
        ['artisanDimensions', 'Size/Dimensions'],
        ['artisanWeight', 'Weight'],
        ['artisanMaterial', 'Material'],
        ['artisanColorVariants', 'Color variants'],
        ['artisanQuantityType', 'Quantity type'],
        ['artisanShippingCost', 'Shipping cost'],
        ['artisanStockQuantity', 'Stock quantity'],
        ['artisanStockMode', 'Stock mode'],
        ['deliveryTime', 'Delivery time'],
        ['artisanShippingLocations', 'Shipping locations'],
        ['artisanReturnWindow', 'Return window'],
        ['artisanReturnConditions', 'Return conditions'],
        ['artisanRefundReplacementDetails', 'Refund/replacement details'],
      ];

      const missing = requiredArtisanFields.find(([key]) => {
        const value = payload[key];
        return value === null || value === undefined || String(value).trim() === '';
      });
      if (missing) {
        const message = `${missing[1]} is required for Artisan products.`;
        setError(message);
        toast.error(message);
        return;
      }
    }

    try {
      if (editingProduct) {
        await api.put(`/entrepreneur/products/${editingProduct.id}`, payload);
        toast.success('Listing updated successfully');
      } else {
        await api.post('/entrepreneur/products', payload);
        toast.success('Listing created successfully');
      }
      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        categoryId: '',
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        available: true,
        availableSizes: '',
        fabric: '',
        color: '',
        fit: '',
        washCare: '',
        styleNotes: '',
        spec1: '',
        spec2: '',
        quantityAvailable: '',
        shortDescription: '',
        potterProductType: '',
        detailedDescription: '',
        height: '',
        diameterTop: '',
        diameterBottom: '',
        capacity: '',
        material: '',
        finishType: '',
        handmadeOrMachine: '',
        suitableFor: '',
        usageEnvironment: '',
        foodSafe: null,
        drainageHole: null,
        weightApprox: '',
        fragile: null,
        handlingInstructions: '',
        deliveryTime: '',
        packagingDetails: '',
        handmadeByArtisan: null,
        originStory: '',
        ecoFriendly: null,
        returnPolicy: '',
        replacementPolicy: '',
    artisanBrandName: '',
    artisanProductType: '',
    artisanMakingProcess: '',
    artisanUniqueFeatures: '',
    artisanDimensions: '',
    artisanWeight: '',
    artisanMaterial: '',
    artisanColorVariants: '',
    artisanQuantityType: '',
    artisanDiscount: '',
    artisanTaxesIncluded: null,
    artisanShippingCost: '',
    artisanStockQuantity: '',
    artisanStockMode: '',
    artisanRestockTimeline: '',
    artisanShippingLocations: '',
    artisanCourierPartner: '',
    artisanReturnWindow: '',
    artisanReturnConditions: '',
    artisanRefundReplacementDetails: '',
      });
      setSelectedCategoryName('');
      fetchProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save listing';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      categoryId: product.categoryId,
      name: product.name,
      description: product.description || '',
      price: product.price,
      imageUrl: product.imageUrl || '',
      available: product.available,
      availableSizes: product.availableSizes || '',
      fabric: product.fabric || '',
      color: product.color || '',
      fit: product.fit || '',
      washCare: product.washCare || '',
      styleNotes: product.styleNotes || '',
      spec1: product.spec1 || '',
      spec2: product.spec2 || '',
      quantityAvailable: product.quantityAvailable ?? '',
      shortDescription: product.shortDescription || '',
      potterProductType: product.potterProductType || '',
      detailedDescription: product.detailedDescription || '',
      height: product.height || '',
      diameterTop: product.diameterTop || '',
      diameterBottom: product.diameterBottom || '',
      capacity: product.capacity || '',
      material: product.material || '',
      finishType: product.finishType || '',
      handmadeOrMachine: product.handmadeOrMachine || '',
      suitableFor: product.suitableFor || '',
      usageEnvironment: product.usageEnvironment || '',
      foodSafe: product.foodSafe ?? null,
      drainageHole: product.drainageHole ?? null,
      weightApprox: product.weightApprox || '',
      fragile: product.fragile ?? null,
      handlingInstructions: product.handlingInstructions || '',
      deliveryTime: product.deliveryTime || '',
      packagingDetails: product.packagingDetails || '',
      handmadeByArtisan: product.handmadeByArtisan ?? null,
      originStory: product.originStory || '',
      ecoFriendly: product.ecoFriendly ?? null,
      returnPolicy: product.returnPolicy || '',
      replacementPolicy: product.replacementPolicy || '',
      artisanBrandName: product.artisanBrandName || '',
      artisanProductType: product.artisanProductType || '',
      artisanMakingProcess: product.artisanMakingProcess || '',
      artisanUniqueFeatures: product.artisanUniqueFeatures || '',
      artisanDimensions: product.artisanDimensions || '',
      artisanWeight: product.artisanWeight || '',
      artisanMaterial: product.artisanMaterial || '',
      artisanColorVariants: product.artisanColorVariants || '',
      artisanQuantityType: product.artisanQuantityType || '',
      artisanDiscount: product.artisanDiscount || '',
      artisanTaxesIncluded: product.artisanTaxesIncluded ?? null,
      artisanShippingCost: product.artisanShippingCost || '',
      artisanStockQuantity: product.artisanStockQuantity ?? '',
      artisanStockMode: product.artisanStockMode || '',
      artisanRestockTimeline: product.artisanRestockTimeline || '',
      artisanShippingLocations: product.artisanShippingLocations || '',
      artisanCourierPartner: product.artisanCourierPartner || '',
      artisanReturnWindow: product.artisanReturnWindow || '',
      artisanReturnConditions: product.artisanReturnConditions || '',
      artisanRefundReplacementDetails: product.artisanRefundReplacementDetails || '',
    });
    setExtraImages(
      product.additionalImageUrls
        ? product.additionalImageUrls.split(',').map(s => s.trim()).filter(Boolean)
        : []
    );
    const cat = categories.find((c) => c.id === product.categoryId);
    setSelectedCategoryName(cat?.name || product.categoryName || '');
    setShowForm(true);
    // Scroll to edit form
    setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/entrepreneur/products/${productId}`);
        toast.success('Listing deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const handleImageUpload = (imageUrl) => {
    setFormData({ ...formData, imageUrl });
  };

  // Manage extra gallery images via plain text URLs
  const [extraImages, setExtraImages] = useState([]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="my-products-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Listings</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProduct(null);
            setFormData({
              categoryId: '',
              name: '',
              description: '',
              price: '',
              imageUrl: '',
              available: true,
              availableSizes: '',
              fabric: '',
              color: '',
              fit: '',
              washCare: '',
              styleNotes: '',
              spec1: '',
              spec2: '',
              quantityAvailable: '',
              shortDescription: '',
              potterProductType: '',
              detailedDescription: '',
              height: '',
              diameterTop: '',
              diameterBottom: '',
              capacity: '',
              material: '',
              finishType: '',
              handmadeOrMachine: '',
              suitableFor: '',
              usageEnvironment: '',
              foodSafe: null,
              drainageHole: null,
              weightApprox: '',
              fragile: null,
              handlingInstructions: '',
              deliveryTime: '',
              packagingDetails: '',
              handmadeByArtisan: null,
              originStory: '',
              ecoFriendly: null,
              returnPolicy: '',
              replacementPolicy: '',
              artisanBrandName: '',
              artisanProductType: '',
              artisanMakingProcess: '',
              artisanUniqueFeatures: '',
              artisanDimensions: '',
              artisanWeight: '',
              artisanMaterial: '',
              artisanColorVariants: '',
              artisanQuantityType: '',
              artisanDiscount: '',
              artisanTaxesIncluded: null,
              artisanShippingCost: '',
              artisanStockQuantity: '',
              artisanStockMode: '',
              artisanRestockTimeline: '',
              artisanShippingLocations: '',
              artisanCourierPartner: '',
              artisanReturnWindow: '',
              artisanReturnConditions: '',
              artisanRefundReplacementDetails: '',
            });
            setSelectedCategoryName('');
            setExtraImages([]);
            setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
          }}
          className="btn btn-primary"
        >
          Add Listing
        </button>
      </div>

      {showForm && (
        <div className="card" ref={editFormRef}>
          <h3>{editingProduct ? 'Edit Listing' : 'Add New Listing'}</h3>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.categoryId ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const cat = categoriesForForm.find((c) => String(c.id) === value);
                  setFormData({ ...formData, categoryId: value });
                  setSelectedCategoryName(cat?.name || '');
                }}
                required
              >
                <option value="">Select Category</option>
                {categoriesForForm.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            {/* Available sizes depend on category */}
            {selectedCategoryName === 'Tailor' && (
              <div className="form-group">
                <label>Available Sizes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['S', 'M', 'L', 'XL', 'XXL'].map(size => {
                    const selected = (formData.availableSizes || '')
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .includes(size);
                    return (
                      <label
                        key={size}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 16,
                          border: '1px solid #cbd5e0',
                          cursor: 'pointer',
                          backgroundColor: selected ? '#1D443D' : '#fff',
                          color: selected ? '#fff' : '#1a202c',
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const current = (formData.availableSizes || '')
                              .split(',')
                              .map(s => s.trim())
                              .filter(Boolean);
                            let next;
                            if (e.target.checked) {
                              next = Array.from(new Set([...current, size]));
                            } else {
                              next = current.filter(s => s !== size);
                            }
                            setFormData({
                              ...formData,
                              availableSizes: next.join(','),
                            });
                          }}
                          style={{ display: 'none' }}
                        />
                        <span>{size}</span>
                      </label>
                    );
                  })}
                </div>
                <small style={{ display: 'block', marginTop: 4, color: '#718096', fontSize: 12 }}>
                  Clothing sizes: S, M, L, XL, XXL.
                </small>
              </div>
            )}
            {selectedCategoryName === 'Cobbler' && (
              <div className="form-group">
                <label>Available Sizes (shoe sizes)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['4', '5', '6', '7', '8', '9'].map(size => {
                    const selected = (formData.availableSizes || '')
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .includes(size);
                    return (
                      <label
                        key={size}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 16,
                          border: '1px solid #cbd5e0',
                          cursor: 'pointer',
                          backgroundColor: selected ? '#1D443D' : '#fff',
                          color: selected ? '#fff' : '#1a202c',
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const current = (formData.availableSizes || '')
                              .split(',')
                              .map(s => s.trim())
                              .filter(Boolean);
                            let next;
                            if (e.target.checked) {
                              next = Array.from(new Set([...current, size]));
                            } else {
                              next = current.filter(s => s !== size);
                            }
                            setFormData({
                              ...formData,
                              availableSizes: next.join(','),
                            });
                          }}
                          style={{ display: 'none' }}
                        />
                        <span>{size}</span>
                      </label>
                    );
                  })}
                </div>
                <small style={{ display: 'block', marginTop: 4, color: '#718096', fontSize: 12 }}>
                  Choose all shoe sizes you can make: 4–9.
                </small>
              </div>
            )}
            <div className="form-group">
              <label>Image</label>
              <ImageUpload
                onUploadSuccess={handleImageUpload}
                currentImageUrl={formData.imageUrl}
              />
            </div>

            {/* Extra gallery images uploaded just like main image */}
            <div className="form-group">
              <label>Extra Images (optional)</label>
              {extraImages.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {extraImages.map((url, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        borderRadius: 6,
                        overflow: 'hidden',
                        border: '1px solid #ddd',
                      }}
                    >
                      <img
                        src={url}
                        alt={`Extra ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={() => setExtraImages(extraImages.filter((_, i) => i !== idx))}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          border: 'none',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          cursor: 'pointer',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          fontSize: 12,
                        }}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <ImageUpload
                onUploadSuccess={(url) => setExtraImages([...extraImages, url])}
                currentImageUrl={null}
              />
            </div>

            {isArtisanEntrepreneur && (
              <>
                <hr />
                <h4>Artisan Product Details (Required)</h4>

                <div className="form-group">
                  <label>Brand / Artisan Name</label>
                  <input type="text" value={formData.artisanBrandName} onChange={(e) => setFormData({ ...formData, artisanBrandName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Product Category / Type</label>
                  <input type="text" value={formData.artisanProductType} onChange={(e) => setFormData({ ...formData, artisanProductType: e.target.value })} placeholder="e.g. Clothing, Home Decor, Jewelry" required />
                </div>
                <div className="form-group">
                  <label>How is it made?</label>
                  <textarea value={formData.artisanMakingProcess} onChange={(e) => setFormData({ ...formData, artisanMakingProcess: e.target.value })} placeholder="handmade, eco-friendly, traditional technique" required />
                </div>
                <div className="form-group">
                  <label>What makes it unique?</label>
                  <textarea value={formData.artisanUniqueFeatures} onChange={(e) => setFormData({ ...formData, artisanUniqueFeatures: e.target.value })} required />
                </div>

                <h4>Specifications</h4>
                <div className="form-group">
                  <label>Size / Dimensions</label>
                  <input type="text" value={formData.artisanDimensions} onChange={(e) => setFormData({ ...formData, artisanDimensions: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Weight</label>
                  <input type="text" value={formData.artisanWeight} onChange={(e) => setFormData({ ...formData, artisanWeight: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Material</label>
                  <input type="text" value={formData.artisanMaterial} onChange={(e) => setFormData({ ...formData, artisanMaterial: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Color Variants</label>
                  <input type="text" value={formData.artisanColorVariants} onChange={(e) => setFormData({ ...formData, artisanColorVariants: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Quantity Type</label>
                  <input type="text" value={formData.artisanQuantityType} onChange={(e) => setFormData({ ...formData, artisanQuantityType: e.target.value })} placeholder="Single piece / Set of 2 etc." required />
                </div>

                <h4>Pricing</h4>
                <div className="form-group">
                  <label>Discount (optional)</label>
                  <input type="text" value={formData.artisanDiscount} onChange={(e) => setFormData({ ...formData, artisanDiscount: e.target.value })} placeholder="e.g. 10%" />
                </div>
                <div className="form-group">
                  <label>Taxes Included?</label>
                  <select value={formData.artisanTaxesIncluded === null ? '' : String(formData.artisanTaxesIncluded)} onChange={(e) => setFormData({ ...formData, artisanTaxesIncluded: e.target.value === '' ? null : e.target.value === 'true' })}>
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Shipping Cost</label>
                  <input type="text" value={formData.artisanShippingCost} onChange={(e) => setFormData({ ...formData, artisanShippingCost: e.target.value })} placeholder="Free / Paid / amount" required />
                </div>

                <h4>Inventory</h4>
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input type="number" min="0" value={formData.artisanStockQuantity} onChange={(e) => setFormData({ ...formData, artisanStockQuantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Stock Mode</label>
                  <select value={formData.artisanStockMode} onChange={(e) => setFormData({ ...formData, artisanStockMode: e.target.value })} required>
                    <option value="">Select</option>
                    <option value="READY_STOCK">Ready stock</option>
                    <option value="MADE_TO_ORDER">Made to order</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Restock Timeline (optional)</label>
                  <input type="text" value={formData.artisanRestockTimeline} onChange={(e) => setFormData({ ...formData, artisanRestockTimeline: e.target.value })} />
                </div>

                <h4>Shipping</h4>
                <div className="form-group">
                  <label>Delivery Time</label>
                  <input type="text" value={formData.deliveryTime} onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })} placeholder="e.g. 5-7 days" required />
                </div>
                <div className="form-group">
                  <label>Shipping Locations</label>
                  <input type="text" value={formData.artisanShippingLocations} onChange={(e) => setFormData({ ...formData, artisanShippingLocations: e.target.value })} placeholder="India / International" required />
                </div>
                <div className="form-group">
                  <label>Courier Partner (optional)</label>
                  <input type="text" value={formData.artisanCourierPartner} onChange={(e) => setFormData({ ...formData, artisanCourierPartner: e.target.value })} />
                </div>

                <h4>Return & Refund</h4>
                <div className="form-group">
                  <label>Return Window</label>
                  <input type="text" value={formData.artisanReturnWindow} onChange={(e) => setFormData({ ...formData, artisanReturnWindow: e.target.value })} placeholder="e.g. 7 days" required />
                </div>
                <div className="form-group">
                  <label>Return Conditions</label>
                  <textarea value={formData.artisanReturnConditions} onChange={(e) => setFormData({ ...formData, artisanReturnConditions: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Refund/Replacement Details</label>
                  <textarea value={formData.artisanRefundReplacementDetails} onChange={(e) => setFormData({ ...formData, artisanRefundReplacementDetails: e.target.value })} required />
                </div>
              </>
            )}

            {/* Potter-specific fields */}
            {selectedCategoryName === 'Potter' && (
              <>
                <hr />
                <h4>Potter Product Details</h4>

                <div className="form-group">
                  <label>Product Type</label>
                  <select
                    value={formData.potterProductType}
                    onChange={(e) => setFormData({ ...formData, potterProductType: e.target.value })}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Planter">Planter</option>
                    <option value="Vase">Vase</option>
                    <option value="Water Pot">Water Pot</option>
                    <option value="Decorative">Decorative</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity Available</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantityAvailable}
                    onChange={(e) => setFormData({ ...formData, quantityAvailable: e.target.value })}
                    required
                  />
                </div>

                <h4>Description</h4>
                <div className="form-group">
                  <label>Short description</label>
                  <textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="1-2 line summary"
                  />
                </div>
                <div className="form-group">
                  <label>Detailed description</label>
                  <textarea
                    value={formData.detailedDescription}
                    onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
                    placeholder="Features, uniqueness, and purpose"
                  />
                </div>

                <h4>Dimensions & Size</h4>
                <div className="form-group">
                  <label>Height (cm/inches)</label>
                  <input
                    type="text"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Diameter (top)</label>
                  <input
                    type="text"
                    value={formData.diameterTop}
                    onChange={(e) => setFormData({ ...formData, diameterTop: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Diameter (bottom)</label>
                  <input
                    type="text"
                    value={formData.diameterBottom}
                    onChange={(e) => setFormData({ ...formData, diameterBottom: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Capacity (if applicable)</label>
                  <input
                    type="text"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="e.g. 5 litres"
                  />
                </div>

                <h4>Material & Finish</h4>
                <div className="form-group">
                  <label>Material</label>
                  <select
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  >
                    <option value="">Select material</option>
                    <option value="Clay">Clay</option>
                    <option value="Terracotta">Terracotta</option>
                    <option value="Ceramic">Ceramic</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Finish</label>
                  <select
                    value={formData.finishType}
                    onChange={(e) => setFormData({ ...formData, finishType: e.target.value })}
                  >
                    <option value="">Select finish</option>
                    <option value="Matte">Matte</option>
                    <option value="Glossy">Glossy</option>
                    <option value="Painted">Painted</option>
                    <option value="Natural">Natural</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Handmade or Machine-made</label>
                  <select
                    value={formData.handmadeOrMachine}
                    onChange={(e) => setFormData({ ...formData, handmadeOrMachine: e.target.value })}
                  >
                    <option value="">Select type</option>
                    <option value="Handmade">Handmade</option>
                    <option value="Machine-made">Machine-made</option>
                  </select>
                </div>

                <h4>Usage Details</h4>
                <div className="form-group">
                  <label>Suitable for</label>
                  <input
                    type="text"
                    value={formData.suitableFor}
                    onChange={(e) => setFormData({ ...formData, suitableFor: e.target.value })}
                    placeholder="Plants / Water / Decoration / Kitchen"
                  />
                </div>
                <div className="form-group">
                  <label>Indoor / Outdoor use</label>
                  <select
                    value={formData.usageEnvironment}
                    onChange={(e) => setFormData({ ...formData, usageEnvironment: e.target.value })}
                  >
                    <option value="">Select usage</option>
                    <option value="Indoor">Indoor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Food-safe</label>
                  <select
                    value={formData.foodSafe === null ? '' : String(formData.foodSafe)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        foodSafe: e.target.value === '' ? null : e.target.value === 'true',
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Drainage hole</label>
                  <select
                    value={formData.drainageHole === null ? '' : String(formData.drainageHole)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        drainageHole: e.target.value === '' ? null : e.target.value === 'true',
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <h4>Weight & Fragility</h4>
                <div className="form-group">
                  <label>Weight (approx)</label>
                  <input
                    type="text"
                    value={formData.weightApprox}
                    onChange={(e) => setFormData({ ...formData, weightApprox: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Fragile</label>
                  <select
                    value={formData.fragile === null ? '' : String(formData.fragile)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fragile: e.target.value === '' ? null : e.target.value === 'true',
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Handling instructions (optional)</label>
                  <textarea
                    value={formData.handlingInstructions}
                    onChange={(e) => setFormData({ ...formData, handlingInstructions: e.target.value })}
                  />
                </div>

                <h4>Shipping & Delivery</h4>
                <div className="form-group">
                  <label>Delivery time</label>
                  <input
                    type="text"
                    value={formData.deliveryTime}
                    onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                    placeholder="e.g. 3-5 days"
                  />
                </div>
                <div className="form-group">
                  <label>Packaging details</label>
                  <textarea
                    value={formData.packagingDetails}
                    onChange={(e) => setFormData({ ...formData, packagingDetails: e.target.value })}
                    placeholder="secure / fragile-safe packaging"
                  />
                </div>

                <h4>Seller / Craft Details</h4>
                <div className="form-group">
                  <label>Handmade by artisan</label>
                  <select
                    value={formData.handmadeByArtisan === null ? '' : String(formData.handmadeByArtisan)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        handmadeByArtisan: e.target.value === '' ? null : e.target.value === 'true',
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Short story / origin (optional)</label>
                  <textarea
                    value={formData.originStory}
                    onChange={(e) => setFormData({ ...formData, originStory: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Eco-friendly</label>
                  <select
                    value={formData.ecoFriendly === null ? '' : String(formData.ecoFriendly)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ecoFriendly: e.target.value === '' ? null : e.target.value === 'true',
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <h4>Policies</h4>
                <div className="form-group">
                  <label>Return policy</label>
                  <textarea
                    value={formData.returnPolicy}
                    onChange={(e) => setFormData({ ...formData, returnPolicy: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Replacement policy</label>
                  <textarea
                    value={formData.replacementPolicy}
                    onChange={(e) => setFormData({ ...formData, replacementPolicy: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Tailor-specific fields */}
            {selectedCategoryName === 'Tailor' && (
              <>
                <hr />
                <h4>Tailor Details</h4>
                <div className="form-group">
                  <label>Fabric</label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                    placeholder="e.g. Pure Cotton"
                  />
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g. Blue and brown"
                  />
                </div>
                <div className="form-group">
                  <label>Fit / Shape</label>
                  <input
                    type="text"
                    value={formData.fit}
                    onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                    placeholder="e.g. A-line, calf length"
                  />
                </div>
                <div className="form-group">
                  <label>Wash Care</label>
                  <input
                    type="text"
                    value={formData.washCare}
                    onChange={(e) => setFormData({ ...formData, washCare: e.target.value })}
                    placeholder="e.g. Hand wash"
                  />
                </div>
                <div className="form-group">
                  <label>Style Notes</label>
                  <textarea
                    value={formData.styleNotes}
                    onChange={(e) => setFormData({ ...formData, styleNotes: e.target.value })}
                    placeholder="e.g. Mandarin collar, panelled design"
                  />
                </div>
                <div className="form-group">
                  <label>Additional Spec 1</label>
                  <input
                    type="text"
                    value={formData.spec1}
                    onChange={(e) => setFormData({ ...formData, spec1: e.target.value })}
                    placeholder="e.g. Three-quarter sleeves"
                  />
                </div>
                <div className="form-group">
                  <label>Additional Spec 2</label>
                  <input
                    type="text"
                    value={formData.spec2}
                    onChange={(e) => setFormData({ ...formData, spec2: e.target.value })}
                    placeholder="e.g. Multiple slits"
                  />
                </div>
              </>
            )}
            {/* Cobbler-specific fields */}
            {selectedCategoryName === 'Cobbler' && (
              <>
                <hr />
                <h4>Cobbler Service Details</h4>
                <div className="form-group">
                  <label>Material used</label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                    placeholder="e.g. Leather upper, rubber sole"
                  />
                </div>
                <div className="form-group">
                  <label>Color options</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="e.g. Black, Brown, Tan"
                  />
                </div>
                <div className="form-group">
                  <label>Stock availability</label>
                  <input
                    type="text"
                    value={formData.spec1}
                    onChange={(e) => setFormData({ ...formData, spec1: e.target.value })}
                    placeholder="e.g. Ready stock, 2–3 days to make"
                  />
                </div>
                <div className="form-group">
                  <label>Repair services offered</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {['Shoe stitching', 'Sole replacement', 'Polish / cleaning', 'Zip repair', 'Strap fixing'].map(
                      service => {
                        const current = (formData.spec2 || '')
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean);
                        const checked = current.includes(service);
                        return (
                          <label key={service} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                let next;
                                if (e.target.checked) {
                                  next = Array.from(new Set([...current, service]));
                                } else {
                                  next = current.filter(s => s !== service);
                                }
                                setFormData({ ...formData, spec2: next.join(',') });
                              }}
                            />
                            <span>{service}</span>
                          </label>
                        );
                      }
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Service price (if repairs offered)</label>
                  <input
                    type="text"
                    value={formData.fit}
                    onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                    placeholder="e.g. Stitching from ₹150, sole replacement from ₹300"
                  />
                </div>
                <div className="form-group">
                  <label>Estimated time for repair</label>
                  <input
                    type="text"
                    value={formData.washCare}
                    onChange={(e) => setFormData({ ...formData, washCare: e.target.value })}
                    placeholder="e.g. 1–2 days depending on work"
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                />
                Available
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn btn-success">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid">
        {data.content.map(product => (
          <div key={product.id} className="card">
            {product.imageUrl && (
              <img src={resolveMediaUrl(product.imageUrl)} alt={product.name} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', objectPosition: 'top center', borderRadius: '4px', marginBottom: '10px' }} />
            )}
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p><strong>Price:</strong> ₹{product.price}</p>
            <p><strong>Category:</strong> {product.categoryName}</p>
            <p><strong>Status:</strong> {product.available ? 'Available' : 'Unavailable'}</p>
            <div style={{ marginTop: '15px' }}>
              <button onClick={() => handleEdit(product)} className="btn btn-secondary" style={{ marginRight: '10px' }}>
                Edit
              </button>
              <button onClick={() => handleDelete(product.id)} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {data.content.length === 0 && !showForm && !loading && (
        <p>No listings yet. Click "Add Listing" to get started.</p>
      )}
      {data.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default MyProducts;
