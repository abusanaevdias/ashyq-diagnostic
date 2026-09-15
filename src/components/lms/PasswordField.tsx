'use client';

import { useId, useState } from 'react';
import styles from './Lms.module.css';

/**
 * Поле пароля с кнопкой «Показать/Скрыть» (PASSWORD-TOGGLE-001). Кнопка стоит вне
 * <label>: иначе её текст попал бы в доступное имя поля («Пароль Показать»).
 */
export default function PasswordField({ label, ...input }: { label: React.ReactNode } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'id' | 'className'>) {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <div className={styles.fieldLabel}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordWrap}>
        <input {...input} id={id} className={`${styles.field} ${styles.passwordInput}`} type={shown ? 'text' : 'password'} />
        <button type="button" className={styles.passwordToggle} aria-controls={id} aria-pressed={shown} onClick={() => setShown((value) => !value)}>
          {shown ? 'Скрыть' : 'Показать'}
        </button>
      </div>
    </div>
  );
}
