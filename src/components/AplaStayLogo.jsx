export function AplaStayIcon({ size = 36, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Roof Arch Gradient: Magenta/Purple to Electric Blue to Cyan */}
        <linearGradient id="aplaRoofGrad" x1="12" y1="80" x2="88" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="30%" stopColor="#8B5CF6" />
          <stop offset="65%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Pin Gradient: Violet to Indigo */}
        <linearGradient id="aplaPinGrad" x1="40" y1="58" x2="60" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Soft Drop Glow */}
        <filter id="aplaGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#8B5CF6" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Main Folded Roof Arch */}
      <path
        d="M 50 14
           C 52.5 14, 54.8 15.4, 56.4 17.5
           L 84 50
           C 86.8 53.3, 87 58, 84.5 61.5
           C 82 65, 77.2 65.5, 74 62.5
           L 50 34
           L 26 62.5
           C 22.8 65.5, 18 65, 15.5 61.5
           C 13 58, 13.2 53.3, 16 50
           L 43.6 17.5
           C 45.2 15.4, 47.5 14, 50 14 Z"
        fill="url(#aplaRoofGrad)"
        filter="url(#aplaGlow)"
      />

      {/* Supporting Side Walls (ribbon fold effect) */}
      <path
        d="M 19 56
           L 19 72
           C 19 77, 23 81, 28 81
           L 34 81
           C 37 81, 39 79, 39 76
           L 39 60
           L 26 75
           L 19 56 Z"
        fill="#8B5CF6"
        opacity="0.9"
      />
      
      <path
        d="M 81 56
           L 81 72
           C 81 77, 77 81, 72 81
           L 66 81
           C 63 81, 61 79, 61 76
           L 61 60
           L 74 75
           L 81 56 Z"
        fill="#06B6D4"
        opacity="0.9"
      />

      {/* 4 Square Windows */}
      <rect x="42.5" y="38" width="6.5" height="6.5" rx="1.5" fill="#FFFFFF" />
      <rect x="51" y="38" width="6.5" height="6.5" rx="1.5" fill="#FFFFFF" />
      <rect x="42.5" y="46.5" width="6.5" height="6.5" rx="1.5" fill="#FFFFFF" />
      <rect x="51" y="46.5" width="6.5" height="6.5" rx="1.5" fill="#FFFFFF" />

      {/* Location Pin */}
      <path
        d="M 50 58
           C 45 58, 41 62, 41 67
           C 41 72.5, 47 79.5, 50 83
           C 53 79.5, 59 72.5, 59 67
           C 59 62, 55 58, 50 58 Z"
        fill="url(#aplaPinGrad)"
      />

      {/* Inner Pin Dot */}
      <circle cx="50" cy="67" r="3.2" fill="#FFFFFF" />
    </svg>
  );
}

export default function AplaStayLogo({ 
  size = 38, 
  variant = 'horizontal', // 'horizontal' | 'vertical' | 'iconOnly'
  theme = 'dark',         // 'dark' | 'light'
  showTagline = true,
  className = '' 
}) {
  if (variant === 'iconOnly') {
    return <AplaStayIcon size={size} className={className} />;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`aplastay-brand-logo ${variant} ${className}`}>
      <AplaStayIcon size={size} />
      
      <div className="aplastay-brand-text">
        <div className="brand-wordmark">
          <span className={`brand-word-apla ${isDark ? 'text-white' : 'text-slate'}`}>
            Apla
          </span>
          <span className="brand-word-stay">
            Stay
          </span>
        </div>

        {showTagline && (
          <span className="brand-tagline">
            FIND YOUR PLACE. BELONG TO MORE.
          </span>
        )}
      </div>
    </div>
  );
}
