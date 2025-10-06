import React, { useState } from "react";
import "./App.css";

function App() {
  const [weather, setWeather] = useState(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCoordinates = async (cityName) => {
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          cityName
        )}&count=1`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return {
          latitude: data.results[0].latitude,
          longitude: data.results[0].longitude,
          name: data.results[0].name,
          country: data.results[0].country,
        };
      } else {
        throw new Error("City not found");
      }
    } catch (err) {
      throw new Error("Failed to find city coordinates");
    }
  };

  // Function to get weather data
  const fetchWeather = async (cityName) => {
    if (!cityName.trim()) return;

    setLoading(true);
    setError("");

    try {
      // First get coordinates
      const coordinates = await fetchCoordinates(cityName);

      // Then get weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      );

      const weatherData = await weatherResponse.json();

      if (!weatherResponse.ok) {
        throw new Error("Failed to fetch weather data");
      }

      // Transform the data to match our expected format
      const transformedData = {
        name: coordinates.name,
        sys: { country: coordinates.country },
        main: {
          temp: weatherData.current.temperature_2m,
          feels_like: weatherData.current.apparent_temperature,
          humidity: weatherData.current.relative_humidity_2m,
          pressure: weatherData.current.pressure_msl,
          temp_max: weatherData.daily.temperature_2m_max[0],
          temp_min: weatherData.daily.temperature_2m_min[0],
        },
        weather: [
          {
            main: getWeatherCondition(weatherData.current.weather_code),
            description: getWeatherDescription(
              weatherData.current.weather_code
            ),
          },
        ],
        wind: {
          speed: weatherData.current.wind_speed_10m,
        },
      };

      setWeather(transformedData);
      setCity("");
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  // Weather code mapping for Open-Meteo API
  const getWeatherCondition = (code) => {
    const weatherMap = {
      0: "Clear",
      1: "Clear",
      2: "Clouds",
      3: "Clouds",
      45: "Fog",
      48: "Fog",
      51: "Drizzle",
      53: "Drizzle",
      55: "Drizzle",
      56: "Drizzle",
      57: "Drizzle",
      61: "Rain",
      63: "Rain",
      65: "Rain",
      66: "Rain",
      67: "Rain",
      71: "Snow",
      73: "Snow",
      75: "Snow",
      77: "Snow",
      80: "Rain",
      81: "Rain",
      82: "Rain",
      85: "Snow",
      86: "Snow",
      95: "Thunderstorm",
      96: "Thunderstorm",
      99: "Thunderstorm",
    };
    return weatherMap[code] || "Clear";
  };

  const getWeatherDescription = (code) => {
    const descMap = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Depositing rime fog",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      71: "Slight snow",
      73: "Moderate snow",
      75: "Heavy snow",
      77: "Snow grains",
      80: "Slight rain showers",
      81: "Moderate rain showers",
      82: "Violent rain showers",
      85: "Slight snow showers",
      86: "Heavy snow showers",
      95: "Thunderstorm",
      96: "Thunderstorm with slight hail",
      99: "Thunderstorm with heavy hail",
    };
    return descMap[code] || "Clear";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeather(city);
  };

  // Get weather icon based on condition
  const getWeatherIcon = (condition) => {
    const iconMap = {
      Clear: "☀️",
      Clouds: "☁️",
      Rain: "🌧️",
      Drizzle: "🌦️",
      Thunderstorm: "⛈️",
      Snow: "❄️",
      Mist: "🌫️",
      Fog: "🌫️",
    };
    return iconMap[condition] || "🌈";
  };

  // Get background gradient based on temperature
  const getBackgroundGradient = (temp) => {
    if (!temp) return "linear-gradient(135deg, #667eea, #764ba2)";
    if (temp < 0) return "linear-gradient(135deg, #74b9ff, #0984e3)";
    if (temp < 15) return "linear-gradient(135deg, #81ecec, #00cec9)";
    if (temp < 25) return "linear-gradient(135deg, #55efc4, #00b894)";
    return "linear-gradient(135deg, #ffeaa7, #fdcb6e)";
  };

  return (
    <div
      className="app"
      style={{
        background: weather
          ? getBackgroundGradient(weather.main.temp)
          : "linear-gradient(135deg, #667eea, #764ba2)",
      }}
    >
      <div className="container">
        <header className="header">
          <h1 className="title">🌤️ WeatherFlow</h1>
          <p className="subtitle">Get real-time weather information</p>
          <div className="api-info">
            <small>Using Open-Meteo API</small>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="search-form">
          <div className="input-group">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name (e.g., London, New York, Tokyo)"
              className="search-input"
            />
            <button type="submit" className="search-button" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {error && <div className="error-message">⚠️ {error}</div>}

        {weather && (
          <div className="weather-card">
            <div className="weather-header">
              <h2 className="city-name">
                {weather.name}, {weather.sys.country}
              </h2>
              <div className="weather-icon">
                {getWeatherIcon(weather.weather[0].main)}
              </div>
            </div>

            <div className="temperature">{Math.round(weather.main.temp)}°C</div>

            <div className="weather-description">
              {weather.weather[0].description}
            </div>

            <div className="weather-details">
              <div className="detail-item">
                <span className="detail-label">Feels like</span>
                <span className="detail-value">
                  {Math.round(weather.main.feels_like)}°C
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Humidity</span>
                <span className="detail-value">{weather.main.humidity}%</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Wind</span>
                <span className="detail-value">{weather.wind.speed} m/s</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Pressure</span>
                <span className="detail-value">
                  {weather.main.pressure} hPa
                </span>
              </div>
            </div>

            <div className="min-max-temp">
              <span>H: {Math.round(weather.main.temp_max)}°C</span>
              <span>L: {Math.round(weather.main.temp_min)}°C</span>
            </div>
          </div>
        )}

        {!weather && !error && !loading && (
          <div className="placeholder">
            <div className="placeholder-icon">🌎</div>
            <h3>Welcome to WeatherFlow</h3>
            <p>Enter a city name above to get started!</p>
            <div className="suggestion">
              <small>Try: London, Paris, New York, Tokyo</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
