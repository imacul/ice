import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Quality } from "../lib/quality";
import { makeCrackNormalMap } from "../lib/crackTexture";
import { crackSound } from "../lib/sound";

export default function IceTitle3D({ quality, onFailure }: { quality: Quality; onFailure: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let mesh: THREE.Object3D | undefined;
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
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      // Enforce a minimum of 1.5x even on standard-DPI displays: free supersampling
      // that keeps text edges and the normal-mapped surface from looking soft.
      renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2));
      element.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xa8ffe8, 0x00101d, 2.4));
      const key = new THREE.PointLight(0x4de8c2, 12, 10); key.position.set(-2.2, 2.2, 3.2); scene.add(key);
      const rim = new THREE.PointLight(0x7ff0d0, 8, 10); rim.position.set(2.4, -1.2, 2.6); scene.add(rim);

      const loader = new GLTFLoader();
      loader.load(
        "/models/ice-text-v2.glb",
        (gltf) => {
          if (!mounted) return;
          mesh = gltf.scene;
          mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              disposables.push(child.geometry);
              const mat = child.material as THREE.MeshPhysicalMaterial;
              mat.color = new THREE.Color(0xc5ffe0); // matches --ice (teal)
              mat.emissive = new THREE.Color(0x14b894); // darker shade of --cyan (teal)
              mat.emissiveIntensity = 0.5;
              mat.transmission = quality === "high" ? 0.45 : 0.3;
              mat.opacity = 0.75;
              mat.transparent = true;
              mat.roughness = 0.18;
              mat.metalness = 0.05;
              mat.ior = 1.31;
              mat.thickness = 0.7;
              mat.clearcoat = 0.6;
              const crackMap = makeCrackNormalMap();
              mat.normalMap = crackMap;
              mat.normalScale.set(1.6, 1.6);
              disposables.push(mat, crackMap);
            }
          });
          const box = new THREE.Box3().setFromObject(mesh);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          mesh.position.sub(center);
          const radius = Math.max(size.x, size.y) / 2;
          camera.position.set(0, 0, radius / Math.tan((camera.fov * Math.PI) / 360) * 1.35);
          camera.lookAt(0, 0, 0);
          scene.add(mesh);
        },
        undefined,
        () => fail(),
      );

      const resize = () => {
        if (!renderer) return;
        const bounds = element.getBoundingClientRect();
        renderer.setSize(bounds.width, bounds.height, false);
        camera.aspect = bounds.width / bounds.height;
        camera.updateProjectionMatrix();
      };
      const pointer = (event: PointerEvent) => {
        if (dragging) return;
        pointerX = (event.clientX / innerWidth - 0.5) * 0.5;
        pointerY = (event.clientY / innerHeight - 0.5) * 0.35;
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
        dragY += (event.clientX - lastX) * 0.008;
        dragX += (event.clientY - lastY) * 0.008;
        dragX = Math.max(-0.7, Math.min(0.7, dragX));
        lastX = event.clientX;
        lastY = event.clientY;
      };
      const dragEnd = (event: PointerEvent) => {
        dragging = false;
        element.releasePointerCapture(event.pointerId);
        element.classList.remove("dragging");
      };
      const keyRotate = (event: KeyboardEvent) => {
        if (event.key === "ArrowLeft") dragY -= 0.15;
        else if (event.key === "ArrowRight") dragY += 0.15;
        else if (event.key === "ArrowUp") dragX = Math.max(-0.7, dragX - 0.15);
        else if (event.key === "ArrowDown") dragX = Math.min(0.7, dragX + 0.15);
        else return;
        event.preventDefault();
      };
      const visibility = () => { active = !document.hidden; };
      let skip = 0;
      const draw = () => {
        if (!renderer) return;
        // Throttle to ~half framerate: the sway/tilt motion is slow, so this halves
        // GPU cost without a visible stutter, keeping this a cheap live scene.
        skip = (skip + 1) % 2;
        if (active && skip === 0) {
          t += 0.016;
          if (mesh) {
            const targetX = dragging ? dragX : dragX + -pointerY;
            const targetY = dragging ? dragY : dragY + pointerX + Math.sin(t) * 0.03;
            mesh.rotation.x += (targetX - mesh.rotation.x) * (dragging ? 0.35 : 0.08);
            mesh.rotation.y += (targetY - mesh.rotation.y) * (dragging ? 0.35 : 0.08);
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
      className="ice-hero-3d"
      role="img"
      aria-label="Interactive ICE title. Drag to rotate."
      tabIndex={0}
    />
  );
}
