import type { Metadata } from 'next';
import Task1Overview from '@/components/trainers/Task1Overview';
import { Footer, NavBar } from '@/components/ui/CleanUi';
export const metadata: Metadata = { title:'Task 1: собери overview по графику — ASHYQ',description:'Выбери главное, напиши overview, проверь опору на данные и убери неточные утверждения.',robots:{index:false,follow:false} };
export default function Page(){return <><NavBar/><Task1Overview/><Footer/></>;}
