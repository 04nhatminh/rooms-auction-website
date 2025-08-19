import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import './Header.css';
import logo from '../../assets/logo.png';
import SearchBarMini from './SearchBarMini';
import HeaderUserMenu from '../HeaderUserMenu/HeaderUserMenu';
import SignInUpAction from '../SignInUpAction/SignInUpAction';
import LocationAPI from '../../api/locationApi';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();

  // Shared search state
  const [searchData, setSearchData] = useState({
    location: '',
    checkinDate: '',
    checkoutDate: '',
    guests: ''
  });

  const [guestCounts, setGuestCounts] = useState({
    adults: 1,
    children: 0,
    infants: 0
  });

  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Update guest display text when guest counts change
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
    
    // Add infant info if any
    if (counts.infants > 0) {
      if (displayText) {
        displayText += `, ${counts.infants} em bé`;
      } else {
        displayText = `${counts.infants} em bé`;
      }
    }
    
    setSearchData(prev => ({
      ...prev,
      guests: displayText
    }));
  };

  // Update guest display when guest counts change
  useEffect(() => {
    updateGuestDisplayText(guestCounts);
  }, [guestCounts]);

  // Extract and display search parameters from URL
  useEffect(() => {
    const updateSearchDataFromURL = async () => {
      const urlParams = new URLSearchParams(location.search);
      
      const locationId = urlParams.get('locationId');
      const type = urlParams.get('type');
      const checkinDate = urlParams.get('checkinDate');
      const checkoutDate = urlParams.get('checkoutDate');
      const numAdults = urlParams.get('numAdults');
      const numChildren = urlParams.get('numChildren');
      const numInfants = urlParams.get('numInfants');

      // Update location info
      let locationName = urlParams.get('location') || '';
      if (locationId && !locationName) {
        try {
          let locationData;
          if (type === 'district') {
            locationData = await LocationAPI.getDistrictDetails(locationId);
          } else {
            locationData = await LocationAPI.getProvinceDetails(locationId);
          }
          locationName = locationData?.data?.name || '';
        } catch (error) {
          console.error('Error fetching location details:', error);
        }
      }

      // Update guest counts if provided
      if (numAdults || numChildren || numInfants) {
        const newGuestCounts = {
          adults: parseInt(numAdults) || 1,
          children: parseInt(numChildren) || 0,
          infants: parseInt(numInfants) || 0
        };
        setGuestCounts(newGuestCounts);
      }

      // Update search data
      setSearchData(prev => ({
        ...prev,
        location: locationName,
        checkinDate: checkinDate || '',
        checkoutDate: checkoutDate || ''
      }));

      // Update selected location info
      if (locationId) {
        setSelectedLocationId(locationId);
        setSelectedType(type);
      }
    };

    updateSearchDataFromURL();
  }, [location.search]);

  // Handle data updates from SearchBar
  const handleSearchDataUpdate = (newData) => {
    setSearchData(newData);
  };

  const handleGuestCountsUpdate = (newCounts) => {
    setGuestCounts(newCounts);
  };

  const handleLocationUpdate = (locationId, type) => {
    setSelectedLocationId(locationId);
    setSelectedType(type);
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-logo">
          <Link to="/" >
            <img src={logo} alt="Logo" className="header-logo-image" />
            <span className="header-logo-text">bidstay</span>
          </Link>
        </div>

        <div className="header-mini">
          <SearchBarMini searchData={searchData} />
        </div>

        {isAuthenticated() ? (
          <HeaderUserMenu />
        ) : (
          <SignInUpAction type="others" />
        )}
      </div>
    </header>
  );
};

export default Header;
