import Image from 'next/image';
import { AiBadge } from '../AiBadge';
import EditorialPoster from './EditorialPoster';
import styles from './EditorialPoster.module.css';

/** Keep the original, labelled illustration visible alongside the new HTML composition. */
export default function EditorialMedia({ label, lines, footnote, photo }: {
  label: string; lines: string[]; footnote: string;
  photo: { src: string; alt: string; width: number; height: number };
}) {
  return <div className={styles.media}>
    <EditorialPoster label={label} lines={lines} footnote={footnote} />
    <figure className={styles.photo}>
      <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(max-width: 900px) 100vw, 42vw" />
      <AiBadge />
    </figure>
  </div>;
}
