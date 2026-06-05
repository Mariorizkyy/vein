"use client";

import Link from "next/link";
import { ArrowLeft, BrainCircuit, Activity, Lock, AlertCircle, CheckCircle2, HelpCircle, XCircle, Wallet } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { VEIN_VAULT_ABI } from "../abi";
import { VEIN_VAULT_ADDRESS } from "../config";
import { useState } from "react";
import { parseEther, formatEther } from "viem";

const VERDICT_MAP: Record<number, { label: string; color: string; icon: React.ElementType }> = {
  0: { label: "PENDING",           color: "text-[#A1A1AA] border-white/20 bg-white/5",                           icon: HelpCircle    },
  1: { label: "CORRECT",           color: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]", icon: CheckCircle2  },
  2: { label: "PARTIALLY CORRECT", color: "text-yellow-400  border-yellow-500/50  bg-yellow-500/10  shadow-[0_0_15px_rgba(234,179,8,0.2)]",   icon: AlertCircle   },
  3: { label: "INCORRECT",         color: "text-red-400     border-red-500/50     bg-red-500/10     shadow-[0_0_15px_rgba(239,68,68,0.2)]",    icon: XCircle       },
  4: { label: "UNVERIFIABLE",      color: "text-purple-400  border-purple-500/50  bg-purple-500/10",              icon: HelpCircle    },
};

// Ritual Chain: today's date for AI context
function buildMessagesJson(category: string, content: string): string {
  const today = new Date().toISOString().split("T")[0];
  return JSON.stringify([
    {
      role: "system",
      content:
        `You are an impartial AI fact-checker evaluating user predictions. ` +
        `Today's date is ${today}. ` +
        `Use your knowledge to judge the claim as accurately as possible. ` +
        `Respond ONLY with a JSON object — no markdown, no explanation, no extra text. ` +
        `Format: {"score":<integer 0-100>,"verdict":"<CORRECT|PARTIALLY_CORRECT|INCORRECT|UNVERIFIABLE>"}`,
    },
    {
      role: "user",
      content: `Category: ${category}\nPrediction: ${content}\n\nWas this prediction correct?`,
    },
  ]);
}

// ── RitualWallet Status Widget ────────────────────────────────────────────────
function RitualWalletStatus({ address }: { address: `0x${string}` | undefined }) {
  const { writeContractAsync } = useWriteContract();
  const [isDepositing, setIsDepositing]   = useState(false);
  const [depositError, setDepositError]   = useState<string>();
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositTxHash, setDepositTxHash] = useState<`0x${string}`>();

  const { isSuccess: depositConfirmed } = useWaitForTransactionReceipt({ hash: depositTxHash });

  // Check EOA balance in RitualWallet
  const { data: walletBalance, refetch: refetchBalance } = useReadContract({
    address: VEIN_VAULT_ADDRESS,
    abi: VEIN_VAULT_ABI,
    functionName: "getRitualWalletBalance",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { data: hasEnough, refetch: refetchHasEnough } = useReadContract({
    address: VEIN_VAULT_ADDRESS,
    abi: VEIN_VAULT_ABI,
    functionName: "hasEnoughForEvaluation",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  if (depositConfirmed && depositTxHash) {
    refetchBalance();
    refetchHasEnough();
  }

  const balanceFormatted = walletBalance
    ? parseFloat(formatEther(walletBalance as bigint)).toFixed(4)
    : "0.0000";

  // How many evaluations can they afford?
  const evaluationsLeft = walletBalance
    ? Math.floor(Number(formatEther(walletBalance as bigint)) / 0.35)
    : 0;

  const handleDeposit = async (amount: string) => {
    setIsDepositing(true);
    setDepositError(undefined);
    setDepositSuccess(false);
    try {
      // lockDurationBlocks = 100 blocks (a few minutes on Ritual)
      // This deposits to RitualWallet on behalf of msg.sender (the EOA)
      const txHash = await writeContractAsync({
        address: VEIN_VAULT_ADDRESS,
        abi: VEIN_VAULT_ABI,
        functionName: "depositForFees",
        args: [BigInt(100)], // lock for 100 blocks
        value: parseEther(amount),
      });
      setDepositTxHash(txHash);
      setDepositSuccess(true);
    } catch (err: any) {
      setDepositError(err?.shortMessage ?? err?.message ?? "Deposit failed");
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <h2 className="text-[#A1A1AA] font-medium text-xs uppercase tracking-[0.2em] flex items-center gap-2">
        <Wallet className="w-4 h-4" />
        RitualWallet Balance
      </h2>

      {/* Balance display */}
      <div className="flex items-end justify-between">
        <div>
          <div className={`text-3xl font-bold ${hasEnough ? "text-emerald-400" : "text-yellow-400"}`}>
            {balanceFormatted}
          </div>
          <div className="text-[#A1A1AA] text-xs mt-1">RITUAL available</div>
        </div>
        <div className={`text-right text-sm px-3 py-1.5 rounded-full border ${
          evaluationsLeft > 0
            ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
            : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
        }`}>
          {evaluationsLeft} eval{evaluationsLeft !== 1 ? "s" : ""} left
        </div>
      </div>

      {/* Fee info */}
      <div className="text-[10px] text-[#A1A1AA] bg-white/5 rounded-xl px-3 py-2.5 flex flex-col gap-1">
        <span>📌 0.35 RITUAL per evaluation (LLM inference fee)</span>
        <span>📌 Deposit locks for 100 blocks, then auto-released</span>
      </div>

      {/* Deposit buttons */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] text-[#A1A1AA] uppercase tracking-widest">Top up</p>
        <div className="grid grid-cols-3 gap-2">
          {["0.35", "0.70", "1.05"].map((amt) => (
            <button
              key={amt}
              onClick={() => handleDeposit(amt)}
              disabled={isDepositing}
              className="py-2 glass-card hover:bg-white/10 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {amt}
            </button>
          ))}
        </div>
        <p className="text-[#A1A1AA] text-[10px] text-center">
          0.35 = 1 eval · 0.70 = 2 evals · 1.05 = 3 evals
        </p>
      </div>

      {depositSuccess && !isDepositing && (
        <p className="text-emerald-400 text-xs flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Deposited to RitualWallet
        </p>
      )}
      {depositError && (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {depositError}
        </p>
      )}
    </div>
  );
}

// ── Capsule Item ──────────────────────────────────────────────────────────────
function CapsuleItem({ id }: { id: bigint }) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const { data: capsuleData, isLoading, refetch } = useReadContract({
    address: VEIN_VAULT_ADDRESS,
    abi: VEIN_VAULT_ABI,
    functionName: "capsules",
    args: [id],
  });

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalTxHash,   setEvalTxHash]   = useState<`0x${string}`>();
  const [evalError,    setEvalError]    = useState<string>();

  const { isSuccess: evalConfirmed } = useWaitForTransactionReceipt({ hash: evalTxHash });
  if (evalConfirmed && evalTxHash) refetch();

  // Check if EOA has enough RitualWallet balance before evaluating
  const { data: hasEnough } = useReadContract({
    address: VEIN_VAULT_ADDRESS,
    abi: VEIN_VAULT_ABI,
    functionName: "hasEnoughForEvaluation",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  if (isLoading || !capsuleData) {
    return <div className="p-6 bg-white/5 border border-white/5 rounded-2xl animate-pulse h-24" />;
  }

  const [, , category, , unlockTimestamp, content, isRevealed, evaluation] = capsuleData as any;

  // Ritual Testnet: block.timestamp is milliseconds
  const isLocked = Number(unlockTimestamp) > Date.now();
  const unlockDate = new Date(Number(unlockTimestamp)).toLocaleDateString();

  const verdictInfo = VERDICT_MAP[Number(evaluation.verdict)] ?? VERDICT_MAP[0];
  const VerdictIcon = verdictInfo.icon;

  const handleEvaluate = async () => {
    if (!address) return;
    setIsEvaluating(true);
    setEvalError(undefined);
    try {
      const messagesJson = buildMessagesJson(category, content);
      const txHash = await writeContractAsync({
        address: VEIN_VAULT_ADDRESS,
        abi: VEIN_VAULT_ABI,
        functionName: "triggerUnlockAndEvaluate",
        args: [id, messagesJson, [], [], "0x"] as any,
      });
      setEvalTxHash(txHash);
    } catch (err: any) {
      console.error(err);
      setEvalError(err?.shortMessage ?? err?.message ?? "Unknown error");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-6 glass-card hover:-translate-y-1 rounded-2xl transition-all duration-300 gap-4">
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium">{category}</span>
          {isLocked ? (
            <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/30 text-blue-400 bg-blue-500/10">
              Unlocks {unlockDate}
            </span>
          ) : isRevealed ? (
            <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1.5 ${verdictInfo.color}`}>
              <VerdictIcon className="w-3 h-3" />
              {verdictInfo.label}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-yellow-500/50 text-yellow-400 bg-yellow-500/10 animate-pulse">
              READY TO EVALUATE
            </span>
          )}
        </div>
        <p className="text-[#A1A1AA] text-sm italic font-light truncate">
          {isRevealed || !isLocked ? `"${content}"` : "•••••••••••••••••••••••• (Encrypted)"}
        </p>
        {evalError && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" /> {evalError}
          </p>
        )}
        {/* Warn if not enough balance */}
        {!isLocked && !isRevealed && !hasEnough && (
          <p className="text-yellow-400 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            Top up RitualWallet with 0.35 RITUAL before evaluating
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 shrink-0">
        {isRevealed && (
          <div className="text-right">
            <div className="text-[10px] text-[#A1A1AA] uppercase tracking-widest mb-1">AI Score</div>
            <div className={`text-3xl font-bold ${
              Number(evaluation.score) >= 70 ? "text-emerald-400" :
              Number(evaluation.score) >= 40 ? "text-yellow-400"  : "text-red-400"
            }`}>
              {Number(evaluation.score)}
            </div>
          </div>
        )}

        {!isLocked && !isRevealed && (
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !hasEnough}
            className="px-6 py-3 bg-white text-black rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
          >
            {isEvaluating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Evaluating…
              </span>
            ) : !hasEnough ? "Need 0.35 RITUAL" : "Unlock & Evaluate"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { isConnected, address } = useAccount();

  const { data: convictionScore } = useReadContract({
    address: VEIN_VAULT_ADDRESS,
    abi: VEIN_VAULT_ABI,
    functionName: "getConvictionScore",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: capsuleIds } = useReadContract({
    address: VEIN_VAULT_ADDRESS,
    abi: VEIN_VAULT_ABI,
    functionName: "getUserCapsules",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAF9] flex flex-col font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[150px] animate-blob z-0" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full mix-blend-screen filter blur-[150px] animate-blob animation-delay-4000 z-0" />

      <header className="flex items-center justify-between px-8 py-6 w-full border-b border-white/5 relative z-10 bg-black/20 backdrop-blur-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium">Dashboard</div>
          {isConnected && (
            <div className="px-4 py-1.5 glass-card rounded-full text-xs font-mono text-[#A1A1AA]">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-12 max-w-5xl mx-auto w-full relative z-10">

        {/* Stats row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Conviction Score */}
          <div className="col-span-1 md:col-span-2 glass-card rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <BrainCircuit className="w-40 h-40 text-emerald-400" />
            </div>
            <div className="relative z-10">
              <h2 className="text-[#A1A1AA] font-medium text-xs mb-3 uppercase tracking-[0.2em]">Proof of Conviction</h2>
              <div className="text-7xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-neutral-500">
                {convictionScore !== undefined ? Number(convictionScore) : "0"}
              </div>
              <p className="text-[#A1A1AA] text-xs mt-2">Average score across all evaluated capsules</p>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-[#A1A1AA] relative z-10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Reputation computed securely on-chain by Ritual AI.
            </div>
          </div>

          {/* Network + RitualWallet */}
          <div className="flex flex-col gap-4">
            {/* Network status */}
            <div className="glass-card rounded-3xl p-5 flex flex-col gap-3">
              <h2 className="text-[#A1A1AA] font-medium text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity className="w-4 h-4" /> Network
              </h2>
              <div className="flex justify-between text-sm pb-2 border-b border-white/5">
                <span className="text-[#A1A1AA]">Chain</span>
                <span className="font-medium">Ritual Testnet</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#A1A1AA]">AI Precompile</span>
                <span className="text-emerald-400 flex items-center gap-2 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Online
                </span>
              </div>
            </div>

            {/* RitualWallet status */}
            {isConnected && address ? (
              <RitualWalletStatus address={address} />
            ) : (
              <div className="glass-card rounded-3xl p-5 text-center text-[#A1A1AA] text-sm flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4" /> Connect wallet to top up fees
              </div>
            )}
          </div>
        </section>

        {/* Capsules */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="text-3xl font-semibold tracking-tight">Your Vault</h2>
            <Link href="/create" className="text-sm glass-card hover:bg-white/10 text-white px-6 py-3 rounded-full font-medium transition-all hover:scale-105 active:scale-95">
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
                No capsules yet. Create your first Vein to begin.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
