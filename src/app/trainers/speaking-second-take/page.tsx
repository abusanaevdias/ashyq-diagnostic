import TrainerIdentityBoundary from '@/components/trainers/TrainerIdentityBoundary';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import SpeakingPracticeEntry from '@/components/trainers/SpeakingPracticeEntry';
import { Footer, NavBar } from '@/components/ui/CleanUi';
export const metadata: Metadata = { title: 'Speaking Second Take — ASHYQ', description: 'Запиши ответ, проверь себя и попробуй снова, затем ответь на новую тему.', robots: { index: false, follow: false } };
export default function Page() { return <><NavBar/><TrainerIdentityBoundary><Suspense fallback={<main className="container"><p role="status">Открываем Speaking…</p></main>}><SpeakingPracticeEntry/></Suspense></TrainerIdentityBoundary><Footer/></>; }
