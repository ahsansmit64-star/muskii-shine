import { useEffect, useRef } from "react";

const VERTEX = `
precision mediump float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** Water-glass refraction: layered ripples lit with warm brown and gold. */
const FRAGMENT = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uAspect;
uniform float uDetail;

float ripples(vec2 p, float t) {
  float acc = 0.0;
  acc += sin(length(p - vec2(-0.45, 0.25)) * 14.0 - t * 1.1);
  acc += sin(length(p - vec2(0.55, -0.15)) * 11.0 - t * 0.85);
  if (uDetail > 0.5) {
    acc += sin(length(p - vec2(0.1, 0.6)) * 18.0 - t * 1.4) * 0.7;
    acc += sin((p.x + p.y) * 8.0 + t * 0.6) * 0.5;
  }
  return acc;
}

void main() {
  vec2 p = (vUv - 0.5) * uAspect;
  float t = uTime;

  float h = ripples(p, t);
  vec2 grad = vec2(
    ripples(p + vec2(0.012, 0.0), t) - h,
    ripples(p + vec2(0.0, 0.012), t) - h
  );

  vec3 normal = normalize(vec3(-grad * 6.0, 1.0));
  vec3 lightDir = normalize(vec3(0.45, 0.7, 0.55));
  float diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);
  float spec = pow(diffuse, 22.0);

  vec3 deepBrown = vec3(0.161, 0.106, 0.078);
  vec3 warmBrown = vec3(0.361, 0.223, 0.145);
  vec3 gold = vec3(0.960, 0.760, 0.325);

  vec3 color = mix(deepBrown, warmBrown, diffuse);
  color += gold * spec * 0.9;
  color += gold * 0.06 * (0.5 + 0.5 * sin(h * 1.5));

  gl_FragColor = vec4(color, 1.0);
}
`;

export function RippleBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let frame = 0;
    let cleanup: (() => void) | undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

    void (async () => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        return;
      }
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          precision: "mediump",
        });
      } catch {
        return;
      }

      // Adaptive pixel ratio, further reduced on phones.
      let scale = isMobile ? 0.85 : 1;
      const basePixelRatio = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(basePixelRatio * scale);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const uniforms = {
        uTime: { value: 0 },
        uAspect: { value: new THREE.Vector2(1, 1) },
        // Extra ripple layers are skipped on mobile user agents.
        uDetail: { value: isMobile ? 0 : 1 },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);

      const resize = () => {
        const parent = canvas.parentElement;
        const width = parent?.clientWidth || window.innerWidth;
        const height = parent?.clientHeight || window.innerHeight;
        renderer.setSize(width, height, false);
        const aspect = width / Math.max(height, 1);
        uniforms.uAspect.value.set(Math.max(aspect, 1), Math.max(1 / aspect, 1));
      };
      resize();
      window.addEventListener("resize", resize, { passive: true });

      let last = performance.now();
      let frames = 0;
      let elapsed = 0;
      let downscaled = false;

      const render = (now: number) => {
        if (disposed) return;
        const delta = (now - last) / 1000;
        last = now;
        uniforms.uTime.value += reduceMotion ? 0 : Math.min(delta, 0.05);

        frames += 1;
        elapsed += delta;
        if (elapsed >= 1) {
          const fps = frames / elapsed;
          if (!downscaled && fps < 45) {
            // Dynamic resolution scaling when the device cannot keep up.
            downscaled = true;
            scale = 0.75;
            renderer.setPixelRatio(basePixelRatio * scale);
            uniforms.uDetail.value = 0;
            resize();
          }
          frames = 0;
          elapsed = 0;
        }

        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);

      cleanup = () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(frame);
        mesh.geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ backgroundColor: "#2a1b12" }}
    />
  );
}