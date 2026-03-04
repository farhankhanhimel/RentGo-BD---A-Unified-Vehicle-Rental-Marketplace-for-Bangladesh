import React, { useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';

/**
 * RouteInput — Reusable location input component for Fare Estimator.
 *
 * Provides Google Places Autocomplete search, pin-on-map button,
 * and optional "Use My Location" / city dropdown support.
 *
 * Props:
 *  - label: string (e.g. "Pickup Location", "Destination")
 *  - value: { address, lat, lng } — current location value
 *  - onChange: (location) => void — called when location changes
 *  - onClear: () => void — clear the location
 *  - dotClass: string — CSS class for the colored dot ("pickup-dot" or "destination-dot")
 *  - badgeIcon: string — emoji for the selected-location badge
 *  - badgeClass: string — CSS class for the badge ("pickup-badge" or "destination-badge")
 *  - placeholder: string — input placeholder text
 *  - isLoaded: boolean — whether Google Maps JS API is loaded
 *  - activePin: string|null — current active pin mode
 *  - pinType: string — this input's pin type ("pickup" or "destination")
 *  - onTogglePin: (pinType) => void — toggle pin-on-map mode
 *  - children: React.ReactNode — optional extra content (e.g. city dropdowns, geolocation button)
 */
const RouteInput = ({
  label,
  value,
  onChange,
  onClear,
  dotClass,
  badgeIcon,
  badgeClass,
  placeholder,
  isLoaded,
  activePin,
  pinType,
  onTogglePin,
  children,
}) => {
  const autocompleteRef = useRef(null);

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        onChange({
          address: place.formatted_address || place.name,
          lat,
          lng,
        });
      }
    }
  };

  return (
    <div className="location-section">
      <div className="section-header">
        <span className={`route-dot ${dotClass}`}></span>
        <h3>{label}</h3>
      </div>

      {/* Optional extra content (geolocation button, city dropdowns, etc.) */}
      {children}

      {/* Autocomplete Search */}
      {isLoaded ? (
        <Autocomplete
          onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
          onPlaceChanged={onPlaceChanged}
          options={{
            componentRestrictions: { country: 'bd' },
            types: ['geocode', 'establishment'],
          }}
        >
          <div className="autocomplete-input-wrapper">
            <input
              type="text"
              placeholder={placeholder}
              value={value.address}
              onChange={(e) => onChange({ ...value, address: e.target.value })}
              className="location-search-input"
            />
            {value.address && (
              <button type="button" className="clear-input-btn" onClick={onClear}>
                ×
              </button>
            )}
          </div>
        </Autocomplete>
      ) : (
        <div className="autocomplete-input-wrapper">
          <input
            type="text"
            placeholder={placeholder}
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            className="location-search-input"
          />
          {value.address && (
            <button type="button" className="clear-input-btn" onClick={onClear}>
              ×
            </button>
          )}
        </div>
      )}

      {/* Pin on Map Button */}
      <div className="location-divider">
        <span>or</span>
      </div>

      <button
        type="button"
        className={`pin-on-map-btn ${activePin === pinType ? 'active' : ''}`}
        onClick={() => onTogglePin(pinType)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {activePin === pinType
          ? `Click map to set ${label.toLowerCase()}...`
          : `Pin ${label} on Map`}
      </button>

      {/* Selected Location Badge */}
      {value.lat && (
        <div className={`selected-location-badge ${badgeClass}`}>
          <span className="badge-icon">{badgeIcon}</span>
          <span className="badge-text">
            {value.address || `${Number(value.lat).toFixed(4)}, ${Number(value.lng).toFixed(4)}`}
          </span>
          <button type="button" className="badge-remove" onClick={onClear}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default RouteInput;
