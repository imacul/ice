import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Quality } from './quality';

export default function IceSphere({ quality }: { quality: Quality }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (quality === 'low' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el=host.current!; const scene=new THREE.Scene(); const camera=new THREE.PerspectiveCamera(34,1,.1,20); camera.position.z=4;
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:quality==='high',powerPreference:'low-power'}); renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.5:1.25)); el.appendChild(renderer.domElement);
    const geo=new THREE.IcosahedronGeometry(1.12,quality==='high'?4:3); const mat=new THREE.MeshPhysicalMaterial({color:0x87dfff,transparent:true,opacity:.32,roughness:.17,metalness:.05,transmission:quality==='high'?.78:.45,thickness:.9,ior:1.31,clearcoat:.7,side:THREE.DoubleSide});
    const sphere=new THREE.Mesh(geo,mat); scene.add(sphere); const wire=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.125,2)),new THREE.LineBasicMaterial({color:0xbbefff,transparent:true,opacity:.11})); scene.add(wire);
    scene.add(new THREE.HemisphereLight(0xbdefff,0x00101d,2.2)); const point=new THREE.PointLight(0x83dfff,9,8); point.position.set(-2,2,3); scene.add(point);
    let mx=0,my=0,raf=0,active=true; const resize=()=>{const r=el.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}; const pointer=(e:PointerEvent)=>{const r=el.getBoundingClientRect();mx=((e.clientX-r.left)/r.width-.5)*.35;my=((e.clientY-r.top)/r.height-.5)*.25};
    const draw=()=>{if(active){sphere.rotation.y+=.0018;sphere.rotation.x+=(my-sphere.rotation.x)*.025;wire.rotation.copy(sphere.rotation);sphere.rotation.z+=(mx-sphere.rotation.z)*.02;renderer.render(scene,camera)}raf=requestAnimationFrame(draw)};
    const vis=()=>active=!document.hidden; resize();draw();addEventListener('resize',resize,{passive:true});el.addEventListener('pointermove',pointer);document.addEventListener('visibilitychange',vis);
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);el.removeEventListener('pointermove',pointer);document.removeEventListener('visibilitychange',vis);geo.dispose();mat.dispose();renderer.dispose();renderer.domElement.remove()};
  },[quality]);
  return <div ref={host} className={`sphere ${quality==='low'?'sphere-fallback':''}`} aria-hidden="true"><span className="sphere-crack" /></div>;
}
