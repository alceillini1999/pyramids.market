import React, { useEffect } from "react";

/** خلفية متحركة + وسم body بكلاس theme-pyramids لتفعيل الثيم بالـCSS */
export default function AppBackground({ children }) {
  useEffect(() => {
    document.body.classList.add("theme-pyramids");
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes gradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes blobA { 0%{transform:rotate(0)} 50%{transform:rotate(180deg)} 100%{transform:rotate(360deg)} }
      @keyframes blobB { 0%{transform:rotate(0)} 50%{transform:rotate(-180deg)} 100%{transform:rotate(-360deg)} }
      @keyframes goldSheen { 0%,100%{opacity:.18;filter:blur(30px)} 50%{opacity:.28;filter:blur(36px)} }
    `;
    document.head.appendChild(style);
    return () => document.body.classList.remove("theme-pyramids");
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "#0B0F14" }}>
      {/* خلفية متدرجة بألوان الشعار (ذهبي/بني) */}
      <div
        className="absolute inset-0 -z-30"
        style={{
          background:
            "linear-gradient(-45deg, #1A120B, #2B1D12, #F2C041, #8B5E3C, #1A120B)",
          backgroundSize: "400% 400%",
          animation: "gradientFlow 5s ease-in-out infinite",
          filter: "saturate(115%) contrast(105%)",
        }}
      />
      {/* Blobs ضوئية */}
      <div aria-hidden className="absolute inset-0 -z-20 pointer-events-none">
        <div style={{
          position:"absolute", top:"10%", left:"6%", width:"60vmax", height:"60vmax", borderRadius:"50%",
          background:"radial-gradient(40% 40% at 50% 50%, rgba(242,192,65,0.18), transparent 70%)",
          mixBlendMode:"screen", animation:"blobA 14s linear infinite",
        }}/>
        <div style={{
          position:"absolute", bottom:"10%", right:"10%", width:"55vmax", height:"55vmax", borderRadius:"50%",
          background:"radial-gradient(40% 40% at 50% 50%, rgba(139,94,60,0.22), transparent 70%)",
          mixBlendMode:"screen", animation:"blobB 18s linear infinite",
        }}/>
      </div>
      {/* لمعة ذهبية أعلى الصفحة */}
      <div aria-hidden className="absolute -z-10 left-1/2 -translate-x-1/2"
        style={{
          top:"-6rem", width:"120vmax", height:"18rem",
          background:"radial-gradient(80% 100% at 50% 100%, rgba(242,192,65,0.30) 0%, rgba(249,115,22,0.12) 40%, transparent 70%)",
          mixBlendMode:"screen", animation:"goldSheen 5.5s ease-in-out infinite", filter:"blur(26px)"
        }}
      />
      {/* محتوى التطبيق كما هو */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
