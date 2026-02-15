"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePreload } from "@/context/PreloadContext";

/**
 * Preloader — Animated loading screen with name reveal.
 * Plays once on initial page load and exits with a smooth wipe.
 */
export default function Preloader() {
    const { isLoading, progress } = usePreload();
    const [displayProgress, setDisplayProgress] = useState(0);

    // Smooth progress interpolation
    useEffect(() => {
        // approximate the progress with a lerp for smoothness
        const update = () => {
            setDisplayProgress(prev => {
                const diff = progress * 100 - prev;
                if (Math.abs(diff) < 0.1) return progress * 100;
                return prev + diff * 0.1;
            });
            if (displayProgress < progress * 100) {
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
    }, [progress, displayProgress]);


    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center h-[100dvh] w-screen"
                    style={{ background: "#000000" }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
                >
                    <div className="relative flex flex-col items-center gap-4 p-4 text-center">
                        {/* Name reveal */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="font-display font-bold text-3xl md:text-5xl gradient-text-static"
                        >
                            Prashant Yadav
                        </motion.div>

                        {/* Loading bar */}
                        <motion.div
                            className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.div
                                className="h-full rounded-full"
                                style={{ background: "linear-gradient(90deg, #F59E42, #FF8C42)" }}
                                initial={{ width: "0%" }}
                                animate={{ width: `${Math.max(displayProgress, 5)}%` }}
                                transition={{ type: "spring", stiffness: 50, damping: 20 }}
                            />
                        </motion.div>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-white/30 text-sm tracking-[0.3em] uppercase"
                        >
                            Portfolio
                        </motion.p>

                        {/* Percentage */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-white/20 text-xs font-mono mt-2"
                        >
                            {Math.round(displayProgress)}%
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
