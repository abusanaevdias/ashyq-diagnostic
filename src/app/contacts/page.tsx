import type { Metadata } from 'next';
import ContactsV3 from '@/components/ContactsV3';

export const metadata: Metadata = {
  title: 'Контакты ASHYQ',
  description: 'Как связаться с ASHYQ: WhatsApp, Telegram, Instagram, Threads и заявка на сезон.',
  alternates: { canonical: '/contacts' },
};

export default function ContactsPage() {
  return <ContactsV3 />;
}
