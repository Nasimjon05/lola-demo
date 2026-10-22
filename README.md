# Lola Beauty — demo Telegram store

A demo shop that runs as a Telegram Mini App and in any phone browser. No server, no build step.

## Open it on your computer
Double-click `index.html`. For the phone view in Chrome, press F12 and then Ctrl+Shift+M.

## Files
| File | What it is |
|---|---|
| `config.js` | **Shop settings:** name, colours, contacts, banners, categories, delivery prices, promo codes |
| `products.js` | **Product catalog:** names, prices, photos, variants |
| `i18n.js` | Interface texts in Uzbek and Russian |
| `admin.js` | The seller (admin) panel |
| `app.js`, `styles.css`, `index.html` | The app itself. You don't touch these for a new client |

**New client = edit `config.js` and `products.js`.** After any change, raise the `?v=7` number in `index.html` (to `?v=8` and so on) so Telegram doesn't show the old cached version.

## Put it online (free, HTTPS — Telegram requires it)
Easiest: go to https://app.netlify.com/drop and drag the `demo-store` folder in. You get a link like `https://something.netlify.app`.
Other free options: GitHub Pages, Vercel, Cloudflare Pages.

## Open it inside Telegram
1. In Telegram, open **@BotFather**, send `/newbot` and follow the steps.
2. Send `/mybots` → pick the bot → **Bot Settings** → **Menu Button** → paste your HTTPS link.
3. Open your bot. The menu button now opens the shop.

## Seller (admin) panel
It's the same app. Whoever is listed as the owner gets the panel; everyone else sees the normal shop.
- **Real client:** put the owner's Telegram user ID in `adminIds` in `config.js` (they can get it from @userinfobot), and set `demoAdminSwitch: false`. Opening the shop from Telegram, the owner lands straight in the panel.
- **Demo:** Profile → **"Sotuvchi sifatida kirish"**. The panel comes pre-filled with 26 sample orders, so it looks like a working shop. Settings → "Demo ma'lumotlarni tiklash" restores everything.

What the panel does:
- **Panel:** today's revenue, today's orders, orders waiting for an answer, average order, a 7-day revenue chart, low-stock warnings, best sellers, latest orders.
- **Orders:** search, filter by status, order details, customer call button, the status flow New → Confirmed → On the way → Delivered (or Cancel), and copying the order text for a courier. The customer sees the new status in "My orders".
- **Products:** add, edit and delete products; upload photos from the phone; prices, sale prices and variants (volume or shade); stock status with one tap; Popular/New labels; skin types; texts in both languages.
- **Customers:** built from orders. Shows number of orders, total spent, last order and a "regular customer" badge.
- **Settings:** contacts, working hours, address, delivery prices, the free-delivery limit, promo codes, language.

⚠️ **Demo limit:** without a server, everything is saved only on the phone that made it. An order placed on another phone won't reach the owner's panel. The real product needs a small server plus the bot. That server must also check Telegram's signed login data (`initData`), because right now the admin check only decides which screens to show.

## Demo notes
- Promo code **LOLA10** gives 10% off.
- Orders are saved only on the device that placed them. The "Seller's view" box shows the exact message the owner will get once the bot is connected (version 2).
- Order status is set by the seller in the admin panel.
- Photos are free Unsplash images loaded by link. For a real client, use their own product photos.
