import { useRef, useState } from 'react';

export default function FrozenObject() {
  const ref=useRef<HTMLDivElement>(null); const [drag,setDrag]=useState(false); const last=useRef(0); const angle=useRef(-18);
  const move=(e:React.PointerEvent)=>{if(!drag)return;angle.current+=e.clientX-last.current;last.current=e.clientX;if(ref.current)ref.current.style.transform=`rotateX(-12deg) rotateY(${angle.current}deg)`};
  return <div className="object-stage"><div ref={ref} className="crystal-object" role="img" aria-label="Interactive crystalline form. Drag to rotate." tabIndex={0} onPointerDown={e=>{setDrag(true);last.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={move} onPointerUp={()=>setDrag(false)} onPointerCancel={()=>setDrag(false)} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){angle.current+=e.key==='ArrowLeft'?-12:12;if(ref.current)ref.current.style.transform=`rotateX(-12deg) rotateY(${angle.current}deg)`}}}><i/><i/><i/><i/><i/><i/></div><p>DRAG TO TURN · ARROW KEYS TO ROTATE</p></div>;
}
