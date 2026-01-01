import React, { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, Wind, MapPin, Loader2, CloudRain, Sun, CloudSun } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  location: string;
  icon: string;
}

const WeatherWidget: React.FC = () => {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        // Using Open-Meteo free API (no API key required)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
        );
        
        if (!response.ok) throw new Error('Weather fetch failed');
        
        const data = await response.json();
        const current = data.current;
        
        // Get location name using reverse geocoding
        const geoResponse = await fetch(
          `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        
        let locationName = 'Your Location';
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          locationName = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Your Location';
        }

        // Map weather codes to descriptions
        const weatherDescriptions: Record<number, string> = {
          0: 'Clear sky',
          1: 'Mainly clear',
          2: 'Partly cloudy',
          3: 'Overcast',
          45: 'Foggy',
          48: 'Depositing rime fog',
          51: 'Light drizzle',
          53: 'Moderate drizzle',
          55: 'Dense drizzle',
          61: 'Slight rain',
          63: 'Moderate rain',
          65: 'Heavy rain',
          71: 'Slight snow',
          73: 'Moderate snow',
          75: 'Heavy snow',
          80: 'Slight rain showers',
          81: 'Moderate rain showers',
          82: 'Violent rain showers',
          95: 'Thunderstorm',
        };

        setWeather({
          temperature: Math.round(current.temperature_2m),
          humidity: current.relative_humidity_2m,
          windSpeed: Math.round(current.wind_speed_10m),
          description: weatherDescriptions[current.weather_code] || 'Unknown',
          location: locationName,
          icon: current.weather_code <= 3 ? 'sun' : current.weather_code >= 51 ? 'rain' : 'cloud',
        });
        setLoading(false);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(t('weatherError'));
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Default to a location if geolocation fails
          fetchWeather(28.6139, 77.209); // Delhi
        }
      );
    } else {
      fetchWeather(28.6139, 77.209);
    }
  }, [t]);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sun':
        return <Sun className="w-8 h-8 text-warning" />;
      case 'rain':
        return <CloudRain className="w-8 h-8 text-primary" />;
      default:
        return <CloudSun className="w-8 h-8 text-muted-foreground" />;
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-4">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
