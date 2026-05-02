import { Place } from '../../types';

export const SEED_PLACES: Place[] = [
  {
    id: 'seed-r1', name: 'Sushi Saito', category: 'restaurant',
    introduction: "One of Tokyo's most revered omakase counters. Chef Saito selects the finest seasonal fish from Tsukiji daily — a 3-starred establishment with a years-long waitlist that remains utterly unpretentious.",
    address: '1-9-15 Nishi-Azabu, Minato-ku, Tokyo', opening_hours: 'Tue–Sat 12:00–14:00, 18:00–22:00. Closed Sun–Mon.', lat: 35.6614, lng: 139.7242,
  },
  {
    id: 'seed-r2', name: 'Narisawa', category: 'restaurant',
    introduction: "Chef Yoshihiro Narisawa's avant-garde Innovative Satoyama cuisine blurs the line between nature and kitchen. A sensory meditation on the Japanese landscape.",
    address: '2-6-15 Minami-Aoyama, Minato-ku, Tokyo', opening_hours: 'Tue–Sat 12:00–13:00, 18:30–20:30. Closed Sun–Mon.', lat: 35.6698, lng: 139.7207,
  },
  {
    id: 'seed-r3', name: 'Tonki', category: 'restaurant',
    introduction: "A Meguro institution since 1939. The tonkatsu here is the platonic ideal — panko-crusted, deep-fried in lard, served with hand-shredded cabbage and a miso soup that tastes like decades of wisdom.",
    address: '1-1-2 Shimo-Meguro, Meguro-ku, Tokyo', opening_hours: 'Wed–Mon 16:00–22:45. Closed Tue.', lat: 35.6327, lng: 139.7060,
  },
  {
    id: 'seed-c1', name: 'Fuglen Tokyo', category: 'coffee',
    introduction: "Oslo's beloved café settled quietly into Tomigaya. By day, exceptional single-origin pour-overs; by night, a Nordic cocktail bar with unhurried Scandinavian pace.",
    address: '1-16-11 Tomigaya, Shibuya-ku, Tokyo', opening_hours: 'Mon–Fri 8:00–22:00, Sat–Sun 9:00–24:00.', lat: 35.6668, lng: 139.6926,
  },
  {
    id: 'seed-c2', name: 'Allpress Espresso', category: 'coffee',
    introduction: "A New Zealand roaster in a Kiyosumi-Shirakawa warehouse. Raw concrete, floor-to-ceiling windows — as considered as the espresso pulled within it.",
    address: '3-7-2 Hirano, Koto-ku, Tokyo', opening_hours: 'Mon–Fri 9:00–17:00, Sat–Sun 10:00–18:00.', lat: 35.6828, lng: 139.8094,
  },
  {
    id: 'seed-c3', name: 'Switch Coffee Tokyo', category: 'coffee',
    introduction: "Tiny, serious, and quietly influential. The owner roasts on-site and treats each cup with scientific precision. Easy to miss, impossible to forget.",
    address: '2-12-4 Kami-Osaki, Shinagawa-ku, Tokyo', opening_hours: 'Mon–Sat 9:00–18:00. Closed Sun.', lat: 35.6399, lng: 139.7185,
  },
  {
    id: 'seed-d1', name: 'Bar High Five', category: 'drink',
    introduction: "Hidetsugu Ueno's Ginza basement is the most influential cocktail bar in Asia. No menus — Ueno reads you and builds something precisely right. A masterclass in hospitality.",
    address: 'Efflore Ginza 5 B1F, 5-4-15 Ginza, Chuo-ku, Tokyo', opening_hours: 'Mon–Sat 18:00–02:00. Closed Sun.', lat: 35.6721, lng: 139.7654,
  },
  {
    id: 'seed-d2', name: 'Zoetrope', category: 'drink',
    introduction: "A whisky bar in Shinjuku devoted exclusively to Japanese single malts. Over 300 bottles — from Karuizawa to Chichibu. The owner's encyclopaedic knowledge is the real draw.",
    address: '7-10-14 Nishi-Shinjuku, Shinjuku-ku, Tokyo', opening_hours: 'Mon–Sat 19:00–26:00. Closed Sun.', lat: 35.6919, lng: 139.6957,
  },
  {
    id: 'seed-d3', name: 'Gen Yamamoto', category: 'drink',
    introduction: "Only eight seats, four cocktails per evening, each built around a single Japanese ingredient at peak season. It reads more like a tea ceremony than a bar.",
    address: '1-6-4 Azabu-Juban, Minato-ku, Tokyo', opening_hours: 'Wed–Mon 18:00–22:30. Closed Tue.', lat: 35.6572, lng: 139.7396,
  },
  {
    id: 'seed-g1', name: '21_21 Design Sight', category: 'gallery_museum',
    introduction: "Issey Miyake and Tadao Ando's subterranean design museum in Roppongi. Exhibitions reframe everyday objects as art with curatorial precision that matches the architecture.",
    address: '9-7-6 Akasaka, Minato-ku (Midtown Garden), Tokyo', opening_hours: 'Wed–Mon 10:00–18:00. Closed Tue.', lat: 35.6660, lng: 139.7298,
  },
  {
    id: 'seed-g2', name: 'Nezu Museum', category: 'gallery_museum',
    introduction: "Pre-modern Asian art in a Kengo Kuma building, spilling into one of Tokyo's most beautiful gardens. The bamboo grove path alone is worth the visit.",
    address: '6-5-1 Minami-Aoyama, Minato-ku, Tokyo', opening_hours: 'Tue–Sun 10:00–17:00. Closed Mon.', lat: 35.6639, lng: 139.7185,
  },
  {
    id: 'seed-s1', name: 'Dover Street Market Ginza', category: 'shopping',
    introduction: "Rei Kawakubo's extraordinary multi-brand concept store across seven floors of curated fashion and art. The installations change seasonally; the roster of labels is unmatched.",
    address: '6-9-5 Ginza, Chuo-ku, Tokyo', opening_hours: 'Daily 11:00–20:00.', lat: 35.6698, lng: 139.7660,
  },
  {
    id: 'seed-s2', name: 'Tsutaya Books Daikanyama', category: 'shopping',
    introduction: "A flagship temple to print culture in leafy Daikanyama. Beautifully curated art, travel and design books, with a coffee bar and record store integrated seamlessly.",
    address: '17-5 Sarugakucho, Shibuya-ku, Tokyo', opening_hours: 'Daily 7:00–02:00.', lat: 35.6490, lng: 139.7033,
  },
  {
    id: 'seed-h1', name: 'Air Aoyama', category: 'hair_salon',
    introduction: "The most architecturally striking hair salon in Japan. Designed by Sou Fujimoto — the all-white irregular interior has become a pilgrimage site for design students.",
    address: '3-14-15 Minami-Aoyama, Minato-ku, Tokyo', opening_hours: 'Tue–Sun 11:00–20:00. Closed Mon.', lat: 35.6642, lng: 139.7165,
  },
  {
    id: 'seed-m1', name: 'Disc Union Shinjuku', category: 'music',
    introduction: "Japan's legendary used-record chain reaches its apotheosis in Shinjuku. Multiple floors by genre — jazz, rock, electronic, soul. The density of rare pressings is staggering.",
    address: '3-31-4 Shinjuku, Shinjuku-ku, Tokyo', opening_hours: 'Daily 11:00–21:00.', lat: 35.6912, lng: 139.7057,
  },
  {
    id: 'seed-m2', name: 'WWW X', category: 'music',
    introduction: "Shibuya's finest mid-capacity live house — superb sound, sightlines from every angle, a discerning booking policy bridging Japanese and international underground acts.",
    address: '13-17 Udagawacho, Shibuya-ku, Tokyo', opening_hours: 'Doors open at show time. Check schedule.', lat: 35.6599, lng: 139.6970,
  },
  {
    id: 'seed-o1', name: 'Yanaka Cemetery', category: 'other',
    introduction: "Tokyo's most atmospheric cemetery — a slow, shaded walk through old Tokyo where cats outnumber visitors. Cherry trees in spring, ginkgo gold in autumn.",
    address: '7-5-24 Yanaka, Taito-ku, Tokyo', opening_hours: 'Open daily, all hours.', lat: 35.7268, lng: 139.7650,
  },
  {
    id: 'seed-o2', name: 'Koenji', category: 'other',
    introduction: "Tokyo's most bohemian neighbourhood retains a counter-culture energy. Vintage shops, jazz bars, and curry houses spill onto streets that feel entirely unlike anywhere else in the city.",
    address: 'Koenji, Suginami-ku, Tokyo', opening_hours: 'Streets open daily.', lat: 35.7054, lng: 139.6491,
  },
];
