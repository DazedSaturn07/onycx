"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * ScrollProgress — Fixed progress bar at the top of the page
 * showing scrolling completion as an animated orange line.
 */
export default function ScrollProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const update = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = window.scrollY;
            setProgress(scrollHeight > 0 ? scrolled / scrollHeight : 0);
        };

        window.addEventListener("scroll", update, { passive: true });
        return () => window.removeEventListener("scroll", update);
    }, []);

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
            style={{
                scaleX: progress,
                background: "linear-gradient(90deg, #F59E42, #FF8C42, #22d3ee)",
            }}
        />
    );
}
