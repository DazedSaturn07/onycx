import { useId } from "react";

/** Static layers of light: a fine core, soft flare, radial haze, and edge reflection. */
export default function WorkLight() {
  const id = `work-light-${useId().replace(/:/g, "")}`;

  return (
    <div className="selected-work-light" aria-hidden="true">
      <svg viewBox="0 0 1200 560" fill="none" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id={`${id}-core`} x1="876" y1="0" x2="876" y2="560" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffe4bd" stopOpacity="0" />
            <stop offset=".16" stopColor="#ffe4bd" stopOpacity=".8" />
            <stop offset=".6" stopColor="#fff0d2" />
            <stop offset="1" stopColor="#fffef1" />
          </linearGradient>
          <linearGradient id={`${id}-orange`} x1="876" y1="0" x2="876" y2="560" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff6028" stopOpacity="0" />
            <stop offset=".18" stopColor="#ff6028" stopOpacity=".8" />
            <stop offset=".7" stopColor="#ff7938" />
            <stop offset="1" stopColor="#ff8f40" />
          </linearGradient>
          <linearGradient id={`${id}-rim`} x1="0" y1="560" x2="1200" y2="560" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff682d" stopOpacity="0" />
            <stop offset=".1" stopColor="#ff682d" stopOpacity=".3" />
            <stop offset=".48" stopColor="#ff793b" stopOpacity=".7" />
            <stop offset=".73" stopColor="#fff3cc" />
            <stop offset=".86" stopColor="#ff8a46" stopOpacity=".8" />
            <stop offset="1" stopColor="#ff682d" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${id}-atmosphere`}>
            <stop stopColor="#ef682d" stopOpacity=".3" />
            <stop offset=".35" stopColor="#d74721" stopOpacity=".18" />
            <stop offset=".7" stopColor="#a72e16" stopOpacity=".07" />
            <stop offset="1" stopColor="#8b210f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-landing`}>
            <stop stopColor="#fff9d6" stopOpacity=".9" />
            <stop offset=".18" stopColor="#ffdd8a" stopOpacity=".6" />
            <stop offset=".48" stopColor="#ff833a" stopOpacity=".23" />
            <stop offset="1" stopColor="#ff5727" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-bloom`} filterUnits="userSpaceOnUse" x="-150" y="-180" width="1500" height="1000" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="30" />
          </filter>
          <filter id={`${id}-soft`} filterUnits="userSpaceOnUse" x="-100" y="-100" width="1400" height="800" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={`${id}-core-soft`} filterUnits="userSpaceOnUse" x="-20" y="-20" width="1240" height="620" colorInterpolationFilters="sRGB">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        <ellipse cx="900" cy="390" rx="480" ry="450" fill={`url(#${id}-atmosphere)`} />
        <ellipse cx="1040" cy="565" rx="360" ry="150" fill={`url(#${id}-atmosphere)`} />
        <path d="M855 0H897V350C897 487 950 544 1125 560H627C802 544 855 487 855 350Z" fill={`url(#${id}-orange)`} filter={`url(#${id}-bloom)`} />
        <path d="M870 0H882V380C882 502 911 547 1020 560H732C841 547 870 502 870 380Z" fill={`url(#${id}-orange)`} filter={`url(#${id}-soft)`} />
        <ellipse cx="876" cy="550" rx="190" ry="100" fill={`url(#${id}-landing)`} />
        <path d="M873.5 0H878.5V410C878.5 510 892 547 940 560H812C860 547 873.5 510 873.5 410Z" fill={`url(#${id}-core)`} filter={`url(#${id}-soft)`} />
        <path d="M876 0V540" stroke={`url(#${id}-core)`} strokeWidth="4" filter={`url(#${id}-core-soft)`} />
        <path d="M30 560H1170" stroke={`url(#${id}-rim)`} strokeWidth="24" filter={`url(#${id}-bloom)`} />
        <path d="M30 560H1170" stroke={`url(#${id}-rim)`} strokeWidth="10" filter={`url(#${id}-soft)`} />
        <path d="M30 560H1170" stroke={`url(#${id}-rim)`} strokeWidth="1.5" />
      </svg>
    </div>
  );
}
