import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Quality } from "../lib/quality";
import { makeCrackNormalMap } from "../lib/crackTexture";
import { crackSound } from "../lib/sound";

export function CssIceSphere() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const move = (event: PointerEvent) => {
      const bounds = element.getBoundingClientRect();
      const cx = bounds.left + bounds.width / 2;
      const cy = bounds.top + bounds.height / 2;
      element.style.setProperty("--sphere-x", `${((event.clientX - cx) / innerWidth) * 60}px`);
      element.style.setProperty("--sphere-y", `${((event.clientY - cy) / innerHeight) * 60}px`);
    };
    document.addEventListener("pointermove", move);
    return () => document.removeEventListener("pointermove", move);
  }, []);
  return (
    <div ref={host} className="sphere sphere-fallback" data-renderer="css" aria-hidden="true">
      <span className="sphere-fallback-orbit"><span className="sphere-crack" /></span>
    </div>
  );
}

export default function IceSphere({ quality, onFailure }: { quality: Quality; onFailure: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let sphere: THREE.Mesh | undefined;
    let frame = 0, active = true, mounted = true, pointerX = 0, pointerY = 0, t = 0;
    let dragging = false, dragX = 0, dragY = 0, lastX = 0, lastY = 0;
    const disposables: { dispose: () => void }[] = [];
    const cleanupRenderer = () => {
      cancelAnimationFrame(frame);
      disposables.forEach((d) => d.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
    };
    const fail = () => { cleanupRenderer(); if (mounted) onFailure(); };
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20); camera.position.z = 4;
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2));
      element.appendChild(renderer.domElement);

      const geometry = new THREE.IcosahedronGeometry(1.12, quality === "high" ? 5 : 4);
      const crackMap = makeCrackNormalMap();
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xc5ffe0, // matches --ice (teal), same palette as the ICE title
        emissive: 0x14b894, // darker shade of --cyan (teal)
        emissiveIntensity: 0.5,
        transmission: quality === "high" ? 0.28 : 0.18,
        opacity: 0.93,
        transparent: true,
        roughness: 0.18,
        metalness: 0.05,
        ior: 1.31,
        thickness: 0.7,
        clearcoat: 0.6,
        normalMap: crackMap,
        normalScale: new THREE.Vector2(1.2, 1.2),
        side: THREE.DoubleSide,
      });
      sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      disposables.push(geometry, material, crackMap);

      scene.add(new THREE.HemisphereLight(0xa8ffe8, 0x00101d, 2.2));
      const point = new THREE.PointLight(0x4de8c2, 9, 8); point.position.set(-2, 2, 3); scene.add(point);
      const rim = new THREE.PointLight(0x7ff0d0, 6, 8); rim.position.set(2, -1, 2.5); scene.add(rim);

      const resize = () => {
        if (!renderer) return;
        const bounds = element.getBoundingClientRect();
        renderer.setSize(bounds.width, bounds.height, false);
        camera.aspect = bounds.width / bounds.height;
        camera.updateProjectionMatrix();
      };
      const pointer = (event: PointerEvent) => {
        if (dragging) return;
        pointerX = (event.clientX / innerWidth - 0.5) * 0.7;
        pointerY = (event.clientY / innerHeight - 0.5) * 0.5;
      };
      const dragStart = (event: PointerEvent) => {
        dragging = true;
        crackSound();
        lastX = event.clientX;
        lastY = event.clientY;
        element.setPointerCapture(event.pointerId);
        element.classList.add("dragging");
      };
      const dragMove = (event: PointerEvent) => {
        if (!dragging) return;
        dragY += (event.clientX - lastX) * 0.01;
        dragX += (event.clientY - lastY) * 0.01;
        lastX = event.clientX;
        lastY = event.clientY;
      };
      const dragEnd = (event: PointerEvent) => {
        dragging = false;
        element.releasePointerCapture(event.pointerId);
        element.classList.remove("dragging");
      };
      const keyRotate = (event: KeyboardEvent) => {
        if (event.key === "ArrowLeft") dragY -= 0.2;
        else if (event.key === "ArrowRight") dragY += 0.2;
        else if (event.key === "ArrowUp") dragX -= 0.2;
        else if (event.key === "ArrowDown") dragX += 0.2;
        else return;
        event.preventDefault();
      };
      const visibility = () => { active = !document.hidden; };
      const draw = () => {
        if (!renderer) return;
        if (active) {
          t += 0.016;
          if (sphere) {
            if (dragging) {
              sphere.rotation.x += (dragX - sphere.rotation.x) * 0.35;
              sphere.rotation.y += (dragY - sphere.rotation.y) * 0.35;
            } else {
              sphere.rotation.y += 0.0018;
              sphere.rotation.x += (dragX + pointerY - sphere.rotation.x) * 0.025;
              sphere.rotation.z += (pointerX - sphere.rotation.z) * 0.02;
            }
          }
          try { renderer.render(scene, camera); } catch { fail(); return; }
        }
        frame = requestAnimationFrame(draw);
      };
      resize(); draw();
      addEventListener("resize", resize, { passive: true });
      document.addEventListener("pointermove", pointer);
      document.addEventListener("visibilitychange", visibility);
      element.addEventListener("pointerdown", dragStart);
      element.addEventListener("pointermove", dragMove);
      element.addEventListener("pointerup", dragEnd);
      element.addEventListener("pointercancel", dragEnd);
      element.addEventListener("keydown", keyRotate);
      return () => {
        mounted = false;
        removeEventListener("resize", resize);
        document.removeEventListener("pointermove", pointer);
        document.removeEventListener("visibilitychange", visibility);
        element.removeEventListener("pointerdown", dragStart);
        element.removeEventListener("pointermove", dragMove);
        element.removeEventListener("pointerup", dragEnd);
        element.removeEventListener("pointercancel", dragEnd);
        element.removeEventListener("keydown", keyRotate);
        cleanupRenderer();
      };
    } catch { fail(); return () => { mounted = false; cleanupRenderer(); }; }
  }, [quality, onFailure]);
  return (
    <div
      ref={host}
      className="sphere sphere-webgl"
      data-renderer="webgl"
      role="img"
      aria-label="Interactive ice sphere. Drag to rotate."
      tabIndex={0}
    />
  );
}
