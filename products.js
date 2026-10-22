// Product catalog. Photos are Unsplash photo ids. Prices in so'm.
// variantType: 'volume' | 'shade' | null. A variant may have oldPrice (shows as a sale).
window.PRODUCTS = [
  {
    id: 'vitamin-c-serum', cat: 'face', brand: 'Lola Skin',
    name: { uz: 'C vitaminli serum', ru: 'Сыворотка с витамином C' },
    short: { uz: 'Yorqinlik va bir tekis rang', ru: 'Сияние и ровный тон' },
    desc: {
      uz: '15% C vitamini dog‘larni kamaytiradi, teriga yorqinlik va tetiklik beradi. Yengil, tez singadi.',
      ru: '15% витамина C уменьшает пигментацию, возвращает коже сияние и свежесть. Лёгкая, быстро впитывается.'
    },
    howTo: {
      uz: 'Ertalab tozalangan teriga 3–4 tomchi surting, so‘ng krem va quyoshdan himoya vositasi.',
      ru: 'Утром нанесите 3–4 капли на очищенную кожу, затем крем и солнцезащитное средство.'
    },
    ingredients: 'Aqua, Ascorbic Acid 15%, Ferulic Acid, Tocopherol, Hyaluronic Acid, Glycerin',
    skin: ['dry', 'oily', 'combo'],
    photos: ['1576426863848-c21f53c60b19', '1617897903246-719242758050'],
    variantType: 'volume',
    variants: [
      { id: '30', label: '30 ml', price: 189000, oldPrice: 239000 },
      { id: '50', label: '50 ml', price: 279000, oldPrice: 339000 }
    ],
    stock: 'low', rating: 4.9, reviews: 312, popular: true
  },
  {
    id: 'hydra-cream', cat: 'face', brand: 'Lola Skin',
    name: { uz: 'Namlovchi yuz kremi', ru: 'Увлажняющий крем для лица' },
    short: { uz: 'Gialuron kislotasi, 24 soat', ru: 'Гиалуроновая кислота, 24 часа' },
    desc: {
      uz: 'Yengil krem terini chuqur namlaydi va yumshatadi. Yog‘li iz qoldirmaydi, makiyaj ostiga mos.',
      ru: 'Лёгкий крем глубоко увлажняет и смягчает кожу. Не оставляет жирного блеска, подходит под макияж.'
    },
    howTo: {
      uz: 'Ertalab va kechqurun tozalangan teriga massaj harakatlari bilan surting.',
      ru: 'Наносите утром и вечером на очищенную кожу массажными движениями.'
    },
    ingredients: 'Aqua, Glycerin, Sodium Hyaluronate, Squalane, Niacinamide, Panthenol, Aloe Vera',
    skin: ['dry', 'combo', 'sensitive'],
    photos: ['1601049541289-9b1b7bbbfe19'],
    variantType: 'volume',
    variants: [
      { id: '50', label: '50 ml', price: 145000 },
      { id: '100', label: '100 ml', price: 235000 }
    ],
    stock: 'in', rating: 4.8, reviews: 214, popular: true
  },
  {
    id: 'foam-cleanser', cat: 'face', brand: 'Bahor',
    name: { uz: 'Yumshoq yuvish ko‘pigi', ru: 'Мягкая пенка для умывания' },
    short: { uz: 'Terini quritmaydi', ru: 'Не сушит кожу' },
    desc: {
      uz: 'Kundalik tozalash uchun nozik ko‘pik. Changni va makiyaj qoldiqlarini yuvadi, terini tortmaydi.',
      ru: 'Нежная пенка для ежедневного очищения. Смывает загрязнения и остатки макияжа, не стягивает кожу.'
    },
    howTo: {
      uz: 'Ozgina miqdorini nam qo‘lda ko‘pirtiring, yuzga surting va iliq suv bilan yuving.',
      ru: 'Вспеньте небольшое количество во влажных ладонях, нанесите на лицо и смойте тёплой водой.'
    },
    ingredients: 'Aqua, Glycerin, Coco-Glucoside, Green Tea Extract, Allantoin, Panthenol',
    skin: ['oily', 'combo', 'sensitive'],
    photos: ['1620916566398-39f1143ab7be'],
    variantType: null,
    variants: [{ id: 'std', label: '150 ml', price: 98000 }],
    stock: 'in', rating: 4.7, reviews: 158
  },
  {
    id: 'rose-toner', cat: 'face', brand: 'Bahor',
    name: { uz: 'Atirgul suvi tonik', ru: 'Тоник с розовой водой' },
    short: { uz: 'Tinchlantiradi va tetiklashtiradi', ru: 'Успокаивает и освежает' },
    desc: {
      uz: 'Damask atirgulining suvi terini tinchlantiradi, pH muvozanatini tiklaydi va kremni yaxshiroq singdiradi.',
      ru: 'Вода дамасской розы успокаивает кожу, восстанавливает pH-баланс и помогает крему лучше впитаться.'
    },
    howTo: {
      uz: 'Yuvingandan keyin paxta disk yoki kaftlar bilan surting.',
      ru: 'После умывания нанесите ватным диском или ладонями.'
    },
    ingredients: 'Rosa Damascena Flower Water, Glycerin, Betaine, Panthenol, Chamomile Extract',
    skin: ['dry', 'sensitive', 'combo'],
    photos: ['1607602132700-068258431c6c'],
    variantType: null,
    variants: [{ id: 'std', label: '200 ml', price: 115000 }],
    stock: 'in', rating: 4.8, reviews: 96, isNew: true
  },
  {
    id: 'sheet-masks', cat: 'face', brand: 'Lola Skin',
    name: { uz: 'Mato niqoblar to‘plami', ru: 'Набор тканевых масок' },
    short: { uz: '5 dona, turli ta’sirlar', ru: '5 штук, разные эффекты' },
    desc: {
      uz: 'Namlovchi, tinchlantiruvchi va yorqinlik beruvchi 5 ta niqob. 15 daqiqada dam olgan teri.',
      ru: '5 масок: увлажнение, успокоение и сияние. Отдохнувшая кожа за 15 минут.'
    },
    howTo: {
      uz: 'Tozalangan yuzga 15–20 daqiqaga qo‘ying, qoldiqni teriga singdiring.',
      ru: 'Наложите на очищенное лицо на 15–20 минут, остатки вбейте в кожу.'
    },
    ingredients: 'Aqua, Glycerin, Hyaluronic Acid, Centella Asiatica, Niacinamide, Rice Extract',
    skin: ['dry', 'oily', 'combo', 'sensitive'],
    photos: ['1616394584738-fc6e612e71b9'],
    variantType: null,
    variants: [{ id: 'std', label: '5 × 25 ml', price: 65000, oldPrice: 85000 }],
    stock: 'in', rating: 4.6, reviews: 201, popular: true
  },
  {
    id: 'spf50', cat: 'face', brand: 'Nur',
    name: { uz: 'Quyoshdan himoya SPF 50', ru: 'Солнцезащитный крем SPF 50' },
    short: { uz: 'Oq iz qoldirmaydi', ru: 'Без белых следов' },
    desc: {
      uz: 'UVA va UVB nurlaridan yuqori himoya. Yengil fluid, har kuni makiyaj ostiga surtish mumkin.',
      ru: 'Высокая защита от UVA и UVB. Лёгкий флюид, можно наносить каждый день под макияж.'
    },
    howTo: {
      uz: 'Quyoshga chiqishdan 15 daqiqa oldin surting, har 2–3 soatda yangilang.',
      ru: 'Наносите за 15 минут до выхода на солнце, обновляйте каждые 2–3 часа.'
    },
    ingredients: 'Aqua, Zinc Oxide, Titanium Dioxide, Niacinamide, Vitamin E, Glycerin',
    skin: ['dry', 'oily', 'combo', 'sensitive'],
    photos: ['1585652757141-8837d676fac8'],
    variantType: null,
    variants: [{ id: 'std', label: '50 ml', price: 159000 }],
    stock: 'in', rating: 4.9, reviews: 287, popular: true, isNew: true
  },
  {
    id: 'body-butter', cat: 'body', brand: 'Bahor',
    name: { uz: 'Shea yog‘li tana kremi', ru: 'Крем-баттер для тела с ши' },
    short: { uz: 'Ipakdek yumshoq teri', ru: 'Шелковистая кожа' },
    desc: {
      uz: 'Shea va kakao yog‘lari quruq terini oziqlantiradi. Nozik vanil hidi kun bo‘yi saqlanadi.',
      ru: 'Масла ши и какао питают сухую кожу. Нежный аромат ванили держится весь день.'
    },
    howTo: {
      uz: 'Dushdan keyin nam teriga surting.',
      ru: 'Наносите после душа на влажную кожу.'
    },
    ingredients: 'Butyrospermum Parkii Butter, Theobroma Cacao Seed Butter, Glycerin, Vanilla Extract',
    skin: ['dry', 'sensitive'],
    photos: ['1599305090598-fe179d501227'],
    variantType: null,
    variants: [{ id: 'std', label: '200 ml', price: 119000 }],
    stock: 'in', rating: 4.8, reviews: 134
  },
  {
    id: 'natural-soap', cat: 'body', brand: 'Samarqand Botanica',
    name: { uz: 'Qo‘lda yasalgan tabiiy sovun', ru: 'Натуральное мыло ручной работы' },
    short: { uz: 'Zaytun yog‘i va lavanda', ru: 'Оливковое масло и лаванда' },
    desc: {
      uz: 'Zaytun yog‘i asosidagi sovun terini quritmasdan tozalaydi. Lavandaning tinchlantiruvchi hidi.',
      ru: 'Мыло на оливковом масле очищает, не пересушивая кожу. Успокаивающий аромат лаванды.'
    },
    howTo: { uz: 'Nam teriga ko‘pirtirib surting va yuving.', ru: 'Вспеньте на влажной коже и смойте.' },
    ingredients: 'Sodium Olivate, Sodium Cocoate, Aqua, Lavandula Oil, Glycerin',
    skin: ['dry', 'oily', 'combo', 'sensitive'],
    photos: ['1590439471364-192aa70c0b53'],
    variantType: null,
    variants: [{ id: 'std', label: '120 g', price: 39000 }],
    stock: 'in', rating: 4.7, reviews: 88
  },
  {
    id: 'hand-cream', cat: 'body', brand: 'Nur',
    name: { uz: 'Qo‘l uchun krem-gel', ru: 'Крем-гель для рук' },
    short: { uz: 'Tez singadi, yopishmaydi', ru: 'Быстро впитывается, не липнет' },
    desc: {
      uz: 'Aloe va gialuron kislotasi bilan yengil gel. Qishda qo‘llarni yorilishdan saqlaydi.',
      ru: 'Лёгкий гель с алоэ и гиалуроновой кислотой. Зимой защищает руки от трещин.'
    },
    howTo: { uz: 'Kerak bo‘lganda qo‘llarga surting.', ru: 'Наносите на руки по мере необходимости.' },
    ingredients: 'Aqua, Aloe Barbadensis, Sodium Hyaluronate, Glycerin, Shea Butter, Allantoin',
    skin: ['dry', 'sensitive'],
    photos: ['1619451334792-150fd785ee74'],
    variantType: null,
    variants: [{ id: 'std', label: '75 ml', price: 49000, oldPrice: 59000 }],
    stock: 'in', rating: 4.6, reviews: 73
  },
  {
    id: 'shampoo', cat: 'hair', brand: 'Silk Road',
    name: { uz: 'Sulfatsiz shampun', ru: 'Бессульфатный шампунь' },
    short: { uz: 'Rangli sochlar uchun ham', ru: 'Подходит для окрашенных волос' },
    desc: {
      uz: 'Sochni yumshoq tozalaydi, rangni saqlaydi va jilo beradi. Ipak oqsillari bilan.',
      ru: 'Мягко очищает, сохраняет цвет и придаёт блеск. С протеинами шёлка.'
    },
    howTo: { uz: 'Nam sochga surting, massaj qiling va yuving.', ru: 'Нанесите на влажные волосы, помассируйте и смойте.' },
    ingredients: 'Aqua, Sodium Cocoyl Isethionate, Hydrolyzed Silk, Panthenol, Argan Oil',
    skin: [],
    photos: ['1631729371254-42c2892f0e6e'],
    variantType: 'volume',
    variants: [
      { id: '250', label: '250 ml', price: 89000 },
      { id: '500', label: '500 ml', price: 149000 }
    ],
    stock: 'in', rating: 4.7, reviews: 119, popular: true
  },
  {
    id: 'hair-mask', cat: 'hair', brand: 'Silk Road',
    name: { uz: 'Tiklovchi soch niqobi', ru: 'Восстанавливающая маска для волос' },
    short: { uz: 'Shikastlangan sochlar uchun', ru: 'Для повреждённых волос' },
    desc: {
      uz: 'Keratin va argan yog‘i quruq, mo‘rt sochlarni tiklaydi. Birinchi qo‘llashdan yumshoqlik.',
      ru: 'Кератин и аргановое масло восстанавливают сухие ломкие волосы. Мягкость с первого применения.'
    },
    howTo: { uz: 'Yuvilgan sochga 5–10 daqiqaga surting, so‘ng yuving.', ru: 'Нанесите на вымытые волосы на 5–10 минут, затем смойте.' },
    ingredients: 'Aqua, Cetearyl Alcohol, Hydrolyzed Keratin, Argania Spinosa Oil, Panthenol',
    skin: [],
    photos: ['1608248597279-f99d160bfcbc'],
    variantType: null,
    variants: [{ id: 'std', label: '200 ml', price: 109000 }],
    stock: 'in', rating: 4.8, reviews: 92, isNew: true
  },
  {
    id: 'hair-oil', cat: 'hair', brand: 'Samarqand Botanica',
    name: { uz: 'Argan soch yog‘i', ru: 'Аргановое масло для волос' },
    short: { uz: 'Jilo va uchlarni himoya', ru: 'Блеск и защита кончиков' },
    desc: {
      uz: 'Sof argan yog‘i soch uchlarini oziqlantiradi, jingalaklanishni kamaytiradi va jilo beradi.',
      ru: 'Чистое аргановое масло питает кончики, уменьшает пушистость и придаёт блеск.'
    },
    howTo: { uz: '2–3 tomchini soch uchlariga surting, yuvish shart emas.', ru: 'Нанесите 2–3 капли на кончики, смывать не нужно.' },
    ingredients: 'Argania Spinosa Kernel Oil, Tocopherol',
    skin: [],
    photos: ['1608571423902-eed4a5ad8108'],
    variantType: null,
    variants: [{ id: 'std', label: '50 ml', price: 129000, oldPrice: 159000 }],
    stock: 'low', rating: 4.9, reviews: 167, popular: true
  },
  {
    id: 'lipstick', cat: 'makeup', brand: 'Nur',
    name: { uz: 'Matli lab bo‘yog‘i', ru: 'Матовая помада' },
    short: { uz: '12 soatgacha turadi', ru: 'Стойкость до 12 часов' },
    desc: {
      uz: 'Baxmal mat qoplama, labni quritmaydi. Bir surtishda to‘yingan rang.',
      ru: 'Бархатный матовый финиш, не сушит губы. Насыщенный цвет с одного слоя.'
    },
    howTo: { uz: 'Lab markazidan chetlarga qarab surting.', ru: 'Наносите от центра губ к уголкам.' },
    ingredients: 'Dimethicone, Kaolin, Shea Butter, Vitamin E, Pigments (CI 77491, CI 15850)',
    skin: [],
    photos: ['1591360236480-4ed861025fa1', '1625093742435-6fa192b6fb10'],
    variantType: 'shade',
    variants: [
      { id: 'fuchsia', label: { uz: 'Fuksiya', ru: 'Фуксия' }, color: '#C2186B', price: 79000 },
      { id: 'nude', label: { uz: 'Nude', ru: 'Нюд' }, color: '#C98E7E', price: 79000 },
      { id: 'rose', label: { uz: 'Atirgul', ru: 'Роза' }, color: '#D9707F', price: 79000 },
      { id: 'cherry', label: { uz: 'Olcha', ru: 'Вишня' }, color: '#8E1B2E', price: 79000 }
    ],
    stock: 'in', rating: 4.8, reviews: 256, popular: true
  },
  {
    id: 'mineral-powder', cat: 'makeup', brand: 'Nur',
    name: { uz: 'Mineral upa', ru: 'Минеральная пудра' },
    short: { uz: 'Tabiiy mat qoplama', ru: 'Естественный матовый финиш' },
    desc: {
      uz: 'Yengil mineral upa yog‘li yaltirashni yo‘qotadi va terini bir tekis qiladi. Teshiklarni yopmaydi.',
      ru: 'Лёгкая минеральная пудра убирает жирный блеск и выравнивает тон. Не забивает поры.'
    },
    howTo: { uz: 'Katta cho‘tka bilan yuzga yupqa qatlamda surting.', ru: 'Нанесите большой кистью тонким слоем.' },
    ingredients: 'Mica, Zinc Oxide, Titanium Dioxide, Kaolin, Iron Oxides',
    skin: ['oily', 'combo'],
    photos: ['1515688594390-b649af70d282'],
    variantType: 'shade',
    variants: [
      { id: 'light', label: { uz: 'Och', ru: 'Светлый' }, color: '#EBCBB0', price: 139000 },
      { id: 'medium', label: { uz: 'O‘rta', ru: 'Средний' }, color: '#D6A986', price: 139000 },
      { id: 'warm', label: { uz: 'Iliq', ru: 'Тёплый' }, color: '#B98462', price: 139000 }
    ],
    stock: 'in', rating: 4.6, reviews: 81, isNew: true
  },
  {
    id: 'mascara', cat: 'makeup', brand: 'Nur',
    name: { uz: 'Hajm beruvchi tush', ru: 'Тушь для объёма' },
    short: { uz: 'To‘kilmaydi, suvga chidamli', ru: 'Не осыпается, водостойкая' },
    desc: {
      uz: 'Kipriklarga katta hajm va uzunlik beradi. Kun bo‘yi to‘kilmaydi.',
      ru: 'Придаёт ресницам объём и длину. Не осыпается в течение дня.'
    },
    howTo: { uz: 'Kiprik ildizidan uchiga qarab zigzag harakat bilan surting.', ru: 'Наносите зигзагом от корней к кончикам ресниц.' },
    ingredients: 'Aqua, Beeswax, Copernicia Cerifera Wax, Panthenol, CI 77499',
    skin: [],
    photos: ['1631214540553-ff044a3ff1d4'],
    variantType: null,
    variants: [{ id: 'std', label: '10 ml', price: 99000, oldPrice: 129000 }],
    stock: 'in', rating: 4.7, reviews: 143
  },
  {
    id: 'eau-de-parfum', cat: 'perfume', brand: 'Lola Parfum',
    name: { uz: 'Bloom atiri', ru: 'Парфюм Bloom' },
    short: { uz: 'Pion, atirgul va mushk', ru: 'Пион, роза и мускус' },
    desc: {
      uz: 'Nozik gulli atir: yuqori notalar — pion va nok, yurak — atirgul, asos — oq mushk. 8 soatgacha saqlanadi.',
      ru: 'Нежный цветочный аромат: верх — пион и груша, сердце — роза, база — белый мускус. Стойкость до 8 часов.'
    },
    howTo: { uz: 'Bilak va bo‘yinga 20 sm masofadan seping.', ru: 'Распылите на запястья и шею с расстояния 20 см.' },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Limonene, Linalool, Citronellol',
    skin: [],
    photos: ['1595425970377-c9703cf48b6d', '1588405748880-12d1d2a59f75'],
    variantType: 'volume',
    variants: [
      { id: '50', label: '50 ml', price: 349000, oldPrice: 429000 },
      { id: '100', label: '100 ml', price: 529000, oldPrice: 649000 }
    ],
    stock: 'in', rating: 4.9, reviews: 178, popular: true
  },
  {
    id: 'glow-set', cat: 'gifts', brand: 'Lola Skin',
    name: { uz: '“Yorqinlik” sovg‘a to‘plami', ru: 'Подарочный набор «Сияние»' },
    short: { uz: 'Serum + gua sha tosh', ru: 'Сыворотка + скребок гуа ша' },
    desc: {
      uz: 'C vitaminli serum va pushti kvars gua sha toshi chiroyli qutida. Ajoyib sovg‘a.',
      ru: 'Сыворотка с витамином C и скребок гуа ша из розового кварца в красивой коробке. Отличный подарок.'
    },
    howTo: {
      uz: 'Serumni surting, so‘ng gua sha bilan yuz markazidan chetlarga massaj qiling.',
      ru: 'Нанесите сыворотку, затем помассируйте лицо гуа ша от центра к краям.'
    },
    ingredients: 'Vitamin C serum 30 ml, Rose quartz gua sha, gift box',
    skin: ['dry', 'oily', 'combo'],
    photos: ['1600428877878-1a0fd85beda8'],
    variantType: null,
    variants: [{ id: 'std', price: 399000, oldPrice: 479000 }],
    stock: 'low', rating: 5.0, reviews: 64, isNew: true
  },
  {
    id: 'ritual-set', cat: 'gifts', brand: 'Lola Skin',
    name: { uz: '“Kundalik parvarish” to‘plami', ru: 'Набор «Ежедневный уход»' },
    short: { uz: '5 ta mahsulot, to‘liq parvarish', ru: '5 средств, полный уход' },
    desc: {
      uz: 'Ko‘pik, tonik, serum, krem va SPF — ertalabki parvarish uchun hammasi bitta to‘plamda.',
      ru: 'Пенка, тоник, сыворотка, крем и SPF — всё для утреннего ухода в одном наборе.'
    },
    howTo: {
      uz: 'Tartib bilan: ko‘pik → tonik → serum → krem → SPF.',
      ru: 'По порядку: пенка → тоник → сыворотка → крем → SPF.'
    },
    ingredients: 'Foam cleanser, Rose toner, Vitamin C serum, Hydrating cream, SPF 50',
    skin: ['dry', 'oily', 'combo', 'sensitive'],
    photos: ['1629198688000-71f23e745b6e'],
    variantType: null,
    variants: [{ id: 'std', price: 459000 }],
    stock: 'in', rating: 4.9, reviews: 47
  }
];
