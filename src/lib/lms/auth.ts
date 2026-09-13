import type { AvatarColor, Role, Session, User } from './types';
import { lmsBus, newId, readJson, removeRaw, writeJson } from './store';

/**
 * Аутентификация: один интерфейс, две реализации. Сейчас LocalDemoAuth,
 * позже SupabaseAuth — UI не меняется, фабрика читает
 * NEXT_PUBLIC_AUTH_PROVIDER=demo|supabase.
 */
export interface AuthAdapter {
  signIn(email: string, password: string): Promise<Session>;
  signUp(name: string, email: string, password: string, role?: Role): Promise<Session>;
  signOut(): Promise<void>;
  getSession(): Session | null;
  onAuthChange(callback: (session: Session | null) => void): () => void;
}

/**
 * ДЕМО-ОГРАНИЧЕНИЕ: аккаунты и пароли лежат в localStorage этого устройства
 * открытым текстом, без хеширования и без сервера. Это не аутентификация —
 * только переключатель ролей для демонстрации. Реальные пароли и PII сюда
 * не вводить; SupabaseAuth заменит это целиком.
 */
export interface DemoAccount {
  user: User;
  password: string;
}

const USERS = 'users';
const SESSION = 'session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const COLORS: AvatarColor[] = ['red', 'ink', 'dark-warm', 'red-deep'];

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const accounts = () => readJson<DemoAccount[]>(USERS, []);

/** Для сида: добавить/обновить демо-аккаунты, не трогая остальные. */
export function upsertDemoAccounts(list: DemoAccount[]): void {
  const incoming = new Set(list.map((a) => a.user.email));
  writeJson(USERS, [...accounts().filter((a) => !incoming.has(a.user.email)), ...list]);
  lmsBus.emit();
}

class LocalDemoAuth implements AuthAdapter {
  private listeners = new Set<(session: Session | null) => void>();

  getSession(): Session | null {
    const session = readJson<Session | null>(SESSION, null);
    if (!session) return null;
    if (Date.parse(session.expiresAt) < Date.now()) {
      removeRaw(SESSION);
      return null;
    }
    return session;
  }

  async signIn(email: string, password: string): Promise<Session> {
    const account = accounts().find((a) => a.user.email === normalizeEmail(email));
    if (!account || account.password !== password) throw new Error('Неверный email или пароль');
    return this.start(account.user);
  }

  async signUp(name: string, email: string, password: string, role: Role = 'student'): Promise<Session> {
    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);
    if (!cleanName) throw new Error('Укажите имя');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Проверьте email');
    if (password.length < 6) throw new Error('Пароль — минимум 6 символов');
    if (accounts().some((a) => a.user.email === cleanEmail)) throw new Error('Этот email уже зарегистрирован');
    // Демо: роль выбирается при регистрации. В Supabase роли назначает админ.
    const user: User = { id: newId(), name: cleanName, email: cleanEmail, role, avatarColor: COLORS[accounts().length % COLORS.length] };
    writeJson(USERS, [...accounts(), { user, password }]);
    return this.start(user);
  }

  async signOut(): Promise<void> {
    removeRaw(SESSION);
    this.notify(null);
  }

  onAuthChange(callback: (session: Session | null) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private start(user: User): Session {
    const session: Session = { user, expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() };
    writeJson(SESSION, session);
    this.notify(session);
    return session;
  }

  private notify(session: Session | null): void {
    this.listeners.forEach((listener) => listener(session));
    lmsBus.emit();
  }
}

let instance: AuthAdapter | null = null;

export function getAuth(): AuthAdapter {
  if (process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase') {
    // TODO(supabase): SupabaseAuth реализует тот же AuthAdapter — отдельный файл.
    throw new Error('SupabaseAuth ещё не подключён: используйте NEXT_PUBLIC_AUTH_PROVIDER=demo');
  }
  instance ??= new LocalDemoAuth();
  return instance;
}
