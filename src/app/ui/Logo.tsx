import { Wallet } from 'lucide-react';

/** No brand asset was provided with the challenge — a simple icon + wordmark stands in for one. */
export function Logo() {
  return (
    <div className="flex items-center gap-1.5 font-bold">
      <Wallet size={20} className="text-accent" aria-hidden />
      <span className="text-sm sm:text-base">Movimientos</span>
    </div>
  );
}
