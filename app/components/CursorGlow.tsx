"use client";
import { useEffect } from "react";

export default function CursorGlow() {
  useEffect(() => {
    const glow = document.createElement("div");
    glow.style.position = "fixed";
    glow.style.width = "300px";
    glow.style.height = "300px";
    glow.style.borderRadius = "50%";
    glow.style.pointerEvents = "none";
    glow.style.background = "radial-gradient(circle, rgba(255,255,255,0.08), transparent)";
    glow.style.filter = "blur(60px)";
    glow.style.zIndex = "0";

    document.body.appendChild(glow);

    window.addEventListener("mousemove", (e) => {
      glow.style.left = `${e.clientX - 150}px`;
      glow.style.top = `${e.clientY - 150}px`;
    });
  }, []);

  return null;
}