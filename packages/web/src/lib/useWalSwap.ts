import { useCallback, useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '@mysten/sui/transactions';
import {
  DEFAULT_WAL_SWAP_MIST,
  WAL_COIN_TYPE,
  WAL_EXCHANGE_OBJECT,
  WAL_EXCHANGE_PACKAGE,
} from './contract';

const STAKELY_WAL_PACKAGE_PREFIX = '0x8190b041';

export interface WalletBalances {
  /** SUI balance in MIST (1e9 = 1 SUI). */
  sui: bigint;
  /** Official WAL balance in FROST (1e9 = 1 WAL). */
  wal: bigint;
  /** Stakely-faucet WAL — visible in wallet but Walrus client won't spend it. */
  stakelyWal: bigint;
}

export type SwapState =
  | { kind: 'idle' }
  | { kind: 'swapping' }
  | { kind: 'done'; txDigest: string; walReceived: bigint }
  | { kind: 'error'; message: string };

/**
 * Reads the user's testnet balances (refreshed every 8s) and exposes a
 * swap callback that turns SUI gas into the OFFICIAL Walrus testnet WAL
 * coin. Required because most testnet faucets hand out WAL from a
 * different package the Walrus client refuses to spend.
 */
export function useWalSwap() {
  const sui = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const qc = useQueryClient();
  const [state, setState] = useState<SwapState>({ kind: 'idle' });

  const balancesQuery = useQuery<WalletBalances>({
    queryKey: ['wallet-balances', account?.address],
    enabled: !!account,
    queryFn: async () => {
      if (!account) return { sui: 0n, wal: 0n, stakelyWal: 0n };
      const all = await sui.getAllBalances({ owner: account.address });
      let walSum = 0n;
      let stakelySum = 0n;
      let suiSum = 0n;
      for (const b of all) {
        const total = BigInt(b.totalBalance);
        if (b.coinType === '0x2::sui::SUI') {
          suiSum += total;
        } else if (b.coinType === WAL_COIN_TYPE) {
          walSum += total;
        } else if (b.coinType.startsWith(STAKELY_WAL_PACKAGE_PREFIX) && b.coinType.endsWith('::wal::WAL')) {
          stakelySum += total;
        }
      }
      return { sui: suiSum, wal: walSum, stakelyWal: stakelySum };
    },
    refetchInterval: 8_000,
    staleTime: 4_000,
  });

  const swap = useCallback(async (amountMist: bigint = DEFAULT_WAL_SWAP_MIST): Promise<SwapState> => {
    if (!account) {
      const errState: SwapState = { kind: 'error', message: 'Connect a wallet first.' };
      setState(errState);
      return errState;
    }
    const balances = balancesQuery.data;
    // Need ~0.05 SUI head-room above the swap amount for gas.
    const gasBuffer = 50_000_000n;
    if (balances && balances.sui < amountMist + gasBuffer) {
      const errState: SwapState = {
        kind: 'error',
        message: `Insufficient SUI. Have ${formatMist(balances.sui)} SUI, need ${formatMist(amountMist + gasBuffer)} (swap + gas). Hit faucet.sui.io.`,
      };
      setState(errState);
      return errState;
    }

    setState({ kind: 'swapping' });
    try {
      const tx = new Transaction();
      const [coinForSwap] = tx.splitCoins(tx.gas, [amountMist]);
      const walCoin = tx.moveCall({
        target: `${WAL_EXCHANGE_PACKAGE}::wal_exchange::exchange_all_for_wal`,
        arguments: [tx.object(WAL_EXCHANGE_OBJECT), coinForSwap],
      });
      tx.transferObjects([walCoin], account.address);

      const result = await signAndExecute({ transaction: tx });
      // Refresh balances after a short delay so the indexer catches up.
      await new Promise(r => setTimeout(r, 1500));
      qc.invalidateQueries({ queryKey: ['wallet-balances', account.address] });

      const doneState: SwapState = {
        kind: 'done',
        txDigest: result.digest,
        walReceived: amountMist, // 1:1 rate at exchange
      };
      setState(doneState);
      // Clear the success toast after 5s so the popup gets back to idle.
      setTimeout(() => setState(prev => prev.kind === 'done' ? { kind: 'idle' } : prev), 5_000);
      return doneState;
    } catch (err) {
      const msg = (err as Error).message || 'Unknown error';
      const errState: SwapState = {
        kind: 'error',
        message: msg.toLowerCase().includes('reject')
          ? 'You rejected the swap. Try again.'
          : msg.length > 180 ? msg.slice(0, 180) + '…' : msg,
      };
      setState(errState);
      return errState;
    }
  }, [account, balancesQuery.data, signAndExecute, qc]);

  return {
    balances: balancesQuery.data,
    isLoadingBalances: balancesQuery.isLoading,
    swap,
    state,
    resetState: () => setState({ kind: 'idle' }),
  };
}

export function formatMist(mist: bigint, decimals: number = 4): string {
  const whole = mist / 1_000_000_000n;
  const frac = mist % 1_000_000_000n;
  const fracStr = frac.toString().padStart(9, '0').slice(0, decimals);
  return `${whole}.${fracStr}`;
}
