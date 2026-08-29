import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AmbientCanvas from "./components/AmbientCanvas";
import IceTitle3D from "./components/IceTitle3D";
import IceSphere, { CssIceSphere } from "./components/IceSphere";
import IceSword from "./components/IceSword";
import SceneErrorBoundary from "./components/SceneErrorBoundary";
import { initialQuality, type Quality } from "./lib/quality";
import { supportsWebGL } from "./lib/webgl";
import { crackSound, freezeSound } from "./lib/sound";
const FrozenObject = lazy(() => import("./components/FrozenObject"));
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const [quality] = useState<Quality>(initialQuality);
  const [loadObject, setLoadObject] = useState(false);
  const [menu, setMenu] = useState(false);
  const [run, setRun] = useState(0);
  const [webglAvailable, setWebglAvailable] = useState(supportsWebGL);
  const disableWebGL = useCallback(() => setWebglAvailable(false), []);
  const titleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = titleRef.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (event: PointerEvent) => {
      const bounds = el.getBoundingClientRect();
      const x = (event.clientX - (bounds.left + bounds.width / 2)) / bounds.width;
      const y = (event.clientY - (bounds.top + bounds.height / 2)) / bounds.height;
      el.style.setProperty("--tilt-x", `${(-y * 9).toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${(x * 13).toFixed(2)}deg`);
    };
    const reset = () => {
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", reset);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", reset);
    };
  }, []);
  const wallRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = wallRef.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (event: PointerEvent) => {
      const bounds = el.parentElement!.getBoundingClientRect();
      const x = (event.clientX - (bounds.left + bounds.width / 2)) / bounds.width;
      const y = (event.clientY - (bounds.top + bounds.height / 2)) / bounds.height;
      el.style.setProperty("--wall-x", `${(x * -22).toFixed(2)}px`);
      el.style.setProperty("--wall-y", `${(y * -14).toFixed(2)}px`);
    };
    document.addEventListener("pointermove", move);
    return () => document.removeEventListener("pointermove", move);
  }, []);
  useEffect(() => {
    const target = document.querySelector("#object");
    if (!target) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoadObject(true);
          io.disconnect();
        }
      },
      { rootMargin: "350px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(".reveal", { opacity: 1, transform: "none" });
        return;
      }
      const tl = gsap.timeline();
      tl.set(".hero", { visibility: "visible" })
        .from(".hero-darkness", { opacity: 1, duration: 0.7 })
        .from(".nav-inner", { opacity: 0, y: -12, duration: 0.7 }, 0.5)
        .from(
          ".eyebrow",
          { opacity: 0, letterSpacing: ".9em", duration: 0.9 },
          0.85,
        )
        .from(
          ".ice-hero-img, .ice-hero-3d",
          {
            opacity: 0,
            y: 35,
            filter: "blur(18px)",
            duration: 1.15,
            ease: "power2.out",
          },
          1.1,
        )
        .from(
          ".sphere",
          { opacity: 0, scale: 0.72, filter: "blur(16px)", duration: 1.2 },
          1.7,
        )
        .from(
          ".hero-copy, .enter, .scroll-cue",
          { opacity: 0, y: 16, stagger: 0.15, duration: 0.65 },
          2.45,
        );
      gsap.utils
        .toArray<HTMLElement>(".reveal")
        .forEach((el) =>
          gsap.from(el, {
            opacity: 0,
            y: 45,
            duration: 0.9,
            scrollTrigger: { trigger: el, start: "top 84%" },
          }),
        );
    }, root);
    return () => ctx.revert();
  }, [run]);
  const replay = () => {
    freezeSound();
    scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setRun((x) => x + 1), 500);
  };
  return (
    <div ref={root} className={`site quality-${quality}`}>
      <header className="nav">
        <div className="nav-inner">
          <button
            className="menu"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            <span />
            <span />
          </button>
          <nav aria-label="Primary" className={menu ? "open" : ""}>
            {["HOME", "ABOUT", "STATES", "CONTACT"].map((x) => (
              <a
                key={x}
                href={`#${x.toLowerCase()}`}
                onClick={() => setMenu(false)}
              >
                {x}
              </a>
            ))}
          </nav>
          <span className="quality-label" title="Adaptive visual quality">
            {quality}
          </span>
        </div>
      </header>
      <main>
        <section id="home" className="hero" aria-labelledby="hero-title">
          <div className="hero-darkness" />
          <img className="hero-bg" src="/images/ice-bg.png" alt="" aria-hidden="true" />
          <AmbientCanvas type="mist" quality={quality} />
          <AmbientCanvas type="crystals" quality={quality} />
          <div className="light-sweep" />
          <div className="hero-content">
            <p className="eyebrow">AN EXPERIMENTAL STUDY OF ICE</p>
            <div className="title-wrap" ref={titleRef}>
              {webglAvailable && quality !== "low" ? (
                <SceneErrorBoundary
                  fallback={
                    <img
                      id="hero-title"
                      className="ice-hero-img"
                      src="/images/ice-hero.png"
                      alt="ICE"
                    />
                  }
                  onError={disableWebGL}
                >
                  <IceTitle3D quality={quality} onFailure={disableWebGL} />
                </SceneErrorBoundary>
              ) : (
                <img
                  id="hero-title"
                  className="ice-hero-img"
                  src="/images/ice-hero.png"
                  alt="ICE"
                />
              )}
            </div>
            {webglAvailable && quality !== "low" ? (
              <SceneErrorBoundary
                fallback={<CssIceSphere />}
                onError={disableWebGL}
              >
                <IceSphere quality={quality} onFailure={disableWebGL} />
              </SceneErrorBoundary>
            ) : (
              <CssIceSphere />
            )}
            <p className="hero-copy">FORMED IN SILENCE. BUILT TO ENDURE.</p>
            <a className="enter" href="#about" onClick={crackSound}>
              ENTER THE COLD
            </a>
          </div>
          <a className="scroll-cue" href="#about">
            <span />
            SCROLL TO DESCEND
          </a>
        </section>
        <section id="about" className="memory section">
          <div className="section-no">01 / MEMORY</div>
          <div className="memory-grid reveal">
            <h2>
              ICE REMEMBERS
              <br />
              <em>EVERYTHING</em>
            </h2>
            <div>
              <p className="lead">
                A frozen archive, written in pressure and air.
              </p>
              <p>
                Every layer holds a season. Every bubble preserves a breath of
                atmosphere. Long after a moment has vanished, ice keeps its
                exact conditions suspended—silent evidence of temperature,
                movement and time.
              </p>
            </div>
          </div>
          <div className="core-sample reveal">
            <div className="core-lines" />
            <span>
              800,000 YEARS
              <br />
              IN A SINGLE CORE
            </span>
          </div>
        </section>
        <section id="states" className="states section">
          <div className="section-no">02 / STATES</div>
          <header className="states-head reveal">
            <p>THREE FORMS OF CHANGE</p>
            <h2>
              NOTHING FROZEN
              <br />
              STAYS STILL.
            </h2>
          </header>
          <div className="state-grid">
            <article className="state-card freeze reveal">
              <span>01</span>
              <div className="state-visual">
                <i />
                <i />
                <i />
              </div>
              <h3>FREEZE</h3>
              <p>
                Motion slows. Molecules arrange themselves into a quiet,
                repeating order.
              </p>
            </article>
            <article className="state-card fracture reveal">
              <span>02</span>
              <div className="state-visual">
                <svg viewBox="0 0 300 240">
                  <path d="M152 2l-9 63 28 25-33 31 22 30-39 38 7 49M143 65 91 42m47 79-66 15m88 15 66-31m-105 69-60 25" />
                </svg>
              </div>
              <h3>FRACTURE</h3>
              <p>
                Pressure finds the weakest path, releasing its history in a
                bright instant.
              </p>
            </article>
            <article className="state-card thaw reveal">
              <span>03</span>
              <div className="state-visual">
                <i />
                <i />
              </div>
              <h3>THAW</h3>
              <p>
                Edges soften. Structure becomes reflection, returning slowly to
                motion.
              </p>
            </article>
          </div>
        </section>
        <section id="object" className="object-section section">
          <div className="object-copy reveal">
            <div className="section-no">03 / FORM</div>
            <h2>
              HOLD
              <br />
              THE COLD.
            </h2>
            <p>
              A crystalline body is never truly still. Turn it. Watch each face
              gather and release the light.
            </p>
          </div>
          {loadObject ? (
            <Suspense
              fallback={<div className="object-loading">CONDENSING…</div>}
            >
              {webglAvailable && quality !== "low" ? (
                <SceneErrorBoundary
                  fallback={<FrozenObject />}
                  onError={disableWebGL}
                >
                  <div className="object-stage">
                    <IceSword quality={quality} onFailure={disableWebGL} />
                    <p>DRAG TO TURN · ARROW KEYS TO ROTATE</p>
                  </div>
                </SceneErrorBoundary>
              ) : (
                <FrozenObject />
              )}
            </Suspense>
          ) : (
            <div className="object-loading">APPROACH TO REVEAL</div>
          )}
        </section>
        <section id="contact" className="ending">
          <img ref={wallRef} className="ending-bg" src="/images/ice-wall-bg.png" alt="" aria-hidden="true" />
          <div className="frost-clear" />
          <p>
            THE ICE EVENTUALLY
            <br />
            GIVES WAY.
          </p>
          <h2>
            BUILT FOR FUN
            <br />
            BY <em>IMACUL77</em>
          </h2>
          <button onClick={replay}>↻ REPLAY THE OPENING</button>
          <footer>
            <span>ICE © 2026</span>
            <a href="#home">BACK TO SURFACE ↑</a>
          </footer>
        </section>
      </main>
    </div>
  );
}
