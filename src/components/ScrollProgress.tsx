"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * ScrollProgress — Fixed progress bar at the top of the page.
 * Optimized with Framer Motion useScroll + useSpring for 60fps performance.
 */
export default function ScrollProgress() {
    const { scrollYProgress } = useScroll();

    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
            style={{
                scaleX,
                background: "linear-gradient(90deg, #F59E42, #FF8C42, #22d3ee)",
            }}
        />
    );
}
