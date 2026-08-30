# Decisiones

## Qué mostré y qué dejé fuera

- **Una sola cifra dominante: el gasto del mes**, en una dona (menores al 5% agrupados en "Otros"). Ingresos y neto quedan como contexto en una franja aparte — el requerimiento es "en qué se me fue el dinero", no un estado de cuenta.
- **Lista semanal, no mensual.** Con 59 filas en agosto, el mes completo sin paginar es scroll sin jerarquía. Cualquier filtro activo desactiva la semana y busca en todo el mes, con un aviso explícito.
- **Corrección de categoría en modal, no inline.** Un `<select>` en la fila es menos clics, pero no deja dónde explicar _por qué_ una fila está marcada (duplicado, reembolso, monto corregido) — esas marcas son la mitad de lo interesante del dataset.
- **Sí construí el recorrido de bienvenida (G3).** El resumen (G1) se explica solo con mirarlo; nada en una fila avisa que su categoría es editable (G2). No bloquea la pantalla y se repite desde el botón de ayuda.
- **Dejé fuera:** tendencias (19 días de un mes no dan serie), presupuestos, exportar, y analítica — eso lo agrega después el wizard de PostHog.

## Supuestos que tuve que inventar

- **"Gasto del mes" excluye traspasos internos** (pago de tarjeta, cajero, SPEI) y disputas; incluye pendientes/programados dentro del periodo. Sin esto, `Pagos`/`Efectivo` entran al top sin ser consumo real.
- **Duplicados se marcan, no se borran** — se excluye del total solo el segundo en orden. No puedo probar que sea error del agregador; borrar dinero del usuario en silencio es peor producto que señalarlo.
- **Una categoría que no reconozco cae a "Sin categoría"** en vez de inventar una 17ª o tronar. No ocurrió en este dataset, pero es la salida más segura si ocurriera.
- **Idioma: detecto el navegador, caigo a español si no hay nada persistido o soportado** — "default y fallback" como _fallback_ real, no ignorando la preferencia de quien abre la app.
- **Tres perfiles de demostración** (mismo dataset los tres) — el reto no pedía multi-usuario, pero le da a la pantalla una capa de "a quién le pertenece esto" sin tocar los datos.

## Qué encontré en los datos y cómo lo manejé

- **El hallazgo más caro: montos en string venían sin signo.** `"1876.40"` (Walmart) y `"2150.00"` (Seguro GNP) son gastos reales; `parseFloat` ingenuo los cuenta como ingreso — **+$4,026.40 fantasma**, y el neto pasa de −$58,211.15 a un absurdo −$69,967.35 contra un sueldo de $18,450.
- **Categoría vacía tiene dos formas** (`null` ×3, `""` ×1) — mismo estado, un solo sentinela.
- **Dos duplicados, misma regla, distinto origen.** `txn_021`/`022` (RAPPI, mismo timestamp, ambos confirmados) parece doble cobro real; `txn_044`/`045` (UBER) es el mismo cargo cambiando de `pendiente` a `confirmada`. La clave descripción+monto+timestamp detecta ambos sin distinguir el motivo.
- **Dos miscategorizaciones sembradas** (`txn_005` DIDI → `Salud`; `txn_009` FARMACIAS GUADALAJARA → `Entretenimiento`) — no las corregí en el normalizador; son la razón de ser de G2.
- **Renta ≈ 61% del gasto** — confirma agrupar <5% en "Otros" solo en la dona, nunca en la lista, o esconde a dónde fue el resto.
- **USD en un solo movimiento** (AWS, −$12.00): tipo de cambio fijo documentado como constante, nunca sumado sin convertir.
- Cada hallazgo se verificó contra el archivo real primero (script desechable, comparado a mano, luego borrado) — no al revés.

## Cómo usé IA

Usé Claude Code de punta a punta: para convertir el enunciado abierto de `RETO.md` en un plan propio (`ROADMAP.md`/`CODESTYLE.md`/`STYLEGUIDE.md`) en una sesión previa, y para implementarlo completo en esta, fase por fase, con `typecheck`/`lint`/`test`/`build` en verde antes de cada commit.

- **Sirvió:** andamiaje repetitivo (~14 archivos de prueba, ambos catálogos de i18n en paralelo) y verificar cada regla contra el JSON real _antes_ de escribir la lógica, no después.
- **Tuve que corregir:** un bug real de Recharts 3.10.1 (su animación de entrada se queda en ángulo cero y nunca avanza, dejando la dona invisible) — detectado probando en navegador, no leyendo código; se resolvió renderizando la dona en su ángulo final y animando el contenedor con CSS propio. Una auditoría con script también encontró 9 botones sin el `active:scale` de la guía de estilo.
- **No confié a ciegas:** cada número de la auditoría (duplicados, signos, USD) se validó contra `movimientos.json` real, nunca contra lo que el modelo "recordaba".

## Qué haría con una semana más

- Recategorización en bloque ("aplicar a todos los movimientos de este comercio") — hoy es fila por fila.
- Detección de suscripciones recurrentes como su propio bloque de gasto fijo.
- Separar gasto fijo de variable: "el súper es tu #1 gasto movible" es más accionable que "gastaste $48,500 en renta".
