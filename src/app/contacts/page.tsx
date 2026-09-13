import type { Metadata } from 'next';
import ContactsV3, { CONTACTS_IS_DEMO } from '@/components/ContactsV3';

export const metadata: Metadata = {
  title: 'Контакты ASHYQ',
  description: 'Как связаться с ASHYQ: WhatsApp, заявка и формат занятий в Астане и онлайн.',
  // без подтверждённых контактов страницу не индексируем
  robots: CONTACTS_IS_DEMO ? { index: false, follow: false } : undefined,
};

export default function ContactsPage() {
  return <ContactsV3 />;
}
