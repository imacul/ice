export type Quality = 'low' | 'medium' | 'high';
type NavigatorHints = Navigator & { deviceMemory?: number };

export function initialQuality(): Quality {
  const nav = navigator as NavigatorHints;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'low';
  const memory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const pixels = innerWidth * innerHeight * devicePixelRatio;
  if (memory <= 4 || cores <= 4 || pixels > 5_000_000 || innerWidth < 520) return 'low';
  if (memory < 8 || cores < 8 || pixels > 3_000_000) return 'medium';
  return 'high';
}

export function samplePerformance(onDrop: () => void) {
  let frames = 0, start = performance.now(), raf = 0, stopped = false;
  const tick = (now: number) => {
    if (stopped) return;
    frames++;
    if (now - start >= 3500) {
      const fps = frames * 1000 / (now - start);
      if (fps < 43) onDrop();
      frames = 0; start = now;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}
