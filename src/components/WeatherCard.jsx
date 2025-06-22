import React from 'react';
import { motion } from 'framer-motion';

const WeatherIcon = ({ condition }) => {
  // A simple mapping from our weather description to an icon.
  // In a real app, you might use a more comprehensive icon set.
  let icon = '☀️'; // Default to sunny
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('cloudy') || lowerCondition.includes('overcast')) icon = '☁️';
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) icon = '🌧️';
  if (lowerCondition.includes('thunderstorm')) icon = '⛈️';
  if (lowerCondition.includes('snow')) icon = '❄️';
  if (lowerCondition.includes('fog')) icon = '🌫️';

  return <span className="text-4xl">{icon}</span>;
};

const WeatherCard = ({ weatherData }) => {
  if (!weatherData) return null;

  const { date, forecast, advice } = weatherData;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black/50 rounded-lg shadow-lg p-4 mb-4 backdrop-blur-md border border-white/10"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <WeatherIcon condition={forecast.condition} />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-[#E8D5A4]">Weather for {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          <p className="text-md text-[#F4E1C1]">{forecast.condition}</p>
          <div className="flex gap-4 text-sm text-[#F4E1C1]/80 mt-1">
            <span>High: {forecast.temp_max}</span>
            <span>Low: {forecast.temp_min}</span>
          </div>
        </div>
      </div>
      <p className="text-[#F4E1C1]/90 mt-3 text-sm italic">"{advice}"</p>
    </motion.div>
  );
};

export default WeatherCard; 