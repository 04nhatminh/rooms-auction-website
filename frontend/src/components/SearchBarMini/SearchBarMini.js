import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useLocation } from '../../contexts/LocationContext';
import LocationSuggestionDropdown from '../LocationSuggestionDropdown/LocationSuggestionDropdown';
import GuestCounterDropdown from '../GuestCounterDropdown/GuestCounterDropdown';
import searchIcon from '../../assets/search.png';
import './SearchBarMini.css';

const SearchBarMini = ({ 
  receivedSearchData = {},
  initialGuestCounts = { adults: 1, children: 0, infants: 0 },
  initialLocationId = null,
  initialLocationType = null,
  onSearchDataUpdate,
  onGuestCountsUpdate,
  onLocationUpdate,
  onSearchSubmit
}) => {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { popularLocations, getLocationSuggestions } = useLocation();

  // State lưu thông tin search: địa điểm, ngày checkin, checkout, và text hiển thị số khách
  const [searchData, setSearchData] = useState({
    location: receivedSearchData.location || '',
    checkinDate: receivedSearchData.checkinDate || '',
    checkoutDate: receivedSearchData.checkoutDate || '',
    guests: receivedSearchData.guests || ''
  });

  // State lưu id và type của location được chọn
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [selectedLocationType, setSelectedLocationType] = useState(initialLocationType);

  // State lưu số khách từng loại (người lớn, trẻ em, em bé), trạng thái guest dropdown
  const [guestCounts, setGuestCounts] = useState(initialGuestCounts);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  // State lưu thông tin cho dropdown location
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Refs
  const locationInputRef = useRef(null); // Ref ô input địa điểm, check click không nằm trong input thì đóng dropdown gợi ý
  const suggestionsRef = useRef(null); // Ref LocationSuggestionDropdown, nếu click ngoài cả input và dropdown thì đóng danh sách gợi ý
  const searchTimeoutRef = useRef(null); // Biến lưu timer trong cơ chế debounce search
  const guestInputRef = useRef(null); // Ref ô input số khách, khi user click ra ngoài input thì đóng dropdown chọn số khách
  const guestDropdownRef = useRef(null); // Ref GuestCounterDropdown, nếu click ngoài cả input khách và dropdown khách thì đóng dropdown


  // ====== Helper function format hiển thị ======
  // Hiển thị location text
  const getLocationText = () => {
    if (searchData.location && searchData.location.trim()) {
      const locationName = searchData.location.replace(/_/g, ' ');
      return `${locationName}`;
    }
    return '';
  };


  // ====== Helper function để search ======
  // Helpers định dạng 'YYYY-MM-DD'
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const addDaysStr = (yyyyMMdd, days) => {
    const [y, m, d] = yyyyMMdd.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    // Trả về string theo local (không UTC) để hợp với input[type=date]
    return formatDate(new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
  };

  // Hôm nay (local)
  const [todayStr] = useState(() => formatDate(new Date()));


  // ====== Handle input change ======
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
    
    // Callback để thông báo thay đổi
    if (onSearchDataUpdate) {
      onSearchDataUpdate(newSearchData);
    }

    // Nếu là location field, thực hiện search suggestions
    if (field === 'location') {
      handleLocationSearch(value);
    }
  };


  // ====== Handle location change ======
  const handleLocationSearch = async (searchTerm) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    // Nếu searchTerm trống, hiển thị popular locations
    if (!searchTerm?.trim()) {
      setSuggestions(popularLocations.slice(0, 8));
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const response = await getLocationSuggestions(searchTerm, 8);

        if (response.success) {
          setSuggestions(response.data.suggestions || []);
        } else {
          setSuggestions(filterPopularLocations(searchTerm));
        }
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      } catch {
        setSuggestions(filterPopularLocations(searchTerm));
        setShowSuggestions(true);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 200);
  };

  // Lọc danh sách địa điểm phổ biến dựa trên từ khóa tìm kiếm
  const filterPopularLocations = (term) => {
    const t = term.toLowerCase();
    const filteredLocations = popularLocations.filter(location => {
      const name = location.name ?? location.Name ?? '';
      const display = location.displayText ?? '';
      return (name && name.toLowerCase().includes(t)) || 
            (display && display.toLowerCase().includes(t));
    });
    return filteredLocations.slice(0, 8);
  };

  // Xử lý khi người dùng nhấp vào gợi ý
  const handleSuggestionClick = (suggestion) => {
    const newSearchData = { ...searchData, location: suggestion.displayText };
    
    setSearchData(newSearchData);
    setSelectedLocationId(suggestion.id);
    setSelectedLocationType(suggestion.type);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);

    // Callback để thông báo thay đổi
    if (onSearchDataUpdate) { onSearchDataUpdate(newSearchData); }
    if (onLocationUpdate) { onLocationUpdate(suggestion.id, suggestion.type); }
  };


  // ====== Handle guest change ======
  const handleGuestCountChange = (type, count) => {
    const newGuestCounts = { ...guestCounts, [type]: count };

    setGuestCounts(newGuestCounts);
    updateGuestDisplayText(newGuestCounts);

    // Callback để thông báo thay đổi
    if (onGuestCountsUpdate) { onGuestCountsUpdate(newGuestCounts); }
  };

  // Cập nhật hiển thị cho số lượng khách
  const updateGuestDisplayText = (counts) => {
    const totalGuests = counts.adults + counts.children;

    let displayText = '';
    if (totalGuests === 0) { displayText = ''; } 
    else if (totalGuests === 1) { displayText = '1 khách'; } 
    else { displayText = `${totalGuests} khách`; }
    
    // // Thêm thông tin em bé nếu có
    // if (counts.infants > 0) {
    //   if (displayText) {
    //     displayText += `, ${counts.infants} em bé`;
    //   } else {
    //     displayText = `${counts.infants} em bé`;
    //   }
    // }
    
    const newSearchData = { ...searchData, guests: displayText };
    setSearchData(newSearchData);
    if (onSearchDataUpdate) { onSearchDataUpdate(newSearchData); }
  };


  // ====== Handle event ======
  const handleGuestFocus = () => {
    setShowGuestDropdown(true);
  };

  const handleLocationFocus = () => {
    if (!searchData.location || searchData.location.trim().length === 0) {
      setSuggestions(popularLocations.slice(0, 8));
    }
    setShowSuggestions(true);
  };

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

    let finalLocationId = selectedLocationId;
    let finalType = selectedLocationType;

    // Nếu chưa có locationId (user gõ tự do mà không chọn từ dropdown)
    // thì thử tìm kiếm để lấy locationId
    if (!selectedLocationId || selectedLocationId === 'None') {
      console.log('No locationId selected, trying to find matching location...');
      try {
        const response = await getLocationSuggestions(searchData.location.trim(), 1);
        if (response.success && response.data.suggestions.length > 0) {
          const firstMatch = response.data.suggestions[0];
          finalLocationId = firstMatch.id;
          finalType = firstMatch.type;
          console.log('Found matching location:', firstMatch);
        }
      } catch (error) {
        console.error('Error finding location:', error);
      }
    }

    // Lấy thông tin từ các input, nếu trống thì là 'None'
    const searchParams = new URLSearchParams({
      location: searchData.location.trim()
                  .replace(/\s+/g, '_') || 'None'
                  .toLowerCase(),
      locationId: finalLocationId || 'None',
      type: finalType || 'None',
      checkinDate: searchData.checkinDate || 'None',
      checkoutDate: searchData.checkoutDate || 'None',
      numAdults: guestCounts.adults || 0,
      numChildren: guestCounts.children || 0,
      numInfants: guestCounts.infants || 0
    });

    console.log('Search URL params:', searchParams.toString());

    // Kiểm tra xem hiện tại có đang ở trang search-result không
    const isOnSearchPage = routerLocation.pathname === '/search';

    if (isOnSearchPage && onSearchSubmit) {
      // Nếu đang ở search-result page và có callback onSearchSubmit, gọi callback để update data
      onSearchSubmit(searchParams);
    } else {
      // Nếu ở trang khác, navigate đến search-result page
      navigate(`/search?${searchParams.toString()}`);
    }
  };


  // ====== Effect ======
  // Cập nhật searchData khi nhận được dữ liệu mới
  useEffect(() => {
    if (receivedSearchData && Object.keys(receivedSearchData).length > 0) {
      setSearchData({
        location: (receivedSearchData.location) ? receivedSearchData.location : '',
        checkinDate: (receivedSearchData.checkinDate && receivedSearchData.checkinDate !== 'None') ? receivedSearchData.checkinDate : '',
        checkoutDate: (receivedSearchData.checkoutDate && receivedSearchData.checkoutDate !== 'None') ? receivedSearchData.checkoutDate : '',
        guests: (receivedSearchData.guests) ? receivedSearchData.guests : ''
      });

      if (receivedSearchData.locationId) {
        setSelectedLocationId(receivedSearchData.locationId);
      }
      if (receivedSearchData.locationType) {
        setSelectedLocationType(receivedSearchData.locationType);
      }

      // Cập nhật guest counts nếu có trong receivedSearchData
      if (receivedSearchData.guestCounts) {
        setGuestCounts(receivedSearchData.guestCounts);
      }
    }
  }, [receivedSearchData]);

  // Cập nhật giá trị khi initialLocationId, initialLocationType, initialGuestCounts thay đổi
  useEffect(() => {
    if (initialLocationId) {
      setSelectedLocationId(initialLocationId);
    }
  }, [initialLocationId]);

  useEffect(() => {
    if (initialLocationType) {
      setSelectedLocationType(initialLocationType);
    }
  }, [initialLocationType]);

  useEffect(() => {
    if (initialGuestCounts) {
      setGuestCounts(initialGuestCounts);
    }
  }, [initialGuestCounts]);

  // Nếu popularLocations vừa load xong trong lúc input trống -> cập nhật dropdown
  useEffect(() => {
    if (!searchData.location || searchData.location.trim().length === 0) {
      setSuggestions(popularLocations.slice(0, 8));
    }
  }, [popularLocations, searchData.location]);

  // Khởi tạo guest display text ban đầu
  useEffect(() => {
    updateGuestDisplayText(guestCounts);
  }, [guestCounts]);

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


  return (
    <div className="header-search-container">
      <form className="header-search-bar" onSubmit={handleSubmit}>
        <div className="header-search-input header-location-input-wrapper">
          <label>Địa điểm</label>
          <input 
            ref={locationInputRef}
            type="text" 
            placeholder="Tìm kiếm điểm đến" 
            value={getLocationText()}
            onChange={(e) => handleInputChange('location', e.target.value)}
            onFocus={handleLocationFocus}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            required
          />
          
          <LocationSuggestionDropdown
            ref={suggestionsRef}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            isLoading={isLoadingSuggestions}
            selectedIndex={selectedSuggestionIndex}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
        
        <div className="header-search-input">
          <label>Nhận phòng</label>
          <input 
            type="text" 
            placeholder="Thêm ngày" 
            value={searchData.checkinDate || ''}
            onChange={(e) => handleInputChange('checkinDate', e.target.value)}
            onFocus={(e) => e.target.type = 'date'} 
            onBlur={(e) => e.target.type = 'text'}
            min={todayStr}
          />
        </div>
        <div className="header-search-input">
          <label>Trả phòng</label>
          <input 
            type="text" 
            placeholder="Thêm ngày" 
            value={searchData.checkoutDate || ''}
            onChange={(e) => handleInputChange('checkoutDate', e.target.value)}
            onFocus={(e) => e.target.type = 'date'} 
            onBlur={(e) => e.target.type = 'text'}
            min={searchData.checkinDate ? addDaysStr(searchData.checkinDate, 1) : todayStr}
          />
        </div>
        <div className="header-search-input header-guest-input-wrapper">
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
          
          <GuestCounterDropdown
            ref={guestDropdownRef}
            showDropdown={showGuestDropdown}
            guestCounts={guestCounts}
            onGuestCountChange={handleGuestCountChange}
          />
        </div>
        
        <button type="submit" className="header-search-button">
          <img src={searchIcon} alt="Search" className='header-search-icon' />
        </button>
      </form>
    </div>
  );
};

export default SearchBarMini;