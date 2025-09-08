import React from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/components/ThemeSwitch.css';

const ThemeSwitch = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      className="theme-switch"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <span className="theme-switch-track">
        <span className="theme-switch-thumb">
          {isDarkMode ? '🌙' : '☀️'}
        </span>
      </span>
      <span className="theme-switch-label">
        {isDarkMode ? 'Dark Mode' : 'Light Mode'}
      </span>
    </button>
  );
};

export default ThemeSwitch;