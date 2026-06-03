"use client";

import { useState } from "react";
import { Lock, PenTool, Calendar, ArrowLeft } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import Link from "next/link";
import { VEIN_VAULT_ADDRESS } from "../config";
import { VEIN_VAULT_ABI } from "../abi";

export default function CreateVein() {
  const [category, setCategory] = useState("Crypto Price");
  const [content, setContent] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [isLocking, setIsLocking] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}`>();

  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockDate || !content) return;
    
    setIsLocking(true);
    try {
      // Ritual Testnet quirk: block.timestamp is in milliseconds, NOT seconds!
      const unlockTimestamp = BigInt(new Date(unlockDate).getTime());
      
      const hash = await writeContractAsync({
        address: VEIN_VAULT_ADDRESS,
        abi: VEIN_VAULT_ABI,
        functionName: "createCapsule",
        args: [category, unlockTimestamp, content], // Using raw content for MVP
      });
      
      setTxHash(hash);
    } catch (err: any) {
      console.error(err);
      alert(`Error locking capsule: ${err.message}`);
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAF9] flex flex-col font-sans relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob z-0" />

      <header className="flex items-center justify-between px-8 py-6 w-full mx-auto border-b border-white/5 relative z-10 bg-black/20 backdrop-blur-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="font-extrabold text-lg tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-white">V E I N</div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="glass-card rounded-3xl p-8 md:p-12 w-full max-w-2xl animate-fade-in-up">
          {!isConfirmed ? (
            <>
              <div className="mb-10 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <PenTool className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight mb-3">Seal a New Belief</h1>
                <p className="text-[#A1A1AA]">Lock your prediction on-chain for future AI evaluation.</p>
              </div>

              <form onSubmit={handleLock} className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#A1A1AA] uppercase tracking-widest flex items-center gap-2">
                    Category
                  </label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input rounded-xl p-4 text-sm w-full appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23A1A1AA%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:1.2em_1.2em]"
                  >
                    <option value="Crypto Price">Crypto Price</option>
                    <option value="Technology">Technology</option>
                    <option value="Politics">Politics</option>
                    <option value="Personal">Personal Goal</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#A1A1AA] uppercase tracking-widest flex items-center gap-2">
                    Your Belief / Prediction
                  </label>
                  <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="e.g. Bitcoin will surpass $150k by the end of 2026..."
                    className="glass-input rounded-xl p-4 text-sm h-32 resize-none w-full"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-[#A1A1AA] uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Unlock Date
                  </label>
                  <input 
                    type="datetime-local" 
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    className="glass-input rounded-xl p-4 text-sm w-full md:w-1/2 [&::-webkit-calendar-picker-indicator]:invert"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isLocking || isConfirming || !isConnected}
                  className="mt-4 relative group w-full py-4 bg-white text-black rounded-xl font-medium text-lg overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {(isLocking || isConfirming) ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isConfirming ? "Confirming on-chain..." : "Locking on-chain..."}
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Time-Lock Capsule
                      </>
                    )}
                  </span>
                  {(!isLocking && !isConfirming) && (
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  )}
                </button>
                {!isConnected && (
                  <p className="text-center text-red-400 text-sm mt-2">Please connect your wallet first.</p>
                )}
              </form>
            </>
          ) : (
            <div className="text-center py-12 flex flex-col items-center animate-fade-in">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                <Lock className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-semibold mb-4 text-green-400">Capsule Locked!</h2>
              <p className="text-[#A1A1AA] mb-8">Your belief has been cryptographically sealed.</p>
              
              <div className="flex gap-4">
                <a 
                  href={`https://explorer.ritualfoundation.org/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
                >
                  View Transaction Proof
                </a>
                <Link 
                  href="/dashboard"
                  className="px-6 py-3 bg-white text-black hover:bg-neutral-200 rounded-full text-sm font-medium transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
