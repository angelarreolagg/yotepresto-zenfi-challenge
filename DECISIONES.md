# Decisiones

## Qué mostré y qué dejé fuera

- **Una sola cifra dominante: el gasto del mes**, en una dona (menores al 5% agrupados en "Otros"). Ingresos y neto quedan como contexto en una franja aparte — el requerimiento es "en qué se me fue el dinero", no un estado de cuenta.
- **Lista semanal, no mensual.** Con 59 filas en agosto, el mes completo sin paginar es scroll sin jerarquía. Cualquier filtro activo desactiva la semana y busca en todo el mes, con un aviso explícito.
- **Corrección de categoría en modal, no inline.** Un `<select>` en la fila es menos clics, pero no deja dónde explicar _por qué_ una fila está marcada (duplicado, reembolso, monto corregido) — esas marcas son la mitad de lo interesante del dataset.
- **Sí construí un recorrido de bienvenida.** El resumen del mes (la dona y el desglose por categoría) se explica solo con mirarlo; en cambio, nada en una fila de movimiento avisa por sí sola que su categoría se puede corregir. Por eso agregué un recorrido guiado que la primera vez señala ambas cosas — no bloquea la pantalla mientras corre y se puede volver a lanzar desde el botón de ayuda.
- **Dejé fuera:** tendencias (19 días de un mes no dan serie), presupuestos, exportar, y analítica de uso — eso lo agrega después el wizard de PostHog.

## Supuestos que tuve que inventar

- **"Gasto del mes" excluye traspasos internos** (pago de tarjeta, cajero, SPEI) y disputas; incluye pendientes/programados dentro del periodo. Sin esto, `Pagos`/`Efectivo` entran al top sin ser consumo real.
- **Duplicados se marcan, no se borran** — se excluye del total solo el segundo en orden. No puedo probar que sea error del agregador; borrar dinero del usuario en silencio es peor producto que señalarlo.
- **Una categoría que no reconozco cae a "Sin categoría"** en vez de inventar una 17ª o tronar. No ocurrió en este dataset, pero es la salida más segura si ocurriera.
- **Idioma: detecto el navegador, caigo a español si no hay nada persistido o soportado** — "default y fallback" como _fallback_ real, no ignorando la preferencia de quien abre la app.
- **Tres perfiles de demostración** (mismo dataset los tres) — el reto no pedía multi-usuario, pero le da a la pantalla una capa de "a quién le pertenece esto" sin tocar los datos.
- **Los datos crudos no traían ninguna señal de calidad**, así que tuve que inventarme yo esa capa: un objeto `metadata` por transacción, y dentro de él las banderas (duplicado, reembolso, monto corregido, divisa extranjera, monto en cero) que uso para señalar inconsistencias en los movimientos. Nada de eso viene en el JSON original — es una interpretación mía de qué vale la pena marcarle al usuario.
- **Todo el estilo visual también fue un supuesto, no un requerimiento del reto.** Decidir que el dato más importante fuera una gráfica de pastel (la dona del gasto) fue una decisión mía, igual que complementarla con un panel de insight que dice de un vistazo en qué se está yendo más el dinero ese mes.

## Qué encontré en los datos y cómo lo manejé

- **El hallazgo más caro: montos en string venían sin signo.** `"1876.40"` (Walmart) y `"2150.00"` (Seguro GNP) son gastos reales; `parseFloat` ingenuo los cuenta como ingreso — **+$4,026.40 fantasma**, y el neto pasa de −$58,211.15 a un absurdo −$69,967.35 contra un sueldo de $18,450.
- **Categoría vacía tiene dos formas** (`null` ×3, `""` ×1) — mismo estado, un solo sentinela.
- **Dos duplicados, misma regla, distinto origen.** `txn_021`/`022` (RAPPI, mismo timestamp, ambos confirmados) parece doble cobro real; `txn_044`/`045` (UBER) es el mismo cargo cambiando de `pendiente` a `confirmada`. La clave descripción+monto+timestamp detecta ambos sin distinguir el motivo.
- **Dos miscategorizaciones sembradas** (`txn_005` DIDI → `Salud`; `txn_009` FARMACIAS GUADALAJARA → `Entretenimiento`) — no las corregí en el normalizador; son la razón de ser de la pantalla de corrección de categoría dentro de la lista de movimientos.
- **Renta ≈ 61% del gasto** — confirma agrupar <5% en "Otros" solo en la dona, nunca en la lista, o esconde a dónde fue el resto.
- **USD en un solo movimiento** (AWS, −$12.00): tipo de cambio fijo documentado como constante, nunca sumado sin convertir.
- Cada hallazgo se verificó contra el archivo real primero (script desechable, comparado a mano, luego borrado) — no al revés.

## Cómo usé IA

Lo que sigue es, en corto, lo mismo que expliqué a más detalle en el video que anexé al correo. Usé Claude Code de punta a punta, pero seguí un proceso parecido a Specs Driven Development, un poco más pausado de lo habitual para poder definir yo mismo cada pieza antes de delegar la ejecución a un agente.

Primero escribí un SPECS propio — no forma parte de esta entrega — a partir de interpretar el enunciado abierto del reto. De ese SPECS salieron, en orden, el `README.md`, el `CODESTYLE.md`, el `STYLEGUIDE.md` (este con ayuda del MCP de Mobbin, para no inventar el sistema visual a ciegas) y finalmente el `ROADMAP.md`, que desglosaba cada paso lo suficientemente bien como para que un agente pudiera ejecutar la instrucción de `goal` y completar la mayor parte del proyecto planteado sin que yo tuviera que supervisar fase por fase. Los cuatro documentos los construí con Opus 5; la ejecución completa del `goal` corrió después con Sonnet.

- **Sirvió:** andamiaje repetitivo (~14 archivos de prueba, ambos catálogos de i18n en paralelo) y verificar cada regla contra el JSON real _antes_ de escribir la lógica, no después.
- **Tuve que corregir:** un bug real de Recharts 3.10.1 (su animación de entrada se queda en ángulo cero y nunca avanza, dejando la dona invisible) — detectado probando en navegador, no leyendo código; se resolvió renderizando la dona en su ángulo final y animando el contenedor con CSS propio. Una auditoría con script también encontró 9 botones sin el `active:scale` de la guía de estilo.
- **No confié a ciegas:** cada número de la auditoría (duplicados, signos, USD) se validó contra `movimientos.json` real, nunca contra lo que el modelo "recordaba".

## Qué haría con una semana más

- Recategorización en bloque ("aplicar a todos los movimientos de este comercio") — hoy es fila por fila.
- Detección de suscripciones recurrentes como su propio bloque de gasto fijo.
- Separar gasto fijo de variable: "el súper es tu #1 gasto movible" es más accionable que "gastaste $48,500 en renta".
- **Tarjetas:** poder registrarlas, conocer sus fechas de pago y trackear cuándo toca pagar cada una — hoy la app no sabe que existen tarjetas más allá de ser un método de pago dentro de un movimiento.
- **Hablar con el equipo de backend** para plantear una sanitización de los datos antes de que yo los reciba (signos, categorías vacías, duplicados), en vez de resolver todo eso del lado del cliente en el normalizador.
- **Pendiente:** implementar PostHog para el análisis de la interacción del usuario — quedó fuera intencionalmente de esta entrega, como ya se menciona arriba.

## Tiempo invertido

- Planeación y análisis: 50 min
- Comando `goal` de Claude Code: 2 h
- Correcciones y QA: 50 min
- Despliegue y documentación: 20 min
- **Total: 4 h**
