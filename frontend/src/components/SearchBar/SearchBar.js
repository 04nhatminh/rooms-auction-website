import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../contexts/LocationContext';
import LocationSuggestionDropdown from '../LocationSuggestionDropdown/LocationSuggestionDropdown';
import GuestCounterDropdown from '../GuestCounterDropdown/GuestCounterDropdown';
import searchIcon from '../../assets/search.png';
import './SearchBar.css';

const SearchBar = ({ 
  onClose,
  initialSearchData = {},
  initialGuestCounts = { adults: 1, children: 0, infants: 0 },
  initialLocationId = null,
  initialType = null,
  onSearchDataUpdate,
  onGuestCountsUpdate,
  onLocationUpdate
}) => {
  const navigate = useNavigate();
  const { 
    popularLocations, 
    getLocationSuggestions, 
    hasLoadedAllData,
    isLoadingAll 
  } = useLocation();
  
  // State để lưu trữ các giá trị input
  const [searchData, setSearchData] = useState({
    location: initialSearchData.location || '',
    checkinDate: initialSearchData.checkinDate || '',
    checkoutDate: initialSearchData.checkoutDate || '',
    guests: initialSearchData.guests || ''
  });

  // State cho id của location đã chọn
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [selectedType, setSelectedType] = useState(initialType);

  // State cho guest counter
  const [guestCounts, setGuestCounts] = useState(initialGuestCounts);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  // State cho location suggestion
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs
  const locationInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const guestInputRef = useRef(null);
  const guestDropdownRef = useRef(null);

  // Helpers định dạng 'YYYY-MM-DD'
  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const addDaysStr = (yyyyMMdd, days) => {
    const [y, m, d] = yyyyMMdd.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    // Trả về string theo local (không UTC) để hợp với input[type=date]
    return fmt(new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  };

  // Hôm nay (local)
  const [todayStr] = useState(() => fmt(new Date()));

  // Hàm xử lý thay đổi input
  const handleInputChange = (field, value) => {
    // Không cho phép thay đổi guests input trực tiếp
    if (field === 'guests') {
      return;
    }
    
    const newSearchData = { ...searchData, [field]: value };

    // Ràng buộc ngày:
    if (field === 'checkinDate') {
      // Không cho check-in < hôm nay
      if (value && value < todayStr) {
        newSearchData.checkinDate = todayStr;
      }
      // Nếu đã có checkout nhưng checkout <= checkin -> sửa checkout = checkin + 1
      if (newSearchData.checkoutDate) {
        const minCheckout = addDaysStr(newSearchData.checkinDate || todayStr, 1);
        if (newSearchData.checkoutDate <= (newSearchData.checkinDate || todayStr)) {
          newSearchData.checkoutDate = minCheckout;
        }
      }
    }

    if (field === 'checkoutDate') {
      // checkout phải > checkin (nếu có checkin); nếu chưa có checkin thì tối thiểu >= hôm nay
      const checkin = newSearchData.checkinDate;
      if (checkin) {
        const minCheckout = addDaysStr(checkin, 1);
        if (value && value <= checkin) {
          newSearchData.checkoutDate = minCheckout;
        }
      } else {
        // Chưa có checkin: không cho chọn quá khứ
        if (value && value < todayStr) {
          newSearchData.checkoutDate = todayStr; // hoặc addDaysStr(todayStr, 1) nếu muốn luôn ≥ hôm nay + 1
        }
      }
    }
    
    setSearchData(newSearchData);
    
    // Notify parent of changes
    if (onSearchDataUpdate) {
      onSearchDataUpdate(newSearchData);
    }

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

    // Bỏ logic ẩn suggestions khi < 1 ký tự vì điều kiện trên đã xử lý
    // Bây giờ sẽ search ngay cả với 1 ký tự để cập nhật suggestions khi xóa text

    // Debounce search để tránh gọi API liên tục
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const response = await getLocationSuggestions(searchTerm, 8);
        
        if (response.success) {
          setSuggestions(response.data.suggestions || []);
          setShowSuggestions(true);
          setSelectedSuggestionIndex(-1);
        } else {
          // Fallback: filter popular locations nếu API fail
        const filteredPopular = popularLocations.filter(location => {
          const nm = location.name ?? location.Name ?? '';
          const dt = location.displayText ?? '';
          const term = searchTerm.toLowerCase();
          return (
            (nm && nm.toLowerCase().includes(term)) ||
            (dt && dt.toLowerCase().includes(term))
          );
        }).slice(0, 8);
          
          setSuggestions(filteredPopular);
          setShowSuggestions(true);
          setSelectedSuggestionIndex(-1);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        
        // Fallback: filter popular locations nếu API fail
      const term = searchTerm.toLowerCase();
      const filteredPopular = popularLocations.filter(location => {
        const nm = location.name ?? location.Name ?? '';
        const dt = location.displayText ?? '';
        return (
          (nm && nm.toLowerCase().includes(term)) ||
          (dt && dt.toLowerCase().includes(term))
        );
      }).slice(0, 8);
        
        setSuggestions(filteredPopular);
        setShowSuggestions(filteredPopular.length > 0);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 200); // Giảm delay xuống 200ms cho UX tốt hơn
  };

  // Nếu popularLocations vừa load xong trong lúc input trống -> cập nhật dropdown
  useEffect(() => {
    if (!searchData.location || searchData.location.trim().length === 0) {
      setSuggestions(popularLocations.slice(0, 8));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popularLocations]);

  // Hàm chọn suggestion
  const handleSuggestionClick = (suggestion) => {
    console.log('🔍 Suggestion clicked:', suggestion);
    
    const newSearchData = {
      ...searchData,
      location: suggestion.displayText
    };
    
    setSearchData(newSearchData);
    setSelectedLocationId(suggestion.id);
    setSelectedType(suggestion.type);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    console.log('🔍 Updated location info:', {
      locationId: suggestion.id,
      type: suggestion.type,
      displayText: suggestion.displayText
    });
    
    // Notify parent of changes
    if (onSearchDataUpdate) {
      onSearchDataUpdate(newSearchData);
    }
    if (onLocationUpdate) {
      onLocationUpdate(suggestion.id, suggestion.type);
    }
  };

  // Hàm xử lý thay đổi guest count
  const handleGuestCountChange = (type, count) => {
    const newGuestCounts = {
      ...guestCounts,
      [type]: count
    };
    
    setGuestCounts(newGuestCounts);
    
    // Cập nhật display text cho guest input
    updateGuestDisplayText(newGuestCounts);
    
    // Notify parent of changes
    if (onGuestCountsUpdate) {
      onGuestCountsUpdate(newGuestCounts);
    }
  };

  // Hàm cập nhật text hiển thị cho guest input
  const updateGuestDisplayText = (counts) => {
    const totalGuests = counts.adults + counts.children;
    let displayText = '';
    
    if (totalGuests === 0) {
      displayText = '';
    } else if (totalGuests === 1) {
      displayText = '1 khách';
    } else {
      displayText = `${totalGuests} khách`;
    }
    
    // Thêm thông tin em bé nếu có
    if (counts.infants > 0) {
      if (displayText) {
        displayText += `, ${counts.infants} em bé`;
      } else {
        displayText = `${counts.infants} em bé`;
      }
    }
    
    const newSearchData = {
      ...searchData,
      guests: displayText
    };
    
    setSearchData(newSearchData);
    
    // Notify parent of changes
    if (onSearchDataUpdate) {
      onSearchDataUpdate(newSearchData);
    }
  };

  // Hàm xử lý focus vào guest input
  const handleGuestFocus = () => {
    setShowGuestDropdown(true);
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

  // Xử lý click outside để đóng suggestions và guest dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Xử lý location suggestions
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          locationInputRef.current && !locationInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
      
      // Xử lý guest dropdown
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(event.target) &&
          guestInputRef.current && !guestInputRef.current.contains(event.target)) {
        setShowGuestDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Khởi tạo guest display text ban đầu
  useEffect(() => {
    updateGuestDisplayText(guestCounts);
  }, []); // Only run once on mount

  // Hiển thị popular locations khi focus vào input trống
  const handleLocationFocus = () => {
    if (!searchData.location || searchData.location.trim().length === 0) {
      setSuggestions(popularLocations.slice(0, 8));
      setShowSuggestions(true);
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra field Địa điểm không được trống
    if (!searchData.location.trim()) {
      alert('Vui lòng nhập địa điểm!');
      return;
    }

    // Đóng suggestions và dropdowns
    setShowSuggestions(false);
    setShowGuestDropdown(false);

    // Tạo guest string từ guest counts
    const totalGuests = guestCounts.adults + guestCounts.children;

    let finalLocationId = selectedLocationId;
    let finalType = selectedType;

    // Nếu chưa có locationId (user gõ tự do mà không chọn từ dropdown)
    // thì thử tìm kiếm để lấy locationId
    if (!selectedLocationId || selectedLocationId === 'None') {
      console.log('🔍 No locationId selected, trying to find matching location...');
      try {
        const response = await getLocationSuggestions(searchData.location.trim(), 1);
        if (response.success && response.data.suggestions.length > 0) {
          const firstMatch = response.data.suggestions[0];
          finalLocationId = firstMatch.id;
          finalType = firstMatch.type;
          console.log('🔍 Found matching location:', firstMatch);
        }
      } catch (error) {
        console.error('🔍 Error finding location:', error);
      }
    }

    console.log('🔍 Submit search with data:', {
      location: searchData.location,
      selectedLocationId,
      selectedType,
      finalLocationId,
      finalType,
      searchData,
      guestCounts
    });

    // Lấy thông tin từ các input, nếu trống thì là 'None'
    const searchParams = new URLSearchParams({
      location: searchData.location.trim()
                  .replace(/\s+/g, '-') || 'None'
                  .toLowerCase(),
      locationId: finalLocationId || 'None',
      type: finalType || 'None',
      checkinDate: searchData.checkinDate || 'None',
      checkoutDate: searchData.checkoutDate || 'None',
      numAdults: guestCounts.adults || 0,
      numChildren: guestCounts.children || 0,
      numInfants: guestCounts.infants || 0
    });

    console.log('🔍 Search URL params:', searchParams.toString());

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
            min={todayStr}
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
            min={searchData.checkinDate ? addDaysStr(searchData.checkinDate, 1) : todayStr}
          />
        </div>
        <div className="search-input guest-input-wrapper">
          <label>Khách</label>
          <input 
            ref={guestInputRef}
            type="text" 
            placeholder="Thêm khách" 
            value={searchData.guests}
            onChange={(e) => handleInputChange('guests', e.target.value)}
            onFocus={handleGuestFocus}
            readOnly
            style={{ cursor: 'pointer' }}
          />
          
          {/* Guest Counter Dropdown */}
          <GuestCounterDropdown
            ref={guestDropdownRef}
            showDropdown={showGuestDropdown}
            guestCounts={guestCounts}
            onGuestCountChange={handleGuestCountChange}
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