import { useEffect, useRef } from 'react';

import { useReducedMotion } from './useReducedMotion';

/**
 * The reference orb is a WebGPU sheet with a dozen flow programs. This is the one preset it is
 * actually configured with — `style 13`, the opal-interference field, with the glass shell off —
 * ported to **WebGL**, which every browser has and WebGPU still is not (no Safari, no Firefox).
 *
 * The maths below is the shader's, line for line: the eight-step interference accumulator, the
 * four-stop ramp, the saturation lift, and the highlight/shadow/limb tail. What is dropped is
 * everything the preset never switches on — the glass refraction, the particle ribbons, the eleven
 * other flow programs, the palette bank — because carrying them would be carrying dead code.
 *
 * The reference also swaps to a muted stone palette at rest. This one does not: the orb keeps the
 * violet it thinks in and only slows down, so settling reads as the same object catching its
 * breath rather than as a different object appearing. That leaves **speed as the only thing that
 * changes**, which is why there is no colour interpolation here at all.
 */

/** The reference's `thinking` seed, used in both states. */
const PALETTE = {
  zoom: 0.3,
  warp: 2.8,
  shade: 0.1,
  exposure: 1.12,
  colorA: [0.5686, 0.3765, 0.8627],
  colorB: [0.4392, 0.1882, 0.8118],
  colorC: [0, 0.2157, 0.6784],
  colorD: [0.0157, 0.0078, 0.1333],
  highlight: [1, 1, 1],
  canvas: [0.0275, 0.0314, 0.051],
} as const;

const SPEED = { resting: 0.7, thinking: 1.5 };

/**
 * The reference renders at 0.72 of the viewport's short side because it fills a window. Here the
 * canvas *is* the orb, so the sphere is scaled up to nearly fill it. The fluid is evaluated in
 * `uv / radius` space, so this changes how much canvas the sphere covers and nothing else about it.
 */
const RADIUS = 0.92;

/** The reference's own timings: quick to wake, slower to settle. */
const TO_THINKING_MS = 450;
const TO_RESTING_MS = 650;

/** One backing store at the largest size the orb ever draws; CSS scales the element down. */
const RESOLUTION = 112;

const VERTEX_SHADER = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime, uZoom, uWarp, uShade, uExposure;
uniform vec3 uA, uB, uC, uD, uHi, uCanvas;

vec3 ramp(float v) {
  vec3 c = mix(uB, uC, smoothstep(0.0, 0.45, v));
  c = mix(c, uD, smoothstep(0.38, 0.72, v));
  return mix(c, uA, smoothstep(0.68, 1.0, v));
}

vec3 finish(vec3 color, vec2 p) {
  color = mix(color, uHi, uShade * 0.22 * smoothstep(0.15, 1.15, dot(p, vec2(-0.32, 0.78))));
  color *= 1.0 - uShade * 0.34 * smoothstep(-0.1, 1.2, dot(p, vec2(0.45, -0.62)));
  color *= 1.0 - uShade * 0.22 * smoothstep(0.72, 1.08, length(p));
  return clamp(color, 0.0, 1.0);
}

vec3 opal(vec2 p, float t) {
  vec2 q = p * (0.8 + uZoom * 0.64);
  float complexity = 0.76 + uWarp * 0.085;
  float d = -t * 0.42;
  float a = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    a += cos(fi - d - a * q.x * complexity);
    d += sin(q.y * fi * complexity + a);
  }
  d += t * 0.42;
  vec2 c1 = cos(q * vec2(d, a)) * 0.6 + vec2(0.4);
  float c2 = cos(a + d) * 0.5 + 0.5;
  vec3 inter = 0.5 + 0.5 * cos(vec3(c1.x, c1.y, c2) * cos(vec3(d, a, 2.5)) * 0.5 + vec3(0.5));
  float tone = fract(inter.r * 0.37 + inter.g * 0.51 + inter.b * 0.73 + c1.x * 0.22 - c1.y * 0.15);
  vec3 color = ramp(tone);
  color = mix(color, uA, 0.16 + 0.1 * inter.b);
  color = color / (vec3(1.0) + color * 0.16);
  return finish(color, p);
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / max(min(uRes.x, uRes.y), 1.0);
  float pd = length(uv) / ${RADIUS.toFixed(2)};

  // Nothing on this pixel: the disc's coverage is already exactly zero past 1.01.
  if (pd > 1.01) { gl_FragColor = vec4(0.0); return; }

  vec3 fluid = opal(uv / ${RADIUS.toFixed(2)}, uTime);
  float lum = dot(fluid, vec3(0.213, 0.715, 0.072));
  vec3 sat = clamp(vec3(lum) + (fluid - vec3(lum)) * 1.22, 0.0, 1.0);

  float cover = 0.99 * (1.0 - smoothstep(0.995, 1.04, pd));
  vec3 col = sat * cover + uCanvas * (1.0 - cover);
  float ball = 1.0 - smoothstep(0.99, 1.01, pd);
  col = clamp(col * max(uExposure, 0.0), 0.0, 1.0) * ball;

  // Premultiplied: the colour is already scaled by the disc's own coverage.
  gl_FragColor = vec4(col, clamp(max(ball, max(col.r, max(col.g, col.b))), 0.0, 1.0));
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (shader === null) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === true) return shader;

  gl.deleteShader(shader);
  return null;
}

interface OrbProps {
  /** Larger, lit and quick while the analysis runs; smaller and slower once it lands. */
  thinking: boolean;
}

export const Orb = ({ thinking }: OrbProps) => {
  const host = useRef<HTMLSpanElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const thinkingRef = useRef(thinking);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    thinkingRef.current = thinking;
  }, [thinking]);

  useEffect(() => {
    const element = canvas.current;
    if (element === null) return;

    const gl = element.getContext('webgl', { premultipliedAlpha: true, antialias: false });
    if (gl === null || gl.isContextLost()) return;

    // A lost context leaves the canvas showing garbage. Handing the element back to the CSS
    // fallback is both correct and the only thing that can be done about it.
    const onLost = (event: Event) => {
      event.preventDefault();
      host.current?.removeAttribute('data-gl');
    };
    element.addEventListener('webglcontextlost', onLost);

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (vertex === null || fragment === null || program === null) return;

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) return;

    gl.useProgram(program);

    // One triangle covering the viewport. The disc is masked in the fragment shader.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const at = (name: string) => gl.getUniformLocation(program, name);

    element.width = RESOLUTION;
    element.height = RESOLUTION;
    gl.viewport(0, 0, RESOLUTION, RESOLUTION);

    // Everything except the clock is constant now, so it is uploaded once rather than per frame.
    gl.uniform2f(at('uRes'), RESOLUTION, RESOLUTION);
    gl.uniform1f(at('uZoom'), PALETTE.zoom);
    gl.uniform1f(at('uWarp'), PALETTE.warp);
    gl.uniform1f(at('uShade'), PALETTE.shade);
    gl.uniform1f(at('uExposure'), PALETTE.exposure);
    gl.uniform3fv(at('uA'), PALETTE.colorA);
    gl.uniform3fv(at('uB'), PALETTE.colorB);
    gl.uniform3fv(at('uC'), PALETTE.colorC);
    gl.uniform3fv(at('uD'), PALETTE.colorD);
    gl.uniform3fv(at('uHi'), PALETTE.highlight);
    gl.uniform3fv(at('uCanvas'), PALETTE.canvas);
    const timeUniform = at('uTime');

    // The canvas is live, so the CSS fallback sphere underneath can stop animating.
    host.current?.setAttribute('data-gl', 'true');

    let frame = 0;
    let previous: number | null = null;
    let clock = 0;
    let progress = thinkingRef.current ? 1 : 0;

    const draw = (now: number) => {
      const delta = previous === null ? 0 : Math.min(0.1, (now - previous) / 1000);
      previous = now;

      const target = thinkingRef.current;
      const duration = (target ? TO_THINKING_MS : TO_RESTING_MS) / 1000;
      const step = reducedMotion ? 1 : delta / duration;
      progress = Math.min(1, Math.max(0, progress + (target ? step : -step)));

      // Ease out on the way in, smoothstep on the way back — the reference's own asymmetry.
      const k = target ? 1 - (1 - progress) ** 3 : progress * progress * (3 - 2 * progress);

      // Speed changes how fast the clock advances, never what it reads. Setting the clock from
      // speed directly would make the pattern jump the instant the speed did.
      clock += reducedMotion ? 0 : delta * (SPEED.resting + (SPEED.thinking - SPEED.resting) * k);

      gl.uniform1f(timeUniform, clock);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener('webglcontextlost', onLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      // Deliberately NOT `WEBGL_lose_context`. StrictMode mounts, unmounts and mounts again on the
      // same canvas element, so losing the context on the first teardown hands the second setup a
      // dead one — which paints the canvas white. The context goes with the element.
    };
  }, [reducedMotion]);

  return (
    <span ref={host} aria-hidden className="orb" data-thinking={thinking}>
      {/* The CSS sphere is the floor, not the decoration: it is what shows when WebGL is
          unavailable or the context is lost. The canvas covers it once it is drawing. */}
      <span className="orb__blob" />
      <span className="orb__blob" />
      <span className="orb__blob" />
      <canvas ref={canvas} className="orb__canvas" />
    </span>
  );
};
