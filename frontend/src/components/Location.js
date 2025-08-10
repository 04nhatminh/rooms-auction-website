import React, { useEffect, useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { useProduct } from '../contexts/ProductContext';

const getName = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'object') {
    if (typeof v.Name === 'string') return v.Name.trim();      // MySQL alias
    if (typeof v.name === 'string') return v.name.trim();      // other sources
  }
  return '';
};

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN; // CRA fallback
console.log('token:', process.env.REACT_APP_MAPBOX_TOKEN); 

const Location = ({ lat: latProp, lng: lngProp, label: labelProp, zoom = 14 }) => {
  const { data } = useProduct() || {};

  const district = getName(data?.districtName);
  const province = getName(data?.provinceName);

  // Pull coords from props first, then context (support multiple field names)
  const latRaw = latProp ?? data?.details?.Latitude ?? data?.Latitude ?? null;
  const lngRaw =
    lngProp ??
    data?.details?.Longitude ??
    data?.Longitude ??
    data?.Longtitude ?? // fallback if your DB spells it this way
    null;

  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  const location = [district, province].filter(Boolean).join(', ');
  const label = labelProp ?? (location || 'Vị trí');

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!MAPBOX_TOKEN) {
      console.warn('Missing Mapbox token (VITE_MAPBOX_TOKEN / REACT_APP_MAPBOX_TOKEN).');
      return;
    }
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: Number.isFinite(lat) && Number.isFinite(lng) ? [lng, lat] : [108.458313, 11.940419], // Dalat fallback [lng, lat]
      zoom
    });

    const marker = new mapboxgl.Marker();
    markerRef.current = marker;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // zoom only affects initial state; keep it here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  // update center + marker when coords/label change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      mapRef.current.setCenter([lng, lat]);
      markerRef.current
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 24 }).setText(label))
        .addTo(mapRef.current);
    }
  }, [lat, lng, label]);

  return (
    <div className="location-section">
      <h3>Nơi bạn sẽ đến</h3>
      <span>{label}</span>
      <div
        ref={containerRef}
        style={{ width: '100%', height: 360, borderRadius: 12, overflow: 'hidden' }}
      />
    </div>
  );
};

export default Location;
