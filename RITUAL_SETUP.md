# Ritual Network Setup Guide

## 1. Tambah Ritual Testnet ke Wallet (MetaMask/Rabby)

| Field | Value |
|---|---|
| Network Name | Ritual Chain |
| RPC URL | https://rpc.ritualfoundation.org |
| Chain ID | 1979 |
| Currency Symbol | RITUAL |
| Block Explorer | https://explorer.ritualfoundation.org |

---

## 2. Dapatkan Token Testnet

Faucet: **https://faucet.ritualfoundation.org**

Connect wallet → klik "Request Tokens" → tunggu ~30 detik.

---

## 3. Setup Environment

```bash
cp .env.example .env
# Edit .env, isi PRIVATE_KEY dengan private key wallet kamu
```

---

## 4. Install Dependencies

```bash
npm install
```

---

## 5. Deploy Contract

```bash
npx hardhat run scripts/deploy.ts --network ritual
```

Output yang diharapkan:
```
✅ VeinVault deployed!
Contract address : 0x...
Tx hash          : 0x...
✅ app/config.ts updated with new address
```

---

## 6. Fund RitualWallet untuk Inference Fees

⚠️ **Wajib** sebelum bisa trigger evaluasi AI.

Cara 1 — lewat Dashboard (mudah):
- Buka app → Dashboard → klik **"Deposit 0.01 RITUAL for fees"**

Cara 2 — lewat Hardhat console:
```bash
npx hardhat console --network ritual
```
```javascript
const vault = await ethers.getContractAt("VeinVault", "0xALAMAT_CONTRACT")
await vault.depositForFees(86400, { value: ethers.parseEther("0.05") })
```

---

## 7. Jalankan Frontend

```bash
npm run dev
```

Buka http://localhost:3000

---

## ⚠️ Ritual Testnet Quirks

### block.timestamp dalam Milliseconds!
Ritual Testnet menggunakan `block.timestamp` dalam **milliseconds**, bukan detik seperti EVM biasa.

Dampaknya di kode:
- `createCapsule`: kirim timestamp dalam ms → `BigInt(new Date(date).getTime())` ✅
- `triggerUnlockAndEvaluate`: cek `block.timestamp >= unlockTimestamp` juga dalam ms ✅
- Frontend `isLocked`: `Number(unlockTimestamp) > Date.now()` (Date.now() sudah ms) ✅

Kalau deploy ke mainnet EVM lain, **harus ubah** ke detik:
```typescript
// Untuk EVM biasa (detik):
const unlockTimestamp = BigInt(Math.floor(new Date(date).getTime() / 1000))

// Untuk Ritual Testnet (milliseconds):
const unlockTimestamp = BigInt(new Date(date).getTime())
```

### Native Currency adalah RITUAL, bukan ETH
Gas token di Ritual adalah **RITUAL**, bukan ETH. Pastikan wallet kamu punya RITUAL dari faucet.

### Inference bisa lambat
LLM inference via precompile `0x0802` bisa memakan waktu **10–60 detik**. Jangan panic kalau tx pending lama — ini normal.

### RitualWallet harus di-fund sebelum inference
Setiap kali `triggerUnlockAndEvaluate` dipanggil, contract butuh balance di RitualWallet. Kalau deposit habis, tx akan revert dengan "Deposit failed".

---

## Troubleshooting

| Error | Penyebab | Fix |
|---|---|---|
| `Precompile call failed` | RitualWallet kosong | Deposit fees dulu |
| `Capsule is time-locked` | Timestamp belum lewat | Tunggu waktu unlock |
| tx stuck / never confirms | RPC overload | Retry atau tunggu |
| `nonce too low` | tx gagal tapi nonce increment | Reset account di MetaMask |
| `insufficient funds` | Kurang RITUAL untuk gas | Claim dari faucet |
