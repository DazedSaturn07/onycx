"use client";

// Aceternity Floating Dock: adapted for Next links, keyboard navigation and reduced motion.
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type DockItem = { title: string; icon: ReactNode; href: string; active?: boolean };

export function FloatingDock({ items }: { items: DockItem[] }) {
  const mouseX = useMotionValue(Infinity);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); }
    };
    const onOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
    };
  }, [open]);

  return (
    <nav ref={root} className="floating-dock" aria-label="Floating navigation">
      <motion.div className="floating-dock-desktop" onMouseMove={(event) => mouseX.set(event.clientX)} onMouseLeave={() => mouseX.set(Infinity)}>
        {items.map((item) => <DockIcon key={item.title} item={item} mouseX={mouseX} />)}
      </motion.div>
      <div className="floating-dock-mobile">
        <AnimatePresence>
          {open && <motion.div id="dock-mobile-links" className="floating-dock-mobile-links" initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 12 }} transition={{ duration: reduced ? 0 : .18 }}>
            {items.map((item) => <Link key={item.title} href={item.href} aria-current={item.active ? "location" : undefined} onClick={() => setOpen(false)}>{item.icon}<span>{item.title}</span></Link>)}
          </motion.div>}
        </AnimatePresence>
        <button ref={toggle} type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls={open ? "dock-mobile-links" : undefined} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
    </nav>
  );
}

function DockIcon({ item, mouseX }: { item: DockItem; mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();
  const distance = useTransform(mouseX, (value) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return value - bounds.x - bounds.width / 2;
  });
  const size = useTransform(distance, [-150, 0, 150], [44, 76, 44]);
  const iconSize = useTransform(distance, [-150, 0, 150], [20, 32, 20]);
  const width = useSpring(size, { mass: .1, stiffness: 150, damping: 12 });
  const widthIcon = useSpring(iconSize, { mass: .1, stiffness: 150, damping: 12 });
  return (
    <Link ref={ref} href={item.href} aria-label={item.title} aria-current={item.active ? "location" : undefined} onFocus={() => setHovered(true)} onBlur={() => setHovered(false)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <motion.div className="floating-dock-icon" style={{ width: reduced ? 44 : width, height: reduced ? 44 : width }}>
        {hovered && <span className="floating-dock-tooltip" aria-hidden="true">{item.title}</span>}
        <motion.span style={{ width: reduced ? 20 : widthIcon, height: reduced ? 20 : widthIcon }}>{item.icon}</motion.span>
      </motion.div>
    </Link>
  );
}
