"use client";

import Link from "next/link";
import { ArrowLeft, BrainCircuit, Activity, Lock } from "lucide-react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { VEIN_VAULT_ABI } from "../abi";
import { VEIN_VAULT_ADDRESS } from "../config";
import { useState } from "react";

function CapsuleItem({ id }: { id: bigint }) {
  const { data: capsuleData, isLoading } = useReadContract({
    address: VEIN_VAULT_ADDRESS,
    abi: VEIN_VAULT_ABI,
    functionName: "capsules",
    args: [id],
  });

  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();
  const [isEvaluating, setIsEvaluating] = useState(false);

  if (isLoading || !capsuleData) {
    return <div className="p-6 bg-white/5 border border-white/5 rounded-2xl animate-pulse h-24"></div>;
  }

  // Wagmi returns tuple data as an array for structs
  const [, , category, , unlockTimestamp, snippet, isRevealed, evaluation] = capsuleData as any;
  // Ritual Testnet quirk: unlockTimestamp is already in milliseconds
  const isLocked = Number(unlockTimestamp) > Date.now();
  
  const handleEvaluate = async () => {
    if (!address) return;
    setIsEvaluating(true);
    try {
      const txHash = await writeContractAsync({
        address: VEIN_VAULT_ADDRESS,
        abi: VEIN_VAULT_ABI,
        functionName: "triggerUnlockAndEvaluate",
        args: [
          id,
          '[{"role":"user","content":"Evaluate this thesis based on reality."}]',
          [], // empty encryptedSecrets for MVP
          [], // empty secretSignatures for MVP
          "0x"
        ] as any,
      });
      alert(`Evaluation Triggered! TX: ${txHash}`);
    } catch (err: any) {
      console.error(err);
      alert(`Error triggering evaluation: ${err.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 glass-card hover:-translate-y-1 rounded-2xl transition-all duration-300 group">
      <div className="flex flex-col gap-2 mb-4 md:mb-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{category}</span>
          <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm transition-all ${
            isLocked ? 'border-blue-500/30 text-blue-400 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 
            isRevealed ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' :
            'border-yellow-500/50 text-yellow-400 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-pulse'
          }`}>
            {isLocked ? `Unlocks ${new Date(Number(unlockTimestamp)).toLocaleDateString()}` : 
             isRevealed ? 'EVALUATED' : 'UNLOCKED - READY'}
          </span>
        </div>
        <p className="text-[#A1A1AA] text-sm italic font-light">
          {isRevealed ? `"${snippet}"` : "•••••••••••••••••••••••• (Encrypted)"}
        </p>
      </div>
      
      <div className="flex items-center gap-6">
        {isRevealed && (
          <div className="text-right animate-fade-in">
            <div className="text-[10px] text-[#A1A1AA] uppercase tracking-widest mb-1">AI Verdict Score</div>
            <div className="text-3xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">{evaluation.score}</div>
          </div>
        )}
        
        {!isLocked && !isRevealed && (
          <button 
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="relative overflow-hidden group px-6 py-3 bg-white text-black rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              {isEvaluating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Triggering...
                </>
              ) : 'Unlock & Evaluate'}
            </span>
            {!isEvaluating && (
              <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isConnected, address } = useAccount();

  const { data: capsuleIds } = useReadContract({
    address: VEIN_VAULT_ADDRESS,
    abi: VEIN_VAULT_ABI,
    functionName: "getUserCapsules",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  const { data: userTotalScore } = useReadContract({
    address: VEIN_VAULT_ADDRESS,
    abi: VEIN_VAULT_ABI,
    functionName: "userTotalScore",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAF9] flex flex-col font-sans relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[150px] animate-blob z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full mix-blend-screen filter blur-[150px] animate-blob animation-delay-4000 z-0" />

      <header className="flex items-center justify-between px-8 py-6 w-full mx-auto border-b border-white/5 relative z-10 bg-black/20 backdrop-blur-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium tracking-tight">Dashboard</div>
          {isConnected && (
            <div className="px-4 py-1.5 glass-card rounded-full text-xs font-mono text-[#A1A1AA] shadow-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-12 max-w-5xl mx-auto w-full relative z-10">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-in-up">
          <div className="col-span-1 md:col-span-2 glass-card rounded-3xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <BrainCircuit className="w-40 h-40 text-emerald-400" />
            </div>
            <div className="relative z-10">
              <h2 className="text-[#A1A1AA] font-medium text-xs mb-3 uppercase tracking-[0.2em]">Proof of Conviction</h2>
              <div className="text-7xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-500 drop-shadow-sm">
                {userTotalScore !== undefined ? Number(userTotalScore) : "0"}
              </div>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-[#A1A1AA] relative z-10">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
               <span className="font-light">Reputation computed securely on-chain by Ritual AI.</span>
            </div>
          </div>
          
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between hover:border-white/20 transition-colors">
            <h2 className="text-[#A1A1AA] font-medium text-xs mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Network Status
            </h2>
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-sm text-[#A1A1AA] font-light">Chain</span>
                <span className="text-sm font-medium">Ritual Testnet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#A1A1AA] font-light">AI Precompile</span>
                <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Online
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="text-3xl font-semibold tracking-tight">Your Vault</h2>
            <Link href="/create" className="text-sm glass-card hover:bg-white/10 text-white px-6 py-3 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-md">
              + New Vein
            </Link>
          </div>
          
          <div className="flex flex-col gap-4">
            {!isConnected ? (
              <div className="p-12 text-center text-[#A1A1AA] glass-card rounded-3xl flex flex-col items-center">
                <Lock className="w-8 h-8 mb-4 opacity-50" />
                Please connect your wallet to view capsules.
              </div>
            ) : capsuleIds && (capsuleIds as bigint[]).length > 0 ? (
              (capsuleIds as bigint[]).map((id) => (
                <CapsuleItem key={id.toString()} id={id} />
              ))
            ) : (
              <div className="p-12 text-center text-[#A1A1AA] glass-card rounded-3xl flex flex-col items-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <ArrowLeft className="w-6 h-6 opacity-50 rotate-45" />
                </div>
                No capsules found. Create your first Vein to begin.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
