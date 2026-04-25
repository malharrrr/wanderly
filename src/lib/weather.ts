import { WeatherForecast, DailyWeather } from '@/types'
function getWeatherDescription(code: number): string {
  if (code === 0) return '☀️ Clear sky'
  if (code === 1 || code === 2 || code === 3) return '⛅️ Partly cloudy'
  if (code >= 45 && code <= 48) return '🌫️ Foggy'
  if (code >= 51 && code <= 67) return '🌧️ Rainy'
  if (code >= 71 && code <= 77) return '❄️ Snowing'
  if (code >= 95 && code <= 99) return '⛈️ Thunderstorms'
  return '🌤️ Variable'
}

export async function getWeatherContext(destination: string, season: string): Promise<WeatherForecast | string> {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
    const geoRes = await fetch(geoUrl, { next: { revalidate: 3600 } }) 
    const geoData = await geoRes.json()

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("Location not found")
    }

    const { latitude, longitude, name } = geoData.results[0]

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
    const weatherRes = await fetch(weatherUrl, { next: { revalidate: 1800 } }) 
    const weatherData = await weatherRes.json()

    if (!weatherData.current || !weatherData.daily) {
      throw new Error("Weather data unavailable")
    }

    const currentTemp = Math.round(weatherData.current.temperature_2m)
    const currentWeatherStr = getWeatherDescription(weatherData.current.weather_code)
    
    const summary = `${currentWeatherStr}, ${currentTemp}°C in ${name}.`

    const daily: DailyWeather[] = weatherData.daily.time.map((timeStr: string, index: number) => ({
      date: new Date(timeStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      maxTemp: Math.round(weatherData.daily.temperature_2m_max[index]),
      minTemp: Math.round(weatherData.daily.temperature_2m_min[index]),
      code: weatherData.daily.weather_code[index],
      description: getWeatherDescription(weatherData.daily.weather_code[index])
    }))

    return { summary, daily }

  } catch (error) {
    console.log(`⚠️ Could not fetch live weather for ${destination}.`)
    return `Assume typical historical weather for ${destination} during ${season}. Plan accordingly.`
  }
}