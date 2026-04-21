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
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { useRouter } from "next/navigation";



export default function Dashboard() {

  const { data: session } = useSession();
  const router = useRouter();

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
  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return (mb / 1024).toFixed(2) + " GB";
    }
    return mb.toFixed(2) + " MB";
  };

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

  useEffect(() => {
    const fetchHeavyEmails = async () => {
      if (!session?.accessToken) return;

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
          "larger:5M has:attachment older_than:1y -from:me"
        )}&maxResults=50`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      const data = await res.json();

      const detailedEmails = await Promise.all(
        (data.messages || []).map(async (msg: any) => {
          const res = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            {
              headers: {
                Authorization: `Bearer ${session.accessToken}`
              }
            }
          );

          const emailData = await res.json();

          const headers = emailData.payload.headers;


          const fromRaw = headers.find((h: any) => h.name === "From")?.value || "Unknown";

          const from = fromRaw.split("<")[0].trim();

          const rawSubject = headers.find((h: any) => h.name === "Subject")?.value;

          let subject = rawSubject?.trim();

          if (!subject) {
            subject = `Email from ${from}`;
          }

          const dateRaw = headers.find((h: any) => h.name === "Date")?.value || "";

          const date = new Date(dateRaw).toLocaleDateString();

          const size = emailData.sizeEstimate || 0;
          
          const month = new Date(dateRaw).toLocaleString("default", {
            month: "short"
          });

          return {
            id: msg.id,
            subject,
            from,
            date,
            size,
            month
          };
        })
      );

      const total = detailedEmails.reduce(
        (sum, email) => sum + email.size,
        0
      );

      setTotalSize(total);

      setHeavyEmails(detailedEmails);

      const monthlyMap: any = {};

      detailedEmails.forEach((email) => {
        if (!monthlyMap[email.month]) {
          monthlyMap[email.month] = 0;
        }

        monthlyMap[email.month] += email.size;
      });

      const dynamicBarData = Object.keys(monthlyMap)
        .sort((a, b) => new Date(`${a} 1, 2024`).getTime() - new Date(`${b} 1, 2024`).getTime())
        .map((month) => ({
          month,
          gb: monthlyMap[month] / (1024 * 1024 * 1024),
        }));
      setBarData(dynamicBarData)
    };

    fetchHeavyEmails();
  }, [session]);

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


  return (
  <main className="relative min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">

    {/* GLOBAL CONTAINER */}
    <div className="max-w-7xl mx-auto px-6 py-10">

      <button
        onClick={() => router.push("/")}
        className="text-sm text-zinc-400 hover:text-white mb-6 transition"
      >
        ← Back to Home
      </button>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <p className="text-zinc-400 text-sm">Dashboard</p>
          <h1 className="text-5xl font-semibold tracking-tight">
            Gmail Storage Insights
          </h1>
        </div>

        <button className="px-6 py-3 rounded-2xl bg-white text-black font-medium hover:scale-105 transition">
          Refresh Scan
        </button>
      </div>

      {/* STATS GRID (FIXED) */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">

        {[
          { label: "Large Emails", value: heavyEmails.length },
          { label: "Spam", value: stats.spam },
          { label: "Promotions", value: stats.promotions },
          { label: "Recoverable", value: formatSize(totalSize) },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition"
          >
            <p className="text-zinc-400 text-sm">{item.label}</p>
            <h2 className="text-3xl font-semibold mt-3">
              {typeof item.value === "number"
                ? item.value.toLocaleString()
                : item.value}
            </h2>
          </div>
        ))}

      </div>

      {/* CHARTS */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <h2 className="text-lg font-semibold mb-4">Storage Breakdown</h2>

          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={90}>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <h2 className="text-lg font-semibold mb-4">Storage Growth</h2>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Bar dataKey="gb" fill="#ffffff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* MAILBOX */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-12">
        <h2 className="text-xl font-semibold mb-6">Mailbox Categories</h2>

        <div className="grid md:grid-cols-4 gap-4">
          {usefulLabels.map((label) => (
            <div
              key={label.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition"
            >
              <p className="text-xs text-zinc-500">Category</p>
              <h3 className="font-medium mt-1">
                {label.name.replace("CATEGORY_", "")}
              </h3>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-12">
        <h2 className="text-xl font-semibold mb-4">Smart Insights</h2>

        <ul className="space-y-2 text-sm text-zinc-300">
          <li>• You have old emails with large attachments</li>
          <li>• Promotions may be consuming unnecessary space</li>
          <li>• Cleaning attachments can free significant storage</li>
        </ul>
      </div>  

      {/* HEAVY EMAILS */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h2 className="text-xl font-semibold mb-6">
          Large Emails You Can Clean
        </h2>

        <div className="space-y-3">
          {heavyEmails.map((email, index) => (
            <div
              key={email.id}
              className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {email.subject}
                </p>

                <p className="text-sm text-zinc-400 mt-1">
                  {email.from}
                </p>

                <p className="text-xs text-zinc-500 mt-1">
                  {email.date}
                </p>

                <p className="text-xs text-zinc-500 mt-1">
                  {formatSize(email.size)}
                </p>
              </div>

              <button className="text-xs border border-white/10 px-3 py-1 rounded-lg hover:bg-white/10 transition">
                View
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  </main>
);
}