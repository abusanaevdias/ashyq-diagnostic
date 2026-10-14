'use client';
import { Fragment,useEffect,useRef,useState, type ReactNode } from 'react';
import { useSession } from '@/lib/lms/hooks';

/** Unmount drafts, recorder and all transient state when identity changes. */
export default function TrainerIdentityBoundary({ children }: { children: ReactNode }) {
  const { session, ready } = useSession();
  const [documentReady,setDocumentReady]=useState(false),[unavailable,setUnavailable]=useState(false),checked=useRef(false);
  useEffect(()=>{
    if(checked.current)return;checked.current=true;
    const current=new URL(location.href);
    // Source-bound Speaking already owns its stricter query/login/canonical-document protocol.
    if(current.pathname==='/trainers/speaking-second-take'&&['reviewBatch','reviewVersion','reviewUnit','reviewHash'].some(key=>current.searchParams.has(key))){setDocumentReady(true);return;}
    const nav=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
    if(!nav){setUnavailable(true);return;}
    let original:URL;try{original=new URL(nav.name);}catch{setUnavailable(true);return;}
    const realm=window as typeof window&{__ashyqPublicPracticeUsed?:boolean};
    if(original.pathname!==current.pathname||realm.__ashyqPublicPracticeUsed){location.replace(current.href);return;}
    realm.__ashyqPublicPracticeUsed=true;setDocumentReady(true);
  },[]);
  if(unavailable)return <main className="container"><h1>Открой практику отдельной страницей</h1><p>Браузер не сообщил данные о переходе. Ответы ещё не загружены. Используй актуальный браузер и открой ссылку в новой вкладке.</p></main>;
  if (!ready||!documentReady) return <main className="container" aria-busy="true"><p role="status">Открываем тренажёр…</p></main>;
  return <Fragment key={session?.user.id ?? 'guest'}>{children}</Fragment>;
}
