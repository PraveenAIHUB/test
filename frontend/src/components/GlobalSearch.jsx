import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/global-search.css';

import { API_URL } from '../config/api';
const API_BASE_URL = API_URL;

function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    const delaySearch = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async (query) => {
    try {
      setIsSearching(true);
      const response = await axios.get(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data.data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result) => {
    setShowResults(false);
    setSearchQuery('');
    navigate(result.url);
  };

  const getTotalResults = () => {
    if (!searchResults) return 0;
    return Object.values(searchResults).reduce((sum, category) => sum + category.length, 0);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      properties: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
      tenants: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>',
      leases: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>',
      assets: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>',
      workorders: '<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>',
      financials: '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>',
      maintenance: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>',
      vendors: '<circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle>',
      energy: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>'
    };
    return icons[category] || '';
  };

  return (
    <div className="global-search" ref={searchRef}>
      <div className="search-input-container">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search properties, tenants, leases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
        />
        {isSearching && (
          <div className="search-spinner"></div>
        )}
        {searchQuery && (
          <button className="search-clear" onClick={() => { setSearchQuery(''); setShowResults(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults && (
        <div className="search-results-dropdown">
          <div className="search-results-header">
            <span className="search-results-count">{getTotalResults()} results found</span>
          </div>
          <div className="search-results-content">
            {Object.entries(searchResults).map(([category, results]) => (
              results.length > 0 && (
                <div key={category} className="search-category">
                  <div className="search-category-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <g dangerouslySetInnerHTML={{ __html: getCategoryIcon(category) }} />
                    </svg>
                    <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                    <span className="search-category-count">{results.length}</span>
                  </div>
                  <div className="search-category-results">
                    {results.map((result, index) => (
                      <div key={index} className="search-result-item" onClick={() => handleResultClick(result)}>
                        <div className="search-result-title">{result.title}</div>
                        <div className="search-result-subtitle">{result.subtitle}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {showResults && searchQuery.length >= 2 && getTotalResults() === 0 && !isSearching && (
        <div className="search-results-dropdown">
          <div className="search-no-results">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <p>No results found for "{searchQuery}"</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;

