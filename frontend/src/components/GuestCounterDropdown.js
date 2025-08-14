import React, { forwardRef } from 'react';
import './GuestCounterDropdown.css';

const GuestCounterDropdown = forwardRef(({ 
  showDropdown, 
  guestCounts,
  onGuestCountChange,
  className = ''
}, ref) => {
  
  if (!showDropdown) return null;

  const handleIncrement = (type) => {
    onGuestCountChange(type, guestCounts[type] + 1);
  };

  const handleDecrement = (type) => {
    if (guestCounts[type] > 0) {
      onGuestCountChange(type, guestCounts[type] - 1);
    }
  };

  const guestTypes = [
    {
      key: 'adults',
      label: 'Người lớn',
      description: 'Từ 13 tuổi trở lên',
      min: 1
    },
    {
      key: 'children',
      label: 'Trẻ em',
      description: 'Từ 2-12 tuổi',
      min: 0
    },
    {
      key: 'infants',
      label: 'Em bé',
      description: 'Dưới 2 tuổi',
      min: 0
    }
  ];

  return (
    <div 
      ref={ref} 
      className={`guest-counter-dropdown ${className} ${showDropdown ? 'show' : ''}`}
    >
      <div className="guest-counter-card">
        {guestTypes.map((guestType) => (
          <div key={guestType.key} className="guest-counter-row">
            <div className="guest-info">
              <div className="guest-label">{guestType.label}</div>
              <div className="guest-description">{guestType.description}</div>
            </div>
            <div className="guest-controls">
              <button 
                type="button"
                className={`guest-button decrease ${guestCounts[guestType.key] <= guestType.min ? 'disabled' : ''}`}
                onClick={() => handleDecrement(guestType.key)}
                disabled={guestCounts[guestType.key] <= guestType.min}
              >
                -
              </button>
              <span className="guest-count">{guestCounts[guestType.key]}</span>
              <button 
                type="button"
                className="guest-button increase"
                onClick={() => handleIncrement(guestType.key)}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

GuestCounterDropdown.displayName = 'GuestCounterDropdown';

export default GuestCounterDropdown;
