// src/ui/theme/OverviewNeonAnimated.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

/**
 * خلفية نيونية ثلاثية الأبعاد:
 * - طبقات عميقة مع translateZ لمحاكاة العمق
 * - Parallax بتحريك الماوس
 * - تدرجات متحركة + دوران بطيء + ضجيج خفيف
 * - يحترم prefers-reduced-motion
 * لا تغييرات على أي وظائف — مجرد غلاف بصري.
 */
export default function OverviewNeonAnimated({ children }) {
  const rootRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    // Keyframes و متغيرات CSS
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes gradientMove {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes spinSlow {
        0% { transform: rotate(0deg) translateZ(-150px); }
        100% { transform: rotate(360deg) translateZ(-150px); }
      }
      @keyframes floatPulse {
        0%,100% { opacity: .45; filter: blur(50px); }
        50%     { opacity: .7;  filter: blur(70px); }
      }
      @media (prefers-reduced-motion: reduce) {
        .anim-3d, .anim-parallax, .anim-spin, .anim-gradient, .anim-float {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Parallax بالماوس
    const el = rootRef.current;
    if (!el) return;

    const bounds = () => el.getBoundingClientRect();
    let rect = bounds();

    const onResize = () => { rect = bounds(); };
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
      const px = (x / rect.width) - 0.5;   // -0.5 .. 0.5
      const py = (y / rect.height) - 0.5;

      // زوايا ميل خفيفة + إزاحة طبقات
      const maxTilt = 7;       // درجات
      const maxShift = 24;     // بكسل
      const rx = (+py * -maxTilt);
      const ry = (+px *  maxTilt);
      const tx = (+px *  maxShift);
      const ty = (+py *  maxShift);

      // سموذنج عبر rAF
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => setVars(rx, ry, tx, ty));
    };

    // تعطيل على اللمس (موبايل): سنضبط حركة تلقائية خفيفة
    let autoT = 0, autoRAF = 0;
    const prefersTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const autoTick = () => {
      autoT += 0.02;
      const rx = Math.sin(autoT) * 3;
      const ry = Math.cos(autoT * 0.8) * 3;
      const tx = Math.sin(autoT * 0.7) * 10;
      const ty = Math.cos(autoT * 0.9) * 10;
      setVars(rx, ry, tx, ty);
      autoRAF = requestAnimationFrame(autoTick);
    };

    if (prefersTouch) {
      autoRAF = requestAnimationFrame(autoTick);
    } else {
      el.addEventListener("mousemove", onMove);
    }

    // قيم ابتدائية
    setVars(0, 0, 0, 0);

    return () => {
      window.removeEventListener("resize", onResize);
      if (!prefersTouch) el.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frameRef.current);
      cancelAnimationFrame(autoRAF);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        // منظور ثلاثي أبعاد
        perspective: "1000px",
        transformStyle: "preserve-3d",
        // fallback خلفية داكنة
        backgroundColor: "#0B0F14",
      }}
    >
      {/* --- LAYER -3: Mesh Gradient واسع بتحريك موقع الخلفية --- */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 anim-gradient"
        style={{
          transform: "translateZ(-120px) scale(1.2)",
          background:
            "radial-gradient(60% 60% at 15% 20%, rgba(242,192,65,0.18) 0%, transparent 70%)," + // gold
            "radial-gradient(50% 50% at 85% 15%, rgba(34,211,238,0.16) 0%, transparent 65%)," +  // cyan
            "radial-gradient(40% 40% at 80% 75%, rgba(168,85,247,0.14) 0%, transparent 65%)," +  // violet
            "linear-gradient(120deg, #0b0f14 0%, #0f172a 50%, #0b0f14 100%)",
          backgroundSize: "200% 200%",
          animation: "gradientMove 8s ease-in-out infinite",
          filter: "saturate(120%)",
        }}
      />

      {/* --- LAYER -2: قرص ضوء يدور ببطء (Glow Disc) --- */}
      <div
        aria-hidden
        className="absolute -z-10 anim-spin"
        style={{
          top: "10%",
          left: "50%",
          width: "120vmax",
          height: "120vmax",
          marginLeft: "-60vmax",
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, rgba(34,211,238,0.08), rgba(168,85,247,0.12), rgba(249,115,22,0.10), rgba(34,211,238,0.08))",
          transformStyle: "preserve-3d",
          transform: "translateZ(-150px)",
          animation: "spinSlow 60s linear infinite",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* --- LAYER -1: لطخات ضوء ناعمة تطفو --- */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 anim-float"
        style={{
          transform: "translateZ(-60px)",
          background:
            "radial-gradient(36vmax 24vmax at 20% 70%, rgba(249,115,22,0.15), transparent 70%)," + // orange
            "radial-gradient(30vmax 20vmax at 80% 30%, rgba(168,85,247,0.20), transparent 70%)",
          animation: "floatPulse 6s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* --- LAYER 0: مجموعة الطبقات التي ستُحرّك بالـ tilt/parallax --- */}
      <div
        className="anim-parallax"
        style={{
          transformStyle: "preserve-3d",
          transform:
            "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateX(var(--tx, 0px)) translateY(var(--ty, 0px))",
          transition: "transform 180ms ease",
        }}
      >
        {/* محتوى التطبيق */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {children}
        </motion.div>
      </div>

      {/* --- LAYER +1: ضجيج خفيف لزيادة الواقعية --- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 opacity-[.07]"
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
