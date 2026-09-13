import { Footer, NavBar } from '@/components/ui/CleanUi';
import home from '@/components/HomeV3.module.css';
import DemoBanner from './DemoBanner';
import styles from './Lms.module.css';

/** Каркас auth-страниц: навбар, честный демо-баннер, контент, футер. */
export default function LmsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={home.page}>
      <NavBar />
      <DemoBanner />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
