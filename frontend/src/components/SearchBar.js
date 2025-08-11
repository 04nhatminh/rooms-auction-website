import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LocationAPI from '../api/locationApi';
import LocationSuggestionDropdown from './LocationSuggestionDropdown';
import './SearchBar.css';
import searchIcon from '../assets/search.png';

const SearchBar = ({ popularLocations = [] }) => {
  const navigate = useNavigate();
  
  // State để lưu trữ các giá trị input
  const [searchData, setSearchData] = useState({
    location: '',
    checkinDate: '',
    checkoutDate: '',
    guests: ''
  });

  // State cho location suggestion
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs
  const locationInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Hàm xử lý thay đổi input
  const handleInputChange = (field, value) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));

    // Nếu là location field, thực hiện search suggestions
    if (field === 'location') {
      handleLocationSearch(value);
    }
  };

  // Hàm tìm kiếm location suggestions
  const handleLocationSearch = async (searchTerm) => {
    // Clear timeout cũ
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Nếu searchTerm trống, hiển thị popular locations
    if (!searchTerm || searchTerm.trim().length === 0) {
      setSuggestions(popularLocations.slice(0, 8));
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
      return;
    }

    // Nếu ít hơn 2 ký tự, ẩn suggestions
    if (searchTerm.trim().length < 2) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    // Debounce search để tránh gọi API liên tục
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const response = await LocationAPI.getLocationSuggestions(searchTerm, 8);
        
        if (response.success) {
          setSuggestions(response.data.suggestions || []);
          setShowSuggestions(true);
          setSelectedSuggestionIndex(-1);
        } else {
          // Fallback: filter popular locations nếu API fail
          const filteredPopular = popularLocations.filter(location => 
            location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.displayText?.toLowerCase().includes(searchTerm.toLowerCase())
          ).slice(0, 8);
          
          setSuggestions(filteredPopular);
          setShowSuggestions(true);
          setSelectedSuggestionIndex(-1);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        
        // Fallback: filter popular locations nếu API fail
        const filteredPopular = popularLocations.filter(location => 
          location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.displayText?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 8);
        
        setSuggestions(filteredPopular);
        setShowSuggestions(filteredPopular.length > 0);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300); // Delay 300ms
  };

  // Hàm chọn suggestion
  const handleSuggestionClick = (suggestion) => {
    setSearchData(prev => ({
      ...prev,
      location: suggestion.displayText
    }));
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
  };

  // Xử lý keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  // Xử lý click outside để đóng suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          locationInputRef.current && !locationInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Hiển thị popular locations khi focus vào input trống
  const handleLocationFocus = () => {
    if (!searchData.location || searchData.location.trim().length === 0) {
      setSuggestions(popularLocations.slice(0, 8));
      setShowSuggestions(true);
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Kiểm tra field Địa điểm không được trống
    if (!searchData.location.trim()) {
      alert('Vui lòng nhập địa điểm!');
      return;
    }

    // Đóng suggestions
    setShowSuggestions(false);

    // Lấy thông tin từ các input, nếu trống thì là 'None'
    const searchParams = new URLSearchParams({
      location: searchData.location.trim() || 'None',
      checkinDate: searchData.checkinDate || 'None',
      checkoutDate: searchData.checkoutDate || 'None',
      guests: searchData.guests.trim() || 'None'
    });

    // Log để kiểm tra dữ liệu
    console.log('Search Data:', {
      location: searchData.location.trim() || 'None',
      checkinDate: searchData.checkinDate || 'None',
      checkoutDate: searchData.checkoutDate || 'None',
      guests: searchData.guests.trim() || 'None'
    });

    // Navigate đến trang SearchResult với parameters
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="search-container">
      <form className="search-bar" onSubmit={handleSubmit}>
        <div className="search-input location-input-wrapper">
          <label>Địa điểm</label>
          <input 
            ref={locationInputRef}
            type="text" 
            placeholder="Tìm kiếm điểm đến" 
            value={searchData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            onFocus={handleLocationFocus}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            required
          />
          
          {/* Location Suggestions Dropdown - New Component */}
          <LocationSuggestionDropdown
            ref={suggestionsRef}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            isLoading={isLoadingSuggestions}
            selectedIndex={selectedSuggestionIndex}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
        
        <div className="search-input">
          <label>Nhận phòng</label>
          <input 
            type="text" 
            placeholder="Thêm ngày" 
            value={searchData.checkinDate}
            onChange={(e) => handleInputChange('checkinDate', e.target.value)}
            onFocus={(e) => e.target.type = 'date'} 
            onBlur={(e) => e.target.type = 'text'}
          />
        </div>
        <div className="search-input">
          <label>Trả phòng</label>
          <input 
            type="text" 
            placeholder="Thêm ngày" 
            value={searchData.checkoutDate}
            onChange={(e) => handleInputChange('checkoutDate', e.target.value)}
            onFocus={(e) => e.target.type = 'date'} 
            onBlur={(e) => e.target.type = 'text'}
          />
        </div>
        <div className="search-input">
          <label>Khách</label>
          <input 
            type="text" 
            placeholder="Thêm khách" 
            value={searchData.guests}
            onChange={(e) => handleInputChange('guests', e.target.value)}
          />
        </div>
        
        <button type="submit" className="search-button">
          <img src={searchIcon} alt="Search" className='search-icon' />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;