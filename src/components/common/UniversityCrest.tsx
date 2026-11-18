import React from 'react';

interface UniversityCrestProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'gold' | 'navy' | 'white';
  showText?: boolean;
  className?: string;
}

export const UniversityCrest: React.FC<UniversityCrestProps> = ({
  size = 'md',
  variant = 'gold',
  showText = false,
  className = '',
}) => {
  const dimensions = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  }[size];

  const primaryFill = variant === 'white' ? '#FFFFFF' : variant === 'navy' ? '#0F2747' : '#C59B27';
  const secondaryFill = variant === 'white' ? '#94A3B8' : variant === 'navy' ? '#1E5AA8' : '#D4AF37';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        className={`${dimensions} flex-shrink-0 transition-transform duration-300 hover:scale-105`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ITM University Crest"
      >
        {/* Outer Circular Rim */}
        <circle cx="50" cy="50" r="47" stroke={secondaryFill} strokeWidth="2.5" strokeDasharray="3 1.5" />
        <circle cx="50" cy="50" r="43" stroke={primaryFill} strokeWidth="1.5" fill="#0A192F" />

        {/* Heraldic Shield */}
        <path
          d="M50 18 C64 18 72 23 72 38 C72 58 50 78 50 78 C50 78 28 58 28 38 C28 23 36 18 50 18 Z"
          fill="url(#shieldGradient)"
          stroke={secondaryFill}
          strokeWidth="1.5"
        />

        {/* Open Book of Knowledge */}
        <path
          d="M36 42 C42 39 47 41 50 44 C53 41 58 39 64 42 L64 54 C58 51 53 53 50 56 C47 53 42 51 36 54 Z"
          fill="#FFFFFF"
          stroke="#0A192F"
          strokeWidth="1"
        />
        {/* Book Spine */}
        <line x1="50" y1="44" x2="50" y2="56" stroke={secondaryFill} strokeWidth="1.5" />

        {/* Graduation Cap / Mortarboard atop Shield */}
        <polygon points="50,23 63,28 50,33 37,28" fill="#F8FAFC" stroke={secondaryFill} strokeWidth="0.8" />
        <polygon points="50,24 61,28 50,32 39,28" fill={primaryFill} />
        {/* Tassel */}
        <path d="M60 28 L63 34" stroke={secondaryFill} strokeWidth="1" strokeLinecap="round" />

        {/* Laurel Wreath Accents */}
        <path
          d="M22 48 C21 34 29 23 34 19 M78 48 C79 34 71 23 66 19"
          stroke={secondaryFill}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Estd 1984 Ribbon Banner */}
        <rect x="30" y="80" width="40" height="9" rx="2" fill="#0F2747" stroke={secondaryFill} strokeWidth="1" />
        <text
          x="50"
          y="86.5"
          textAnchor="middle"
          fontSize="5"
          fontWeight="bold"
          fill="#FDF6E2"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          letterSpacing="0.8"
        >
          ESTD 1984
        </text>

        {/* Star Badges */}
        <polygon points="50,11 51.5,14 55,14.5 52.5,17 53,20 50,18.5 47,20 47.5,17 45,14.5 48.5,14" fill={secondaryFill} />

        <defs>
          <linearGradient id="shieldGradient" x1="50" y1="18" x2="50" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F2747" />
            <stop offset="1" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-academic-serif text-base sm:text-lg font-extrabold tracking-wide text-[#0A192F] uppercase">
              ITM University
            </span>
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#C59B27] flex items-center gap-1">
            <span>Chartered &bull; UGC Grade A++</span>
          </span>
        </div>
      )}
    </div>
  );
};
