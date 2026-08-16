export type AccessLevel = 'OWNER' | 'VIEWER' | 'NONE';

const ACCESS_RANK: Record<AccessLevel, number> = {
  NONE: 0,
  VIEWER: 1,
  OWNER: 2,
};

export function meetsAccessLevel(
  actual: AccessLevel,
  required: AccessLevel,
): boolean {
  return ACCESS_RANK[actual] >= ACCESS_RANK[required];
}
