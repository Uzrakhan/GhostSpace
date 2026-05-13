"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";


type DeleteAction = {
  emails: any[],
  source: "large" | "promotions" | "spam"
}


// Toast replaces browser alert() for a nicer UX
function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:16 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 gs-mono text-[11px] px-5 py-3 rounded-md border border-white/15 bg-black text-white shadow-2xl whitespace-nowrap">
      {message}
    </motion.div>
  );
}


// Custom recharts tooltip
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="gs-mono text-[11px] bg-black border border-white/10 px-3 py-2 rounded-md shadow-xl">
      {label && <div className="text-zinc-500 mb-1">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-white">{p.name}: {p.value}</div>
      ))}
    </div>
  );
}


// Scanlines overlay
function Scanlines() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.018]"
      style={{ backgroundImage:"repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px)" }}/>
  );
}


function GhostSkeleton({
  className = "",
  style
} : {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div 
      style={style}
      className={`animate-pulse rounded-md bg-white/[0.06] ${className}`}
    />
  )
}

function StatCardSkeleton() {
  return (
    <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015] ">
      <GhostSkeleton className="h-2 w-20 mb-4" />
      <GhostSkeleton className="h-8 w-28" />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015]">
      <GhostSkeleton className="h-3 w-32 mb-6" />

      <div className="flex items-end gap-3 h-[220px]">
        {[...Array(7)].map((_, i) => (
          <GhostSkeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{
              height: `${60 + i * 15}px`
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Grid background
function GridBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dbgrid" width="70" height="70" patternUnits="userSpaceOnUse">
            <path d="M 70 0 L 0 0 0 70" fill="none" stroke="rgba(255,255,255,0.022)" strokeWidth="1" strokeDasharray="3 8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dbgrid)" />
      </svg>
    </div>
  );
}




export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryCache = useRef<Map<string, any[]>>(new Map())
  const hasFetched = useRef(false);
  const emailCache = useRef<Map<string, any>>(new Map());
  const [labels, setLabels] = useState<any[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [barData, setBarData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    inbox: 0,
    promotions: 0,
    social: 0,
    spam: 0
  });
  const [heavyEmails, setHeavyEmails] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"large" | "promotions" | "spam">("large");
  const [promotionsEmails, setPromotionsEmails] = useState<any[]>([]);
  const [spamEmails, setSpamEmails] = useState<any[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSize, setDriveSize] = useState(0);
  const [deleteHistory, setDeleteHistory] = useState<DeleteAction[]>([])
  const [toast, setToast] = useState<string | null>(null);
  const [loadingLarge, setLoadingLarge] = useState(true);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [loadingSpam, setLoadingSpam] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingDrive, setLoadingDrive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [largestDriveFiles, setLargestDriveFiles] = useState<any[]>([]);
  const [cleanupCategories, setCleanupCategories] = useState<any[]>([]);
  const [cleanupCandidates, setCleanupCandidates] = useState<any[]>([])
  const [storageQuota, setStorageQuota] = useState({
    used: 0,
    limit: 0,
    usageInDrive: 0,
    usageInDriveTrash: 0,
  });

  const PAGE_SIZE = 10;
  const MAX_EMAILS = 40;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000)
  }

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return (mb / 1024).toFixed(2) + " GB";
    }
    return mb.toFixed(2) + " MB";
  };

  const fetchStorageQuota = async () => {
    if(!session?.accessToken) return;

    const res = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=storageQuota",
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        }
      }
    );
    const data = await res.json();

      if (data.storageQuota) {
        setStorageQuota({
          used: Number(data.storageQuota.usage),
          limit: Number(data.storageQuota.limit),
          usageInDrive: Number(data.storageQuota.usageInDrive),
          usageInDriveTrash: Number(data.storageQuota.usageInDriveTrash),
        });
      }
  }

  const fetchEmailsByQuery = async (
    query: string
  ): Promise<any[]> => {
    if(!session?.accessToken) return [];

    let allMessages: any[] = [];
    let pageToken: string | null = null;

    if (queryCache.current.has(query)) {
      return queryCache.current.get(query)!;
    }

    //fetch multiple pages
    while (allMessages.length < MAX_EMAILS) {
      const res: Response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
          query
        )}&maxResults=20&pageToken=${pageToken || ""}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          }
        }
      );

      const data = await res.json();

      allMessages = [...allMessages, ...(data.messages || [])];
      pageToken = data.nextPageToken;

      if(!pageToken || allMessages.length >= MAX_EMAILS) break;
    }


    const batchSize = 5;

    const results = [];

    for(let i = 0; i < allMessages.length; i+= batchSize) {
      const batch = allMessages.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (msg) => {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`
              }
            }
          );

          if (!res.ok) return null;
          const emailData = await res.json();

          if (!emailData.payload || !emailData.payload.headers) {
            return null;
          }

          const headers = emailData.payload.headers;

          const fromRaw =
            headers.find((h: any) => h.name === "From")?.value || "Unknown";
          const from = fromRaw.split("<")[0].trim();

          const rawSubject = headers.find(
            (h: any) => h.name === "Subject"
          )?.value;

          const subject = rawSubject?.trim() || `Email from ${from}`;

          const dateRaw =
            headers.find((h: any) => h.name === "Date")?.value || "";

          const date = new Date(dateRaw).toLocaleDateString();

          const size = emailData.sizeEstimate || 0;

          return {
            id: msg.id,
            subject,
            from,
            date,
            size,
          };
        })
      );
      results.push(...batchResults.filter(Boolean));

      //caching 
      batchResults.forEach((email) => {
        if (email) {
          emailCache.current.set(email.id, email)
        }
      });

      //small delay
      await new Promise((res) => setTimeout(res, 250));

      queryCache.current.set(query, results);
    }

    return results || [];
  }

  

  const fetchDriveFiles = async () => {
    if(!session?.accessToken) return;

    const res = await fetch(
      "https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,size,mimeType,createdTime,webViewLink)",
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      }
    );

    const data = await res.json();

    const files = (data.files || []).filter((f: { size: any; }) => f.size);
    const sortedFiles = files.sort(
      (a: { size: any; }, b: { size: any; }) => Number(b.size) - Number(a.size)
    );

    const candidates = sortedFiles.filter((file: any) => {
      const sizeMB = Number(file.size) / (1024 * 1024);

      const mime = file.mimeType || "";

      const createdYear = new Date(file.createdTime).getFullYear();

      return (
        sizeMB > 100 ||
        mime.includes("video") ||
        mime.includes("zip") ||
        mime.includes("rar") ||
        createdYear < 2024
      )
    }).slice(0, 12);

    const buildCategory = (
      title:string,
      icon:string,
      files: any[]
    ) => ({
      title,
      icon,
      files,

      totalSize: files.reduce(
        (acc: number, file: any) => 
          acc + Number(file.size || 0),
        0
      ),
    });

    const videoFiles = sortedFiles.filter(
      (file: any) => 
        file.mimeType?.includes("video")
    );

    const archiveFiles = sortedFiles.filter(
      (file: any) =>
        file.mimeType?.includes("zip") ||
        file.mimeType?.includes("rar")
    );

    const pdfFiles = sortedFiles.filter(
      (file: any) =>
        file.mimeType?.includes("pdf")
    );

    const oldFiles = sortedFiles.filter((file: any) => {
      const year = new Date(file.createdTime).getFullYear();

      return year < 2024;
    });

    const categories = [
      buildCategory(
        "Large Videos",
        "🎥",
        videoFiles
      ),

      buildCategory(
        "Archives",
        "🗜️",
        archiveFiles
      ),

      buildCategory(
        "PDF Documents",
        "📄",
        pdfFiles
      ),

      buildCategory(
        "Old Files",
        "🕒",
        oldFiles
      ),
    ];

    const topLargestFiles = sortedFiles.slice(0, 10)

    const total = files.reduce((sum: number, f: { size: any; }) => sum + Number(f.size), 0);

    setDriveFiles(sortedFiles)
    setLargestDriveFiles(topLargestFiles)
    setCleanupCandidates(candidates)
    setCleanupCategories(categories)
    setDriveSize(total)
  }

  const toggleSelect = (id: string) => {
    setSelectedEmails((prev) =>
      prev.includes(id)
        ? prev.filter((e) => e !== id)
        : [...prev, id]
    );
  };

  const handleDelete = async () => {  
    if (!session?.accessToken) return;

    if (selectedEmails.length === 0) {
      showToast("No emails selected");
      return;
    }

    const confirmDelete = confirm(
      `Move ${selectedEmails.length} emails to trash?`
    );

    if (!confirmDelete) return;


    //get full email objects before deleting
    const deletedEmails = currentEmails.filter(email => selectedEmails.includes(email.id));

    //make copy store inhistory
    setDeleteHistory(prev => [
      ...prev,
      {
        emails: deletedEmails,
        source: activeTab
      }
    ])

    await Promise.all(
      selectedEmails.map(async (id) => {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/trash`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!res.ok) {
          const err = await res.json();
          console.error(err);
          throw new Error("Failed to delete");
        }
      })
    );

    showToast(`${selectedEmails.length} emails moved to trash`);


    // update UI
    setHeavyEmails((prev) =>
      prev.filter((e) => !selectedEmails.includes(e.id))
    );
    setPromotionsEmails((prev) =>
      prev.filter((e) => !selectedEmails.includes(e.id))
    );
    setSpamEmails((prev) =>
      prev.filter((e) => !selectedEmails.includes(e.id))
    );

    setSelectedEmails([]);
  }; 

  const handleUndo = async () => {
    if (deleteHistory.length === 0) return;

    //get last deleted batch
    const lastAction = deleteHistory[deleteHistory.length - 1];

    //remove it from history
    setDeleteHistory(prev => prev.slice(0, -1));

    //push deleted email back into UI
    if (lastAction.source === "large") {
      setHeavyEmails(prev => [...lastAction.emails, ...prev])
    } else if (lastAction.source === "promotions") {
      setPromotionsEmails(prev => [...lastAction.emails, ...prev])
    } else {
      setSpamEmails(prev => [...lastAction.emails, ...prev])
    }

    showToast("Restored deleted emails");

  }

  useEffect(() => {
    const fetchLabels = async () => {
      if (!session?.accessToken) return;

      const res = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/labels",
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      const data = await res.json();
      setLabels(data.labels || [])
    };

    fetchLabels()
  }, [session]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!session?.accessToken) return;

      const queries = {
        inbox: "in:inbox -category:promotions -category:social",
        promotions: "category:promotions",
        social: "category:social",
        spam: "in:spam",
      } as const;

      type QueryKey = keyof typeof queries;

      const results: any = {};

      for (const key of Object.keys(queries) as QueryKey[]) {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(queries[key])}&maxResults=1`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        const data = await res.json();
        results[key] = data.resultSizeEstimate || 0;
      }
      setStats(results)
    };

    fetchCounts()
  },[session]);

  
  const fetchAll = async () => {
    setRefreshing(true);
    queryCache.current.clear();
    emailCache.current.clear(); 
    setLoadingLarge(true)
    setLoadingPromotions(true);
    setLoadingSpam(true);
    setLoadingOverview(true)
    setLoadingCharts(true)
    setLoadingDrive(true)

    hasFetched.current = false;
    const [large, promotions, spam] = await Promise.all([
      fetchEmailsByQuery("has:attachment larger:1M"),
      fetchEmailsByQuery("category:promotions"),
      fetchEmailsByQuery("in:spam")
    ]);

    setHeavyEmails(large);
    setPromotionsEmails(promotions);
    setSpamEmails(spam);

    setLoadingLarge(false);
    setLoadingPromotions(false);
    setLoadingSpam(false);

    const total = large.reduce((sum, email) => sum + (email ? email.size : 0), 0);
    setTotalSize(total);

    //bar chart
    const monthlyMap: any = {};

    large.forEach((email: any) => {
      const month = new Date(email.date).toLocaleString("default", {
        month: "short"
      });

      if (!monthlyMap[month]) monthlyMap[month] = 0;
      monthlyMap[month] += email.size;
    });

    const dynamicBarData = Object.keys(monthlyMap).map((month) => ({
      month,
      gb: monthlyMap[month] / (1024 * 1024 * 1024),
    }));

    await fetchDriveFiles();
    await fetchStorageQuota()
    setLoadingDrive(false)

    setBarData(dynamicBarData);

    setLoadingCharts(false)
    setLoadingOverview(false)
    setRefreshing(false);
  };
  
  useEffect(() => {
    if (!session?.accessToken || hasFetched.current) return;

    hasFetched.current = true;

    fetchAll()
  }, [session])

  const pieData = [
    { name: "Inbox", value: stats.inbox },
    { name: "Promotions", value: stats.promotions },
    { name: "Social", value: stats.social },
    { name: "Spam", value: stats.spam },
  ];

  


  const COLORS = ["#ffffff", "#888888", "#555555", "#222222"];

  const usefulLabels = labels.filter((label) => [
      "INBOX",
      "SENT",
      "TRASH",
      "SPAM",
      "DRAFT",
      "Promotions",
      "Social",
      "Updates",
    ].includes(label.id)
  );

  const currentEmails =
    activeTab === "large"
      ? heavyEmails
      : activeTab === "promotions"
      ? promotionsEmails
      : spamEmails;

  const sortedEmails = [...heavyEmails].sort((a,b) => b.size - a.size);

  const isLoading =
    activeTab === "large"
      ? loadingLarge
      : activeTab === "promotions"
      ? loadingPromotions
      : loadingSpam;

  //slice emails
  const paginatedEmails = currentEmails.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const calculateTotalSize = (emails: any[]) => {
    return emails.reduce((sum, email) => sum + email.size, 0);
  };

  const spamSize = calculateTotalSize(spamEmails)
  const promotionsSize = calculateTotalSize(promotionsEmails)


  const recoveryInsights = [
    {
      title: "Large Attachments",
      size: totalSize,
      description: "Emails with heavy attachments"
    },
    {
      title: "Drive Files",
      size: driveSize,
      description: "Large Google Drive files"
    },
    {
      title: "Spam Cleanup",
      size: spamSize,
      description: "Estimated spam storage"
    },
    {
      title: "Promotions",
      size: promotionsSize,
      description: "Estimated promotional emails"
    }
  ];

  const sortedRecovery = recoveryInsights.sort(
    (a, b) => b.size - a.size
  );

  const totalUsed = storageQuota.used;

  const totalLimit = storageQuota.limit;

  const totalRemaining = totalLimit - totalUsed;

  const usedPercentage = Math.min(
    100,
    Math.round((totalUsed / totalLimit) * 100)
  );


  const getFileIcon = (mime: string) => {
    if (mime.includes("video")) return "🎥";
    if (mime.includes("image")) return "🖼️";
    if (mime.includes("pdf")) return "📄";
    if (mime.includes("zip")) return "🗜️";
    return "📁";
  };

  const getCleanupReason = (file : any) => {
    const sizeMB = Number(file.size) / (1024 * 1024);
    const mime = file.mimeType || "";
    const createdYear = new Date(file.createdTime).getFullYear();

    if(mime.includes("video")) {
      return "Large video file"
    }

    if (mime.includes("zip") || mime.includes("rar")) {
      return "Compressed archive"
    }

    if (createdYear < 1024) {
      return "Old unused file"
    }

    if (sizeMB > 100) {
      return "Large storage consumer"
    }

    return "Potential cleanup candidate"
  };


  return (
    <main className="relative min-h-screen text-white" style={{  backgroundColor: "#080808"}}>

      <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
          .gs-syne { font-family: 'Syne', sans-serif; }
          .gs-mono { font-family: 'DM Mono', monospace; }
          ::-webkit-scrollbar { width: 3px; }
          ::-webkit-scrollbar-track { background: #111; }
          ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        `}</style>

      <Scanlines />
      <GridBg />

      {/* Toast */}
      <AnimatePresence>{toast && <Toast message={toast}/>}</AnimatePresence>

      {/** TOP BAR */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] h-12 flex items-center px-6 lg:px-8" style={{ backdropFilter:"blur()20px", backgroundColor:"rgba(8,8,8,0.92)" }}>
        <button
          onClick={() => router.push("/")}
          className="gs-mono text-[11px] text-zinc-600 hover:text-white/70 transition"
        >
          ← GhostSpace
        </button>
        <div className="flex-1"/>
        <span className="gs-mono text-[10px] text-zinc-700 tracking-[0.25em] uppercase">Dashboard</span>
        <div className="flex-1"/>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-10">

        {/**HEADER */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.25em] uppercase mb-3">
              Storage report
            </p>
            <h1 className="gs-syne text-4xl md:text-5xl font-bold tracking-tight">
              Free up <span>{formatSize(totalSize)}</span>
            </h1>
            <p className="gs-mono text-[12px] text-zinc-600 mt-2">
              From {heavyEmails.length} large emails
            </p>
          </div>
          <button
              onClick={fetchAll}
              disabled={refreshing}
              className="gs-mono text-[11px] px-4 py-2 border border-white/10 rounded-md text-zinc-500 hover:border-white/20 hover:text-white/70 transition disabled:opacity-40"
            >
            {refreshing ? "Scanning..." : "↻ Refresh Scan"}
          </button>
        </div>


        {/**STORAGE OVERVIEW */}
        <div className="border border-white/[0.07] rounded-xl p-8 bg-white/[0.015] mb-8">

          <div className="flex items-center justify-between mb-8">

            <div>
              <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase">
                Google Storage
              </p>

              {loadingOverview ? (
                  <GhostSkeleton className="h-10 w-40 mt-2" />
              ) : (
                <h2 className="gs-syne text-4xl font-bold mt-2">
                  {usedPercentage}% Used
                </h2>
              )}

              {loadingOverview ? (
                <GhostSkeleton className="h-3 w-32 mt-3" />
              ) : (
                <p className="gs-mono text-[11px] text-zinc-600 mt-2">
                  {formatSize(totalUsed)} of 15 GB
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="gs-syne text-2xl font-bold">
                {formatSize(totalRemaining)}
              </p>

              <p className="gs-mono text-[10px] text-zinc-600">
                remaining
              </p>
            </div>

          </div>

          <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usedPercentage}%` }}
              transition={{ duration: 1.2 }}
              className="h-full bg-white rounded-full"
            />
          </div>

        </div>

        {/**RECOVERY */}
        <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015] mb-8">

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase">
                Recovery Opportunites
              </p>

              <h2 className="gs-syne text-2xl font-bold mt-2">
                Potential Space Recovery
              </h2>
            </div>

            <div className="text-right">
              <p className="gs-syne text-3xl font-bold">
                {formatSize(
                  sortedRecovery.reduce((sum, item) => sum + item.size, 0)
                )}
              </p>

              <p className="gs-mono text-[10px] text-zinc-600">
                estimated recoverable
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {sortedRecovery.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity:0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between border border-white/[0.05] rounded-lg p-4 bg-white/[0.01]"
              >
                <div>
                  <p className="gs-syne text-sm font-bold text-white/80">
                    {item.title}
                  </p>

                  <p className="gs-mono text-[10px] text-zinc-600 mt-1">
                    {item.description}
                  </p>
                </div>

                <div className="text-right">
                  <p className="gs-mono text-[12px] text-white/60">
                    {formatSize(item.size)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div className="grid md:grid-cols-4 gap-3 mb-8">

          {loadingOverview ? (

            [...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))

          ) : (

            [
              { label: "Large Emails",  value: heavyEmails.length },
              { label: "Spam",          value: stats.spam },
              { label: "Promotions",    value: stats.promotions },
              { label: "Recoverable",   value: formatSize(totalSize) },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:16 }}
                animate={{ opacity:1, y:0 }}
                transition={{
                  delay: i * 0.07,
                  duration:0.5,
                  ease:[0.16,1,0.3,1]
                }}
                className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015] hover:bg-white/[0.03] transition-colors">

                <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase">
                  {item.label}
                </p>

                <h2 className="gs-syne text-3xl font-bold mt-3">
                  {typeof item.value === "number"
                    ? item.value.toLocaleString()
                    : item.value}
                </h2>

              </motion.div>
            ))

          )}

        </div>


        {/**CHARTS */}
        <div className="grid md:grid-cols-2 gap-3 mb-8">

          {loadingCharts ? (

            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>

          ) : (

            <>

              <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015]">
                <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase mb-5">
                  Storage Breakdown 
                </p>

                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      outerRadius={80}
                      innerRadius={42}
                      strokeWidth={0}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex gap-5 mt-2 flex-wrap">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: COLORS[i] }}
                      />

                      <span className="gs-mono text-[10px] text-zinc-500">
                        {d.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015]">

                <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase mb-5">
                  Storage Growth
                </p>

                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} barCategoryGap="32%">
                    <XAxis
                      dataKey="month"
                      stroke="#333"
                      tick={{
                        fontSize:10,
                        fontFamily:"DM Mono",
                        fill:"#555"
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      stroke="#333"
                      tick={{
                        fontSize:10,
                        fontFamily:"DM Mono",
                        fill:"#555"
                      }}
                      axisLine={false}
                      tickLine={false}
                    />

                    <Tooltip content={<ChartTooltip />} />

                    <Bar
                      dataKey="gb"
                      fill="rgba(255,255,255,0.8)"
                      radius={[3,3,0,0]}
                    />
                  </BarChart>
                </ResponsiveContainer>

              </div>

            </>

          )}

        </div>



        {/* ── TOP STORAGE CONSUMERS ── */}
        <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015] mb-8">
          <div className="flex items-center justify-between mb-5">
            <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase">
              Top Storage Consumers
            </p>
            <span className="gs-mono text-[10px] text-zinc-700">Top 10</span>
          </div>
          <div className="space-y-1">
            {sortedEmails.slice(0, 10).map((email, i) => (
              <div key={email.id} className="flex items-center gap-4 py-3 border-b border-white/[0.04] last:border-0">
                <span className="gs-mono text-[10px] text-zinc-700 w-5 flex-shrink-0 tabular-nums">
                  {String(i+1).padStart(2,"0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="gs-syne text-sm font-bold text-white/80 truncate">
                    {email.subject}
                  </p>
                  <p className="gs-mono text-[10px] text-zinc-600">
                    {email.from}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden md:block w-20 h-[2px] bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-white/50 rounded-full" style={{ width:`${Math.min(100,(email.size/(sortedEmails[0]?.size||1))*100)}%` }}/>
                  </div>
                  <span className="gs-mono text-[11px] text-zinc-500 tabular-nums">
                    {formatSize(email.size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/**GOOGLE DRIVE */}
        <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015] mb-8 flex items-center justify-between">
          <div>
            <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase mb-2">
              Google Drive Usage
            </p>
            <p className="gs-syne text-3xl font-bold">{formatSize(driveSize)}</p>
            <p className="gs-mono text-[11px] text-zinc-600 mt-1">{driveFiles.length} files detected</p>
          </div>
          <div className="text-right hidden md:block">
            <div className="w-32 h-1.5 bg-white/[0.05] rounded-full overflow-hidden mb-1.5">
              <motion.div className="h-full bg-white/40 rounded-full"
                  initial={{ width:0 }}
                  animate={{ width: driveSize > 0 ? `${Math.min(100,(driveSize/(15*1024*1024*1024))*100)}%` : "0%" }}
                  transition={{ delay:0.5, duration:1.2, ease:[0.16,1,0.3,1] }}/>
            </div>
            <span className="gs-mono text-[10px] text-zinc-700">
              of 15GB
            </span>
          </div>
        </div>

        {/* Largest Drive Files */}
        <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015] mb-8">

          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                Largest Drive Files
              </p>

              
              <h2 className="text-2xl font-bold mt-2">
                Biggest Storage Consumers
              </h2>
            </div>
          </div>

          <div className="space-y-3">

            {largestDriveFiles.slice(0, 10).map((file: any, i: number) => (

              <div
                key={file.id}
                className="flex items-center justify-between p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]"
              >

                <div className="min-w-0">
                  <span>
                    {getFileIcon(file.mimeType)}
                  </span>
                  <p className="text-sm font-medium truncate">
                    {file.name}
                  </p>

                  <p className="text-xs text-zinc-500 mt-1">
                    {formatSize(Number(file.size))}
                  </p>
                </div>

                <a
                  href={`https://drive.google.com/file/d/${file.id}/view`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.05] transition"
                >
                  Open
                </a>

              </div>

            ))}

          </div>
        </div>


        <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015] mb-8">

          <div className="flex items-center justify-between mb-5">

            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                Cleanup Candidates
              </p>

              <h2 className="text-2xl font-bold mt-2">
                Suggested Cleanup Targets
              </h2>
            </div>

            <p className="text-sm text-zinc-600">
              Smart storage recommendations
            </p>
          </div>

          <div className="space-y-3">
            {cleanupCandidates.map((file: any) => (
              <motion.div
                key={file.id}
                initial={{opacity: 0, y: 10}}
                animate={{opacity:1, y:0}}
                className="flex items-center justify-between p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.03] transition-all"
              >
                <div className="min-w-0">

                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      ⚠
                    </span>

                    <div>

                      <p className="text-sm font-medium truncate max-w-[400px]">
                        {file.name}
                      </p>

                      <p className="text-xs text-zinc-500 mt-1">
                        {getCleanupReason(file)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {formatSize(Number(file.size))}
                    </p>

                    <p className="text-xs text-zinc-600 mt-1">
                      Recoverable
                    </p>
                  </div>

                  <a 
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg border border-white/[0.08] text-xs hover:bg-white/[0.05] transition"
                  >
                    Review
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="border border-white/[0.07] rounded-3xl p-8 bg-white/[0.02] backdrop-blur-xl mb-8">

          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="gs-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600 mb-3">
              Storage Categories
              </p>

              <h2 className="text-3xl font-semibold tracking-tight">
                Cleanup Opportunites
              </h2> 
            </div>
            
          </div>

          <p className="text-zinc-500 text-sm">
            Organized by file type
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            {cleanupCategories.map((category: any, i: number) => (
              <motion.div
                key={category.title}
                initial={{opacity:0, y:10}}
                animate={{opacity:1, y:0}}
                transition={{ delay: i * 0.06 }}
                className="border border-white/[0.05] bg-white/[0.015] rounded-2xl p-6 hover:bg-white/[0.03] transition-all"
              >
                <div className="flex items-start justify-between">

                  <div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">
                        {category.icon}
                      </span>

                      <div>
                        <h3 className="text-lg font-medium">
                          {category.title}
                        </h3>

                        <p className="text-zinc-500 text-sm mt-1">
                          {category.files.length} files detected
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-semibold">
                      {formatSize(category.totalSize)}
                    </p>

                    <p className="text-zinc-600 text-xs mt-1">
                      Recoverable
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        


        {/* ── MAILBOX CATEGORIES ── */}
        <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015] mb-8">
          <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase mb-5">Mailbox Categories</p>
            <div className="grid md:grid-cols-4 gap-3">
              {usefulLabels.map((label) => (
                <div key={label.id}
                  className="border border-white/[0.06] rounded-lg p-4 text-center bg-white/[0.01] hover:bg-white/[0.03] transition">
                  <p className="gs-mono text-[9px] text-zinc-600 tracking-[0.15em] uppercase mb-1">Category</p>
                  <p className="gs-syne text-sm font-bold text-white/70">
                    {label.name.replace("CATEGORY_", "")}
                  </p>
                </div>
              ))}
            </div>
        </div>

        {/* ── SMART INSIGHTS ── */}
        <div className="border border-white/[0.07] rounded-xl p-6 bg-white/[0.015] mb-8">
          <p className="gs-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase mb-5">Smart Insights</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon:"⚠", text:"Old emails with large attachments detected", note:"Priority cleanup target" },
                { icon:"◈", text:"Promotions may be consuming unnecessary space", note:"Bulk-delete safe" },
                { icon:"↑", text:"Cleaning attachments can free significant storage", note:"Highest ROI action" },
              ].map((insight, i) => (
                <div key={i} className="p-4 rounded-lg border border-white/[0.05] bg-white/[0.01]">
                  <span className="text-white/25 text-sm">{insight.icon}</span>
                  <p className="gs-mono text-[11px] text-zinc-500 mt-2 leading-relaxed">{insight.text}</p>
                  <p className="gs-mono text-[10px] text-zinc-700 mt-1">{insight.note}</p>
                </div>
              ))}
            </div>
        </div>

        {/* ── EMAIL CLEANER PANEL ── */}
        <div>

          {/**Tab bar */}
          <div className="flex items-center border-b border-white/[0.06] px-2">
            {(["large","promotions","spam"] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedEmails([]); }}
                className={`gs-mono text-[11px] px-5 py-3.5 relative capitalize tracking-[0.08em] transition-colors ${
                    activeTab === tab ? "text-white" : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="tab-line" className="absolute bottom-0 left-0 right-0 h-px bg-white" />
                )}
              </button>
            ))}
            <div className="flex-1"/>
            {/* action buttons — only visible when relevant */}
            <div className="flex items-center gap-2 px-2">
              <AnimatePresence>
                {selectedEmails.length > 0 && (
                  <motion.button
                    initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:8 }}
                    onClick={handleDelete}
                    className="gs-mono text-[10px] px-3 py-1.5 bg-red-500/15 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/25 transition"
                  >
                    Trash {selectedEmails.length}
                  </motion.button>
                )}
              </AnimatePresence>
              {deleteHistory.length > 0 && (
                <button
                  onClick={handleUndo}
                  className="gs-mono text-[10px] px-3 py-1.5 border border-white/[0.06] text-zinc-600 rounded-md hover:text-white/60 hover:border-white/15 transition"
                >
                  ↩ Undo
                </button>
              )}
            </div>
          </div>

          {/* Section heading */}
          <div className="px-6 py-4 border-b border-white/[0.04]">
              <p className="gs-mono text-[10px] text-zinc-600">
                {activeTab === "large" ? "Large Emails You Can Clean" :
                activeTab === "promotions" ? "Promotions You Can Delete" : "Spam Emails"}
                <span className="ml-3 text-zinc-700">({currentEmails.length})</span>
              </p>
          </div>

          {/* Email rows */}
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            <AnimatePresence>
              <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">

                  {isLoading ? (
                    <div className="space-y-2">
                      {[...Array(6)].map((_,i) => (
                        <div 
                          className="flex items-center gap-4 p-4 rounded-lg border border-white/[0.06] bg-white/[0.01] animate-pulse"
                          key={i}
                        >
                          <div className="w-4 h-4 border border-white/10 rounded"/>

                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-1/2 bg-white/10 rounded" />
                            <div className="h-2 w-1/3 bg-white/10 rounded" />
                          </div>

                          <div className="w-10 h-3 bg-white/10 rounded" />

                          <div className="w-12 h-6 border border-white/10 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : currentEmails.length === 0 ? (

                    <motion.div
                      initial={{ opacity:0 }}
                      animate={{ opacity:1 }}
                      className="text-center py-16 gs-mono text-[11px] text-zinc-700"
                    >
                      No emails in this category.
                    </motion.div>
                  ) : (

                    <AnimatePresence>
                      {paginatedEmails.map((email, index) => (
                        <motion.div
                          key={email.id ?? `${email.subject}-${email.date}-${index}`}
                          layout
                          initial={{ opacity:0, x:-6 }}
                          animate={{ opacity:1, x:0 }}
                          exit={{ opacity:0, x:6 }}
                          transition={{ delay: index * 0.03, duration:0.3 }}
                          onClick={() => toggleSelect(email.id)}
                          className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedEmails.includes(email.id)
                              ? "border-white/20 bg-white/[0.05]"
                              : "border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedEmails.includes(email.id)
                              ? "bg-white border-white"
                              : "border-white/20"
                          }`}>
                            {selectedEmails.includes(email.id) && (
                              <svg width="8" height="6">
                                <path d="M1 3L3 5L7 1" stroke="black" strokeWidth="1.5"/>
                              </svg>
                            )}
                          </div>


                          <div className="flex-1 min-w-0">
                            <p className="gs-syne text-sm font-bold text-white/85 truncate">
                              {email.subject}
                            </p>
                            <p className="gs-mono text-[11px] text-zinc-600 mt-0.5">
                              {email.from}
                            </p>
                            <p className="gs-mono text-[10px] text-zinc-700 mt-0.5">
                              {email.date}
                            </p>
                          </div>


                          <div className="text-right">
                            <p className="gs-mono text-[12px] text-white/50">
                              {formatSize(email.size)}
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              const cached = emailCache.current.get(email.id);

                              if (cached) {
                                sessionStorage.setItem("email-preview", JSON.stringify(cached));
                              }
                              setOpeningId(email.id);
                              router.push(`/email?id=${email.id}`);
                            }}
                            className="gs-mono text-[10px] border border-white/10 px-3 py-1.5 rounded-md"
                          >
                            {openingId === email.id ? "Opening..." : "View"}
                          </button>


                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
              </div>

              <div className="flex items-center justify-between mt-4 px-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gs-mono text-[10px] px-3 py-1.5 border border-white/[0.08] rounded-md text-zinc-500 hover:text-white/70 hover:border-white/20 transition"
                >
                  ← Prev
                </button>

                <span className="gs-mono text-[10px] text-zinc-600">
                  Page {page}
                </span>

                <button
                  onClick={() =>
                    setPage((p) =>
                      p * PAGE_SIZE < currentEmails.length ? p + 1 : p
                    )
                  }
                  className="gs-mono text-[10px] px-3 py-1.5 border border-white/[0.08] rounded-md text-zinc-500 hover:text-white/70 hover:border-white/20 transition"
                >
                  Next →
                </button>
              </div>
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] mt-10 py-5 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="gs-mono text-[10px] text-zinc-800">GhostSpace · 2026</span>
          <span className="gs-mono text-[10px] text-zinc-800">Read-only · Your data stays yours</span>
        </div>
      </footer>
    </main>
  );
}