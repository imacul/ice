import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Quality } from "../lib/quality";
import { crackSound } from "../lib/sound";

export default function IceSword({ quality, onFailure }: { quality: Quality; onFailure: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let mesh: THREE.Object3D | undefined;
    let frame = 0, active = true, mounted = true, pointerX = 0, pointerY = 0, t = 0;
    let dragging = false, dragX = 0.15, dragY = 0.5, lastX = 0, lastY = 0;
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
      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio, 1.5), 2));
      element.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xbdefff, 0x00101d, 2.2));
      const key = new THREE.PointLight(0x83dfff, 10, 12); key.position.set(-2, 2.5, 3); scene.add(key);
      const rim = new THREE.PointLight(0x9fe8ff, 7, 10); rim.position.set(2.2, -1, 2.6); scene.add(rim);

      const loader = new GLTFLoader();
      loader.load(
        "/models/ice-sword.glb",
        (gltf) => {
          if (!mounted) return;
          mesh = gltf.scene;
          mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              disposables.push(child.geometry);
              const mat = child.material as THREE.MeshStandardMaterial;
              mat.envMapIntensity = 1.1;
              disposables.push(mat);
            }
          });
          const box = new THREE.Box3().setFromObject(mesh);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          mesh.position.sub(center);
          mesh.rotation.set(dragX, dragY, 0);
          const radius = Math.max(size.x, size.y, size.z) / 2;
          camera.position.set(0, 0, radius / Math.tan((camera.fov * Math.PI) / 360) * 1.5);
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
        pointerX = (event.clientX / innerWidth - 0.5) * 0.4;
        pointerY = (event.clientY / innerHeight - 0.5) * 0.3;
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
          if (mesh) {
            if (dragging) {
              mesh.rotation.x += (dragX - mesh.rotation.x) * 0.35;
              mesh.rotation.y += (dragY - mesh.rotation.y) * 0.35;
            } else {
              mesh.rotation.x += (dragX + pointerY - mesh.rotation.x) * 0.06;
              mesh.rotation.y += (dragY + pointerX + Math.sin(t * 0.6) * 0.05 - mesh.rotation.y) * 0.06;
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
      className="ice-sword-3d"
      role="img"
      aria-label="Interactive ice sword. Drag to rotate."
      tabIndex={0}
    />
  );
}
