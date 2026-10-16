'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import FluidSegments from './FluidSegments';
import styles from './StudyNavigation.module.css';

export default function StudyNavigation({mobile=false}:{mobile?:boolean}) {
 const path=usePathname(),active=path.startsWith('/library')?'library':path.startsWith('/trainers')||path.startsWith('/writing')?'trainers':'home';
 return <div className={mobile?styles.mobile:styles.desktop} data-study-nav><FluidSegments value={active} label="Разделы обучения">{[['home','/','Главная'],['trainers','/trainers','Тренажёры'],['library','/library','Библиотека']].map(([id,href,label])=><Link key={id} href={href} aria-current={id===active?'page':undefined}>{label}</Link>)}</FluidSegments></div>;
}
