import Image from 'next/image';
import Link from 'next/link';
import NavAccount from '@/components/lms/NavAccount';
import { SOCIAL_LINKS } from '@/lib/site';
import styles from './CleanUi.module.css';

type IconName = 'book' | 'chart' | 'chat' | 'compass' | 'lock' | 'mail' | 'pin' | 'search' | 'send' | 'spark' | 'target';

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  book: <><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H12v16H7.5A2.5 2.5 0 0 0 5 21.5v-16Z" /><path d="M19 5.5A2.5 2.5 0 0 0 16.5 3H12v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" /></>,
  chart: <><path d="M4 20V10" /><path d="M10 20V5" /><path d="M16 20v-7" /><path d="M22 20H2" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9 4.9-2.1Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
  spark: <><path d="M12 2c.6 5.1 1.8 7 6.9 7.6-5.1.6-6.3 2.5-6.9 7.6-.6-5.1-1.8-7-6.9-7.6C10.2 9 11.4 7.1 12 2Z" /><path d="M19 15.5c.2 1.7.7 2.3 2.4 2.5-1.7.2-2.2.8-2.4 2.5-.2-1.7-.7-2.3-2.4-2.5 1.7-.2 2.2-.8 2.4-2.5Z" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="m15 9 6-6" /><path d="M16 3h5v5" /></>,
  chat: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.3A2.5 2.5 0 0 1 4 13.5v-8Z" /><path d="M8.5 9.5h7" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></>,
  pin: <><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.5" /></>,
  send: <><path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z" /><path d="m10 13 4.5-4.5" /></>,
};

export function LineIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICON_PATHS[name]}
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg className={styles.arrow} width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" />
    </svg>
  );
}

export function MicroLabel({ children }: { children: React.ReactNode }) {
  return <p className={styles.micro}>{children}</p>;
}

export function ButtonLink({ href, children, tone = 'red', ariaLabel }: { href: string; children: React.ReactNode; tone?: 'red' | 'black' | 'outline'; ariaLabel?: string }) {
  const className = tone === 'black' ? styles.buttonBlack : tone === 'outline' ? styles.buttonOutline : styles.buttonRed;
  return <Link href={href} className={className} aria-label={ariaLabel}>{children}<ArrowIcon /></Link>;
}

export function NavBar({ onStart }: { onStart?: () => void }) {
  return (
    <header className={styles.navWrap}>
      <nav className={styles.nav} aria-label="Основная навигация">
        <Link className={styles.logoLink} href="/" aria-label="ASHYQ — на главную">
          <Image className={styles.wordmark} src="/brand/wordmark-red.png" alt="ASHYQ" width={668} height={179} priority />
        </Link>
        <div className={styles.navLinks}>
          <Link className={styles.navLink} href="/courses">Курсы</Link>
          <Link className={styles.navLink} href="/season">Чемпионат</Link>
          <Link className={styles.navLink} href="/program">Программа</Link>
          <Link className={styles.navLink} href="/about">О нас</Link><Link className={styles.navLink} href="/blog">Блог</Link>
          <Link className={styles.navLink} href="/community">Сообщество</Link>
          <Link className={styles.navLink} href="/faq">FAQ</Link>
          <Link className={styles.navLink} href="/contacts">Контакты</Link>
        </div>
        <details className={styles.mobileMenu}>
          <summary className={styles.mobileMenuTrigger} aria-label="Открыть меню">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <div className={styles.mobilePanel}>
            <Link className={styles.navLink} href="/courses">Курсы</Link>
            <Link className={styles.navLink} href="/season">Чемпионат</Link>
            <Link className={styles.navLink} href="/program">Программа</Link>
            <Link className={styles.navLink} href="/about">О нас</Link><Link className={styles.navLink} href="/blog">Блог</Link>
            <Link className={styles.navLink} href="/community">Сообщество</Link>
            <Link className={styles.navLink} href="/faq">FAQ</Link>
            <Link className={styles.navLink} href="/search">Поиск</Link>
            <Link className={styles.navLink} href="/contacts">Контакты</Link>
            <NavAccount variant="panel" />
          </div>
        </details>
        <Link className={styles.searchLink} href="/search" aria-label="Открыть поиск по сайту">
          <LineIcon name="search" />
        </Link>
        <NavAccount variant="bar" />
        {onStart ? (
          <button type="button" className={styles.buttonRed} onClick={onStart}>Диагностика<ArrowIcon /></button>
        ) : (
          <ButtonLink href="/?start=ielts">Диагностика</ButtonLink>
        )}
      </nav>
    </header>
  );
}

export function StatsRow({ items }: { items: Array<{ value: string; label: string }> }) {
  return (
    <div className={styles.stats} aria-label="Ключевые показатели">
      {items.map((item) => <div className={styles.stat} key={item.label}><p className={styles.statValue}>{item.value}</p><p className={styles.statLabel}>{item.label}</p></div>)}
    </div>
  );
}

export function IconChip({ name, solid = false }: { name: IconName; solid?: boolean }) {
  return <span className={solid ? styles.iconChipSolid : styles.iconChip}><LineIcon name={name} /></span>;
}

export function DirectionCard({ href, icon, eyebrow, title, children }: { href: string; icon: IconName; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={styles.direction}>
      <IconChip name={icon} />
      <h3 className={styles.directionTitle}>{title}</h3>
      <p className={styles.directionText}>{children}</p>
      <div className={styles.directionFooter}><MicroLabel>{eyebrow}</MicroLabel><span className={styles.circleArrow}><ArrowIcon /></span></div>
    </Link>
  );
}

export function FilterChip({ children, active = false, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return <button type="button" className={styles.chip} aria-pressed={active} onClick={onClick}>{children}</button>;
}

const FOOTER_GROUPS = [
  { title: 'Учёба', links: [{ href: '/courses', label: 'Курсы' }, { href: '/program', label: 'Программа' }, { href: '/?start=ielts', label: 'Диагностика' }, { href: '/progress', label: 'Прогресс' }] },
  { title: 'ASHYQ', links: [{ href: '/about', label: 'О нас' }, { href: '/blog', label: 'Блог' },{ href: '/community', label: 'Сообщество' }, { href: '/season', label: 'Следующий сезон' }, { href: '/faq', label: 'FAQ' }, { href: '/contacts', label: 'Контакты' }] },
  { title: 'Документы', links: [{ href: '/privacy', label: 'Конфиденциальность' }, { href: '/terms', label: 'Условия' }] },
  { title: 'Соцсети', links: SOCIAL_LINKS.map((social) => ({ href: social.href, label: social.label })) },
] as const;

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerTop}>
          <div><Image className={styles.wordmark} src="/brand/wordmark-red.png" alt="ASHYQ" width={668} height={179} /><p className={styles.footerTagline}>Знания, прогресс и люди, с которыми хочется двигаться дальше.</p></div>
          {FOOTER_GROUPS.map((group) => <div key={group.title}><p className={styles.footerTitle}>{group.title}</p><div className={styles.footerLinks}>{group.links.map((link) => <Link className={styles.footerLink} href={link.href} key={link.href}>{link.label}</Link>)}</div></div>)}
        </div>
        <div className={styles.footerBottom}><span>© 2026 ASHYQ</span><span>Предварительная диагностика IELTS / SAT</span></div>
      </div>
    </footer>
  );
}
