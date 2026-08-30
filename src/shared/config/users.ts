/**
 * Three static demo profiles — chrome, not data (ROADMAP §4): the underlying dataset is
 * identical for each. Colours are drawn from the category series and are deliberately not the
 * accent, which means "interactive" everywhere else (STYLEGUIDE §2).
 */
const USERS = [
  { id: 'saul', name: 'Saúl', initial: 'S', color: '#7b61ff' },
  { id: 'johan', name: 'Johan', initial: 'J', color: '#32d4e6' },
  { id: 'angel', name: 'Ángel', initial: 'A', color: '#ff9f0a' },
] as const;

export type DemoUser = (typeof USERS)[number];

export const DEMO_USERS: readonly DemoUser[] = USERS;

export const DEFAULT_USER_ID: DemoUser['id'] = USERS[0].id;

export function findUser(id: string): DemoUser | undefined {
  return DEMO_USERS.find((user) => user.id === id);
}
