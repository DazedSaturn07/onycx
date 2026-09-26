"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";

const MAX_POINTS = 40;
const FRAME_INTERVAL = 1000 / 30;

type BlendMode = "normal" | "screen" | "plus-lighter";
type Bounds = { left: number; top: number; right: number; bottom: number };
type Rgb = [number, number, number];

export interface GlowCursorProps extends Omit<HTMLAttributes<HTMLDivElement>, "color"> {
  color?: string;
  secondaryColor?: string;
  trailLength?: number;
  trailWidth?: number;
  trailTaper?: number;
  followSpeed?: number;
  glowIntensity?: number;
  glowSpread?: number;
  hotspot?: number;
  brightness?: number;
  opacity?: number;
  pulseSpeed?: number;
  noiseStrength?: number;
  idleFade?: boolean;
  idleTimeout?: number;
  fadeDuration?: number;
  blendMode?: BlendMode;
  maxDevicePixelRatio?: number;
  enabled?: boolean;
  children?: ReactNode;
}

interface GlowCursorConfig {
  color: string;
  secondaryColor: string;
  trailLength: number;
  trailWidth: number;
  trailTaper: number;
  followSpeed: number;
  glowIntensity: number;
  glowSpread: number;
  hotspot: number;
  brightness: number;
  opacity: number;
  pulseSpeed: number;
  noiseStrength: number;
  idleFade: boolean;
  idleTimeout: number;
  fadeDuration: number;
  blendMode: BlendMode;
  maxDevicePixelRatio: number;
  enabled: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function hexToRgb(hex: string): Rgb {
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3) value = value.split("").map((character) => character + character).join("");
  if (!/^[\da-f]{6}$/i.test(value)) return [0, 0, 0];
  const parsed = Number.parseInt(value, 16);
  return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255];
}

function mixColor(start: Rgb, end: Rgb, amount: number): Rgb {
  return [
    Math.round(start[0] + (end[0] - start[0]) * amount),
    Math.round(start[1] + (end[1] - start[1]) * amount),
    Math.round(start[2] + (end[2] - start[2]) * amount),
  ];
}

function rgba(color: Rgb, alpha: number): string {
  return "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + clamp(alpha, 0, 1) + ")";
}

function unionBounds(first: Bounds | null, second: Bounds | null): Bounds | null {
  if (!first) return second;
  if (!second) return first;
  return {
    left: Math.min(first.left, second.left),
    top: Math.min(first.top, second.top),
    right: Math.max(first.right, second.right),
    bottom: Math.max(first.bottom, second.bottom),
  };
}

export default function GlowCursor({
  color = "#67E8F9",
  secondaryColor = "#A78BFA",
  trailLength = 40,
  trailWidth = 8,
  trailTaper = 0.8,
  followSpeed = 0.16,
  glowIntensity = 1.9,
  glowSpread = 1.2,
  hotspot = 0.65,
  brightness = 1.25,
  opacity = 1,
  pulseSpeed = 1.1,
  noiseStrength = 0.035,
  idleFade = true,
  idleTimeout = 700,
  fadeDuration = 900,
  blendMode = "screen",
  maxDevicePixelRatio = 1,
  enabled = true,
  children,
  className = "",
  style,
  ...rest
}: GlowCursorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef<GlowCursorConfig>({
    color,
    secondaryColor,
    trailLength,
    trailWidth,
    trailTaper,
    followSpeed,
    glowIntensity,
    glowSpread,
    hotspot,
    brightness,
    opacity,
    pulseSpeed,
    noiseStrength,
    idleFade,
    idleTimeout,
    fadeDuration,
    blendMode,
    maxDevicePixelRatio,
    enabled,
  });
  const wakeRendererRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    configRef.current = {
      color,
      secondaryColor,
      trailLength,
      trailWidth,
      trailTaper,
      followSpeed,
      glowIntensity,
      glowSpread,
      hotspot,
      brightness,
      opacity,
      pulseSpeed,
      noiseStrength,
      idleFade,
      idleTimeout,
      fadeDuration,
      blendMode,
      maxDevicePixelRatio,
      enabled,
    };
    wakeRendererRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !enabled) return;

    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!supportsHover || prefersReducedMotion) return;

    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) return;

    const points = Array.from({ length: MAX_POINTS }, () => ({ x: 0, y: 0 }));
    const target = { x: 0, y: 0 };
    const head = { x: 0, y: 0 };
    let width = 1;
    let height = 1;
    let initialized = false;
    let pointerInside = false;
    let fade = 0;
    let lastInputTime = 0;
    let lastFrameTime = 0;
    let previousBounds: Bounds | null = null;
    let animationFrame = 0;
    let idleTimer: number | null = null;
    let rendering = false;
    let destroyed = false;

    const clearBounds = (bounds: Bounds | null) => {
      if (!bounds) return;
      context.clearRect(
        bounds.left,
        bounds.top,
        Math.max(1, bounds.right - bounds.left),
        Math.max(1, bounds.bottom - bounds.top),
      );
    };

    const resize = () => {
      width = Math.max(container.clientWidth, 1);
      height = Math.max(container.clientHeight, 1);
      const pixelRatio = clamp(
        Math.min(window.devicePixelRatio || 1, configRef.current.maxDevicePixelRatio),
        0.5,
        1.25,
      );
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      previousBounds = null;
      if (initialized && fade > 0) startRendering();
    };

    const initializeTrail = (x: number, y: number) => {
      target.x = x;
      target.y = y;
      head.x = x;
      head.y = y;
      for (const point of points) {
        point.x = x;
        point.y = y;
      }
      initialized = true;
      fade = 0;
    };

    const getTrailBounds = (pointCount: number, config: GlowCursorConfig): Bounds => {
      let left = width;
      let top = height;
      let right = 0;
      let bottom = 0;
      for (let index = 0; index < pointCount; index += 1) {
        left = Math.min(left, points[index].x);
        top = Math.min(top, points[index].y);
        right = Math.max(right, points[index].x);
        bottom = Math.max(bottom, points[index].y);
      }
      const padding = Math.max(4, config.trailWidth * (1.1 + config.glowSpread * 1.5) + 3);
      return {
        left: Math.max(0, left - padding),
        top: Math.max(0, top - padding),
        right: Math.min(width, right + padding),
        bottom: Math.min(height, bottom + padding),
      };
    };

    const drawTrail = (now: number, pointCount: number, config: GlowCursorConfig) => {
      const firstColor = hexToRgb(config.color);
      const secondColor = hexToRgb(config.secondaryColor);
      const pointTotal = Math.max(2, pointCount);
      const taper = clamp(config.trailTaper, 0, 1);
      const glowScale = clamp(config.glowIntensity, 0, 3);
      const spread = clamp(config.glowSpread, 0, 3);
      const brightnessScale = clamp(config.brightness, 0, 2);
      const opacityScale = clamp(config.opacity, 0, 1);
      const speed = clamp(Math.abs(config.pulseSpeed), 0, 1);

      context.lineCap = "round";
      context.lineJoin = "round";
      context.globalCompositeOperation =
        config.blendMode === "plus-lighter"
          ? "lighter"
          : config.blendMode === "screen"
            ? "screen"
            : "source-over";

      for (let pass = 0; pass < 3; pass += 1) {
        for (let index = 0; index < pointTotal - 1; index += 1) {
          const progress = index / (pointTotal - 1);
          const nextProgress = (index + 1) / (pointTotal - 1);
          const life = Math.pow(Math.max(1 - progress, 0), 0.55 + taper * 0.7);
          if (life < 0.006) continue;

          const taperPower = 0.55 + taper * 1.05;
          const widthAtHead = Math.max(config.trailWidth, 0.1);
          const segmentWidth = widthAtHead * (1 - 0.75 * Math.pow(progress, taperPower));
          const colorAtSegment = mixColor(firstColor, secondColor, (progress + nextProgress) / 2);
          const pulse =
            1 +
            Math.sin(now * 0.001 * config.pulseSpeed * 3 - progress * 11) *
              0.16 *
              speed;
          const grain =
            1 +
            Math.sin(now * 0.013 + index * 12.9898) *
              clamp(config.noiseStrength, 0, 1) *
              0.08;
          const strength = clamp(fade * opacityScale * brightnessScale * life * pulse * grain, 0, 1);
          const start = points[index];
          const end = points[index + 1];

          context.beginPath();
          context.moveTo(start.x, start.y);
          context.lineTo(end.x, end.y);

          if (pass === 0) {
            context.lineWidth = segmentWidth * (1.25 + spread * 1.45);
            context.strokeStyle = rgba(colorAtSegment, strength * (0.035 + glowScale * 0.035));
          } else if (pass === 1) {
            context.lineWidth = segmentWidth * (0.8 + spread * 0.38);
            context.strokeStyle = rgba(colorAtSegment, strength * (0.14 + glowScale * 0.08));
          } else {
            context.lineWidth = segmentWidth;
            context.strokeStyle = rgba(colorAtSegment, strength * 0.78);
          }
          context.stroke();
        }
      }

      const headPoint = points[0];
      if (config.hotspot > 0) {
        context.globalCompositeOperation = "source-over";
        context.beginPath();
        context.arc(headPoint.x, headPoint.y, Math.max(1.2, config.trailWidth * 0.17), 0, Math.PI * 2);
        context.fillStyle = rgba([255, 255, 255], fade * opacityScale * clamp(config.hotspot, 0, 1) * 0.52);
        context.fill();
      }
      context.globalCompositeOperation = "source-over";
    };

    function scheduleNextFrame() {
      if (!destroyed && rendering && animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(render);
      }
    }

    function startRendering() {
      if (destroyed || !initialized) return;
      if (idleTimer !== null) {
        window.clearTimeout(idleTimer);
        idleTimer = null;
      }
      if (rendering) return;
      rendering = true;
      lastFrameTime = 0;
      scheduleNextFrame();
    }

    function stopRendering() {
      rendering = false;
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    }

    function render(now: number) {
      animationFrame = 0;
      if (destroyed || !rendering) return;
      if (lastFrameTime !== 0 && now - lastFrameTime < FRAME_INTERVAL) {
        scheduleNextFrame();
        return;
      }

      const config = configRef.current;
      const delta = lastFrameTime === 0 ? 1 : clamp((now - lastFrameTime) / 16.667, 1, 3);
      lastFrameTime = now;
      const pointCount = clamp(Math.round(config.trailLength), 2, MAX_POINTS);
      const headEase = 1 - Math.pow(1 - clamp(config.followSpeed, 0.01, 0.99), delta);
      const chainEase = 1 - Math.pow(1 - clamp(0.28 + config.followSpeed * 0.35, 0.08, 0.92), delta);
      head.x += (target.x - head.x) * headEase;
      head.y += (target.y - head.y) * headEase;
      points[0].x = head.x;
      points[0].y = head.y;

      let settled = Math.hypot(target.x - head.x, target.y - head.y) < 0.08;
      for (let index = 1; index < pointCount; index += 1) {
        const point = points[index];
        const previous = points[index - 1];
        point.x += (previous.x - point.x) * chainEase;
        point.y += (previous.y - point.y) * chainEase;
        if (Math.hypot(previous.x - point.x, previous.y - point.y) > 0.08) settled = false;
      }

      const idleFor = now - lastInputTime;
      const shouldFade = config.idleFade && (!pointerInside || idleFor > config.idleTimeout);
      const fadeTarget = config.enabled && !shouldFade ? 1 : 0;
      const fadeStep = (16.667 * delta) / Math.max(config.fadeDuration, 16);
      fade += (fadeTarget - fade) * Math.min(1, fadeStep * 7);
      if (Math.abs(fade - fadeTarget) < 0.001) fade = fadeTarget;

      const currentBounds = initialized ? getTrailBounds(pointCount, config) : null;
      clearBounds(unionBounds(previousBounds, currentBounds));

      if (fade > 0.001) drawTrail(now, pointCount, config);
      previousBounds = fade > 0.001 ? currentBounds : null;

      if (fade === 0 && fadeTarget === 0) {
        stopRendering();
        return;
      }

      if (settled && fade === fadeTarget) {
        stopRendering();
        if (config.idleFade && pointerInside && !shouldFade) {
          const untilFade = Math.max(0, config.idleTimeout - idleFor) + 16;
          idleTimer = window.setTimeout(startRendering, untilFade);
        }
        return;
      }

      scheduleNextFrame();
    }

    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (!initialized) initializeTrail(x, y);
      target.x = x;
      target.y = y;
      pointerInside = true;
      lastInputTime = performance.now();
      startRendering();
    };

    const onPointerLeave = () => {
      pointerInside = false;
      lastInputTime = performance.now();
      startRendering();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", updatePointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    resize();
    wakeRendererRef.current = startRendering;

    return () => {
      destroyed = true;
      stopRendering();
      if (idleTimer !== null) window.clearTimeout(idleTimer);
      wakeRendererRef.current = null;
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", updatePointer);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      context.clearRect(0, 0, width, height);
    };
  }, [enabled, maxDevicePixelRatio]);

  const hasPositioningClass = /(^|\s)(absolute|fixed|relative|static|sticky)(\s|$)/.test(className);
  const containerStyle: CSSProperties = {
    position: hasPositioningClass ? undefined : "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    ...style,
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          userSelect: "none",
          mixBlendMode: blendMode,
        }}
        aria-hidden="true"
      />
      {children && <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>{children}</div>}
    </div>
  );
}
