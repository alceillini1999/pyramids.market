import React from "react";


/**
* Full-screen animated gradient (logo colors: Navy/Brown/Gold)
* Sits behind everything, independent from page backgrounds.
*/
export default function AppBackground({ children }) {
return (
<div className="relative min-h-screen">
{/* Animated gradient layer */}
<div
aria-hidden
className="pointer-events-none fixed inset-0 -z-10"
style={{
background:
"linear-gradient(-45deg, #0A1931 0%, #1E3A8A 18%, #6B4A2B 38%, #B08946 58%, #D4AF37 78%, #F4C95D 100%)",
backgroundSize: "300% 300%",
animation: "brandGradient 16s ease-in-out infinite",
filter: "saturate(1.05)",
}}
/>
{children}
</div>
);
}