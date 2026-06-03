"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, Calendar, PenTool } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";

const CATEGORIES = [
  "Market Thesis",
  "Startup Thesis",
  "Personal Goal",
  "Future Letter",
  "Opinion",
  "Custom",
];

import { VEIN_VAULT_ADDRESS } from "../config";
import { VEIN_VAULT_ABI } from "../abi";

export default function CreateCapsule() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [isLocking, setIsLocking] = useState(false);

  const handleLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    setIsLocking(true);
    try {
      const unlockTimestamp = Math.floor(new Date(unlockDate).getTime() / 1000);
      
      const txHash = await writeContractAsync({
        address: VEIN_VAULT_ADDRESS,
        abi: VEIN_VAULT_ABI,
        functionName: "createCapsule",
        args: [category, unlockTimestamp, content], // Using raw content for MVP
      });
      
      alert(`Capsule locked successfully! TX: ${txHash}`);
    } catch (err: any) {
      console.error(err);
      alert(`Error locking capsule: ${err.message}`);
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAF9] flex flex-col font-sans">
      <header className="flex items-center justify-between px-8 py-6 w-full mx-auto border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="text-sm font-medium tracking-tight">Create Vein</div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-12 max-w-2xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Record your conviction</h1>
          <p className="text-[#A1A1AA]">Draft a thesis or belief. It will be encrypted and time-locked until your chosen date.</p>
        </div>

        <form onSubmit={handleLock} className="flex flex-col gap-8">
          {/* Category Selection */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                    category === cat 
                      ? "border-white bg-white text-black" 
                      : "border-white/10 bg-white/5 text-[#A1A1AA] hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-[#A1A1AA]">Your Belief</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. I believe that autonomous agents will account for 30% of all blockchain transactions by 2027..."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all resize-none"
              required
            />
          </div>

          {/* Unlock Date */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-[#A1A1AA] flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Unlock Date
            </label>
            <input 
              type="date" 
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full md:w-1/2 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-white/30 transition-all [&::-webkit-calendar-picker-indicator]:invert"
              required
            />
            <p className="text-xs text-neutral-500">The capsule will remain completely hidden and encrypted until this date.</p>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={isLocking || !content || !unlockDate}
            className="mt-4 flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-xl text-base font-medium hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLocking ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Encrypting & Locking...
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Time-Lock Capsule
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
