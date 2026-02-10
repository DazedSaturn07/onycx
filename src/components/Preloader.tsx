"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Preloader — Animated loading screen with name reveal.
 * Plays once on initial page load and exits with a smooth wipe.
 */
export default function Preloader() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center"
                    style={{ background: "#0b0f14" }}
                    exit={{ y: "-100%" }}
                    transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
                >
                    <div className="relative flex flex-col items-center gap-4">
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
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
