"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);

  return (
    <main
      className="gs-mono"
      style={{
        fontFamily: "'DM Mono', monospace",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "#050816",
        color: "white",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        .gs-syne { font-family: 'Syne', sans-serif; }
        .gs-mono { font-family: 'DM Mono', monospace; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden !important; }
      `}</style>

      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          pointerEvents: "none",
        }}
      />

      {/* Glow blob */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
        style={{
          position: "absolute",
          top: -250,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Noise overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.015,
          mixBlendMode: "soft-light",
          backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
          pointerEvents: "none",
        }}
      />

      {/* Main grid layout */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          height: "100vh",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          overflow: "hidden",
        }}
      >
        {/* LEFT SIDE */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 2.5rem",
            maxWidth: 720,
            margin: "0 auto",
            width: "100%",
            height: "100%",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p
              className="gs-mono"
              style={{
                fontSize: 8,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#52525b",
                marginBottom: "0.5rem",
              }}
            >
              Intelligent Google Storage Analytics
            </p>

            <h1
              className="gs-syne"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
              }}
            >
              Reclaim your
              <br />
              <span style={{ color: "rgba(255,255,255,0.6)" }}>
                Google storage
              </span>
              <br />
              intelligently.
            </h1>

            <p
              style={{
                color: "#a1a1aa",
                fontSize: "clamp(0.7rem, 1vw, 0.82rem)",
                lineHeight: 1.5,
                marginTop: "0.75rem",
                maxWidth: 420,
              }}
            >
              GhostSpace analyzes Gmail and Google Drive to uncover hidden
              storage waste, large attachments, forgotten files, and cleanup
              opportunities in real time.
            </p>
          </motion.div>

          {/* Floating stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.4rem",
              marginTop: "0.5rem",
              maxWidth: 360,
            }}
          >
            {[
              { label: "Recoverable", value: "4.7 GB" },
              { label: "Large Files", value: "312" },
              { label: "Storage Used", value: "83%" },
              { label: "Drive Waste", value: "2.1 GB" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                whileHover={{ y: -4 }}
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.02)",
                  backdropFilter: "blur(20px)",
                  borderRadius: 12,
                  padding: "0.55rem 0.8rem",
                }}
              >
                <p
                  className="gs-mono"
                  style={{
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: "#52525b",
                  }}
                >
                  {item.label}
                </p>
                <h2
                  className="gs-syne"
                  style={{ fontSize: "clamp(1rem, 2vw, 1.35rem)", marginTop: "0.25rem" }}
                >
                  {item.value}
                </h2>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: "1.5rem 2rem 1.5rem 0",
          }}
        >
          {/* Outer ring glow */}
          <motion.div
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 5, repeat: Infinity }}
            style={{
              position: "absolute",
              width: 460,
              height: "80vh",
              maxHeight: 580,
              borderRadius: 40,
              border: "1px solid rgba(255,255,255,0.05)",
              pointerEvents: "none",
            }}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 340,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(40px)",
              borderRadius: 22,
              padding: "1.25rem",
              overflow: "hidden",
            }}
          >
            {/* Scan line */}
            <motion.div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 80,
                background:
                  "linear-gradient(to bottom, transparent, rgba(255,255,255,0.04), transparent)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 10 }}>
              <p
                className="gs-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "#52525b",
                  marginBottom: "0.5rem",
                }}
              >
                GhostSpace
              </p>

              <h2
                className="gs-syne"
                style={{
                  fontSize: "clamp(1.4rem, 2.8vw, 1.9rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                Connect your
                <br />
                Google account
              </h2>

              <p
                style={{
                  color: "#a1a1aa",
                  lineHeight: 1.6,
                  marginTop: "0.5rem",
                  fontSize: "clamp(0.8rem, 1.1vw, 0.92rem)",
                }}
              >
                Securely analyze Gmail and Drive storage without storing your
                emails or files.
              </p>

              {/* Features */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.35rem",
                  marginTop: "0.75rem",
                }}
              >
                {[
                  "Gmail Analysis",
                  "Drive Insights",
                  "Large Attachments",
                  "Recovery Engine",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 12,
                      padding: "0.4rem 0.65rem",
                    }}
                  >
                    <p style={{ fontSize: "0.65rem", color: "#d4d4d8" }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              {/* Button */}
              <motion.button
                onClick={async () => {
                  setLoading(true);
                  await signIn("google", { callbackUrl: "/dashboard" });
                }}
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                style={{
                  position: "relative",
                  width: "100%",
                  marginTop: "0.75rem",
                  height: 42,
                  borderRadius: 12,
                  background: "white",
                  color: "black",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        border: "2px solid rgba(0,0,0,0.3)",
                        borderTop: "2px solid black",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path
                        fill="#FFC107"
                        d="M43.611 20.083H42V20H24v8h11.303C33.659 32.657 29.252 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.306 14.691l6.571 4.819C14.655 15.108 19.000 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </motion.button>

              <p
                style={{
                  fontSize: "0.65rem",
                  color: "#52525b",
                  marginTop: "0.5rem",
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                GhostSpace never stores your emails, attachments, or Drive
                files.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}