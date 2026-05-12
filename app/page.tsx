"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import gsap from "gsap";
import FadeUp from "./components/FadeUp";

function GlitchText({ children }: { children: string }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => {
      setActive(true);
      setTimeout(() => setActive(false), 160);
    }, 4000 + Math.random() * 2000);
  },[]);

  return (
    <span className="relative inline-block">
      <span className="relative z-10">
        {children}
      </span>
      {active && (
        <>
          <span
            className="absolute inset-0 text-red-400/60"
            style={{ clipPath: "inset(40% 0 50%)", transform: "translate(-2px 0)" }}
            aria-hidden
          >
            {children}
          </span>
          <span
            className="absolute inset-0 text-blue-400/60"
            style={{ clipPath: "inset(10% 0 80% 0)", transform: "translate(2px,0)" }}
            aria-hidden
          >
            {children}
          </span>
        </>
      )}
    </span>
  )
}

const TICKERS = [
  "127 GB RECLAIMED TODAY","2.4M EMAILS ANALYZED",
  "ZERO DATA LEAVES YOUR ACCOUNT","READ-ONLY ACCESS","GMAIL + DRIVE COVERAGE",
];

function TickerBar() {
  const items = ["127 GB RECLAIMED TODAY","2.4M EMAILS ANALYZED","ZERO DATA LEAVES YOUR ACCOUNT","READ-ONLY ACCESS","GMAIL + DRIVE COVERAGE","INSTANT SCAN ENGINE"];
  return (
    <div className="overflow-hidden birder-b border-white/6 py-2.5 bg-white/1">
      <motion.div
        className="flex gap-14 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((t, i) => (
          <span key={i} style={{ fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:"0.28em", textTransform:"uppercase", color:"#444" }}>
            <span style={{ color:"rgba(255,255,255,0.12)", marginRight:14 }}>◆</span>{t}
          </span>
        ))}
      </motion.div>
    </div>
  )
}


function StorageViz() {
  const bars = [
    { label: "Google Photos", pct: 78 },
    { label: "Drive Files", pct: 52 },
    { label: "Gmail", pct: 24 },
    { label: "Spam", pct: 8 },
  ];

  return (
    <div className="space-y-5">
      {bars.map((b) => (
        <div key={b.label}>
          <div className="flex justify-between mb-2">
            <span>{b.label}</span>
            <span>{b.pct}%</span>
          </div>

          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${b.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}


// DOT GRID BG
function GridBg() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute inset-0" style={{ background:"radial-gradient(ellipse at center, transparent 20%, #080808 80%)" }}/>
    </div>
  )
}


//CRT SCANLINES
function ScanLines() {
  return (
    <div className="pointer-events-none  z-50 fixed inset-0 z-50 opacity-[0.06]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px , rgba(255,255,255,0.1) 4px)" }} />
  )
}



export default function Home() {
  const { data: session } = useSession();

  useEffect(() => {
    gsap.from(".hero-title", {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power3.out",
    });

    gsap.from(".hero-sub", {
      opacity: 0,
      y: 30,
      delay: 0.2,
      duration: 1,
    });

    gsap.from(".hero-buttons", {
      opacity: 0,
      y: 20,
      delay: 0.4,
      duration: 1,
    });
  }, []);

  return (
    <main className="relative min-h-screen text-white overflow-hidden" style={{ backgroundColor:"#080808" }}>


      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        .gs-syne  { font-family: 'Syne', sans-serif; }
        .gs-mono  { font-family: 'DM Mono', monospace; }
      `}</style>

      <ScanLines />
      <GridBg />
        
      {/* subtle ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] rounded-full"
        style={{ background:"radial-gradient(circle, rgba(255,255,255,0.035) 0%, transparent 70%)" }}/>

      {/**NAVBAR */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.06]"
        style={{ backdropFilter:"blur(20px)", backgroundColor:"rgba(8,8,8,0.88)" }}>

          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-14 flex justify-between items-center">
            <Link href="/" className="gs-mono text-sm font-medium text-white/90 hover:text-white transition">
              GhostSpace <span>_</span>
            </Link>


            <div className="hidden md:flex items-center gap-8 gs-mono text-[11px] text-zinc-600 tracking-[0.12em] uppercase">
              <Link href="#" className="hover:text-white/60 transition">
                Product
              </Link>
              <Link href="#" className="hover:text-white/60 transition">
                Features
              </Link>
              <Link href="#" className="hover:text-white/60 transition">
                Docs
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {session ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-1.5 border border-white/[0.08] rounded-md">
                  {session.user?.image && (
                    <img src={session.user.image} className="w-5 h-5 rounded-full grayscale" />
                  )}
                  <span className="gs-mono text-[11px] text-zinc-400 hidden sm:block">{session.user?.name}</span>
                </div>
                <button onClick={() => signOut({ callbackUrl:"/" })}
                  className="gs-mono text-[11px] px-3 py-1.5 border border-white/[0.08] rounded-md text-zinc-600 hover:text-white/70 hover:border-white/20 transition">
                  Sign out
                </button>
              </>
              ) : (
                <Link href="/api/auth/signin/google"
                  className="gs-mono text-[11px] px-4 py-1.5 bg-white text-black rounded-md font-medium hover:bg-zinc-200 transition">
                  Connect Google Account →
                </Link>
              )}
            </div>
          </div>
      </nav>

      <TickerBar />

      <FadeUp>
        {/**HERO */}
        <section className="relative py-36 px-6 text-center overflow-hidden">
          <div className="relative z-10">

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="gs-mono text-[10px] tracking-[0.35em] text-zinc-600 uppercase mb-8 flex items-center justify-center gap-3"
            >
              <span className="inline-block w-5 h-px bg-zinc-800" />
                Google Storage Intelligence
              <span className="inline-block w-5 h-px bg-zinc-800"/>
            </motion.div>


            <h1 className="hero-title gs-syne text-5xl md:text-7xl font-bold tracking-[-0.03em] leading-[1.02] max-w-4xl mx-auto">
              <GlitchText>Your google storage</GlitchText><br/>
              <span className="text-white/20">is silently filling up.</span><br/>
              <span className="text-white">Ghostspace shows why.</span>
            </h1>


            <p className="hero-sub gs-mono mt-7 max-w-md mx-auto text-[13px] text-zinc-500 leading-relaxed">
              GhostSpace analyzes Gmail, Google Drive, and soon Google Photos
              to uncover what’s actually consuming your storage.
            </p>


            <div className="hero-buttons mt-10 flex gap-4 justify-center flex-wrap">
              <Link 
                href={session ? "/dashboard" : "/api/auth/signin/google"}
                className="gs-syne bg-white text-black px-6 py-3 rounded-md text-sm font-bold hover:bg-zinc-200 transition"
              >
                Analyze Storage
              </Link>
            </div>

            <p className="gs-mono text-zinc-700 text-[10px] mt-5 tracking-[0.2em] uppercase">
              Read-only access · Your data never leaves your account
            </p>
          </div>

          {/* dashboard preview — your original image */}
          <div className="relative mt-24 max-w-6xl mx-auto">
            <div className="rounded-xl overflow-hidden border border-white/[0.07] shadow-2xl">
              <img src="/dashboard-preview.png" className="w-full"/>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* ── HOW IT WORKS ── */}
      <motion.section
        initial={{ opacity:0, y:60 }} whileInView={{ opacity:1, y:0 }}
        transition={{ duration:0.8 }} viewport={{ once:true }}
        className="border-t border-white/[0.06] py-28 px-6 max-w-6xl mx-auto text-center">
 
        <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.3em] uppercase mb-14">How GhostSpace Works</p>
 
        <div className="grid md:grid-cols-4 gap-0 border border-white/[0.06] rounded-xl overflow-hidden">
          {["Connect Gmail","Scan Inbox","Find Heavy Emails","Clean Smarter"].map((step, i) => (
            <div key={i} className="px-6 py-8 border-r border-white/[0.06] last:border-r-0 hover:bg-white/[0.02] transition">
              <div className="gs-mono text-[10px] text-zinc-700 tracking-[0.2em] mb-4">0{i+1}</div>
              <p className="gs-syne text-sm font-bold text-white/80">{step}</p>
            </div>
          ))}
        </div>
      </motion.section>
 
      {/* ── FEATURE 1 ── */}
      <motion.section
        initial={{ opacity:0, y:60 }} whileInView={{ opacity:1, y:0 }}
        transition={{ duration:0.8 }} viewport={{ once:true }}
        className="border-t border-white/[0.06] py-28 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
 
        <div>
          <span className="gs-mono text-[10px] text-zinc-600 tracking-[0.25em] uppercase">Feature 01</span>
          <h2 className="gs-syne text-4xl font-bold mt-4 leading-tight">
            Unified Storage Analysis
          </h2>
          <p className="gs-mono text-[12px] text-zinc-500 mt-5 leading-relaxed">
            Analyze Gmail, Drive, and Google Photos
            from one intelligent dashboard.
          </p>
        </div>
 
        <div className="rounded-xl border border-white/[0.07] p-6 bg-white/[0.015]">
          <StorageViz />
        </div>
      </motion.section>

      {/* ── FEATURE 2 ── */}
      <motion.section
        initial={{ opacity:0, y:60 }} whileInView={{ opacity:1, y:0 }}
        transition={{ duration:0.8 }} viewport={{ once:true }}
        className="border-t border-white/[0.06] py-28 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
 
        <div className="rounded-xl border border-white/[0.07] p-6 bg-white/[0.015] order-2 md:order-1">
          <div className="rounded-xl border border-white/[0.07] p-6 bg-white/[0.015] order-2 md:order-1">
            <div className="space-y-4">

              {[
                {
                  title: "VacationVideos.zip",
                  size: "2.4 GB",
                  type: "Drive Archive"
                },
                {
                  title: "Udemy Course Attachments",
                  size: "840 MB",
                  type: "Promotions"
                },
                {
                  title: "IMG_4829.MOV",
                  size: "1.2 GB",
                  type: "Google Photos"
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/[0.03] border border-white/[0.05]
                  rounded-xl p-4 flex justify-between items-center"
                >

                  <div>
                    <p className="text-sm font-medium text-white">
                      {item.title}
                    </p>

                    <p className="text-xs text-zinc-500 mt-1">
                      {item.type}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {item.size}
                    </p>

                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                      reclaimable
                    </p>
                  </div>

                </motion.div>
              ))}

            </div>
          </div>
        </div>
 
        <div className="order-1 md:order-2">
          <span className="gs-mono text-[10px] text-zinc-600 tracking-[0.25em] uppercase">Feature 02</span>
          <h2 className="gs-syne text-4xl font-bold mt-4 leading-tight">
            Find Your Biggest Storage Killers
          </h2>
          <p className="gs-mono text-[12px] text-zinc-500 mt-5 leading-relaxed">
            Detect large emails, videos, ZIPs,
            duplicates, and forgotten files instantly.
          </p>
        </div>
      </motion.section>

      {/* ── FEATURE 3 ── */}
      <motion.section
        initial={{ opacity:0, y:60 }} whileInView={{ opacity:1, y:0 }}
        transition={{ duration:0.8 }} viewport={{ once:true }}
        className="border-t border-white/[0.06] py-28 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
 
        <div className="rounded-xl border border-white/[0.07] p-6 bg-white/[0.015] order-2 md:order-1">
          <div className="rounded-xl border border-white/[0.07] p-6 bg-white/[0.015] order-2 md:order-1">
            <div className="space-y-4">

              {[
                "Delete 4 old ZIP archives to recover 3.2 GB",
                "Clear Promotions emails older than 1 year",
                "Remove duplicate screenshots from Drive",
                "Empty Spam folder to recover 280 MB",
              ].map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 border border-white/[0.05]
                  rounded-xl p-4 bg-white/[0.02]"
                >

                  <div className="w-2 h-2 rounded-full bg-white mt-2" />

                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {tip}
                  </p>

                </motion.div>
              ))}

            </div>
          </div>
        </div>
 
        <div className="order-1 md:order-2">
          <span className="gs-mono text-[10px] text-zinc-600 tracking-[0.25em] uppercase">Feature 03</span>
          <h2 className="gs-syne text-4xl font-bold mt-4 leading-tight">
            AI Cleanup Recommendations
          </h2>
          <p className="gs-mono text-[12px] text-zinc-500 mt-5 leading-relaxed">
            GhostSpace prioritizes what to delete first
            to maximize recovered storage safely.
          </p>
        </div>
      </motion.section>


      {/* ── CTA ── */}
      <motion.section
        initial={{ opacity:0, y:60 }} whileInView={{ opacity:1, y:0 }}
        transition={{ duration:0.8 }} viewport={{ once:true }}
        className="border-t border-white/[0.06] relative overflow-hidden">
 
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:"radial-gradient(ellipse at 50% 120%, rgba(255,255,255,0.025) 0%, transparent 70%)" }}/>
 
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-32 flex flex-col md:flex-row items-start md:items-end justify-between gap-10 relative">
          <div>
            <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.3em] uppercase mb-5">Start for free</p>
            <h2 className="gs-syne text-4xl md:text-5xl font-bold leading-tight max-w-lg">
              Take Control of Your Google Storage
            </h2>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <Link href="/dashboard"
              className="gs-syne px-7 py-3.5 bg-white text-black text-sm font-bold rounded-md hover:bg-zinc-200 transition">
              Get Started
            </Link>
            <p className="gs-mono text-[10px] text-zinc-700 text-center tracking-[0.1em]">No data stored. No credit card.</p>
          </div>
        </div>
      </motion.section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-6 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="gs-mono text-[11px] text-zinc-700">Built with Next.js + TypeScript · GhostSpace 2026</span>
        </div>
      </footer>


    </main>
  );
}