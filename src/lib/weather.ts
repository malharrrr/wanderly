export async function getWeatherContext(destination: string, season: string): Promise<string> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  
  // If no API key is present, we return a generic context string.
  // In production, Gemini will use this to reason about the climate.
  if (!apiKey) {
    console.log(`🌤️ No Weather API key. Simulating climate context for ${destination} in ${season}.`);
    return `Assume typical historical weather for ${destination} during ${season}. Plan accordingly.`;
  }

  try {
    const geoRes = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${destination}&limit=1&appid=${apiKey}`);
    const geoData = await geoRes.json();
    if (!geoData.length) return 'Weather data unavailable.';

    const { lat, lon } = geoData[0];
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    const weatherData = await weatherRes.json();

    return `Current live weather in ${destination}: ${weatherData.weather[0].description}, ${Math.round(weatherData.main.temp)}°C. If the trip is soon, prioritize activities suited for this weather.`;
  } catch (error) {
    console.error('Weather fetch error:', error);
    return 'Weather data unavailable.';
  }
}