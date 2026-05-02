import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { themes, getSelectedTheme } from '../../utils/themes';

const ThemeSwitcher = () => {
  const [selectedTheme, setSelectedTheme] = useState(getSelectedTheme());

  const handleThemeChange = (themeName) => {
    setSelectedTheme(themeName);
    localStorage.setItem('selectedTheme', themeName);
    
    // Reload page to apply theme (or implement dynamic theme switching)
    window.location.reload();
  };

  const themeList = Object.entries(themes).map(([key, value]) => ({
    id: key,
    name: value.name,
    colors: Object.values(value.primary).slice(5, 8), // Get mid-range colors
  }));

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200">
      <div className="flex items-center gap-3 mb-8">
        <Palette className="w-6 h-6 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Theme Colors</h2>
      </div>

      <p className="text-gray-600 mb-6">
        Choose your preferred color theme. Your selection will be saved automatically.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themeList.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              selectedTheme === theme.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          >
            {/* Color Swatches */}
            <div className="flex gap-2 mb-4">
              {theme.colors.map((color, idx) => (
                <div
                  key={idx}
                  className="w-8 h-8 rounded-lg shadow-md"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Theme Name */}
            <div className="text-left">
              <p className="font-semibold text-gray-900">{theme.name}</p>
              <p className="text-xs text-gray-500 mt-1">Click to apply</p>
            </div>

            {/* Selected Badge */}
            {selectedTheme === theme.id && (
              <div className="absolute top-3 right-3 bg-primary-600 rounded-full p-1.5">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> The blue & white theme is recommended for best visibility and professionalism.
        </p>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
