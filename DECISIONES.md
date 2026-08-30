# Decisiones

> 🔲 **BORRADOR.** Los bullets marcados con 🔲 se completan al terminar. Los demás ya están resueltos.
> Antes de entregar: borrar esta línea, quitar los 🔲 y recortar a **una página**.

## Qué mostré y qué dejé fuera

- **Mostré una sola cifra dominante: el gasto del mes.** Ingresos y balance son contexto secundario. El requerimiento es "en qué se me fue el dinero", no un estado de cuenta.
- **Ranking de categorías con barras proporcionales, no dona.** La renta es el **60.4%** del gasto: una dona con esa rebanada deja las otras 10 categorías ilegibles. Las barras toleran un valor dominante y no necesitan leyenda.
- **Separé los movimientos internos del consumo.** Pago de tarjeta ($5,000), retiro de cajero ($3,000) y SPEI enviados ($3,500) suman **$11,500** que no son consumo — el pago de tarjeta incluso duplica compras que ya están listadas. Sin separarlos, `Pagos` y `Efectivo` entran al top 5 y no significan nada para el usuario.
- **Dejé fuera:** gráficas de tendencia (hay 19 días de un solo mes, no da serie), vista por cuenta, búsqueda, exportación, presupuestos.
- 🔲 Lo que quedó sin terminar dentro del time-box.

## Supuestos que tuve que inventar

- **"El mes" es el `periodo` declarado en el JSON (`2026-08`)**, no el mes del navegador. Filtro comparando `fecha.slice(0,7)` para no depender de la zona horaria del revisor.
- **Un monto que llega como string es un gasto**, aunque venga positivo. Ver siguiente sección.
- **Tipo de cambio USD→MXN fijo en 18.5**, declarado como constante mock. No hay backend y es un solo movimiento de $12.
- **Pendiente y en disputa no cuentan en el total confirmado**, pero se muestran como chips para que el usuario pueda cuadrar contra su banco.
- **El total debe ser auditable.** Todo lo que excluyo aparece en pantalla con su monto. Excluir en silencio sería una decisión invisible.

## Qué encontré en los datos y cómo lo manejé

- **🔴 Los montos en string venían con el signo invertido.** `"1876.40"` (Walmart) y `"2150.00"` (Seguro GNP) son positivos pero son gastos. Un `parseFloat` directo los cuenta como ingreso: **$4,026.40 mal clasificados**, y una desviación de $8,052.80 entre ingresos y gastos. Los fuerzo con `-Math.abs()` y levanto un flag visible en la fila.
- **Dos duplicados de distinta naturaleza.** `txn_044`/`txn_045` (mismo cargo en `confirmada` y `pendiente`) se resuelve solo al filtrar por estado. `txn_021`/`txn_022` es más difícil: RAPPI $412, mismo timestamp, **ambos confirmados**. **Decidí señalarlo, no borrarlo** — no puedo probar que sea un error del agregador, y borrar dinero del usuario en silencio es peor producto que marcarlo.
- **Cuatro categorías vacías, no dos.** `txn_016` y `txn_049` en `null`, `txn_030` en `""`, `txn_061` en `null`. Todas caen a `Sin categoría`, que se pinta gris con borde punteado para que se lea como un hueco por llenar — es la invitación al feature de recategorizar.
- **Doble conteo entre cuentas.** Hay dos cuentas (débito y crédito) y un pago de tarjeta de $5,000. Ese pago no es consumo nuevo: las compras de esa tarjeta ya están en la lista.
- **El mes está incompleto.** El export se generó el 19 de agosto y el último movimiento es de ese día: 19 de 31 días. Por eso la pantalla dice "1–19 ago" y no hay proyecciones ni comparativas contra promedio.
- **Otros bordes:** `txn_036` con monto `0`, `txn_061` con `cuenta: null`, `txn_032` en USD, dos movimientos fuera de periodo (`txn_059` de nov 2025, `txn_060` programado a septiembre), y el archivo **sin ordenar** cronológicamente.
- **Ambigüedades que decidí no resolver por mi cuenta:** `txn_028` (REEMBOLSO AMAZON, +$1,899) cancela exacto a `txn_007`, y `txn_057` (SPEI reembolso de gastos, +$3,200) está clasificado como `Ingresos` sin ser nómina. Los dejé como el banco los manda y lo anoto acá, porque netearlos cambia el total y es una decisión de producto que preferiría platicar.

## Cómo usé IA

- 🔲 Herramienta y modelo usados.
- **Para planear:** generé un plan técnico inicial y lo usé como punto de partida. **Tuve que corregirlo contra los datos reales**: listaba 2 categorías vacías cuando son 4, no detectó el duplicado `txn_021`/`txn_022`, y trataba el parseo de los montos en string como un `parseFloat` simple sin ver el problema de signo — que resultó ser el hallazgo más caro del dataset.
- **Para auditar los datos:** en lugar de confiar en el plan, corrí scripts sobre el JSON para verificar cada anomalía y calcular los totales esperados. Eso es lo que destapó los tres errores de arriba.
- 🔲 Qué código me generó que conservé.
- 🔲 Qué código me generó que tuve que corregir o tirar.
- **Conclusión:** fue buena acelerando andamiaje y redacción, y poco confiable afirmando cosas sobre los datos. Todo lo que dijo del JSON tuvo que verificarse contra el JSON.

## Qué haría con una semana más

- **Auto-categorización por comerciante.** `OXXO CANTERAS` aparece 5 veces y hoy se recategoriza de una en una.
- **Recategorización en bloque** — "aplicar a todos los movimientos de este comercio".
- **Detección de suscripciones recurrentes** (Netflix, Spotify, HBO, Apple) como bloque propio de gasto fijo.
- **Split de gasto fijo vs variable.** Convierte "gasté $48,500 en renta" —que no es accionable— en "de lo que sí puedes mover, el súper es tu #1".
- **Deduplicación con confirmación del usuario** en vez de solo señalar.
- **Comparativa mes contra mes**, cuando haya más de un mes de datos.
- **Tests del normalizador contra fixtures de agregadores distintos**, no solo este export.

## Tiempo invertido

- 🔲 Total real dentro del time-box de 4 horas.
- 🔲 En qué se fue el tiempo y qué quedó fuera por ello.
