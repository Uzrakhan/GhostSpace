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

export default function Dashboard() {

  const pieData = [
    { name: "Promotions", value: 45 },
    { name: "Attachments", value: 30 },
    { name: "Social", value: 15 },
    { name: "Personal", value: 10 },
   ];

    const barData = [
    { month: "Jan", gb: 4 },
    { month: "Feb", gb: 5 },
    { month: "Mar", gb: 6 },
    { month: "Apr", gb: 7 },
    ];

    const COLORS = ["#ffffff", "#888888", "#555555", "#222222"];
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-zinc-400">Dashboard</p>
          <h1 className="text-4xl font-bold">Gmail Storage Insights</h1>
        </div>

        <button className="bg-white text-black px-5 py-2 rounded-xl font-medium">
          Refresh Scan
        </button>
        
      </div>

      {/* Cards */}
      <section className="grid md:grid-cols-4 gap-6 mb-12">

        <div className="glass glow p-6 rounded-3xl">
          <p className="text-zinc-400">Total Emails</p>
          <h2 className="text-3xl font-bold mt-3">8,241</h2>
        </div>

        <div className="glass glow p-6 rounded-3xl">
          <p className="text-zinc-400">Heavy Attachments</p>
          <h2 className="text-3xl font-bold mt-3">124</h2>
        </div>

        <div className="glass glow p-6 rounded-3xl">
          <p className="text-zinc-400">Promotions</p>
          <h2 className="text-3xl font-bold mt-3">2,031</h2>
        </div>

        <div className="glass glow p-6 rounded-3xl">
          <p className="text-zinc-400">Recoverable Space</p>
          <h2 className="text-3xl font-bold mt-3">6.7 GB</h2>
        </div>

      </section>

      {/*Charts */}
      <section className="grid md:grid-cols-2 gap-6 mb-12">

        <div className="glass glow rounded-3xl p-6 h-80">
            <h2 className="text-xl font-bold mb-4">Storage Breakdown</h2>

            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                data={pieData}
                dataKey="value"
                outerRadius={100}
                label
                >
                {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
                </Pie>
                <Tooltip />
            </PieChart>
            </ResponsiveContainer>
        </div>

        <div className="glass glow rounded-3xl p-6 h-80">
            <h2 className="text-xl font-bold mb-4">Storage Growth</h2>

            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
                <XAxis dataKey="month" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip />
                <Bar dataKey="gb" fill="#ffffff" radius={[8,8,0,0]} />
            </BarChart>
            </ResponsiveContainer>
        </div>

      </section>

      {/* Heavy Senders */}
      <section className="glass glow rounded-3xl p-8 mb-10">
        <h2 className="text-2xl font-bold mb-6">Top Space Consumers</h2>

        <div className="space-y-4">

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span>Google Photos</span>
            <span>1.8 GB</span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span>Old College Files</span>
            <span>1.3 GB</span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span>Shopping Promotions</span>
            <span>920 MB</span>
          </div>

        </div>
      </section>

      {/* Suggestions */}
      <section className="glass glow rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6">Cleanup Suggestions</h2>

        <ul className="space-y-3 text-zinc-300">
          <li>Search: larger:10M</li>
          <li>Search: older_than:2y has:attachment</li>
          <li>Delete Promotions after review</li>
        </ul>
      </section>

    </main>
  );
}