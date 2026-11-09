# JoobEscrow

A non-custodial escrow protocol for P2P, OTC and freelance deals in USDT and USDC, built on **BNB Smart Chain (BSC)**.

A client locks USDT or USDC in a smart contract, the provider delivers, the client releases. Nobody in the middle can send the funds anywhere else. In a dispute, the 3-of-5 Safe multisig can only split the locked funds between client and provider.

- Website: https://www.joobescrow.com
- Try a real $1 escrow (0% fee demo): https://www.joobescrow.com/try
- Security, audit, KYC and all addresses: https://www.joobescrow.com/security
- X: https://x.com/JoobEscrow
- Telegram: https://t.me/JoobEscrow_Official

## Technology Stack

- **Blockchain**: BNB Smart Chain
- **Smart Contracts**: Solidity ^0.8.20
- **Frontend**: Next.js 16 (React 19) + ethers.js v6, Reown AppKit (WalletConnect)
- **Development**: Hardhat and Foundry, OpenZeppelin libraries (Ownable2Step, ReentrancyGuard, SafeERC20)
- **Messaging**: XMTP (wallet-to-wallet chat between parties)
- **Infrastructure**: Cloudflare Workers (alerts and stats), Vercel (hosting)

## Supported Networks

- **BNB Smart Chain Mainnet** (Chain ID: 56)
- **BNB Smart Chain Testnet** (Chain ID: 97), development only

All JoobEscrow smart contracts are deployed on BNB Smart Chain only (see `contracts/hardhat.config.js`). The other EVM networks listed in the frontend wallet config (Ethereum, Arbitrum, Base, Polygon, Optimism, Avalanche) are only payment sources: a buyer can pay from them, and the payment is bridged (LI.FI) to our presale contract on BNB Smart Chain.

## Contract Addresses

| Network | Core Contract (Escrow) | Token Contract (JOOB) | Presale / Staking |
|---------|------------------------|-----------------------|-------------------|
| BNB Mainnet | [0x56c2227E06dBC16062179Be397839b101a8e58c7](https://bscscan.com/address/0x56c2227E06dBC16062179Be397839b101a8e58c7) | [0x4bf3D2a4d88109bBb6340f3f1B88bD0Aa17c10E2](https://bscscan.com/address/0x4bf3D2a4d88109bBb6340f3f1B88bD0Aa17c10E2) | [0xd3F3598Ff8efB2cF6643488e66e8df683804F63d](https://bscscan.com/address/0xd3F3598Ff8efB2cF6643488e66e8df683804F63d) / [0x7949528182876027b1F4B2e43E3a46eb2dADD32b](https://bscscan.com/address/0x7949528182876027b1F4B2e43E3a46eb2dADD32b) |

All mainnet contracts (BNB Smart Chain, verified on BscScan):

| Contract | Address |
|---|---|
| Escrow, 5% fee | [0x56c2227E06dBC16062179Be397839b101a8e58c7](https://bscscan.com/address/0x56c2227E06dBC16062179Be397839b101a8e58c7) |
| Escrow, 3% fee | [0x3EEEA456daCF2247CB0023a70923E60C3E13D6C3](https://bscscan.com/address/0x3EEEA456daCF2247CB0023a70923E60C3E13D6C3) |
| Escrow, 2% fee | [0x7986Bd37C4DA6d1822958fCB97E7a284b40DD7Cc](https://bscscan.com/address/0x7986Bd37C4DA6d1822958fCB97E7a284b40DD7Cc) |
| Escrow, demo (0% fee) | [0x28b80688749958241E14Fa8181274AE0E649eC0B](https://bscscan.com/address/0x28b80688749958241E14Fa8181274AE0E649eC0B) |
| Escrow, legacy 8% (closed to new deals) | [0xa45f887b938a08B295A5b96b6559600632F09Ab0](https://bscscan.com/address/0xa45f887b938a08B295A5b96b6559600632F09Ab0) |
| Escrow, legacy 10% (closed to new deals) | [0xD5B180580D183A7A9278118312207bc8a9C9f89E](https://bscscan.com/address/0xD5B180580D183A7A9278118312207bc8a9C9f89E) |
| JOOB token | [0x4bf3D2a4d88109bBb6340f3f1B88bD0Aa17c10E2](https://bscscan.com/address/0x4bf3D2a4d88109bBb6340f3f1B88bD0Aa17c10E2) |
| JOOB presale (with vesting) | [0xd3F3598Ff8efB2cF6643488e66e8df683804F63d](https://bscscan.com/address/0xd3F3598Ff8efB2cF6643488e66e8df683804F63d) |
| JOOB staking | [0x7949528182876027b1F4B2e43E3a46eb2dADD32b](https://bscscan.com/address/0x7949528182876027b1F4B2e43E3a46eb2dADD32b) |
| Treasury vesting | [0x8cbac3786F61572D4571C951e9215FC289FB2ff3](https://bscscan.com/address/0x8cbac3786F61572D4571C951e9215FC289FB2ff3) |
| Team vesting | [0xc430f8C4E26FFc25326C4AA84947B3e2A1328012](https://bscscan.com/address/0xc430f8C4E26FFc25326C4AA84947B3e2A1328012) |
| 3-of-5 Safe (owner of all escrows) | [0x872F979aa868145bE3c3A6EA787614BE2A18C7f7](https://bscscan.com/address/0x872F979aa868145bE3c3A6EA787614BE2A18C7f7) |

## Features

- Escrow in USDT and USDC (BEP-20), from $1 to $100,000 per deal, with low gas costs on BNB Chain
- Fee by deal size, paid by the provider only: 5% under $1,000, 3% from $1,000, 2% from $10,000
- Provider acceptance: the client can cancel freely until the provider accepts
- Timeout: once accepted, the provider can claim after the deadline if the client neither releases nor disputes
- Disputes: evidence hashes anchored on-chain by both parties, split resolution (0 to 100% to the provider) by the 3-of-5 Safe
- Stale disputes: if a dispute is left unresolved, either party can trigger a 50/50 split
- Security with a 2-day timelock on fee and parameter changes, and a pause that never blocks withdrawals or dispute resolution
- Pull-over-push payments: funds are credited, then withdrawn by their owner
- Wallet-to-wallet chat between parties (XMTP) and shareable deal links

## Security

- Smart contract audit and team KYC by SpyWolf. Audit report: [Universal_Service_Escrow_V4_Audit.pdf](Universal_Service_Escrow_V4_Audit.pdf)
- All escrows owned by a 3-of-5 Safe multisig
- Team and treasury tokens vested on-chain, listing liquidity locked on PinkLock
- Full details: https://www.joobescrow.com/security

## Repository Structure

```
contracts/   Escrow smart contract (src/), tests (test/), deploy scripts (scripts/), hardhat.config.js (BSC networks)
frontend/    Next.js web app (www.joobescrow.com)
workers/     Cloudflare Workers for presale alerts and stats
```

## Run Locally

Requirements: Node.js 20 to 22.

Contracts:

```bash
cd contracts
npm install
npx hardhat test
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The app opens on http://localhost:3000 and reads the mainnet contracts listed above. Copy `contracts/.env.example` to `contracts/.env` only to deploy your own instance. Never commit a private key.

## License

Smart contracts: MIT (see SPDX headers). Other files: all rights reserved.
