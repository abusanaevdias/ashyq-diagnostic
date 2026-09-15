import { createClient, type AuthError, type Session as SupabaseSession, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthAdapter, SignUpConsent } from './auth';
import { lmsBus } from './store';
import type { AvatarColor, Role, Session } from './types';

/**
 * Вход через Supabase Auth (SUPABASE-AUTH-001): почта + пароль, тот же
 * AuthAdapter, что у демо. Роль и имя берутся из public.profiles — роль там
 * выдаёт только админ, новый аккаунт всегда student. Сессию supabase-js хранит
 * в localStorage браузера и сам обновляет токен; права на данные — RLS.
 */

let browserClient: SupabaseClient | null = null;

/** Браузерный клиент с anon/publishable-ключом. Service role сюда не попадает никогда. */
export function supabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;
  // Supabase показывает адрес REST API (…/rest/v1/), а клиенту нужен адрес проекта:
  // иначе «Invalid path specified in request URL» (прод 2026-09-15). Как SUPABASE_PATH в src/lib/env.ts
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/(\/(rest|auth)\/v1)?\/?$/, '');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase не настроен: задайте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY');
  browserClient = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'ashyq:v2:supabase-auth' } });
  return browserClient;
}

/** В интерфейсе ролей три: админ работает с правами учителя. */
const ROLES: Record<string, Role> = { student: 'student', teacher: 'teacher', author: 'author', admin: 'teacher' };
const COLORS: AvatarColor[] = ['red', 'red-deep', 'ink', 'dark-warm'];
export const MIN_PASSWORD = 8; // = minimum_password_length в supabase/config.toml

function humanize(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials': return 'Неверный email или пароль';
    case 'user_already_exists':
    case 'email_exists': return 'Этот email уже зарегистрирован';
    case 'weak_password': return `Пароль — минимум ${MIN_PASSWORD} символов`;
    case 'email_not_confirmed': return 'Подтвердите почту по ссылке из письма, затем войдите';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit': return 'Слишком много попыток. Попробуйте через несколько минут';
    case 'unexpected_failure': return 'Не удалось создать аккаунт. Если вам меньше 18 лет, нужно согласие родителя';
    default: return error.message;
  }
}

export class SupabaseAuth implements AuthAdapter {
  private session: Session | null = null;
  private ready = false;
  private readonly listeners = new Set<(session: Session | null) => void>();

  constructor(private readonly client: SupabaseClient) {
    // Запрос к Supabase прямо в колбэке onAuthStateChange блокирует клиент — профиль читаем на следующем тике.
    client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void this.adopt(session), 0);
    });
  }

  isReady(): boolean {
    return this.ready;
  }

  getSession(): Session | null {
    return this.session;
  }

  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await this.client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw new Error(humanize(error));
    return this.require(await this.adopt(data.session));
  }

  async signUp(name: string, email: string, password: string, _role?: Role, consent?: SignUpConsent): Promise<Session> {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName) throw new Error('Укажите имя');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Проверьте email');
    if (password.length < MIN_PASSWORD) throw new Error(`Пароль — минимум ${MIN_PASSWORD} символов`);
    const minor = consent?.minor ?? false;
    if (minor && !consent?.guardianConsent) throw new Error('Для регистрации до 18 лет нужно согласие родителя');

    // Роль в metadata не передаём: её выдаёт админ (триггер БД всё равно ставит student).
    const { data, error } = await this.client.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { name: cleanName, avatar_color: COLORS[cleanEmail.length % COLORS.length], is_minor: minor, guardian_consent: minor } },
    });
    if (error) throw new Error(humanize(error));
    if (!data.session) throw new Error('Аккаунт создан. Подтвердите почту по ссылке из письма, затем войдите');
    return this.require(await this.adopt(data.session));
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
    await this.adopt(null);
  }

  onAuthChange(callback: (session: Session | null) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private require(session: Session | null): Session {
    if (!session) throw new Error('Профиль не найден. Обратитесь к администратору ASHYQ');
    return session;
  }

  private async adopt(auth: SupabaseSession | null): Promise<Session | null> {
    this.session = auth ? await this.toSession(auth) : null;
    this.ready = true;
    this.listeners.forEach((listener) => listener(this.session));
    lmsBus.emit();
    return this.session;
  }

  private async toSession(auth: SupabaseSession): Promise<Session | null> {
    const { data } = await this.client.from('profiles').select('display_name, role, avatar_color').eq('id', auth.user.id).maybeSingle();
    if (!data) return null;
    return {
      user: {
        id: auth.user.id,
        name: data.display_name,
        email: auth.user.email ?? '',
        role: ROLES[data.role] ?? 'student',
        avatarColor: COLORS.includes(data.avatar_color) ? data.avatar_color : 'red',
      },
      expiresAt: new Date((auth.expires_at ?? Date.now() / 1000 + 3600) * 1000).toISOString(),
    };
  }
}
