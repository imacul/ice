import { lazy, Suspense, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AmbientCanvas from "./AmbientCanvas";
import IceSphere from "./IceSphere";
import { initialQuality, samplePerformance, type Quality } from "./quality";
const FrozenObject = lazy(() => import("./FrozenObject"));
gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const [quality, setQuality] = useState<Quality>(initialQuality);
  const [loadObject, setLoadObject] = useState(false);
  const [menu, setMenu] = useState(false);
  const [run, setRun] = useState(0);
  useEffect(() => {
    document.querySelector(".ice-title")?.setAttribute("aria-label", "ICE");
    document
      .querySelectorAll(".title-clouds,.title-reflection")
      .forEach((el) => el.setAttribute("aria-hidden", "true"));
  }, []);
  useEffect(
    () =>
      samplePerformance(() =>
        setQuality((q) => (q === "high" ? "medium" : "low")),
      ),
    [],
  );
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
          ".ice-title",
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
          ".title-cracks",
          { opacity: 0, scale: 0.85, duration: 0.35, repeat: 1, yoyo: true },
          1.85,
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
    scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setRun((x) => x + 1), 500);
  };
  return (
    <div ref={root} className={`site quality-${quality}`}>
      <header className="nav">
        <div className="nav-inner">
          <a className="brand" href="#home" aria-label="ICE home">
            <img src="/ice-logo.webp" alt="" />
          </a>
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
          <AmbientCanvas type="mist" quality={quality} />
          <AmbientCanvas type="crystals" quality={quality} />
          <div className="light-sweep" />
          <svg
            className="edge-crack left"
            viewBox="0 0 240 900"
            aria-hidden="true"
          >
            <path d="M0 170 70 220 42 305 116 349 68 438 143 507 95 590 183 666M70 220l83-55M42 305 0 340m116 9 65-58M68 438 0 472m143 35 67-18M95 590 20 640" />
          </svg>
          <svg
            className="edge-crack right"
            viewBox="0 0 240 900"
            aria-hidden="true"
          >
            <path d="M240 72 165 142 192 235 116 300 156 385 78 471 123 550 48 655M165 142 85 94m107 141 48 37m-124 28-78-44m118 129 72-9M78 471 8 448m115 102 85 63" />
          </svg>
          <div className="hero-content">
            <p className="eyebrow">AN EXPERIMENTAL STUDY OF ICE</p>
            <div
              className="title-wrap"
              onClick={(e) => e.currentTarget.classList.toggle("pulse")}
            >
              <h1 id="hero-title" className="ice-title" data-text="ICE">
                ICE
              </h1>
              <span className="title-clouds">ICE</span>
              <svg
                className="title-cracks"
                viewBox="0 0 800 260"
                aria-hidden="true"
              >
                <path d="M132 8l36 61-21 37 42 57-18 89M405 4l-22 68 42 41-35 54 29 84M682 18l-38 54 25 43-46 58 19 69" />
              </svg>
              <span className="title-reflection" aria-hidden="true">
                ICE
              </span>
            </div>
            <IceSphere quality={quality} />
            <p className="hero-copy">FORMED IN SILENCE. BUILT TO ENDURE.</p>
            <a className="enter" href="#about">
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
              <FrozenObject />
            </Suspense>
          ) : (
            <div className="object-loading">APPROACH TO REVEAL</div>
          )}
        </section>
        <section id="contact" className="ending">
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
