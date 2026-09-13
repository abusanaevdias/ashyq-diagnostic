import { ROLE_LABELS } from '@/lib/lms/permissions';
import type { Role, User } from '@/lib/lms/types';
import styles from './Lms.module.css';

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ user }: { user: Pick<User, 'name' | 'avatarColor'> }) {
  return (
    <span className={`${styles.avatar} ${styles[`avatar_${user.avatarColor}`]}`} aria-hidden="true">
      {initials(user.name)}
    </span>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const tone = role === 'teacher' ? styles.chipBlush : role === 'author' ? styles.chipInk : '';
  return <span className={`${styles.chip} ${tone}`}>{ROLE_LABELS[role]}</span>;
}
