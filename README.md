<div align="center">

# 💸 Movimientos — Reto técnico Zenfi

**Una pantalla para entender en ~10 segundos en qué se fue el dinero este mes, y corregir un movimiento mal clasificado.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-5-443E38?style=for-the-badge&logo=react&logoColor=white)](https://zustand.docs.pmnd.rs)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)
[![pnpm](https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)

**[📄 Decisiones](./DECISIONES.md)** · **[🎨 Guía de estilo](./docs/STYLEGUIDE.md)** · **[🗺️ Roadmap](./docs/ROADMAP.md)**

</div>

---

## El problema

Zenfi conecta cuentas bancarias y muestra movimientos. El problema no es traer los datos: es que la gente abre la app, ve una lista de 60 renglones y la cierra sin sacar nada en claro.

Esta pantalla resuelve dos cosas:

1. **Entender en ~10 segundos en qué se fue el dinero del mes** — dona por categoría, un renglón de interpretación y el ranking completo.
2. **Corregir la categoría de un movimiento mal clasificado** — desde un modal, sin recargar, con el total actualizándose al instante.

## Cómo correrlo

Requisitos: Node `>=22.12` (hay `.nvmrc`) y pnpm.

```bash
corepack enable
pnpm install
pnpm dev
```

Corre en **http://localhost:5173**.

### Scripts

| Script            | Qué hace                        |
| ----------------- | ------------------------------- |
| `pnpm dev`        | Servidor de desarrollo          |
| `pnpm build`      | Typecheck + build de producción |
| `pnpm preview`    | Sirve el build                  |
| `pnpm lint`       | ESLint                          |
| `pnpm typecheck`  | Solo TypeScript                 |
| `pnpm test`       | Tests con Vitest                |
| `pnpm test:watch` | Tests en modo watch             |

Husky corre `lint-staged` en cada commit y `typecheck && test` en cada push.

## Arquitectura, en cinco líneas

`src/` está organizado **por feature, no por tipo de archivo**, en capas que solo importan hacia abajo: `app → features → entities → shared`. `entities/transaction` es el dominio compartido — normaliza el JSON crudo una sola vez (`model/normalize.ts`) y expone reglas de negocio puras (`lib/eligibility.ts`, `lib/summary.ts`) que no dependen de React. Cada feature (`expense-breakdown`, `transaction-list`, `onboarding`) es una capacidad con su propio estado y lógica; ninguna importa a otra. La presentación (`*/ui/*.tsx`) solo lee flags ya resueltos — nunca vuelve a aplicar una regla de negocio.

Detalle completo, con el porqué de cada decisión no evidente, en [`docs/ROADMAP.md`](./docs/ROADMAP.md) y [`docs/CODESTYLE.md`](./docs/CODESTYLE.md).

## Sobre los datos

`src/data/movimientos.json` — un mes de movimientos tal como los entrega un agregador bancario, sin limpiar a propósito. La auditoría completa (montos en string sin signo, duplicados, categorías vacías, USD, movimientos internos, fuera de periodo) está en [`docs/ROADMAP.md` §2](./docs/ROADMAP.md), y cómo se trató cada caso en [`DECISIONES.md`](./DECISIONES.md).

## Documentación

| Documento                                  | Contenido                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| [DECISIONES.md](./DECISIONES.md)           | Qué se mostró y qué se dejó fuera, supuestos, hallazgos, uso de IA     |
| [docs/ROADMAP.md](./docs/ROADMAP.md)       | Especificación completa: metas, arquitectura, interfaz, orden de build |
| [docs/CODESTYLE.md](./docs/CODESTYLE.md)   | Convenciones de TypeScript, React, testing y commits                   |
| [docs/STYLEGUIDE.md](./docs/STYLEGUIDE.md) | Sistema visual: tokens, tipografía, movimiento, accesibilidad          |

---

<div align="center">

Hecho por **[Ángel Arreola](https://github.com/angelarreolagg)** para el reto de **Zenfi / yotepresto**

</div>
