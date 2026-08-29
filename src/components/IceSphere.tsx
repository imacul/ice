import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
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
    let sphere: THREE.Object3D | undefined;
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

      scene.add(new THREE.HemisphereLight(0x9df8ff, 0x00101d, 2.2));
      const point = new THREE.PointLight(0x2ee0f0, 9, 8); point.position.set(-2, 2, 3); scene.add(point);
      const rim = new THREE.PointLight(0x6ef0ff, 6, 8); rim.position.set(2, -1, 2.5); scene.add(rim);

      const loader = new GLTFLoader();
      loader.load(
        "/models/ice-orb-v2.glb",
        (gltf) => {
          if (!mounted) return;
          const orb = gltf.scene;
          orb.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              // Recenter the geometry itself (not just the object's position) so
              // rotation pivots on the visual center - otherwise it orbits instead
              // of spinning in place, since the mesh's own origin sits off to one side.
              child.geometry.computeBoundingBox();
              const localCenter = child.geometry.boundingBox!.getCenter(new THREE.Vector3());
              child.geometry.translate(-localCenter.x, -localCenter.y, -localCenter.z);
              disposables.push(child.geometry);
              const mat = child.material as THREE.MeshPhysicalMaterial;
              const crackMap = makeCrackNormalMap();
              mat.color = new THREE.Color(0x8ff5ff); // clearly cyan (blue >= green channel) - the earlier teal read as green once combined with lights
              mat.emissive = new THREE.Color(0x0ec9e8);
              mat.emissiveIntensity = 0.5;
              mat.transmission = quality === "high" ? 0.28 : 0.18;
              mat.opacity = 0.93;
              mat.transparent = true;
              mat.roughness = 0.18;
              mat.metalness = 0.05;
              mat.ior = 1.31;
              mat.thickness = 0.7;
              mat.clearcoat = 0.6;
              mat.normalMap = crackMap;
              mat.normalScale.set(1.2, 1.2);
              mat.side = THREE.DoubleSide;
              disposables.push(mat, crackMap);
            }
          });
          const box = new THREE.Box3().setFromObject(orb);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          orb.position.sub(center);
          const radius = Math.max(size.x, size.y, size.z) / 2;
          camera.position.z = radius / Math.tan((camera.fov * Math.PI) / 360) * 1.6;
          sphere = orb;
          scene.add(orb);
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
