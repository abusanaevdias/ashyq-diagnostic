import type {Metadata} from 'next';
import {Suspense} from 'react';
import {NavBar,Footer} from '@/components/ui/CleanUi';
import BankPracticeEntry from '@/components/trainers/BankPracticeEntry';
import styles from '../../trainers.module.css';
export const metadata:Metadata={title:'Проба задания — ASHYQ',robots:{index:false,follow:false}};
export default function BankPracticePage(){return <><NavBar/><main className={styles.page}><Suspense fallback={<p role="status">Открываем выбранную версию…</p>}><BankPracticeEntry/></Suspense></main><Footer/></>;}
