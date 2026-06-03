import Link from "next/link";
import { ArrowRight, Lock, Brain, Clock } from "lucide-react";
import ConnectButton from "../components/ConnectButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAF9] flex flex-col selection:bg-white/20 selection:text-white font-sans">
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl w-full mx-auto">
        <div className="text-xl font-medium tracking-tight">VEIN</div>
        <nav className="flex items-center gap-6 text-sm text-[#A1A1AA]">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <div className="h-4 w-[1px] bg-white/10"></div>
          <ConnectButton />
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-[#A1A1AA] mb-8">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          Live on Ritual Chain
        </div>
        
        <h1 className="text-6xl md:text-8xl font-semibold tracking-tighter leading-tight mb-6">
          The future audits <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-400 to-neutral-700">your past.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[#A1A1AA] max-w-2xl mb-12 font-light leading-relaxed">
          Record a belief. Lock it in time. <br />
          Let AI decide what reality says later.
        </p>

        <Link href="/create" className="group inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full text-lg font-medium hover:scale-105 transition-all duration-300">
          Create a Vein
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-32 text-left">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 border border-white/10">
              <Lock className="w-5 h-5 text-neutral-300" />
            </div>
            <h3 className="font-medium text-lg">Time-Locked</h3>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Cryptographically sealed capsules using Ritual Secrets. Cannot be revealed until the unlock timestamp.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 border border-white/10">
              <Brain className="w-5 h-5 text-neutral-300" />
            </div>
            <h3 className="font-medium text-lg">AI Verdict</h3>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Ritual-native AI evaluates your thesis against external data and reality, acting as an impartial judge.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2 border border-white/10">
              <Clock className="w-5 h-5 text-neutral-300" />
            </div>
            <h3 className="font-medium text-lg">Proof of Conviction</h3>
            <p className="text-[#A1A1AA] text-sm leading-relaxed">Build a permanent, on-chain reputation based on your long-term accuracy and foresight.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-[#A1A1AA] text-sm border-t border-white/5">
        <p>Built for the Ritual Ecosystem.</p>
      </footer>
    </div>
  );
}
