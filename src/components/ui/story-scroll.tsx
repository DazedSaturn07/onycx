'use client';

import React, { useRef } from 'react';
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
    className={cx('relative min-h-screen w-full flex items-center justify-center px-4 py-8 md:p-12', className)}
  >
    <div
      data-flow-inner
      className={cx(
        'flow-art-container relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] w-full max-w-7xl mx-auto',
        'bg-background',
      )}
      style={{ transformOrigin: 'bottom left', ...style }}
    >
      <div className="flex flex-col flex-1 gap-6 p-6 md:p-10 lg:p-14">
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

  useGSAP(
    () => {
      if (!containerRef.current) return;
      const root = containerRef.current;
      const media = gsap.matchMedia();
      media.add({
        motion: '(prefers-reduced-motion: no-preference)',
      }, (context) => {
        if (!context.conditions?.motion) return;
        const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-flow-section]'));
        sections.forEach((section, i) => {
          const inner = section.querySelector<HTMLElement>('.flow-art-container');
          if (!inner) return;
          gsap.set(section, { zIndex: i + 1 });
          if (i > 0) gsap.fromTo(inner, { rotation: 30 }, {
            rotation: 0, ease: 'none',
            scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 25%', scrub: true, invalidateOnRefresh: true },
          });
          // Pin at the bottom so tall, vertical mobile cards stay readable before the overlap.
          if (i < sections.length - 1) {
            ScrollTrigger.create({ trigger: section, start: 'bottom bottom', end: 'bottom top', pin: true, pinSpacing: false, invalidateOnRefresh: true });
          }
        });
      });
      return () => media.revert();
    },
    { scope: containerRef, dependencies: [childCount(children)], revertOnUpdate: true },
  );

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={ariaLabel}
      className={cx('w-full overflow-x-clip', className)}
    >
      {children}
    </div>
  );
};

export default FlowArt;
