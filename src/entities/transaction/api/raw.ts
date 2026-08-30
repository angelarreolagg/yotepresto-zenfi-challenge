/**
 * movimientos.json's shape, as it actually is (ROADMAP.md §3). This is the only place
 * `monto: number | string` is tolerated — everything downstream consumes `Transaction` from
 * ../model/types, where the sign and type are already resolved.
 */
export interface RawTransaction {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number | string;
  moneda: string;
  categoria: string | null;
  cuenta: string | null;
  estado: string;
}

export interface RawTransactionFile {
  periodo: string;
  generado_en: string;
  movimientos: RawTransaction[];
}
