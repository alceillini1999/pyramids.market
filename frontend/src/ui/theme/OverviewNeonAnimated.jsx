// src/ui/theme/OverviewNeonAnimated.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * خلفية نيونيّة بأسلوب Pinterest:
 * - Mesh gradient متدفق (5s)
 * - Blobs ضوئية تدور وتتموّج
 * - خطوط/وميض Light Streaks هادئ
 * - Parallax ثلاثي الأبعاد بالماوس (أو حركة تلقائية للموبايل)
 * - احترام prefers-reduced-motion
 * لا تغييرات على وظائفك — غلاف بصري فقط.
 */
export default function OverviewNeonAnimated({ children }) {
  const rootRef = useRef(null);
  const rafRef = useRef(0);
  const autoRef = useRef(0);

  useEffect(() => {
    // Keyframes + طبقات أنيميشن
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes gradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes rotBlobA {
        0% { transform: rotate(0deg) scale(1) }
        50% { transform: rotate(180deg) scale(1.06) }
        100% { transform: rotate(360deg) scale(1) }
      }
      @keyframes rotBlobB {
        0% { transform: rotate(0deg) scale(1.05) }
        50% { transform: rotate(-180deg) scale(0.98) }
        100% { transform: rotate(-360deg) scale(1.05) }
      }
      @keyframes streakDrift {
        0%   { transform: translateX(-10%) skewX(-12deg); opacity:.25 }
        50%  { opacity:.45 }
        100% { transform: translateX(110%) skewX(-12deg); opacity:.25 }
      }
      @keyframes pulseSoft {
        0%,100% { opacity:.5; filter: blur(52px) }
        50%     { opacity:.75; filter: blur(70px) }
      }
      @media (prefers-reduced-motion: reduce) {
        .anim, .parallax-layer { animation: none !important; transition: none !important; }
      }
    `;
    document.head.appendChild(style);

    // Parallax (سطح خفيف) — ماوس على الديسكتوب، حركة تلقائية على الموبايل
    const el = rootRef.current;
    if (!el) return;

    let rect = el.getBoundingClientRect();
    const onResize = () => { rect = el.getBoundingClientRect(); };
    window.addEventListener("resize", onResize);

    const setVars = (rx, ry, tx, ty) => {
      el.style.setProperty("--rx", `${rx}deg`);
      el.style.setProperty("--ry", `${ry}deg`);
      el.style.setProperty("--tx", `${tx}px`);
      el.style.setProperty("--ty", `${ty}px`);
    };

    const onMove = (e) => {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;
      const maxTilt = 7;
      const maxShift = 22;
      const rx = py * -maxTilt;
      const ry = px *  maxTilt;
      const tx = px *  maxShift;
      const ty = py *  maxShift;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setVars(rx, ry, tx, ty));
    };

    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) {
      // حركة تلقائية خفيفة للموبايل
      const tick = () => {
        autoRef.current += 0.03;
        const t = autoRef.current;
        const rx = Math.sin(t) * 3;
        const ry = Math.cos(t * 0.8) * 3;
        const tx = Math.sin(t * 0.7) * 10;
        const ty = Math.cos(t * 0.9) * 10;
        setVars(rx, ry, tx, ty);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      el.addEventListener("mousemove", onMove);
    }

    setVars(0,0,0,0);

    return () => {
      window.removeEventListener("resize", onResize);
      if (!isTouch) el.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
        backgroundColor: "#0B0F14",
      }}
    >
      {/* LAYER -3: Mesh Gradient سريع (5s) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 anim"
        style={{
          transform: "translateZ(-140px) scale(1.25)",
          background:
            "linear-gradient(-45deg, #0B0F14, #0F172A, #0EA5E9, #A855F7, #F59E0B)",
          backgroundSize: "400% 400%",
          animation: "gradientFlow 5s ease-in-out infinite", // ← سرعة 5s
          filter: "saturate(115%)",
        }}
      />

      {/* LAYER -2: Blobs ضوئية تدور وتتموّج */}
      <div aria-hidden className="absolute inset-0 -z-20 pointer-events-none">
        {/* Blob A */}
        <div
          className="anim"
          style={{
            position: "absolute",
            top: "8%",
            left: "10%",
            width: "60vmax",
            height: "60vmax",
            borderRadius: "50%",
            background:
              "radial-gradient(35% 35% at 50% 50%, rgba(34,211,238,0.25), transparent 70%)",
            mixBlendMode: "screen",
            transform: "translateZ(-100px)",
            animation: "rotBlobA 16s linear infinite, pulseSoft 6s ease-in-out infinite",
          }}
        />
        {/* Blob B */}
        <div
          className="anim"
          style={{
            position: "absolute",
            bottom: "6%",
            right: "12%",
            width: "52vmax",
            height: "52vmax",
            borderRadius: "50%",
            background:
              "radial-gradient(35% 35% at 50% 50%, rgba(168,85,247,0.25), transparent 70%)",
            mixBlendMode: "screen",
            transform: "translateZ(-110px)",
            animation: "rotBlobB 20s linear infinite, pulseSoft 7s ease-in-out infinite",
          }}
        />
        {/* Glow خطّي خفيف عبر الوسط */}
        <div
          className="anim"
          style={{
            position: "absolute",
            top: "35%",
            left: "-20%",
            width: "140%",
            height: "14rem",
            background:
              "linear-gradient(90deg, transparent, rgba(242,192,65,0.18), rgba(249,115,22,0.20), rgba(168,85,247,0.18), transparent)",
            filter: "blur(24px)",
            opacity: 0.6,
            transform: "translateZ(-90px) rotate(-2deg)",
          }}
        />
      </div>

      {/* LAYER -1: Light Streaks هادئة تمر كل فترة */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="anim"
            style={{
              position: "absolute",
              top: i === 0 ? "22%" : "68%",
              left: "-10%",
              width: "40%",
              height: "2px",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
              filter: "blur(1px)",
              transform: "translateZ(-80px)",
              animation: `streakDrift ${i === 0 ? 6 : 7.5}s ease-in-out ${i ? "1.5s" : "0s"} infinite`,
              mixBlendMode: "screen",
            }}
          />
        ))}
      </div>

      {/* LAYER 0: محتوى التطبيق مع Parallax */}
      <div
        className="parallax-layer"
        style={{
          transformStyle: "preserve-3d",
          transform:
            "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateX(var(--tx, 0px)) translateY(var(--ty, 0px))",
          transition: "transform 160ms ease",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10"
        >
          {children}
        </motion.div>
      </div>

      {/* LAYER +1: ضجيج فيلمي خفيف */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 opacity-[.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.8'/></svg>\")",
          backgroundSize: "auto",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
