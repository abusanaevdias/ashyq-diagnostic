import BrandIcon from './BrandIcon';
import styles from './HeroScene.module.css';

export default function HeroScene() {
  return <div className={styles.scene} data-approved-scene role="img" aria-label="Анимация учебного примера: Natural talent make a difference. Правило согласования объясняет исправление make на makes.">
    <div className={styles.orbit} aria-hidden="true" />
    <div className={styles.redSheet} data-hero-paper="back" aria-hidden="true" />
    <div className={styles.paper} data-hero-paper="front" aria-hidden="true">
      <div className={styles.paperHead}><BrandIcon name="edit" size={20} /><span>IELTS WRITING</span><span>01</span></div>
      <p lang="en">Natural talent<br /><span className={styles.correction}><span data-scene-wrong>make a</span><span data-scene-right>makes a</span></span><br />difference.</p>
      <div className={styles.paperFoot}><span>Сначала твоя попытка</span><b>ASHYQ</b></div>
    </div>
    <div className={styles.rule} data-hero-rule aria-hidden="true"><BrandIcon name="book-open" /><div><strong>Пойми правило</strong><p>Talent — единственное число.<br />Поэтому makes.</p></div></div>
    <div className={styles.success} data-hero-success aria-hidden="true"><span>✓</span> Одна ошибка стала понятнее</div>
    <div className={styles.stages} aria-hidden="true"><span>01 · Попытка</span><span>02 · Разбор</span><span>03 · Правка</span></div>
  </div>;
}
