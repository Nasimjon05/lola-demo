// Seller (admin) panel. app.js calls this with its helpers; the owner sees it automatically.
window.ShopAdmin = function (core) {
  'use strict';

  const { state, SHOP, t, L, esc, fmt, money, icon, ph, toast, haptic, rerender, go, ask, dateStr, timeStr, fmtPhone, emptyBox, sumRow, backBtn, langSeg } = core;
  const app = core.app;
  const STEPS = ['new', 'confirmed', 'shipping', 'delivered'];
  const NEXT = { new: 'confirmed', confirmed: 'shipping', shipping: 'delivered' };
  const TABS = ['all', 'new', 'confirmed', 'shipping', 'delivered', 'cancelled'];
  const SKINS = ['dry', 'oily', 'combo', 'sensitive'];
  const ui = { tab: 'all', q: '', pq: '', pcat: 'all', cq: '', bar: 6, edit: null };

  const statusOf = o => o.status || 'new';
  const live = list => list.filter(o => statusOf(o) !== 'cancelled');
  const total = list => list.reduce((s, o) => s + o.total, 0);
  const itemCount = o => o.items.reduce((s, i) => s + i.qty, 0);
  function dayStart(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function shiftDays(ts, n) { const d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); }
  function when(ts) {
    const today = dayStart(Date.now());
    if (ts >= today) return t('a_today') + ', ' + timeStr(ts);
    if (ts >= shiftDays(today, -1)) return t('a_yesterday') + ', ' + timeStr(ts);
    return dateStr(ts);
  }
  function num(s) { return parseInt(String(s || '').replace(/\D/g, ''), 10) || 0; }
  function itemName(i) { const p = core.byId(i.id); return i.name ? L(i.name) : p ? L(p.name) : i.id; }
  function itemPhoto(i) { const p = core.byId(i.id); return i.photo || (p && p.photos[0]); }
  function pill(s) { return `<span class="pill st-${s}">${t('st_' + s)}</span>`; }

  // ---------- Demo orders, so the panel looks like a working shop ----------
  function seedOrders() {
    let seed = 20261023;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const names = ['Malika', 'Dilnoza', 'Sevara', 'Nodira', 'Kamola', 'Gulnora', 'Madina', 'Shahzoda', 'Zarina', 'Feruza', 'Aziza', 'Nilufar', 'Mohira', 'Jasur', 'Laylo', 'Barno'];
    const people = names.map(n => ({ name: n, phone: '9' + Math.floor(rnd() * 10) + String(1000000 + Math.floor(rnd() * 8999999)) }));
    const city = ['Chilonzor 9, 12-uy', 'Yunusobod 4, 17-uy', 'Mirzo Ulug‘bek, Buyuk Ipak yo‘li 45', 'Sergeli 7, 3-uy', 'Yakkasaroy, Rustaveli 12', 'Olmazor, Qorasaroy 88'];
    const regions = ['Samarqand, Registon ko‘chasi 5', 'Buxoro, Navoiy 23', 'Farg‘ona, Al-Farg‘oniy 10', 'Namangan, Uychi 14', 'Andijon, Bobur 31'];
    const notes = ['', '', '', '', 'Kechqurun olib keling', 'Sovg‘a qilib o‘rab bering', 'Qo‘ng‘iroqdan oldin yozing'];
    const stock = core.products().filter(p => p.stock !== 'out');
    const perDay = [3, 4, 2, 5, 3, 4, 5];
    const now = Date.now(), today = dayStart(now), out = [];
    let no = 1016;
    perDay.forEach((count, k) => {
      const daysAgo = 6 - k;
      for (let j = 0; j < count; j++) {
        const who = people[Math.floor(rnd() * rnd() * people.length)];
        const ts = daysAgo === 0
          ? now - Math.floor((count - j) * (20 + rnd() * 40) * 60000)
          : shiftDays(today, -daysAgo) + Math.floor((9 + rnd() * 12) * 3600000);
        const items = [];
        const lines = 1 + Math.floor(rnd() * 3);
        for (let x = 0; x < lines; x++) {
          const p = pick(stock), v = pick(p.variants);
          if (items.some(i => i.id === p.id && i.v === v.id)) continue;
          items.push({ id: p.id, v: v.id, qty: rnd() < .25 ? 2 : 1, price: v.price, name: p.name, vlabel: v.label || '', photo: p.photos[0] });
        }
        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
        const promo = rnd() < .2 ? 'LOLA10' : null;
        const discount = promo ? Math.round(subtotal / 1000) * 100 : 0;
        const r = rnd(), d = core.deliveryById(r < .7 ? 'tashkent' : r < .9 ? 'regions' : 'pickup');
        const deliveryPrice = core.deliveryPrice(d, subtotal - discount);
        let status = daysAgo >= 2 ? 'delivered' : daysAgo === 1 ? (rnd() < .5 ? 'shipping' : 'delivered') : (rnd() < .6 ? 'new' : 'confirmed');
        if (daysAgo >= 1 && rnd() < .08) status = 'cancelled';
        const reach = STEPS.indexOf(status);
        const gap = Math.min(3600000, (now - ts) / ((reach < 0 ? 1 : reach) + 1)); // keep every step in the past
        const history = [{ s: 'new', ts }].concat(STEPS.slice(1, reach < 0 ? 1 : reach + 1).map((s, i) => ({ s, ts: ts + (i + 1) * gap })));
        if (status === 'cancelled') history.push({ s: 'cancelled', ts: ts + gap / 2 });
        out.push({
          no: 'LB-' + (no++), ts, demo: true, items, subtotal, discount, promo,
          delivery: d.id, deliveryPrice, total: subtotal - discount + deliveryPrice,
          name: who.name, phone: who.phone, address: d.id === 'pickup' ? '' : d.id === 'regions' ? pick(regions) : pick(city),
          payment: rnd() < .75 ? 'cash' : 'card', comment: pick(notes), status, history
        });
      }
    });
    return out;
  }
  function ensureSeed() { if (!state.demoOrders) { state.demoOrders = seedOrders(); core.save(); } }

  // ---------- Shell ----------
  function nav(sub) {
    const newN = core.allOrders().filter(o => statusOf(o) === 'new').length;
    const items = [['dash', 'grid', 'a_panel'], ['orders', 'bag', 'a_orders'], ['products', 'tag', 'a_products'], ['customers', 'user', 'a_customers'], ['settings', 'filter', 'a_settings']];
    return `<nav class="nav admin-nav">${items.map(([k, ic, lbl]) =>
      `<a href="#/admin/${k}" class="${sub === k ? 'on' : ''}"><span class="ico">${icon(ic, 22)}${k === 'orders' && newN ? `<span class="badge">${newN}</span>` : ''}</span>${t(lbl)}</a>`
    ).join('')}</nav>`;
  }
  function shell(sub, title, body, opts) {
    opts = opts || {};
    const left = opts.back ? backBtn() : `<div class="a-brand"><span class="a-logo">${esc(SHOP.logo)}</span><span class="a-tag">${t('a_admin')}</span></div>`;
    return `<div class="screen admin ${opts.noNav ? 'no-nav' : ''}">
      <div class="a-top">${left}<div class="grow">${title ? `<h1 class="a-title">${title}</h1>` : ''}</div>
        ${opts.right != null ? opts.right : `<a class="a-shop" href="#/">${icon('store', 18)} ${t('a_viewShop')}</a>`}
      </div>
      ${body}
    </div>` + (opts.noNav ? '' : nav(sub));
  }

  function orderRow(o) {
    const s = statusOf(o);
    return `<a class="o-row ${s === 'new' ? 'is-new' : ''}" href="#/admin/order/${o.no}">
      <div class="o-main">
        <div class="o-line1"><b>#${o.no}</b>${pill(s)}</div>
        <div class="o-line2">${esc(o.name)} · ${when(o.ts)}</div>
      </div>
      <div class="o-sum">${money(o.total)}<small>${itemCount(o)} ${t('a_pcs')}</small></div>
    </a>`;
  }

  // ---------- Dashboard ----------
  function vDash() {
    const orders = core.allOrders(), ok = live(orders);
    const now = Date.now(), today = dayStart(now);
    const todayO = ok.filter(o => o.ts >= today);
    const weekO = ok.filter(o => o.ts >= shiftDays(today, -6));
    const newO = orders.filter(o => statusOf(o) === 'new');
    const wd = t('a_wd').split(',');
    const days = [];
    for (let i = 0; i < 7; i++) {
      const s = shiftDays(today, i - 6), e = shiftDays(s, 1), os = ok.filter(o => o.ts >= s && o.ts < e);
      days.push({ label: i === 6 ? t('a_today') : wd[new Date(s).getDay()], rev: total(os), n: os.length });
    }
    const max = Math.max.apply(null, days.map(d => d.rev)) || 1;
    const sel = days[ui.bar] || days[6];

    const sold = {};
    ok.forEach(o => o.items.forEach(i => { const k = i.id; sold[k] = sold[k] || { i, qty: 0, sum: 0 }; sold[k].qty += i.qty; sold[k].sum += i.qty * i.price; }));
    const top = Object.values(sold).sort((a, b) => b.qty - a.qty).slice(0, 5);

    const attention = [];
    if (newO.length) attention.push(`<a class="att warn" href="#/admin/orders" data-act="a_tabGo" data-v="new">${icon('bag', 18)}<span>${t('a_newOrdersN', { n: newO.length })}</span>${icon('chev', 16)}</a>`);
    core.products().filter(p => p.stock !== 'in').forEach(p => attention.push(
      `<a class="att ${p.stock === 'out' ? 'bad' : ''}" href="#/admin/product/${p.id}">${icon('box', 18)}<span>${t(p.stock === 'out' ? 'a_outStockN' : 'a_lowStockN', { name: esc(L(p.name)) })}</span>${icon('chev', 16)}</a>`));

    const ownerName = (core.tgUser && core.tgUser.first_name) || t('a_owner');
    const body = `
      <div class="a-hello">${t('a_hello', { name: esc(ownerName) })}</div>
      <div class="stats">
        <div class="stat hero"><span>${t('a_revenueToday')}</span><b>${money(total(todayO))}</b></div>
        <div class="stat"><span>${t('a_ordersToday')}</span><b>${todayO.length}</b></div>
        <a class="stat ${newO.length ? 'alert' : ''}" href="#/admin/orders" data-act="a_tabGo" data-v="new"><span>${t('a_needAction')}</span><b>${newO.length}</b></a>
        <div class="stat wide"><span>${t('a_avgCheck')}</span><b>${money(weekO.length ? total(weekO) / weekO.length : 0)}</b></div>
      </div>

      <div class="a-card">
        <div class="a-card-head"><h3>${t('a_week')}</h3><span class="muted">${t('a_weekTotal', { x: money(total(weekO)) })}</span></div>
        <div class="chart-read" data-chart-read><b>${money(sel.rev)}</b><span>${sel.label} · ${t('a_ordersN', { n: sel.n })}</span></div>
        <div class="bars">${days.map((d, i) => `<button class="bar ${i === ui.bar ? 'on' : ''}" data-act="a_bar" data-i="${i}" aria-label="${d.label}: ${money(d.rev)}"><span class="bar-track"><span class="bar-fill" style="height:${Math.max(3, d.rev / max * 100)}%"></span></span><span class="bar-lbl">${d.label}</span></button>`).join('')}</div>
      </div>

      <div class="a-card">
        <div class="a-card-head"><h3>${t('a_attention')}</h3></div>
        ${attention.length ? attention.join('') : `<div class="muted-box">${t('a_allGood')}</div>`}
      </div>

      <div class="a-card">
        <div class="a-card-head"><h3>${t('a_top')}</h3></div>
        ${top.map((x, n) => `<div class="top-row"><span class="rank">${n + 1}</span>${ph(itemPhoto(x.i), 120, '', '')}<div class="grow"><b>${esc(itemName(x.i))}</b><small>${t('a_sold', { n: x.qty })}</small></div><span class="top-sum">${money(x.sum)}</span></div>`).join('')}
      </div>

      <div class="section"><div class="section-head"><h2>${t('a_recent')}</h2><a class="see-all" href="#/admin/orders">${t('seeAll')}</a></div>
        ${orders.slice(0, 4).map(orderRow).join('')}
      </div>`;
    return shell('dash', '', body);
  }

  // ---------- Orders ----------
  function filteredOrders() {
    const q = ui.q.trim().toLowerCase();
    return core.allOrders().filter(o =>
      (ui.tab === 'all' || statusOf(o) === ui.tab) &&
      (!q || (o.no + ' ' + o.name + ' ' + o.phone).toLowerCase().includes(q)));
  }
  function paintOrders() {
    const el = app.querySelector('#a-list');
    if (!el) return;
    const list = filteredOrders();
    el.innerHTML = list.length ? list.map(orderRow).join('') : emptyBox('bag', t('a_noOrders'), '', '');
  }
  function vOrders() {
    const all = core.allOrders();
    const count = s => s === 'all' ? all.length : all.filter(o => statusOf(o) === s).length;
    const body = `
      <div class="search">${icon('search', 20)}<input type="search" data-input="a_q" value="${esc(ui.q)}" placeholder="${t('a_searchOrders')}" aria-label="${t('a_searchOrders')}"></div>
      <div class="chips">${TABS.map(s => `<button class="chip ${ui.tab === s ? 'on' : ''}" data-act="a_tab" data-v="${s}">${s === 'all' ? t('a_all') : t('st_' + s)} <span class="n">${count(s)}</span></button>`).join('')}</div>
      <div id="a-list" class="a-list"></div>`;
    return shell('orders', t('a_orders'), body);
  }

  function vOrder(no) {
    const o = core.allOrders().find(x => x.no === no);
    if (!o) return shell('orders', t('a_orders'), emptyBox('bag', t('a_noOrders'), '', ''), { back: true });
    const s = statusOf(o), reach = STEPS.indexOf(s);
    const hist = {};
    (o.history || [{ s: 'new', ts: o.ts }]).forEach(h => { hist[h.s] = h.ts; });
    const phone = '+998' + o.phone;
    const actions = [];
    if (NEXT[s]) actions.push(`<button class="btn btn-primary btn-block" data-act="a_status" data-no="${o.no}" data-v="${NEXT[s]}">${t('a_next_' + NEXT[s])}</button>`);
    if (s === 'new' || s === 'confirmed' || s === 'shipping') actions.push(`<button class="btn btn-ghost btn-block danger-text" data-act="a_cancel" data-no="${o.no}">${t('a_cancel')}</button>`);
    if (s === 'cancelled') actions.push(`<button class="btn btn-ghost btn-block" data-act="a_status" data-no="${o.no}" data-v="new">${t('a_restore')}</button>`);

    const body = `
      <div class="a-card">
        <div class="a-card-head"><h3>${t('a_status')}</h3>${pill(s)}</div>
        ${s === 'cancelled' ? '' : `<div class="timeline">${STEPS.map((x, i) => `<div class="tl ${i <= reach ? 'on' : ''}"><i></i><b>${t('st_' + x)}</b><small>${hist[x] ? timeStr(hist[x]) : ''}</small></div>`).join('')}</div>`}
        <div class="a-actions">${actions.join('')}</div>
      </div>

      <div class="a-card">
        <div class="a-card-head"><h3>${t('a_customer')}</h3><span class="muted">${when(o.ts)}</span></div>
        <div class="cust"><div class="c-ava">${esc(o.name.charAt(0))}</div><div class="grow"><b>${esc(o.name)}</b><small>+998 ${fmtPhone(o.phone)}</small></div></div>
        <div class="c-btns">
          <a class="btn btn-ghost" href="tel:${phone}">${icon('phone', 18)} ${t('a_call')}</a>
          ${o.tgUsername ? `<a class="btn btn-ghost" href="https://t.me/${esc(o.tgUsername)}" target="_blank" rel="noopener">${icon('send', 18)} ${t('a_writeTg')}</a>` : ''}
        </div>
        <div class="kv"><span>${icon(core.deliveryById(o.delivery).icon, 18)}</span><div><b>${t('del_' + o.delivery)}</b>${o.address ? `<small>${esc(o.address)}</small>` : ''}</div></div>
        <div class="kv"><span>${icon(o.payment === 'card' ? 'card' : 'cash', 18)}</span><div><b>${t('pay_' + o.payment)}</b></div></div>
        ${o.comment ? `<div class="kv"><span>💬</span><div><b>“${esc(o.comment)}”</b></div></div>` : ''}
      </div>

      <div class="a-card">
        <div class="a-card-head"><h3>${t('a_items')}</h3><span class="muted">${itemCount(o)} ${t('a_pcs')}</span></div>
        ${o.items.map(i => `<div class="top-row">${ph(itemPhoto(i), 120, '', '')}<div class="grow"><b>${esc(itemName(i))}</b><small>${i.vlabel ? esc(L(i.vlabel)) + ' · ' : ''}${i.qty} × ${money(i.price)}</small></div><span class="top-sum">${money(i.qty * i.price)}</span></div>`).join('')}
        <div class="a-sum">
          ${sumRow(t('subtotal'), money(o.subtotal))}
          ${o.discount ? sumRow(`${t('discount')} (${esc(o.promo)})`, '−' + money(o.discount), 'disc') : ''}
          ${sumRow(t('delivery'), o.deliveryPrice ? money(o.deliveryPrice) : t('free'))}
          ${sumRow(t('total'), money(o.total), 'total')}
        </div>
      </div>
      <button class="btn btn-ghost btn-block" data-act="a_copy" data-no="${o.no}">${icon('check', 18)} ${t('a_copy')}</button>`;
    return shell('orders', `${t('a_order')} #${o.no}`, body, { back: true, noNav: true, right: '' });
  }

  function setStatus(o, s) {
    o.status = s;
    o.history = (o.history || [{ s: 'new', ts: o.ts }]).concat({ s, ts: Date.now() });
    core.save();
    haptic('success');
    toast(t('a_statusSet', { s: t('st_' + s) }));
    rerender();
  }

  // ---------- Products ----------
  function stockKey(s) { return { in: 'inStock', low: 'lowStock', out: 'outStock' }[s]; }
  function productRow(p) {
    return `<div class="p-row">
      <a href="#/admin/product/${p.id}">${ph(p.photos[0], 160, '', '')}</a>
      <a class="grow p-main" href="#/admin/product/${p.id}"><b>${esc(L(p.name))}</b><small>${money(core.minPrice(p))}${p.variants.length > 1 ? ' · ' + t('a_variantsN', { n: p.variants.length }) : ''}</small></a>
      <button class="stock-btn st-${p.stock}" data-act="a_stock" data-id="${p.id}">${t(stockKey(p.stock))}</button>
    </div>`;
  }
  function filteredProducts() {
    const q = ui.pq.trim().toLowerCase();
    return core.products().filter(p => (ui.pcat === 'all' || p.cat === ui.pcat) &&
      (!q || (p.name.uz + ' ' + p.name.ru + ' ' + p.brand).toLowerCase().includes(q)));
  }
  function paintProducts() {
    const el = app.querySelector('#a-list');
    if (!el) return;
    const list = filteredProducts();
    el.innerHTML = list.length ? list.map(productRow).join('') : emptyBox('search', t('nothing'), '', '');
  }
  function vProducts() {
    const body = `
      <a class="btn btn-primary btn-block add-new" href="#/admin/product/new">${icon('plus', 20)} ${t('a_addProduct')}</a>
      <div class="search">${icon('search', 20)}<input type="search" data-input="a_pq" value="${esc(ui.pq)}" placeholder="${t('a_searchProducts')}" aria-label="${t('a_searchProducts')}"></div>
      <div class="chips">
        <button class="chip ${ui.pcat === 'all' ? 'on' : ''}" data-act="a_pcat" data-v="all">${t('all')}</button>
        ${SHOP.categories.map(c => `<button class="chip ${ui.pcat === c.id ? 'on' : ''}" data-act="a_pcat" data-v="${c.id}">${esc(L(c.name))}</button>`).join('')}
      </div>
      <div id="a-list" class="a-list"></div>`;
    return shell('products', t('a_products'), body);
  }

  function blankProduct() {
    return {
      id: '', cat: ui.pcat !== 'all' ? ui.pcat : SHOP.categories[0].id, brand: '', name: { uz: '', ru: '' }, short: { uz: '', ru: '' },
      desc: { uz: '', ru: '' }, howTo: { uz: '', ru: '' }, ingredients: '', skin: [], photos: [], variantType: null,
      variants: [{ id: 'std', label: '', price: 0 }], stock: 'in', rating: 5, reviews: 0, isNew: true
    };
  }
  function startEdit(id) {
    if (ui.edit && ui.edit.key === id) return;
    const p = id === 'new' ? blankProduct() : JSON.parse(JSON.stringify(core.byId(id) || blankProduct()));
    ui.edit = { key: id, p };
  }
  function input(name, label, value, extra) {
    return `<div class="field"><label>${label}</label><input class="input" name="${name}" value="${esc(value)}" ${extra || ''}></div>`;
  }
  function area(name, label, value) {
    return `<div class="field"><label>${label}</label><textarea class="input" name="${name}">${esc(value)}</textarea></div>`;
  }
  function vEdit(id) {
    startEdit(id);
    const p = ui.edit.p, isNew = id === 'new';
    const variantRows = p.variants.map((v, i) => `<div class="v-row">
      ${p.variantType === 'shade' ? `<input class="v-color" type="color" name="v_color_${i}" value="${esc(v.color || '#D9707F')}" aria-label="${t('a_vColor')}">` : ''}
      <div class="field"><label>${t('a_vLabel')}</label><input class="input" name="v_label_${i}" value="${esc(L(v.label))}" placeholder="${t('a_vLabelPh')}"></div>
      <div class="field"><label>${t('a_vPrice')}</label><input class="input" name="v_price_${i}" inputmode="numeric" value="${v.price || ''}" placeholder="0"></div>
      <div class="field"><label>${t('a_vOld')}</label><input class="input" name="v_old_${i}" inputmode="numeric" value="${v.oldPrice || ''}" placeholder="—"></div>
      ${p.variants.length > 1 ? `<button class="trash" data-act="a_vdel" data-i="${i}" aria-label="${t('a_delete')}">${icon('trash', 18)}</button>` : ''}
    </div>`).join('');
    const body = `<form class="a-form" data-form="product" onsubmit="return false">
      <div class="a-card">
        <div class="a-card-head"><h3>${t('a_photos')}</h3></div>
        <div class="photos">
          ${p.photos.map((ph_, i) => `<div class="ph-item">${ph(ph_, 200, '', '')}<button class="ph-del" data-act="a_photoDel" data-i="${i}" aria-label="${t('a_delete')}">${icon('close', 14)}</button></div>`).join('')}
          <label class="ph-add">${icon('plus', 22)}<span>${t('a_addPhoto')}</span><input type="file" accept="image/*" data-change="a_photo" hidden></label>
        </div>
      </div>
      <div class="a-card">
        ${input('name_uz', t('a_nameUz'), p.name.uz)}
        ${input('name_ru', t('a_nameRu'), p.name.ru)}
        <div class="fgrid">
          ${input('brand', t('a_brand'), p.brand, 'list="a-brands"')}
          <div class="field"><label>${t('a_category')}</label><select class="input" name="cat">${SHOP.categories.map(c => `<option value="${c.id}" ${p.cat === c.id ? 'selected' : ''}>${esc(L(c.name))}</option>`).join('')}</select></div>
        </div>
        <datalist id="a-brands">${core.brands().map(b => `<option value="${esc(b)}">`).join('')}</datalist>
      </div>
      <div class="a-card">
        <div class="a-card-head"><h3>${t('a_variants')}</h3></div>
        <div class="field"><label>${t('a_variantType')}</label><select class="input" name="variantType" data-change="a_vt">
          ${[['', 'a_vt_none'], ['volume', 'a_vt_volume'], ['shade', 'a_vt_shade']].map(([v, k]) => `<option value="${v}" ${(p.variantType || '') === v ? 'selected' : ''}>${t(k)}</option>`).join('')}
        </select></div>
        ${variantRows}
        ${p.variantType ? `<button class="btn btn-ghost btn-block" data-act="a_vadd">${icon('plus', 18)} ${t('a_addVariant')}</button>` : ''}
      </div>
      <div class="a-card">
        <div class="field"><label>${t('a_stock')}</label>
          <div class="seg light seg-block">${['in', 'low', 'out'].map(s => `<label class="${p.stock === s ? 'on' : ''}"><input type="radio" name="stock" value="${s}" data-change="a_seg" ${p.stock === s ? 'checked' : ''}>${t(stockKey(s))}</label>`).join('')}</div>
        </div>
        <div class="field"><label>${t('a_flags')}</label><div class="checks">
          <label class="check-chip"><input type="checkbox" name="popular" ${p.popular ? 'checked' : ''}><span>${t('a_flagPopular')}</span></label>
          <label class="check-chip"><input type="checkbox" name="isNew" ${p.isNew ? 'checked' : ''}><span>${t('a_flagNew')}</span></label>
        </div></div>
        <div class="field"><label>${t('a_skin')}</label><div class="checks">
          ${SKINS.map(s => `<label class="check-chip"><input type="checkbox" name="skin_${s}" ${p.skin.includes(s) ? 'checked' : ''}><span>${t('skin_' + s)}</span></label>`).join('')}
        </div></div>
      </div>
      <div class="a-card">
        ${input('short_uz', t('a_shortUz'), p.short.uz)}
        ${input('short_ru', t('a_shortRu'), p.short.ru)}
        ${area('desc_uz', t('a_descUz'), p.desc.uz)}
        ${area('desc_ru', t('a_descRu'), p.desc.ru)}
        ${area('how_uz', t('a_howUz'), p.howTo.uz)}
        ${area('how_ru', t('a_howRu'), p.howTo.ru)}
        ${area('ingredients', t('a_ingredients'), p.ingredients)}
      </div>
      ${isNew ? '' : `<button class="btn btn-ghost btn-block danger-text" data-act="a_delete">${icon('trash', 18)} ${t('a_delete')}</button>`}
      <div class="cta-bar"><button class="btn btn-primary" data-act="a_saveProduct">${t('a_save')}</button></div>
    </form>`;
    return shell('products', isNew ? t('a_newProduct') : t('a_editProduct'), body, { back: true, noNav: true, right: '' });
  }

  // Copy what is typed in the form into the draft, so re-rendering keeps it.
  function syncForm() {
    const f = app.querySelector('[data-form=product]');
    if (!f || !ui.edit) return;
    const e = f.elements, p = ui.edit.p;
    const v = n => (e[n] ? e[n].value : '').trim();
    p.name = { uz: v('name_uz'), ru: v('name_ru') };
    p.brand = v('brand');
    p.cat = v('cat');
    p.short = { uz: v('short_uz'), ru: v('short_ru') };
    p.desc = { uz: v('desc_uz'), ru: v('desc_ru') };
    p.howTo = { uz: v('how_uz'), ru: v('how_ru') };
    p.ingredients = v('ingredients');
    p.variantType = v('variantType') || null;
    p.stock = (f.querySelector('[name=stock]:checked') || {}).value || 'in';
    p.popular = e.popular.checked;
    p.isNew = e.isNew.checked;
    p.skin = SKINS.filter(s => e['skin_' + s].checked);
    p.variants = p.variants.map((x, i) => {
      if (!e['v_price_' + i]) return x;
      const nv = { id: x.id, label: v('v_label_' + i), price: num(v('v_price_' + i)) };
      const old = num(v('v_old_' + i));
      if (old > nv.price) nv.oldPrice = old;
      if (e['v_color_' + i]) nv.color = e['v_color_' + i].value;
      return nv;
    });
  }

  function readPhoto(file, done) {
    const r = new FileReader();
    r.onerror = () => toast(t('a_photoErr'), 'close');
    r.onload = () => {
      const img = new Image();
      img.onerror = () => toast(t('a_photoErr'), 'close');
      img.onload = () => {
        const max = 800, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        done(c.toDataURL('image/jpeg', 0.82));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  function saveProduct() {
    syncForm();
    const p = ui.edit.p;
    if (!p.name.uz && !p.name.ru) return toast(t('a_needName'), 'close');
    if (p.variants.some(v => !v.price)) return toast(t('a_needPrice'), 'close');
    if (!p.name.uz) p.name.uz = p.name.ru;
    if (!p.name.ru) p.name.ru = p.name.uz;
    ['short', 'desc', 'howTo'].forEach(k => { if (!p[k].ru) p[k].ru = p[k].uz; if (!p[k].uz) p[k].uz = p[k].ru; });
    if (!p.variantType) p.variants = p.variants.slice(0, 1);
    p.variants.forEach((v, i) => { if (!v.id || v.id === 'new') v.id = 'v' + i + Date.now().toString(36); if (!v.label) delete v.label; });
    const list = core.products().slice();
    if (ui.edit.key === 'new') {
      p.id = (p.name.uz.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item') + '-' + Date.now().toString(36);
      list.unshift(p);
    } else {
      const i = list.findIndex(x => x.id === ui.edit.key);
      list[i] = p;
    }
    if (!core.saveCatalog(list)) return toast(t('a_storageFull'), 'close');
    ui.edit = null;
    haptic('success');
    toast(t('a_saved'));
    go('#/admin/products');
  }

  // ---------- Customers ----------
  function vCustomers() {
    const byPhone = {};
    core.allOrders().forEach(o => {
      const c = byPhone[o.phone] = byPhone[o.phone] || { name: o.name, phone: o.phone, n: 0, spent: 0, last: 0 };
      c.n++;
      if (statusOf(o) !== 'cancelled') c.spent += o.total;
      c.last = Math.max(c.last, o.ts);
    });
    const q = ui.cq.trim().toLowerCase();
    const list = Object.values(byPhone).filter(c => !q || (c.name + ' ' + c.phone).toLowerCase().includes(q)).sort((a, b) => b.spent - a.spent);
    const body = `
      <div class="search">${icon('search', 20)}<input type="search" data-input="a_cq" value="${esc(ui.cq)}" placeholder="${t('a_searchCustomers')}" aria-label="${t('a_searchCustomers')}"></div>
      <div class="results-bar"><span>${t('a_customersN', { n: list.length })}</span></div>
      ${list.length ? list.map(c => `<div class="c-row">
        <div class="c-ava">${esc(c.name.charAt(0))}</div>
        <div class="grow"><b>${esc(c.name)}${c.n >= 3 ? ` <span class="loyal">★ ${t('a_loyal')}</span>` : ''}</b>
          <small>+998 ${fmtPhone(c.phone)} · ${t('a_ordersN', { n: c.n })}</small>
          <small>${t('a_lastOrder', { d: when(c.last) })}</small></div>
        <div class="c-side"><b>${money(c.spent)}</b><a class="icon-btn sm" href="tel:+998${c.phone}" aria-label="${t('a_call')}">${icon('phone', 18)}</a></div>
      </div>`).join('') : emptyBox('user', t('a_noCustomers'), '', '')}`;
    return shell('customers', t('a_customers'), body);
  }

  // ---------- Settings ----------
  function vSettings() {
    const c = SHOP.contacts, tash = core.deliveryById('tashkent'), reg = core.deliveryById('regions');
    const promos = Object.keys(SHOP.promoCodes);
    const access = core.ownerByTelegram ? t('a_accessTg', { id: core.tgUser.id }) : t('a_accessDemo');
    const body = `
      <form class="a-form" data-form="settings" onsubmit="return false">
        <div class="a-card">
          <div class="a-card-head"><h3>${t('a_shopInfo')}</h3></div>
          <div class="fgrid">${input('phone', t('a_phone'), c.phone, 'inputmode="tel"')}${input('telegram', t('a_tg'), c.telegram)}</div>
          ${input('hours', t('a_hours'), c.hours)}
          ${input('addr_uz', t('a_addrUz'), c.address.uz)}
          ${input('addr_ru', t('a_addrRu'), c.address.ru)}
        </div>
        <div class="a-card">
          <div class="a-card-head"><h3>${t('a_deliveryPrices')}</h3></div>
          <div class="fgrid">${input('d_tashkent', t('del_tashkent'), tash.price, 'inputmode="numeric"')}${input('d_regions', t('del_regions'), reg.price, 'inputmode="numeric"')}</div>
          ${input('d_free', t('a_freeFromL'), tash.freeFrom || '', 'inputmode="numeric"')}
        </div>
        <button class="btn btn-primary btn-block" data-act="a_saveSettings">${t('a_save')}</button>
      </form>

      <div class="a-card">
        <div class="a-card-head"><h3>${t('a_promos')}</h3></div>
        ${promos.length ? promos.map(code => `<div class="promo-item"><span class="code">${esc(code)}</span><span class="grow">−${SHOP.promoCodes[code]}%</span><button class="trash" data-act="a_promoDel" data-code="${esc(code)}" aria-label="${t('a_delete')}">${icon('trash', 18)}</button></div>`).join('') : `<div class="muted-box">${t('a_noPromos')}</div>`}
        <div class="promo-add"><input class="input" data-a="code" placeholder="${t('a_code')}" autocapitalize="characters"><input class="input pct" data-a="pct" inputmode="numeric" placeholder="${t('a_percent')}"><button class="btn btn-primary" data-act="a_promoAdd">${t('a_add')}</button></div>
      </div>

      <div class="a-card"><div class="row-item"><span class="ri-ico">${icon('globe', 20)}</span><span class="ri-body">${t('language')}</span>${langSeg('light')}</div></div>

      <div class="a-card">
        <div class="a-card-head"><h3>${t('a_access')}</h3></div>
        <p class="muted-p">${access}</p>
        ${core.ownerByTelegram ? '' : `<button class="btn btn-ghost btn-block" data-act="a_exit">${icon('user', 18)} ${t('a_exitAdmin')}</button>`}
        ${SHOP.demoAdminSwitch ? `<button class="btn btn-ghost btn-block danger-text" data-act="a_reset">${t('a_resetDemo')}</button>` : ''}
      </div>`;
    return shell('settings', t('a_settings'), body);
  }

  // ---------- Router hooks ----------
  function view(r) {
    ensureSeed();
    const sub = r.id || 'dash';
    if (sub !== 'product') ui.edit = null;
    if (sub === 'orders') return vOrders();
    if (sub === 'order') return vOrder(r.id2);
    if (sub === 'products') return vProducts();
    if (sub === 'product') return vEdit(r.id2 || 'new');
    if (sub === 'customers') return vCustomers();
    if (sub === 'settings') return vSettings();
    return vDash();
  }
  function after(r) {
    const sub = r.id || 'dash';
    if (sub === 'orders') paintOrders();
    if (sub === 'products') paintProducts();
    if (sub === 'dash') app.querySelectorAll('[data-act=a_bar]').forEach(b => b.addEventListener('pointerenter', () => acts.a_bar(b)));
  }

  const acts = {
    a_bar(el) {
      ui.bar = Number(el.dataset.i);
      app.querySelectorAll('[data-act=a_bar]').forEach(b => b.classList.toggle('on', b === el));
      const read = app.querySelector('[data-chart-read]');
      const label = el.getAttribute('aria-label').split(': ');
      if (read) read.querySelector('b').textContent = label[1];
      if (read) read.querySelector('span').textContent = label[0];
    },
    a_tab(el) { ui.tab = el.dataset.v; rerender(); },
    a_tabGo(el) { ui.tab = el.dataset.v; go('#/admin/orders'); },
    a_status(el) { const o = core.allOrders().find(x => x.no === el.dataset.no); if (o) setStatus(o, el.dataset.v); },
    a_cancel(el) { const o = core.allOrders().find(x => x.no === el.dataset.no); if (o) ask(t('a_cancelQ'), () => setStatus(o, 'cancelled')); },
    a_copy(el) {
      const o = core.allOrders().find(x => x.no === el.dataset.no);
      if (!o) return;
      core.copy(core.sellerMessage(o).join('\n'));
      toast(t('a_copied'));
    },
    a_pcat(el) { ui.pcat = el.dataset.v; rerender(); },
    a_stock(el) {
      const list = core.products(), p = list.find(x => x.id === el.dataset.id);
      p.stock = { in: 'low', low: 'out', out: 'in' }[p.stock] || 'in';
      core.saveCatalog(list);
      haptic('light');
      el.className = 'stock-btn st-' + p.stock;
      el.textContent = t(stockKey(p.stock));
    },
    a_vadd() { syncForm(); const vs = ui.edit.p.variants; vs.push({ id: 'new', label: '', price: vs[vs.length - 1].price }); rerender(); },
    a_vdel(el) { syncForm(); ui.edit.p.variants.splice(Number(el.dataset.i), 1); rerender(); },
    a_photoDel(el) { syncForm(); ui.edit.p.photos.splice(Number(el.dataset.i), 1); rerender(); },
    a_saveProduct() { saveProduct(); },
    a_delete() {
      ask(t('a_deleteQ'), () => {
        core.saveCatalog(core.products().filter(x => x.id !== ui.edit.key));
        ui.edit = null;
        toast(t('a_deleted'), 'trash');
        go('#/admin/products');
      });
    },
    a_saveSettings() {
      const e = app.querySelector('[data-form=settings]').elements, v = n => e[n].value.trim();
      SHOP.contacts = { phone: v('phone'), telegram: v('telegram').replace(/^@/, ''), hours: v('hours'), address: { uz: v('addr_uz'), ru: v('addr_ru') || v('addr_uz') } };
      core.deliveryById('tashkent').price = num(v('d_tashkent'));
      core.deliveryById('tashkent').freeFrom = num(v('d_free')) || undefined;
      core.deliveryById('regions').price = num(v('d_regions'));
      core.saveSettings();
      haptic('success');
      toast(t('a_saved'));
      rerender();
    },
    a_promoAdd() {
      const code = app.querySelector('[data-a=code]').value.trim().toUpperCase().replace(/\s+/g, '');
      const pct = num(app.querySelector('[data-a=pct]').value);
      if (!code || pct < 1 || pct > 90) return toast(t('a_promoBad'), 'close');
      SHOP.promoCodes[code] = pct;
      core.saveSettings();
      toast(t('a_saved'));
      rerender();
    },
    a_promoDel(el) { delete SHOP.promoCodes[el.dataset.code]; core.saveSettings(); rerender(); },
    a_exit() { core.setAdminDemo(false); go('#/profile'); },
    a_reset() { ask(t('a_resetQ'), () => { core.resetDemo(); ui.edit = null; toast(t('a_resetDone')); go('#/admin'); }); }
  };

  function onInput(k, el) {
    if (k === 'a_q') { ui.q = el.value; paintOrders(); }
    if (k === 'a_pq') { ui.pq = el.value; paintProducts(); }
    if (k === 'a_cq') { ui.cq = el.value; const pos = el.selectionStart; rerender(); const i = app.querySelector('[data-input=a_cq]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } }
  }
  function onChange(k, el) {
    if (k === 'a_vt') {
      syncForm();
      const p = ui.edit.p;
      if (!p.variantType) p.variants = p.variants.slice(0, 1);
      if (p.variantType === 'shade') p.variants.forEach(v => { v.color = v.color || '#D9707F'; });
      rerender();
    }
    if (k === 'a_seg') { el.closest('.seg').querySelectorAll('label').forEach(l => l.classList.toggle('on', l.contains(el))); }
    if (k === 'a_photo' && el.files && el.files[0]) {
      readPhoto(el.files[0], url => { syncForm(); ui.edit.p.photos.push(url); rerender(); });
    }
  }

  return { view, after, acts, onInput, onChange };
};
