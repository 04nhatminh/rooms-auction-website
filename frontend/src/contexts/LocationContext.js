import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import LocationAPI from '../api/locationApi';

const LocationContext = createContext();

// --- Helpers chuẩn hóa dữ liệu địa điểm ---
const normalizeProvince = (p) => {
  const id = p?.ProvinceCode ?? p?.code ?? p?.id ?? p?.Code ?? null;
  const Name = p?.Name ?? p?.name ?? '';
  const NameEn = p?.NameEn ?? p?.nameEn ?? '';
 return {
    ...p,
    id,
    type: 'province',
    Name,
    NameEn,
    displayText: Name,
    searchText: `${Name} ${NameEn}`.trim().toLowerCase(),
  };
};

const normalizeDistrict = (d) => {
  const id = d?.DistrictCode ?? d?.code ?? d?.id ?? d?.Code ?? null;
  const Name = d?.Name ?? d?.name ?? '';
  const NameEn = d?.NameEn ?? d?.nameEn ?? '';
  return {
    ...d,
    id,
    type: 'district',
    Name,
    NameEn,
    displayText: Name,
    searchText: `${Name} ${NameEn}`.trim().toLowerCase(),
  };
};

const normalizeGeneric = (item) => {
  // Dùng cho popular locations từ API, có thể là province hoặc district
  const type = item?.type ?? (item?.ProvinceCode || item?.Code ? 'province' : 'district');
  if (type === 'province') return normalizeProvince(item);
  return normalizeDistrict(item);
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [popularLocations, setPopularLocations] = useState([]);
  const [allProvinces, setAllProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allLocations, setAllLocations] = useState([]); // Mảng chứa tất cả locations để search
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [error, setError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hasLoadedAllData, setHasLoadedAllData] = useState(false);

  // Function để load tất cả provinces và districts
  const loadAllLocationsData = useCallback(async () => {
    if (hasLoadedAllData || isLoadingAll) {
      return;
    }

    try {
      console.log('Loading all provinces and districts...');
      setIsLoadingAll(true);
      setError(null);

      // Gọi API song song để lấy provinces và districts
      const [provincesResponse, districtsResponse] = await Promise.all([
        LocationAPI.getAllProvinces(),
        LocationAPI.getAllDistricts()
      ]);

      if (provincesResponse.success && districtsResponse.success) {
        const provincesRaw = provincesResponse.data || [];
        const districtsRaw = districtsResponse.data || [];
        const provinces = provincesRaw.map(normalizeProvince);
        const districts = districtsRaw.map(normalizeDistrict);

        console.log('🔍 DEBUG - Raw API responses:', {
          provincesResponse,
          districtsResponse,
          provincesSample: provinces.slice(0, 3), // Show first 3 items
          districtsSample: districts.slice(0, 3)
        });

        setAllProvinces(provinces);
        setAllDistricts(districts);

        // Tạo mảng tổng hợp để search
        const combinedLocations = [...provinces, ...districts];

        console.log('🔍 DEBUG - Combined locations sample:', {
          sampleProvinces: combinedLocations.filter(l => l.type === 'province').slice(0, 3),
          sampleDistricts: combinedLocations.filter(l => l.type === 'district').slice(0, 3),
          totalCombined: combinedLocations.length
        });

        setAllLocations(combinedLocations);
        setHasLoadedAllData(true);
        
        console.log('Successfully loaded all locations:', {
          provinces: provinces.length,
          districts: districts.length,
          total: combinedLocations.length
        });
      }
    } catch (err) {
      console.error('Error loading all locations:', err);
      setError(err.message);
    } finally {
      setIsLoadingAll(false);
    }
  }, [hasLoadedAllData, isLoadingAll]);

  // Function để search trong mảng local
  const searchInLocalData = useCallback((searchTerm, limit = 10) => {
    console.log('🔍 DEBUG - searchInLocalData called:', {
      searchTerm,
      limit,
      allLocationsLength: allLocations.length,
      allLocationsSample: allLocations.slice(0, 2)
    });

    if (!searchTerm || searchTerm.trim().length < 1) {
      console.log('🔍 DEBUG - Search term too short or empty');
      return [];
    }

    const term = searchTerm.toLowerCase().trim();
    
    // Tìm kiếm trong mảng allLocations
    const filtered = allLocations.filter(location => 
      location.searchText.includes(term) ||
      (location.Name && location.Name.toLowerCase().includes(term)) ||
      (location.displayText && location.displayText.toLowerCase().includes(term))
    );

    console.log('🔍 DEBUG - Filtered results:', {
      term,
      filteredCount: filtered.length,
      filteredSample: filtered.slice(0, 3)
    });

    // Sắp xếp theo độ ưu tiên: exact match trước, sau đó theo độ dài tên
    const sorted = filtered.sort((a, b) => {
      const aExact = a.Name.toLowerCase() === term;
      const bExact = b.Name.toLowerCase() === term;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      const aStartsWith = a.Name.toLowerCase().startsWith(term);
      const bStartsWith = b.Name.toLowerCase().startsWith(term);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return a.Name.length - b.Name.length;
    });

    const result = sorted.slice(0, limit);
    console.log('🔍 DEBUG - Final sorted results:', {
      sortedCount: sorted.length,
      finalResultCount: result.length,
      finalResults: result
    });

    return result;
  }, [allLocations]);

  // Function để search locations với fallback đến popular locations
  const searchLocations = async (searchTerm, limit = 10) => {
    try {
      if (!searchTerm || searchTerm.trim().length < 1) {
        // Trả về top popular locations nếu không có search term
        return await getPopularLocations(limit);
      }

      // Nếu đã load được tất cả data, search trong local
      if (hasLoadedAllData && allLocations.length > 0) {
        const localResults = searchInLocalData(searchTerm, limit);
        return {
          success: true,
          data: {
            searchTerm,
            suggestions: localResults,
            source: 'local'
          }
        };
      }

      // Nếu chưa có data local, gọi API
      const response = await LocationAPI.searchLocations(searchTerm, limit);
      if (response?.success) {
        return {
          ...response,
          data: {
            ...response.data,
            suggestions: (response.data?.suggestions ?? []).map(normalizeGeneric),
          },
        };
      }
      return response;
    } catch (error) {
      console.error('Error searching locations:', error);
      
      // Fallback: filter popular locations nếu API fail
      const filteredPopular = popularLocations.filter(location => 
        (location.Name && location.Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (location.displayText && location.displayText.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, limit);

      return {
        success: true,
        data: {
          suggestions: filteredPopular
        }
      };
    }
  };

  // Function để lấy location suggestions theo từ khóa
  const getLocationSuggestions = async (searchTerm, limit = 10) => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      // Trả về popular locations nếu không có search term
      return await getPopularLocations(limit);
    }
    
    try {
      // Nếu đã load được tất cả data, search trong local
      if (hasLoadedAllData && allLocations.length > 0) {
        const localResults = searchInLocalData(searchTerm, limit);
        return {
          success: true,
          data: {
            searchTerm,
            suggestions: localResults,
            source: 'local'
          }
        };
      }

      // Nếu chưa có data local, gọi API
      const response = await LocationAPI.searchLocations(searchTerm, limit);
      if (response?.success) {
        return {
          ...response,
          data: {
            ...response.data,
            suggestions: (response.data?.suggestions ?? []).map(normalizeGeneric),
          },
        };
      }
      return response;
    } catch (error) {
      console.error('Error getting location suggestions:', error);
      
      // Fallback: filter popular locations nếu API fail
      const filteredPopular = popularLocations.filter(location => 
        (location.Name && location.Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (location.displayText && location.displayText.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, limit);

      return {
        success: true,
        data: {
          suggestions: filteredPopular
        }
      };
    }
  };

  // Function để lấy popular locations (với cache)
  const getPopularLocations = useCallback(async (limit = 5) => {
    // Nếu đã có data và đủ số lượng yêu cầu thì trả về luôn
    if (popularLocations.length >= limit && hasInitialized) {
      console.log('Using cached popular locations:', popularLocations.length);
      return {
        success: true,
        data: {
          suggestions: popularLocations.slice(0, limit)
        }
      };
    }

    // Nếu đang loading thì đợi
    if (isLoading) {
      console.log('Already loading, waiting...');
      return new Promise((resolve) => {
        const checkLoading = setInterval(() => {
          if (!isLoading) {
            clearInterval(checkLoading);
            resolve({
              success: true,
              data: {
                suggestions: popularLocations.slice(0, limit)
              }
            });
          }
        }, 100);
      });
    }

    // Nếu chưa có data hoặc không đủ, gọi API
    try {
      console.log('Fetching popular locations from API...');
      setIsLoading(true);
      setError(null);
      
      const response = await LocationAPI.getPopularLocations(limit);
      
      if (response.success) {
        const normalized = (response.data?.suggestions ?? []).map(normalizeGeneric);
        setPopularLocations(normalized);
        setHasInitialized(true);
        console.log('Successfully loaded popular locations:', normalized.length || 0);
        return { success: true, data: { suggestions: normalized.slice(0, limit) } };
      }
      
      return response;
    } catch (err) {
      console.error('Error fetching popular locations:', err);
      setError(err.message);
      return {
        success: false,
        message: err.message,
        data: { suggestions: [] }
      };
    } finally {
      setIsLoading(false);
    }
  }, [popularLocations, isLoading, hasInitialized]);

  // Auto load all locations data khi provider được mount
  useEffect(() => {
    loadAllLocationsData();
  }, [loadAllLocationsData]);

  // Debug effect để theo dõi allLocations
  useEffect(() => {
    console.log('🔍 DEBUG - allLocations changed:', {
      length: allLocations.length,
      hasLoadedAllData,
      sample: allLocations.slice(0, 5)
    });
  }, [allLocations, hasLoadedAllData]);

  const value = {
    popularLocations,
    allProvinces,
    allDistricts,
    allLocations,
    isLoading,
    isLoadingAll,
    error,
    hasLoadedAllData,
    searchLocations,
    getLocationSuggestions,
    getPopularLocations,
    loadAllLocationsData,
    searchInLocalData
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
