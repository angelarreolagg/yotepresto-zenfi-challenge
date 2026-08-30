type ClassValue = string | false | null | undefined;

/** No new dependency for what is, here, six lines: join the truthy class names with a space. */
export function cn(...values: ClassValue[]): string {
  return values.filter((value): value is string => Boolean(value)).join(' ');
}
