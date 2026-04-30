"use client";

import { ArrowLeftCircle, ArrowRightCircle } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
} from "react";

export interface ThreeDImageCarouselSlide {
  id: number;
  src: string;
  href: string;
  title: string;
}

interface ThreeDImageCarouselProps {
  slides: ThreeDImageCarouselSlide[];
  itemCount?: 3 | 5;
  autoplay?: boolean;
  delay?: number;
  pauseOnHover?: boolean;
  className?: string;
  onActiveIndexChange?: (index: number) => void;
}

const EMBEDDED_CSS = `
.cinema-3d-carousel {
  position: relative;
  width: min(100%, 74rem);
  height: clamp(18rem, 43vh, 31rem);
  margin: 0 auto;
  z-index: 20;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;
  perspective: 1200px;
}

.cinema-3d-carousel__slides {
  position: relative;
  height: 100%;
}

.cinema-3d-carousel__item {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateY(-50%) translateX(-50%) scale(0.3);
  transition:
    transform 0.9s var(--ease-cinema),
    opacity 0.9s var(--ease-cinema),
    filter 0.9s var(--ease-cinema);
  opacity: 0;
  z-index: 1;
  cursor: grab;
}

.cinema-3d-carousel__item:active {
  cursor: grabbing;
}

.cinema-3d-carousel__item.is-now {
  transform: translateY(-50%) translateX(-50%) scale(1);
  opacity: 1;
  z-index: 5;
  cursor: default;
}

.cinema-3d-carousel__item.is-next {
  transform: translateY(-50%) translateX(-124%) scale(0.58) rotateY(8deg);
  opacity: 1;
  z-index: 4;
}

.cinema-3d-carousel__item.is-prev {
  transform: translateY(-50%) translateX(24%) scale(0.58) rotateY(-8deg);
  opacity: 1;
  z-index: 4;
}

.cinema-3d-carousel__item.is-next2 {
  transform: translateY(-50%) translateX(-178%) scale(0.38) rotateY(12deg);
  opacity: 0.72;
  z-index: 2;
}

.cinema-3d-carousel__item.is-prev2 {
  transform: translateY(-50%) translateX(78%) scale(0.38) rotateY(-12deg);
  opacity: 0.72;
  z-index: 2;
}

.cinema-3d-carousel__card {
  position: relative;
  display: block;
  width: clamp(14rem, 27vw, 22rem);
  aspect-ratio: 3300 / 2550;
  overflow: hidden;
  border-radius: clamp(2.4rem, 4.2vw, 3.2rem);
  background: #151515;
  padding: 0;
  box-shadow:
    0 36px 90px rgba(0, 0, 0, 0.46);
  text-decoration: none;
}

.cinema-3d-carousel__card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(125deg, rgba(255, 255, 255, 0.16), transparent 31%, transparent 67%, rgba(255, 77, 0, 0.08)),
    linear-gradient(180deg, transparent 62%, rgba(0, 0, 0, 0.28));
  mix-blend-mode: screen;
}

.cinema-3d-carousel__image {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: contain;
  background: #101010;
  pointer-events: none;
}

.cinema-3d-carousel__item:not(.is-now) .cinema-3d-carousel__image {
  filter: grayscale(0.92) saturate(0.72) contrast(0.96);
}

.cinema-3d-carousel__arrow {
  position: absolute;
  top: 50%;
  z-index: 7;
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: rgba(8, 8, 8, 0.58);
  color: rgba(255, 255, 255, 0.9);
  padding: 0;
  transform: translateY(-50%);
  backdrop-filter: blur(18px);
  transition:
    transform 0.35s var(--ease-cinema),
    background-color 0.35s var(--ease-cinema),
    border-color 0.35s var(--ease-cinema),
    color 0.35s var(--ease-cinema);
}

.cinema-3d-carousel__arrow:hover {
  border-color: var(--accent);
  background: var(--accent);
  color: #080808;
  transform: translateY(-50%) scale(1.06);
}

.cinema-3d-carousel__arrow--left {
  left: clamp(0.2rem, 2vw, 1rem);
}

.cinema-3d-carousel__arrow--right {
  right: clamp(0.2rem, 2vw, 1rem);
}

@media (min-width: 991px) {
  .cinema-3d-carousel__arrow--left {
    left: -0.6rem;
  }

  .cinema-3d-carousel__arrow--right {
    right: -0.6rem;
  }
}

@media (max-width: 760px) {
  .cinema-3d-carousel {
    height: clamp(16rem, 48vh, 25rem);
  }

  .cinema-3d-carousel__card {
    width: clamp(13rem, 68vw, 19rem);
  }

  .cinema-3d-carousel__item.is-next {
    transform: translateY(-50%) translateX(-102%) scale(0.5) rotateY(8deg);
  }

  .cinema-3d-carousel__item.is-prev {
    transform: translateY(-50%) translateX(2%) scale(0.5) rotateY(-8deg);
  }

  .cinema-3d-carousel__item.is-next2,
  .cinema-3d-carousel__item.is-prev2 {
    opacity: 0;
  }
}
`;

function getSlideClassName(
  index: number,
  activeIndex: number,
  total: number,
  visibleCount: 3 | 5
) {
  const diff = index - activeIndex;

  if (diff === 0) return "is-now";
  if (diff === 1 || diff === -total + 1) return "is-next";
  if (visibleCount === 5 && (diff === 2 || diff === -total + 2)) return "is-next2";
  if (diff === -1 || diff === total - 1) return "is-prev";
  if (visibleCount === 5 && (diff === -2 || diff === total - 2)) return "is-prev2";

  return "";
}

export default function ThreeDImageCarousel({
  slides,
  itemCount = 5,
  autoplay = false,
  delay = 3,
  pauseOnHover = true,
  className = "",
  onActiveIndexChange,
}: ThreeDImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const autoplayIntervalRef = useRef<number | null>(null);
  const total = slides.length;
  const swipeThreshold = 50;

  const navigate = useCallback(
    (direction: "next" | "prev") => {
      if (total <= 1) return;

      setActiveIndex((current) => {
        return direction === "next"
          ? (current + 1) % total
          : (current - 1 + total) % total;
      });
    },
    [total]
  );

  useEffect(() => {
    onActiveIndexChange?.(activeIndex);
  }, [activeIndex, onActiveIndexChange]);

  useEffect(() => {
    if (activeIndex >= total && total > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, total]);

  const stopAutoplay = useCallback(() => {
    if (autoplayIntervalRef.current) {
      window.clearInterval(autoplayIntervalRef.current);
      autoplayIntervalRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    if (!autoplay || total <= 1) return;

    stopAutoplay();
    autoplayIntervalRef.current = window.setInterval(() => {
      navigate("next");
    }, delay * 1000);
  }, [autoplay, delay, navigate, stopAutoplay, total]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    stopAutoplay();
  };

  const handleEnd = (clientX: number) => {
    if (!isDragging) return;

    const distance = clientX - startX;

    if (Math.abs(distance) > swipeThreshold) {
      navigate(distance < 0 ? "next" : "prev");
    }

    setIsDragging(false);
    setStartX(0);
  };

  const handleMouseEnter = () => {
    if (autoplay && pauseOnHover) {
      stopAutoplay();
    }
  };

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleEnd(event.clientX);
    }

    if (autoplay && pauseOnHover) {
      startAutoplay();
    }
  };

  const handleMouseUp = (event: MouseEvent<HTMLDivElement>) => {
    handleEnd(event.clientX);

    if (autoplay && !pauseOnHover) {
      startAutoplay();
    }
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    handleEnd(event.changedTouches[0].clientX);
    startAutoplay();
  };

  if (total === 0) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EMBEDDED_CSS }} />

      <div
        className={`cinema-3d-carousel ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={(event) => handleStart(event.clientX)}
        onMouseUp={handleMouseUp}
        onTouchStart={(event) => handleStart(event.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
      >
        <div className="cinema-3d-carousel__slides">
          {slides.map((slide, index) => {
            const positionClass = getSlideClassName(index, activeIndex, total, itemCount);
            const isVisible = Boolean(positionClass);

            return (
              <div
                key={slide.id}
                className={`cinema-3d-carousel__item ${positionClass}`}
                aria-hidden={!isVisible}
              >
                <a
                  href={slide.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cinema-3d-carousel__card"
                  data-cursor="interactive"
                  tabIndex={isVisible ? 0 : -1}
                  aria-label={`Open ${slide.title}`}
                >
                  <Image
                    src={slide.src}
                    alt={`${slide.title} certificate`}
                    width={900}
                    height={695}
                    sizes="(max-width: 760px) 68vw, 350px"
                    className="cinema-3d-carousel__image"
                  />
                </a>
              </div>
            );
          })}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              className="cinema-3d-carousel__arrow cinema-3d-carousel__arrow--left"
              onClick={(event) => {
                event.stopPropagation();
                navigate("prev");
              }}
              aria-label="Previous certificate"
              data-cursor="interactive"
            >
              <ArrowLeftCircle size={30} />
            </button>
            <button
              type="button"
              className="cinema-3d-carousel__arrow cinema-3d-carousel__arrow--right"
              onClick={(event) => {
                event.stopPropagation();
                navigate("next");
              }}
              aria-label="Next certificate"
              data-cursor="interactive"
            >
              <ArrowRightCircle size={30} />
            </button>
          </>
        )}
      </div>
    </>
  );
}
