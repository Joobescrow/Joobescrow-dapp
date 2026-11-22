---
name: joobescrow
description: "Escrow on BNB Chain for deals between agents or people. Check a counterparty's on-chain track record, check an escrow, and request a payment through a non-custodial escrow link."
---
# JoobEscrow Skill

JoobEscrow is a non-custodial escrow live on BNB Chain (USDT and USDC). A client locks the payment in an audited smart contract, the provider accepts and delivers, and the client releases the funds. A 3-of-5 Safe multisig owns the contracts and only settles disputes. Clients pay 0%. Providers pay 5% under $1,000, 3% from $1,000 to $9,999.99 and 2% from $10,000.

Use this skill when a job has a deliverable (an audit, a report, a design, a campaign, an OTC trade) and the payment should only be released on delivery, or when you need to check a counterparty before paying or working for it.

All tools below are read-only. This skill never moves funds and never needs a private key. Base API: https://api.joobescrow.com (public, no key, JSON).

## Tool: check_counterparty

Check the on-chain JoobEscrow track record of a wallet before paying it, hiring it or working for it.

### Parameters
- `address`: the counterparty's BNB Chain wallet address (0x...)

### Execution
```bash
curl -s "https://api.joobescrow.com/reputation?address=<address>"
```
Report `completedDeals`, `volumeCompleted` (USD), `counterparties`, `disputes` and `firstDealAt`, and give the `profileUrl`. A wallet with no history is not a red flag by itself, but say so clearly. The $1 demo is not counted.

## Tool: request_payment_for_me

Create a payment request link so that someone pays this agent through an escrow, released on delivery.

### Parameters
- `amount`: optional, from 1 to 100000, two decimals at most. Without it, the payer enters the amount.
- `token`: `USDT` (default) or `USDC`
- `ref`: optional reference for the job, letters, numbers, spaces, dots, hyphens and underscores, 64 characters at most. It is stored publicly on-chain.

### Execution
1. Get this agent's wallet address:
```bash
purr wallet address --chain-type ethereum
```
2. Build the link with that address as provider:
```bash
curl -s "https://api.joobescrow.com/paylink?provider=<agent_address>&amount=<amount>&token=<token>&ref=<ref>"
```
3. Send the returned `url` to the payer. The payer opens it on joobescrow.com, checks the details and locks the funds with their own wallet. Tell the user the escrow fee (5%, 3% or 2% depending on the amount) is deducted from what this agent receives.

## Tool: create_payment_link

Create a payment request link for a provider the user names (a freelancer, another agent, a seller).

### Parameters
- `provider`: the wallet that will receive the payment
- `amount`, `token`, `ref`: as above
- `category`: optional, only changes the words shown on the page (talent, pro, dev, influence, trade, otc, art, audit, domain, gaming, music, cm, bounty, prime, realestate, mergers)

### Execution
```bash
curl -s "https://api.joobescrow.com/paylink?provider=<provider>&amount=<amount>&token=<token>&category=<category>&ref=<ref>"
```
Return the `url`. The user opens it and locks the funds with their own wallet on joobescrow.com.

## Tool: check_escrow

Check the status of an existing escrow.

### Parameters
- `contract` and `id`, taken from a deal link such as `https://www.joobescrow.com/deal/pro/10?c=<contract>` (here `id` is 10)

### Execution
```bash
curl -s "https://api.joobescrow.com/deal?contract=<contract>&id=<id>"
```
Report `status` (funded, completed, disputed, resolved, cancelled), `amount`, `token`, `accepted`, `deadline` (unix time), `client` and `provider`, and give the `url`.

## Tool: get_fees

### Execution
```bash
curl -s "https://api.joobescrow.com/fees"
```

## Safety rules
- Never send tokens directly to an escrow contract address with `purr wallet transfer`: funds sent that way are not attached to any escrow. Escrows are only created through joobescrow.com.
- Never ask for a seed phrase or a private key.
- The only official site is https://www.joobescrow.com and the only official Telegram channels are https://t.me/joobescrow_channel and https://t.me/joobescrow_group. Human users can also use the read-only bot https://t.me/JoobEscrowBot.
- Do not promise a price, a return or a listing date for the JOOB token.

More details for agents: https://www.joobescrow.com/agents.md
