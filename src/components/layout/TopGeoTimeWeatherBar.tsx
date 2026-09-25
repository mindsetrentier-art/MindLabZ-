import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Clock,
  Calendar,
  Compass,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  Navigation,
  Pin,
  X,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface WeatherInfo {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
}

interface MapsGroundingLink {
  title: string;
  uri: string;
  snippet?: string;
}

interface GeoPositionState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  placeName: string;
  subLocality: string;
  city: string;
  country: string;
  source: 'gps-high-accuracy' | 'network-geo' | 'initializing';
}

function getWeatherVisuals(code: number, isDay = true) {
  if (code === 0) {
    return {
      labelFr: isDay ? 'Ensoleillé' : 'Ciel dégagé',
      labelZh: isDay ? '晴朗' : '晴夜',
      icon: Sun,
      color: 'text-[#F59E0B]',
    };
  }
  if (code === 1 || code === 2) {
    return {
      labelFr: 'Partiellement nuageux',
      labelZh: '多云间晴',
      icon: CloudSun,
      color: 'text-[#F59E0B]',
    };
  }
  if (code === 3 || code === 45 || code === 48) {
    return {
      labelFr: code === 3 ? 'Nuageux' : 'Brouillard',
      labelZh: code === 3 ? '阴天' : '雾',
      icon: Cloud,
      color: 'text-[#64748B]',
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      labelFr: 'Pluie',
      labelZh: '降雨',
      icon: CloudRain,
      color: 'text-[#3B82F6]',
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      labelFr: 'Neige',
      labelZh: '降雪',
      icon: Snowflake,
      color: 'text-[#06B6D4]',
    };
  }
  if (code >= 95) {
    return {
      labelFr: 'Orage',
      labelZh: '雷暴',
      icon: CloudLightning,
      color: 'text-[#8B5CF6]',
    };
  }
  return {
    labelFr: 'Tempéré',
    labelZh: '舒适',
    icon: CloudSun,
    color: 'text-[#6C4CF1]',
  };
}

interface TopGeoTimeWeatherBarProps {
  onVisibilityChange?: (visible: boolean, expanded: boolean) => void;
}

export const TopGeoTimeWeatherBar: React.FC<TopGeoTimeWeatherBarProps> = ({
  onVisibilityChange,
}) => {
  // Visibility & 5-second auto-hide state
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [remainingMs, setRemainingMs] = useState<number>(5000);

  // Real-time Date & Clock
  const [now, setNow] = useState<Date>(() => new Date());

  // GPS & Location state
  const [geoState, setGeoState] = useState<GeoPositionState>({
    latitude: 48.8566,
    longitude: 2.3522,
    accuracy: null,
    altitude: null,
    placeName: 'Acquisition GPS haute précision...',
    subLocality: '',
    city: '',
    country: '',
    source: 'initializing',
  });
  const [isLocating, setIsLocating] = useState<boolean>(true);

  // Real-time Weather state
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [mapsSummary, setMapsSummary] = useState<string | null>(null);
  const [mapsLinks, setMapsLinks] = useState<MapsGroundingLink[]>([]);
  const [loadingMapsGrounding, setLoadingMapsGrounding] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const lastFetchedCoordsRef = useRef<string>('');

  // Notify parent layout if needed
  useEffect(() => {
    onVisibilityChange?.(isVisible, isExpanded);
  }, [isVisible, isExpanded, onVisibilityChange]);

  // 1. Live Clock updating every second
  useEffect(() => {
    const clockInterval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(clockInterval);
  }, []);

  // 2. 5-Second Auto-Hide Countdown unless user tapped/clicked the bar (isPinned)
  useEffect(() => {
    if (!isVisible || isPinned) {
      return;
    }

    const duration = 5000;
    const startTime = performance.now();
    setRemainingMs(duration);

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const left = Math.max(0, duration - elapsed);
      setRemainingMs(left);
      if (left <= 0) {
        window.clearInterval(interval);
        setIsVisible(false);
        setIsExpanded(false);
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [isVisible, isPinned]);

  // 3. Fetch reverse geocoding + real-time weather (and optional Google Maps grounding)
  const fetchTelemetryForCoords = useCallback(
    async (
      lat: number,
      lon: number,
      accuracy: number | null,
      altitude: number | null,
      source: GeoPositionState['source'],
      withMapsGrounding = false
    ) => {
      const coordKey = `${lat.toFixed(4)},${lon.toFixed(4)},${withMapsGrounding}`;
      if (lastFetchedCoordsRef.current === coordKey && !withMapsGrounding) {
        setGeoState((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          accuracy: accuracy ?? prev.accuracy,
          altitude: altitude ?? prev.altitude,
          source,
        }));
        return;
      }
      lastFetchedCoordsRef.current = coordKey;

      if (withMapsGrounding) {
        setLoadingMapsGrounding(true);
      }

      try {
        const res = await fetch('/api/location-telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: lat,
            longitude: lon,
            includeMapsGrounding: withMapsGrounding,
          }),
        });

        if (res.ok) {
          const data = await res.json();

          if (data.weather) {
            setWeather({
              temperature: Number(data.weather.temperature_2m ?? 20),
              apparentTemperature: Number(
                data.weather.apparent_temperature ?? data.weather.temperature_2m ?? 20
              ),
              humidity: Number(data.weather.relative_humidity_2m ?? 55),
              windSpeed: Number(data.weather.wind_speed_10m ?? 8),
              weatherCode: Number(data.weather.weather_code ?? 0),
              isDay: Boolean(data.weather.is_day ?? 1),
            });
          }

          if (data.geo) {
            const locality =
              data.geo.locality ||
              data.geo.city ||
              data.geo.principalSubdivision ||
              '';
            const city = data.geo.city || data.geo.principalSubdivision || '';
            const country = data.geo.countryName || '';
            const informative =
              data.geo.localityInfo?.administrative
                ?.slice(-2)
                ?.map((x: any) => x.name)
                ?.filter(Boolean)
                ?.join(', ') || '';

            const displayPlace =
              [locality, city && city !== locality ? city : '', country]
                .filter(Boolean)
                .join(', ') ||
              informative ||
              `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;

            setGeoState({
              latitude: lat,
              longitude: lon,
              accuracy,
              altitude,
              placeName: displayPlace,
              subLocality: locality || informative,
              city,
              country,
              source,
            });
          } else {
            setGeoState((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lon,
              accuracy,
              altitude,
              placeName:
                prev.placeName && prev.source !== 'initializing'
                  ? prev.placeName
                  : `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`,
              source,
            }));
          }

          if (data.mapsSummary) {
            setMapsSummary(data.mapsSummary);
          }
          if (Array.isArray(data.mapsLinks) && data.mapsLinks.length > 0) {
            setMapsLinks(data.mapsLinks);
          }
        }
      } catch (_err) {
        // Fallback direct client fetch if backend call fails
        try {
          const [wRes, gRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&timezone=auto`
            ),
            fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=fr`
            ),
          ]);
          if (wRes.ok) {
            const wJson = await wRes.json();
            if (wJson.current) {
              setWeather({
                temperature: Number(wJson.current.temperature_2m ?? 20),
                apparentTemperature: Number(wJson.current.apparent_temperature ?? 20),
                humidity: Number(wJson.current.relative_humidity_2m ?? 50),
                windSpeed: Number(wJson.current.wind_speed_10m ?? 5),
                weatherCode: Number(wJson.current.weather_code ?? 0),
                isDay: Boolean(wJson.current.is_day ?? 1),
              });
            }
          }
          if (gRes.ok) {
            const gJson = await gRes.json();
            const place = [gJson.locality || gJson.city, gJson.countryName]
              .filter(Boolean)
              .join(', ');
            setGeoState({
              latitude: lat,
              longitude: lon,
              accuracy,
              altitude,
              placeName: place || `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`,
              subLocality: gJson.locality || '',
              city: gJson.city || '',
              country: gJson.countryName || '',
              source,
            });
          }
        } catch {
          // Keep existing coordinates
        }
      } finally {
        setIsLocating(false);
        setLoadingMapsGrounding(false);
      }
    },
    []
  );

  // 4. Acquire Most Accurate GPS Position (Hardware GPS + Network Fallback)
  const requestHighPrecisionGPS = useCallback(
    (includeMaps = false) => {
      setIsLocating(true);

      const fetchIpFallback = async () => {
        try {
          const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
          if (res.ok) {
            const ipData = await res.json();
            const lat = parseFloat(ipData.latitude);
            const lon = parseFloat(ipData.longitude);
            if (Number.isFinite(lat) && Number.isFinite(lon)) {
              await fetchTelemetryForCoords(lat, lon, null, null, 'network-geo', includeMaps);
              return;
            }
          }
        } catch {
          // Fallback to Paris coordinates if offline
        }
        await fetchTelemetryForCoords(48.8566, 2.3522, null, null, 'network-geo', includeMaps);
      };

      if (!('geolocation' in navigator)) {
        fetchIpFallback();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy, altitude } = pos.coords;
          fetchTelemetryForCoords(
            latitude,
            longitude,
            accuracy ? Math.round(accuracy) : null,
            altitude ? Math.round(altitude) : null,
            'gps-high-accuracy',
            includeMaps
          );
        },
        () => {
          fetchIpFallback();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      // Also start watchPosition for continuous high-accuracy refinement
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, altitude } = pos.coords;
          fetchTelemetryForCoords(
            latitude,
            longitude,
            accuracy ? Math.round(accuracy) : null,
            altitude ? Math.round(altitude) : null,
            'gps-high-accuracy',
            false
          );
        },
        () => {
          // Ignore watch error if getCurrentPosition already handled fallback
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );
    },
    [fetchTelemetryForCoords]
  );

  useEffect(() => {
    requestHighPrecisionGPS(false);
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestHighPrecisionGPS]);

  // Handler when the user clicks/taps on the bar:
  // Cancels the 5-second auto-disappear timer ("sauf si on a appuyé sur cette barre")
  // and toggles the detailed GPS & Weather view.
  const handleBarClick = () => {
    if (!isPinned) {
      setIsPinned(true);
      setIsExpanded(true);
      // Enrich with Google Maps Grounding when user taps the bar
      if (!mapsSummary && !loadingMapsGrounding) {
        fetchTelemetryForCoords(
          geoState.latitude,
          geoState.longitude,
          geoState.accuracy,
          geoState.altitude,
          geoState.source,
          true
        );
      }
    } else {
      setIsExpanded((prev) => !prev);
    }
  };

  // Format date & time
  const formattedDateFr = now.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const weatherVisual = getWeatherVisuals(
    weather?.weatherCode ?? 0,
    weather?.isDay ?? true
  );
  const WeatherIcon = weatherVisual.icon;
  const progressPercent = isPinned ? 100 : Math.max(0, Math.min(100, (remainingMs / 5000) * 100));

  // If the bar auto-disappeared after 5 seconds, render a subtle top-edge pull tab
  // so the user can always bring it back with a tap
  if (!isVisible) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <button
          onClick={() => {
            setIsPinned(false);
            setIsExpanded(false);
            setRemainingMs(5000);
            setIsVisible(true);
          }}
          className="pointer-events-auto group flex items-center gap-1.5 px-3 py-0.5 rounded-b-xl bg-white/75 hover:bg-white/95 backdrop-blur-[20px] border-x border-b border-[#DDD6FE]/90 shadow-[0_4px_14px_rgba(108,76,241,0.12)] text-[10px] font-semibold text-[#532CD8] transition-all cursor-pointer"
          title="Afficher la barre Date · Heure · GPS · Météo (5s)"
        >
          <MapPin className="w-2.5 h-2.5 text-[#6C4CF1]" />
          <span className="font-numeric">{formattedTime}</span>
          {weather && (
            <>
              <span className="text-[#CBD5E1]">·</span>
              <WeatherIcon className={`w-2.5 h-2.5 ${weatherVisual.color}`} />
              <span className="font-numeric font-bold text-[#18181B]">
                {weather.temperature.toFixed(1)}°C
              </span>
            </>
          )}
          <ChevronDown className="w-2.5 h-2.5 text-[#64748B] group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-2 pt-1.5 pointer-events-none transition-all duration-300">
      <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto pointer-events-auto">
        <div
          onClick={handleBarClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBarClick();
            }
          }}
          className="relative overflow-hidden rounded-2xl bg-white/82 backdrop-blur-[20px] border border-white/90 shadow-[0_10px_32px_-6px_rgba(83,44,216,0.18),0_2px_8px_rgba(24,24,27,0.06)] transition-all duration-300 cursor-pointer select-none hover:bg-white/92"
        >
          {/* Compact Primary Bar: Date, Live Time, Precise GPS Location, Real-Time Weather & Temp */}
          <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-xs">
            {/* Left: Date & Real-time Clock */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 text-[#18181B] font-semibold whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 text-[#6C4CF1] shrink-0" />
                <span className="capitalize text-[11px]">{formattedDateFr}</span>
              </div>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
              <div className="flex items-center gap-1 text-[#532CD8] font-extrabold font-numeric whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-[#6C4CF1] shrink-0" />
                <span className="text-[11px] tracking-tight">{formattedTime}</span>
              </div>
            </div>

            {/* Center/Right: Precise GPS Location + Real-Time Weather & Temperature */}
            <div className="flex items-center gap-2.5 min-w-0 ml-auto">
              {/* GPS Location */}
              <div className="flex items-center gap-1 min-w-0 max-w-[175px] sm:max-w-[240px]">
                <MapPin
                  className={`w-3.5 h-3.5 shrink-0 ${
                    geoState.source === 'gps-high-accuracy'
                      ? 'text-[#10B981]'
                      : 'text-[#6C4CF1]'
                  } ${isLocating ? 'animate-pulse' : ''}`}
                />
                <span className="text-[11px] font-bold text-[#18181B] truncate">
                  {geoState.placeName}
                </span>
                {geoState.accuracy !== null && (
                  <span className="hidden sm:inline-block text-[10px] font-numeric text-[#10B981] font-semibold whitespace-nowrap">
                    ±{geoState.accuracy}m
                  </span>
                )}
              </div>

              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>

              {/* Real-Time Weather & Temperature */}
              <div className="flex items-center gap-1 whitespace-nowrap">
                <WeatherIcon className={`w-4 h-4 shrink-0 ${weatherVisual.color}`} />
                {weather ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-extrabold font-numeric text-[#18181B]">
                      {weather.temperature.toFixed(1)}°C
                    </span>
                    <span className="hidden md:inline text-[10px] font-medium text-[#64748B]">
                      {weatherVisual.labelFr}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#64748B] font-medium">Météo...</span>
                )}
              </div>

              {/* Pin Status or Close Action */}
              {isPinned ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPinned(false);
                      setIsExpanded(false);
                      setIsVisible(false);
                    }}
                    className="p-1 rounded-lg hover:bg-[#F3E8FF] text-[#64748B] hover:text-[#18181B] transition-colors"
                    title="Masquer la barre"
                    aria-label="Masquer la barre"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span
                  className="text-[10px] font-numeric font-bold text-[#6C4CF1] whitespace-nowrap"
                  title="Appuyez sur la barre pour la garder affichée"
                >
                  {Math.ceil(remainingMs / 1000)}s
                </span>
              )}
            </div>
          </div>

          {/* Expanded High-Precision GPS + Real-Time Weather + Google Maps Grounding Drawer */}
          {isExpanded && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="px-3.5 pt-2 pb-3 border-t border-[#EDE9FE] bg-[#FAF9FF]/90 text-xs space-y-2.5 animate-fadeIn cursor-default"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#532CD8]">
                  <Pin className="w-3.5 h-3.5 text-[#6C4CF1]" />
                  <span>Barre maintenue active (Épinglée · 已固定)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => requestHighPrecisionGPS(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#DDD6FE] text-[11px] font-semibold text-[#532CD8] hover:bg-[#F5F3FF] transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>GPS Précis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPinned(false);
                      setIsExpanded(false);
                      setRemainingMs(5000);
                    }}
                    className="px-2 py-1 rounded-lg bg-white border border-[#E2E8F0] text-[11px] font-medium text-[#64748B] hover:text-[#18181B] transition-colors cursor-pointer"
                  >
                    Auto 5s
                  </button>
                </div>
              </div>

              {/* Detailed GPS Coordinates & Weather Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                {/* High-Precision GPS Coordinates Box */}
                <div className="p-2.5 rounded-xl bg-white/90 border border-[#EDE9FE] space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="flex items-center gap-1 font-semibold text-[#18181B]">
                      <Compass className="w-3.5 h-3.5 text-[#6C4CF1]" />
                      Position GPS Exacte
                    </span>
                    <span className="font-numeric text-[10px] text-[#10B981] font-semibold">
                      {geoState.source === 'gps-high-accuracy'
                        ? `GPS Haute Précision${geoState.accuracy ? ` (±${geoState.accuracy}m)` : ''}`
                        : 'Géolocalisation Réseau'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#18181B] truncate">
                    {geoState.placeName}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-numeric text-[#475569]">
                    <span>Lat: {geoState.latitude.toFixed(6)}°</span>
                    <span>·</span>
                    <span>Lon: {geoState.longitude.toFixed(6)}°</span>
                    {geoState.altitude !== null && (
                      <>
                        <span>·</span>
                        <span>Alt: {geoState.altitude}m</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Real-Time Weather Conditions Box */}
                <div className="p-2.5 rounded-xl bg-white/90 border border-[#EDE9FE] space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span className="flex items-center gap-1 font-semibold text-[#18181B]">
                      <WeatherIcon className={`w-3.5 h-3.5 ${weatherVisual.color}`} />
                      Météo en Temps Réel · 实时天气
                    </span>
                    {weather && (
                      <span className="font-extrabold font-numeric text-xs text-[#18181B]">
                        {weather.temperature.toFixed(1)}°C
                      </span>
                    )}
                  </div>
                  {weather ? (
                    <>
                      <div className="text-xs font-bold text-[#18181B]">
                        {weatherVisual.labelFr} · {weatherVisual.labelZh} (Ressenti{' '}
                        {weather.apparentTemperature.toFixed(1)}°C)
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-numeric text-[#475569]">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-[#3B82F6]" />
                          Humidité: {weather.humidity}%
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Wind className="w-3 h-3 text-[#64748B]" />
                          Vent: {weather.windSpeed} km/h
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-[#64748B]">
                      Synchronisation météo temps réel...
                    </div>
                  )}
                </div>
              </div>

              {/* Google Maps Grounding Context & Links */}
              {(loadingMapsGrounding || mapsSummary || mapsLinks.length > 0) && (
                <div className="pt-1 border-t border-[#EDE9FE]/80 space-y-1.5">
                  {loadingMapsGrounding ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#6C4CF1]">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyse du lieu via Google Maps Grounding...</span>
                    </div>
                  ) : (
                    <>
                      {mapsSummary && (
                        <p className="text-[11px] text-[#334155] leading-relaxed">
                          {mapsSummary}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        {mapsLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6C4CF1] hover:text-[#532CD8] hover:underline"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>{link.title}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${geoState.latitude},${geoState.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B] hover:text-[#6C4CF1] hover:underline"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Ouvrir les coordonnées sur Google Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5-Second Auto-Hide Countdown Progress Line (disappears once pinned, uses 30s chameleon bar color) */}
          {!isPinned && (
            <div className="h-0.5 w-full bg-[#EDE9FE] overflow-hidden">
              <div
                className="h-full chameleon-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
