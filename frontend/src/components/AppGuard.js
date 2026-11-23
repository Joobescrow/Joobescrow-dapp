'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useWeb3 } from '../context/Web3Context';

// Pages consultables sans wallet (profils publics des partenaires KOL, roadmap, vue des categories, page /pay, et liens de paiement ou d'invitation ?pay= / ?escrow=).
const PUBLIC_PATH = /^\/([^/]+\/(kol\/[^/]+|whats-next)|app|pay|pay-button)\/?$/;

function AppGuardContent({ children }) {
  const { account, error, isTestnet, connectWallet, chainId, ensureCorrectChain } = useWeb3();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const hasPayOrEscrow = Boolean(searchParams?.has('pay') || searchParams?.has('escrow'));
  // Alerte uniquement si le wallet connecte est sur une autre chaine que BNB Smart Chain (56).
  const wrongNetwork = Boolean(account) && chainId !== null && chainId !== 56 && !isTestnet;
  const isPublic = PUBLIC_PATH.test(pathname) || hasPayOrEscrow;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {isTestnet && (
        <div style={{ background: '#ef4444', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
          You are on BSC Testnet. Funds used are not real.
        </div>
      )}
      {wrongNetwork && (
        <div className="network-alert" role="alert">
          <span>Wrong network: your wallet is not on BNB Smart Chain.</span>
          <button type="button" onClick={() => ensureCorrectChain().catch(() => {})}>Switch to BNB Smart Chain</button>
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', textAlign: 'center', borderBottom: '1px solid #ef4444' }}>
          {error}
        </div>
      )}
      {!account && !isPublic ? (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div className="glass-panel connect-card">
            <div className="connect-icon" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="connect-title">Connect your <span className="text-gradient">wallet</span></h2>
            <p className="connect-text">
              Connect your wallet or sign in with email or Google to access the dashboard, manage your escrows and secure your payments.
            </p>
            <ul className="connect-points">
              <li>Funds locked in an audited contract</li>
              <li>0% fee for the client</li>
              <li>We never ask for your seed phrase</li>
            </ul>
            <button className="btn btn-primary btn-lg" onClick={connectWallet}>
              Connect Wallet
            </button>
            <div className="connect-powered">Email, Google or 700+ wallets via Reown</div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function AppGuard({ children }) {
  return (
    <Suspense fallback={<div style={{ flex: 1 }}>{children}</div>}>
      <AppGuardContent>{children}</AppGuardContent>
    </Suspense>
  );
}
