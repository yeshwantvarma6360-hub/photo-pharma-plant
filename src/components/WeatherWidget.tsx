import React, { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, Wind, MapPin, Loader2, CloudRain, Sun, CloudSun, AlertTriangle, RefreshCw, Umbrella } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  location: string;
  icon: string;
  uvIndex?: number;
  precipitation?: number;
  soilMoisture?: number;
  farmingAlert?: string;
  forecast?: { day: string; temp: number; icon: string }[];
}

const WeatherWidget: React.FC = () => {
  const { t, language } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      // Using Open-Meteo free API with extended data
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,uv_index,precipitation&daily=weather_code,temperature_2m_max&forecast_days=5&timezone=auto`
      );
      
      if (!response.ok) throw new Error('Weather fetch failed');
      
      const data = await response.json();
      const current = data.current;
      const daily = data.daily;
      
      // Get location name using reverse geocoding
      const geoResponse = await fetch(
        `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      
      let locationName = t('yourLocation');
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        locationName = geoData.address?.city || geoData.address?.town || geoData.address?.village || t('yourLocation');
      }

      // Map weather codes to descriptions
      const weatherDescriptions: Record<number, string> = {
        0: t('weatherClear'),
        1: t('weatherMainlyClear'),
        2: t('weatherPartlyCloudy'),
        3: t('weatherOvercast'),
        45: t('weatherFoggy'),
        48: t('weatherFoggy'),
        51: t('weatherDrizzle'),
        53: t('weatherDrizzle'),
        55: t('weatherDrizzle'),
        61: t('weatherRain'),
        63: t('weatherRain'),
        65: t('weatherHeavyRain'),
        71: t('weatherSnow'),
        73: t('weatherSnow'),
        75: t('weatherHeavySnow'),
        80: t('weatherShowers'),
        81: t('weatherShowers'),
        82: t('weatherHeavyShowers'),
        95: t('weatherThunderstorm'),
      };

      // Generate farming alerts based on conditions
      let farmingAlert = '';
      if (current.uv_index > 8) {
        farmingAlert = t('alertHighUV');
      } else if (current.precipitation > 5) {
        farmingAlert = t('alertHeavyRain');
      } else if (current.relative_humidity_2m > 85) {
        farmingAlert = t('alertHighHumidity');
      } else if (current.temperature_2m > 40) {
        farmingAlert = t('alertExtremeHeat');
      } else if (current.wind_speed_10m > 30) {
        farmingAlert = t('alertStrongWind');
      }

      // Create forecast
      const forecast = daily?.time?.slice(1, 5).map((day: string, index: number) => ({
        day: new Date(day).toLocaleDateString(language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' }),
        temp: Math.round(daily.temperature_2m_max[index + 1]),
        icon: daily.weather_code[index + 1] <= 3 ? 'sun' : daily.weather_code[index + 1] >= 51 ? 'rain' : 'cloud',
      }));

      setWeather({
        temperature: Math.round(current.temperature_2m),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        description: weatherDescriptions[current.weather_code] || t('weatherUnknown'),
        location: locationName,
        icon: current.weather_code <= 3 ? 'sun' : current.weather_code >= 51 ? 'rain' : 'cloud',
        uvIndex: current.uv_index,
        precipitation: current.precipitation,
        farmingAlert,
        forecast,
      });
      setLastUpdated(new Date());
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(t('weatherError'));
      setLoading(false);
    }
  };

  const refreshWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          fetchWeather(28.6139, 77.209);
        }
      );
    } else {
      fetchWeather(28.6139, 77.209);
    }
  };

  useEffect(() => {
    refreshWeather();
    // Auto-refresh every 15 minutes
    const interval = setInterval(refreshWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [t]);

  const getWeatherIcon = (icon: string, size: string = 'w-8 h-8') => {
    switch (icon) {
      case 'sun':
        return <Sun className={`${size} text-yellow-500`} />;
      case 'rain':
        return <CloudRain className={`${size} text-blue-500`} />;
      default:
        return <CloudSun className={`${size} text-muted-foreground`} />;
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">{t('weatherLoading')}</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4 flex items-center justify-center">
          <Cloud className="w-5 h-5 text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">{error || t('weatherError')}</span>
          <Button variant="ghost" size="sm" onClick={refreshWeather} className="ml-2">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Main Weather Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.icon)}
            <div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {weather.location}
              </div>
              <p className="text-xs text-muted-foreground">{weather.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Thermometer className="w-4 h-4 text-destructive" />
              <span className="font-semibold">{weather.temperature}°C</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-4 h-4 text-primary" />
              <span className="text-sm">{weather.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{weather.windSpeed} km/h</span>
            </div>
            <Button variant="ghost" size="sm" onClick={refreshWeather} className="h-8 w-8 p-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Farming Alert */}
        {weather.farmingAlert && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/30">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm text-warning">{weather.farmingAlert}</span>
          </div>
        )}

        {/* Additional Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {weather.uvIndex !== undefined && (
            <div className="p-2 rounded-lg bg-muted/50">
              <Sun className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
              <p className="text-xs text-muted-foreground">{t('uvIndex')}</p>
              <p className="font-semibold">{weather.uvIndex.toFixed(1)}</p>
            </div>
          )}
          {weather.precipitation !== undefined && (
            <div className="p-2 rounded-lg bg-muted/50">
              <Umbrella className="w-4 h-4 mx-auto text-blue-500 mb-1" />
              <p className="text-xs text-muted-foreground">{t('precipitation')}</p>
              <p className="font-semibold">{weather.precipitation} mm</p>
            </div>
          )}
          <div className="p-2 rounded-lg bg-muted/50">
            <Droplets className="w-4 h-4 mx-auto text-cyan-500 mb-1" />
            <p className="text-xs text-muted-foreground">{t('humidity')}</p>
            <p className="font-semibold">{weather.humidity}%</p>
          </div>
        </div>

        {/* 4-Day Forecast */}
        {weather.forecast && weather.forecast.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">{t('forecast')}</p>
            <div className="grid grid-cols-4 gap-2">
              {weather.forecast.map((day, index) => (
                <div key={index} className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-xs font-medium">{day.day}</p>
                  {getWeatherIcon(day.icon, 'w-5 h-5 mx-auto my-1')}
                  <p className="text-sm font-semibold">{day.temp}°</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground text-center">
            {t('lastUpdated')}: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
