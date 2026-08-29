export type Quality = 'low' | 'medium' | 'high';
type NavigatorHints = Navigator & { deviceMemory?: number };

export function initialQuality(): Quality {
  const nav = navigator as NavigatorHints;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'low';
  // deviceMemory is unsupported in Firefox/Safari, where it's simply undefined - treat
  // "unknown" as capable rather than assuming the worst, so those browsers aren't
  // unfairly forced into the low-quality path.
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  // Only bail to 'low' for a genuinely tiny/ancient device - a phone-width screen or a
  // single-core/near-zero-memory report. Everything else gets to try the real thing.
  if (memory <= 1 || cores <= 1 || innerWidth < 380) return 'low';
  if (memory < 4 || cores < 4) return 'medium';
  return 'high';
}

// Quality is decided once at load from device specs (see initialQuality) and never
// changes after that. An earlier version re-judged FPS throughout the session and
// silently swapped live 3D content for static fallbacks mid-interaction - which read
// as the site randomly breaking. Genuine WebGL failures still fall back via each
// component's own onFailure/error-boundary path; this just isn't a second, perf-based
// trigger for the same thing.
