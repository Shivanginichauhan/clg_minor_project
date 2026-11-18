import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.js';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`
        relative p-2 rounded-xl border transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-offset-1
        ${isDark
          ? 'bg-[#0f2040] border-[#1e3255] text-amber-300 hover:bg-[#152840] hover:border-amber-400/50 focus:ring-amber-400/40'
          : 'bg-white border-slate-200 text-slate-600 hover:text-[#0F2747] hover:bg-slate-50 hover:border-slate-300 focus:ring-blue-300/50'
        }
        ${className}
      `}
    >
      <span
        className="flex items-center justify-center w-4 h-4 transition-transform duration-300"
        style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(0deg)' }}
      >
        {isDark ? (
          <Moon
            className="w-4 h-4 text-amber-300 transition-all duration-300 group-hover:rotate-12"
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : (
          <Sun
            className="w-4 h-4 text-amber-500 transition-all duration-300"
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
      </span>
    </button>
  );
};
