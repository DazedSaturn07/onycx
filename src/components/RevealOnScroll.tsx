"use client";

import { ReactNode, useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * RevealOnScroll — Framer Motion wrapper that reveals children
 * with a staggered fade-up animation when scrolled into view.
 */
interface RevealOnScrollProps {
    children: ReactNode;
    className?: string;
    width?: "fit" | "full";
    delay?: number;
    direction?: "up" | "down" | "left" | "right";
    once?: boolean;
}

const directionMap = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function RevealOnScroll({
    children,
    className = "",
    width = "full",
    delay = 0,
    direction = "up",
    once = true,
}: RevealOnScrollProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once, margin: "-60px 0px" });
    const offset = directionMap[direction];

    const variants = {
        hidden: { opacity: 0, ...offset },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration: 0.7,
                delay,
                ease,
            },
        },
    };

    return (
        <div
            ref={ref}
            className={width === "full" ? `w-full ${className}` : className}
        >
            <motion.div
                variants={variants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
            >
                {children}
            </motion.div>
        </div>
    );
}
