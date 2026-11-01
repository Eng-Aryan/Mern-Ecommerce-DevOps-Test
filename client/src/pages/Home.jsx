import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { imgUrl } from '../api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import useSeo from '../hooks/useSeo.js';
import { getRecent } from '../hooks/useRecentlyViewed.js';
import ProductCard from '../components/ProductCard.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import { SkeletonGrid } from '../components/Loader.jsx';
import Icon from '../components/Icon.jsx';
import { money } from '../api.js';

const Section = ({ title, to, children }) => (
  <section className="container section">
    <div className="section-head"><h2>{title}</h2>{to && <Link to={to} className="more">See all <Icon name="arrowRight" size={16} /></Link>}</div>
    {children}
  </section>
);

export default function Home() {
  const s = useSettings();
  useSeo();
  const [d, setD] = useState({ banners: null, cats: [], best: null, sale: [], latest: [], recent: [] });

  useEffect(() => {
    const get = (url, fallback) => api.get(url).then((r) => r.data).catch(() => fallback);
    const ids = getRecent();
    Promise.all([
      get('/banners', []), get('/products/categories', []), get('/products?sort=bestselling&limit=8', { products: [] }),
      get('/products?onSale=true&limit=4', { products: [] }), get('/products?sort=newest&limit=8', { products: [] }),
      ids.length ? get(`/products/by-ids?ids=${ids.join(',')}`, []) : [],
    ]).then(([banners, cats, best, sale, latest, recent]) => setD({ banners, cats, best: best.products, sale: sale.products, latest: latest.products, recent }));
  }, []);

  const hero = d.banners?.filter((b) => b.position === 'hero') || [];
  const promo = d.banners?.filter((b) => b.position === 'promo') || [];
  const slides = hero.length ? hero : [{ title: s.tagline, subtitle: s.metaDescription, cta: 'Shop all gear', link: '/shop' }];

  return (
    <>
      <HeroCarousel slides={slides} />

      <section className="perks-strip">
        <div className="container perks">
          <div><Icon name="truck" /><span><strong>{s.freeShippingOver > 0 ? `Free shipping over ${money(s.freeShippingOver)}` : 'Free shipping'}</strong><small>Fast delivery to your door</small></span></div>
          <div><Icon name="refresh" /><span><strong>{s.returnDays}-day returns</strong><small>Not right? Send it back</small></span></div>
          <div><Icon name="shield" /><span><strong>Secure checkout</strong><small>{s.codEnabled ? 'Pay on delivery or by card' : 'Card payments'}</small></span></div>
        </div>
      </section>

      {d.cats.length > 0 && (
        <Section title="Shop by category">
          <div className="cat-tiles">
            {d.cats.map((c) => (
              <Link key={c.name} to={`/shop?category=${encodeURIComponent(c.name)}`} className="tile" style={c.image ? { '--img': `url("${imgUrl(c.image)}")` } : undefined}>
                <strong>{c.name}</strong><span>{c.count} {c.count === 1 ? 'item' : 'items'}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="Best sellers" to="/shop?sort=bestselling">
        {d.best === null ? <SkeletonGrid n={4} /> : d.best.length === 0 ? <p className="muted">No products yet. Run <code>npm run seed</code> to add sample gear.</p> : <div className="grid">{d.best.slice(0, 4).map((p) => <ProductCard key={p._id} product={p} />)}</div>}
      </Section>

      {promo.length > 0 && (
        <section className="container promos">
          {promo.slice(0, 2).map((b) => (
            <Link key={b._id} to={b.link || '/shop'} className="promo" style={b.image ? { '--img': `url("${imgUrl(b.image)}")` } : undefined}>
              <span><strong>{b.title}</strong>{b.subtitle && <small>{b.subtitle}</small>}<em>{b.cta} <Icon name="arrowRight" size={16} /></em></span>
            </Link>
          ))}
        </section>
      )}

      {d.sale.length > 0 && <Section title="On sale now" to="/shop?onSale=true"><div className="grid">{d.sale.map((p) => <ProductCard key={p._id} product={p} />)}</div></Section>}

      {d.latest.length > 0 && <Section title="New arrivals" to="/shop?sort=newest"><div className="grid">{d.latest.slice(0, 8).map((p) => <ProductCard key={p._id} product={p} />)}</div></Section>}

      {d.recent.length > 0 && <Section title="Recently viewed"><div className="rail">{d.recent.map((p) => <ProductCard key={p._id} product={p} />)}</div></Section>}
    </>
  );
}
