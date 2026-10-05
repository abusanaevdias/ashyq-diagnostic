import type { Metadata } from 'next';
import SpeakingSecondTake from '@/components/trainers/SpeakingSecondTake';
import { Footer, NavBar } from '@/components/ui/CleanUi';
export const metadata: Metadata = { title: 'Speaking Second Take — ASHYQ', description: 'Запиши ответ, проверь себя и попробуй снова, затем ответь на новую тему.', robots: { index: false, follow: false } };
export default function Page() { return <><NavBar/><SpeakingSecondTake/><Footer/></>; }
