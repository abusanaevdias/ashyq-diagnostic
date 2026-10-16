import type {Metadata} from 'next';
import {NavBar,Footer} from '@/components/ui/CleanUi';
import TrainerBankDirectory from '@/components/trainers/TrainerBankDirectory';
import styles from '../trainers.module.css';
export const metadata:Metadata={title:'Банк практики — ASHYQ',robots:{index:false,follow:false}};
export default function TrainerBankPage(){return <><NavBar study/><main className={styles.page}><TrainerBankDirectory/></main><Footer/></>;}
