import movimientosFile from '@/data/movimientos.json';

import type { RawTransactionFile } from './raw';

// movimientos.json is deliberately untyped aggregator output — this is the one intentional trust
// boundary in the codebase, where we assert its shape before normalize() validates every field.
export const rawDataset = movimientosFile as unknown as RawTransactionFile;
