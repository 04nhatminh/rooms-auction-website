const fetch = require('node-fetch');

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 giờ
const cache = new Map();             // key: "geocode:<q>", value: {lat,lng,label,exp}

function getCache(key) {
    const v = cache.get(key);
    if (!v) return null;
    if (Date.now() > v.exp) { cache.delete(key); return null; }
    return v.data;
}

function setCache(key, data, ttl = CACHE_TTL_MS) {
    cache.set(key, { data, exp: Date.now() + ttl });
}

// Geocode with Nominatim (VN)
// q - full address text, ví dụ: "12 Nguyễn Huệ, Quận 1, TP.HCM, Việt Nam"
// returns {Promise<{found:boolean, lat?:number, lng?:number, label?:string}>
async function geocode(q) {
    const key = `geocode:${q.toLowerCase()}`;
    const cached = getCache(key);
    if (cached) return { fromCache: true, ...cached };

    const params = new URLSearchParams({
        q,
        format: 'json',
        addressdetails: '1',
        limit: '1',
        countrycodes: 'vn',
        email: process.env.NOMINATIM_EMAIL || ''
    });

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    const r = await fetch(url, {
        headers: {
        // Theo policy phải có UA nhận diện + contact
        'User-Agent': `A2BnB-Geocoder/1.0 (${process.env.NOMINATIM_EMAIL || 'bidstay@gmail.com'})`,
        'Accept': 'application/json'
        },
        timeout: 10_000
    });

    if (!r.ok) throw new Error(`Nominatim HTTP ${r.status}`);
    const arr = await r.json();

    if (!Array.isArray(arr) || arr.length === 0) {
        const miss = { found: false };
        setCache(key, miss);
        return miss;
    }

    const { lat, lon, display_name } = arr[0];
    const hit = { found: true, lat: Number(lat), lng: Number(lon), label: display_name };
    setCache(key, hit);
    return hit;
}

module.exports = { geocode };
