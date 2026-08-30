<div align="center">

# 💸 Movimientos — Reto técnico Zenfi

**Una pantalla para entender en 10 segundos en qué se te fue el dinero este mes.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[![Zustand](https://img.shields.io/badge/Zustand-5-443E38?style=for-the-badge&logo=react&logoColor=white)](https://zustand.docs.pmnd.rs)
[![Motion](https://img.shields.io/badge/Motion-12-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://motion.dev)
[![OGL](https://img.shields.io/badge/OGL-WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white)](https://github.com/oframe/ogl)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

**[🔗 Ver demo en vivo](https://TU-URL.vercel.app)** · **[📄 Decisiones](./DECISIONES.md)** · **[🎨 Styleguide](./STYLEGUIDE.md)**

> ⚠️ *Reemplaza la URL de la demo y agrega la captura antes de entregar.*

</div>

---

<div align="center">
  <img src="./docs/preview.png" alt="Captura de la aplicación" width="820" />
</div>

---

## 🎯 El problema

Zenfi conecta cuentas bancarias y muestra movimientos. El problema no es traer los datos: es que la gente abre la app, ve una lista de 60 renglones y la cierra sin sacar nada en claro.

Esta pantalla resuelve dos cosas, y solo dos:

1. **Entender en ~10 segundos en qué se fue el dinero del mes.**
2. **Corregir la categoría de un movimiento mal clasificado.**

---

## ✨ Qué hace

| | |
|---|---|
| 📊 **Resumen inmediato** | El gasto del mes como cifra dominante, con ingresos y balance de contexto |
| 🏆 **Ranking por categoría** | Barras proporcionales ordenadas — no una dona, y [hay razón](./DECISIONES.md) |
| 🏷️ **Recategorización en un clic** | Selector visual de categorías; los totales se recalculan y reordenan al instante |
| 🧹 **Datos saneados** | Montos en string, monedas mixtas, categorías vacías y duplicados, todos tratados |
| 🔍 **Filtros con conteo** | Todos · Gastos · Ingresos · Sin categoría · Internos |
| 🚩 **Transparencia del dato** | Badges de pendiente, en disputa, posible duplicado y monto corregido |
| ♿ **Accesible** | Navegable por teclado, contrastes AA verificados, `prefers-reduced-motion` |
| 💾 **Persistencia local** | Tus recategorizaciones sobreviven al refresh |

---

## 🧠 Las decisiones que importan

> Resumen. El detalle completo está en **[DECISIONES.md](./DECISIONES.md)**.

- **Los movimientos internos no son gasto.** El pago de tarjeta, el retiro de cajero y los SPEI enviados suman **$11,500** que no son consumo — el pago de tarjeta incluso duplica compras que ya están en la lista. Se muestran aparte, no compiten en el ranking.
- **Los montos en string venían positivos y eran gastos.** `"1876.40"` (Walmart) y `"2150.00"` (Seguro GNP). Un `parseFloat` ingenuo los cuenta como ingreso: **$4,026.40 mal clasificados** en ambas direcciones.
- **Barras en lugar de dona.** La renta es el **60.4%** del gasto. Una dona con esa rebanada deja las otras 10 categorías ilegibles.
- **Los duplicados se señalan, no se borran.** `txn_021` y `txn_022` son idénticos y ambos confirmados. Borrar dinero del usuario en silencio es peor producto que marcarlo.
- **El mes está incompleto y se dice.** El export se generó el 19 de agosto: son 19 de 31 días. Por eso no hay proyecciones ni comparativas.

---

## 🛠️ Stack y por qué

| Tecnología | Por qué |
|---|---|
| **React 19 + TypeScript** | Requisito del reto. TS en `strict` con `noUncheckedIndexedAccess` y `erasableSyntaxOnly` |
| **Vite 8** | Ya venía en el template. Dev server instantáneo y build sin configuración |
| **Tailwind v4** | Sistema de diseño en CSS con `@theme`, sin archivo de config. Velocidad sin perder consistencia |
| **Zustand** | El estado es una lista y una acción. Redux sobra; Context re-renderiza de más. Selectores puntuales, cero boilerplate |
| **Motion** | La recategorización necesita mostrar causa y efecto. Sin animación, el recálculo pasa desapercibido |
| **OGL** | Gradiente animado del hero. Es puro acabado y está aislado en un archivo borrable |
| **Vitest** | Comparte config con Vite. Cubre el normalizador, que es donde vive el riesgo real |

---

## 🚀 Cómo correrlo

**Requisitos:** Node `>=22.12` (hay `.nvmrc`) y pnpm 10.

```bash
corepack enable
pnpm install
pnpm dev
```

Corre en **http://localhost:5173**.

### Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Typecheck + build de producción |
| `pnpm preview` | Sirve el build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Solo TypeScript |
| `pnpm test` | Tests con Vitest |
| `pnpm test:watch` | Tests en modo watch |

---

## 📁 Estructura

```
src/
├─ data/movimientos.json      # dato crudo, intocable
├─ domain/                    # TypeScript puro, sin React
│  ├─ tipos.ts                # RawMovimiento, Movimiento, Categoria, Estado
│  ├─ constantes.ts           # FX_USD_MXN, PERIODO, CATEGORIAS_INTERNAS
│  ├─ normalizar.ts           # RawMovimiento[] → Movimiento[]   ← el corazón
│  ├─ normalizar.test.ts      # un caso por cada anomalía del JSON
│  ├─ agregados.ts            # totales y ranking por categoría
│  └─ agregados.test.ts       # caracterización contra números conocidos
├─ store/useMovimientosStore.ts
├─ components/
│  ├─ resumen/                # Zona 1 — la cifra y el ranking
│  ├─ filtros/                # Zona 2 — píldoras con conteo
│  ├─ feed/                   # Zona 3 — lista y recategorización
│  └─ ui/                     # Card, Badge, Pill, Popover
├─ lib/formato.ts             # Intl para moneda y fecha
└─ App.tsx
```

**`domain/` no importa nada de React.** Por eso se testea sin montar nada.

---

## 🧪 Testing

Pocos tests, elegidos a propósito — el reto dice explícitamente que no se evalúa cobertura.

- **`normalizar.test.ts`** — un caso por cada anomalía real del JSON, nombrado con su `txn_`. Es donde un bug produce números incorrectos **que se ven bien**.
- **`agregados.test.ts`** — caracterización contra los totales conocidos. Si alguien toca el normalizador y las cifras se mueven, truena.
- **Un test de integración** — recategorizar `txn_009` de `Entretenimiento` a `Salud` y verificar que el total de `Salud` sube $432.50. El requerimiento literal, de punta a punta.

Sin snapshots, sin tests de componentes de presentación, sin meta de cobertura. El razonamiento completo está en [CODESTYLE.md](./CODESTYLE.md#3-testing).

---

## 📚 Documentación

| Documento | Contenido |
|---|---|
| [DECISIONES.md](./DECISIONES.md) | Qué se mostró y qué se dejó fuera, supuestos, hallazgos en los datos y uso de IA |
| [STYLEGUIDE.md](./STYLEGUIDE.md) | Sistema visual: tokens, contrastes verificados, componentes |
| [CODESTYLE.md](./CODESTYLE.md) | Convenciones de TypeScript, React, testing y commits |
| [ROADMAP.md](./ROADMAP.md) | Plan de ejecución y auditoría completa del JSON |
| [RETO.md](./RETO.md) | Enunciado original |

---

## 📊 Sobre los datos

`src/data/movimientos.json` — un mes de movimientos tal como los entrega un agregador bancario. **No viene limpio, y eso es parte del reto.**

Lo que trae y cómo se trató:

| Anomalía | Ejemplo | Tratamiento |
|---|---|---|
| Montos en string | `txn_024`, `txn_048` | Parseo a float **y corrección de signo** |
| Categorías vacías | `txn_016`, `txn_030`, `txn_049`, `txn_061` | Fallback a `Sin categoría` |
| Moneda mixta | `txn_032` (USD) | Conversión con FX fijo, se conserva el original en la lista |
| Fuera de periodo | `txn_059` (2025-11), `txn_060` (2026-09) | Excluidos del mes |
| Duplicados | `txn_021`/`txn_022`, `txn_044`/`txn_045` | Señalados con badge, no eliminados |
| Estados no confirmados | 3 pendientes + 1 en disputa | Fuera del total, visibles como chips |
| Monto cero | `txn_036` | Ni ingreso ni gasto |
| Movimientos internos | `txn_010`, `txn_017`, `txn_020`, `txn_043` | Separados del consumo |

---

<div align="center">

Hecho por **[Ángel Arreola](https://github.com/angelarreolagg)** para el reto de **Zenfi / yotepresto**

</div>
