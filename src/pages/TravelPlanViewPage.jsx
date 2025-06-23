import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import './TravelPlanViewPage.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Logo from '@/components/ui/Logo';
import { getSavedPlans } from '@/utils/plans';

// Fix default icon path for leaflet in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Configure default icon
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const wrIcon = L.divIcon({
  className: 'wr-marker',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export default function TravelPlanViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const p = getSavedPlans().find((pl) => String(pl.timestamp) === id);
    if (!p) {
      navigate('/plans');
    } else {
      setPlan(p);
    }
  }, [id, navigate]);

  if (!plan) return null;

  const coords = plan.locations.map((l) => l.location?.coordinates).filter(Boolean);

  const center = coords.length ? [coords[0].lat, coords[0].lng] : [36.1, 28.1];
  const rhodesBounds = [[35.8, 27.6],[36.6, 28.4]];

  function FitBounds() {
    const map = useMap();
    useEffect(() => {
      if (coords.length > 1) {
        const bounds = coords.map((c) => [c.lat, c.lng]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }, [map]);
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-[#1a1f3d] text-[#F4E1C1]">
      {/* header */}
      <header className="flex items-center gap-2 px-4 py-3 bg-[#1a1f3d]">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition"
        >
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <path d="M13.5 17L7.5 10L13.5 3" stroke="#F4E1C1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button onClick={() => navigate('/')} className="flex items-center group">
          <Logo className="h-6 group-hover:opacity-90 transition" />
        </button>
        <h2 className="ml-2 text-lg font-semibold truncate flex-1">{plan.title}</h2>
        <button
          onClick={() => navigate(`/chat?plan=${id}`)}
          className="ml-auto px-3 py-1 text-sm rounded-full bg-[#E8D5A4] text-[#242b50] hover:bg-[#CAB17B] transition"
        >
          Chat
        </button>
      </header>

      {/* map */}
      <div className="flex-1">
        <MapContainer
          center={center}
          zoom={10}
          minZoom={9}
          maxBounds={rhodesBounds}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          {plan.locations.map((loc, idx) => {
            const c = loc.location?.coordinates;
            if (!c) return null;
            return (
              <Marker key={idx} icon={wrIcon} position={[c.lat, c.lng]}>
                <Popup className="wr-popup">
                  <div className="text-sm space-y-1">
                    <div className="font-semibold text-[#E8D5A4]">{loc.name}</div>
                    <div className="text-[#F4E1C1]/80">{loc.description?.slice(0, 120) || ''}</div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + ' ' + (loc.location?.address || 'Rhodes'))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-1 text-xs text-[#E8D5A4] underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          <FitBounds />
        </MapContainer>
      </div>
    </div>
  );
} 