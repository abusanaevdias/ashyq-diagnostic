'use client';

import { useStorageAvailable } from '@/lib/lms/hooks';
import styles from './Lms.module.css';

export default function DemoBanner() {
  const storage = useStorageAvailable();
  return (
    <p className={styles.banner} role="note">
      Демо: аккаунты и данные хранятся на этом устройстве. Регистрация через Supabase — следующим шагом.
      {storage === false ? (
        <span className={styles.bannerWarn}>Данные не сохраняются: браузер запретил локальное хранилище — после закрытия вкладки всё пропадёт.</span>
      ) : null}
    </p>
  );
}
