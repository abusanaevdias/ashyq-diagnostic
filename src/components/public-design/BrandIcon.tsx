'use client';

import { useId } from 'react';
import icons from './icons.json';

export type BrandIconName = keyof typeof icons;

/** Apache-2.0 IconPark TwoTone, the owner's selected third icon direction. */
export default function BrandIcon({ name = 'book-open', size = 24 }: { name?: BrandIconName; size?: number }) {
  const id = useId().replace(/[^a-z0-9]/gi, '');
  let body = icons[name];
  const ids = [...body.matchAll(/id="([^"]+)"/g)].map(match => match[1]);
  for (const old of ids) body = body.replaceAll(old, `${id}-${old}`);
  return <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: body }} />;
}
