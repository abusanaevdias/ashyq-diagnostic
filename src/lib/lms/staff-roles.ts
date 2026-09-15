import type { Role } from './types';

/**
 * Роли на сайте (STAFF-ROLES-001): admin и manager меняют роль ученик/учитель/автор.
 * Права проверяет БД (security definer RPC), клиент только вызывает. supabase-js
 * грузится лениво, как в repos.ts: демо-страницы его не тянут.
 */
export interface StaffUser {
  id: string;
  display_name: string;
  email: string;
  role: string;
  created_at: string;
}

const MESSAGES: Record<string, string> = {
  'Only admins and managers can manage roles': 'Роли меняют только админ и менеджер',
  'Only student, teacher or author can be set on the site': 'На сайте можно выдать только ученика, учителя или автора',
  'Staff roles are changed only in SQL Editor': 'Роли админа и менеджера меняются только в Supabase',
  'User not found': 'Пользователь не найден',
};

async function client() {
  return (await import('./supabase-auth')).supabaseBrowser();
}

export async function listStaffUsers(): Promise<StaffUser[]> {
  const { data, error } = await (await client()).rpc('staff_list_users');
  if (error) throw new Error(MESSAGES[error.message] ?? error.message);
  return (data ?? []) as StaffUser[];
}

export async function setUserRole(userId: string, role: Role): Promise<void> {
  const { error } = await (await client()).rpc('staff_set_role', { p_user_id: userId, p_role: role });
  if (error) throw new Error(MESSAGES[error.message] ?? error.message);
}
