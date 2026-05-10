import { useEffect, useRef, useState } from 'react';
import { Wallet, ChevronDown, LogOut, Copy, Check, ExternalLink } from 'lucide-react';
import {
  useCurrentAccount,
  useConnectWallet,
  useDisconnectWallet,
  useWallets,
} from '@mysten/dapp-kit';
import { cn } from '@/lib/utils';

export default function WalletButton() {
  const account = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connect, isPending: connecting } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
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
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          title="Install a Sui wallet to connect"
        >
          <Wallet className="h-3.5 w-3.5" /> Install wallet
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs transition hover:bg-accent disabled:opacity-50"
          disabled={connecting}
        >
          <Wallet className="h-3.5 w-3.5" />
          {connecting ? 'Connecting…' : 'Connect wallet'}
          <ChevronDown className="h-3 w-3" />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-30 mt-1 min-w-48 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            <div className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              choose wallet
            </div>
            {wallets.map(w => (
              <button
                key={w.name}
                type="button"
                onClick={() => {
                  connect({ wallet: w });
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-accent"
              >
                {w.icon && <img src={w.icon} className="h-4 w-4 rounded" alt="" />}
                <span className="truncate">{w.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const short = `${account.address.slice(0, 6)}…${account.address.slice(-4)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 font-mono text-xs transition',
          'hover:bg-accent',
        )}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        {short}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 min-w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <div className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            connected · testnet
          </div>
          <button
            type="button"
            onClick={copy}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-accent"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="font-mono text-foreground">{short}</span>
            <span className="ml-auto text-muted-foreground">{copied ? 'copied' : 'copy'}</span>
          </button>
          <a
            href={`https://suiscan.xyz/testnet/account/${account.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" /> View on Suiscan
          </a>
          <button
            type="button"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-xs text-muted-foreground transition hover:bg-accent hover:text-destructive"
          >
            <LogOut className="h-3 w-3" /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
