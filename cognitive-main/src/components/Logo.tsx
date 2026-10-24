import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'dark'
}) => {
  const iconDimensions = {
    sm: { w: 28, h: 28 },
    md: { w: 36, h: 36 },
    lg: { w: 46, h: 46 },
    xl: { w: 56, h: 56 }
  }[size];

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-extrabold',
    xl: 'text-3xl font-extrabold tracking-tight'
  }[size];

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm'
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Bespoke Academic & Neural Cognitive SVG Icon */}
      <div className="relative flex-shrink-0 flex items-center justify-center">
        <svg
          width={iconDimensions.w}
          height={iconDimensions.h}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <defs>
            <linearGradient id="cogGradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#14b8a6" />
              <stop offset="0.55" stopColor="#4f46e5" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="nodeAccent" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#5eead4" />
              <stop offset="1" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Hexagonal Outer Frame */}
          <path
            d="M24 4L41.3205 14V34L24 44L6.67949 34V14L24 4Z"
            fill="url(#cogGradient)"
          />

          {/* Internal Geometric Synapse Network */}
          <path
            d="M24 12V24M24 24L34 30M24 24L14 30M24 24L33 18M24 24L15 18"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.85"
          />

          {/* Central Cognitive Core Node */}
          <circle cx="24" cy="24" r="4.5" fill="#ffffff" />
          <circle cx="24" cy="24" r="2.5" fill="#0f8a86" />

          {/* Peripheral Cognitive Sensors */}
          <circle cx="24" cy="12" r="2.5" fill="url(#nodeAccent)" />
          <circle cx="34" cy="30" r="2.5" fill="url(#nodeAccent)" />
          <circle cx="14" cy="30" r="2.5" fill="url(#nodeAccent)" />
          <circle cx="33" cy="18" r="2" fill="#ffffff" fillOpacity="0.9" />
          <circle cx="15" cy="18" r="2" fill="#ffffff" fillOpacity="0.9" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-tight">
        <span className={`font-display ${titleSizes} ${variant === 'dark' ? 'text-slate-900' : 'text-white'} tracking-tight flex items-center`}>
          Cognitive<span className={`${variant === 'dark' ? 'text-blue-600' : 'text-teal-300'} font-black`}>Adapt</span>
        </span>
        {showSubtitle && (
          <span className={`${subtitleSizes} uppercase tracking-wider font-semibold ${variant === 'dark' ? 'text-slate-500' : 'text-slate-300'}`}>
            Adaptive Learning System
          </span>
        )}
      </div>
    </div>
  );
};
