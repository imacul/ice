import * as THREE from "three";

// A cheap procedural crack-normal texture (no asset download) so glass surfaces
// read as fractured ice - matching the cracked floor/background - instead of smooth plastic.
export function makeCrackNormalMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgb(128,128,255)";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgb(190,190,255)";
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 22; i++) {
    let x = Math.random() * size, y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segments = 3 + Math.floor(Math.random() * 4);
    for (let s = 0; s < segments; s++) {
      x += (Math.random() - 0.5) * 70;
      y += (Math.random() - 0.5) * 70;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 1.4);
  return texture;
}
