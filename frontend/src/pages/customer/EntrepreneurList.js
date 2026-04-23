import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import './EntrepreneurList.css';

const EntrepreneurList = () => {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [search, setSearch] = useState('');

  const fetchEntrepreneurs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size };
      if (search.trim()) {
        params.search = search.trim();
      }
      const response = await api.get('/entrepreneurs', { params });
      if (response.data.content) {
        setData(response.data);
      } else {
        // Fallback for non-paginated response
        setData({ content: response.data, totalPages: 1, totalElements: response.data.length });
      }
    } catch (error) {
      console.error('Error fetching entrepreneurs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, size]);

  useEffect(() => {
    fetchEntrepreneurs();
  }, [fetchEntrepreneurs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchEntrepreneurs();
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>Browse Entrepreneurs</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search by name, skills, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>

      <div className="grid">
        {data.content.map(entrepreneur => (
          <div key={entrepreneur.id} className="card">
            <h3>{entrepreneur.name}</h3>
            {entrepreneur.businessCategory && (
              <p><strong>Category:</strong> {entrepreneur.businessCategory}</p>
            )}
            <p><strong>Skills:</strong> {entrepreneur.skills || 'N/A'}</p>
            <p><strong>Experience:</strong> {entrepreneur.experience || 'N/A'}</p>
            {entrepreneur.shopName && (
              <p><strong>Shop:</strong> {entrepreneur.shopName}</p>
            )}
            {entrepreneur.shopAddress && (
              <p><strong>Address:</strong> {entrepreneur.shopAddress}</p>
            )}
            <p>
              <strong>Description:</strong>{' '}
              {entrepreneur.shopDescription || entrepreneur.description || 'No description available'}
            </p>
            <Link to={`/entrepreneurs/${entrepreneur.id}`} className="btn btn-primary">
              View Details
            </Link>
          </div>
        ))}
      </div>
      
      {data.content.length === 0 && !loading && (
        <p>No approved entrepreneurs available.</p>
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

export default EntrepreneurList;
