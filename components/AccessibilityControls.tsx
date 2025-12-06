'use client';

import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

export default function AccessibilityControls() {
  const { resolvedTheme } = useTheme();
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Apply font size
    document.documentElement.style.fontSize =
      fontSize === 'large' ? '18px' : fontSize === 'xlarge' ? '20px' : '16px';

    // Apply high contrast
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [fontSize, highContrast]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Accessibility</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Font Size
          </label>
          <div className="flex gap-2">
            {(['normal', 'large', 'xlarge'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  fontSize === size
                    ? 'bg-palette-light text-palette-darkest'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Extra Large'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
              className="w-5 h-5 text-palette-dark border-gray-300 rounded focus:ring-palette-light"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              High Contrast Mode
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

