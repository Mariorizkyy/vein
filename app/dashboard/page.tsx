"use client";

import Link from "next/link";
import { ArrowLeft, BrainCircuit, Activity, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { useAccount } from "wagmi";

export default function Dashboard() {
  const { isConnected, address } = useAccount();

  // Mock data for UI demonstration purposes
  const convictionScore = 82;
  const history = { correct: 17, partial: 4, incorrect: 2 };
  
  const capsules = [
    { id: 1, category: "Market Thesis", status: "LOCKED", unlockDate: "2027-01-01", snippet: "Autonomous agents will account for..." },
    { id: 2, category: "Startup Thesis", status: "EVALUATED", verdict: "CORRECT", score: 95, snippet: "Ritual chain will hit 1B TVL..." },
    { id: 3, category: "Personal Goal", status: "EVALUATED", verdict: "PARTIALLY_CORRECT", score: 50, snippet: "I will launch 3 mainnet dApps..." },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAF9] flex flex-col font-sans">
      <header className="flex items-center justify-between px-8 py-6 w-full mx-auto border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium tracking-tight">Dashboard</div>
          {isConnected && (
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-[#A1A1AA]">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-12 max-w-5xl mx-auto w-full">
        {/* Profile Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <BrainCircuit className="w-32 h-32" />
            </div>
            <div>
              <h2 className="text-[#A1A1AA] font-medium text-sm mb-2 uppercase tracking-widest">Proof of Conviction</h2>
              <div className="text-7xl font-semibold tracking-tighter">{convictionScore}</div>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-[#A1A1AA]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-white font-medium">{history.correct}</span> Correct
              </div>
              <div className="flex items-center gap-2">
                <MinusCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-white font-medium">{history.partial}</span> Partial
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-white font-medium">{history.incorrect}</span> Incorrect
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
            <h2 className="text-[#A1A1AA] font-medium text-sm mb-2 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Network Status
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#A1A1AA]">Chain</span>
                <span className="text-sm font-medium">Ritual Testnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#A1A1AA]">AI Precompile</span>
                <span className="text-sm font-medium text-green-400">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#A1A1AA]">Secrets TEE</span>
                <span className="text-sm font-medium text-green-400">Online</span>
              </div>
            </div>
          </div>
        </section>

        {/* Capsules List */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Your Capsules</h2>
            <Link href="/create" className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-neutral-200 transition-colors">
              New Vein
            </Link>
          </div>
          
          <div className="flex flex-col gap-4">
            {capsules.map(cap => (
              <div key={cap.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                <div className="flex flex-col gap-1 mb-4 md:mb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{cap.category}</span>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                      cap.status === 'LOCKED' ? 'border-neutral-500 text-neutral-400' : 
                      cap.verdict === 'CORRECT' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                      'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                    }`}>
                      {cap.status === 'LOCKED' ? `Unlocks ${cap.unlockDate}` : cap.verdict}
                    </span>
                  </div>
                  <p className="text-[#A1A1AA] text-sm">"{cap.snippet}"</p>
                </div>
                
                <div className="flex items-center gap-4">
                  {cap.status === 'EVALUATED' && (
                    <div className="text-right">
                      <div className="text-xs text-[#A1A1AA] uppercase tracking-widest">Score</div>
                      <div className="text-xl font-semibold">{cap.score}</div>
                    </div>
                  )}
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors">
                    {cap.status === 'LOCKED' ? 'View Details' : 'Read Verdict'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
