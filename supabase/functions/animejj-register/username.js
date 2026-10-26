export function normalizeUsername(value) {
  const name = String(value ?? '').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(name)) throw Error('Usa entre 3 y 24 letras sin acentos, números o guion bajo.');
  return name;
}
export function usernameEmail(value) { return `${normalizeUsername(value)}@users.animejj.invalid`; }
export function displayUsername(user) { return user?.email?.endsWith('@users.animejj.invalid') ? user.email.split('@')[0] : 'Cuenta anterior'; }
