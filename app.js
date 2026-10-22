(function () {
  'use strict';

  const clone = x => JSON.parse(JSON.stringify(x));
  const SHOP = window.SHOP, I18N = window.I18N;
  const DEFAULT_SHOP = clone(SHOP);
  const tg = window.Telegram && window.Telegram.WebApp;
  const inTG = !!(tg && tg.initData);
  const tgUser = (inTG && tg.initDataUnsafe && tg.initDataUnsafe.user) || null;
  const ownerByTelegram = !!(tgUser && (SHOP.adminIds || []).includes(tgUser.id));
  const app = document.getElementById('app');
  const NAV = ['home', 'catalog', 'fav', 'cart', 'profile'];

  // ---------- Storage (per viewer, browser only) ----------
  const KEY = SHOP.orderPrefix.toLowerCase() + ':';
  function load(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function persist(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  // The seller's edits (catalog, contacts, delivery, promo codes) override the files.
  let PRODUCTS = load('catalog', null) || clone(window.PRODUCTS);
  Object.assign(SHOP, load('settings', {}));

  function freshFilters() { return { cat: 'all', q: '', sale: false, sort: 'popular', price: null, brands: [], skin: null }; }

  const state = {
    lang: load('lang', SHOP.defaultLang),
    cart: load('cart', []),
    fav: load('fav', []),
    orders: load('orders', []),
    seenWelcome: false, // shown on every launch, so the demo always opens with it
    demoOrders: load('demoOrders', null),
    adminDemo: load('adminDemo', false),
    promo: load('promo', null),
    checkout: Object.assign({
      name: tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : '',
      phone: '', delivery: SHOP.delivery[0].id, address: '', payment: 'cash', comment: ''
    }, load('checkout', {})),
    errors: {},
    filters: freshFilters(),
    draft: null,
    sheet: null,
    pd: {},
    promoMsg: null,
    justOrdered: false,
    focusSearch: false,
    route: { name: 'home' }
  };

  function save() {
    persist('lang', state.lang); persist('cart', state.cart); persist('fav', state.fav);
    persist('orders', state.orders);
    persist('promo', state.promo); persist('checkout', state.checkout);
    persist('demoOrders', state.demoOrders); persist('adminDemo', state.adminDemo);
  }
  function isAdmin() { return ownerByTelegram || (SHOP.demoAdminSwitch && state.adminDemo); }
  function allOrders() { return state.orders.concat(state.demoOrders || []).sort((a, b) => b.ts - a.ts); }

  // ---------- Helpers ----------
  function t(k, vars) {
    let s = (I18N[state.lang] && I18N[state.lang][k]) || I18N.uz[k] || k;
    if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
    return s;
  }
  function has(k) { return !!(I18N[state.lang] && I18N[state.lang][k]); }
  function L(x) { return x == null ? '' : typeof x === 'string' ? x : (x[state.lang] || x.uz || ''); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function money(n) { return fmt(n) + ' ' + t('sum'); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function timeStr(ts) { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function dateStr(ts) { const d = new Date(ts); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ', ' + timeStr(ts); }
  function fmtPhone(d) { return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' '); }

  // A photo is an Unsplash id, or a full/data URL for photos the seller uploaded.
  function photoUrl(id, w) {
    if (!id) return '';
    return /^(data:|https?:)/.test(id) ? id : 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&q=75&w=' + w;
  }
  function ph(id, w, cls, alt, eager) {
    return `<div class="ph ${cls || ''}"><img src="${photoUrl(id, w)}" alt="${esc(alt || '')}" ${eager ? '' : 'loading="lazy"'} onload="this.classList.add('ld')" onerror="this.classList.add('err')"></div>`;
  }

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    heart: '<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.9 1.3-1.8 2.9-2.9 4.9-2.9 3.5 0 5.7 3.4 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/>',
    bag: '<path d="M5 8h14l-1 12.2a1 1 0 0 1-1 .8H7a1 1 0 0 1-1-.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    filter: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    store: '<path d="M4 10v10h16V10"/><path d="M3 10l1.5-6h15L21 10a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M10 20v-5h4v5"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
    bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
    phone: '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5A16.5 16.5 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5z"/>',
    send: '<path d="M21 4 3 11l7 2.5L12.5 21z"/><path d="M10 13.5 21 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    fire: '<path d="M12 21c-4 0-7-2.8-7-6.6 0-3.7 3-5.7 4-9.4 2.6 1.6 3.4 4 3.4 5.4 1-.6 1.8-1.9 2-3.4 2.2 1.8 3.6 4.4 3.6 7.4 0 3.8-2.6 6.6-6 6.6z"/>'
  };
  function icon(name, size, fill) {
    size = size || 22;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  // ---------- Catalog & cart ----------
  let byId = {};
  function reindex() { byId = {}; PRODUCTS.forEach(p => { byId[p.id] = p; }); }
  reindex();
  function brands() { return [...new Set(PRODUCTS.map(p => p.brand).filter(Boolean))]; }
  function freeDelivery() { return SHOP.delivery.find(d => d.freeFrom); }
  const SORT_KEYS = { popular: 'sortPopular', cheap: 'sortCheap', expensive: 'sortExpensive', new: 'sortNew' };
  const PRICES = [{ id: 'lt100', max: 100000 }, { id: 'mid', min: 100000, max: 200000 }, { id: 'gt200', min: 200000 }];
  const STATUSES = ['new', 'confirmed', 'shipping', 'delivered'];

  function variantOf(p, vid) { return p.variants.find(v => v.id === vid) || p.variants[0]; }
  function off(v) { return v.oldPrice ? Math.round((1 - v.price / v.oldPrice) * 100) : 0; }
  function isSale(p) { return p.variants.some(v => v.oldPrice); }
  function minPrice(p) { return Math.min.apply(null, p.variants.map(v => v.price)); }
  function catWords(id) { const c = SHOP.categories.find(x => x.id === id); return c ? c.name.uz + ' ' + c.name.ru : ''; }

  function cartCount() { return state.cart.reduce((s, l) => s + l.qty, 0); }
  function cartLines() {
    return state.cart.map(l => {
      const p = byId[l.id];
      if (!p) return null;
      const v = variantOf(p, l.v);
      return { l, p, v, sum: v.price * l.qty };
    }).filter(Boolean);
  }
  function addToCart(id, vid, qty) {
    const l = state.cart.find(x => x.id === id && x.v === vid);
    if (l) l.qty = Math.min(99, l.qty + qty); else state.cart.push({ id, v: vid, qty });
    save(); updateBadges();
  }
  function findLine(el) { return state.cart.find(l => l.id === el.dataset.id && l.v === el.dataset.v); }
  function deliveryById(id) { return SHOP.delivery.find(d => d.id === id) || SHOP.delivery[0]; }
  function deliveryPrice(d, after) { return d.freeFrom && after >= d.freeFrom ? 0 : d.price; }
  function totals(withDelivery) {
    const lines = cartLines();
    const subtotal = lines.reduce((s, x) => s + x.sum, 0);
    const pct = (state.promo && SHOP.promoCodes[state.promo]) || 0;
    const discount = Math.round(subtotal * pct / 10000) * 100;
    const after = subtotal - discount;
    const delivery = withDelivery ? deliveryPrice(deliveryById(state.checkout.delivery), after) : 0;
    return { lines, subtotal, pct, discount, after, delivery, total: after + delivery, count: lines.reduce((s, x) => s + x.l.qty, 0) };
  }

  function priceOk(p, id) {
    if (!id) return true;
    const r = PRICES.find(x => x.id === id), m = minPrice(p);
    return (!r.min || m >= r.min) && (!r.max || m < r.max);
  }
  function priceLabel(r) {
    return r.min && r.max ? fmt(r.min) + ' – ' + fmt(r.max) : r.max ? t('priceUpTo', { x: fmt(r.max) }) : t('priceFrom', { x: fmt(r.min) });
  }
  function filtered(f) {
    f = f || state.filters;
    const q = f.q.trim().toLowerCase();
    const list = PRODUCTS.filter(p =>
      (f.cat === 'all' || p.cat === f.cat) && (!f.sale || isSale(p)) &&
      (!f.brands.length || f.brands.includes(p.brand)) && (!f.skin || p.skin.includes(f.skin)) &&
      priceOk(p, f.price) &&
      (!q || [p.name.uz, p.name.ru, p.brand, p.short.uz, p.short.ru, catWords(p.cat)].join(' ').toLowerCase().includes(q)));
    const sorts = {
      popular: (a, b) => (b.popular | 0) - (a.popular | 0) || b.reviews - a.reviews,
      cheap: (a, b) => minPrice(a) - minPrice(b),
      expensive: (a, b) => minPrice(b) - minPrice(a),
      new: (a, b) => (b.isNew | 0) - (a.isNew | 0) || b.rating - a.rating
    };
    return list.sort(sorts[f.sort] || sorts.popular);
  }
  function activeFilterCount(f) { return (f.price ? 1 : 0) + f.brands.length + (f.skin ? 1 : 0) + (f.sort !== 'popular' ? 1 : 0); }

  // ---------- Small UI parts ----------
  function badge() { const n = cartCount(); return `<span class="badge" data-badge ${n ? '' : 'hidden'}>${n}</span>`; }
  function updateBadges() { const n = cartCount(); document.querySelectorAll('[data-badge]').forEach(b => { b.textContent = n; b.hidden = !n; }); }
  function langSeg(cls) {
    return `<div class="seg ${cls}">${SHOP.languages.map(l => `<button class="${l === state.lang ? 'on' : ''}" data-act="lang" data-v="${l}">${l.toUpperCase()}</button>`).join('')}</div>`;
  }
  function emptyBox(ic, title, text, extra) {
    return `<div class="empty"><div class="empty-ico">${icon(ic, 40)}</div><h3>${title}</h3><p>${text}</p>${extra || ''}</div>`;
  }
  function sumRow(label, val, cls) { return `<div class="sum-row ${cls || ''}"><span>${label}</span><b>${val}</b></div>`; }
  function backBtn() { return inTG ? '' : `<button class="icon-btn" data-act="back" aria-label="${t('back')}">${icon('back')}</button>`; }

  function card(p) {
    const v = p.variants[0], o = off(v), isFav = state.fav.includes(p.id);
    const tag = p.stock === 'out' ? '' :
      o ? `<span class="chip-badge">−${o}%</span>` :
      p.isNew ? `<span class="chip-badge new">${t('newItems')}</span>` :
      p.stock === 'low' ? `<span class="chip-badge low">${t('lowStock')}</span>` : '';
    return `<a class="card" href="#/product/${p.id}">
      ${tag}
      <button class="fav-btn ${isFav ? 'on' : ''}" data-act="fav" data-id="${p.id}" aria-label="${t('navFav')}">${icon('heart', 18, isFav)}</button>
      ${ph(p.photos[0], 400, '', L(p.name))}
      <div class="card-body">
        <div class="card-brand">${esc(p.brand)}</div>
        <div class="card-name">${esc(L(p.name))}</div>
        <div class="card-rating">${icon('star', 13, true)} <b>${p.rating.toFixed(1)}</b> (${p.reviews})</div>
        <div class="card-foot">
          <div>${o ? `<div class="price-old">${money(v.oldPrice)}</div>` : ''}<div class="price ${o ? 'sale' : ''}">${money(v.price)}</div></div>
          <button class="add-btn" data-act="quickAdd" data-id="${p.id}" ${p.stock === 'out' ? 'disabled' : ''} aria-label="${t('addToCart')}">${icon('plus', 18)}</button>
        </div>
      </div>
    </a>`;
  }

  function navBar(cur) {
    const items = [['home', '#/', 'home', 'navHome'], ['catalog', '#/catalog', 'grid', 'navCatalog'], ['fav', '#/fav', 'heart', 'navFav'], ['cart', '#/cart', 'bag', 'navCart'], ['profile', '#/profile', 'user', 'navProfile']];
    return `<nav class="nav">${items.map(([k, h, ic, lbl]) =>
      `<a href="${h}" class="${cur === k ? 'on' : ''}"><span class="ico" ${k === 'cart' ? 'data-cart-target' : ''}>${icon(ic, 22, cur === k && k === 'fav')}${k === 'cart' ? badge() : ''}</span>${t(lbl)}</a>`
    ).join('')}</nav>`;
  }

  // ---------- Views ----------
  function vWelcome() {
    return `<div class="welcome">
      ${ph(SHOP.welcomePhoto, 900, '', SHOP.name, true)}
      <div class="welcome-top"><div class="logo">${esc(SHOP.logo)}</div>${langSeg('')}</div>
      <div class="welcome-body">
        <h1>${t('welcomeTitle')}</h1>
        <p>${t('welcomeText')}</p>
        <div class="welcome-stats">
          <div><b>2 000+</b><span>${t('statClients')}</span></div>
          <div><b>4.9 ★</b><span>${t('statRating')}</span></div>
          <div><b>24/7</b><span>${t('statOrders')}</span></div>
        </div>
        <button class="btn" data-act="start">${t('start')} ${icon('chev', 20)}</button>
      </div>
    </div>`;
  }

  function carousel() {
    return `<div class="carousel">
      <div class="slides" data-carousel>${SHOP.banners.map((b, i) => `
        <div class="slide" data-act="banner" data-i="${i}">
          ${ph(b.photo, 800, '', L(b.title), i === 0)}
          <div class="slide-body">
            <div class="slide-tag">${esc(L(b.tag))}</div>
            <div class="slide-title">${esc(L(b.title))}</div>
            <div class="slide-text">${esc(L(b.text))}</div>
            <span class="slide-btn">${t('shopNow')}</span>
          </div>
        </div>`).join('')}
      </div>
      <div class="dots">${SHOP.banners.map((b, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
    </div>`;
  }

  function vHome() {
    const name = tgUser ? tgUser.first_name : '';
    const sale = PRODUCTS.filter(isSale);
    const popular = PRODUCTS.filter(p => p.popular).slice(0, 6);
    const fresh = PRODUCTS.filter(p => p.isNew);
    return `<div class="screen">
      <div class="topbar">
        <div class="grow">
          <div class="hello">${t('hello')}${name ? ', ' + esc(name) : ''} 👋</div>
          <div class="hello-sub">${t('lookingFor')}</div>
        </div>
        <a class="icon-btn" href="#/fav" aria-label="${t('navFav')}">${icon('heart')}</a>
      </div>
      <div class="search" data-act="openSearch" role="button">${icon('search', 20)}<span style="flex:1">${t('search')}</span><span class="filter-btn">${icon('filter', 20)}</span></div>
      ${carousel()}
      <div class="cats">
        <button class="cat" data-act="goCat" data-cat="all"><div class="cat-img"><div class="all">${icon('grid', 24)}</div></div>${t('all')}</button>
        ${SHOP.categories.map(c => `<button class="cat" data-act="goCat" data-cat="${c.id}"><div class="cat-img">${ph(c.photo, 160, '', L(c.name))}</div>${esc(L(c.name))}</button>`).join('')}
      </div>
      <div class="trust">
        <div>${icon('shield', 16)}${t('trustOriginal')}</div>
        <div>${icon('truck', 16)}${t('trustFast')}</div>
        <div>${icon('card', 16)}${t('trustPay')}</div>
      </div>
      <div class="section">
        <div class="section-head"><h2>${icon('fire', 20)} ${t('sale')}</h2><span class="timer">${t('endsIn')} <b data-cd="h">00</b>:<b data-cd="m">00</b>:<b data-cd="s">00</b></span></div>
        <div class="hscroll">${sale.map(card).join('')}</div>
      </div>
      <div class="section">
        <div class="section-head"><h2>${t('popular')}</h2><button class="see-all" data-act="goCat" data-cat="all">${t('seeAll')}</button></div>
        <div class="grid">${popular.map(card).join('')}</div>
      </div>
      <div class="section">
        <div class="section-head"><h2>${t('newItems')}</h2><button class="see-all" data-act="goSort" data-sort="new">${t('seeAll')}</button></div>
        <div class="hscroll">${fresh.map(card).join('')}</div>
      </div>
    </div>`;
  }

  function vCatalog() {
    const f = state.filters;
    return `<div class="screen">
      <div class="page-title"><h1>${t('catalog')}</h1></div>
      <div class="search">${icon('search', 20)}
        <input type="search" data-input="q" value="${esc(f.q)}" placeholder="${t('search')}" enterkeyhint="search" aria-label="${t('search')}">
        <button class="clear" data-act="clearQ" ${f.q ? '' : 'hidden'} aria-label="${t('reset')}">${icon('close', 18)}</button>
        <button class="filter-btn" data-act="openFilters" aria-label="${t('filters')}">${icon('filter', 20)}${activeFilterCount(f) ? '<span class="dot"></span>' : ''}</button>
      </div>
      <div class="chips">
        <button class="chip hot ${f.sale ? 'on' : ''}" data-act="toggleSale">🔥 ${t('saleChip')}</button>
        <button class="chip ${f.cat === 'all' ? 'on' : ''}" data-act="cat" data-cat="all">${t('all')}</button>
        ${SHOP.categories.map(c => `<button class="chip ${f.cat === c.id ? 'on' : ''}" data-act="cat" data-cat="${c.id}">${esc(L(c.name))}</button>`).join('')}
      </div>
      <div class="results-bar"><span data-count></span>
        <select class="select" data-change="sort" aria-label="${t('sort')}">${Object.keys(SORT_KEYS).map(s => `<option value="${s}" ${f.sort === s ? 'selected' : ''}>${t(SORT_KEYS[s])}</option>`).join('')}</select>
      </div>
      <div id="results"></div>
    </div>`;
  }

  function paintResults() {
    const el = document.getElementById('results');
    if (!el) return;
    const list = filtered();
    const count = app.querySelector('[data-count]');
    if (count) count.textContent = t('found', { n: list.length });
    const clr = app.querySelector('[data-act=clearQ]');
    if (clr) clr.hidden = !state.filters.q;
    el.innerHTML = list.length
      ? `<div class="grid">${list.map(card).join('')}</div>`
      : emptyBox('search', t('nothing'), t('nothingHint'), `<button class="btn btn-ghost" data-act="resetAll">${t('reset')}</button>`);
  }

  function chipD(k, v, label, on) { return `<button class="chip ${on ? 'on' : ''}" data-act="draft" data-k="${k}" data-v="${esc(v)}">${label}</button>`; }
  function sheetView() {
    if (state.sheet !== 'filters') return '';
    const d = state.draft;
    return `<div class="sheet-wrap">
      <div class="sheet-bg" data-act="closeSheet"></div>
      <div class="sheet" role="dialog" aria-label="${t('filters')}">
        <div class="grab"></div>
        <h3>${t('filters')}</h3>
        <div class="s-label">${t('sort')}</div>
        <div class="chips wrap">${Object.keys(SORT_KEYS).map(s => chipD('sort', s, t(SORT_KEYS[s]), d.sort === s)).join('')}</div>
        <div class="s-label">${t('price')}, ${t('sum')}</div>
        <div class="chips wrap">${PRICES.map(r => chipD('price', r.id, priceLabel(r), d.price === r.id)).join('')}</div>
        <div class="s-label">${t('skinType')}</div>
        <div class="chips wrap">${['dry', 'oily', 'combo', 'sensitive'].map(s => chipD('skin', s, t('skin_' + s), d.skin === s)).join('')}</div>
        <div class="s-label">${t('brand')}</div>
        <div class="chips wrap">${brands().map(b => chipD('brand', b, esc(b), d.brands.includes(b))).join('')}</div>
        <div class="sheet-actions">
          <button class="btn btn-ghost" data-act="draftReset">${t('reset')}</button>
          <button class="btn btn-primary" data-act="applyFilters">${t('show', { n: filtered(d).length })}</button>
        </div>
      </div>
    </div>`;
  }
  function paintSheet() {
    const w = app.querySelector('.sheet-wrap');
    if (!w) return;
    const top = w.querySelector('.sheet').scrollTop;
    const tmp = document.createElement('div');
    tmp.innerHTML = sheetView();
    const nw = tmp.firstElementChild;
    nw.classList.add('still');
    w.replaceWith(nw);
    nw.querySelector('.sheet').scrollTop = top;
  }

  function variantPicker(p, v) {
    if (!p.variantType) return '';
    if (p.variantType === 'shade') {
      return `<div class="pd-label">${t('shade')}: <span>${esc(L(v.label))}</span></div>
        <div class="variants">${p.variants.map(x => `<button class="swatch ${x.id === v.id ? 'on' : ''}" style="background:${x.color}" data-act="variant" data-v="${x.id}" aria-label="${esc(L(x.label))}"></button>`).join('')}</div>`;
    }
    return `<div class="pd-label">${t('volume')}</div>
      <div class="variants">${p.variants.map(x => `<button class="var-btn ${x.id === v.id ? 'on' : ''}" data-act="variant" data-v="${x.id}">${esc(L(x.label))}<small>${money(x.price)}</small></button>`).join('')}</div>`;
  }

  function vProduct(r) {
    const p = byId[r.id];
    if (!p) return vNotFound();
    if (state.pd.id !== p.id) state.pd = { id: p.id, v: p.variants[0].id, qty: 1, tab: 'desc' };
    const pd = state.pd, v = variantOf(p, pd.v), o = off(v), isFav = state.fav.includes(p.id);
    const related = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id)
      .concat(PRODUCTS.filter(x => x.popular && x.cat !== p.cat)).slice(0, 8);
    const stockKey = { in: 'inStock', low: 'lowStock', out: 'outStock' }[p.stock];
    const skins = p.skin.length === 4 ? [t('skin_all')] : p.skin.map(s => t('skin_' + s));
    const out = p.stock === 'out';
    return `<div class="screen no-nav">
      <div class="pd-gallery">
        <div class="pd-top">${backBtn()}<span class="grow"></span>
          <button class="icon-btn ${isFav ? 'on' : ''}" data-act="fav" data-id="${p.id}" aria-label="${t('navFav')}">${icon('heart', 22, isFav)}</button>
          <a class="icon-btn" href="#/cart" aria-label="${t('navCart')}"><span data-cart-target style="display:grid">${icon('bag')}</span>${badge()}</a>
        </div>
        <div class="pd-slides" data-gallery>${p.photos.map((id, i) => ph(id, 900, '', L(p.name), i === 0)).join('')}</div>
        ${p.photos.length > 1 ? `<span class="pd-count"><span data-gi>1</span>/${p.photos.length}</span>` : ''}
      </div>
      <div class="pd-info">
        <div class="pd-brand">${esc(p.brand)}</div>
        <h1 class="pd-name">${esc(L(p.name))}</h1>
        <div class="pd-meta">
          <span class="stars">${icon('star', 16, true)} ${p.rating.toFixed(1)}</span>
          <span>${p.reviews} ${t('reviews')}</span>
          <span class="stock ${p.stock}">${t(stockKey)}</span>
        </div>
        <div class="pd-price"><span class="price ${o ? 'sale' : ''}">${money(v.price)}</span>${o ? `<span class="price-old">${money(v.oldPrice)}</span><span class="off">−${o}%</span>` : ''}</div>
        <div class="pd-short">${esc(L(p.short))}${!p.variantType && v.label ? ' · ' + esc(L(v.label)) : ''}</div>
        ${variantPicker(p, v)}
        ${p.skin.length ? `<div class="pd-label">${t('suits')}</div><div class="tags">${skins.map(s => `<span class="tag">${s}</span>`).join('')}</div>` : ''}
        <div class="tabs">${['desc', 'howTo', 'ingredients'].map(k => `<button class="${pd.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${t(k)}</button>`).join('')}</div>
        <div class="tab-body ${pd.tab === 'ingredients' ? 'mono' : ''}">${esc(pd.tab === 'ingredients' ? p.ingredients : L(p[pd.tab]))}</div>
      </div>
      <div class="section">
        <div class="section-head"><h2>${t('alsoLike')}</h2></div>
        <div class="hscroll">${related.map(card).join('')}</div>
      </div>
      <div class="cta-bar">
        <div class="stepper">
          <button data-act="pdQty" data-d="-1" aria-label="−">${icon('minus', 18)}</button><span data-pdqty>${pd.qty}</span><button data-act="pdQty" data-d="1" aria-label="+">${icon('plus', 18)}</button>
        </div>
        <button class="btn btn-primary" data-act="addPd" ${out ? 'disabled' : ''}>${out ? t('outStock') : t('addToCart')} <span class="sep"></span> <span data-pdsum>${money(v.price * pd.qty)}</span></button>
      </div>
    </div>`;
  }

  function vFav() {
    const list = state.fav.map(id => byId[id]).filter(Boolean);
    return `<div class="screen">
      <div class="page-title"><h1>${t('favTitle')}</h1>${list.length ? `<span class="count">${t('items', { n: list.length })}</span>` : ''}</div>
      ${list.length ? `<div class="grid">${list.map(card).join('')}</div>`
        : emptyBox('heart', t('favEmpty'), t('favEmptyHint'), `<button class="btn btn-primary" data-act="goCat" data-cat="all">${t('toCatalog')}</button>`)}
    </div>`;
  }

  function freeBar(after) {
    const FREE = freeDelivery();
    if (!FREE) return '';
    const left = FREE.freeFrom - after;
    if (left <= 0) return `<div class="free-bar done">${icon('truck', 18)} ${t('freeYes')}</div>`;
    return `<div class="free-bar">${icon('truck', 18)} ${t('freeLeft', { x: money(left) })}
      <div class="track"><div class="fill" style="width:${Math.max(4, after / FREE.freeFrom * 100)}%"></div></div></div>`;
  }

  function lineView(x) {
    const { l, p, v } = x;
    const ids = `data-id="${p.id}" data-v="${v.id}"`;
    return `<div class="line">
      <a href="#/product/${p.id}">${ph(p.photos[0], 200, '', L(p.name))}</a>
      <div class="line-body">
        <div class="line-top"><a class="line-name" href="#/product/${p.id}">${esc(L(p.name))}</a><button class="trash" data-act="lineDel" ${ids} aria-label="×">${icon('trash', 18)}</button></div>
        ${v.label ? `<div class="line-var">${v.color ? `<i style="background:${v.color}"></i>` : ''}${esc(L(v.label))}</div>` : ''}
        <div class="line-foot">
          <div><div class="price">${money(v.price * l.qty)}</div>${v.oldPrice ? `<div class="price-old">${money(v.oldPrice * l.qty)}</div>` : ''}</div>
          <div class="stepper sm">
            <button data-act="lineQty" ${ids} data-d="-1" aria-label="−">${icon('minus', 16)}</button><span>${l.qty}</span><button data-act="lineQty" ${ids} data-d="1" aria-label="+">${icon('plus', 16)}</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function promoBox() {
    if (state.promo) {
      return `<div class="applied"><span>${icon('tag', 16)} ${t('promoOk', { code: esc(state.promo), p: SHOP.promoCodes[state.promo] })}</span><button data-act="promoDel" aria-label="${t('reset')}">${icon('close', 18)}</button></div>`;
    }
    const m = state.promoMsg;
    return `<div class="promo-head">${icon('tag', 18)} ${t('promoQ')}</div>
      <div class="promo-row"><input class="input" data-promo placeholder="${t('promoPh')}" autocapitalize="characters" value="${esc(m ? m.code : '')}"><button class="btn btn-primary" data-act="promoApply">${t('apply')}</button></div>
      <div class="promo-msg ${m ? 'bad' : 'hint'}">${m ? t('promoBad') : t('promoHint')}</div>`;
  }

  function vCart() {
    const T = totals(false);
    if (!T.lines.length) {
      return `<div class="screen"><div class="page-title"><h1>${t('cart')}</h1></div>
        ${emptyBox('bag', t('cartEmpty'), t('cartEmptyHint'), `<button class="btn btn-primary" data-act="goCat" data-cat="all">${t('toCatalog')}</button>`)}</div>`;
    }
    return `<div class="screen">
      <div class="page-title"><h1>${t('cart')}</h1><span class="count">${t('items', { n: T.count })}</span></div>
      ${freeBar(T.after)}
      ${T.lines.map(lineView).join('')}
      <div class="card-box">${promoBox()}</div>
      <div class="card-box">
        ${sumRow(t('subtotal'), money(T.subtotal))}
        ${T.discount ? sumRow(`${t('discount')} (${esc(state.promo)})`, '−' + money(T.discount), 'disc') : ''}
        ${sumRow(t('delivery'), t('deliveryNext'))}
        ${sumRow(t('total'), money(T.after), 'total')}
      </div>
      <div class="spacer tg-main-hide"></div>
      <div class="cta-bar above-nav tg-main-hide"><button class="btn btn-primary" data-act="toCheckout">${t('checkout')} <span class="sep"></span> ${money(T.after)}</button></div>
    </div>`;
  }

  function field(k, label, input) {
    const err = state.errors[k];
    return `<div class="field ${err ? 'err' : ''}" data-field="${k}"><label>${label}</label>${input}${err ? `<div class="err-msg">${err}</div>` : ''}</div>`;
  }

  function vCheckout() {
    const T = totals(true);
    if (!T.lines.length) return vCart();
    const c = state.checkout, d = deliveryById(c.delivery);
    const deliveryOpts = SHOP.delivery.map(x => {
      const price = deliveryPrice(x, T.after), on = c.delivery === x.id;
      return `<label class="opt ${on ? 'on' : ''}">
        <input type="radio" name="delivery" value="${x.id}" data-change="delivery" ${on ? 'checked' : ''}>
        <span class="o-ico">${icon(x.icon)}</span>
        <span class="o-body"><span class="o-title">${t('del_' + x.id)}</span><span class="o-note">${x.id === 'pickup' ? esc(L(SHOP.contacts.address)) : t('del_' + x.id + '_note')}</span></span>
        <span class="o-price">${price ? money(price) : t('free')}${x.freeFrom && price ? `<small>${t('freeFrom', { x: fmt(x.freeFrom) })}</small>` : ''}</span>
        <span class="radio"></span>
      </label>`;
    }).join('');
    const payOpts = SHOP.payments.map(x => {
      const on = c.payment === x.id;
      return `<label class="opt ${on ? 'on' : ''} ${x.soon ? 'disabled' : ''}">
        <input type="radio" name="payment" value="${x.id}" data-change="payment" ${on ? 'checked' : ''} ${x.soon ? 'disabled' : ''}>
        <span class="o-ico">${icon(x.icon)}</span>
        <span class="o-body"><span class="o-title">${t('pay_' + x.id)}${x.soon ? `<span class="soon">${t('soon')}</span>` : ''}</span>${has('pay_' + x.id + '_note') ? `<span class="o-note">${t('pay_' + x.id + '_note')}</span>` : ''}</span>
        <span class="radio"></span>
      </label>`;
    }).join('');
    return `<div class="screen no-nav">
      <div class="page-title">${backBtn()}<h1>${t('checkoutTitle')}</h1></div>
      <div class="form-title"><span class="n">1</span>${t('contact')}</div>
      <div class="card-box flush">
        ${field('name', t('name'), `<input class="input" data-input="name" value="${esc(c.name)}" placeholder="${t('namePh')}" autocomplete="name">`)}
        ${field('phone', t('phone'), `<div class="phone-wrap"><span class="pre">+998</span><input data-input="phone" type="tel" inputmode="numeric" autocomplete="tel-national" value="${esc(fmtPhone(c.phone))}" placeholder="90 123 45 67"></div>`)}
      </div>
      <div class="form-title"><span class="n">2</span>${t('delivery')}</div>
      ${deliveryOpts}
      ${d.needsAddress ? `<div class="card-box flush">${field('address', t('address'), `<textarea class="input" data-input="address" placeholder="${t('addressPh')}" autocomplete="street-address">${esc(c.address)}</textarea>`)}</div>` : ''}
      <div class="form-title"><span class="n">3</span>${t('payment')}</div>
      <div class="pay-grid">${payOpts}</div>
      <div class="form-title"><span class="n">4</span>${t('comment')}</div>
      <textarea class="input" data-input="comment" placeholder="${t('commentPh')}">${esc(c.comment)}</textarea>
      <div class="card-box">
        ${sumRow(`${t('subtotal')} (${T.count})`, money(T.subtotal))}
        ${T.discount ? sumRow(`${t('discount')} (${esc(state.promo)})`, '−' + money(T.discount), 'disc') : ''}
        ${sumRow(t('delivery'), T.delivery ? money(T.delivery) : t('free'))}
        ${sumRow(t('total'), money(T.total), 'total')}
      </div>
      <div class="cta-bar tg-main-hide"><button class="btn btn-primary" data-act="placeOrder">${t('placeOrder')} <span class="sep"></span> ${money(T.total)}</button></div>
    </div>`;
  }

  // The exact text the shop owner gets. In version 2 the bot sends this same text.
  function sellerMessage(o) {
    const out = [`🛍 ${t('newOrder')} #${o.no}`, `👤 ${o.name}, +998 ${fmtPhone(o.phone)}`];
    o.items.forEach(i => {
      const p = byId[i.id], name = i.name || (p && p.name) || i.id, label = i.vlabel != null ? i.vlabel : (p && variantOf(p, i.v).label);
      out.push(`📦 ${L(name)}${label ? ' (' + L(label) + ')' : ''} × ${i.qty} — ${fmt(i.price * i.qty)}`);
    });
    out.push(`🚚 ${t('del_' + o.delivery)} — ${o.deliveryPrice ? fmt(o.deliveryPrice) : t('free')}${o.address ? ', ' + o.address : ''}`);
    out.push(`💳 ${t('pay_' + o.payment)}`);
    if (o.discount) out.push(`🏷 ${t('promo')} ${o.promo}: −${fmt(o.discount)}`);
    out.push(`💰 ${t('total')}: ${money(o.total)}`);
    if (o.comment) out.push(`💬 "${o.comment}"`);
    return out;
  }

  function vDone(r) {
    const o = state.orders.find(x => x.no === r.id);
    if (!o) return vNotFound();
    return `<div class="screen no-nav done-screen">
      <div class="done-hero">
        <div class="done-check"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h1>${t('doneTitle')}</h1>
        <p>${t('doneText')}</p>
        <span class="order-no">${t('order')} #${o.no} · ${money(o.total)}</span>
      </div>
      <div class="seller">
        <div class="seller-label"><span class="pulse"></span>${t('sellerTitle')}</div>
        <div class="tg-head"><div class="tg-ava">${esc(SHOP.name.charAt(0))}</div><div><div class="tg-title">${esc(t('botName', { shop: SHOP.name }))}</div><div class="tg-sub">${t('bot')}</div></div></div>
        <div class="tg-chat">
          <div class="tg-msg">${sellerMessage(o).map(esc).join('<br>')}<div class="tg-time">${timeStr(o.ts)} ✓✓</div></div>
          <div class="tg-btns"><span>${t('btnConfirm')}</span><span>${t('btnCall')}</span></div>
        </div>
        <div class="seller-note">${t('sellerText')}</div>
      </div>
      <div class="done-actions">
        <button class="btn btn-primary" data-act="goHome">${t('continueShopping')}</button>
        <a class="btn btn-ghost" href="#/profile">${t('myOrders')}</a>
      </div>
    </div>`;
  }

  function orderCard(o) {
    const st = o.status || 'new', s = STATUSES.indexOf(st);
    return `<div class="order-card">
      <div class="oc-top"><div><div class="oc-no">#${o.no}</div><div class="oc-date">${dateStr(o.ts)}</div></div><span class="status ${st}">${t('st_' + st)}</span></div>
      ${st === 'cancelled' ? '' : `<div class="steps">${STATUSES.map((x, i) => `<i class="${i <= s ? 'on' : ''}"></i>`).join('')}</div>`}
      <div class="oc-foot"><div class="oc-thumbs">${o.items.slice(0, 4).map(i => { const src = i.photo || (byId[i.id] && byId[i.id].photos[0]); return src ? ph(src, 80, '', '') : ''; }).join('')}</div><b>${money(o.total)}</b></div>
    </div>`;
  }

  function vProfile() {
    const nm = state.checkout.name || (tgUser && tgUser.first_name) || t('guest');
    const photo = tgUser && tgUser.photo_url;
    const sub = state.checkout.phone ? '+998 ' + fmtPhone(state.checkout.phone) : (tgUser && tgUser.username ? '@' + tgUser.username : SHOP.name);
    const c = SHOP.contacts;
    return `<div class="screen">
      <div class="page-title"><h1>${t('profile')}</h1></div>
      <div class="profile-card">
        <div class="ava">${photo ? `<img src="${esc(photo)}" alt="">` : esc(nm.charAt(0).toUpperCase())}</div>
        <div class="grow"><div class="nm">${esc(nm)}</div><div class="sub">${esc(sub)}</div></div>
      </div>
      <div class="card-box"><div class="row-item"><span class="ri-ico">${icon('globe', 20)}</span><span class="ri-body">${t('language')}</span>${langSeg('light')}</div></div>
      ${isAdmin() ? `<a class="seller-entry" href="#/admin"><span class="ri-ico">${icon('grid', 20)}</span><span class="ri-body"><b>${t('a_backToPanel')}</b></span>${icon('chev', 18)}</a>`
        : SHOP.demoAdminSwitch ? `<button class="seller-entry" data-act="enterAdmin"><span class="ri-ico">${icon('store', 20)}</span><span class="ri-body"><b>${t('a_enterAdmin')}</b><small>${t('a_enterAdminNote')}</small></span>${icon('chev', 18)}</button>` : ''}
      <div class="section">
        <div class="section-head"><h2>${t('myOrders')}</h2></div>
        ${state.orders.length ? state.orders.map(orderCard).join('') : `<div class="card-box flush muted-box">${t('noOrders')}</div>`}
      </div>
      <div class="section">
        <div class="section-head"><h2>${t('contacts')}</h2></div>
        <div class="card-box flush">
          <a class="row-item" href="https://t.me/${esc(c.telegram)}" target="_blank" rel="noopener"><span class="ri-ico">${icon('send', 20)}</span><span class="ri-body">${t('writeTelegram')}<small>@${esc(c.telegram)}</small></span>${icon('chev', 18)}</a>
          <a class="row-item" href="tel:${esc(c.phone.replace(/\s/g, ''))}"><span class="ri-ico">${icon('phone', 20)}</span><span class="ri-body">${esc(c.phone)}</span>${icon('chev', 18)}</a>
          <div class="row-item"><span class="ri-ico">${icon('pin', 20)}</span><span class="ri-body">${esc(L(c.address))}</span></div>
          <div class="row-item"><span class="ri-ico">${icon('clock', 20)}</span><span class="ri-body">${t('hours')}<small>${esc(c.hours)}</small></span></div>
        </div>
      </div>
    </div>`;
  }

  function vNotFound() {
    return `<div class="screen">${emptyBox('search', t('nothing'), '', `<button class="btn btn-primary" data-act="goHome">${t('navHome')}</button>`)}</div>`;
  }

  let admin = null;
  const VIEWS = { welcome: vWelcome, home: vHome, catalog: vCatalog, product: vProduct, fav: vFav, cart: vCart, checkout: vCheckout, done: vDone, profile: vProfile, admin: r => admin.view(r) };

  // ---------- Router ----------
  const stack = [];
  let replaceNext = false;
  let timers = [];

  function parse() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const part = i => (parts[i] ? decodeURIComponent(parts[i]) : null);
    return { name: parts[0] || 'home', id: part(1), id2: part(2) };
  }
  function go(hash) { if ((location.hash || '#/') === hash) render(); else location.hash = hash; }
  function goBack() { if (stack.length > 1) history.back(); else go('#/'); }

  window.addEventListener('hashchange', () => {
    const h = location.hash || '#/';
    if (replaceNext) {
      replaceNext = false;
      stack[stack.length - 1] = { h, y: 0 };
      render(); window.scrollTo(0, 0);
      return;
    }
    const isBack = stack.length > 1 && stack[stack.length - 2].h === h;
    if (stack.length) stack[stack.length - 1].y = window.scrollY;
    if (isBack) stack.pop(); else stack.push({ h, y: 0 });
    state.sheet = null;
    render();
    window.scrollTo(0, isBack ? stack[stack.length - 1].y : 0);
  });

  function render() {
    timers.forEach(clearInterval);
    timers = [];
    const r = parse();
    if (r.name === 'admin' && !isAdmin()) r.name = 'home';
    if (!state.seenWelcome && !isAdmin() && r.name === 'home') r.name = 'welcome';
    if (!VIEWS[r.name]) r.name = 'home';
    state.route = r;
    const pill = isAdmin() && r.name !== 'admin' ? `<a class="admin-pill" href="#/admin">${icon('grid', 16)} ${t('a_admin')}</a>` : '';
    app.innerHTML = VIEWS[r.name](r) + (NAV.includes(r.name) ? navBar(r.name) : '') + sheetView() + pill;
    document.body.dataset.route = r.name;
    document.body.style.overflow = state.sheet ? 'hidden' : '';
    after(r);
    syncTelegram(r);
  }
  function rerender() { const y = window.scrollY; render(); window.scrollTo(0, y); }

  function after(r) {
    if (r.name === 'home') { startCountdown(); startCarousel(); }
    if (r.name === 'catalog') {
      paintResults();
      if (state.focusSearch) { state.focusSearch = false; const i = app.querySelector('[data-input=q]'); if (i) i.focus(); }
    }
    if (r.name === 'product') {
      const g = app.querySelector('[data-gallery]'), gi = app.querySelector('[data-gi]');
      if (g && gi) g.addEventListener('scroll', () => { gi.textContent = Math.round(g.scrollLeft / g.clientWidth) + 1; }, { passive: true });
    }
    if (r.name === 'done' && state.justOrdered) { state.justOrdered = false; confetti(); haptic('success'); }
    if (r.name === 'admin') admin.after(r);
  }

  // ---------- Effects ----------
  function startCountdown() {
    const h = app.querySelector('[data-cd=h]'), m = app.querySelector('[data-cd=m]'), s = app.querySelector('[data-cd=s]');
    if (!h) return;
    const tick = () => {
      const now = new Date(), end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const d = Math.max(0, Math.floor((end - now) / 1000));
      h.textContent = pad(Math.floor(d / 3600)); m.textContent = pad(Math.floor(d % 3600 / 60)); s.textContent = pad(d % 60);
    };
    tick();
    timers.push(setInterval(tick, 1000));
  }

  function startCarousel() {
    const el = app.querySelector('[data-carousel]');
    if (!el) return;
    const dots = el.parentNode.querySelectorAll('.dots i');
    const step = () => el.clientWidth - 20; // slide width (container minus 2×16 padding) + 12 gap
    const idx = () => Math.round(el.scrollLeft / step());
    let touched = 0;
    el.addEventListener('scroll', () => { const i = idx(); dots.forEach((d, j) => d.classList.toggle('on', i === j)); }, { passive: true });
    el.addEventListener('pointerdown', () => { touched = Date.now(); }, { passive: true });
    timers.push(setInterval(() => {
      if (Date.now() - touched < 6000 || document.hidden) return;
      el.scrollTo({ left: ((idx() + 1) % SHOP.banners.length) * step(), behavior: 'smooth' });
    }, 4500));
  }

  function fly(img) {
    const target = Array.from(document.querySelectorAll('[data-cart-target]')).pop();
    if (!img || !target || !img.animate) return;
    const a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    const size = Math.min(a.width, 140);
    const ghost = img.cloneNode();
    Object.assign(ghost.style, {
      position: 'fixed', left: (a.left + a.width / 2 - size / 2) + 'px', top: (a.top + a.height / 2 - size / 2) + 'px',
      width: size + 'px', height: size + 'px', borderRadius: '50%', objectFit: 'cover', zIndex: 300, pointerEvents: 'none', opacity: 1,
      boxShadow: '0 10px 30px -8px rgba(160,40,80,.5)'
    });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    ghost.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx * .45}px, ${dy * .45 - 60}px) scale(.6)`, offset: .45 },
      { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: .4 }
    ], { duration: 700, easing: 'cubic-bezier(.4,0,.6,1)' }).onfinish = () => {
      ghost.remove();
      target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 320 });
    };
  }

  function confetti() {
    const box = document.createElement('div');
    box.className = 'confetti';
    const colors = [SHOP.colors.primary, SHOP.colors.primary2, '#C9A46A', '#FFD166', '#9BE3C3', '#FFFFFF'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (2 + Math.random() * 1.8) + 's';
      c.style.animationDelay = (Math.random() * .5) + 's';
      c.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      c.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      box.appendChild(c);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 4500);
  }

  let toastTimer;
  function toast(msg, ic) {
    const el = document.getElementById('toast');
    el.innerHTML = icon(ic || 'check', 18) + '<span>' + msg + '</span>';
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function haptic(kind) {
    if (!inTG || !tg.HapticFeedback) return;
    try {
      if (kind === 'success' || kind === 'error') tg.HapticFeedback.notificationOccurred(kind);
      else tg.HapticFeedback.impactOccurred(kind || 'light');
    } catch (e) { /* older Telegram */ }
  }

  // ---------- Order ----------
  function placeOrder() {
    if (!state.cart.length) return;
    const c = state.checkout, d = deliveryById(c.delivery), e = {};
    if (!c.name.trim()) e.name = t('required');
    if (c.phone.length !== 9) e.phone = c.phone ? t('phoneBad') : t('required');
    if (d.needsAddress && !c.address.trim()) e.address = t('required');
    state.errors = e;
    if (Object.keys(e).length) {
      haptic('error');
      rerender();
      const f = app.querySelector('.field.err');
      if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); const i = f.querySelector('input, textarea'); if (i) i.focus({ preventScroll: true }); }
      return;
    }
    const T = totals(true);
    const order = {
      no: SHOP.orderPrefix + '-' + (1042 + state.orders.length), ts: Date.now(),
      // name/label/photo are copied so the order still reads right if the seller edits or deletes the product
      items: T.lines.map(x => ({ id: x.p.id, v: x.v.id, qty: x.l.qty, price: x.v.price, name: x.p.name, vlabel: x.v.label || '', photo: x.p.photos[0] })),
      status: 'new', history: [{ s: 'new', ts: Date.now() }],
      tgId: tgUser ? tgUser.id : null, tgUsername: tgUser ? tgUser.username || '' : '',
      subtotal: T.subtotal, discount: T.discount, promo: state.promo,
      delivery: d.id, deliveryPrice: T.delivery, total: T.total,
      name: c.name.trim(), phone: c.phone, address: d.needsAddress ? c.address.trim() : '',
      payment: c.payment, comment: c.comment.trim()
    };
    // Version 2: send sellerMessage(order) to the shop's Telegram bot here.
    state.orders.unshift(order);
    state.cart = []; state.promo = null; state.promoMsg = null; c.comment = '';
    state.justOrdered = true;
    save(); updateBadges();
    replaceNext = true;
    location.replace('#/done/' + order.no);
  }

  // ---------- Telegram ----------
  let mainFn = null;
  function syncTelegram(r) {
    if (!inTG) return;
    try {
      const root = r.name === 'home' || r.name === 'welcome' || (r.name === 'admin' && !['order', 'product'].includes(r.id));
      if (root) tg.BackButton.hide(); else tg.BackButton.show();
      let m = null;
      if (r.name === 'cart' && state.cart.length) m = { text: t('checkout') + ' · ' + money(totals(false).after), fn: () => go('#/checkout') };
      if (r.name === 'checkout' && state.cart.length) m = { text: t('placeOrder') + ' · ' + money(totals(true).total), fn: placeOrder };
      if (mainFn) tg.MainButton.offClick(mainFn);
      mainFn = m ? m.fn : null;
      if (m) {
        tg.MainButton.setParams({ text: m.text, color: SHOP.colors.primary, text_color: '#ffffff', is_active: true, is_visible: true });
        tg.MainButton.onClick(mainFn);
      } else tg.MainButton.hide();
    } catch (e) { /* older Telegram */ }
  }

  function applyTheme() {
    const root = document.documentElement, dark = inTG && tg.colorScheme === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    root.style.setProperty('--primary', SHOP.colors.primary);
    root.style.setProperty('--primary-2', SHOP.colors.primary2);
    if (dark) { root.style.removeProperty('--primary-soft'); root.style.removeProperty('--bg'); }
    else { root.style.setProperty('--primary-soft', SHOP.colors.soft); root.style.setProperty('--bg', SHOP.colors.bg); }
    if (inTG) {
      try {
        const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
        tg.setHeaderColor(bg); tg.setBackgroundColor(bg);
        if (tg.setBottomBarColor) tg.setBottomBarColor(bg);
      } catch (e) { /* older Telegram */ }
    }
  }
  function applyLang() { document.documentElement.lang = state.lang; document.title = SHOP.name; }

  // ---------- Events ----------
  const ACT = {
    start() { state.seenWelcome = true; save(); go('#/'); },
    lang(el) { state.lang = el.dataset.v; save(); applyLang(); rerender(); },
    openSearch() { state.focusSearch = true; go('#/catalog'); },
    goCat(el) { state.filters = Object.assign(freshFilters(), { cat: el.dataset.cat }); go('#/catalog'); },
    goSort(el) { state.filters = Object.assign(freshFilters(), { sort: el.dataset.sort }); go('#/catalog'); },
    banner(el) { state.filters = Object.assign(freshFilters(), SHOP.banners[+el.dataset.i].go); go('#/catalog'); },
    goHome() { go('#/'); },
    back() { goBack(); },

    cat(el) { state.filters.cat = el.dataset.cat; rerender(); },
    toggleSale() { state.filters.sale = !state.filters.sale; rerender(); },
    clearQ() { state.filters.q = ''; const i = app.querySelector('[data-input=q]'); if (i) { i.value = ''; i.focus(); } paintResults(); },
    resetAll() { state.filters = freshFilters(); rerender(); },
    openFilters() { state.draft = JSON.parse(JSON.stringify(state.filters)); state.sheet = 'filters'; rerender(); },
    closeSheet() { state.sheet = null; rerender(); },
    draft(el) {
      const d = state.draft, k = el.dataset.k, v = el.dataset.v;
      if (k === 'brand') d.brands = d.brands.includes(v) ? d.brands.filter(b => b !== v) : d.brands.concat(v);
      else if (k === 'sort') d.sort = v;
      else d[k] = d[k] === v ? null : v;
      paintSheet();
    },
    draftReset() { const d = state.draft; state.draft = Object.assign(freshFilters(), { cat: d.cat, q: d.q, sale: d.sale }); paintSheet(); },
    applyFilters() { state.filters = state.draft; state.sheet = null; rerender(); },

    fav(el) {
      const id = el.dataset.id, on = !state.fav.includes(id);
      state.fav = on ? state.fav.concat(id) : state.fav.filter(x => x !== id);
      save(); haptic('light');
      if (state.route.name === 'fav') return rerender();
      app.querySelectorAll(`[data-act=fav][data-id="${id}"]`).forEach(b => {
        b.classList.toggle('on', on);
        b.innerHTML = icon('heart', b.classList.contains('icon-btn') ? 22 : 18, on);
        b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
      });
      if (on) toast(t('favAdded'), 'heart');
    },
    quickAdd(el) {
      const p = byId[el.dataset.id];
      if (!p || p.stock === 'out') return;
      addToCart(p.id, p.variants[0].id, 1);
      haptic('medium');
      fly(el.closest('.card').querySelector('img'));
      toast(t('added'), 'bag');
    },
    variant(el) { state.pd.v = el.dataset.v; rerender(); },
    tab(el) { state.pd.tab = el.dataset.v; rerender(); },
    pdQty(el) {
      const pd = state.pd, v = variantOf(byId[pd.id], pd.v);
      pd.qty = Math.max(1, Math.min(99, pd.qty + Number(el.dataset.d)));
      app.querySelector('[data-pdqty]').textContent = pd.qty;
      app.querySelector('[data-pdsum]').textContent = money(v.price * pd.qty);
    },
    addPd() {
      const pd = state.pd, p = byId[pd.id];
      if (p.stock === 'out') return;
      addToCart(p.id, pd.v, pd.qty);
      haptic('medium');
      const g = app.querySelector('[data-gallery]'), imgs = g.querySelectorAll('img');
      fly(imgs[Math.round(g.scrollLeft / g.clientWidth)] || imgs[0]);
      toast(t('added'), 'bag');
      pd.qty = 1;
      app.querySelector('[data-pdqty]').textContent = 1;
      app.querySelector('[data-pdsum]').textContent = money(variantOf(p, pd.v).price);
    },

    lineQty(el) { const l = findLine(el); if (!l) return; l.qty = Math.max(1, Math.min(99, l.qty + Number(el.dataset.d))); save(); rerender(); },
    lineDel(el) { state.cart = state.cart.filter(l => !(l.id === el.dataset.id && l.v === el.dataset.v)); save(); haptic('light'); rerender(); },
    promoApply() {
      const code = (app.querySelector('[data-promo]').value || '').trim().toUpperCase();
      if (!code) return;
      if (SHOP.promoCodes[code]) {
        state.promo = code; state.promoMsg = null; save(); haptic('success');
        toast(t('promoOk', { code: esc(code), p: SHOP.promoCodes[code] }), 'tag');
      } else { state.promoMsg = { code }; haptic('error'); }
      rerender();
    },
    promoDel() { state.promo = null; save(); rerender(); },
    toCheckout() { go('#/checkout'); },
    placeOrder() { placeOrder(); },
    enterAdmin() { core.setAdminDemo(true); go('#/admin'); }
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (el) {
      e.preventDefault(); e.stopPropagation();
      const fn = ACT[el.dataset.act] || admin.acts[el.dataset.act];
      if (!el.disabled && fn) fn(el, e);
      return;
    }
    const a = e.target.closest('a[href^="https://t.me/"]');
    if (a && inTG) { e.preventDefault(); tg.openTelegramLink(a.href); }
  });

  document.addEventListener('input', e => {
    const el = e.target, k = el.dataset && el.dataset.input;
    if (!k) return;
    if (k.startsWith('a_')) return admin.onInput(k, el);
    if (k === 'q') { state.filters.q = el.value; paintResults(); return; }
    if (k === 'phone') {
      let d = el.value.replace(/\D/g, '');
      if (d.length > 9 && d.startsWith('998')) d = d.slice(3);
      d = d.slice(0, 9);
      state.checkout.phone = d;
      el.value = fmtPhone(d);
    } else state.checkout[k] = el.value;
    save();
    if (state.errors[k]) {
      delete state.errors[k];
      const f = app.querySelector(`[data-field="${k}"]`);
      if (f) { f.classList.remove('err'); const m = f.querySelector('.err-msg'); if (m) m.remove(); }
    }
  });

  document.addEventListener('change', e => {
    const el = e.target, k = el.dataset && el.dataset.change;
    if (!k) return;
    if (k.startsWith('a_')) return admin.onChange(k, el);
    if (k === 'sort') { state.filters.sort = el.value; paintResults(); return; }
    state.checkout[k] = el.value;
    save(); haptic('light'); rerender();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (e.target.matches('[data-promo]')) { e.preventDefault(); ACT.promoApply(); }
    else if (e.target.matches('[data-input=q]')) e.target.blur();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.sheet) ACT.closeSheet(); });

  // ---------- Start ----------
  if (!SHOP.languages.includes(state.lang)) state.lang = SHOP.defaultLang;
  if (inTG) {
    document.body.classList.add('in-tg');
    try {
      tg.ready(); tg.expand();
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
      tg.BackButton.onClick(goBack);
      tg.onEvent('themeChanged', () => { applyTheme(); rerender(); });
    } catch (e) { /* older Telegram */ }
    if (load('lang', null) == null && tgUser && tgUser.language_code === 'ru') state.lang = 'ru';
  }
  function ask(msg, yes) {
    if (inTG && tg.showConfirm) { try { tg.showConfirm(msg, ok => { if (ok) yes(); }); return; } catch (e) { /* older Telegram */ } }
    if (window.confirm(msg)) yes();
  }
  function copy(text) {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { /* nothing else to try */ }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(fallback); else fallback();
  }

  // What the seller panel (admin.js) may use.
  const core = {
    state, SHOP, app, tgUser, ownerByTelegram,
    t, L, esc, fmt, money, icon, ph, toast, haptic, rerender, go, ask, copy, save,
    dateStr, timeStr, fmtPhone, emptyBox, sumRow, backBtn, langSeg, sellerMessage,
    minPrice, deliveryById, deliveryPrice, allOrders, brands,
    byId: id => byId[id],
    products: () => PRODUCTS,
    saveCatalog(list) { PRODUCTS = list; reindex(); return persist('catalog', list); },
    saveSettings() { return persist('settings', { contacts: SHOP.contacts, delivery: SHOP.delivery, promoCodes: SHOP.promoCodes }); },
    setAdminDemo(on) { state.adminDemo = on; save(); },
    resetDemo() {
      ['catalog', 'settings'].forEach(k => { try { localStorage.removeItem(KEY + k); } catch (e) { /* private mode */ } });
      PRODUCTS = clone(window.PRODUCTS); reindex();
      Object.assign(SHOP, clone(DEFAULT_SHOP));
      state.orders = []; state.demoOrders = null; state.cart = []; state.promo = null;
      save(); updateBadges();
    }
  };
  admin = window.ShopAdmin(core);

  applyTheme();
  applyLang();
  // The owner lands straight in the panel.
  if (isAdmin() && parse().name === 'home') history.replaceState(null, '', '#/admin');
  stack.push({ h: location.hash || '#/', y: 0 });
  render();
})();
