"use client";

import { useEffect, useRef } from "react";

type ThemeMode = "dark" | "light";
type RenderStyle =
  | "dither-crystal"
  | "obsidian-silk"
  | "iridescent-dust"
  | "vertebral-mesh";
type MouseMode = "swirl" | "repel" | "attract" | "ripple";

interface GradientColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface AetherSpineConfig {
  theme: ThemeMode;
  colors: GradientColors;
  renderStyle: RenderStyle;
  mouseMode: MouseMode;
  ditherStrength: number;
  crystalScale: number;
  vertebralRelief: number;
  turbulence: number;
  vortexTwist: number;
  particleSpread: number;
  filamentOpacity: number;
  webDensity: number;
  mouseForce: number;
  speed: number;
  autoOrbit: boolean;
}

const DEFAULT_AETHER_CONFIG: AetherSpineConfig = {
  theme: "light",
  colors: {
    primary: "#727c9e",
    secondary: "#9d8af2",
    accent: "#eef3f9",
  },
  renderStyle: "vertebral-mesh",
  mouseMode: "swirl",
  ditherStrength: 0.78,
  crystalScale: 1.25,
  vertebralRelief: 1.15,
  turbulence: 0.78,
  vortexTwist: 1.12,
  particleSpread: 1.05,
  filamentOpacity: 1.08,
  webDensity: 0.8,
  mouseForce: 0.25,
  speed: 1.0,
  autoOrbit: true,
};

function hexToRgbNorm(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [0.55, 0.62, 0.85];
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const GLSL_VERTEBRAL_CORE = `
precision highp float;

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx) * 2.0 - 1.0;
}

float snoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = dot(hash33(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0));
  float n100 = dot(hash33(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0));
  float n010 = dot(hash33(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0));
  float n110 = dot(hash33(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0));
  float n001 = dot(hash33(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0));
  float n101 = dot(hash33(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0));
  float n011 = dot(hash33(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0));
  float n111 = dot(hash33(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);

  float nxy0 = mix(nx00, nx10, u.y);
  float nxy1 = mix(nx01, nx11, u.y);
  return mix(nxy0, nxy1, u.z);
}

vec3 evalSpine8(
  float v,
  vec3 s0, vec3 s1, vec3 s2, vec3 s3,
  vec3 s4, vec3 s5, vec3 s6, vec3 s7
) {
  float t = clamp((v + 1.0) * 0.5, 0.0, 1.0) * 7.0;
  vec3 res = mix(s0, s1, clamp(t, 0.0, 1.0));
  res = mix(res, mix(s1, s2, clamp(t - 1.0, 0.0, 1.0)), step(1.0, t));
  res = mix(res, mix(s2, s3, clamp(t - 2.0, 0.0, 1.0)), step(2.0, t));
  res = mix(res, mix(s3, s4, clamp(t - 3.0, 0.0, 1.0)), step(3.0, t));
  res = mix(res, mix(s4, s5, clamp(t - 4.0, 0.0, 1.0)), step(4.0, t));
  res = mix(res, mix(s5, s6, clamp(t - 5.0, 0.0, 1.0)), step(5.0, t));
  res = mix(res, mix(s6, s7, clamp(t - 6.0, 0.0, 1.0)), step(6.0, t));

  float u = clamp((v + 1.0) * 0.5, 0.0, 1.0);
  vec3 b0 = mix(mix(s0, s2, u), mix(s2, s5, u), u);
  vec3 b1 = mix(mix(s1, s4, u), mix(s4, s7, u), u);
  return mix(res, mix(b0, b1, u), 0.36);
}

vec3 evaluateVertebralVortex(
  float angle,
  float v,
  float radialLayer,
  float time,
  float twist,
  float relief,
  float turbulence,
  float spread,
  vec2 scrollVel2D,
  vec3 s0, vec3 s1, vec3 s2, vec3 s3,
  vec3 s4, vec3 s5, vec3 s6, vec3 s7
) {
  float y = v * 3.45;

  float topCanopy    = smoothstep(0.45, 1.0, v) * 0.96;
  float upperThorax  = exp(-pow((v - 0.42) * 3.2, 2.0)) * 0.52;
  float upperNeck    = -exp(-pow((v - 0.14) * 5.2, 2.0)) * 0.24;
  float midVertebra  = exp(-pow((v + 0.04) * 4.8, 2.0)) * 0.28;
  float lowerWaist   = -exp(-pow((v + 0.24) * 5.0, 2.0)) * 0.18;
  float lumbarCore   = exp(-pow((v + 0.50) * 3.0, 2.0)) * 0.50;
  float sacralSkirt  = smoothstep(-0.58, -1.0, v) * 0.52;

  float vertPhase = v * 15.0 + 0.65;
  float vertBoneRidge = (pow(0.5 + 0.5 * sin(vertPhase), 2.3) - 0.35) * 0.24 * relief;
  float midMask = 1.0 - smoothstep(0.68, 1.0, abs(v));

  float baseRadius = (
    0.42 + topCanopy + upperThorax + upperNeck + midVertebra + lowerWaist + lumbarCore + sacralSkirt +
    vertBoneRidge * midMask
  ) * spread;

  float helicalAngle = angle + v * 2.85 * twist - time * 0.18;

  float dWing = mod(angle - 0.18 + 3.14159, 6.28318) - 3.14159;
  float rightFin = exp(-dWing * dWing * 1.9) * exp(-pow((v - 0.36) * 2.9, 2.0)) * 0.72 * relief;

  float dLeftLip = mod(angle - 3.05 + 3.14159, 6.28318) - 3.14159;
  float leftLip = exp(-dLeftLip * dLeftLip * 2.4) * exp(-pow((v + 0.02) * 5.4, 2.0)) * 0.58 * relief;

  float dTopLeft = mod(angle - 2.65 + 3.14159, 6.28318) - 3.14159;
  float topLeftSweep = exp(-dTopLeft * dTopLeft * 1.3) * smoothstep(0.28, 0.98, v) * 0.68;

  float lowerLobes = (0.28 * cos(angle * 2.0 - 0.45) + 0.18 * sin(angle * 3.0 + 0.8)) * smoothstep(-0.35, -0.95, v);

  float silkPleat =
    0.20 * sin(helicalAngle * 2.0 + v * 5.4 - time * 0.42) +
    0.13 * cos(helicalAngle * 3.0 - v * 6.8 + time * 0.31) +
    0.07 * sin(helicalAngle * 5.0 + v * 3.2);

  float anatomicalS =
    0.34 * sin(v * 3.35 + 0.55) -
    0.18 * cos(v * 6.1 - 0.4) +
    0.14 * sin(v * 11.5) * 0.32 * relief;

  float radialShell = mix(0.28, 1.36, radialLayer);
  float r = max(
    0.04,
    (baseRadius * (1.0 + silkPleat) + (rightFin + leftLip + topLeftSweep + lowerLobes) * (0.45 + 0.75 * radialLayer)) * radialShell
  );

  float zFlatten = 0.72 + 0.22 * cos(v * 3.2 + time * 0.16);
  float localX = cos(helicalAngle) * r + anatomicalS;
  float localZ = sin(helicalAngle) * r * zFlatten;

  float speedMag = length(scrollVel2D);
  float dynTurb = turbulence * (1.0 + speedMag * 0.55);
  vec3 nCoord = vec3(localX * 0.95, y * 0.68 - time * 0.14, localZ * 0.95);
  float nx = snoise(nCoord);
  float nz = snoise(nCoord + vec3(2.9, 8.1, 1.7));
  float ny = (nx + nz) * 0.35;

  vec3 disp = vec3(nx, ny * 0.45, nz) * 0.36 * dynTurb * (0.42 + radialLayer * 0.82);

  vec3 spine = evalSpine8(v, s0, s1, s2, s3, s4, s5, s6, s7);

  float bankAngle = clamp(scrollVel2D.x * 0.24, -0.45, 0.45);
  float cb = cos(bankAngle);
  vec3 localPos = vec3(localX, y, localZ) + disp;
  localPos.x = localPos.x * cb - localPos.y * sin(bankAngle) * 0.28;

  return localPos + spine;
}

vec3 applyMouseField(
  vec3 pos,
  vec3 mouseWorld,
  float mouseActive,
  float mouseForce,
  float mouseMode,
  float pulse,
  float time
) {
  if (mouseActive < 0.001 || mouseForce < 0.001) return pos;

  vec3 diff = pos - mouseWorld;
  vec3 scaledDiff = vec3(diff.x, diff.y, diff.z * 0.45);
  float dist = length(scaledDiff);
  float radius = 1.65;
  float falloff = exp(-dist * dist / (radius * radius * 0.52)) * mouseActive * mouseForce;

  vec3 dir = normalize(diff + vec3(0.0001));
  vec3 result = pos;

  if (mouseMode < 0.5) {
    vec3 tangent = normalize(vec3(-diff.y, diff.x, diff.z * 0.28) + vec3(0.0001));
    result += tangent * falloff * 0.82 + dir * falloff * 0.18;
  } else if (mouseMode < 1.5) {
    result += dir * falloff * 0.96;
  } else if (mouseMode < 2.5) {
    result -= dir * falloff * 0.65;
  } else {
    float wave = sin(dist * 8.5 - time * 7.8) * 0.5 + 0.5;
    result += dir * falloff * (0.62 * wave + 0.18);
  }

  if (pulse > 0.01) {
    float shock = sin(dist * 6.0 - (1.0 - pulse) * 14.5) * exp(-dist * 0.72) * pulse;
    result += dir * shock * 0.78;
  }

  return result;
}
`;

const GLSL_DITHER = `
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x * 0.5 + a.y * a.y * 0.75);
}

float bayer4x4(vec2 p) {
  return bayer2(p * 0.5) * 0.25 + bayer2(p);
}
`;

const BG_VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.999, 1.0);
}
`;

const BG_FRAG = `
precision highp float;
varying vec2 vUv;

uniform vec2 uResolution;
uniform float uTime;
uniform float uTheme;
uniform float uDither;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uSpineCenter;

${GLSL_DITHER}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);

  float shift = (uSpineCenter.x - 0.5) * 0.28;
  float diag = clamp((uv.x - shift) * 0.78 + uv.y * 0.36 - 0.08, 0.0, 1.0);
  float smoothDiag = smoothstep(0.06, 0.92, diag);

  vec2 toCenter = (uv - uSpineCenter) * vec2(aspect * 0.85, 1.0);
  float radialHalo = exp(-dot(toCenter, toCenter) * 1.35);
  float isPortrait = step(aspect, 0.85);
  float mistRightEdge = mix(0.95, 1.35, isPortrait);
  float topLeftMist = smoothstep(mix(0.56, 0.64, isPortrait), 1.0, uv.y) * smoothstep(mistRightEdge, 0.12, uv.x);
  float bottomMist = smoothstep(0.32, 0.0, uv.y);

  vec3 darkLeft = mix(vec3(0.075, 0.082, 0.108), uColor1 * 0.24 + vec3(0.045), 0.38);
  vec3 darkRight = vec3(0.012, 0.014, 0.022);
  vec3 darkBase = mix(darkLeft, darkRight, smoothDiag);
  darkBase += mix(uColor1, uColor2, 0.52) * radialHalo * 0.14;
  darkBase += uColor3 * topLeftMist * 0.06;

  vec3 lightPearl = mix(vec3(0.885, 0.892, 0.904), uColor3, 0.1);
  vec3 lightSlate = vec3(0.49, 0.505, 0.528);
  vec3 lightObsidian = vec3(0.025, 0.028, 0.036);

  float shadowField = (uv.x - shift * 0.55) * mix(0.82, 0.64, isPortrait) + uv.y * mix(0.24, 0.08, isPortrait) - 0.05;
  float refShadow = smoothstep(mix(0.46, 0.50, isPortrait), mix(0.96, 1.05, isPortrait), shadowField);
  vec3 lightBase = mix(lightPearl, lightSlate, smoothstep(0.02, 0.54, refShadow));
  lightBase = mix(lightBase, lightObsidian, smoothstep(0.38, 0.95, refShadow));
  lightBase = mix(lightBase, vec3(0.93, 0.935, 0.945), topLeftMist * mix(0.54, 0.72, isPortrait));
  lightBase = mix(lightBase, vec3(0.78, 0.79, 0.805), bottomMist * 0.52);
  lightBase += (uColor2 - 0.5) * radialHalo * 0.045;

  vec3 col = mix(darkBase, lightBase, uTheme);

  float vig = 1.0 - dot((uv - 0.5) * vec2(1.0, 0.92), (uv - 0.5) * vec2(1.0, 0.92)) * 0.36;
  col *= mix(vig, mix(1.0, vig, 0.28), uTheme);

  float bayer = bayer4x4(gl_FragCoord.xy) - 0.5;
  col += bayer * (0.015 + uDither * 0.032);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const LINE_VERT = `
${GLSL_VERTEBRAL_CORE}

attribute vec4 aGeom;

uniform mat4 uProj;
uniform mat4 uView;
uniform float uTime;
uniform float uTwist;
uniform float uRelief;
uniform float uTurb;
uniform float uSpread;
uniform vec2 uScrollVel2D;
uniform vec3 uSpine0;
uniform vec3 uSpine1;
uniform vec3 uSpine2;
uniform vec3 uSpine3;
uniform vec3 uSpine4;
uniform vec3 uSpine5;
uniform vec3 uSpine6;
uniform vec3 uSpine7;
uniform vec3 uMouseWorld;
uniform float uMouseActive;
uniform float uMouseForce;
uniform float uMouseMode;
uniform float uPulse;

varying float vHeight;
varying float vDepth;
varying float vLayer;
varying float vKind;
varying float vRim;

void main() {
  float angle = aGeom.x;
  float v = aGeom.y;
  float layer = aGeom.z;
  float kind = aGeom.w;

  float effSpread = kind > 1.5 ? uSpread * 1.08 : uSpread;

  vec3 pos = evaluateVertebralVortex(
    angle, v, layer, uTime, uTwist, uRelief, uTurb, effSpread, uScrollVel2D,
    uSpine0, uSpine1, uSpine2, uSpine3, uSpine4, uSpine5, uSpine6, uSpine7
  );

  if (kind > 1.5) {
    float j = snoise(vec3(angle * 2.9, v * 5.8, uTime * 0.1));
    pos.x += j * 0.13;
    pos.z += cos(angle * 2.0 + v * 7.0) * 0.11;
  }

  pos = applyMouseField(pos, uMouseWorld, uMouseActive, uMouseForce, uMouseMode, uPulse, uTime);

  vec4 viewPos = uView * vec4(pos, 1.0);
  gl_Position = uProj * viewPos;

  vec3 midSpine = (uSpine3 + uSpine4) * 0.5;
  vec3 radial = normalize(vec3(pos.x - midSpine.x, 0.0, pos.z - midSpine.z) + vec3(0.0001));
  vRim = pow(1.0 - abs(radial.z), 1.45);
  vHeight = v;
  vDepth = clamp((-viewPos.z - 2.6) / 7.2, 0.0, 1.0);
  vLayer = layer;
  vKind = kind;
}
`;

const LINE_FRAG = `
precision highp float;

uniform float uTheme;
uniform float uDither;
uniform float uFilamentOpacity;
uniform float uWebDensity;
uniform float uStyle;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

varying float vHeight;
varying float vDepth;
varying float vLayer;
varying float vKind;
varying float vRim;

${GLSL_DITHER}

void main() {
  float hNorm = clamp((vHeight + 1.0) * 0.5, 0.0, 1.0);
  vec3 gradCol = mix(
    mix(uColor1, uColor2, smoothstep(0.15, 0.65, hNorm)),
    uColor3,
    smoothstep(0.55, 1.0, hNorm)
  );

  float alpha = 0.0;
  vec3 col = gradCol;

  if (vKind < 1.5) {
    float isRing = 1.0 - step(0.5, vKind);
    float edgeFade = smoothstep(-1.0, -0.88, vHeight) * smoothstep(1.0, 0.9, vHeight);
    float rimBoost = 0.36 + vRim * 1.08;
    float styleBoost = uStyle > 2.5 ? 1.65 : (uStyle > 0.5 && uStyle < 1.5 ? 1.38 : 1.0);

    float baseAlpha = isRing > 0.5 ? (0.075 + vLayer * 0.115) : (0.055 + vLayer * 0.085);
    alpha = baseAlpha * edgeFade * rimBoost * uFilamentOpacity * styleBoost;

    vec3 darkSilk = mix(vec3(0.78, 0.82, 0.90), gradCol, 0.38 + vRim * 0.32);

    float lightRim = smoothstep(0.24, 0.84, vRim * 0.72 + hNorm * 0.42 + vLayer * 0.18);
    vec3 lightSilk = mix(vec3(0.16, 0.17, 0.20), vec3(0.98, 0.99, 1.0), lightRim);
    lightSilk = mix(lightSilk, gradCol * 0.88, 0.18);

    col = mix(darkSilk, lightSilk, uTheme);
  } else {
    float lowerFocus = smoothstep(0.05, -0.78, vHeight);
    float upperPocket = exp(-pow((vHeight - 0.62) * 5.0, 2.0)) * 0.62;
    float zoneWeight = clamp(lowerFocus * 0.95 + upperPocket + 0.1, 0.0, 1.0);
    float styleBoost = uStyle > 2.5 ? 1.75 : 1.0;

    alpha = 0.28 * zoneWeight * uWebDensity * styleBoost;

    vec3 darkWeb = mix(uColor2, vec3(0.90, 0.94, 1.0), 0.52);
    vec3 lightWeb = mix(vec3(0.025, 0.03, 0.045), uColor1 * 0.28, 0.18);

    col = mix(darkWeb, lightWeb, uTheme);
  }

  alpha *= (1.0 - vDepth * 0.48);

  float bayer = bayer4x4(gl_FragCoord.xy);
  if (uDither > 0.05 && alpha < 0.32) {
    float mask = smoothstep(bayer - 0.16, bayer + 0.22, alpha * (3.3 - uDither * 1.4));
    alpha *= mix(1.0, mask, uDither * 0.62);
  }

  if (alpha < 0.006) discard;
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.94));
}
`;

const PARTICLE_VERT = `
${GLSL_VERTEBRAL_CORE}

attribute vec4 aGeom;
attribute vec4 aSeed;

uniform mat4 uProj;
uniform mat4 uView;
uniform float uPixelRatio;
uniform float uTime;
uniform float uTwist;
uniform float uRelief;
uniform float uTurb;
uniform float uSpread;
uniform float uCrystalScale;
uniform vec2 uScrollVel2D;
uniform float uStyle;
uniform vec3 uSpine0;
uniform vec3 uSpine1;
uniform vec3 uSpine2;
uniform vec3 uSpine3;
uniform vec3 uSpine4;
uniform vec3 uSpine5;
uniform vec3 uSpine6;
uniform vec3 uSpine7;
uniform vec3 uMouseWorld;
uniform float uMouseActive;
uniform float uMouseForce;
uniform float uMouseMode;
uniform float uPulse;

varying float vHeight;
varying float vDepth;
varying float vType;
varying float vColorSeed;
varying float vLayer;
varying float vSparkle;
varying float vMouseProx;
varying float vPhase;

void main() {
  float angle = aGeom.x + aSeed.z * 0.14 * sin(uTime * 0.32 + aGeom.y * 3.4);
  float v = aGeom.y;
  float layer = aGeom.z;
  float pType = aGeom.w;

  vec3 pos = evaluateVertebralVortex(
    angle, v, layer, uTime, uTwist, uRelief, uTurb, uSpread, uScrollVel2D,
    uSpine0, uSpine1, uSpine2, uSpine3, uSpine4, uSpine5, uSpine6, uSpine7
  );

  float scatterScale =
    pType < 0.5 ? 0.24 :
    pType < 1.5 ? 0.26 :
    pType < 2.5 ? 0.32 :
    pType < 3.5 ? 0.34 : 0.48;
  float scatterAmt = (aSeed.w - 0.5) * scatterScale * uSpread;
  float scAngle = angle + aSeed.z * 6.2831;
  pos += vec3(cos(scAngle), (aSeed.y - 0.5) * 0.24, sin(scAngle)) * scatterAmt;

  float trailFactor = (0.25 + layer * 0.95) * (0.4 + aSeed.x * 0.8);
  pos.x -= uScrollVel2D.x * 0.36 * trailFactor;
  pos.y -= uScrollVel2D.y * 0.22 * trailFactor;
  pos += vec3(
    sin(aSeed.z * 19.3 + uTime * 1.8),
    cos(aSeed.x * 15.1),
    cos(aSeed.y * 17.7)
  ) * length(uScrollVel2D) * 0.18 * trailFactor;

  vec3 preMouse = pos;
  pos = applyMouseField(pos, uMouseWorld, uMouseActive, uMouseForce, uMouseMode, uPulse, uTime);
  vMouseProx = clamp(length(pos - preMouse) * 2.1, 0.0, 1.0);

  vec4 viewPos = uView * vec4(pos, 1.0);
  gl_Position = uProj * viewPos;

  float distZ = max(1.4, -viewPos.z);
  float perspective = (7.4 / distZ) * uPixelRatio;

  float baseSize = 2.0;
  if (pType < 0.5) {
    baseSize = (13.0 + aSeed.x * 18.0);
  } else if (pType < 1.5) {
    baseSize = (2.4 + aSeed.x * 4.2) * uCrystalScale;
  } else if (pType < 2.5) {
    baseSize = (3.4 + pow(aSeed.x, 1.6) * 7.8) * uCrystalScale;
  } else if (pType < 3.5) {
    baseSize = (1.95 + pow(aSeed.x, 1.35) * 4.4) * uCrystalScale;
  } else {
    baseSize = (1.5 + aSeed.x * 2.4) * uCrystalScale;
  }

  if (uStyle > 1.5 && uStyle < 2.5) {
    baseSize *= 1.32;
  } else if (uStyle > 2.5) {
    baseSize *= 0.82;
  }

  baseSize *= (1.0 + vMouseProx * 0.42);

  float maxPt = pType < 0.5 ? 58.0 : 32.0;
  gl_PointSize = clamp(baseSize * perspective * 0.56, 1.15, maxPt);

  vHeight = v;
  vDepth = clamp((distZ - 2.4) / 7.5, 0.0, 1.0);
  vType = pType;
  vColorSeed = aSeed.y;
  vLayer = layer;
  vPhase = aSeed.z;
  vSparkle = 0.62 + 0.38 * sin(uTime * 2.6 + aSeed.z * 28.0 + v * 9.0);
}
`;

const PARTICLE_FRAG = `
precision highp float;

uniform float uTheme;
uniform float uDither;
uniform float uStyle;
uniform float uPass;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

varying float vHeight;
varying float vDepth;
varying float vType;
varying float vColorSeed;
varying float vLayer;
varying float vSparkle;
varying float vMouseProx;
varying float vPhase;

${GLSL_DITHER}

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c) * 2.0;
  if (r > 1.0) discard;

  float hNorm = clamp((vHeight + 1.0) * 0.5, 0.0, 1.0);
  float gradT = clamp(hNorm * 0.68 + vColorSeed * 0.36 + vMouseProx * 0.24, 0.0, 1.0);

  vec3 triColor = mix(
    mix(uColor1, uColor2, smoothstep(0.06, 0.56, gradT)),
    uColor3,
    smoothstep(0.50, 0.98, gradT)
  );

  vec3 prism = vec3(
    0.55 + 0.45 * sin(gradT * 6.283 + 0.2),
    0.55 + 0.45 * sin(gradT * 6.283 + 2.2),
    0.65 + 0.35 * sin(gradT * 6.283 + 4.1)
  );

  float bayer = bayer4x4(gl_FragCoord.xy);

  if (uPass < 0.5) {
    float gauss = exp(-r * r * 3.2);
    float dMask = smoothstep(bayer * 0.85, bayer * 0.85 + 0.45, gauss * 1.15);
    float shape = mix(gauss, gauss * dMask, uDither * 0.55);

    float pocketA = exp(-pow((vHeight - 0.40) * 3.1, 2.0));
    float pocketB = exp(-pow((vHeight + 0.44) * 3.0, 2.0));
    float pocketC = exp(-pow((vHeight - 0.02) * 3.6, 2.0)) * 0.58;
    float pocketDensity = clamp(pocketA + pocketB + pocketC + 0.22, 0.0, 1.0);

    vec3 darkCore = mix(vec3(0.008, 0.010, 0.018), uColor1 * 0.16, 0.38);
    vec3 lightCore = mix(vec3(0.012, 0.014, 0.022), uColor1 * 0.14, 0.22);
    vec3 col = mix(darkCore, lightCore, uTheme);

    float alpha = shape * pocketDensity * mix(0.24, 0.38, uTheme);
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(col, alpha);
    return;
  }

  if (uPass < 1.5) {
    bool isWebBead = vType > 1.5;

    float angle = vPhase * 6.2831;
    float ca = cos(angle);
    float sa = sin(angle);
    vec2 rotC = vec2(c.x * ca - c.y * sa, c.x * sa + c.y * ca);
    float diamond = (abs(rotC.x) + abs(rotC.y)) * 1.65;

    float shape = isWebBead
      ? (1.0 - smoothstep(0.68, 1.0, r))
      : (1.0 - smoothstep(0.55, 1.05, mix(r, diamond, 0.55)));

    float ditherStep = step(bayer * uDither * 0.78, shape * 1.05);
    float finalShape = isWebBead ? shape : mix(shape, shape * ditherStep, uDither * 0.82);
    if (finalShape < 0.02) discard;

    vec3 darkBeadCol = mix(uColor2 * 0.9, vec3(0.92, 0.95, 1.0), 0.55);
    vec3 lightBeadCol = vec3(0.018, 0.020, 0.028);

    vec3 darkCrysCol = mix(vec3(0.015, 0.018, 0.032), uColor1 * 0.42, 0.48);
    vec3 lightCrysCol = mix(vec3(0.022, 0.026, 0.040), uColor1 * 0.28, 0.24);

    vec3 col = isWebBead
      ? mix(darkBeadCol, lightBeadCol, uTheme)
      : mix(darkCrysCol, lightCrysCol, uTheme);

    float alpha = finalShape * (isWebBead ? 0.92 : mix(0.62, 0.84, uTheme));
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
    return;
  }

  bool isDust = vType > 3.5;

  float rotA = vPhase * 6.2831;
  float ca = cos(rotA);
  float sa = sin(rotA);
  vec2 rc = vec2(c.x * ca - c.y * sa, c.x * sa + c.y * ca);
  float diamondDist = (abs(rc.x) + abs(rc.y)) * 1.55;
  float starFacet = max(abs(rc.x), abs(rc.y)) * 1.65;
  float crystalDist = mix(r, mix(diamondDist, starFacet, 0.35), isDust ? 0.22 : 0.68);

  float softness = (uStyle > 1.5 && uStyle < 2.5) ? 0.72 : (isDust ? 0.52 : 0.28);
  float shape = 1.0 - smoothstep(1.0 - softness, 1.02, crystalDist);

  float ditherMask = step(bayer * uDither * 0.74, shape * (0.88 + 0.32 * vSparkle));
  float finalShape = mix(shape, shape * ditherMask, uDither * (isDust ? 0.82 : 0.68));
  if (finalShape < 0.02) discard;

  float iridAmt = (uStyle > 1.5 && uStyle < 2.5) ? 0.58 : 0.28;
  vec3 richCol = mix(triColor, mix(triColor, prism, 0.5), iridAmt);

  vec3 col;
  float alpha;

  if (!isDust) {
    float whiteCore = smoothstep(0.42, 0.0, crystalDist) * 0.62;
    col = mix(richCol, vec3(0.99, 0.995, 1.0), clamp(0.52 + whiteCore + vMouseProx * 0.32, 0.0, 1.0));
    alpha = finalShape * (0.68 + 0.32 * vSparkle) * (1.0 - vDepth * 0.32);
  } else {
    vec3 darkDust = mix(richCol, uColor3, 0.38);
    vec3 lightDust = mix(richCol * 0.58, vec3(0.96, 0.97, 0.99), smoothstep(0.22, 0.86, vLayer + hNorm * 0.38));
    col = mix(darkDust, lightDust, uTheme);
    alpha = finalShape * (0.26 + vLayer * 0.34) * (1.0 - vDepth * 0.44);
  }

  if (uStyle > 0.5 && uStyle < 1.5) {
    col = mix(col, mix(uColor1, vec3(0.92, 0.95, 1.0), vSparkle), 0.34);
  }

  col = mix(col, mix(uColor3, vec3(1.0), 0.52), vMouseProx * 0.42);

  float tipFade = smoothstep(1.0, 0.88, abs(vHeight));
  alpha *= (0.42 + 0.58 * tipFade);

  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.97));
}
`;

function createPerspectiveMatrix(
  fovRad: number,
  aspect: number,
  near: number,
  far: number,
): Float32Array {
  const f = 1.0 / Math.tan(fovRad / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function createLookAtMatrix(
  eye: [number, number, number],
  center: [number, number, number],
  up: [number, number, number],
): Float32Array {
  let zx = eye[0] - center[0];
  let zy = eye[1] - center[1];
  let zz = eye[2] - center[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len;
  zy /= len;
  zz /= len;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len;
  xy /= len;
  xz /= len;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  const out = new Float32Array(16);
  out[0] = xx;
  out[1] = yx;
  out[2] = zx;
  out[3] = 0;
  out[4] = xy;
  out[5] = yy;
  out[6] = zy;
  out[7] = 0;
  out[8] = xz;
  out[9] = yz;
  out[10] = zz;
  out[11] = 0;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  out[15] = 1;
  return out;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation failed: ${info}`);
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertSrc: string,
  fragSrc: string,
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  if (!prog) throw new Error("Unable to create WebGL program");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error(`Program link failed: ${info}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

interface BatchedParticles {
  geom: Float32Array;
  seeds: Float32Array;
  coreStart: number;
  coreCount: number;
  darkStart: number;
  darkCount: number;
  brightStart: number;
  brightCount: number;
}

function generateVertebralParticles(totalCount: number): BatchedParticles {
  let s = 202611;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  const coreCount = Math.floor(totalCount * 0.08);
  const darkCount = Math.floor(totalCount * 0.3);
  const brightCount = totalCount - coreCount - darkCount;

  const geom = new Float32Array(totalCount * 4);
  const seeds = new Float32Array(totalCount * 4);

  let idx = 0;

  const sampleVertebralV = (clusterBias: number) => {
    const r = rand();
    if (r < clusterBias * 0.5) {
      const g = (rand() + rand() + rand()) / 3 - 0.5;
      return clamp(0.42 + g * 0.56, -0.98, 0.98);
    }
    if (r < clusterBias) {
      const g = (rand() + rand() + rand()) / 3 - 0.5;
      return clamp(-0.44 + g * 0.58, -0.98, 0.98);
    }
    return rand() * 2 - 1;
  };

  for (let i = 0; i < coreCount; i++) {
    geom[idx] = rand() * Math.PI * 2;
    geom[idx + 1] = sampleVertebralV(0.76);
    geom[idx + 2] = Math.pow(rand(), 1.65) * 0.52;
    geom[idx + 3] = 0.0;

    seeds[idx] = rand();
    seeds[idx + 1] = rand();
    seeds[idx + 2] = rand();
    seeds[idx + 3] = rand();
    idx += 4;
  }

  const webBeadCount = Math.floor(darkCount * 0.14);
  for (let i = 0; i < darkCount; i++) {
    const isBead = i >= darkCount - webBeadCount;
    geom[idx] = rand() * Math.PI * 2;
    geom[idx + 1] = isBead
      ? rand() < 0.82
        ? -0.96 + Math.pow(rand(), 1.2) * 0.62
        : 0.42 + rand() * 0.42
      : sampleVertebralV(0.68);
    geom[idx + 2] = isBead
      ? 0.35 + rand() * 0.68
      : Math.pow(rand(), 1.15) * 0.78;
    geom[idx + 3] = isBead ? 2.0 : 1.0;

    seeds[idx] = rand();
    seeds[idx + 1] = rand();
    seeds[idx + 2] = rand();
    seeds[idx + 3] = rand();
    idx += 4;
  }

  const crystalCount = Math.floor(brightCount * 0.62);
  for (let i = 0; i < brightCount; i++) {
    const isCrystal = i < crystalCount;
    geom[idx] = rand() * Math.PI * 2;
    geom[idx + 1] = isCrystal ? sampleVertebralV(0.64) : rand() * 2 - 1;
    geom[idx + 2] = isCrystal
      ? Math.pow(rand(), 0.92) * 0.88
      : 0.22 + Math.pow(rand(), 0.75) * 0.84;
    geom[idx + 3] = isCrystal ? 3.0 : 4.0;

    seeds[idx] = rand();
    seeds[idx + 1] = rand();
    seeds[idx + 2] = rand();
    seeds[idx + 3] = rand();
    idx += 4;
  }

  return {
    geom,
    seeds,
    coreStart: 0,
    coreCount,
    darkStart: coreCount,
    darkCount,
    brightStart: coreCount + darkCount,
    brightCount,
  };
}

function generateBatchedSilkAndWeb(compact: boolean): {
  silkLines: Float32Array;
  silkVertexCount: number;
  webLines: Float32Array;
  webVertexCount: number;
} {
  const silkArr: number[] = [];

  const ringCount = compact ? 64 : 96;
  const ringSegs = compact ? 36 : 48;
  for (let r = 0; r < ringCount; r++) {
    const frac = r / (ringCount - 1);
    const baseV = frac * 1.98 - 0.99;
    const layer = 0.55 + (r % 5) * 0.11;
    const slant = 0.045 * Math.sin(frac * Math.PI * 5.0);

    for (let s = 0; s < ringSegs; s++) {
      const a0 = (s / ringSegs) * Math.PI * 2;
      const a1 = ((s + 1) / ringSegs) * Math.PI * 2;
      const v0 = clamp(
        baseV + Math.sin(a0 * 2.0 + r * 0.15) * slant,
        -0.995,
        0.995,
      );
      const v1 = clamp(
        baseV + Math.sin(a1 * 2.0 + r * 0.15) * slant,
        -0.995,
        0.995,
      );

      silkArr.push(a0, v0, layer, 0.0);
      silkArr.push(a1, v1, layer, 0.0);
    }
  }

  const fiberCount = compact ? 32 : 48;
  const fiberSegs = compact ? 32 : 42;
  for (let f = 0; f < fiberCount; f++) {
    const frac = f / fiberCount;
    const baseAngle = frac * Math.PI * 2;
    const layer = 0.42 + (f % 6) * 0.115;
    const twistBias = Math.sin(frac * Math.PI * 4.0) * 0.28;

    for (let seg = 0; seg < fiberSegs; seg++) {
      const t0 = seg / fiberSegs;
      const t1 = (seg + 1) / fiberSegs;
      const v0 = t0 * 1.98 - 0.99;
      const v1 = t1 * 1.98 - 0.99;
      const a0 = baseAngle + twistBias * v0;
      const a1 = baseAngle + twistBias * v1;

      silkArr.push(a0, v0, layer, 1.0);
      silkArr.push(a1, v1, layer, 1.0);
    }
  }

  const webArr: number[] = [];
  const nodeCount = compact ? 260 : 460;
  const nodes: { angle: number; v: number; layer: number }[] = [];
  let seed = 88421;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < nodeCount; i++) {
    const angle = rand() * Math.PI * 2;
    const v =
      rand() < 0.8
        ? -0.97 + Math.pow(rand(), 1.15) * 0.76
        : 0.44 + rand() * 0.44;
    const layer = 0.34 + rand() * 0.68;
    nodes.push({ angle, v, layer });
  }

  for (let i = 0; i < nodeCount; i++) {
    const a = nodes[i];
    let links = 0;
    for (let j = i + 1; j < nodeCount && links < 6; j++) {
      const b = nodes[j];
      const dv = a.v - b.v;
      let da = Math.abs(a.angle - b.angle);
      if (da > Math.PI) da = Math.PI * 2 - da;
      const dist = Math.hypot(dv * 2.1, da * 0.52);

      if (dist < 0.285) {
        webArr.push(a.angle, a.v, a.layer, 2.0);
        webArr.push(b.angle, b.v, b.layer, 2.0);
        links++;
      }
    }
  }

  return {
    silkLines: new Float32Array(silkArr),
    silkVertexCount: silkArr.length / 4,
    webLines: new Float32Array(webArr),
    webVertexCount: webArr.length / 4,
  };
}

const STYLE_INDEX_MAP: Record<RenderStyle, number> = {
  "dither-crystal": 0.0,
  "obsidian-silk": 1.0,
  "iridescent-dust": 2.0,
  "vertebral-mesh": 3.0,
};

const MOUSE_MODE_MAP: Record<MouseMode, number> = {
  swirl: 0.0,
  repel: 1.0,
  attract: 2.0,
  ripple: 3.0,
};

/** 6-pass batched WebGL crystalline vertebral vortex backdrop for the Selected Work section. */
export default function AetherSpineBackground({
  config = DEFAULT_AETHER_CONFIG,
  className = "",
}: {
  config?: AetherSpineConfig;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const isCompactDevice =
      window.innerWidth < 768 ||
      window.matchMedia("(pointer: coarse)").matches;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: !isCompactDevice,
      depth: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    let bgProg: WebGLProgram;
    let lineProg: WebGLProgram;
    let particleProg: WebGLProgram;

    try {
      bgProg = createProgram(gl, BG_VERT, BG_FRAG);
      lineProg = createProgram(gl, LINE_VERT, LINE_FRAG);
      particleProg = createProgram(gl, PARTICLE_VERT, PARTICLE_FRAG);
    } catch {
      return;
    }

    const totalParticles = isCompactDevice ? 14000 : 52000;

    const bgBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const { silkLines, silkVertexCount, webLines, webVertexCount } =
      generateBatchedSilkAndWeb(isCompactDevice);
    const silkBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, silkBuf);
    gl.bufferData(gl.ARRAY_BUFFER, silkLines, gl.STATIC_DRAW);

    const webBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webBuf);
    gl.bufferData(gl.ARRAY_BUFFER, webLines, gl.STATIC_DRAW);

    const particles = generateVertebralParticles(totalParticles);
    const pGeomBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pGeomBuf);
    gl.bufferData(gl.ARRAY_BUFFER, particles.geom, gl.STATIC_DRAW);

    const pSeedBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pSeedBuf);
    gl.bufferData(gl.ARRAY_BUFFER, particles.seeds, gl.STATIC_DRAW);

    const bgLoc = {
      aPos: gl.getAttribLocation(bgProg, "aPos"),
      uResolution: gl.getUniformLocation(bgProg, "uResolution"),
      uTime: gl.getUniformLocation(bgProg, "uTime"),
      uTheme: gl.getUniformLocation(bgProg, "uTheme"),
      uDither: gl.getUniformLocation(bgProg, "uDither"),
      uColor1: gl.getUniformLocation(bgProg, "uColor1"),
      uColor2: gl.getUniformLocation(bgProg, "uColor2"),
      uColor3: gl.getUniformLocation(bgProg, "uColor3"),
      uSpineCenter: gl.getUniformLocation(bgProg, "uSpineCenter"),
    };

    const lineLoc = {
      aGeom: gl.getAttribLocation(lineProg, "aGeom"),
      uProj: gl.getUniformLocation(lineProg, "uProj"),
      uView: gl.getUniformLocation(lineProg, "uView"),
      uTime: gl.getUniformLocation(lineProg, "uTime"),
      uTwist: gl.getUniformLocation(lineProg, "uTwist"),
      uRelief: gl.getUniformLocation(lineProg, "uRelief"),
      uTurb: gl.getUniformLocation(lineProg, "uTurb"),
      uSpread: gl.getUniformLocation(lineProg, "uSpread"),
      uScrollVel2D: gl.getUniformLocation(lineProg, "uScrollVel2D"),
      uSpines: Array.from({ length: 8 }, (_, i) =>
        gl.getUniformLocation(lineProg, `uSpine${i}`),
      ),
      uMouseWorld: gl.getUniformLocation(lineProg, "uMouseWorld"),
      uMouseActive: gl.getUniformLocation(lineProg, "uMouseActive"),
      uMouseForce: gl.getUniformLocation(lineProg, "uMouseForce"),
      uMouseMode: gl.getUniformLocation(lineProg, "uMouseMode"),
      uPulse: gl.getUniformLocation(lineProg, "uPulse"),
      uTheme: gl.getUniformLocation(lineProg, "uTheme"),
      uDither: gl.getUniformLocation(lineProg, "uDither"),
      uFilamentOpacity: gl.getUniformLocation(lineProg, "uFilamentOpacity"),
      uWebDensity: gl.getUniformLocation(lineProg, "uWebDensity"),
      uStyle: gl.getUniformLocation(lineProg, "uStyle"),
      uColor1: gl.getUniformLocation(lineProg, "uColor1"),
      uColor2: gl.getUniformLocation(lineProg, "uColor2"),
      uColor3: gl.getUniformLocation(lineProg, "uColor3"),
    };

    const pLoc = {
      aGeom: gl.getAttribLocation(particleProg, "aGeom"),
      aSeed: gl.getAttribLocation(particleProg, "aSeed"),
      uProj: gl.getUniformLocation(particleProg, "uProj"),
      uView: gl.getUniformLocation(particleProg, "uView"),
      uPixelRatio: gl.getUniformLocation(particleProg, "uPixelRatio"),
      uTime: gl.getUniformLocation(particleProg, "uTime"),
      uTwist: gl.getUniformLocation(particleProg, "uTwist"),
      uRelief: gl.getUniformLocation(particleProg, "uRelief"),
      uTurb: gl.getUniformLocation(particleProg, "uTurb"),
      uSpread: gl.getUniformLocation(particleProg, "uSpread"),
      uCrystalScale: gl.getUniformLocation(particleProg, "uCrystalScale"),
      uScrollVel2D: gl.getUniformLocation(particleProg, "uScrollVel2D"),
      uStyle: gl.getUniformLocation(particleProg, "uStyle"),
      uSpines: Array.from({ length: 8 }, (_, i) =>
        gl.getUniformLocation(particleProg, `uSpine${i}`),
      ),
      uMouseWorld: gl.getUniformLocation(particleProg, "uMouseWorld"),
      uMouseActive: gl.getUniformLocation(particleProg, "uMouseActive"),
      uMouseForce: gl.getUniformLocation(particleProg, "uMouseForce"),
      uMouseMode: gl.getUniformLocation(particleProg, "uMouseMode"),
      uPulse: gl.getUniformLocation(particleProg, "uPulse"),
      uTheme: gl.getUniformLocation(particleProg, "uTheme"),
      uDither: gl.getUniformLocation(particleProg, "uDither"),
      uPass: gl.getUniformLocation(particleProg, "uPass"),
      uColor1: gl.getUniformLocation(particleProg, "uColor1"),
      uColor2: gl.getUniformLocation(particleProg, "uColor2"),
      uColor3: gl.getUniformLocation(particleProg, "uColor3"),
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionQuery.matches;

    const pointer = {
      ndcX: 0,
      ndcY: 0,
      smoothX: 0,
      smoothY: 0,
      active: 0,
      targetActive: 0,
      pulse: 0,
      dragYaw: 0,
      dragPitch: 0,
      isDown: false,
      lastClientX: 0,
      lastClientY: 0,
    };

    const spineNodes: [number, number, number][] = Array.from(
      { length: 8 },
      () => [0, 0, 0],
    );

    const c1 = hexToRgbNorm(config.colors.primary);
    const c2 = hexToRgbNorm(config.colors.secondary);
    const c3 = hexToRgbNorm(config.colors.accent);
    const themeVal = config.theme === "light" ? 1.0 : 0.0;
    const styleVal = STYLE_INDEX_MAP[config.renderStyle];
    const mouseModeVal = MOUSE_MODE_MAP[config.mouseMode];

    let width = 1;
    let height = 1;
    let dpr = 1;
    let inView = false;
    let rafId = 0;
    let resizeRaf = 0;
    let simTime = 0;
    let lastNow = performance.now();
    let quality = 1.0;
    let slowFrames = 0;
    let fastFrames = 0;
    let scrollTarget = 0.25;
    let scrollSmooth = 0.25;
    let prevSpineLeadX = 0;
    let prevScrollVal = 0.25;
    let smoothVelX = 0;
    let smoothVelY = 0;

    const updateScrollTarget = () => {
      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const raw = (vh - rect.top) / Math.max(1, vh + rect.height);
      scrollTarget = clamp(raw, 0, 1);
    };

    const evalSerpentineTarget = (
      s: number,
      ampX: number,
      isPortrait: boolean,
    ): [number, number, number] => {
      const waveX = Math.sin(s * Math.PI * 2.18) * ampX;
      const travelY =
        lerp(-0.36, 0.92, Math.pow(s, 1.08)) +
        Math.sin(s * Math.PI * 2.0) * 0.14 -
        (isPortrait ? 0.35 : 0);
      const travelZ = Math.sin(s * Math.PI * 2.0) * 0.42 + s * 0.35;
      return [waveX, travelY, travelZ];
    };

    const drawFrame = (now: number, stepTime: boolean) => {
      const dt = stepTime ? Math.min(0.05, Math.max(0.001, (now - lastNow) * 0.001)) : 0;
      lastNow = now;
      if (stepTime) simTime += dt * config.speed;

      scrollSmooth = stepTime
        ? lerp(scrollSmooth, scrollTarget, Math.min(1, dt * 5.2))
        : scrollTarget;
      const s = scrollSmooth;

      if (stepTime) {
        pointer.smoothX = lerp(pointer.smoothX, pointer.ndcX, Math.min(1, dt * 9.5));
        pointer.smoothY = lerp(pointer.smoothY, pointer.ndcY, Math.min(1, dt * 9.5));
        pointer.active = lerp(pointer.active, pointer.targetActive, Math.min(1, dt * 6.0));
        pointer.pulse = Math.max(0, pointer.pulse - dt * 1.4);
        if (!pointer.isDown) {
          pointer.dragYaw = lerp(pointer.dragYaw, 0, Math.min(1, dt * 1.8));
          pointer.dragPitch = lerp(pointer.dragPitch, 0, Math.min(1, dt * 1.8));
        }
      }

      const aspect = width / Math.max(1, height);
      const isPortrait = aspect < 0.85;
      const isUltrawide = aspect > 2.0;

      const camDist = isPortrait ? 8.35 : isUltrawide ? 6.55 : 6.95;
      const fovRad = (isPortrait ? 49 : 43) * (Math.PI / 180);
      const halfH = Math.tan(fovRad / 2) * camDist;
      const halfW = halfH * aspect;

      const horizAmp = Math.min(
        isPortrait ? 0.88 : isUltrawide ? 2.65 : 2.05,
        halfW * 0.62,
      );
      const [targetX, targetY, targetZ] = evalSerpentineTarget(s, horizAmp, isPortrait);

      if (stepTime) {
        const instVelX = (targetX - prevSpineLeadX) / Math.max(dt, 0.008);
        const instVelY = (s - prevScrollVal) / Math.max(dt, 0.008);
        prevSpineLeadX = targetX;
        prevScrollVal = s;
        smoothVelX = lerp(smoothVelX, clamp(instVelX * 0.22, -1.8, 1.8), Math.min(1, dt * 6.5));
        smoothVelY = lerp(smoothVelY, clamp(instVelY * 1.4, -1.8, 1.8), Math.min(1, dt * 6.5));

        const leadFollow = Math.min(1, dt * 8.6);
        const chainFollow = Math.min(1, dt * 5.8);
        const breathX = Math.sin(simTime * 0.34) * 0.09;

        if (smoothVelY >= -0.02) {
          spineNodes[7][0] = lerp(spineNodes[7][0], targetX + breathX, leadFollow);
          spineNodes[7][1] = lerp(spineNodes[7][1], targetY, leadFollow);
          spineNodes[7][2] = lerp(spineNodes[7][2], targetZ, leadFollow);
          for (let i = 6; i >= 0; i--) {
            const waveLag = Math.sin(simTime * 0.62 + i * 0.58 + s * 6.2) * 0.14;
            spineNodes[i][0] = lerp(spineNodes[i][0], spineNodes[i + 1][0] + waveLag * 0.45, chainFollow);
            spineNodes[i][1] = lerp(spineNodes[i][1], spineNodes[i + 1][1], chainFollow);
            spineNodes[i][2] = lerp(
              spineNodes[i][2],
              spineNodes[i + 1][2] + Math.cos(simTime * 0.48 + i * 0.5) * 0.08,
              chainFollow,
            );
          }
        } else {
          spineNodes[0][0] = lerp(spineNodes[0][0], targetX + breathX, leadFollow);
          spineNodes[0][1] = lerp(spineNodes[0][1], targetY, leadFollow);
          spineNodes[0][2] = lerp(spineNodes[0][2], targetZ, leadFollow);
          for (let i = 1; i <= 7; i++) {
            const waveLag = Math.sin(simTime * 0.62 + i * 0.58 + s * 6.2) * 0.14;
            spineNodes[i][0] = lerp(spineNodes[i][0], spineNodes[i - 1][0] + waveLag * 0.45, chainFollow);
            spineNodes[i][1] = lerp(spineNodes[i][1], spineNodes[i - 1][1], chainFollow);
            spineNodes[i][2] = lerp(
              spineNodes[i][2],
              spineNodes[i - 1][2] + Math.cos(simTime * 0.48 + i * 0.5) * 0.08,
              chainFollow,
            );
          }
        }
      } else {
        for (let i = 0; i < 8; i++) {
          spineNodes[i][0] = targetX;
          spineNodes[i][1] = targetY;
          spineNodes[i][2] = targetZ;
        }
      }

      const orbitAngle =
        (config.autoOrbit ? Math.sin(simTime * 0.15) * 0.22 : 0) +
        pointer.smoothX * 0.26 +
        pointer.dragYaw +
        Math.sin(s * Math.PI * 2.0) * 0.44;
      const elevAngle = pointer.smoothY * 0.16 + pointer.dragPitch + (s - 0.5) * 0.16;

      const eye: [number, number, number] = [
        Math.sin(orbitAngle) * Math.cos(elevAngle) * camDist,
        Math.sin(elevAngle) * camDist * 0.68,
        Math.cos(orbitAngle) * Math.cos(elevAngle) * camDist,
      ];

      const proj = createPerspectiveMatrix(fovRad, aspect, 0.1, 45.0);
      const view = createLookAtMatrix(eye, [0, 0, 0], [0, 1, 0]);

      const mouseWorld: [number, number, number] = [
        pointer.smoothX * halfW * 0.94,
        pointer.smoothY * halfH * 0.94,
        spineNodes[4][2] + 0.35,
      ];

      const spineCenterX = clamp(0.5 + spineNodes[4][0] / (halfW * 2.0), 0.12, 0.88);
      const spineCenterY = clamp(0.5 + spineNodes[4][1] / (halfH * 2.0), 0.12, 0.88);

      gl.disable(gl.BLEND);
      gl.useProgram(bgProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf);
      gl.enableVertexAttribArray(bgLoc.aPos);
      gl.vertexAttribPointer(bgLoc.aPos, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(bgLoc.uResolution, width, height);
      gl.uniform1f(bgLoc.uTime, simTime);
      gl.uniform1f(bgLoc.uTheme, themeVal);
      gl.uniform1f(bgLoc.uDither, config.ditherStrength);
      gl.uniform3f(bgLoc.uColor1, c1[0], c1[1], c1[2]);
      gl.uniform3f(bgLoc.uColor2, c2[0], c2[1], c2[2]);
      gl.uniform3f(bgLoc.uColor3, c3[0], c3[1], c3[2]);
      gl.uniform2f(bgLoc.uSpineCenter, spineCenterX, spineCenterY);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(particleProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, pGeomBuf);
      gl.enableVertexAttribArray(pLoc.aGeom);
      gl.vertexAttribPointer(pLoc.aGeom, 4, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, pSeedBuf);
      gl.enableVertexAttribArray(pLoc.aSeed);
      gl.vertexAttribPointer(pLoc.aSeed, 4, gl.FLOAT, false, 0, 0);

      gl.uniformMatrix4fv(pLoc.uProj, false, proj);
      gl.uniformMatrix4fv(pLoc.uView, false, view);
      gl.uniform1f(pLoc.uPixelRatio, dpr);
      gl.uniform1f(pLoc.uTime, simTime);
      gl.uniform1f(pLoc.uTwist, config.vortexTwist);
      gl.uniform1f(pLoc.uRelief, config.vertebralRelief);
      gl.uniform1f(pLoc.uTurb, config.turbulence);
      gl.uniform1f(pLoc.uSpread, config.particleSpread);
      gl.uniform1f(pLoc.uCrystalScale, config.crystalScale * (isCompactDevice ? 1.15 : 1.0));
      gl.uniform2f(pLoc.uScrollVel2D, smoothVelX, smoothVelY);
      gl.uniform1f(pLoc.uStyle, styleVal);
      for (let i = 0; i < 8; i++) {
        gl.uniform3fv(pLoc.uSpines[i], spineNodes[i]);
      }
      gl.uniform3fv(pLoc.uMouseWorld, mouseWorld);
      gl.uniform1f(pLoc.uMouseActive, pointer.active);
      gl.uniform1f(pLoc.uMouseForce, config.mouseForce);
      gl.uniform1f(pLoc.uMouseMode, mouseModeVal);
      gl.uniform1f(pLoc.uPulse, pointer.pulse);
      gl.uniform1f(pLoc.uTheme, themeVal);
      gl.uniform1f(pLoc.uDither, config.ditherStrength);
      gl.uniform3f(pLoc.uColor1, c1[0], c1[1], c1[2]);
      gl.uniform3f(pLoc.uColor2, c2[0], c2[1], c2[2]);
      gl.uniform3f(pLoc.uColor3, c3[0], c3[1], c3[2]);

      const coreDrawCount = Math.max(1, Math.floor(particles.coreCount * quality));
      const darkDrawCount = Math.max(1, Math.floor(particles.darkCount * quality));
      const brightDrawCount = Math.max(1, Math.floor(particles.brightCount * quality));

      gl.uniform1f(pLoc.uPass, 0.0);
      gl.drawArrays(gl.POINTS, particles.coreStart, coreDrawCount);

      if (config.filamentOpacity > 0.01 || config.webDensity > 0.01) {
        gl.useProgram(lineProg);
        gl.uniformMatrix4fv(lineLoc.uProj, false, proj);
        gl.uniformMatrix4fv(lineLoc.uView, false, view);
        gl.uniform1f(lineLoc.uTime, simTime);
        gl.uniform1f(lineLoc.uTwist, config.vortexTwist);
        gl.uniform1f(lineLoc.uRelief, config.vertebralRelief);
        gl.uniform1f(lineLoc.uTurb, config.turbulence);
        gl.uniform1f(lineLoc.uSpread, config.particleSpread);
        gl.uniform2f(lineLoc.uScrollVel2D, smoothVelX, smoothVelY);
        for (let i = 0; i < 8; i++) {
          gl.uniform3fv(lineLoc.uSpines[i], spineNodes[i]);
        }
        gl.uniform3fv(lineLoc.uMouseWorld, mouseWorld);
        gl.uniform1f(lineLoc.uMouseActive, pointer.active);
        gl.uniform1f(lineLoc.uMouseForce, config.mouseForce);
        gl.uniform1f(lineLoc.uMouseMode, mouseModeVal);
        gl.uniform1f(lineLoc.uPulse, pointer.pulse);
        gl.uniform1f(lineLoc.uTheme, themeVal);
        gl.uniform1f(lineLoc.uDither, config.ditherStrength);
        gl.uniform1f(lineLoc.uFilamentOpacity, config.filamentOpacity);
        gl.uniform1f(lineLoc.uWebDensity, config.webDensity);
        gl.uniform1f(lineLoc.uStyle, styleVal);
        gl.uniform3f(lineLoc.uColor1, c1[0], c1[1], c1[2]);
        gl.uniform3f(lineLoc.uColor2, c2[0], c2[1], c2[2]);
        gl.uniform3f(lineLoc.uColor3, c3[0], c3[1], c3[2]);

        if (config.filamentOpacity > 0.01) {
          gl.bindBuffer(gl.ARRAY_BUFFER, silkBuf);
          gl.enableVertexAttribArray(lineLoc.aGeom);
          gl.vertexAttribPointer(lineLoc.aGeom, 4, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.LINES, 0, silkVertexCount);
        }

        if (config.webDensity > 0.01 && webVertexCount > 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, webBuf);
          gl.enableVertexAttribArray(lineLoc.aGeom);
          gl.vertexAttribPointer(lineLoc.aGeom, 4, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.LINES, 0, webVertexCount);
        }
      }

      gl.useProgram(particleProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, pGeomBuf);
      gl.enableVertexAttribArray(pLoc.aGeom);
      gl.vertexAttribPointer(pLoc.aGeom, 4, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, pSeedBuf);
      gl.enableVertexAttribArray(pLoc.aSeed);
      gl.vertexAttribPointer(pLoc.aSeed, 4, gl.FLOAT, false, 0, 0);

      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(pLoc.uPass, 1.0);
      gl.drawArrays(gl.POINTS, particles.darkStart, darkDrawCount);

      if (themeVal < 0.5 && config.renderStyle === "iridescent-dust") {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      } else {
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
      gl.uniform1f(pLoc.uPass, 2.0);
      gl.drawArrays(gl.POINTS, particles.brightStart, brightDrawCount);
    };

    const resizeCanvas = () => {
      const maxDpr = isCompactDevice ? 1.25 : 1.5;
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const rect = container.getBoundingClientRect();
      const nextW = Math.max(1, Math.floor(rect.width * dpr));
      const nextH = Math.max(1, Math.floor(rect.height * dpr));
      if (nextW !== width || nextH !== height) {
        width = nextW;
        height = nextH;
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      if (reducedMotion && inView) {
        drawFrame(performance.now(), false);
      }
    };

    const tick = (now: number) => {
      rafId = 0;
      if (!inView || document.hidden || reducedMotion) return;
      if (isCompactDevice && now - lastNow < 24) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const frameStart = performance.now();
      drawFrame(now, true);
      const workMs = performance.now() - frameStart;
      if (workMs > 16) {
        slowFrames++;
        fastFrames = 0;
        if (slowFrames >= 12 && quality > 0.55) {
          quality = Math.max(0.55, quality - 0.15);
          slowFrames = 0;
        }
      } else if (workMs < 8) {
        fastFrames++;
        slowFrames = 0;
        if (fastFrames >= 90 && quality < 1.0) {
          quality = Math.min(1.0, quality + 0.1);
          fastFrames = 0;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (reducedMotion) {
        drawFrame(performance.now(), false);
        return;
      }
      if (!rafId && inView && !document.hidden) {
        lastNow = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const scheduleResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resizeCanvas();
      });
    };

    const updatePointerFromClient = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        pointer.targetActive = 0.0;
        return;
      }
      pointer.ndcX = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointer.ndcY = -(((clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1);
      pointer.targetActive = 1.0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!inView || reducedMotion || e.pointerType === "touch") return;
      updatePointerFromClient(e.clientX, e.clientY);
      if (pointer.isDown) {
        pointer.dragYaw += (e.clientX - pointer.lastClientX) * 0.0055;
        pointer.dragPitch = clamp(
          pointer.dragPitch + (e.clientY - pointer.lastClientY) * 0.004,
          -0.55,
          0.55,
        );
        pointer.lastClientX = e.clientX;
        pointer.lastClientY = e.clientY;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!inView || reducedMotion || e.pointerType === "touch") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("a,button,input,summary,[role='button']")) return;
      const rect = container.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      pointer.isDown = true;
      pointer.lastClientX = e.clientX;
      pointer.lastClientY = e.clientY;
      pointer.pulse = 1.0;
      updatePointerFromClient(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      pointer.isDown = false;
    };

    const onPointerLeave = () => {
      pointer.targetActive = 0.0;
      pointer.isDown = false;
    };

    const onScroll = () => {
      if (inView) updateScrollTarget();
    };

    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else if (inView) startLoop();
    };

    const onMotionChange = () => {
      reducedMotion = motionQuery.matches;
      stopLoop();
      if (inView) startLoop();
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      stopLoop();
    };

    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    resizeCanvas();
    updateScrollTarget();

    const ro = new ResizeObserver(scheduleResize);
    ro.observe(container);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          updateScrollTarget();
          startLoop();
        } else {
          stopLoop();
          pointer.targetActive = 0.0;
          pointer.isDown = false;
        }
      },
      { rootMargin: "220px 0px" },
    );
    io.observe(container);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionChange);
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      stopLoop();
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("mouseleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionChange);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      gl.deleteBuffer(bgBuf);
      gl.deleteBuffer(silkBuf);
      gl.deleteBuffer(webBuf);
      gl.deleteBuffer(pGeomBuf);
      gl.deleteBuffer(pSeedBuf);
      gl.deleteProgram(bgProg);
      gl.deleteProgram(lineProg);
      gl.deleteProgram(particleProg);
    };
  }, [config]);

  return (
    <div
      ref={containerRef}
      className={`aether-spine-backdrop ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="aether-spine-canvas" />
    </div>
  );
}
