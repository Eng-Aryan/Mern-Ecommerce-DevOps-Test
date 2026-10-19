import { useState } from 'react';
import { imgUrl } from '../api.js';

// Falls back to a tinted block with the product's initial if the image is missing or fails to load.
export default function ProductImage({ src, name = '', className = '' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={`img-fallback ${className}`} aria-label={name}>{name.charAt(0)}</div>;
  return <img className={className} src={imgUrl(src)} alt={name} loading="lazy" onError={() => setFailed(true)} />;
}
