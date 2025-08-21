import React, { forwardRef } from 'react';
import './LocationSuggestionDropdown.css';
import ProvinceIcon from '../../assets/province.png';
import DistrictIcon from '../../assets/district.png';

const LocationSuggestionDropdown = forwardRef(({ 
  suggestions, 
  showSuggestions, 
  isLoading, 
  selectedIndex, 
  onSuggestionClick,
  className = ''
}, ref) => {
  
  if (!showSuggestions || (!isLoading && suggestions.length === 0)) return null;

  return (
    <div 
      ref={ref} 
      className={`location-suggestions-dropdown ${className} ${showSuggestions ? 'show' : ''}`}
    >
      <div className="suggestions-card">
        {isLoading ? (
          <div className="suggestion-item loading">
            <div className="loading-spinner"></div>
            <span>Đang tìm kiếm...</span>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <div 
              key={`${suggestion.type}-${suggestion.id}`}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => onSuggestionClick(suggestion)}
            >
              <div className="suggestion-icon">
                {suggestion.type === 'province' ? (
                    <div style={{ backgroundColor: '#ffebeaff', padding: '8px 8px 4px 8px', borderRadius: '12px' }}>
                      <img src={ProvinceIcon} alt="Province" />
                    </div>
                ) : suggestion.type === 'district' ? (
                    <div style={{ backgroundColor: '#ecfcff', padding: '8px 8px 4px 8px', borderRadius: '12px' }}>
                      <img src={DistrictIcon} alt="District" />
                    </div>
                ) : null}
              </div>

              <div className="suggestion-content">
                <div className="suggestion-main">
                  <span className="suggestion-name">{suggestion.displayText}</span>
                  <span className="suggestion-type">{suggestion.secondaryText}</span>
                </div>
                {suggestion.productCount && (
                  <div className="suggestion-count">
                    {suggestion.productCount} chỗ ở
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

LocationSuggestionDropdown.displayName = 'LocationSuggestionDropdown';

export default LocationSuggestionDropdown;
