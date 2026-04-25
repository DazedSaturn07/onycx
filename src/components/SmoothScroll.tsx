"use client";

import { ReactLenis } from "lenis/react";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.075,
        smoothWheel: true,
        wheelMultiplier: 0.88,
        touchMultiplier: 1.12,
      }}
    >
      {children}
    </ReactLenis>
  );
}
