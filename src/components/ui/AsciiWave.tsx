"use client";

import React, { useRef, useEffect } from "react";

interface AsciiWaveProps {
  className?: string;
  color?: string;
  speed?: number;
}

const AsciiWave: React.FC<AsciiWaveProps> = ({
  className = "",
  color = "#FF4500",
  speed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const chars = " .:+x*#".split("");
    const fontSize = 13;
    const columnWidth = 11;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`;
      ctx.fillStyle = color;
      ctx.textBaseline = "top";

      const columns = Math.min(Math.ceil(width / columnWidth), 320);
      const rows = Math.min(Math.ceil(height / fontSize), 120);

      for (let x = 0; x < columns; x++) {
        const shapeBase = Math.sin(x * 0.1) * 0.6 + Math.cos(x * 0.25) * 0.4;
        const breath = Math.sin(time * 0.002 * speed) * 0.1;
        const flicker = Math.sin(time * 0.008 * speed + x * 100) * 0.05;

        const noise = shapeBase + breath + flicker;
        const columnHeightNormal = Math.max(0.18, ((noise + 1) / 2) * 0.64 + 0.16);
        const activeRows = Math.min(rows, Math.floor(columnHeightNormal * rows));

        for (let y = rows - 1; y >= rows - activeRows; y--) {
          const flowShift = time * 0.005 * speed;
          const charNoise = Math.sin(y * 0.2 - flowShift + x * 10);

          const distFromTop = y - (rows - activeRows);
          const fade = Math.min(1, distFromTop / 6);

          const normalizedNoise = (charNoise + 1) / 2;
          const charIndex = Math.floor(normalizedNoise * chars.length);
          const char = chars[Math.min(charIndex, chars.length - 1)];

          if (char === " " || Math.random() > 0.94) continue;

          ctx.globalAlpha = fade * 0.86;
          ctx.fillText(char, x * columnWidth, y * fontSize);
        }
      }

      ctx.globalAlpha = 1;
      time += 16;
      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, [color, speed]);

  return (
    <div ref={containerRef} className={`ascii-wave ${className}`}>
      <canvas ref={canvasRef} className="ascii-wave-canvas" />
    </div>
  );
};

export default AsciiWave;
