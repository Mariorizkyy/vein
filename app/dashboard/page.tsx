"use client";

import Link from "next/link";
import { ArrowLeft, BrainCircuit, Activity, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
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
  const isLocked = Number(unlockTimestamp) > Math.floor(Date.now() / 1000);
  
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
          address,
          '[{"role":"user","content":"Evaluate this thesis based on reality."}]',
          [], // empty encryptedSecrets for MVP
          [], // empty secretSignatures for MVP
          "0x"
        ],
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
    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
      <div className="flex flex-col gap-1 mb-4 md:mb-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{category}</span>
          <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
            isLocked ? 'border-neutral-500 text-neutral-400' : 
            isRevealed ? 'border-green-500/50 text-green-400 bg-green-500/10' :
            'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
          }`}>
            {isLocked ? `Unlocks ${new Date(Number(unlockTimestamp) * 1000).toLocaleDateString()}` : 
             isRevealed ? 'EVALUATED' : 'UNLOCKED - READY'}
          </span>
        </div>
        <p className="text-[#A1A1AA] text-sm">"{snippet}"</p>
      </div>
      
      <div className="flex items-center gap-4">
        {isRevealed && (
          <div className="text-right">
            <div className="text-xs text-[#A1A1AA] uppercase tracking-widest">Score</div>
            <div className="text-xl font-semibold">{evaluation.score}</div>
          </div>
        )}
        
        {!isLocked && !isRevealed && (
          <button 
            onClick={handleEvaluate}
            disabled={isEvaluating}
            className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isEvaluating ? 'Triggering...' : 'Unlock & Evaluate'}
          </button>
        )}
        {(isLocked || isRevealed) && (
          <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors">
             View Details
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
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <BrainCircuit className="w-32 h-32" />
            </div>
            <div>
              <h2 className="text-[#A1A1AA] font-medium text-sm mb-2 uppercase tracking-widest">Proof of Conviction</h2>
              <div className="text-7xl font-semibold tracking-tighter">
                {userTotalScore !== undefined ? Number(userTotalScore) : "0"}
              </div>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-[#A1A1AA]">
               <span className="text-white font-medium">Reputation computed directly on-chain by Ritual AI.</span>
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
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Your Capsules</h2>
            <Link href="/create" className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-neutral-200 transition-colors">
              New Vein
            </Link>
          </div>
          
          <div className="flex flex-col gap-4">
            {!isConnected ? (
              <div className="p-8 text-center text-[#A1A1AA] border border-white/5 rounded-2xl">
                Please connect your wallet to view capsules.
              </div>
            ) : capsuleIds && (capsuleIds as bigint[]).length > 0 ? (
              (capsuleIds as bigint[]).map((id) => (
                <CapsuleItem key={id.toString()} id={id} />
              ))
            ) : (
              <div className="p-8 text-center text-[#A1A1AA] border border-white/5 rounded-2xl">
                No capsules found. Create one to begin.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
