"use client";

import * as React from "react";

export interface HalftonePalette { background: string; ink: string; warm: string }
export type HalftonePreset = "night" | "paper" | "ember" | "cobalt";
export interface FooterLink { label: string; href?: string; content?: React.ReactNode }
export interface FooterColumn { title: string; links: FooterLink[] }
export interface HalftoneWordmarkFooterProps {
  id?: string; wordmark?: string; label?: string; meta?: string; columns?: FooterColumn[];
  backToTop?: boolean; preset?: HalftonePreset; palette?: Partial<HalftonePalette>;
  dotGap?: number; radius?: number; crop?: number; grain?: number; interactive?: boolean;
  fontFamily?: string; fontWeight?: number; monoFamily?: string; height?: string; className?: string;
}
const PRESETS: Record<HalftonePreset, HalftonePalette> = {
  night: { background: "#0c0c0b", ink: "#e9e4da", warm: "#e9762b" },
  paper: { background: "#efebe3", ink: "#17150f", warm: "#c2361c" },
  ember: { background: "#160a06", ink: "#f2c48c", warm: "#ff5a1f" },
  cobalt: { background: "#0d1b4d", ink: "#dfe7ff", warm: "#ffcd3c" },
};
const SANS_STACK = '"Inter Tight", "Inter Variable", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif';
const MONO_STACK = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace';

export function hwfHex(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map(c => c + c).join("") : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export function hwfRadius(coverage: number, gap: number) { return Math.sqrt(Math.max(0, Math.min(1, coverage))) * gap * .56; }
export function hwfStep(x: number, y: number, vx: number, vy: number, hx: number, hy: number, px: number, py: number, r: number, out = [0, 0, 0, 0]) {
  const dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + .001, f = (1 - d / r) * 2.6;
    vx += dx / d * f; vy += dy / d * f;
  }
  vx = (vx + (hx - x) * .05) * .84; vy = (vy + (hy - y) * .05) * .84;
  out[0] = x + vx; out[1] = y + vy; out[2] = vx; out[3] = vy;
  return out;
}
export function hwfWarmth(x: number, y: number, hx: number, hy: number, span: number) { return span > 0 ? Math.min(1, Math.hypot(x - hx, y - hy) / span) : 0; }
export function hwfFitSize(measured: number, width: number) { return measured > 0 ? width / measured * 100 : 0; }

const HWF_CSS = `
.hwf-root { position:relative; display:flex; flex-direction:column; width:100%; min-height:var(--hwf-height); overflow:hidden; isolation:isolate; background:var(--hwf-bg); color:var(--hwf-ink); font-family:var(--hwf-font); -webkit-font-smoothing:antialiased; }
.hwf-root canvas { position:absolute; inset:0; width:100%; height:100%; display:block; max-width:none; pointer-events:none; }
.hwf-top { position:relative; z-index:1; display:grid; grid-template-columns:minmax(0,1.25fr) repeat(3,minmax(0,1fr)); gap:24px; padding:clamp(28px,3.4vw,48px) clamp(20px,5vw,80px) 0; font-family:var(--hwf-mono); font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; line-height:1.75; }
.hwf-brand strong { display:block; font-weight:500; }
.hwf-brand span { display:block; max-width:23ch; margin-top:10px; opacity:.62; }
.hwf-col h3 { margin:0 0 8px; font:inherit; opacity:.6; font-weight:500; }
.hwf-col ul { list-style:none; margin:0; padding:0; }
.hwf-col a,.hwf-up { display:inline-flex; min-height:36px; align-items:center; color:inherit; text-decoration:none; opacity:.85; background:none; border:0; padding:0; font:inherit; letter-spacing:inherit; text-transform:inherit; cursor:pointer; background-image:linear-gradient(currentColor,currentColor); background-size:0% 1px; background-repeat:no-repeat; background-position:0 85%; transition:opacity .25s ease,background-size .35s cubic-bezier(.2,.7,.1,1); }
.hwf-col a:hover,.hwf-up:hover { opacity:1; background-size:100% 1px; }
.hwf-col a:focus-visible,.hwf-up:focus-visible { outline:1px solid currentColor; outline-offset:3px; opacity:1; }
.hwf-rule { position:relative; z-index:1; display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px 16px; margin:clamp(18px,2.6vw,30px) clamp(20px,5vw,80px) 0; padding-top:12px; border-top:.5px solid color-mix(in srgb,var(--hwf-ink) 20%,transparent); font-family:var(--hwf-mono); font-size:10px; letter-spacing:.1em; text-transform:uppercase; }
.hwf-rule > span { opacity:.6; }
.hwf-stage { flex:1 0 auto; min-height:clamp(170px,22vw,390px); pointer-events:none; }
.hwf-sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
@media(max-width:720px) { .hwf-top { grid-template-columns:minmax(0,1fr) minmax(0,1fr); row-gap:20px; column-gap:16px; font-size:10px; letter-spacing:.07em; line-height:1.5; } .hwf-brand { grid-column:1/-1; } .hwf-brand span { max-width:none; margin-top:3px; } .hwf-col a,.hwf-up { min-height:44px; } .hwf-rule { font-size:9px; letter-spacing:.03em; } }
@media(prefers-reduced-motion:reduce) { .hwf-col a,.hwf-up { transition:none; } }
`;

const TWO_PI = Math.PI * 2;
const WARM_STEPS = 24;

/** Compute a responsive dot gap so letters stay crisp on mobile and dot count stays bounded on wide screens. */
function responsiveDotGap(baseGap: number, width: number) {
  const clamped = Math.max(3, baseGap);
  if (width < 560) return Math.min(clamped, 3);
  if (width < 920) return Math.min(clamped, 4);
  if (width > 1680) return Math.min(7, Math.max(clamped, Math.round((width / 1440) * clamped * 2) / 2));
  return clamped;
}

/** Kedhareswer Naidu's MIT-licensed 21st.dev footer, adapted from the supplied source. */
export default function HalftoneWordmarkFooter({
  id, wordmark = "halden", label = "Halden Studio", meta = "©2026 · Oslo / Lisbon",
  columns = [], backToTop = true, preset = "night", palette, dotGap = 6, radius = 80,
  crop = .2, grain = .5, interactive = true, fontFamily = SANS_STACK, fontWeight = 800,
  monoFamily = MONO_STACK, height = "560px", className = "",
}: HalftoneWordmarkFooterProps) {
  const background = palette?.background ?? PRESETS[preset].background;
  const inkColor = palette?.ink ?? PRESETS[preset].ink;
  const warmColor = palette?.warm ?? PRESETS[preset].warm;
  const rootRef = React.useRef<HTMLElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current, stage = stageRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    let w = 0, h = 0, dpr = 1, px = -1e5, py = -1e5, raf = 0, resizeRaf = 0;
    let visible = false, awake = true, alive = true, laidOut = false;
    let activeGap = Math.max(3, dotGap), effectiveRadius = Math.max(0, radius);
    let lastFont = "", currentStageH = 0;
    let ring = { x: 0, y: 0, t: -1 };
    let dots = new Float32Array(0), count = 0;
    let grainPattern: CanvasPattern | null = null;

    const mask = document.createElement("canvas");
    const m = mask.getContext("2d", { willReadFrequently: true });
    if (!m) return;

    const ink = hwfHex(inkColor) || [233, 228, 218], warm = hwfHex(warmColor) || [233, 118, 43];
    const warmColors = Array.from({ length: WARM_STEPS + 1 }, (_, b) => {
      if (b === 0) return inkColor;
      const k = b / WARM_STEPS;
      return `rgb(${Math.round(ink[0] + (warm[0] - ink[0]) * k)},${Math.round(ink[1] + (warm[1] - ink[1]) * k)},${Math.round(ink[2] + (warm[2] - ink[2]) * k)})`;
    });
    const bucketLists: number[][] = Array.from({ length: WARM_STEPS + 1 }, () => []);
    const step = [0, 0, 0, 0];

    if (grain > 0) {
      const grainTile = document.createElement("canvas");
      grainTile.width = 256;
      grainTile.height = 256;
      const g = grainTile.getContext("2d");
      if (g) {
        const image = g.createImageData(256, 256);
        for (let i = 0; i < image.data.length; i += 4) {
          const value = Math.random() * 255;
          image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
          image.data[i + 3] = Math.random() < .5 ? 0 : 255;
        }
        g.putImageData(image, 0, 0);
        grainPattern = ctx.createPattern(grainTile, "repeat");
      }
    }

    const layout = () => {
      const nextW = Math.max(1, Math.round(root.getBoundingClientRect().width));
      const gap = responsiveDotGap(dotGap, nextW);
      effectiveRadius = Math.max(0, radius) * Math.min(1.2, Math.max(0.6, nextW / 1280));

      const resolvedFont = getComputedStyle(root).fontFamily || fontFamily;
      const word = wordmark || " ";
      const horizontalMargin = Math.max(8, Math.round(nextW * 0.02));
      const targetW = Math.max(1, nextW - horizontalMargin * 2);

      m.font = `${fontWeight} 100px ${resolvedFont}`;
      const refBox = m.measureText(word);
      const refInkW = (refBox.actualBoundingBoxLeft + refBox.actualBoundingBoxRight) || refBox.width;
      let fit = hwfFitSize(refInkW, targetW);
      m.font = `${fontWeight} ${fit}px ${resolvedFont}`;
      let box = m.measureText(word);
      const actualInkW = (box.actualBoundingBoxLeft + box.actualBoundingBoxRight) || box.width;
      if (actualInkW > 0 && Math.abs(actualInkW - targetW) > 2) {
        fit = fit * (targetW / actualInkW);
        m.font = `${fontWeight} ${fit}px ${resolvedFont}`;
        box = m.measureText(word);
      }

      const cap = box.actualBoundingBoxAscent || fit * .72;
      const descent = Math.max(0, box.actualBoundingBoxDescent);
      // Reserve space below the wordmark for the desktop floating dock or mobile dock button.
      const bottomClearance = nextW <= 760 ? Math.max(76, gap * 2) : Math.max(100, gap * 2);
      const topBreathing = Math.round(Math.max(24, Math.min(68, nextW * 0.042)));
      const cropShift = cap * Math.max(0, Math.min(.6, crop));
      const neededStageH = Math.ceil(topBreathing + Math.max(0, cap + descent - cropShift) + bottomClearance);
      if (stage && Math.abs(currentStageH - neededStageH) > 2) {
        currentStageH = neededStageH;
        stage.style.minHeight = `${neededStageH}px`;
      }

      const nextH = Math.max(1, Math.round(root.getBoundingClientRect().height));
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      if (laidOut && nextW === w && nextH === h && nextDpr === dpr && resolvedFont === lastFont && gap === activeGap) {
        return;
      }

      w = nextW; h = nextH; dpr = nextDpr; lastFont = resolvedFont; activeGap = gap;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);

      const inkLeft = box.actualBoundingBoxLeft;
      const inkRight = box.actualBoundingBoxRight;
      const inkW = (inkLeft + inkRight) || box.width;
      const textX = (w - inkW) / 2 + inkLeft;
      const baseline = h - descent - bottomClearance + cropShift;

      // Render and read back only the tight bounding box around the wordmark.
      const pad = Math.ceil(gap) + 2;
      const bx = Math.max(0, Math.floor(textX - inkLeft - pad));
      const by = Math.max(0, Math.floor(baseline - cap - pad));
      const bx2 = Math.min(w, Math.ceil(textX + inkRight + pad));
      const by2 = Math.min(h, Math.ceil(baseline + descent + pad));
      const bw = Math.max(1, bx2 - bx);
      const bh = Math.max(1, by2 - by);

      mask.width = bw; mask.height = bh;
      m.font = `${fontWeight} ${fit}px ${resolvedFont}`;
      m.fillStyle = "#000"; m.textBaseline = "alphabetic";
      m.fillText(word, textX - bx, baseline - by);

      const img = m.getImageData(0, 0, bw, bh).data;
      const minGx = Math.max(0, Math.floor(bx / gap));
      const maxGx = Math.min(Math.ceil(w / gap) - 1, Math.floor((bx2 - 1) / gap));
      const minGy = Math.max(0, Math.floor(by / gap));
      const maxGy = Math.min(Math.ceil(h / gap) - 1, Math.floor((by2 - 1) / gap));
      const tmp: number[] = [];

      for (let gy = minGy; gy <= maxGy; gy++) {
        for (let gx = minGx; gx <= maxGx; gx++) {
          let sum = 0;
          for (let sy = 0; sy < 3; sy++) {
            const syPos = Math.floor(gy * gap + (sy + .5) * gap / 3);
            if (syPos < by || syPos >= by2) continue;
            const rowOffset = (syPos - by) * bw;
            for (let sx = 0; sx < 3; sx++) {
              const sxPos = Math.floor(gx * gap + (sx + .5) * gap / 3);
              if (sxPos < bx || sxPos >= bx2) continue;
              sum += img[(rowOffset + (sxPos - bx)) * 4 + 3];
            }
          }
          const cov = sum / (9 * 255);
          if (cov < .06) continue;
          const hx = gx * gap + gap / 2, hy = gy * gap + gap / 2;
          tmp.push(hx, hy, 0, 0, hx, hy, hwfRadius(cov, gap));
        }
      }
      dots = new Float32Array(tmp); count = tmp.length / 7;
      laidOut = true;
      awake = true;
    };

    const draw = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
      const r = interactive && !reduced ? effectiveRadius : 0;
      const r2 = r * r;
      const ringAge = ring.t < 0 ? 1e9 : now - ring.t;
      const ringActive = !reduced && ringAge < 900;
      const ringR = ringAge * .9;
      const ringStrength = ringActive ? 3.2 * (1 - ringAge / 900) : 0;
      const pointerActive = r > 0 && px > -1e4;
      let moving = false;

      for (let b = 0; b <= WARM_STEPS; b++) bucketLists[b].length = 0;

      ctx.fillStyle = inkColor;
      ctx.beginPath();

      for (let i = 0; i < count; i++) {
        const j = i * 7, hx = dots[j + 4], hy = dots[j + 5];
        let x = dots[j], y = dots[j + 1], vx = dots[j + 2], vy = dots[j + 3];
        if (!reduced) {
          const dxP = x - px, dyP = y - py;
          const nearPointer = pointerActive && dxP * dxP + dyP * dyP < r2;
          const displaced = x !== hx || y !== hy || vx !== 0 || vy !== 0;

          if (ringActive || nearPointer || displaced) {
            if (ringActive) {
              const dx = hx - ring.x, dy = hy - ring.y, d = Math.sqrt(dx * dx + dy * dy) + .001;
              const band = 1 - Math.min(1, Math.abs(d - ringR) / 26);
              if (band > 0) { const force = band * ringStrength; vx += dx / d * force; vy += dy / d * force; }
            }
            hwfStep(x, y, vx, vy, hx, hy, px, py, r, step);
            [x, y, vx, vy] = step;
            if (Math.abs(vx) + Math.abs(vy) > .02 || Math.abs(x - hx) + Math.abs(y - hy) > .05) moving = true;
            else { x = hx; y = hy; vx = 0; vy = 0; }
            dots[j] = x; dots[j + 1] = y; dots[j + 2] = vx; dots[j + 3] = vy;
          }
        }
        const k = x === hx && y === hy ? 0 : hwfWarmth(x, y, hx, hy, 28);
        if (k <= .02) {
          const rad = dots[j + 6];
          ctx.moveTo(x + rad, y);
          ctx.arc(x, y, rad, 0, TWO_PI);
        } else {
          const bucket = Math.min(WARM_STEPS, Math.max(1, Math.round(k * WARM_STEPS)));
          bucketLists[bucket].push(j);
        }
      }
      ctx.fill();

      for (let b = 1; b <= WARM_STEPS; b++) {
        const list = bucketLists[b];
        if (list.length === 0) continue;
        ctx.fillStyle = warmColors[b];
        ctx.beginPath();
        for (let idx = 0; idx < list.length; idx++) {
          const j = list[idx];
          const x = dots[j], y = dots[j + 1], rad = dots[j + 6];
          ctx.moveTo(x + rad, y);
          ctx.arc(x, y, rad, 0, TWO_PI);
        }
        ctx.fill();
      }

      if (grainPattern && grain > 0) {
        ctx.globalAlpha = Math.min(1, grain) * .09; ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = grainPattern; ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      }
      awake = !reduced && (moving || ringActive);
    };
    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      draw(now);
      if (awake) raf = requestAnimationFrame(loop);
    };
    const wake = () => { awake = true; if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
    const toLocal = (event: PointerEvent) => { const b = canvas.getBoundingClientRect(); return [event.clientX - b.left, event.clientY - b.top]; };
    const onMove = (event: PointerEvent) => { if (!interactive || reduced || event.pointerType === "touch") return; [px, py] = toLocal(event); wake(); };
    const onLeave = () => { px = py = -1e5; wake(); };
    const onDown = (event: PointerEvent) => {
      if (!interactive || reduced || (event.target as HTMLElement).closest("a,button")) return;
      const [x, y] = toLocal(event); ring = { x, y, t: performance.now() }; wake();
    };
    const ensureLayout = () => { if (!visible) { laidOut = false; return; } layout(); wake(); };
    const scheduleLayout = () => {
      if (!visible) { laidOut = false; return; }
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        if (alive) ensureLayout();
      });
    };
    const onVisibility = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else wake(); };
    const onMotion = () => { reduced = motion.matches; px = py = -1e5; ring.t = -1; laidOut = false; ensureLayout(); };
    // Defer the mask until the footer is near the viewport. Sleep while idle, offscreen, or hidden.
    const ro = new ResizeObserver(scheduleLayout); ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { if (!laidOut) layout(); wake(); }
      else { cancelAnimationFrame(raf); cancelAnimationFrame(resizeRaf); raf = 0; resizeRaf = 0; px = py = -1e5; }
    }, { rootMargin: "160px" });
    io.observe(root);
    root.addEventListener("pointermove", onMove, { passive: true }); root.addEventListener("pointerleave", onLeave); root.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("visibilitychange", onVisibility); motion.addEventListener("change", onMotion);
    void document.fonts.ready.then(() => { if (alive && visible) { laidOut = false; ensureLayout(); } });
    return () => {
      alive = false; cancelAnimationFrame(raf); cancelAnimationFrame(resizeRaf); ro.disconnect(); io.disconnect();
      root.removeEventListener("pointermove", onMove); root.removeEventListener("pointerleave", onLeave); root.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVisibility); motion.removeEventListener("change", onMotion);
    };
  }, [wordmark, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, background, inkColor, warmColor]);

  return (
    <footer id={id} ref={rootRef} aria-label="Contact and portfolio links" className={`hwf-root ${className}`} style={{ "--hwf-height": height, "--hwf-bg": background, "--hwf-ink": inkColor, "--hwf-font": fontFamily, "--hwf-mono": monoFamily } as React.CSSProperties}>
      <style>{HWF_CSS}</style><canvas ref={canvasRef} aria-hidden="true" /><span className="hwf-sr">{wordmark}</span>
      <div className="hwf-top">
        <div className="hwf-brand"><strong>{label}</strong><span>{meta}</span></div>
        {columns.map(col => <nav className="hwf-col" key={col.title} aria-label={`Footer ${col.title}`}>
          <h3>{col.title}</h3><ul>{col.links.map(link => <li key={link.label}>{link.content ?? (link.href ? <a href={link.href}>{link.label}</a> : <span>{link.label}</span>)}</li>)}</ul>
        </nav>)}
      </div>
      <div className="hwf-rule"><span>© {new Date().getFullYear()} {label}</span>{backToTop && <a className="hwf-up" href="#main-content">Back to top ↑</a>}</div>
      <div ref={stageRef} className="hwf-stage" aria-hidden="true" />
    </footer>
  );
}
