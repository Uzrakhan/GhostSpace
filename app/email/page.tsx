"use client";
 
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";

// ─── Types ────────────────────────────────────────────────
type Attachment = {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  partId: string;
};
 
type EmailDetail = {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  size: number;
  attachments: Attachment[];
};
 
// ─── Helpers ──────────────────────────────────────────────
function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb > 1024) return (mb / 1024).toFixed(2) + " GB";
  return mb.toFixed(2) + " MB";
}
 
function decodeBase64(data: string) {
  try {
    return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return "";
  }
}
 
function extractBody(payload: any): string {
  if (!payload) return "";
 
  // Single part
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }
 
  // Multipart — prefer text/html, fallback to text/plain
  if (payload.parts) {
    const htmlPart = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) return decodeBase64(htmlPart.body.data);
 
    const textPart = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (textPart?.body?.data) return decodeBase64(textPart.body.data);
 
    // Nested multipart
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }
 
  return "";
}
 
function extractAttachments(payload: any, attachments: Attachment[] = []): Attachment[] {
  if (!payload) return attachments;
 
  if (payload.filename && payload.body?.attachmentId) {
    attachments.push({
      filename: payload.filename,
      mimeType: payload.mimeType,
      size: payload.body.size || 0,
      attachmentId: payload.body.attachmentId,
      partId: payload.partId || "",
    });
  }
 
  if (payload.parts) {
    for (const part of payload.parts) {
      extractAttachments(part, attachments);
    }
  }
 
  return attachments;
}
 
function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return "IMG";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "ZIP";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOC";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "PPT";
  if (mimeType.includes("video")) return "VID";
  if (mimeType.includes("audio")) return "AUD";
  return "FILE";
}
 
function fileIconColor(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "rgba(96,165,250,0.15)";
  if (mimeType.includes("pdf")) return "rgba(248,113,113,0.15)";
  if (mimeType.includes("zip")) return "rgba(251,191,36,0.15)";
  if (mimeType.includes("word") || mimeType.includes("document")) return "rgba(96,165,250,0.15)";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "rgba(52,211,153,0.15)";
  if (mimeType.includes("video")) return "rgba(167,139,250,0.15)";
  return "rgba(255,255,255,0.06)";
}
 
// ─── Scanlines ────────────────────────────────────────────
function Scanlines() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.018]"
      style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px)" }} />
  );
}
 
// ─── GridBg ───────────────────────────────────────────────
function GridBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="vgrid" width="70" height="70" patternUnits="userSpaceOnUse">
            <path d="M 70 0 L 0 0 0 70" fill="none" stroke="rgba(255,255,255,0.022)" strokeWidth="1" strokeDasharray="3 8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vgrid)" />
      </svg>
    </div>
  );
}
 
// ─── Attachment card ──────────────────────────────────────
function AttachmentCard({ attachment, onDownload }: { attachment: Attachment; onDownload: (a: Attachment) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group cursor-pointer"
      onClick={() => onDownload(attachment)}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: fileIconColor(attachment.mimeType) }}
      >
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.5)", letterSpacing: "0.05em" }}>
          {fileIcon(attachment.mimeType)}
        </span>
      </div>
 
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="gs-syne text-sm font-bold text-white/80 truncate">{attachment.filename}</p>
        <p className="gs-mono text-[10px] text-zinc-600 mt-0.5">{formatSize(attachment.size)}</p>
      </div>
 
      {/* Download arrow */}
      <span className="gs-mono text-[11px] text-zinc-700 group-hover:text-white/50 transition">↓</span>
    </motion.div>
  );
}
 
// ─── Main component ───────────────────────────────────────
function EmailContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailId = searchParams.get("id");
 
  const [email, setEmail] = useState<EmailDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trashing, setTrashing] = useState(false);
  const [trashed, setTrashed] = useState(false);
  const [bodyMode, setBodyMode] = useState<"html" | "text">("html");
  const [toast, setToast] = useState<string | null>(null);


  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  

  //cache
  useEffect(() => {
    const cached = sessionStorage.getItem("email-preview");

    if(cached) {
      setEmail(JSON.parse(cached));
      setLoading(false)
    }
  },[]);
 
  // ── Fetch email detail ──
  useEffect(() => {
    if (!session?.accessToken || !emailId) return;
 
    const fetchEmail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } }
        );
        if (!res.ok) throw new Error("Failed to fetch email");
        const data = await res.json();
 
        const headers = data.payload?.headers || [];
        const get = (name: string) => headers.find((h: any) => h.name === name)?.value || "";
 
        const body = extractBody(data.payload);
        const attachments = extractAttachments(data.payload);
 
        setEmail({
          id: data.id,
          subject: get("Subject") || "(no subject)",
          from: get("From"),
          to: get("To"),
          date: new Date(get("Date")).toLocaleString(),
          body,
          size: data.sizeEstimate || 0,
          attachments,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load email");
      } finally {
        setLoading(false);
      }
    };
 
    fetchEmail();
  }, [session, emailId]);
 
  // ── Trash email ──
  const handleTrash = async () => {
    if (!session?.accessToken || !email) return;
    setTrashing(true);
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}/trash`,
        { method: "POST", headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      if (!res.ok) throw new Error("Failed to trash");
      setTrashed(true);
      showToast("Email moved to trash");
      setTimeout(() => router.back(), 1800);
    } catch {
      showToast("Failed to move to trash");
    } finally {
      setTrashing(false);
    }
  };
 
  // ── Download attachment ──
  const handleDownloadAttachment = async (attachment: Attachment) => {
    if (!session?.accessToken || !email) return;
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}/attachments/${attachment.attachmentId}`,
        { headers: { Authorization: `Bearer ${session.accessToken}` } }
      );
      const data = await res.json();
      const bytes = decodeBase64(data.data);
      const blob = new Blob([bytes], { type: attachment.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Failed to download attachment");
    }
  };
 
  return (
    <main className="relative min-h-screen text-white" style={{ backgroundColor: "#080808" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        .gs-syne { font-family: 'Syne', sans-serif; }
        .gs-mono { font-family: 'DM Mono', monospace; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        .email-body img { max-width: 100%; height: auto; border-radius: 6px; }
        .email-body a { color: rgba(255,255,255,0.6); }
        .email-body p { margin-bottom: 0.75em; }
      `}</style>
 
      <Scanlines />
      <GridBg />
 
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 gs-mono text-[11px] px-5 py-3 rounded-md border border-white/15 bg-black text-white shadow-2xl whitespace-nowrap">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
 
      {/* ── TOP BAR ── */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] h-12 flex items-center px-6 lg:px-8"
        style={{ backdropFilter: "blur(20px)", backgroundColor: "rgba(8,8,8,0.92)" }}>
        <button onClick={() => router.back()}
          className="gs-mono text-[11px] text-zinc-600 hover:text-white/70 transition flex items-center gap-1.5">
          ← Back
        </button>
        <div className="flex-1" />
        <span className="gs-mono text-[10px] text-zinc-700 tracking-[0.25em] uppercase">Email viewer</span>
        <div className="flex-1" />
        {email && !trashed && (
          <button onClick={handleTrash} disabled={trashing}
            className="gs-mono text-[10px] px-3 py-1.5 border border-red-500/20 text-red-400/70 rounded-md hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-40">
            {trashing ? "Moving…" : "Trash email"}
          </button>
        )}
        {trashed && (
          <span className="gs-mono text-[10px] text-zinc-600">Moved to trash</span>
        )}
      </div>
 
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 py-10">
 
        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1 h-5 bg-white/20 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
 
        {/* ── Error ── */}
        {error && !loading && (
          <div className="text-center py-32">
            <p className="gs-mono text-[12px] text-zinc-600">{error}</p>
            <button onClick={() => router.back()}
              className="gs-mono text-[11px] text-white/40 hover:text-white/70 mt-4 transition">
              ← Go back
            </button>
          </div>
        )}
 
        {/* ── Email content ── */}
        {email && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
 
            {/* Header card */}
            <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015] mb-4">
 
              {/* Subject */}
              <h1 className="gs-syne text-2xl font-bold text-white/90 leading-tight mb-5">
                {email.subject}
              </h1>
 
              {/* Meta row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.15em] uppercase mb-1">From</p>
                  <p className="gs-mono text-[12px] text-zinc-300 truncate">{email.from}</p>
                </div>
                <div>
                  <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.15em] uppercase mb-1">To</p>
                  <p className="gs-mono text-[12px] text-zinc-300 truncate">{email.to}</p>
                </div>
                <div>
                  <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.15em] uppercase mb-1">Date</p>
                  <p className="gs-mono text-[12px] text-zinc-300">{email.date}</p>
                </div>
                <div>
                  <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.15em] uppercase mb-1">Size</p>
                  <p className="gs-mono text-[12px] text-white/70 font-medium">{formatSize(email.size)}</p>
                </div>
              </div>
 
              {/* Divider + actions */}
              <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {email.attachments.length > 0 && (
                    <span className="gs-mono text-[10px] text-zinc-600">
                      {email.attachments.length} attachment{email.attachments.length !== 1 ? "s" : ""}
                      {" · "}{formatSize(email.attachments.reduce((s, a) => s + a.size, 0))} total
                    </span>
                  )}
                </div>
 
                {/* Body mode toggle — only show if we have a body */}
                {email.body && (
                  <div className="flex items-center gap-1 border border-white/[0.07] rounded-md overflow-hidden">
                    {(["html", "text"] as const).map((mode) => (
                      <button key={mode}
                        onClick={() => setBodyMode(mode)}
                        className={`gs-mono text-[10px] px-3 py-1.5 transition-colors ${
                          bodyMode === mode ? "bg-white/10 text-white/80" : "text-zinc-600 hover:text-zinc-400"
                        }`}>
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
 
            {/* ── Attachments ── */}
            {email.attachments.length > 0 && (
              <div className="border border-white/[0.07] rounded-xl p-5 bg-white/[0.01] mb-4">
                <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase mb-4">
                  Attachments
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {email.attachments.map((attachment, i) => (
                    <AttachmentCard
                      key={i}
                      attachment={attachment}
                      onDownload={handleDownloadAttachment}
                    />
                  ))}
                </div>
              </div>
            )}
 
            {/* ── Email body ── */}
            {email.body ? (
              <div className="border border-white/[0.07] rounded-xl overflow-hidden bg-white/[0.01]">
                <div className="px-5 py-3 border-b border-white/[0.05] flex items-center justify-between">
                  <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase">Message</p>
                </div>
 
                {bodyMode === "html" ? (
                  <div className="p-5">
                    {/* Sandboxed iframe for HTML emails */}
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <style>
                              body { background: transparent; color: rgba(255,255,255,0.7); font-family: -apple-system, sans-serif; font-size: 13px; line-height: 1.7; margin: 0; padding: 0; }
                              a { color: rgba(255,255,255,0.5); }
                              img { max-width: 100%; height: auto; border-radius: 6px; }
                              * { box-sizing: border-box; }
                              table { max-width: 100% !important; }
                            </style>
                          </head>
                          <body>${email.body}</body>
                        </html>
                      `}
                      sandbox="allow-same-origin"
                      className="w-full border-0 rounded-lg"
                      style={{ minHeight: 300, backgroundColor: "transparent" }}
                      onLoad={(e) => {
                        const iframe = e.target as HTMLIFrameElement;
                        if (iframe.contentDocument) {
                          iframe.style.height = iframe.contentDocument.body.scrollHeight + 40 + "px";
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="p-5">
                    <pre className="gs-mono text-[12px] text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
                      {email.body.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim()}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-white/[0.07] rounded-xl p-8 text-center bg-white/[0.01]">
                <p className="gs-mono text-[12px] text-zinc-700">No body content available for this email.</p>
              </div>
            )}
 
            {/* ── Bottom action bar ── */}
            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => router.back()}
                className="gs-mono text-[11px] text-zinc-600 hover:text-white/60 transition">
                ← Back to dashboard
              </button>
 
              {!trashed && (
                <button onClick={handleTrash} disabled={trashing}
                  className="gs-mono text-[11px] px-4 py-2 border border-red-500/20 text-red-400/70 rounded-md hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-40">
                  {trashing ? "Moving to trash…" : "Move to trash"}
                </button>
              )}
            </div>
 
          </motion.div>
        )}
      </div>
    </main>
  );
}
 

export default function EmailViewer() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <EmailContent />
    </Suspense>
  );
}