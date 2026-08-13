export function isWebGameType(type: unknown): boolean {
  return String(type || '').trim().toLowerCase() === 'web';
}

export function getGamePrimaryActionKind(type: unknown): 'app-guide' | 'download' {
  return isWebGameType(type) ? 'app-guide' : 'download';
}
