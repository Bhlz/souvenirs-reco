'use client';
import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

type Props = Omit<ImageProps, 'src' | 'alt'> & {
  src?: string;
  alt: string;
  fallbackSrc?: string;
};

export default function SafeImage({
  src,
  alt,
  fallbackSrc = '/fallback.jpg',
  onError,
  ...rest
}: Props) {
  const [current, setCurrent] = useState(src || fallbackSrc);
  return (
    <Image
      {...rest}
      src={current}
      alt={alt}
      onError={(e) => {
        setCurrent(fallbackSrc);
        onError?.(e as any);
      }}
    />
  );
}
