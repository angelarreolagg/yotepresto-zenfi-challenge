import {
  ArrowLeftRight,
  Banknote,
  Car,
  CreditCard,
  Film,
  HeartPulse,
  HelpCircle,
  Home,
  Percent,
  Plane,
  Repeat,
  Shield,
  ShoppingBag,
  ShoppingCart,
  UtensilsCrossed,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { UNCATEGORIZED, type Category } from '../model/types';

/**
 * One map, shared by chart, breakdown list, rows and modal (STYLEGUIDE §4). A `Record<Category,
 * string>` fails to compile if a category is ever added and its colour forgotten — that
 * exhaustiveness is the entire point of keying it on the union instead of a lookup with a
 * fallback.
 */
export const CATEGORY_COLORS: Record<Category, string> = {
  Vivienda: '#7b61ff',
  Supermercado: '#0a84ff',
  Comida: '#32d4e6',
  Transporte: '#ff9f0a',
  Compras: '#ff6482',
  Entretenimiento: '#bf5af2',
  Salud: '#30d158',
  Servicios: '#ffd60a',
  Seguros: '#5e9eff',
  Suscripciones: '#ff453a',
  Viajes: '#40c8b0',
  Comisiones: '#d4a72c',
  Ingresos: '#30d158',
  Pagos: '#8e8e93',
  Efectivo: '#7d7d82',
  Transferencias: '#636366',
  [UNCATEGORIZED]: '#48484a',
};

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Vivienda: Home,
  Supermercado: ShoppingCart,
  Comida: UtensilsCrossed,
  Transporte: Car,
  Compras: ShoppingBag,
  Entretenimiento: Film,
  Salud: HeartPulse,
  Servicios: Zap,
  Seguros: Shield,
  Suscripciones: Repeat,
  Viajes: Plane,
  Comisiones: Percent,
  Ingresos: Wallet,
  Pagos: CreditCard,
  Efectivo: Banknote,
  Transferencias: ArrowLeftRight,
  [UNCATEGORIZED]: HelpCircle,
};

/**
 * The chart-only "Otros" bucket (groupSmallSlicesAsOthers) is not a value any transaction ever
 * carries — unlike a real category or 'Sin categoría', it is never persisted or filtered on, so
 * unlike them it IS translated UI copy, not domain data. It stays out of the exhaustive
 * `Record<Category, …>` maps above for the same reason: unions get a colour if this project can
 * verify it at compile time, and 'Otros' isn't a member of that union.
 */
export const OTHERS_COLOR = '#3a3a3c';
