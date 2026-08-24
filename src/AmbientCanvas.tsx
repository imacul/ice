import { useEffect, useRef } from 'react';
import type { Quality } from './quality';

export default function AmbientCanvas({ type, quality }: { type: 'mist' | 'crystals', quality: Quality }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!; const ctx = canvas.getContext('2d', { alpha: true })!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, visible = !document.hidden, w = 0, h = 0;
    const scale = quality === 'high' ? .48 : quality === 'medium' ? .34 : .24;
    const count = type === 'crystals' ? (quality === 'high' ? 42 : quality === 'medium' ? 24 : 12) : 7;
    const parts = Array.from({ length: count }, (_, i) => ({ x: Math.random(), y: Math.random(), s: .25 + Math.random() * .55, v: .00002 + Math.random() * .00005, p: i * 1.7 }));
    const resize = () => { w = canvas.width = Math.max(1, innerWidth * scale); h = canvas.height = Math.max(1, innerHeight * scale); };
    const draw = (t: number) => {
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      if (type === 'mist') {
        for (let i=0;i<count;i++) { const p=parts[i]; const x=((p.x + t*p.v) % 1.3 -.15)*w; const y=h*(.68+i*.045); const g=ctx.createRadialGradient(x,y,0,x,y,w*.22); g.addColorStop(0,'rgba(104,196,239,.09)'); g.addColorStop(1,'rgba(30,90,130,0)'); ctx.fillStyle=g; ctx.fillRect(x-w*.24,y-h*.1,w*.48,h*.2); }
      } else {
        ctx.fillStyle='#c8f3ff';
        for (const p of parts) { const y=((p.y+t*p.v*.55)%1)*h; const x=(p.x+Math.sin(t*.00025+p.p)*.025)*w; ctx.globalAlpha=.18+.35*Math.sin(t*.001+p.p)**2; ctx.save(); ctx.translate(x,y); ctx.rotate(t*.00015+p.p); ctx.fillRect(-p.s/2,-p.s*2,p.s,p.s*4); ctx.restore(); }
        ctx.globalAlpha=1;
      }
      if (!reduced) raf=requestAnimationFrame(draw);
    };
    const onVis=()=>{ visible=!document.hidden; if(visible&&!reduced) raf=requestAnimationFrame(draw); else cancelAnimationFrame(raf); };
    resize(); draw(0); addEventListener('resize',resize,{passive:true}); document.addEventListener('visibilitychange',onVis);
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);document.removeEventListener('visibilitychange',onVis)};
  }, [type, quality]);
  return <canvas ref={ref} className={`ambient ${type}`} aria-hidden="true" />;
}
