"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import gsap from "gsap";
import FadeUp from "./components/FadeUp";

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
    <main className="relative min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-[140px] rounded-full"></div>
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/5">

        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">

          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight hover:opacity-80 transition"
          >
            GhostSpace
          </Link>

          {/* Center Nav (optional but premium feel) */}
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <Link href="#" className="hover:text-white transition">Product</Link>
            <Link href="#" className="hover:text-white transition">Features</Link>
            <Link href="#" className="hover:text-white transition">Docs</Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">

            {session ? (
              <>
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">

                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      className="w-7 h-7 rounded-full"
                    />
                  )}

                  <span className="text-sm text-zinc-300 hidden sm:block">
                    {session.user?.name}
                  </span>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/api/auth/signin/google"
                className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium hover:scale-105 transition"
              >
                Connect Gmail
              </Link>
            )}

          </div>
        </div>
      </nav>

      <FadeUp>
        {/* HERO */}
        <section className="relative py-40 px-6 text-center overflow-hidden">

          {/* Gradient Glow */}
          <div className="absolute inset-0 flex justify-center">
            <div className="w-[900px] h-[500px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-[160px] rounded-full"></div>
          </div>

          <div className="relative z-10">

            <p className="text-xs text-zinc-500 mb-4 uppercase tracking-[0.2em]">
              Gmail Storage Analyzer
            </p>

            <h1 className="hero-title text-6xl md:text-7xl font-semibold tracking-tight leading-[1.1] max-w-4xl mx-auto">
              Stop Guessing Where Your Storage Went
            </h1>

            <p className="text-zinc-400 hero-sub mt-6 max-w-xl mx-auto text-lg leading-relaxed">
              GhostSpace reveals exactly what’s consuming your Gmail storage —
              from heavy attachments to forgotten emails.
            </p>

            <div className="mt-10 flex gap-4 justify-center flex-wrap">

              <Link
                href="/dashboard"
                className="bg-white text-black px-6 py-3 rounded-2xl font-medium hover:scale-105 transition"
              >
                Analyze Gmail
              </Link>

              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-2xl border border-white/10 hover:bg-white/10 transition"
              >
                Live Demo
              </Link>

            </div>

            <p className="text-zinc-500 text-xs mt-6">
              Read-only access. Your data never leaves your account.
            </p>

          </div>

          {/* Dashboard Preview */}
          <div className="relative mt-24 max-w-6xl mx-auto">
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <img src="/dashboard-preview.png" />
            </div>
          </div>

        </section>
      </FadeUp>
      

      {/* HOW IT WORKS */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-32 px-6 max-w-6xl mx-auto text-center"
      >
        <h2 className="text-4xl font-bold mb-16">
          How GhostSpace Works
        </h2>

        <div className="grid md:grid-cols-4 gap-10">
          {[
            "Connect Gmail",
            "Scan Inbox",
            "Find Heavy Emails",
            "Clean Smarter",
          ].map((step, i) => (
            <div key={i} className="space-y-4">
              <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center">
                {i + 1}
              </div>
              <p className="text-zinc-300">{step}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* FEATURE SECTION 1 */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-32 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center"
      >

        <div>
          <h2 className="text-4xl font-bold">
            Find What’s Wasting Your Storage
          </h2>

          <p className="text-zinc-400 mt-6">
            GhostSpace identifies large attachments and old emails
            that silently consume your storage.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 p-6 bg-white/5">
          <div className="h-40 bg-zinc-800 rounded-xl"></div>
        </div>

      </motion.section>

      {/* FEATURE SECTION 2 */}
      <motion.section 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-32 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center"
      >

        <div className="rounded-3xl border border-white/10 p-6 bg-white/5 order-2 md:order-1">
          <div className="h-40 bg-zinc-800 rounded-xl"></div>
        </div>

        <div className="order-1 md:order-2">
          <h2 className="text-4xl font-bold">
            Clean Your Inbox Smarter
          </h2>

          <p className="text-zinc-400 mt-6">
            Get actionable insights instead of blindly deleting emails.
            Focus on what actually matters.
          </p>
        </div>

      </motion.section>

      {/* CTA */}
      <motion.section 
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-32 text-center relative overflow-hidden"
      >

        <div className="absolute inset-0 flex justify-center">
          <div className="w-[700px] h-[300px] bg-blue-500/20 blur-[140px] rounded-full"></div>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold">
            Start Cleaning Your Gmail Today
          </h2>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="bg-white text-black px-6 py-3 rounded-2xl"
            >
              Get Started
            </Link>
          </div>
        </div>

      </motion.section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 text-center text-zinc-500">
        Built with Next.js + TypeScript • GhostSpace 2026
      </footer>

    </main>
  );
}