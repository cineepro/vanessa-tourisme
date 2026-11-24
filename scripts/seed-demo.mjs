// scripts/seed-demo.mjs — Vanessa Tourisme
//
// Insère des DONNÉES DE DÉMONSTRATION (une agence, 4 sites, 2 guides, 4 offres, des créneaux,
// des lieux utiles et des articles) pour tester le site de bout en bout.
// Tous les documents ont un ID commençant par « demo_ » : on peut les supprimer proprement.
//
//   npm run seed:demo                          insère (ignore ce qui existe déjà)
//   npm run seed:demo -- --owner-id=<userId>   en plus : vous ajoute à l'équipe de l'agence de démo
//                                              (rôle owner + label `agency`) pour tester l'espace agence
//   npm run seed:demo -- --clean               supprime toutes les données de démonstration
//
// ⚠ Textes et coordonnées indicatifs, à remplacer par vos vraies données. Les lieux utiles sont fictifs
//   (noms « démo ») : ne les laissez pas en production.
import { DB, RestError, api, getOrNull, requireEnv } from './lib/rest.mjs'
import { idFrom } from './lib/rest.mjs'

requireEnv()

const args = process.argv.slice(2)
const CLEAN = args.includes('--clean')
const OWNER_ID = (args.find((a) => a.startsWith('--owner-id=')) || '').replace('--owner-id=', '')

const C = {
  agencies: idFrom('VITE_APPWRITE_COLLECTION_TOUR_AGENCIES', 'tour_agencies'),
  sites: idFrom('VITE_APPWRITE_COLLECTION_TOUR_SITES', 'tour_sites'),
  guides: idFrom('VITE_APPWRITE_COLLECTION_TOUR_GUIDES', 'tour_guides'),
  offers: idFrom('VITE_APPWRITE_COLLECTION_TOUR_OFFERS', 'tour_offers'),
  availabilities: idFrom('VITE_APPWRITE_COLLECTION_TOUR_AVAILABILITIES', 'tour_availabilities'),
  places: idFrom('VITE_APPWRITE_COLLECTION_TOUR_PLACES', 'tour_places'),
  articles: idFrom('VITE_APPWRITE_COLLECTION_TOUR_ARTICLES', 'tour_articles'),
}
const TEAM = 'demo_agence'
const AGENCY = 'demo_agence'
const NOW = new Date().toISOString()
const DEMO_NOTE = 'Données de démonstration : à remplacer par les informations réelles de votre agence.'

/* ---------- géohash (même algorithme que le site) ---------- */
const B32 = '0123456789bcdefghjkmnpqrstuvwxyz'
function geohash(lat, lng, precision = 9) {
  const la = [-90, 90], lo = [-180, 180]
  let hash = '', bit = 0, ch = 0, even = true
  while (hash.length < precision) {
    const r = even ? lo : la, v = even ? lng : lat, mid = (r[0] + r[1]) / 2
    if (v >= mid) { ch = (ch << 1) | 1; r[0] = mid } else { ch <<= 1; r[1] = mid }
    even = !even
    if (++bit === 5) { hash += B32[ch]; bit = 0; ch = 0 }
  }
  return hash
}

/* ---------- permissions des documents de démonstration ---------- */
const teamPerms = [
  'read("any")',
  `update("team:${TEAM}")`,
  `delete("team:${TEAM}/owner")`,
  `delete("team:${TEAM}/admin")`,
  'update("label:superadmin")',
  'delete("label:superadmin")',
]
const publicRead = ['read("any")']

/* ---------- données ---------- */
const sites = [
  {
    id: 'demo_site_ouidah', slug: 'demo-ouidah-route-des-esclaves', name: 'Ouidah : Route des Esclaves',
    tagline: 'Un chemin de mémoire jusqu’à l’océan', city: 'Ouidah', department: 'Atlantique', lat: 6.3667, lng: 2.085,
    summary: 'Un parcours de mémoire et de spiritualité à travers l’ancienne cité négrière, entre vestiges historiques, sites vodun et bord de mer.',
    description: 'Ouidah est l’un des lieux de mémoire les plus marquants du Bénin. La visite suit la route empruntée jadis par les captifs jusqu’à la plage, et fait découvrir l’histoire de la traite, la vie de la cité et la place du vodun dans le quotidien. Un guide local aide à comprendre ce que l’on voit et à le replacer dans l’histoire.',
    history: 'Ouidah fut un grand port de la traite atlantique. La mémoire de cette période est aujourd’hui entretenue par des monuments, des musées et des cérémonies.',
    categories: ['historique', 'vodun', 'culturel'], vibes: ['spirituel', 'educatif', 'contemplatif', 'authentique'], environments: ['ville', 'plage'],
    climateFeel: 'chaud', activities: ['visite guidée', 'mémoire et histoire', 'rencontre avec des guides'],
    highlights: ['Un parcours chargé d’histoire', 'Des lieux de culte vodun', 'La plage et son monument'], bestMonths: [11, 12, 1, 2, 3],
    minutes: 180, difficulty: 'facile', budget: 'bas', fee: 0, family: true, featured: true,
  },
  {
    id: 'demo_site_ganvie', slug: 'demo-ganvie-cite-lacustre', name: 'Ganvié : la cité lacustre',
    tagline: 'Un village construit sur l’eau', city: 'Abomey-Calavi', department: 'Atlantique', lat: 6.4667, lng: 2.4167,
    summary: 'Une balade en pirogue sur le lac Nokoué jusqu’à un village entier bâti sur pilotis, pour découvrir un mode de vie unique.',
    description: 'Ganvié se découvre en pirogue, au rythme du lac. On y voit les maisons sur pilotis, les marchés flottants et les activités de pêche. C’est une sortie calme et dépaysante, idéale pour la photographie et la rencontre avec les habitants, à faire avec un guide qui connaît le village.',
    history: null, categories: ['culturel', 'lac_lagune', 'nature'], vibes: ['calme', 'authentique', 'contemplatif', 'romantique'], environments: ['eau', 'lac', 'village'],
    climateFeel: 'humide', activities: ['pirogue', 'photographie', 'rencontre avec des artisans'],
    highlights: ['La traversée en pirogue', 'Les maisons sur pilotis', 'Les marchés sur l’eau'], bestMonths: [11, 12, 1, 2, 3],
    minutes: 150, difficulty: 'facile', budget: 'moyen', fee: 0, family: true, featured: true,
  },
  {
    id: 'demo_site_abomey', slug: 'demo-abomey-palais-royaux', name: 'Abomey : les palais royaux',
    tagline: 'Au coeur de l’ancien royaume du Danxomè', city: 'Abomey', department: 'Zou', lat: 7.1829, lng: 1.9912,
    summary: 'Les palais et le musée historique d’Abomey racontent l’histoire des rois du Danxomè à travers bas-reliefs, trônes et objets de cour.',
    description: 'Abomey fut la capitale du royaume du Danxomè. Les anciens palais royaux, aujourd’hui musée, présentent bas-reliefs, objets de cérémonie et récits de la vie de cour. Une visite guidée est vivement conseillée pour comprendre les symboles et les histoires derrière chaque objet.',
    history: 'Le royaume du Danxomè a marqué durablement l’histoire de la région. Les palais d’Abomey sont reconnus comme patrimoine mondial par l’UNESCO.',
    categories: ['historique', 'culturel'], vibes: ['educatif', 'authentique'], environments: ['ville'],
    climateFeel: 'chaud', activities: ['visite guidée', 'musée', 'histoire des royaumes'],
    highlights: ['Les bas-reliefs historiques', 'Le musée des rois', 'Les récits de cour'], bestMonths: [11, 12, 1, 2, 3],
    minutes: 120, difficulty: 'facile', budget: 'bas', fee: 2000, family: true, featured: false,
  },
  {
    id: 'demo_site_pendjari', slug: 'demo-pendjari-parc-national', name: 'Parc national de la Pendjari',
    tagline: 'Le safari béninois', city: 'Tanguiéta', department: 'Atacora', lat: 10.62, lng: 1.267,
    summary: 'Un grand parc de savane au nord-ouest du Bénin pour observer la faune sauvage lors d’un safari en véhicule.',
    description: 'La Pendjari est la grande destination safari du Bénin : savane, mares, collines et une faune variée. Les sorties se font en véhicule avec un guide-pisteur. La saison sèche est la plus favorable pour l’observation, car les animaux se rassemblent autour des points d’eau.',
    history: null, categories: ['faune', 'nature', 'aventure'], vibes: ['aventure', 'familial', 'contemplatif'], environments: ['savane', 'riviere'],
    climateFeel: 'sec', activities: ['safari', 'observation des animaux', 'photographie'],
    highlights: ['Le safari en véhicule', 'Les points d’eau en saison sèche', 'Les paysages de savane'], bestMonths: [12, 1, 2, 3, 4],
    minutes: 480, difficulty: 'modere', budget: 'eleve', fee: 10000, family: true, featured: true,
  },
]

const guides = [
  { id: 'demo_guide_amina', slug: 'demo-amina', fullName: 'Amina (démo)', bio: `Guide passionnée par l’histoire et les traditions du sud du Bénin. ${DEMO_NOTE}`, languages: ['fr', 'en', 'fon'], specialties: ['histoire', 'vodun', 'culture'], siteIds: ['demo_site_ouidah', 'demo_site_abomey'], years: 8, certified: true, city: 'Ouidah' },
  { id: 'demo_guide_kossi', slug: 'demo-kossi', fullName: 'Kossi (démo)', bio: `Guide de nature et de balades sur l’eau. ${DEMO_NOTE}`, languages: ['fr', 'fon', 'goun'], specialties: ['pirogue', 'nature', 'photographie'], siteIds: ['demo_site_ganvie', 'demo_site_pendjari'], years: 5, certified: true, city: 'Cotonou' },
]

const offers = [
  { id: 'demo_offer_ouidah', siteId: 'demo_site_ouidah', guideId: 'demo_guide_amina', title: 'Visite guidée de la Route des Esclaves (3 h)', price: 10000, childPrice: 5000, minutes: 180, mode: 'any_date', instant: false, meeting: 'Place centrale de Ouidah', lat: 6.3667, lng: 2.085, max: 12 },
  { id: 'demo_offer_ganvie', siteId: 'demo_site_ganvie', guideId: 'demo_guide_kossi', title: 'Balade en pirogue à Ganvié (2 h 30)', price: 15000, childPrice: 7500, minutes: 150, mode: 'slots', instant: true, meeting: 'Embarcadère d’Abomey-Calavi', lat: 6.4333, lng: 2.3333, max: 8 },
  { id: 'demo_offer_abomey', siteId: 'demo_site_abomey', guideId: 'demo_guide_amina', title: 'Les palais royaux d’Abomey avec guide (2 h)', price: 8000, childPrice: 4000, minutes: 120, mode: 'any_date', instant: true, meeting: 'Entrée du musée historique', lat: 7.1829, lng: 1.9912, max: 15 },
  { id: 'demo_offer_pendjari', siteId: 'demo_site_pendjari', guideId: 'demo_guide_kossi', title: 'Safari d’une journée dans la Pendjari', price: 60000, childPrice: null, group: true, minutes: 480, mode: 'any_date', instant: false, meeting: 'Tanguiéta, à convenir avec le guide', lat: 10.62, lng: 1.267, max: 6 },
]

const places = [
  ['demo_place_hop', 'hospital', 'Hôpital démo (Cotonou centre)', 6.3703, 2.3912, { hasEmergency: true, open24h: true, address: 'Adresse fictive' }],
  ['demo_place_cli', 'clinic', 'Clinique démo (Cotonou)', 6.3745, 2.3955, { hasEmergency: true, address: 'Adresse fictive' }],
  ['demo_place_ph1', 'pharmacy', 'Pharmacie démo 1 (Cotonou)', 6.3685, 2.3935, { address: 'Adresse fictive' }],
  ['demo_place_ph2', 'pharmacy', 'Pharmacie démo 2 (Cotonou)', 6.3725, 2.3885, { open24h: true, address: 'Adresse fictive' }],
  ['demo_place_res', 'restaurant', 'Restaurant démo (Cotonou)', 6.3715, 2.3925, { priceLevel: 'medium', cuisine: ['béninoise'], specialDishes: ['pâte', 'poisson braisé'] }],
  ['demo_place_maq', 'maquis', 'Maquis démo (Cotonou)', 6.3695, 2.3895, { priceLevel: 'low', cuisine: ['béninoise'], specialDishes: ['akassa', 'amiwo'] }],
  ['demo_place_cin', 'cinema', 'Cinéma démo (Cotonou)', 6.3755, 2.3975, { priceLevel: 'medium' }],
  ['demo_place_atm', 'atm', 'Distributeur démo (Cotonou)', 6.3705, 2.3905, { open24h: true }],
  ['demo_place_ouh', 'pharmacy', 'Pharmacie démo (Ouidah)', 6.3655, 2.0855, {}],
  ['demo_place_our', 'restaurant', 'Restaurant démo (Ouidah)', 6.3675, 2.0835, { priceLevel: 'low', cuisine: ['béninoise'] }],
]

const articles = [
  { id: 'demo_art_vodun', slug: 'demo-quest-ce-que-le-vodun', type: 'vodun', title: 'Qu’est-ce que le vodun ?', excerpt: 'Une religion née en terre béninoise, au coeur de la vie quotidienne de nombreuses familles.', minutes: 4, related: ['demo_site_ouidah'],
    content: `Le vodun est une religion pratiquée depuis des siècles dans le sud du Bénin et dans les pays voisins. Il est présent dans la vie de tous les jours : cérémonies, fêtes, lieux de culte, objets, musique.\n\n## Un monde de respect\n\nCertaines cérémonies sont publiques, d’autres sont réservées aux initiés. **Demandez toujours l’autorisation avant de photographier ou de filmer**, et suivez les consignes de votre guide.\n\n## Pour bien visiter\n\n- Habillez-vous simplement et de manière respectueuse.\n- Ne touchez pas aux objets sacrés sans y être invité.\n- Posez vos questions avec curiosité : on vous répondra volontiers.\n\n${DEMO_NOTE}` },
  { id: 'demo_art_reflexes', slug: 'demo-bons-reflexes-en-visite', type: 'customs', title: 'Les bons réflexes pour une visite respectueuse', excerpt: 'Saluer, demander, remercier : quelques gestes simples qui changent tout.', minutes: 3, related: [],
    content: `Au Bénin, la politesse compte beaucoup. **Salutations d’abord** : prenez le temps de dire bonjour avant de poser une question.\n\n- Demandez avant de prendre une personne en photo.\n- Marchandez avec le sourire, sans agressivité.\n- Évitez de donner de l’argent directement aux enfants ; passez par votre guide.\n\n${DEMO_NOTE}` },
  { id: 'demo_art_voyage', slug: 'demo-preparer-son-voyage', type: 'practical', title: 'Préparer son voyage au Bénin : l’essentiel', excerpt: 'Monnaie, formalités, santé : les points à vérifier avant de partir.', minutes: 4, related: [],
    content: `## Monnaie\n\nLa monnaie est le franc CFA (XOF). Gardez un peu d’espèces pour les petites dépenses.\n\n## Formalités\n\nLes formalités d’entrée (visa, e-visa, certificat de vaccination) dépendent de votre nationalité : **vérifiez-les auprès des autorités ou de l’ambassade avant de partir**.\n\n## Santé\n\nConsultez un médecin ou un centre de voyageurs avant le départ pour connaître les vaccins et protections conseillés.\n\n${DEMO_NOTE}` },
  { id: 'demo_faq_monnaie', slug: 'demo-faq-monnaie', type: 'faq', title: 'Quelle monnaie utilise-t-on au Bénin ?', excerpt: null, minutes: 1, related: [],
    content: 'Le franc CFA (XOF). Les paiements en espèces sont très courants, et le paiement par mobile money est répandu.' },
  { id: 'demo_faq_urgence', slug: 'demo-faq-urgence', type: 'faq', title: 'Que faire en cas d’urgence ?', excerpt: null, minutes: 1, related: [],
    content: 'Appelez tout de suite le 112 (SAMU), le 118 (pompiers) ou le 117 (police). Vous trouverez aussi les établissements de santé les plus proches dans la page « Infos pratiques ».' },
]

/* ---------- exécution ---------- */
const paths = {
  doc: (col, id) => `/databases/${DB}/collections/${col}/documents/${id}`,
  docs: (col) => `/databases/${DB}/collections/${col}/documents`,
}

async function create(col, id, data, permissions) {
  try {
    await api('POST', paths.docs(col), { documentId: id, data, permissions })
    console.log(`  ＋ ${col}/${id}`)
  } catch (e) {
    if (e instanceof RestError && e.status === 409) return console.log(`  · ${col}/${id} existe déjà`)
    console.error(`  ✖ ${col}/${id} : ${e.message}`)
    throw e
  }
}

async function remove(col, id) {
  try {
    await api('DELETE', paths.doc(col, id))
    console.log(`  − ${col}/${id}`)
  } catch (e) {
    if (e instanceof RestError && e.status === 404) return
    console.error(`  ✖ ${col}/${id} : ${e.message}`)
  }
}

async function clean() {
  console.log('Suppression des données de démonstration…')
  for (const o of offers) {
    const slots = await api('GET', `${paths.docs(C.availabilities)}?queries[]=${encodeURIComponent(JSON.stringify({ method: 'equal', attribute: 'offerId', values: [o.id] }))}&queries[]=${encodeURIComponent('{"method":"limit","values":[100]}')}`).catch(() => ({ documents: [] }))
    for (const s of slots.documents) await remove(C.availabilities, s.$id)
  }
  for (const a of articles) await remove(C.articles, a.id)
  for (const p of places) await remove(C.places, p[0])
  for (const o of offers) await remove(C.offers, o.id)
  for (const g of guides) await remove(C.guides, g.id)
  for (const s of sites) await remove(C.sites, s.id)
  await remove(C.agencies, AGENCY)
  await api('DELETE', `/teams/${TEAM}`).then(() => console.log(`  − équipe ${TEAM}`)).catch(() => undefined)
  console.log('Terminé.')
}

async function seed() {
  console.log('Insertion des données de démonstration…')

  // Équipe Appwrite de l'agence (les membres de cette équipe gèrent l'agence)
  const team = await getOrNull(`/teams/${TEAM}`)
  if (!team) {
    await api('POST', '/teams', { teamId: TEAM, name: 'Agence Démo', roles: ['owner', 'admin', 'staff', 'guide'] })
    console.log(`  ＋ équipe ${TEAM}`)
  }

  await create(C.agencies, AGENCY, {
    name: 'Agence Démo', slug: 'agence-demo', teamId: TEAM, description: `Agence de démonstration. ${DEMO_NOTE}`,
    city: 'Cotonou', primaryColor: '#008751', currency: 'XOF', commissionRate: 0, licenseStatus: 'active', isActive: true,
  }, publicRead.concat([`update("team:${TEAM}/owner")`, 'update("label:superadmin")', 'delete("label:superadmin")']))

  for (const s of sites) {
    await create(C.sites, s.id, {
      agencyId: AGENCY, name: s.name, slug: s.slug, tagline: s.tagline, summary: s.summary, description: s.description, history: s.history,
      department: s.department, city: s.city, latitude: s.lat, longitude: s.lng, geohash: geohash(s.lat, s.lng),
      categories: s.categories, vibes: s.vibes, environments: s.environments, climateFeel: s.climateFeel,
      activities: s.activities, highlights: s.highlights, bestMonths: s.bestMonths, avgVisitMinutes: s.minutes,
      difficulty: s.difficulty, budgetLevel: s.budget, entranceFee: s.fee, familyFriendly: s.family, accessibleMobility: false,
      practicalInfo: DEMO_NOTE, openingHours: 'Tous les jours, selon la visite', aiContext: `${s.summary} ${s.highlights.join('. ')}.`,
      gallery: [], ratingAvg: 0, ratingCount: 0, status: 'published', featured: s.featured, publishedAt: NOW,
    }, teamPerms)
  }

  for (const g of guides) {
    await create(C.guides, g.id, {
      agencyId: AGENCY, fullName: g.fullName, slug: g.slug, bio: g.bio, languages: g.languages, specialties: g.specialties,
      siteIds: g.siteIds, yearsExperience: g.years, certified: g.certified, baseCity: g.city, ratingAvg: 0, ratingCount: 0, status: 'active',
    }, teamPerms)
  }

  for (const o of offers) {
    await create(C.offers, o.id, {
      agencyId: AGENCY, siteId: o.siteId, guideId: o.guideId, title: o.title, description: DEMO_NOTE,
      pricingType: o.group ? 'per_group' : 'per_person', price: o.price, childPrice: o.childPrice, childMaxAge: 12, currency: 'XOF',
      durationMinutes: o.minutes, minParticipants: 1, maxParticipants: o.max, languages: ['fr', 'en'],
      includes: ['Guide', 'Eau'], excludes: ['Repas', 'Transport jusqu’au point de rendez-vous'],
      meetingPoint: o.meeting, meetingLat: o.lat, meetingLng: o.lng, bookingMode: o.mode, leadTimeHours: 12, closedWeekdays: [],
      paymentMode: 'on_site', instantConfirm: o.instant, cancellationPolicy: 'moderate', cancellationHours: 48, sortOrder: 0, isActive: true,
    }, teamPerms)
  }

  // Créneaux de l'offre Ganvié : 21 prochains jours, 9 h et 14 h, 8 places
  const ganvie = offers.find((o) => o.mode === 'slots')
  let slots = 0
  for (let d = 1; d <= 21; d += 1) {
    const day = new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10)
    for (const time of ['09:00', '14:00']) {
      try {
        await api('POST', paths.docs(C.availabilities), {
          documentId: `demo_slot_${day.replaceAll('-', '')}_${time.replace(':', '')}`,
          data: { offerId: ganvie.id, agencyId: AGENCY, dateKey: day, startTime: time, capacity: 8, booked: 0, status: 'open' },
          permissions: teamPerms,
        })
        slots += 1
      } catch (e) {
        if (!(e instanceof RestError && e.status === 409)) throw e
      }
    }
  }
  console.log(`  ＋ ${slots} créneau(x) pour « ${ganvie.title} »`)

  for (const [id, type, name, lat, lng, extra] of places) {
    await create(C.places, id, {
      type, name, city: name.includes('Ouidah') ? 'Ouidah' : 'Cotonou', department: name.includes('Ouidah') ? 'Atlantique' : 'Littoral',
      latitude: lat, longitude: lng, geohash: geohash(lat, lng), open24h: false, hasEmergency: false, acceptsCards: false,
      source: 'manual', isActive: true, ...extra,
    }, publicRead)
  }

  for (const a of articles) {
    await create(C.articles, a.id, {
      type: a.type, title: a.title, slug: a.slug, excerpt: a.excerpt, content: a.content, authorName: 'ASILLIA', language: 'fr',
      tags: [], relatedSiteIds: a.related, readingMinutes: a.minutes, status: 'published', publishedAt: NOW,
    }, publicRead)
  }

  /* ---------- Vous ajouter à l'équipe de l'agence de démo ---------- */
  if (OWNER_ID) {
    try {
      const user = await api('GET', `/users/${OWNER_ID}`)
      const labels = [...new Set([...(user.labels || []), 'agency'])]
      await api('PUT', `/users/${OWNER_ID}/labels`, { labels })
      console.log(`  ＋ label « agency » ajouté à ${user.email || OWNER_ID} (labels : ${labels.join(', ')})`)
      await api('POST', `/teams/${TEAM}/memberships`, { userId: OWNER_ID, roles: ['owner'] })
      console.log(`  ＋ ${user.email || OWNER_ID} est maintenant propriétaire de l’agence de démo`)
    } catch (e) {
      if (e instanceof RestError && e.status === 409) console.log('  · déjà membre de l’équipe')
      else console.error(`  ✖ ajout à l’équipe impossible (${e.message}). Faites-le à la main : console Appwrite > Auth > Teams > ${TEAM} > Add member (rôle owner), et ajoutez le label « agency » à votre utilisateur.`)
    }
  } else {
    console.log(`\n  Pour tester l'espace agence : relancez avec --owner-id=<votre ID utilisateur>, ou ajoutez-vous à l'équipe « ${TEAM} » dans la console (rôle owner) avec le label « agency ».`)
  }

  console.log('\nTerminé. Rappel : ces données sont fictives, supprimez-les avec « npm run seed:demo -- --clean ».')
}

try {
  await (CLEAN ? clean() : seed())
} catch (e) {
  console.error(`\n✖ Interrompu : ${e.message}`)
  process.exit(1)
}