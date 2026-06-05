"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { injected, metaMask } from "wagmi/connectors";
import { useState } from "react";

// ── Ritual Chain (official config from docs.ritualfoundation.org) ────────────
// FIX 1: nativeCurrency symbol is "RITUAL", not "ETH"
// FIX 2: correct RPC URL is https://rpc.ritualfoundation.org
// FIX 3: added defineChain for proper viem support
export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual Chain",
  nativeCurrency: {
    name: "RITUAL",
    symbol: "RITUAL",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.ritualfoundation.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Ritual Explorer",
      url: "https://explorer.ritualfoundation.org",
    },
  },
  // Ritual Testnet quirk: block.timestamp is in milliseconds, not seconds
  // This is important for time-lock logic — keep this comment as a reminder
});

export const wagmiConfig = createConfig({
  chains: [ritualChain],
  connectors: [
    injected(),       // MetaMask, Rabby, etc.
    metaMask(),       // explicit MetaMask deeplink for mobile
  ],
  transports: {
    [ritualChain.id]: http("https://rpc.ritualfoundation.org", {
      // Retry up to 3x on network errors — Ritual testnet can be flaky
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Re-fetch every 15s so UI stays in sync after tx confirms
            refetchInterval: 15_000,
            staleTime: 10_000,
          },
        },
      })
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
