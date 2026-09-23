'use client';

import { useParams } from 'next/navigation';
import { useLmsData } from '@/lib/lms/hooks';
import { canManageClass, ROUTE_ROLES } from '@/lib/lms/permissions';
import { getRepos } from '@/lib/lms/repos';
import type { User } from '@/lib/lms/types';
import { JevPreviewContent } from './JevSyntheticPreview';
import RequireRole from './RequireRole';
import { Loading, Unavailable } from './States';

export default function JevClassPreview() {
  const { id } = useParams<{ id: string }>();
  return <RequireRole roles={ROUTE_ROLES.teacher}>{(user) => <ClassPreview id={id} user={user} />}</RequireRole>;
}

function ClassPreview({ id, user }: { id: string; user: User }) {
  const { data: cls, loading, error } = useLmsData(() => getRepos().classes.get(id), `jev-class:${id}:${user.id}`);

  if (loading) return <Loading />;
  if (error) return <Unavailable title="Не удалось загрузить класс" text={error} href="/teacher" label="К классам" />;
  if (!cls || !canManageClass(user, cls)) {
    return <Unavailable title="Класс недоступен" text="Класс не найден или его ведёт другой учитель." href="/teacher" label="К классам" />;
  }

  return <JevPreviewContent classContext={{ id: cls.id, title: cls.title }} />;
}
