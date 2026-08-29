const cache = new Map<string, HTMLAudioElement>();

export function playSound(src: string, volume = 0.35) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let audio = cache.get(src);
  if (!audio) {
    audio = new Audio(src);
    cache.set(src, audio);
  }
  audio.volume = volume;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export const crackSound = () => playSound("/audio/belook-cracking-ice-471457.mp3", 0.3);
export const freezeSound = () => playSound("/audio/tanweraman-ice-freezing-445024.mp3", 0.25);
