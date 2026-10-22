// Shop settings. For a new client, change this file and products.js — not the app code.
window.SHOP = {
  name: 'Lola Beauty',
  logo: 'lola.',
  orderPrefix: 'LB',
  defaultLang: 'uz',

  // Telegram user IDs of the shop owner(s): they get the admin panel automatically.
  // This check only decides which screens to show. The real product must verify
  // Telegram's signed initData on the server before trusting it.
  adminIds: [],
  // Demo only: shows a "Sign in as seller" button in Profile. Set false for a real client.
  demoAdminSwitch: true,
  languages: ['uz', 'ru'],

  colors: {
    primary: '#D6456B',
    primary2: '#EE8BA4',
    soft: '#FCE4EB',
    bg: '#FFF6F8'
  },

  contacts: {
    telegram: 'lolabeauty_demo',
    phone: '+998 71 200 00 00',
    address: { uz: 'Toshkent, Yunusobod tumani, 4-mavze', ru: 'Ташкент, Юнусабадский район, 4-квартал' },
    hours: '09:00 – 21:00'
  },

  // Unsplash photo ids (https://unsplash.com/license)
  welcomePhoto: '1487412947147-5cebf100ffc2',

  banners: [
    {
      photo: '1600428877878-1a0fd85beda8',
      tag: { uz: 'Maxsus taklif', ru: 'Спецпредложение' },
      title: { uz: 'Kuzgi chegirma', ru: 'Осенняя распродажа' },
      text: { uz: '30% gacha chegirma', ru: 'Скидки до −30%' },
      go: { sale: true }
    },
    {
      photo: '1585652757141-8837d676fac8',
      tag: { uz: 'Toshkent bo‘ylab', ru: 'По Ташкенту' },
      title: { uz: 'Bepul yetkazish', ru: 'Бесплатная доставка' },
      text: { uz: '500 000 so‘mdan ortiq xaridlarga', ru: 'при заказе от 500 000 сум' },
      go: { cat: 'all' }
    },
    {
      photo: '1629198688000-71f23e745b6e',
      tag: { uz: 'Yangi', ru: 'Новинка' },
      title: { uz: 'Sovg‘a to‘plamlari', ru: 'Подарочные наборы' },
      text: { uz: 'Yaqinlaringizni xursand qiling', ru: 'Порадуйте близких' },
      go: { cat: 'gifts' }
    }
  ],

  categories: [
    { id: 'face', name: { uz: 'Yuz', ru: 'Лицо' }, photo: '1576426863848-c21f53c60b19' },
    { id: 'body', name: { uz: 'Tana', ru: 'Тело' }, photo: '1599305090598-fe179d501227' },
    { id: 'hair', name: { uz: 'Soch', ru: 'Волосы' }, photo: '1522337360788-8b13dee7a37e' },
    { id: 'makeup', name: { uz: 'Makiyaj', ru: 'Макияж' }, photo: '1515688594390-b649af70d282' },
    { id: 'perfume', name: { uz: 'Atir', ru: 'Парфюм' }, photo: '1595425970377-c9703cf48b6d' },
    { id: 'gifts', name: { uz: 'Sovg‘alar', ru: 'Подарки' }, photo: '1600428877878-1a0fd85beda8' }
  ],

  delivery: [
    { id: 'tashkent', icon: 'truck', price: 25000, freeFrom: 500000, needsAddress: true },
    { id: 'regions', icon: 'box', price: 35000, needsAddress: true },
    { id: 'pickup', icon: 'store', price: 0, needsAddress: false }
  ],

  payments: [
    { id: 'cash', icon: 'cash' },
    { id: 'card', icon: 'card' },
    { id: 'click', icon: 'bolt', soon: true },
    { id: 'payme', icon: 'bolt', soon: true }
  ],

  promoCodes: { LOLA10: 10 }
};
