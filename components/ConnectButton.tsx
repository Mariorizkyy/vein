"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { useEffect, useState } from "react";

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (isConnected) {
    return (
      <button 
        onClick={() => disconnect()}
        className="text-white bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full transition-colors text-sm font-medium"
      >
        {address?.slice(0,6)}...{address?.slice(-4)}
      </button>
    );
  }

  return (
    <button 
      onClick={() => connect({ connector: injected() })}
      className="text-white bg-white/10 hover:bg-white/15 px-4 py-2 rounded-full transition-colors text-sm font-medium"
    >
      Connect Wallet
    </button>
  );
}
