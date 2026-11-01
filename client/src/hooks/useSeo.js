import { useEffect } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import { imgUrl } from '../api.js';

const setMeta = (sel, attr, key, value) => {
  let el = document.head.querySelector(sel);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value || '');
};

// Sets the page title, description, social-share tags and optional JSON-LD structured data.
export default function useSeo({ title, description, image, jsonLd } = {}) {
  const s = useSettings();
  useEffect(() => {
    const name = s.storeName || 'Store';
    const full = title ? `${title} · ${name}` : `${name} — ${s.tagline || ''}`.replace(/ — $/, '');
    const desc = description || s.metaDescription || '';
    document.title = full;
    setMeta('meta[name="description"]', 'name', 'description', desc);
    setMeta('meta[property="og:title"]', 'property', 'og:title', full);
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc);
    setMeta('meta[property="og:type"]', 'property', 'og:type', jsonLd?.['@type'] === 'Product' ? 'product' : 'website');
    if (image) setMeta('meta[property="og:image"]', 'property', 'og:image', /^https?:/.test(image) ? image : location.origin + imgUrl(image));
    let tag = document.getElementById('ld-json');
    if (jsonLd) {
      if (!tag) { tag = document.createElement('script'); tag.id = 'ld-json'; tag.type = 'application/ld+json'; document.head.appendChild(tag); }
      tag.textContent = JSON.stringify(jsonLd);
    } else tag?.remove();
    return () => document.getElementById('ld-json')?.remove();
  }, [title, description, image, JSON.stringify(jsonLd), s.storeName]); // eslint-disable-line
}
