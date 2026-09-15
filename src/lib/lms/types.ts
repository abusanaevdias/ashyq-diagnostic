/**
 * Сущности учебного слоя (LMS-001). Демо-режим хранит их в localStorage
 * `ashyq:v2:*`; будущая Supabase-реализация использует те же типы.
 * Даты — ISO-строки, id — crypto.randomUUID().
 */

export type Role = 'student' | 'teacher' | 'author';
/** Зарезервировано под будущую админку, не реализовано. */
export type ReservedRole = 'admin';

/** Имя токена v3 (design/tokens.css), не hex: UI маппит в var(--…). */
export type AvatarColor = 'red' | 'red-deep' | 'ink' | 'dark-warm';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarColor: AvatarColor;
  /** admin/manager в Supabase: ссылка на /crm в кабинете. Доступ к данным всё равно проверяет сервер. */
  crm?: boolean;
}

export interface Session {
  user: User;
  expiresAt: string;
}

export interface ClassRoom {
  id: string;
  title: string;
  subject: string;
  teacherId: string;
  memberIds: string[];
  inviteCode: string;
  createdAt: string;
}

export interface MaterialRef {
  id: string;
  kind: 'file' | 'link' | 'text';
  title: string;
  url?: string;
  sizeBytes?: number;
  /** Только для kind 'text': в ТЗ у текстового материала нет поля под сам текст. */
  body?: string;
}

export interface Lesson {
  id: string;
  classId: string;
  title: string;
  body: string;
  materials: MaterialRef[];
  publishedAt: string;
}

export interface Assignment {
  id: string;
  classId: string;
  teacherId: string;
  title: string;
  brief: string;
  dueAt: string;
  maxPoints: number;
  createdAt: string;
}

export type SubmissionStatus = 'submitted' | 'graded';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  attachments: MaterialRef[];
  submittedAt: string;
  status: SubmissionStatus;
  grade?: number;
}

export interface Comment {
  id: string;
  submissionId: string;
  authorId: string;
  authorRole: Role;
  body: string;
  createdAt: string;
}

export type PostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  coverUrl?: string;
  status: PostStatus;
  authorId: string;
  publishedAt?: string;
}
