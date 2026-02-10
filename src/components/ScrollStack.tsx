"use client";
import React, { useEffect, useRef, useState } from "react";

export interface ScrollStackCard {
    title: string;
    subtitle?: string;
    badge?: string;
    backgroundImage?: string;
    content?: React.ReactNode;
}

interface ScrollStackProps {
    cards: ScrollStackCard[];
    backgroundColor?: string;
    cardHeight?: string;
    animationDuration?: string;
    sectionHeightMultiplier?: number;
    intersectionThreshold?: number;
    className?: string;
}

const defaultBackgrounds = [
    "https://images.pexels.com/photos/6985136/pexels-photo-6985136.jpeg",
    "https://images.pexels.com/photos/6985128/pexels-photo-6985128.jpeg",
    "https://images.pexels.com/photos/2847648/pexels-photo-2847648.jpeg",
    "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg",
    "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg",
    "https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg",
    "https://images.pexels.com/photos/7988086/pexels-photo-7988086.jpeg",
];

const ScrollStack: React.FC<ScrollStackProps> = ({
    cards,
    backgroundColor = "bg-background",
    cardHeight = "65vh",
    animationDuration = "0.5s",
    sectionHeightMultiplier = 3,
    intersectionThreshold = 0.1,
    className = "",
}) => {
    const scrollableSectionRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const cardsContainerRef = useRef<HTMLDivElement>(null);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [isScrollLocked, setIsScrollLocked] = useState(false);
    const [hasCompletedScroll, setHasCompletedScroll] = useState(false);
    const ticking = useRef(false);
    const cardCount = cards.length;

    const cardStyle: React.CSSProperties = {
        height: cardHeight,
        borderRadius: "24px",
        transition: `transform ${animationDuration} cubic-bezier(0.19, 1, 0.22, 1), opacity ${animationDuration} cubic-bezier(0.19, 1, 0.22, 1)`,
        willChange: "transform, opacity",
    };

    // Prevent body scroll when locked — use overflow instead of position:fixed
    // to avoid scroll-position desync issues with the navbar section detection
    useEffect(() => {
        if (isScrollLocked) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isScrollLocked]);

    // Handle scroll locking logic with wheel events
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (!sectionRef.current || !scrollableSectionRef.current) return;

            const rect = sectionRef.current.getBoundingClientRect();
            const isInView =
                rect.top <= 100 && rect.bottom >= window.innerHeight * 0.5;

            if (isInView && !hasCompletedScroll) {
                const scrollContainer = scrollableSectionRef.current;
                const maxScroll =
                    scrollContainer.scrollHeight - scrollContainer.clientHeight;
                const currentScroll = scrollContainer.scrollTop;

                if (e.deltaY > 0) {
                    e.preventDefault();
                    setIsScrollLocked(true);

                    scrollContainer.scrollTop += e.deltaY;

                    if (scrollContainer.scrollTop >= maxScroll - 5) {
                        setHasCompletedScroll(true);
                        setIsScrollLocked(false);
                    }
                } else if (e.deltaY < 0) {
                    if (currentScroll <= 5) {
                        setIsScrollLocked(false);
                        return;
                    }

                    e.preventDefault();
                    setIsScrollLocked(true);
                    scrollContainer.scrollTop += e.deltaY;
                }
            } else if (isInView && hasCompletedScroll && e.deltaY < 0) {
                const scrollContainer = scrollableSectionRef.current;
                const maxScroll =
                    scrollContainer.scrollHeight - scrollContainer.clientHeight;

                if (scrollContainer.scrollTop >= maxScroll - 10) {
                    e.preventDefault();
                    setIsScrollLocked(true);
                    setHasCompletedScroll(false);
                    scrollContainer.scrollTop += e.deltaY;
                }
            }
        };

        if (isIntersecting) {
            window.addEventListener("wheel", handleWheel, { passive: false });
        }

        return () => {
            window.removeEventListener("wheel", handleWheel);
        };
    }, [isIntersecting, hasCompletedScroll]);

    // Intersection observer
    useEffect(() => {
        const currentSection = sectionRef.current;
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                setIsIntersecting(entry.isIntersecting);

                if (!entry.isIntersecting) {
                    if (entry.boundingClientRect.top > 0) {
                        setHasCompletedScroll(false);
                        setIsScrollLocked(false);
                        if (scrollableSectionRef.current) {
                            scrollableSectionRef.current.scrollTop = 0;
                        }
                    } else if (entry.boundingClientRect.bottom < 0) {
                        setIsScrollLocked(false);
                    }
                }
            },
            { threshold: intersectionThreshold }
        );

        if (currentSection) {
            observer.observe(currentSection);
        }

        return () => {
            if (currentSection) observer.unobserve(currentSection);
        };
    }, [intersectionThreshold]);

    // Handle internal scroll for card animation
    useEffect(() => {
        const handleScroll = () => {
            if (!ticking.current) {
                requestAnimationFrame(() => {
                    if (!sectionRef.current || !cardsContainerRef.current) return;

                    const scrollContainer = scrollableSectionRef.current;
                    if (!scrollContainer) return;

                    const scrollTop = scrollContainer.scrollTop;
                    const maxScroll =
                        scrollContainer.scrollHeight - scrollContainer.clientHeight;
                    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

                    let newActiveIndex = 0;
                    const progressPerCard = 1 / cardCount;
                    for (let i = 0; i < cardCount; i++) {
                        if (progress >= progressPerCard * (i + 1)) {
                            newActiveIndex = i + 1;
                        }
                    }

                    setActiveCardIndex(Math.min(newActiveIndex, cardCount - 1));
                    ticking.current = false;
                });
                ticking.current = true;
            }
        };

        const scrollElement = scrollableSectionRef.current;
        scrollElement?.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        return () => {
            scrollElement?.removeEventListener("scroll", handleScroll);
        };
    }, [cardCount]);

    const getCardTransform = (index: number) => {
        const isVisible = isIntersecting && activeCardIndex >= index;
        // Scale cards progressively — cards closer to front are slightly larger
        const scaleStep = 0.015;
        const scale = 0.85 + index * scaleStep;
        let translateY = "100px";

        if (isVisible) {
            // Stack cards with decreasing offset so they appear layered
            const stackOffset = 80 - index * (60 / cardCount);
            translateY = `${stackOffset}px`;
        }

        return {
            transform: `translateY(${translateY}) scale(${scale})`,
            opacity: isVisible ? (index === 0 ? 0.85 : 1) : 0,
            zIndex: 10 + index * 10,
            pointerEvents: isVisible ? "auto" : "none",
        };
    };

    return (
        <section
            ref={scrollableSectionRef}
            className="relative w-full h-screen overflow-y-scroll"
            style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
            }}
        >
            {/* Hide webkit scrollbar */}
            <style>{`
        .scroll-stack-section::-webkit-scrollbar {
          display: none;
        }
      `}</style>

            <div
                ref={sectionRef}
                className={`relative ${className}`}
                style={{ height: `${sectionHeightMultiplier * 100}vh` }}
            >
                <div
                    className={`sticky top-0 w-full h-screen flex items-center 
            justify-center overflow-hidden ${backgroundColor} z-[40]`}
                >
                    <div className="container px-6 lg:px-8 mx-auto h-full flex flex-col justify-center pt-20">
                        <div
                            ref={cardsContainerRef}
                            className="relative w-full max-w-6xl mx-auto flex-shrink-0"
                            style={{ height: cardHeight }}
                        >
                            {cards.map((card, index) => {
                                const cardTransform = getCardTransform(index);
                                const backgroundImage =
                                    card.backgroundImage ||
                                    defaultBackgrounds[index % defaultBackgrounds.length];

                                return (
                                    <div
                                        key={index}
                                        className="absolute overflow-hidden shadow-xl transition-all duration-300"
                                        style={{
                                            ...cardStyle,
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
                                        {/* Background image with overlay */}
                                        <div
                                            className="absolute inset-0 z-0"
                                            style={{
                                                backgroundImage: `url('${backgroundImage}')`,
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                            }}
                                        />
                                        {/* Dark gradient overlay */}
                                        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/80 via-black/60 to-black/40" />

                                        {/* Badge */}
                                        {card.badge && (
                                            <div className="absolute top-4 right-4 z-20">
                                                <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white">
                                                    <span className="text-sm font-medium">
                                                        {card.badge}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="relative z-10 p-5 sm:p-6 md:p-8 h-full flex items-center">
                                            {card.content ? (
                                                card.content
                                            ) : (
                                                <div className="max-w-lg">
                                                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                                                        {card.title}
                                                    </h3>
                                                    {card.subtitle && (
                                                        <p className="text-lg text-white/80">
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
                        <div className="flex justify-center gap-2 mt-8">
                            {cards.map((_, index) => (
                                <div
                                    key={index}
                                    className="w-2 h-2 rounded-full transition-all duration-300"
                                    style={{
                                        background:
                                            activeCardIndex >= index
                                                ? "linear-gradient(135deg, #FF8C42, #F59E42)"
                                                : "rgba(255, 255, 255, 0.15)",
                                        transform:
                                            activeCardIndex === index
                                                ? "scale(1.4)"
                                                : "scale(1)",
                                        boxShadow:
                                            activeCardIndex === index
                                                ? "0 0 10px rgba(255, 140, 66, 0.5)"
                                                : "none",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ScrollStack;
