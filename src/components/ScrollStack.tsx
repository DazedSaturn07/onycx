"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";

export interface ScrollStackCard {
    title: string;
    subtitle?: string;
    badge?: string;
    backgroundImage?: string;
    content?: React.ReactNode;
}

interface ScrollStackProps {
    cards: ScrollStackCard[];
    cardHeight?: string;
    sectionHeightMultiplier?: number;
    className?: string;
}

const ScrollStack: React.FC<ScrollStackProps> = ({
    cards,
    cardHeight = "75vh",
    sectionHeightMultiplier = 6,
    className = "",
}) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const rafRef = useRef(0);
    const currentProgressRef = useRef(0);
    const targetProgressRef = useRef(0);
    const cardCount = cards.length;

    // Smooth scroll progress via rAF with lerp
    const updateScrollTarget = useCallback(() => {
        if (!sectionRef.current) return;

        const rect = sectionRef.current.getBoundingClientRect();
        const viewportH = window.innerHeight;
        const sectionH = sectionRef.current.offsetHeight;
        const scrollableDistance = sectionH - viewportH;

        if (scrollableDistance <= 0) return;

        const scrolled = -rect.top;
        targetProgressRef.current = Math.max(0, Math.min(1, scrolled / scrollableDistance));
    }, []);

    useEffect(() => {
        window.addEventListener("scroll", updateScrollTarget, { passive: true });
        updateScrollTarget();

        // Smooth animation loop — lerp current toward target
        const animate = () => {
            const current = currentProgressRef.current;
            const target = targetProgressRef.current;
            const diff = target - current;

            if (Math.abs(diff) > 0.0005) {
                currentProgressRef.current = current + diff * 0.12;
            } else {
                currentProgressRef.current = target;
            }

            const progress = currentProgressRef.current;
            setScrollProgress(progress);

            // Map progress to card index
            const progressPerCard = 1 / cardCount;
            let newActiveIndex = 0;
            for (let i = 0; i < cardCount; i++) {
                if (progress >= progressPerCard * i) {
                    newActiveIndex = i;
                }
            }
            setActiveCardIndex(Math.min(newActiveIndex, cardCount - 1));

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("scroll", updateScrollTarget);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [updateScrollTarget, cardCount]);

    // Each card gets a distinct tint color for visual differentiation
    const cardTints = [
        "rgba(255,140,66,0.04)",   // warm orange
        "rgba(34,211,238,0.04)",   // cyan
        "rgba(139,92,246,0.04)",   // violet
        "rgba(52,211,153,0.04)",   // emerald
        "rgba(251,113,133,0.04)", // rose
        "rgba(255,140,66,0.04)",   // warm orange
        "rgba(34,211,238,0.04)",   // cyan
    ];

    const cardBorderAccents = [
        "rgba(255,140,66,0.12)",
        "rgba(34,211,238,0.12)",
        "rgba(139,92,246,0.12)",
        "rgba(52,211,153,0.12)",
        "rgba(251,113,133,0.12)",
        "rgba(255,140,66,0.12)",
        "rgba(34,211,238,0.12)",
    ];

    const getCardTransform = (index: number) => {
        const progressPerCard = 1 / cardCount;
        const cardStartProgress = progressPerCard * index;
        const cardProgress = Math.max(0, Math.min(1,
            (scrollProgress - cardStartProgress) / progressPerCard
        ));

        const isRevealed = scrollProgress >= cardStartProgress;

        // Each card has a slightly different scale for depth
        const scaleBase = 0.92;
        const scaleStep = 0.008;
        const scale = isRevealed
            ? scaleBase + index * scaleStep + cardProgress * 0.02
            : scaleBase;

        // Stacking: revealed cards stack up with offset
        let translateY: number;
        if (isRevealed) {
            // Slight vertical offset per card for visual separation
            const stackOffset = 20 - index * 4;
            translateY = stackOffset * (1 - cardProgress * 0.3);
        } else {
            translateY = 100 + (index * 8);
        }

        // Opacity with smooth fade in
        const opacity = isRevealed
            ? Math.min(1, cardProgress * 2.5 + 0.4)
            : 0;

        return {
            transform: `translateY(${translateY}px) scale(${scale})`,
            opacity,
            zIndex: 10 + index * 10,
            pointerEvents: isRevealed ? "auto" : "none",
        };
    };

    return (
        <section
            ref={sectionRef}
            className={`relative w-full ${className}`}
            style={{ height: `${sectionHeightMultiplier * 100}vh` }}
        >
            <div className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden">
                <div className="container px-4 sm:px-6 lg:px-8 mx-auto h-full flex flex-col justify-center pt-16 md:pt-20">
                    <div
                        className="relative w-full max-w-7xl mx-auto flex-shrink-0"
                        style={{ height: cardHeight }}
                    >
                        {cards.map((card, index) => {
                            const cardTransform = getCardTransform(index);

                            return (
                                <div
                                    key={index}
                                    className="absolute overflow-hidden"
                                    style={{
                                        height: cardHeight,
                                        borderRadius: "20px",
                                        transition: "none", // rAF handles smoothing now
                                        willChange: "transform, opacity",
                                        top: 0,
                                        left: "50%",
                                        transform: `translateX(-50%) ${cardTransform.transform}`,
                                        width: "100%",
                                        maxWidth: "100%",
                                        opacity: cardTransform.opacity,
                                        zIndex: cardTransform.zIndex,
                                        pointerEvents:
                                            cardTransform.pointerEvents as React.CSSProperties["pointerEvents"],
                                    }}
                                >
                                    {/* Background image */}
                                    {card.backgroundImage && (
                                        <div
                                            className="absolute inset-0 z-0"
                                            style={{
                                                backgroundImage: `url('${card.backgroundImage}')`,
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                            }}
                                        />
                                    )}

                                    {/* Glassmorphism overlay with per-card tint */}
                                    <div
                                        className="absolute inset-0 z-[1]"
                                        style={{
                                            background: `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.35) 100%)`,
                                            backdropFilter: "blur(2px)",
                                            WebkitBackdropFilter: "blur(2px)",
                                        }}
                                    />

                                    {/* Card-specific tint overlay for differentiation */}
                                    <div
                                        className="absolute inset-0 z-[2] pointer-events-none"
                                        style={{
                                            background: cardTints[index % cardTints.length],
                                        }}
                                    />

                                    {/* Glass border with accent color per card */}
                                    <div
                                        className="absolute inset-0 z-[3] pointer-events-none"
                                        style={{
                                            borderRadius: "20px",
                                            border: `1px solid ${cardBorderAccents[index % cardBorderAccents.length]}`,
                                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 40px rgba(0,0,0,0.4)`,
                                        }}
                                    />

                                    {/* Badge */}
                                    {card.badge && (
                                        <div className="absolute top-4 right-4 z-20">
                                            <div
                                                className="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-white"
                                                style={{
                                                    background: "rgba(255,255,255,0.08)",
                                                    backdropFilter: "blur(12px)",
                                                    WebkitBackdropFilter: "blur(12px)",
                                                    border: "1px solid rgba(255,255,255,0.10)",
                                                }}
                                            >
                                                <span className="text-xs font-semibold">
                                                    {card.badge}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="relative z-10 p-5 sm:p-6 md:p-8 lg:p-10 h-full flex items-center">
                                        {card.content ? (
                                            card.content
                                        ) : (
                                            <div className="max-w-lg">
                                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                                                    {card.title}
                                                </h3>
                                                {card.subtitle && (
                                                    <p className="text-base text-white/70">
                                                        {card.subtitle}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Scroll progress dots */}
                    <div className="flex justify-center gap-2 mt-6 md:mt-8">
                        {cards.map((_, index) => (
                            <div
                                key={index}
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: activeCardIndex === index ? "20px" : "6px",
                                    height: "6px",
                                    background:
                                        activeCardIndex >= index
                                            ? "linear-gradient(135deg, #FFB366, #FF8C42, #E85D04)"
                                            : "rgba(255, 255, 255, 0.10)",
                                    boxShadow:
                                        activeCardIndex === index
                                            ? "0 0 12px rgba(255, 140, 66, 0.4)"
                                            : "none",
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ScrollStack;
