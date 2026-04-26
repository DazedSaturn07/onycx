import type { RefObject } from "react";
import { useScroll, useTransform } from "framer-motion";

type UseScrollOptions = NonNullable<Parameters<typeof useScroll>[0]>;

interface SectionOutroMotionOptions {
  offset?: UseScrollOptions["offset"];
  fadeRange?: [number, number];
  yRange?: [number, number];
}

const defaultOffset: UseScrollOptions["offset"] = ["start start", "end start"];
const defaultFadeRange: [number, number] = [0, 0.64];
const defaultYRange: [number, number] = [0, 120];

export function useSectionOutroMotion(
  sectionRef: RefObject<HTMLElement>,
  {
    offset = defaultOffset,
    fadeRange = defaultFadeRange,
    yRange = defaultYRange,
  }: SectionOutroMotionOptions = {}
) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset,
  });

  const opacity = useTransform(scrollYProgress, fadeRange, [1, 0]);
  const y = useTransform(scrollYProgress, fadeRange, yRange);

  return { opacity, y, scrollYProgress };
}
