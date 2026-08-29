export function supportsWebGL(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("force-webgl") === "off") return false;
  try {
    const canvas = document.createElement("canvas");
    const options: WebGLContextAttributes = { alpha: true, antialias: false, depth: false, failIfMajorPerformanceCaveat: true, powerPreference: "low-power", preserveDrawingBuffer: false, stencil: false };
    const context = canvas.getContext("webgl2", options) ?? canvas.getContext("webgl", options) ?? canvas.getContext("experimental-webgl", options);
    if (!context) return false;
    (context as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch { return false; }
}
