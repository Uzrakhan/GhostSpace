"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";


export default function Home() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-black text-white">
      
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-6 border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-md bg-black/70">

        {/* Left */}
        <Link href="/" className="text-2xl font-bold tracking-wide hover:opacity-80 transition">
          GhostSpace
        </Link>

        {/* Right */}
        <div className="flex items-center gap-4">

          {session ? (
            <>
              <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl glass">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt="profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}

                <span className="text-sm text-zinc-300">
                  {session.user?.name}
                </span>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="border border-zinc-700 px-4 py-2 rounded-xl hover:bg-zinc-900 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/api/auth/signin/google"
              className="bg-white text-black px-5 py-2 rounded-xl font-medium hover:scale-105 transition"
            >
              Connect Gmail
            </Link>
          )}

        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-28 px-6">
        <p className="text-sm text-zinc-400 mb-4 uppercase tracking-widest">
          Gmail Storage Analyzer
        </p>

        <h2 className="text-5xl md:text-7xl font-bold leading-tight max-w-5xl mx-auto">
          Discover What’s Eating Your Gmail Storage
        </h2>

        <p className="text-zinc-400 mt-6 max-w-2xl mx-auto text-lg">
          Safely analyze your inbox with read-only access.
          Find large emails, old attachments, and hidden storage waste.
        </p>

        <div className="mt-10 flex gap-4 justify-center flex-wrap">
          <Link
            href="/dashboard"
            className="bg-white text-black px-6 py-3 rounded-2xl font-semibold hover:scale-105 transition"
          >
            Get Started
          </Link>

          <Link
            href="/dashboard"
            className="border border-zinc-700 px-6 py-3 rounded-2xl hover:bg-zinc-900 transition"
          >
            See Demo
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid md:grid-cols-3 gap-6 px-8 pb-24 max-w-6xl mx-auto">
        <div className="glass glow p-8 rounded-3xl">
          <p className="text-zinc-400">Emails Scanned</p>
          <h3 className="text-4xl font-bold mt-3">8,241</h3>
        </div>

        <div className="glass glow p-8 rounded-3xl">
          <p className="text-zinc-400">Heavy Attachments</p>
          <h3 className="text-4xl font-bold mt-3">124</h3>
        </div>

        <div className="glass glow p-8 rounded-3xl">
          <p className="text-zinc-400">Recoverable Space</p>
          <h3 className="text-4xl font-bold mt-3">6.7 GB</h3>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 pb-24 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-14">
          Why GhostSpace?
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="glass glow p-8 rounded-3xl">
            <h3 className="text-xl font-semibold mb-3">Read-Only Safe Access</h3>
            <p className="text-zinc-400">
              Connect Gmail securely without modifying or deleting any email.
            </p>
          </div>

          <div className="glass glow p-8 rounded-3xl">
            <h3 className="text-xl font-semibold mb-3">Find Heavy Emails</h3>
            <p className="text-zinc-400">
              Detect attachments and emails consuming most of your storage.
            </p>
          </div>

          <div className="glass glow p-8 rounded-3xl">
            <h3 className="text-xl font-semibold mb-3">Cleanup Insights</h3>
            <p className="text-zinc-400">
              Smart suggestions to reclaim space manually and safely.
            </p>
          </div>

        </div>
      </section>

      <footer className="border-t border-zinc-800 py-8 text-center text-zinc-500">
        Built with Next.js + TypeScript • GhostSpace 2026
      </footer>
    </main>
  );
}