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
  ChevronUp,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flower2,
  Activity,
  Leaf,
  Radio,
  Gauge,
  Eye,
  Info,
} from 'lucide-react';

export interface WeatherInfo {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  precipitation?: number;
}

export interface DailyForecastDay {
  date: string;
  dayLabel: string;
  shortDate: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  windSpeedMax: number;
  precipitationProbability: number;
  uvIndex?: number;
}

export interface AirQualityInfo {
  europeanAqi: number;
  usAqi: number;
  levelFr: string;
  levelColor: string;
  pm25: number;
  pm10: number;
  no2: number;
  ozone: number;
  so2: number;
}

export interface PollenInfo {
  overallRisk: 'Nul' | 'Faible' | 'Modéré' | 'Élevé' | 'Très élevé';
  overallRiskColor: string;
  grass: number; // Graminées (grains/m³)
  birch: number; // Bouleau
  olive: number; // Olivier
  ragweed: number; // Ambroisie
  alder: number; // Aulne
  mugwort: number; // Armoise
}

export interface MapsGroundingLink {
  title: string;
  uri: string;
  snippet?: string;
}

export interface GeoPositionState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  placeName: string;
  subLocality: string;
  city: string;
  country: string;
  source: 'gps-high-accuracy' | 'network-geo' | 'initializing';
  lastUpdated: Date;
}

// Visual weather metadata mapping
export function getWeatherVisuals(code: number, isDay = true) {
  if (code === 0) {
    return {
      labelFr: isDay ? 'Beau & Ensoleillé' : 'Nuit Claire & Étoilée',
      shortLabelFr: isDay ? 'Ensoleillé' : 'Ciel dégagé',
      conditionKey: 'sunny',
      conditionState: 'ensoleille' as const,
      icon: Sun,
      color: 'text-[#F59E0B]',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      bgGlow: 'from-amber-400/20 to-orange-400/10',
    };
  }
  if (code === 1) {
    return {
      labelFr: 'Beau temps (Voile léger)',
      shortLabelFr: 'Beau temps',
      conditionKey: 'mostly-sunny',
      conditionState: 'beau' as const,
      icon: CloudSun,
      color: 'text-[#F59E0B]',
      badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
      bgGlow: 'from-amber-300/15 to-stone-400/10',
    };
  }
  if (code === 2) {
    return {
      labelFr: 'Partiellement nuageux (Éclaircies)',
      shortLabelFr: 'Éclaircies',
      conditionKey: 'partly-cloudy',
      conditionState: 'nuageux' as const,
      icon: CloudSun,
      color: 'text-[#EAB308]',
      badgeBg: 'bg-sky-50 text-sky-900 border-sky-200',
      bgGlow: 'from-amber-300/15 to-stone-400/10',
    };
  }
  if (code === 3) {
    return {
      labelFr: 'Nuageux & Ciel couvert',
      shortLabelFr: 'Nuageux',
      conditionKey: 'cloudy',
      conditionState: 'nuageux' as const,
      icon: Cloud,
      color: 'text-[#64748B]',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
      bgGlow: 'from-slate-400/15 to-stone-400/10',
    };
  }
  if (code === 45 || code === 48) {
    return {
      labelFr: 'Brouillard & Brume',
      shortLabelFr: 'Brumeux',
      conditionKey: 'foggy',
      conditionState: 'nuageux' as const,
      icon: Cloud,
      color: 'text-[#78716C]',
      badgeBg: 'bg-stone-100 text-stone-700 border-stone-300',
      bgGlow: 'from-stone-400/15 to-stone-300/10',
    };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      labelFr: 'Pluvieux & Averses',
      shortLabelFr: 'Pluvieux',
      conditionKey: 'rainy',
      conditionState: 'pluvieux' as const,
      icon: CloudRain,
      color: 'text-[#3B82F6]',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      bgGlow: 'from-blue-500/20 to-indigo-500/10',
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      labelFr: 'Chutes de neige',
      shortLabelFr: 'Neigeux',
      conditionKey: 'snowy',
      conditionState: 'neigeux' as const,
      icon: Snowflake,
      color: 'text-[#06B6D4]',
      badgeBg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      bgGlow: 'from-cyan-400/20 to-blue-400/10',
    };
  }
  if (code >= 95) {
    return {
      labelFr: 'Orageux & Éclairs',
      shortLabelFr: 'Orageux',
      conditionKey: 'stormy',
      conditionState: 'orageux' as const,
      icon: CloudLightning,
      color: 'text-[#8B5CF6]',
      badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
      bgGlow: 'from-purple-500/20 to-indigo-500/10',
    };
  }
  return {
    labelFr: 'Beau temps tempéré',
    shortLabelFr: 'Tempéré',
    conditionKey: 'mild',
    conditionState: 'beau' as const,
    icon: CloudSun,
    color: 'text-[#6C4CF1]',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    bgGlow: 'from-purple-400/15 to-indigo-400/10',
  };
}

// Wind speed description helper
export function getWindDescription(speedKmh: number) {
  if (speedKmh < 8) return { label: 'Vent très faible', level: 'calm', color: 'text-emerald-700' };
  if (speedKmh < 20) return { label: 'Brise légère', level: 'breeze', color: 'text-teal-700' };
  if (speedKmh < 35) return { label: 'Vent modéré', level: 'moderate', color: 'text-blue-700' };
  if (speedKmh < 50) return { label: 'Vent soutenu', level: 'strong', color: 'text-amber-700' };
  return { label: 'Fortes rafales', level: 'gale', color: 'text-rose-700' };
}

// AQI Air Quality classification
export function getAqiVisuals(aqi: number) {
  if (aqi <= 20) {
    return {
      levelFr: 'Excellent (Air Très Pur)',
      levelColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      barColor: 'bg-emerald-500',
      status: 'safe',
    };
  }
  if (aqi <= 40) {
    return {
      levelFr: 'Bon (Qualité Satisfaisante)',
      levelColor: 'text-teal-700',
      badgeBg: 'bg-teal-50 border-teal-200 text-teal-800',
      barColor: 'bg-teal-500',
      status: 'safe',
    };
  }
  if (aqi <= 60) {
    return {
      levelFr: 'Modéré (Acceptable)',
      levelColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
      barColor: 'bg-amber-500',
      status: 'moderate',
    };
  }
  if (aqi <= 80) {
    return {
      levelFr: 'Dégradé (Pollution Sensible)',
      levelColor: 'text-orange-700',
      badgeBg: 'bg-orange-50 border-orange-200 text-orange-800',
      barColor: 'bg-orange-500',
      status: 'warning',
    };
  }
  return {
    levelFr: 'Mauvais (Pic de Pollution)',
    levelColor: 'text-rose-700',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
    barColor: 'bg-rose-500',
    status: 'alert',
  };
}

// Pollen risk evaluation
export function getPollenRiskVisuals(grass: number, birch: number, olive: number, ragweed: number, alder: number) {
  const maxConcentration = Math.max(grass, birch, olive, ragweed, alder);
  if (maxConcentration === 0) {
    return {
      risk: 'Nul' as const,
      color: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      advice: 'Aucun risque allergène détecté dans l’atmosphère.',
    };
  }
  if (maxConcentration < 10) {
    return {
      risk: 'Faible' as const,
      color: 'text-teal-700',
      badgeBg: 'bg-teal-50 border-teal-200 text-teal-800',
      advice: 'Traces mineures de pollens. Risque très faible pour les personnes sensibles.',
    };
  }
  if (maxConcentration < 45) {
    return {
      risk: 'Modéré' as const,
      color: 'text-amber-700',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
      advice: 'Présence modérée. Aérez tôt le matin ou après la pluie si vous êtes allergique.',
    };
  }
  if (maxConcentration < 90) {
    return {
      risk: 'Élevé' as const,
      color: 'text-orange-700',
      badgeBg: 'bg-orange-50 border-orange-200 text-orange-800',
      advice: 'Forte concentration pollinique. Évitez les activités intenses en plein air l’après-midi.',
    };
  }
  return {
    risk: 'Très élevé' as const,
    color: 'text-rose-700',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-800',
    advice: 'Alerte pollinique maximale. Portez des lunettes de soleil et rincez vos cheveux le soir.',
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
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'week' | 'air' | 'pollen' | 'gps'>('week');

  // Real-time Date & Clock
  const [now, setNow] = useState<Date>(() => new Date());

  // Continuous GPS state ("à chaque moment")
  const [geoState, setGeoState] = useState<GeoPositionState>({
    latitude: 48.8566,
    longitude: 2.3522,
    accuracy: null,
    altitude: null,
    speed: null,
    placeName: 'Acquisition GPS haute précision...',
    subLocality: '',
    city: 'Paris',
    country: 'France',
    source: 'initializing',
    lastUpdated: new Date(),
  });
  const [isLocating, setIsLocating] = useState<boolean>(true);

  // Weather state (Real-time + 7-Day Forecast)
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [dailyForecast, setDailyForecast] = useState<DailyForecastDay[]>([]);

  // Air Quality & Pollution state
  const [airQuality, setAirQuality] = useState<AirQualityInfo | null>(null);

  // Pollen Detection state
  const [pollen, setPollen] = useState<PollenInfo | null>(null);

  // Google Maps Grounding state
  const [mapsSummary, setMapsSummary] = useState<string | null>(null);
  const [mapsLinks, setMapsLinks] = useState<MapsGroundingLink[]>([]);
  const [loadingMapsGrounding, setLoadingMapsGrounding] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const lastFetchedCoordsRef = useRef<string>('');

  // Notify parent layout
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

  // 2. 5-Second Auto-Hide Countdown: pauses if hovered, retracts to the discreet edge after 5s
  useEffect(() => {
    if (!isVisible || isPinned || isHovered) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemainingMs((prev) => {
        const next = Math.max(0, prev - 100);
        if (next <= 0) {
          window.clearInterval(interval);
          setIsVisible(false);
          setIsExpanded(false);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isVisible, isPinned, isHovered]);

  // 3. Process daily 7-day forecast array
  const processDailyForecast = useCallback((dailyData: any): DailyForecastDay[] => {
    if (!dailyData || !Array.isArray(dailyData.time)) {
      return [];
    }
    const days: DailyForecastDay[] = [];
    const count = Math.min(7, dailyData.time.length);
    for (let i = 0; i < count; i++) {
      const dateStr = dailyData.time[i];
      const d = new Date(dateStr);
      let dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      if (i === 0) dayLabel = "Aujourd'hui";
      else if (i === 1) dayLabel = 'Demain';

      days.push({
        date: dateStr,
        dayLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
        shortDate: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        weatherCode: Number(dailyData.weather_code?.[i] ?? 0),
        tempMax: Number(dailyData.temperature_2m_max?.[i] ?? 18),
        tempMin: Number(dailyData.temperature_2m_min?.[i] ?? 10),
        windSpeedMax: Math.round(Number(dailyData.wind_speed_10m_max?.[i] ?? 12)),
        precipitationProbability: Math.round(Number(dailyData.precipitation_probability_max?.[i] ?? 0)),
        uvIndex: dailyData.uv_index_max?.[i] !== undefined ? Number(dailyData.uv_index_max[i]) : undefined,
      });
    }
    return days;
  }, []);

  // 4. Fetch telemetry: Real-time Weather, 7-Day Forecast, Air Quality & Pollen
  const fetchTelemetryForCoords = useCallback(
    async (
      lat: number,
      lon: number,
      accuracy: number | null,
      altitude: number | null,
      speed: number | null,
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
          speed: speed ?? prev.speed,
          source,
          lastUpdated: new Date(),
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

          // 1. Current Weather
          if (data.weather) {
            setWeather({
              temperature: Number(data.weather.temperature_2m ?? 20),
              apparentTemperature: Number(
                data.weather.apparent_temperature ?? data.weather.temperature_2m ?? 20
              ),
              humidity: Number(data.weather.relative_humidity_2m ?? 55),
              windSpeed: Math.round(Number(data.weather.wind_speed_10m ?? 8)),
              weatherCode: Number(data.weather.weather_code ?? 0),
              isDay: Boolean(data.weather.is_day ?? 1),
              precipitation: Number(data.weather.precipitation ?? 0),
            });
          }

          // 2. 7-Day Daily Forecast
          if (data.daily) {
            setDailyForecast(processDailyForecast(data.daily));
          }

          // 3. Air Quality & Pollution
          if (data.airQuality) {
            const eAqi = Math.round(Number(data.airQuality.european_aqi ?? 25));
            const usAqi = Math.round(Number(data.airQuality.us_aqi ?? 30));
            const aqiVis = getAqiVisuals(eAqi);

            setAirQuality({
              europeanAqi: eAqi,
              usAqi,
              levelFr: aqiVis.levelFr,
              levelColor: aqiVis.levelColor,
              pm25: Number((data.airQuality.pm2_5 ?? 8).toFixed(1)),
              pm10: Number((data.airQuality.pm10 ?? 15).toFixed(1)),
              no2: Number((data.airQuality.nitrogen_dioxide ?? 22).toFixed(1)),
              ozone: Number((data.airQuality.ozone ?? 45).toFixed(1)),
              so2: Number((data.airQuality.sulphur_dioxide ?? 2).toFixed(1)),
            });

            // 4. Pollen Detection
            const grass = Number(data.airQuality.grass_pollen ?? 0);
            const birch = Number(data.airQuality.birch_pollen ?? 0);
            const olive = Number(data.airQuality.olive_pollen ?? 0);
            const ragweed = Number(data.airQuality.ragweed_pollen ?? 0);
            const alder = Number(data.airQuality.alder_pollen ?? 0);
            const mugwort = Number(data.airQuality.mugwort_pollen ?? 0);

            const pVis = getPollenRiskVisuals(grass, birch, olive, ragweed, alder);
            setPollen({
              overallRisk: pVis.risk,
              overallRiskColor: pVis.color,
              grass,
              birch,
              olive,
              ragweed,
              alder,
              mugwort,
            });
          }

          // 5. Reverse Geocoding
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
              `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;

            setGeoState({
              latitude: lat,
              longitude: lon,
              accuracy,
              altitude,
              speed,
              placeName: displayPlace,
              subLocality: locality || informative,
              city: city || locality || 'Paris',
              country,
              source,
              lastUpdated: new Date(),
            });
          }

          if (data.mapsSummary) {
            setMapsSummary(data.mapsSummary);
          }
          if (Array.isArray(data.mapsLinks) && data.mapsLinks.length > 0) {
            setMapsLinks(data.mapsLinks);
          }
        }
      } catch (_err) {
        // Fallback: Direct client calls to Open-Meteo & BigDataCloud
        try {
          const [wRes, airRes, gRes] = await Promise.all([
            fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_probability_max&timezone=auto`
            ),
            fetch(
              `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,us_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide,alder_pollen,birch_pollen,grass_pollen,olive_pollen,ragweed_pollen&timezone=auto`
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
                windSpeed: Math.round(Number(wJson.current.wind_speed_10m ?? 8)),
                weatherCode: Number(wJson.current.weather_code ?? 0),
                isDay: Boolean(wJson.current.is_day ?? 1),
              });
            }
            if (wJson.daily) {
              setDailyForecast(processDailyForecast(wJson.daily));
            }
          }

          if (airRes.ok) {
            const aJson = await airRes.json();
            if (aJson.current) {
              const eAqi = Math.round(Number(aJson.current.european_aqi ?? 28));
              const aqiVis = getAqiVisuals(eAqi);
              setAirQuality({
                europeanAqi: eAqi,
                usAqi: Math.round(Number(aJson.current.us_aqi ?? 32)),
                levelFr: aqiVis.levelFr,
                levelColor: aqiVis.levelColor,
                pm25: Number((aJson.current.pm2_5 ?? 7).toFixed(1)),
                pm10: Number((aJson.current.pm10 ?? 14).toFixed(1)),
                no2: Number((aJson.current.nitrogen_dioxide ?? 18).toFixed(1)),
                ozone: Number((aJson.current.ozone ?? 42).toFixed(1)),
                so2: Number((aJson.current.sulphur_dioxide ?? 2).toFixed(1)),
              });

              const grass = Number(aJson.current.grass_pollen ?? 0);
              const birch = Number(aJson.current.birch_pollen ?? 0);
              const olive = Number(aJson.current.olive_pollen ?? 0);
              const ragweed = Number(aJson.current.ragweed_pollen ?? 0);
              const alder = Number(aJson.current.alder_pollen ?? 0);
              const pVis = getPollenRiskVisuals(grass, birch, olive, ragweed, alder);

              setPollen({
                overallRisk: pVis.risk,
                overallRiskColor: pVis.color,
                grass,
                birch,
                olive,
                ragweed,
                alder,
                mugwort: Number(aJson.current.mugwort_pollen ?? 0),
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
              speed,
              placeName: place || `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`,
              subLocality: gJson.locality || '',
              city: gJson.city || gJson.locality || 'Paris',
              country: gJson.countryName || '',
              source,
              lastUpdated: new Date(),
            });
          }
        } catch {
          // Keep existing telemetry
        }
      } finally {
        setIsLocating(false);
        setLoadingMapsGrounding(false);
      }
    },
    [processDailyForecast]
  );

  // 5. High-Precision Continuous GPS ("à chaque moment")
  const startContinuousGpsTracking = useCallback(
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
              await fetchTelemetryForCoords(lat, lon, null, null, null, 'network-geo', includeMaps);
              return;
            }
          }
        } catch {
          // offline fallback
        }
        await fetchTelemetryForCoords(48.8566, 2.3522, null, null, null, 'network-geo', includeMaps);
      };

      if (!('geolocation' in navigator)) {
        fetchIpFallback();
        return;
      }

      // Initial quick reading
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy, altitude, speed } = pos.coords;
          fetchTelemetryForCoords(
            latitude,
            longitude,
            accuracy ? Math.round(accuracy) : null,
            altitude ? Math.round(altitude) : null,
            speed ? Math.round(speed * 3.6) : null,
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

      // Continuous GPS Watch: updates at every moment when location shifts
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, altitude, speed } = pos.coords;
          fetchTelemetryForCoords(
            latitude,
            longitude,
            accuracy ? Math.round(accuracy) : null,
            altitude ? Math.round(altitude) : null,
            speed ? Math.round(speed * 3.6) : null,
            'gps-high-accuracy',
            false
          );
        },
        () => {
          // ignore minor watch glitches
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 15000,
        }
      );
    },
    [fetchTelemetryForCoords]
  );

  useEffect(() => {
    startContinuousGpsTracking(false);
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startContinuousGpsTracking]);

  // Click handler: Toggles expanded view & resets 5s timer
  const handleBarClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setRemainingMs(5000);
      if (!mapsSummary && !loadingMapsGrounding) {
        fetchTelemetryForCoords(
          geoState.latitude,
          geoState.longitude,
          geoState.accuracy,
          geoState.altitude,
          geoState.speed,
          geoState.source,
          true
        );
      }
    } else {
      setIsExpanded(false);
    }
  };

  // Open from discrete edge: reveals bar for 5 seconds before returning to edge
  const handleOpenFromEdge = () => {
    setIsPinned(false);
    setIsExpanded(true);
    setIsVisible(true);
    setRemainingMs(5000);
    if (!mapsSummary && !loadingMapsGrounding) {
      fetchTelemetryForCoords(
        geoState.latitude,
        geoState.longitude,
        geoState.accuracy,
        geoState.altitude,
        geoState.speed,
        geoState.source,
        true
      );
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

  const weatherVisual = getWeatherVisuals(weather?.weatherCode ?? 0, weather?.isDay ?? true);
  const WeatherIcon = weatherVisual.icon;
  const progressPercent = isPinned ? 100 : Math.max(0, Math.min(100, (remainingMs / 5000) * 100));

  // If the bar auto-disappeared after 5 seconds, render a discreet top-edge pull tab ("aux abords de l'application")
  if (!isVisible) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-2 pt-0.5">
        <button
          type="button"
          onClick={handleOpenFromEdge}
          className="pointer-events-auto group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-b-2xl bg-white/92 hover:bg-white backdrop-blur-[20px] border-x border-b border-stone-200/90 shadow-[0_6px_24px_-4px_rgba(28,25,23,0.12),0_2px_6px_rgba(28,25,23,0.04)] text-[11px] font-medium text-stone-700 transition-all cursor-pointer hover:shadow-lg hover:border-[#DDD6FE] active:scale-95"
          title="Station météo 7 jours, qualité de l'air, pollens & GPS continu (Cliquer pour ouvrir pendant 5s)"
        >
          {/* Live GPS Dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>

          <span className="font-extrabold text-stone-900 truncate max-w-[85px] sm:max-w-none">
            {geoState.city || 'Paris'}
          </span>

          <span className="text-[#CBD5E1]" aria-hidden="true">·</span>

          {weather ? (
            <div className="flex items-center gap-1 font-numeric font-extrabold text-stone-900">
              <WeatherIcon className={`w-3.5 h-3.5 ${weatherVisual.color}`} />
              <span>{weather.temperature.toFixed(1)}°C</span>
              <span className="hidden sm:inline text-[10px] font-semibold text-stone-500">
                ({weatherVisual.shortLabelFr})
              </span>
            </div>
          ) : (
            <span className="text-stone-400">Météo...</span>
          )}

          {weather && (
            <>
              <span className="text-[#CBD5E1] hidden xs:inline" aria-hidden="true">·</span>
              <div className="hidden xs:flex items-center gap-0.5 font-numeric text-[10px] text-stone-600 font-semibold">
                <Wind className="w-3 h-3 text-stone-400" />
                <span>{weather.windSpeed} km/h</span>
              </div>
            </>
          )}

          {airQuality && (
            <>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
              <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded-md ${getAqiVisuals(airQuality.europeanAqi).badgeBg}`}>
                Air {airQuality.europeanAqi}
              </span>
            </>
          )}

          {pollen && pollen.overallRisk !== 'Nul' && (
            <>
              <span className="text-[#CBD5E1] hidden sm:inline" aria-hidden="true">·</span>
              <span className={`text-[9.5px] font-bold hidden sm:inline px-1.5 py-0.5 rounded-md ${pollen.overallRiskColor} bg-amber-50 border border-amber-200`}>
                🌸 Pollen {pollen.overallRisk}
              </span>
            </>
          )}

          <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
          <span className="font-numeric text-stone-500 font-semibold">{formattedTime}</span>

          <span className="ml-1 text-[9.5px] font-bold text-[#532CD8] bg-[#F5F3FF] border border-[#DDD6FE] px-1.5 py-0.5 rounded-full flex items-center gap-1 group-hover:bg-[#EDE9FE] transition-colors">
            <span>5s</span>
            <ChevronDown className="w-2.5 h-2.5 group-hover:translate-y-0.5 transition-transform" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-2.5 sm:px-3 pt-1 pointer-events-none transition-all duration-300">
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
          className={`relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-[24px] border border-stone-200/90 shadow-[0_8px_30px_-6px_rgba(28,25,23,0.08),0_1px_3px_rgba(28,25,23,0.03)] transition-all duration-300 cursor-pointer select-none hover:bg-white hover:border-[#DDD6FE] ${
            isExpanded ? 'ring-2 ring-[#6C4CF1]/20' : ''
          }`}
        >
          {/* 1. Compact Primary Bar: Guaranteed Single-Line on Mobile & Desktop */}
          <div className="px-2.5 sm:px-3 py-1.5 flex items-center justify-between gap-1.5 sm:gap-2.5 text-xs overflow-hidden">
            {/* Left: Date & Real-time Clock */}
            <div className="flex items-center gap-1.5 min-w-0 shrink">
              <div className="flex items-center gap-1 text-[#18181B] font-semibold whitespace-nowrap min-w-0">
                <Calendar className="w-3.5 h-3.5 text-[#6C4CF1] shrink-0" />
                <span className="capitalize text-[10.5px] sm:text-[11px] truncate max-w-[80px] sm:max-w-none">
                  {formattedDateFr}
                </span>
              </div>
              <span className="text-[#CBD5E1] shrink-0" aria-hidden="true">·</span>
              <div className="flex items-center gap-1 text-[#532CD8] font-extrabold font-numeric whitespace-nowrap shrink-0">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#6C4CF1] shrink-0" />
                <span className="text-[10.5px] sm:text-[11px] tracking-tight">{formattedTime}</span>
              </div>
            </div>

            {/* Center/Right: Live GPS City + Temp + Air/Wind + Countdown or Expand Arrow */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0 ml-auto">
              {/* Continuous GPS Location */}
              <div
                className="flex items-center gap-1 min-w-0 max-w-[85px] sm:max-w-[170px]"
                title={`Géolocalisation continue : ${geoState.latitude.toFixed(5)}°, ${geoState.longitude.toFixed(5)}° (±${geoState.accuracy ?? 10}m)`}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10.5px] sm:text-[11px] font-bold text-[#18181B] truncate">
                  {geoState.city || geoState.subLocality || 'Paris'}
                </span>
              </div>

              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>

              {/* Real-Time Weather & Temperature */}
              <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
                <WeatherIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${weatherVisual.color}`} />
                {weather ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-extrabold font-numeric text-[#18181B]">
                      {weather.temperature.toFixed(1)}°C
                    </span>
                    <span className="hidden md:inline text-[10px] font-semibold text-[#64748B]">
                      {weatherVisual.shortLabelFr}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#64748B] font-medium">Météo...</span>
                )}
              </div>

              {/* Wind Speed in Primary Bar */}
              {weather && (
                <div className="hidden sm:flex items-center gap-0.5 text-[10px] font-numeric text-stone-600 font-semibold shrink-0">
                  <Wind className="w-3 h-3 text-stone-400" />
                  <span>{weather.windSpeed} km/h</span>
                </div>
              )}

              {/* Air Quality Badge (Compact inline) */}
              {airQuality && (
                <div className="hidden xs:flex items-center gap-1 shrink-0 font-numeric text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700">
                  <Leaf className="w-2.5 h-2.5 text-emerald-600" />
                  <span className="font-bold">AQI {airQuality.europeanAqi}</span>
                </div>
              )}

              {/* Pin or 5s Countdown Badge */}
              {isPinned ? (
                <div className="flex items-center gap-1">
                  <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                    📌 Fixé
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPinned(false);
                      setIsExpanded(false);
                      setIsVisible(false);
                    }}
                    className="p-1 rounded-lg hover:bg-[#F3E8FF] text-[#64748B] hover:text-[#18181B] transition-colors"
                    title="Masquer la barre aux abords de l'écran"
                    aria-label="Masquer la barre"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span
                  className="text-[10px] font-numeric font-bold text-[#6C4CF1] bg-[#F5F3FF] border border-[#DDD6FE] px-1.5 py-0.5 rounded-md whitespace-nowrap flex items-center gap-1"
                  title="Mode 5s : Se replie automatiquement aux abords de l'application"
                >
                  <span className="hidden sm:inline">⏱️</span>
                  <span>{Math.max(1, Math.ceil(remainingMs / 1000))}s</span>
                </span>
              )}

              <ChevronDown
                className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-300 ${
                  isExpanded ? 'rotate-180 text-[#532CD8]' : 'rotate-0'
                }`}
              />
            </div>
          </div>

          {/* 2. Expanded Sophisticated Station Console (7-Day Weather, Air Quality, Pollen & Continuous GPS) */}
          {isExpanded && (
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="px-3.5 pt-2.5 pb-4 border-t border-[#EDE9FE] bg-gradient-to-b from-[#FAF9FF]/95 to-white/95 text-xs space-y-3.5 animate-fadeIn cursor-default max-h-[82vh] overflow-y-auto"
            >
              {/* Top Controls: Station Status + Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#EDE9FE]">
                {/* Station Title & Live GPS Beacon */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-[#532CD8] text-white flex items-center justify-center shadow-xs">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#18181B]">
                      <span>Station Atmosphérique & Météorologique</span>
                      <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold font-numeric">
                        LIVE
                      </span>
                    </div>
                    <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                      <span>Géolocalisation continue en temps réel</span>
                      <span>·</span>
                      <span className="font-numeric">±{geoState.accuracy ?? 10}m</span>
                    </div>
                  </div>
                </div>

                {/* Pin & Refresh Actions */}
                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => startContinuousGpsTracking(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-[#DDD6FE] text-[11px] font-semibold text-[#532CD8] hover:bg-[#F5F3FF] transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Actualiser les capteurs GPS, météo, qualité d'air et pollens"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>Actualiser</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPinned(false);
                      setRemainingMs(5000);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                      !isPinned
                        ? 'bg-[#532CD8] text-white border-[#532CD8]'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#18181B]'
                    }`}
                    title="Activer la rétractation automatique discrète après 5 secondes"
                  >
                    <span>Mode 5s {!isPinned ? `(${Math.max(1, Math.ceil(remainingMs / 1000))}s)` : ''}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPinned((prev) => !prev);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer shadow-2xs ${
                      isPinned
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#18181B]'
                    }`}
                    title="Garder la station météo affichée sans fermeture automatique"
                  >
                    <span>{isPinned ? '📌 Fixé' : 'Épingler'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPinned(false);
                      setIsExpanded(false);
                      setIsVisible(false);
                    }}
                    className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                    aria-label="Replier aux abords de l'application"
                    title="Replier aux abords de l'application"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 4 Feature Tabs: Semaine 7j · Qualité de l'Air · Pollens · GPS Live */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100/90 rounded-xl border border-stone-200/80">
                {[
                  { id: 'week', label: 'Météo 7 Jours', icon: Calendar },
                  { id: 'air', label: 'Air & Pollution', icon: Leaf },
                  { id: 'pollen', label: 'Pollens', icon: Flower2 },
                  { id: 'gps', label: 'GPS & Carte', icon: Navigation },
                ].map((t) => {
                  const Icon = t.icon;
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id as any)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: 7-DAY WEATHER FORECAST (Semaine complète en temps réel) */}
              {activeTab === 'week' && (
                <div className="space-y-3 animate-fadeIn">
                  {/* Today's Hero Capsule */}
                  {weather && (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-purple-500/10 border border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-amber-200 flex items-center justify-center shrink-0">
                          <WeatherIcon className={`w-7 h-7 ${weatherVisual.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-stone-900">
                              Aujourd'hui · {weatherVisual.labelFr}
                            </span>
                            <span className="text-[10px] text-stone-500">
                              (Ressenti {weather.apparentTemperature.toFixed(1)}°C)
                            </span>
                          </div>
                          <div className="text-xs text-stone-600 flex flex-wrap items-center gap-2 sm:gap-3 mt-0.5 font-numeric">
                            <span className="flex items-center gap-1">
                              <Wind className="w-3.5 h-3.5 text-stone-500" />
                              Vent: <strong>{weather.windSpeed} km/h</strong> ({getWindDescription(weather.windSpeed).label})
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Droplets className="w-3.5 h-3.5 text-blue-500" />
                              Humidité: <strong>{weather.humidity}%</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:border-stone-200/80 sm:pl-4">
                        <div className="text-2xl font-black font-numeric text-stone-900 leading-none">
                          {weather.temperature.toFixed(1)}°C
                        </div>
                        <div className="text-[10px] text-stone-500 mt-1">
                          En direct à {geoState.city}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7-Day Forecast Grid */}
                  <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-stone-600 font-semibold px-1">
                      <span>Prévisions météo de la semaine (7 Jours en temps réel) :</span>
                      {dailyForecast.length > 0 && (
                        <div className="flex items-center gap-2 text-[10px] font-normal text-stone-500">
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <Sun className="w-3 h-3 text-amber-500" />
                            {dailyForecast.filter((d) => [0, 1].includes(d.weatherCode)).length} j. ensoleillés
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                            <Cloud className="w-3 h-3 text-slate-400" />
                            {dailyForecast.filter((d) => [2, 3, 45, 48].includes(d.weatherCode)).length} j. nuageux
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-blue-700 font-semibold">
                            <CloudRain className="w-3 h-3 text-blue-500" />
                            {dailyForecast.filter((d) => d.weatherCode >= 51).length} j. pluvieux
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {dailyForecast.length > 0 ? (
                        dailyForecast.map((day, idx) => {
                          const dayVis = getWeatherVisuals(day.weatherCode, true);
                          const DayIcon = dayVis.icon;
                          const windDesc = getWindDescription(day.windSpeedMax);
                          const isToday = idx === 0;

                          return (
                            <div
                              key={day.date}
                              className={`p-2.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                                isToday
                                  ? 'bg-amber-50/80 border-amber-300 shadow-xs ring-1 ring-amber-400/30'
                                  : 'bg-white border-stone-200/80 hover:border-stone-300'
                              }`}
                            >
                              <div>
                                <span className="text-[11px] font-bold text-stone-900 block truncate">
                                  {day.dayLabel}
                                </span>
                                <span className="text-[9.5px] font-numeric text-stone-500 block">
                                  {day.shortDate}
                                </span>
                              </div>

                              <div className="my-2 flex flex-col items-center">
                                <DayIcon className={`w-6 h-6 ${dayVis.color} mb-1`} />
                                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md border text-center line-clamp-1 leading-tight ${dayVis.badgeBg}`}>
                                  {dayVis.shortLabelFr}
                                </span>
                              </div>

                              {/* Temperatures Min / Max */}
                              <div className="w-full pt-1.5 border-t border-stone-200/60 font-numeric">
                                <div className="flex items-center justify-between text-[11px] font-extrabold">
                                  <span className="text-amber-700">{Math.round(day.tempMax)}°</span>
                                  <span className="text-stone-400 text-[10px]">/</span>
                                  <span className="text-blue-600">{Math.round(day.tempMin)}°</span>
                                </div>

                                {/* Wind Speed Max */}
                                <div className="flex items-center justify-center gap-1 text-[9px] text-stone-600 mt-1" title={`${day.windSpeedMax} km/h (${windDesc.label})`}>
                                  <Wind className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                                  <span className="font-semibold">{day.windSpeedMax} km/h</span>
                                </div>

                                {/* Rain probability if > 0 */}
                                {day.precipitationProbability > 0 && (
                                  <div className="text-[9px] text-blue-600 font-semibold mt-0.5 flex items-center justify-center gap-0.5">
                                    <Droplets className="w-2.5 h-2.5" />
                                    <span>{day.precipitationProbability}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-6 text-center text-stone-400 text-xs">
                          Chargement des prévisions 7 jours...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AIR QUALITY & POLLUTION */}
              {activeTab === 'air' && (
                <div className="space-y-3 animate-fadeIn">
                  {airQuality ? (
                    <>
                      {/* Overall AQI Card */}
                      <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-[#532CD8]" />
                            <span className="font-extrabold text-stone-900 text-xs">
                              Indice Global de Qualité de l’Air (AQI Européen & US)
                            </span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getAqiVisuals(airQuality.europeanAqi).badgeBg}`}>
                            {airQuality.levelFr}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 pt-1">
                          <div className="text-center px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 shrink-0">
                            <span className="text-[10px] text-stone-500 block uppercase font-mono">EAQI EU</span>
                            <span className={`text-2xl font-black font-numeric ${airQuality.levelColor}`}>
                              {airQuality.europeanAqi}
                            </span>
                          </div>
                          <div className="text-center px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 shrink-0">
                            <span className="text-[10px] text-stone-500 block uppercase font-mono">USAQI</span>
                            <span className="text-2xl font-black font-numeric text-stone-800">
                              {airQuality.usAqi}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 leading-relaxed">
                            Atmosphère mesurée en direct sur les stations de surveillance de <strong>{geoState.city}</strong>.
                            Indice calculé sur les moyennes des particules et gaz oxydants.
                          </p>
                        </div>
                      </div>

                      {/* 5 Real-Time Pollutants Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {/* PM2.5 */}
                        <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-stone-800">PM2.5 (Fines)</span>
                            <span className="text-stone-400 font-mono text-[10px]">OMS: &lt;15</span>
                          </div>
                          <div className="text-base font-black font-numeric text-indigo-700">
                            {airQuality.pm25} <span className="text-[10px] font-normal text-stone-500">μg/m³</span>
                          </div>
                          <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.min(100, (airQuality.pm25 / 35) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* PM10 */}
                        <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-stone-800">PM10 (Poussières)</span>
                            <span className="text-stone-400 font-mono text-[10px]">OMS: &lt;45</span>
                          </div>
                          <div className="text-base font-black font-numeric text-teal-700">
                            {airQuality.pm10} <span className="text-[10px] font-normal text-stone-500">μg/m³</span>
                          </div>
                          <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{ width: `${Math.min(100, (airQuality.pm10 / 50) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* NO2 */}
                        <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-stone-800">NO₂ (Dioxyde d’azote)</span>
                            <span className="text-stone-400 font-mono text-[10px]">Trafic</span>
                          </div>
                          <div className="text-base font-black font-numeric text-amber-700">
                            {airQuality.no2} <span className="text-[10px] font-normal text-stone-500">μg/m³</span>
                          </div>
                          <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, (airQuality.no2 / 50) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* O3 Ozone */}
                        <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-stone-800">O₃ (Ozone)</span>
                            <span className="text-stone-400 font-mono text-[10px]">Solaire</span>
                          </div>
                          <div className="text-base font-black font-numeric text-purple-700">
                            {airQuality.ozone} <span className="text-[10px] font-normal text-stone-500">μg/m³</span>
                          </div>
                          <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${Math.min(100, (airQuality.ozone / 100) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* SO2 */}
                        <div className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-stone-800">SO₂ (Soufre)</span>
                            <span className="text-stone-400 font-mono text-[10px]">Industrie</span>
                          </div>
                          <div className="text-base font-black font-numeric text-rose-700">
                            {airQuality.so2} <span className="text-[10px] font-normal text-stone-500">μg/m³</span>
                          </div>
                          <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${Math.min(100, (airQuality.so2 / 20) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-stone-400 text-xs">
                      Synchronisation des capteurs de pollution en cours...
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: POLLEN DETECTION */}
              {activeTab === 'pollen' && (
                <div className="space-y-3 animate-fadeIn">
                  {pollen ? (
                    <>
                      {/* Overall Pollen Risk Status */}
                      <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Flower2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-extrabold text-stone-900 text-xs">
                              Index de Risque Allergique & Pollinique
                            </span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getPollenRiskVisuals(pollen.grass, pollen.birch, pollen.olive, pollen.ragweed, pollen.alder).badgeBg}`}>
                            Risque {pollen.overallRisk}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          {getPollenRiskVisuals(pollen.grass, pollen.birch, pollen.olive, pollen.ragweed, pollen.alder).advice}
                        </p>
                      </div>

                      {/* Individual Pollen Species Breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {[
                          { name: 'Graminées', sub: 'Pelouses & Foins', value: pollen.grass, color: 'text-emerald-700', bg: 'bg-emerald-500' },
                          { name: 'Bouleau', sub: 'Arbres printaniers', value: pollen.birch, color: 'text-amber-700', bg: 'bg-amber-500' },
                          { name: 'Olivier', sub: 'Régions tempérées', value: pollen.olive, color: 'text-teal-700', bg: 'bg-teal-500' },
                          { name: 'Ambroisie', sub: 'Allergène automnal', value: pollen.ragweed, color: 'text-purple-700', bg: 'bg-purple-500' },
                          { name: 'Aulne', sub: 'Zones humides', value: pollen.alder, color: 'text-blue-700', bg: 'bg-blue-500' },
                          { name: 'Armoise', sub: 'Herbacées', value: pollen.mugwort, color: 'text-rose-700', bg: 'bg-rose-500' },
                        ].map((item) => (
                          <div key={item.name} className="p-2.5 rounded-xl bg-white border border-stone-200 space-y-1">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-bold text-stone-800">{item.name}</span>
                              <span className="text-stone-400 text-[9.5px] truncate max-w-[60px]">{item.sub}</span>
                            </div>
                            <div className={`text-base font-black font-numeric ${item.color}`}>
                              {item.value} <span className="text-[9.5px] font-normal text-stone-500">grains/m³</span>
                            </div>
                            <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${item.bg} rounded-full`}
                                style={{ width: `${Math.min(100, (item.value / 60) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-stone-400 text-xs">
                      Détection des pollens dans l’atmosphère en cours...
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CONTINUOUS GPS & MAPS GROUNDING */}
              {activeTab === 'gps' && (
                <div className="space-y-3 animate-fadeIn">
                  {/* Detailed GPS Beacon Card */}
                  <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-extrabold text-stone-900 text-xs">
                        <Compass className="w-4 h-4 text-[#532CD8]" />
                        <span>Position GPS Continue Haute Précision</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {geoState.source === 'gps-high-accuracy' ? 'GPS Satellite Actif' : 'Position Réseau'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-stone-900">
                      {geoState.placeName}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-numeric text-[11px]">
                      <div className="p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                        <span className="text-stone-500 block text-[9.5px]">Latitude</span>
                        <strong className="text-stone-900">{geoState.latitude.toFixed(6)}°</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                        <span className="text-stone-500 block text-[9.5px]">Longitude</span>
                        <strong className="text-stone-900">{geoState.longitude.toFixed(6)}°</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                        <span className="text-stone-500 block text-[9.5px]">Précision</span>
                        <strong className="text-emerald-700">±{geoState.accuracy ?? 10} m</strong>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-50 border border-stone-200/80">
                        <span className="text-stone-500 block text-[9.5px]">Altitude</span>
                        <strong className="text-stone-900">{geoState.altitude ? `${geoState.altitude} m` : 'Niveaumer'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Google Maps Grounding Insight */}
                  <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#532CD8]" />
                        <span>Contexte & Repères Google Maps</span>
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${geoState.latitude},${geoState.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[#532CD8] hover:underline flex items-center gap-1"
                      >
                        <span>Ouvrir sur Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {loadingMapsGrounding ? (
                      <div className="flex items-center gap-2 text-xs text-[#532CD8] py-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyse des repères locaux via Gemini & Google Maps...</span>
                      </div>
                    ) : mapsSummary ? (
                      <p className="text-[11px] text-stone-700 leading-relaxed bg-[#FAF9FF] p-2.5 rounded-xl border border-[#EDE9FE]">
                        {mapsSummary}
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-500">
                        Coordonnées synchronisées avec les satellites en direct.
                      </p>
                    )}

                    {mapsLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {mapsLinks.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10.5px] font-semibold transition-colors"
                          >
                            <MapPin className="w-3 h-3 text-[#532CD8]" />
                            <span>{link.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5-Second Auto-Hide Countdown Progress Line (disappears once pinned, uses chameleon bar color) */}
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
