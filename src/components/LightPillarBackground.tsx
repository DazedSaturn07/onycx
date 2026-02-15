"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

const LightPillar = dynamic(() => import("@/components/LightPillar"), {
    ssr: false,
});

/**
 * LightPillarBackground — Fixed WebGL overlay with mix-blend-mode: screen.
 * Dark areas become transparent, glow adds to content.
 *
 * Perf: Defers WebGL mount until user scrolls past 60% of the hero section
 * to avoid double-rendering hero canvas + light pillar simultaneously.
 * Uses IntersectionObserver for efficient scroll detection (no per-frame cost).
 */
export default function LightPillarBackground() {
    const [shouldMount, setShouldMount] = useState(false);
    const [visible, setVisible] = useState(false);
    const hasInitialized = useRef(false);

    useEffect(() => {
        const heroEl = document.getElementById("home");
        if (!heroEl) {
            setShouldMount(true);
            setVisible(true);
            return;
        }

        // Use IntersectionObserver for efficient, non-blocking scroll detection
        // When the sentinel (placed at 70% of hero height) leaves the viewport, mount
        const sentinel = document.createElement("div");
        sentinel.style.cssText = "position:absolute;width:1px;height:1px;pointer-events:none;";
        sentinel.style.top = `${heroEl.offsetHeight * 0.7}px`;
        heroEl.appendChild(sentinel);

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Sentinel scrolled past viewport top → user is past hero
                if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
                    if (!hasInitialized.current) {
                        hasInitialized.current = true;
                        setShouldMount(true);
                        // Small delay so WebGL can initialize before making visible
                        setTimeout(() => setVisible(true), 100);
                    }
                }
            },
            { threshold: 0 }
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
            if (heroEl.contains(sentinel)) {
                heroEl.removeChild(sentinel);
            }
        };
    }, []);

    // Don't even mount the WebGL component until needed
    if (!shouldMount) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 2,
                pointerEvents: "none",
                mixBlendMode: "screen",
                opacity: visible ? 1 : 0,
                transition: "opacity 0.8s ease-in-out",
            }}
            aria-hidden="true"
        >
            <LightPillar
                topColor="#bd831f"
                bottomColor="#bf4040"
                intensity={0.85}
                rotationSpeed={0.3}
                glowAmount={0.002}
                pillarWidth={3}
                pillarHeight={0.4}
                noiseIntensity={0.5}
                pillarRotation={173}
                interactive
                mixBlendMode="screen"
                quality="medium"
            />
        </div>
    );
}
