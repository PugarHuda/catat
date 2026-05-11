import { useEffect, useRef, useState } from 'react';
import {
  useCurrentAccount,
  useConnectWallet,
  useDisconnectWallet,
  useWallets,
} from '@mysten/dapp-kit';
import { formatMist, useWalSwap } from '@/lib/useWalSwap';
import { suiscanTx } from '@/lib/contract';

export default function WalletButton() {
  const account = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connect, isPending: connecting } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const { balances, swap, state: swapState } = useWalSwap();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!account) {
    if (wallets.length === 0) {
      return (
        <a
          href="https://chromewebstore.google.com/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm"
          title="Install a Sui wallet to connect"
        >
          install wallet ↗
        </a>
      );
    }

    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="btn btn-primary btn-sm"
          disabled={connecting}
        >
          {connecting ? 'connecting…' : 'connect wallet'} ▾
        </button>
        {open && (
          <PaperPopup>
            <div className="popup-section">choose wallet</div>
            {wallets.map(w => (
              <button
                key={w.name}
                type="button"
                onClick={() => {
                  connect({ wallet: w });
                  setOpen(false);
                }}
                className="popup-item"
              >
                {w.icon && <img src={w.icon} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />}
                <span>{w.name}</span>
              </button>
            ))}
          </PaperPopup>
        )}
      </div>
    );
  }

  const short = `${account.address.slice(0, 6)}…${account.address.slice(-4)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="wallet-pill"
        style={{ cursor: 'pointer' }}
      >
        <span className="dot" />
        {short}
        <span style={{ marginLeft: 4, fontFamily: 'var(--type)', fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <PaperPopup>
          <div className="popup-section">connected · sui testnet</div>
          <button type="button" onClick={copy} className="popup-item">
            <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{short}</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--type)', fontSize: 10, color: copied ? 'var(--marker-green)' : 'var(--pencil)' }}>
              {copied ? '✓ copied' : 'copy'}
            </span>
          </button>

          <div className="popup-section">balances</div>
          <BalanceRow
            label="SUI"
            value={balances ? `${formatMist(balances.sui)} SUI` : '…'}
            warn={!!balances && balances.sui < 100_000_000n}
            warnHint={'Get from faucet.sui.io'}
            link={'https://faucet.sui.io/'}
          />
          <BalanceRow
            label="WAL"
            value={balances ? `${formatMist(balances.wal)} WAL` : '…'}
            warn={!!balances && balances.wal < 50_000_000n}
            warnHint={
              balances && balances.stakelyWal > 0n
                ? `you have ${formatMist(balances.stakelyWal)} stakely-WAL — wrong package, swap below`
                : 'no spendable WAL — swap below'
            }
          />

          <div className="popup-swap">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => swap()}
              disabled={
                swapState.kind === 'swapping' ||
                !balances ||
                balances.sui < 550_000_000n
              }
              style={{ width: '100%', justifyContent: 'center' }}
              title={
                balances && balances.sui < 550_000_000n
                  ? 'Need 0.55 SUI (0.5 swap + 0.05 gas) — get more from faucet first'
                  : 'Swap 0.5 SUI for ~0.5 WAL via official testnet exchange'
              }
            >
              {swapState.kind === 'swapping' ? '⟳ swapping…' : '⇄ Get WAL (swap 0.5 SUI)'}
            </button>
            {swapState.kind === 'done' && (
              <a
                href={suiscanTx(swapState.txDigest)}
                target="_blank"
                rel="noopener noreferrer"
                className="popup-swap-msg ok"
              >
                ✓ swapped — view tx ↗
              </a>
            )}
            {swapState.kind === 'error' && (
              <div className="popup-swap-msg err">{swapState.message}</div>
            )}
          </div>

          <a
            href={`https://suiscan.xyz/testnet/account/${account.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="popup-item"
            style={{ borderTop: '1px dashed var(--line)' }}
          >
            <span>↗ view on Suiscan</span>
          </a>
          <button
            type="button"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="popup-item"
            style={{ color: 'var(--marker-red)', borderTop: '1px dashed var(--line)' }}
          >
            <span>disconnect</span>
          </button>
        </PaperPopup>
      )}
    </div>
  );
}

function BalanceRow({
  label, value, warn, warnHint, link,
}: { label: string; value: string; warn: boolean; warnHint?: string; link?: string }) {
  return (
    <div className={`popup-balance${warn ? ' warn' : ''}`}>
      <span className="bl-label">{label}</span>
      <span className="bl-value">{value}</span>
      {warn && warnHint && (
        link
          ? <a className="bl-hint" href={link} target="_blank" rel="noopener noreferrer">{warnHint} ↗</a>
          : <span className="bl-hint">{warnHint}</span>
      )}
    </div>
  );
}

function PaperPopup({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 6px)',
        minWidth: 280,
        maxWidth: 320,
        background: 'var(--paper-2)',
        border: '2px solid var(--ink)',
        borderRadius: 8,
        boxShadow: '4px 4px 0 var(--ink)',
        zIndex: 50,
        overflow: 'hidden',
        transform: 'rotate(-0.5deg)',
      }}
    >
      <style>{`
        .popup-section {
          padding: 6px 12px;
          font-family: var(--type); font-size: 10px;
          letter-spacing: .12em; text-transform: uppercase;
          color: var(--pencil);
          background: var(--paper-edge);
          border-bottom: 1.5px dashed var(--line);
        }
        .popup-item {
          display: flex; align-items: center; gap: 8px;
          width: 100%;
          padding: 9px 12px;
          font-family: var(--body); font-size: 14px;
          color: var(--ink);
          background: var(--paper-2);
          border: 0; cursor: pointer;
          text-align: left;
          transition: background .12s;
        }
        .popup-item:hover { background: var(--postit); }
        .popup-item + .popup-item { border-top: 1px dashed var(--line); }
        .popup-balance {
          display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px;
          padding: 7px 12px;
          font-family: var(--body); font-size: 13px;
          color: var(--ink);
          background: var(--paper-2);
          border-bottom: 1px dashed var(--line);
        }
        .popup-balance.warn {
          background: var(--postit-pink);
        }
        .popup-balance .bl-label {
          font-family: var(--type); font-size: 10px;
          letter-spacing: .1em; color: var(--pencil);
          min-width: 32px;
        }
        .popup-balance .bl-value {
          font-family: var(--mono); font-size: 12px; color: var(--ink);
          font-weight: 700;
        }
        .popup-balance .bl-hint {
          flex-basis: 100%;
          font-size: 11px; color: var(--marker-red);
          line-height: 1.3;
          text-decoration: none;
        }
        .popup-balance a.bl-hint:hover { text-decoration: underline; }
        .popup-swap {
          padding: 10px 12px;
          background: var(--paper-2);
          border-bottom: 1px dashed var(--line);
          display: flex; flex-direction: column; gap: 8px;
        }
        .popup-swap-msg {
          font-family: var(--body); font-size: 11px;
          padding: 6px 10px; border-radius: 4px;
          text-align: center;
        }
        .popup-swap-msg.ok {
          background: var(--postit-mint); color: var(--marker-green);
          border: 1px solid var(--marker-green);
          text-decoration: none;
        }
        .popup-swap-msg.err {
          background: var(--postit-pink); color: var(--marker-red);
          border: 1px solid var(--marker-red);
        }
      `}</style>
      {children}
    </div>
  );
}
