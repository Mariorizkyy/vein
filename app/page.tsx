import ConnectButton from "../components/ConnectButton";
import { Lock, BrainCircuit, Shield } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAF9] flex flex-col font-sans relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob z-0" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000 z-0" />
      <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-emerald-600/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000 z-0" />

      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 w-full mx-auto relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-2xl tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-white drop-shadow-sm">V E I N</span>
        </div>
        <ConnectButton />
      </header>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10 mt-16">
        <div className="max-w-4xl mx-auto flex flex-col items-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-[#A1A1AA] mb-8 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            Powered by Ritual Testnet
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-xl">
            Time-Locked<br/>AI Capsules
          </h1>
          
          <p className="text-lg md:text-xl text-[#A1A1AA] mb-10 max-w-2xl font-light leading-relaxed">
            Seal your predictions, beliefs, or secrets on the blockchain. When the time comes, 
            Ritual's decentralized AI breaks the seal, evaluates the truth, and issues an immutable verdict.
          </p>

          <Link href="/dashboard" className="group relative inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-medium text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]">
            <span className="relative z-10">Enter the Vault</span>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-5xl mx-auto w-full animate-fade-in pb-20" style={{animationDelay: '0.2s'}}>
          {[
            { icon: Lock, title: "Cryptographic Seals", desc: "Your data is mathematically locked until the precise timestamp." },
            { icon: BrainCircuit, title: "AI Verdicts", desc: "Decentralized models evaluate the truth without human bias." },
            { icon: Shield, title: "Proof of Conviction", desc: "Build on-chain reputation by staking your foresight." }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-8 rounded-3xl flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors shadow-inner">
                <feature.icon className="w-6 h-6 text-[#FAFAF9]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-[#A1A1AA] text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
