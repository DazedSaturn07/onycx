'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

function cx(...parts: Array<string | undefined | false | null>): string {
  return parts.filter(Boolean).join(' ');
}

export interface FlowSectionProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  'aria-label'?: string;
}

export const FlowSection: React.FC<FlowSectionProps> = ({
  id,
  className,
  style = {},
  children,
  'aria-label': ariaLabel,
}) => (
  <section
    id={id}
    data-flow-section
    aria-label={ariaLabel}
    className={cx('relative w-full flex items-center justify-center px-3 py-2 md:px-8 md:py-5', className)}
  >
    <div
      data-flow-inner
      className={cx(
        'flow-art-container relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.5)] w-full max-w-[1120px] mx-auto',
        'bg-background',
      )}
      style={{ transformOrigin: 'bottom left', ...style }}
    >
      <div className="flex flex-col flex-1 gap-2 p-3 md:gap-3.5 md:p-6 lg:p-8">
        {children}
      </div>
    </div>
  </section>
);

export interface FlowArtProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

const childCount = (children: React.ReactNode) => React.Children.count(children);

const FlowArt: React.FC<FlowArtProps> = ({
  children,
  className,
  'aria-label': ariaLabel = 'Story scroll',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const touchState = useRef<{
    startX: number;
    startY: number;
    dx: number;
    axis: 'x' | 'y' | null;
  } | null>(null);
  const totalCards = childCount(children);
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (totalCards <= 1) return;
      setActive(Math.max(0, Math.min(totalCards - 1, index)));
    },
    [totalCards],
  );

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const root = containerRef.current;
      const sectionContainer = root.closest<HTMLElement>('.project-catalog-section, .project-web-section');
      const headingEl = sectionContainer?.querySelector<HTMLElement>('.portfolio-heading') ?? null;
      const media = gsap.matchMedia();

      media.add(
        '(min-width: 768px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)',
        () => {
          const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-flow-section]'));
          const lastSection = sections[sections.length - 1];
          if (!lastSection) return;

          const getHeadingTop = () => Math.max(18, Math.round(window.innerHeight * 0.03));
          const getPinTop = () => {
            const headingHeight = headingEl ? headingEl.getBoundingClientRect().height : 0;
            return Math.max(110, Math.round(getHeadingTop() + headingHeight + 14));
          };

          // Pin the section heading alongside multi-card decks so stacking cards stay cleanly below it,
          // and unpin both together when the last card of the group settles onto the stack.
          if (headingEl && sections.length > 1) {
            ScrollTrigger.create({
              trigger: headingEl,
              start: () => `top ${getHeadingTop()}px`,
              endTrigger: lastSection,
              end: () => `top ${getPinTop()}px`,
              pin: true,
              pinSpacing: false,
              invalidateOnRefresh: true,
            });
          }

          sections.forEach((section, i) => {
            const inner = section.querySelector<HTMLElement>('.flow-art-container');
            if (!inner) return;
            gsap.set(section, { zIndex: i + 1 });
            if (i > 0) {
              gsap.fromTo(
                inner,
                { rotation: 7 },
                {
                  rotation: 0,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: section,
                    start: 'top 95%',
                    end: () => `top ${getPinTop() + 24}px`,
                    scrub: true,
                    invalidateOnRefresh: true,
                  },
                },
              );
            }
            if (i < sections.length - 1) {
              ScrollTrigger.create({
                trigger: section,
                start: () => `top ${getPinTop()}px`,
                endTrigger: lastSection,
                end: () => `top ${getPinTop()}px`,
                pin: true,
                pinSpacing: false,
                invalidateOnRefresh: true,
              });
            }
          });
        },
      );
      return () => media.revert();
    },
    { scope: containerRef, dependencies: [totalCards], revertOnUpdate: true },
  );

  // Sync deep-linked card hashes (e.g. /projects#shoplens) so the mobile deck activates the target card.
  useEffect(() => {
    let frame = 0;
    const syncHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash || !containerRef.current) return;
      const sections = Array.from(containerRef.current.querySelectorAll<HTMLElement>('[data-flow-section]'));
      const matched = sections.findIndex((section) => section.id === hash);
      if (matched >= 0) setActive(matched);
    };
    frame = requestAnimationFrame(syncHash);
    window.addEventListener('hashchange', syncHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', syncHash);
    };
  }, [totalCards]);

  // Update mobile card stack positions without touching desktop layout or triggers.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const mq = window.matchMedia('(max-width: 767px)');

    const applyMobileStack = () => {
      const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-flow-section]'));
      if (!mq.matches || sections.length <= 1) {
        sections.forEach((section) => {
          delete section.dataset.stackPos;
          section.removeAttribute('aria-hidden');
          section.inert = false;
        });
        return;
      }

      sections.forEach((section, index) => {
        const diff = index - active;
        if (diff < 0) section.dataset.stackPos = 'past';
        else if (diff === 0) section.dataset.stackPos = '0';
        else if (diff === 1) section.dataset.stackPos = '1';
        else if (diff === 2) section.dataset.stackPos = '2';
        else section.dataset.stackPos = 'far';

        section.setAttribute('aria-hidden', diff === 0 ? 'false' : 'true');
        section.inert = diff !== 0;
      });
    };

    applyMobileStack();
    mq.addEventListener('change', applyMobileStack);
    return () => {
      mq.removeEventListener('change', applyMobileStack);
      const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-flow-section]'));
      sections.forEach((section) => {
        delete section.dataset.stackPos;
        section.removeAttribute('aria-hidden');
        section.inert = false;
      });
    };
  }, [active, totalCards]);

  const clearDrag = () => {
    setDragging(false);
    const deck = deckRef.current;
    if (deck) {
      deck.style.setProperty('--flow-drag-x', '0px');
      deck.style.setProperty('--flow-drag-rot', '0');
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (totalCards <= 1 || !window.matchMedia('(max-width: 767px)').matches) return;
    const touch = event.touches[0];
    touchState.current = { startX: touch.clientX, startY: touch.clientY, dx: 0, axis: null };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const state = touchState.current;
    if (!state) return;
    const touch = event.touches[0];
    const dx = touch.clientX - state.startX;
    const dy = touch.clientY - state.startY;

    if (state.axis === null) {
      if (Math.abs(dx) > Math.abs(dy) + 5 && Math.abs(dx) > 8) {
        state.axis = 'x';
        setDragging(true);
      } else if (Math.abs(dy) > 8) {
        state.axis = 'y';
        return;
      } else {
        return;
      }
    }

    if (state.axis !== 'x') return;
    const resistance =
      (active === 0 && dx > 0) || (active === totalCards - 1 && dx < 0) ? 0.28 : 0.92;
    const clampedDx = dx * resistance;
    state.dx = dx;
    const deck = deckRef.current;
    if (deck) {
      deck.style.setProperty('--flow-drag-x', `${clampedDx.toFixed(1)}px`);
      deck.style.setProperty('--flow-drag-rot', `${(clampedDx * 0.025).toFixed(2)}`);
    }
  };

  const handleTouchEnd = () => {
    const state = touchState.current;
    touchState.current = null;
    if (!state || state.axis !== 'x') {
      clearDrag();
      return;
    }
    const threshold = 42;
    if (state.dx < -threshold && active < totalCards - 1) {
      goTo(active + 1);
    } else if (state.dx > threshold && active > 0) {
      goTo(active - 1);
    }
    clearDrag();
  };

  return (
    <div
      ref={containerRef}
      data-flow-root
      role="group"
      aria-label={ariaLabel}
      className={cx(
        'relative w-full overflow-x-clip',
        totalCards > 1 && 'is-deck',
        dragging && 'is-dragging',
        className,
      )}
    >
      <div
        ref={deckRef}
        className="flow-art-deck"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={clearDrag}
      >
        {children}
      </div>

      {totalCards > 1 && (
        <div className="flow-art-controls" aria-label={`${ariaLabel} card controls`}>
          <button
            type="button"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label="Previous project card"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <div className="flow-art-counter" aria-live="polite" aria-atomic="true">
            <span>{String(active + 1).padStart(2, '0')} / {String(totalCards).padStart(2, '0')}</span>
            <small>Swipe cards</small>
          </div>
          <button
            type="button"
            onClick={() => goTo(active + 1)}
            disabled={active === totalCards - 1}
            aria-label="Next project card"
          >
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FlowArt;
