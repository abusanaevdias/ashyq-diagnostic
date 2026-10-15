import styles from './StudyDesign.module.css';

/** Approved learning design; keeps the separate blog/commercial owners' layouts intact. */
export default function StudyDesign({children}:{children:React.ReactNode}) {
 return <div className={styles.root} data-study-design="apple">{children}</div>;
}
