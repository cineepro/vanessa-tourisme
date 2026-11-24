// scripts/lib/schema.mjs — Vanessa Tourisme
// Description COMPLÈTE de la base : collections, attributs, index, permissions et buckets.
// C'est la référence du projet : setup-appwrite.mjs la compare à votre console Appwrite.
import { idFrom } from './rest.mjs'

/* ------------------------------------------------------------
   Fabriques d'attributs
------------------------------------------------------------ */
const str = (key, size, o = {}) => ({ key, type: 'string', size, ...o })
const enm = (key, elements, o = {}) => ({ key, type: 'enum', elements, ...o })
const int = (key, o = {}) => ({ key, type: 'integer', ...o })
const flt = (key, o = {}) => ({ key, type: 'float', ...o })
const bool = (key, def, o = {}) => ({ key, type: 'boolean', default: def, ...o })
const dt = (key, o = {}) => ({ key, type: 'datetime', ...o })
const email = (key, o = {}) => ({ key, type: 'email', ...o })
const url = (key, o = {}) => ({ key, type: 'url', ...o })

const req = { required: true }
const arr = { array: true }

const idx = (key, attributes, type = 'key') => ({ key, type, attributes })
const unique = (key, attributes) => idx(key, attributes, 'unique')
const fulltext = (key, attributes) => idx(key, attributes, 'fulltext')

/* ------------------------------------------------------------
   Valeurs autorisées (identiques aux types TypeScript du site)
------------------------------------------------------------ */
const DEPARTMENTS = ['Alibori', 'Atacora', 'Atlantique', 'Borgou', 'Collines', 'Couffo', 'Donga', 'Littoral', 'Mono', 'Ouémé', 'Plateau', 'Zou']
const CURRENCIES = ['XOF', 'EUR', 'USD']
const SPOKEN = ['fr', 'en', 'fon', 'yoruba', 'goun', 'bariba', 'dendi', 'es', 'pt', 'de']
const PUBLISH = ['draft', 'published', 'archived']
const PAYMENT_MODES = ['on_site', 'deposit', 'online']
const PLACE_TYPES = ['hospital', 'clinic', 'pharmacy', 'restaurant', 'maquis', 'street_food', 'cinema', 'bar_club', 'hotel', 'market', 'supermarket', 'atm', 'bank', 'police', 'embassy', 'transport', 'fuel', 'leisure']

/* ------------------------------------------------------------
   Permissions (format Appwrite)
------------------------------------------------------------ */
const ANY_READ = 'read("any")'
const superadmin = ['create("label:superadmin")', 'update("label:superadmin")', 'delete("label:superadmin")']
const agencyCreate = ['create("label:agency")', 'create("label:superadmin")']

/* ------------------------------------------------------------
   Collections
------------------------------------------------------------ */
export const COLLECTIONS = [
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_AGENCIES', 'tour_agencies'),
    name: 'Tourisme : agences',
    documentSecurity: true,
    permissions: [ANY_READ, ...superadmin],
    attributes: [
      str('name', 128, req), str('slug', 64, req), str('teamId', 36, req), str('description', 2000),
      str('logoId', 36), str('coverId', 36), str('phone', 32), str('whatsapp', 32), email('email'), url('website'),
      str('address', 255), str('city', 100), str('primaryColor', 7, { default: '#008751' }),
      enm('currency', CURRENCIES, { default: 'XOF' }), flt('commissionRate', { min: 0, max: 100, default: 0 }),
      enm('licenseStatus', ['trial', 'active', 'suspended', 'expired'], { default: 'trial' }),
      dt('licenseStartsAt'), dt('licenseEndsAt'), bool('isActive', true),
    ],
    indexes: [unique('idx_slug', ['slug']), idx('idx_team', ['teamId']), idx('idx_active', ['isActive'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_PROFILES', 'tour_profiles'),
    name: 'Tourisme : profils voyageurs',
    documentSecurity: true,
    permissions: ['create("users")'],
    attributes: [
      str('userId', 36, req), str('nationality', 64), str('countryOfResidence', 64), str('phone', 32),
      enm('preferredLanguage', ['fr', 'en'], { default: 'fr' }), str('interests', 32, arr),
      enm('travelStyle', ['solo', 'couple', 'family', 'friends', 'business']),
      enm('budgetLevel', ['low', 'medium', 'high', 'luxury']),
      str('emergencyContactName', 100), str('emergencyContactPhone', 32), str('healthNotes', 500),
      bool('shareLocation', false), flt('lastLat'), flt('lastLng'), dt('lastLocationAt'),
      str('stayCity', 100), dt('stayStart'), dt('stayEnd'), bool('onboardingDone', false),
    ],
    indexes: [unique('idx_user', ['userId'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_SITES', 'tour_sites'),
    name: 'Tourisme : sites',
    documentSecurity: true,
    permissions: [ANY_READ, ...agencyCreate],
    attributes: [
      str('agencyId', 36), str('name', 160, req), str('slug', 160, req), str('tagline', 200),
      str('summary', 500, req), str('description', 20000, req), str('history', 10000),
      enm('department', DEPARTMENTS, req), str('city', 100, req), str('address', 255),
      flt('latitude', req), flt('longitude', req), str('geohash', 12, req),
      enm('categories', ['historique', 'culturel', 'vodun', 'nature', 'faune', 'lac_lagune', 'plage', 'ville', 'gastronomie', 'artisanat', 'aventure', 'detente'], { ...req, ...arr }),
      enm('vibes', ['calme', 'aventure', 'spirituel', 'romantique', 'familial', 'festif', 'authentique', 'educatif', 'sportif', 'contemplatif'], arr),
      enm('environments', ['eau', 'lagune', 'lac', 'riviere', 'foret', 'savane', 'montagne', 'plage', 'ville', 'village', 'marais'], arr),
      enm('climateFeel', ['chaud', 'tempere', 'frais', 'humide', 'sec']),
      str('activities', 64, arr), str('highlights', 200, arr),
      int('bestMonths', { min: 1, max: 12, array: true }), str('bestSeasonNote', 300),
      int('avgVisitMinutes', { min: 0 }), enm('difficulty', ['facile', 'modere', 'difficile'], { default: 'facile' }),
      enm('budgetLevel', ['gratuit', 'bas', 'moyen', 'eleve']), int('entranceFee', { min: 0, default: 0 }),
      bool('familyFriendly', false), bool('accessibleMobility', false),
      str('practicalInfo', 5000), str('openingHours', 500),
      str('coverId', 36), str('gallery', 36, arr), url('videoUrl'), str('aiContext', 8000),
      flt('ratingAvg', { default: 0 }), int('ratingCount', { default: 0 }),
      enm('status', PUBLISH, { default: 'draft' }), bool('featured', false), dt('publishedAt'),
    ],
    indexes: [
      unique('idx_slug', ['slug']), idx('idx_status_dept', ['status', 'department']),
      idx('idx_status_featured', ['status', 'featured']), idx('idx_geohash', ['geohash']),
      fulltext('ft_name', ['name']), fulltext('ft_summary', ['summary']),
      idx('idx_categories', ['categories']), idx('idx_agency', ['agencyId']),
    ],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_GUIDES', 'tour_guides'),
    name: 'Tourisme : guides',
    documentSecurity: true,
    permissions: [ANY_READ, ...agencyCreate],
    attributes: [
      str('agencyId', 36, req), str('userId', 36), str('fullName', 128, req), str('slug', 128, req), str('bio', 3000),
      str('photoId', 36), str('phone', 32), str('whatsapp', 32), email('email'),
      enm('languages', SPOKEN, { ...req, ...arr }), str('specialties', 64, arr), str('siteIds', 36, arr),
      int('yearsExperience', { min: 0 }), bool('certified', false), str('licenseNumber', 64), str('baseCity', 100),
      flt('ratingAvg', { default: 0 }), int('ratingCount', { default: 0 }),
      enm('status', ['pending', 'active', 'inactive'], { default: 'pending' }),
    ],
    indexes: [
      unique('idx_slug', ['slug']), idx('idx_agency', ['agencyId']), idx('idx_status', ['status']),
      idx('idx_sites', ['siteIds']), fulltext('ft_name', ['fullName']),
    ],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_OFFERS', 'tour_offers'),
    name: 'Tourisme : offres et tarifs',
    documentSecurity: true,
    permissions: [ANY_READ, ...agencyCreate],
    attributes: [
      str('agencyId', 36, req), str('siteId', 36, req), str('guideId', 36), str('title', 160, req), str('description', 3000),
      enm('pricingType', ['per_person', 'per_group'], { default: 'per_person' }), int('price', { ...req, min: 0 }),
      int('childPrice', { min: 0 }), int('childMaxAge', { min: 0, max: 17, default: 12 }),
      enm('currency', CURRENCIES, { default: 'XOF' }), int('durationMinutes', { min: 0 }),
      int('minParticipants', { min: 1, default: 1 }), int('maxParticipants', { min: 1, default: 10 }),
      enm('languages', SPOKEN, arr), str('includes', 200, arr), str('excludes', 200, arr),
      str('meetingPoint', 255), flt('meetingLat'), flt('meetingLng'),
      enm('bookingMode', ['any_date', 'slots'], { default: 'any_date' }), int('leadTimeHours', { min: 0, default: 24 }),
      int('closedWeekdays', { min: 0, max: 6, array: true }), enm('paymentMode', PAYMENT_MODES, { default: 'on_site' }),
      int('depositPercent', { min: 1, max: 100 }), bool('instantConfirm', false),
      enm('cancellationPolicy', ['flexible', 'moderate', 'strict'], { default: 'moderate' }),
      int('cancellationHours', { min: 0, default: 48 }), str('coverId', 36), int('sortOrder', { default: 0 }), bool('isActive', true),
    ],
    indexes: [idx('idx_site_active', ['siteId', 'isActive']), idx('idx_guide', ['guideId']), idx('idx_agency', ['agencyId']), idx('idx_price', ['price'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_AVAILABILITIES', 'tour_availabilities'),
    name: 'Tourisme : créneaux',
    documentSecurity: true,
    permissions: [ANY_READ, ...agencyCreate],
    attributes: [
      str('offerId', 36, req), str('agencyId', 36, req), str('dateKey', 10, req), str('startTime', 5, req),
      int('capacity', { ...req, min: 1 }), int('booked', { min: 0, default: 0 }), int('priceOverride', { min: 0 }),
      enm('status', ['open', 'full', 'closed'], { default: 'open' }),
    ],
    indexes: [unique('idx_offer_slot', ['offerId', 'dateKey', 'startTime']), idx('idx_agency_date', ['agencyId', 'dateKey'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_BOOKINGS', 'tour_bookings'),
    name: 'Tourisme : réservations',
    documentSecurity: true,
    permissions: [],
    attributes: [
      str('reference', 16, req), str('userId', 36, req), str('agencyId', 36, req), str('offerId', 36, req), str('siteId', 36, req),
      str('guideId', 36), str('availabilityId', 36), str('siteName', 160), str('guideName', 160), str('offerTitle', 160),
      dt('visitDate', req), str('startTime', 5), int('adults', { ...req, min: 1 }), int('children', { min: 0, default: 0 }),
      int('unitPrice', { ...req, min: 0 }), int('childUnitPrice', { min: 0 }), int('totalAmount', { ...req, min: 0 }),
      enm('currency', CURRENCIES, { default: 'XOF' }),
      enm('status', ['pending', 'confirmed', 'rejected', 'cancelled_by_user', 'cancelled_by_agency', 'completed', 'no_show'], { default: 'pending' }),
      enm('paymentStatus', ['unpaid', 'deposit_paid', 'paid', 'refunded', 'partially_refunded'], { default: 'unpaid' }),
      enm('paymentMode', PAYMENT_MODES), str('contactName', 128, req), str('contactPhone', 32, req), email('contactEmail'),
      str('nationality', 64), str('pickupLocation', 255), str('specialRequests', 1000),
      enm('source', ['site', 'vanessa_chat', 'agency_manual'], { default: 'site' }), str('qrToken', 64),
      dt('confirmedAt'), dt('cancelledAt'), dt('completedAt'), str('cancelReason', 500), bool('reviewed', false),
    ],
    indexes: [
      unique('idx_reference', ['reference']), idx('idx_user_status', ['userId', 'status']),
      idx('idx_agency_status_date', ['agencyId', 'status', 'visitDate']), idx('idx_guide_date', ['guideId', 'visitDate']),
      idx('idx_visit_date', ['visitDate']),
    ],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_PAYMENTS', 'tour_payments'),
    name: 'Tourisme : paiements',
    documentSecurity: true,
    permissions: [],
    attributes: [
      str('bookingId', 36, req), str('userId', 36, req), str('agencyId', 36, req),
      enm('provider', ['fedapay', 'kkiapay', 'cinetpay', 'cash', 'manual'], req),
      enm('method', ['mtn_momo', 'moov_money', 'celtiis_cash', 'card', 'cash']),
      int('amount', { ...req, min: 0 }), enm('currency', CURRENCIES, { default: 'XOF' }),
      enm('status', ['pending', 'succeeded', 'failed', 'cancelled', 'refunded'], { default: 'pending' }),
      str('providerTransactionId', 128), str('providerRaw', 5000), dt('paidAt'), dt('refundedAt'),
    ],
    indexes: [idx('idx_booking', ['bookingId']), unique('idx_tx', ['providerTransactionId'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_REVIEWS', 'tour_reviews'),
    name: 'Tourisme : avis',
    documentSecurity: true,
    permissions: [],
    attributes: [
      str('userId', 36, req), str('bookingId', 36, req), str('siteId', 36, req), str('guideId', 36), str('agencyId', 36, req),
      int('ratingSite', { ...req, min: 1, max: 5 }), int('ratingGuide', { min: 1, max: 5 }), str('comment', 2000),
      str('photos', 36, arr), str('userDisplayName', 80, req), dt('visitedAt'),
      enm('status', ['pending', 'approved', 'rejected'], { default: 'pending' }), str('agencyReply', 1000), dt('agencyReplyAt'),
    ],
    indexes: [unique('idx_booking', ['bookingId']), idx('idx_site_status', ['siteId', 'status']), idx('idx_guide_status', ['guideId', 'status']), idx('idx_agency_status', ['agencyId', 'status'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_FAVORITES', 'tour_favorites'),
    name: 'Tourisme : favoris',
    documentSecurity: true,
    permissions: ['create("users")'],
    attributes: [str('userId', 36, req), enm('targetType', ['site', 'guide', 'offer'], req), str('targetId', 36, req)],
    indexes: [unique('idx_fav', ['userId', 'targetType', 'targetId'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_CONVERSATIONS', 'tour_conversations'),
    name: 'Tourisme : discussions avec Vanessa',
    documentSecurity: true,
    permissions: [],
    attributes: [
      str('userId', 36, req), str('title', 120), enm('mode', ['general', 'advisor', 'culture', 'companion'], { default: 'general' }),
      str('siteContextId', 36), str('bookingContextId', 36), str('vanessaConversationId', 64),
      enm('language', ['fr', 'en'], { default: 'fr' }), dt('lastMessageAt'), str('lastMessagePreview', 200),
      int('messageCount', { min: 0, default: 0 }), bool('isArchived', false),
    ],
    indexes: [idx('idx_user_last', ['userId', 'lastMessageAt'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_MESSAGES', 'tour_messages'),
    name: 'Tourisme : messages',
    documentSecurity: true,
    permissions: [],
    attributes: [
      str('conversationId', 36, req), str('userId', 36, req), enm('role', ['user', 'assistant', 'system'], req),
      str('content', 10000, req), str('suggestedSiteIds', 36, arr), str('suggestedPlaceIds', 36, arr), str('metadata', 5000),
      flt('lat'), flt('lng'), int('tokensIn', { min: 0 }), int('tokensOut', { min: 0 }), int('latencyMs', { min: 0 }),
      enm('feedback', ['none', 'up', 'down'], { default: 'none' }),
    ],
    indexes: [idx('idx_conversation', ['conversationId'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_PLACES', 'tour_places'),
    name: 'Tourisme : lieux utiles',
    documentSecurity: false,
    permissions: [ANY_READ, ...superadmin],
    attributes: [
      enm('type', PLACE_TYPES, req), str('name', 160, req), str('description', 1000), enm('department', DEPARTMENTS),
      str('city', 100, req), str('address', 255), flt('latitude', req), flt('longitude', req), str('geohash', 12, req),
      str('phone', 32), str('whatsapp', 32), url('website'), str('openingHours', 500), bool('open24h', false),
      bool('hasEmergency', false), enm('priceLevel', ['low', 'medium', 'high']), str('cuisine', 64, arr), str('specialDishes', 80, arr),
      bool('acceptsCards', false), enm('source', ['manual', 'osm', 'partner'], { default: 'manual' }), str('externalId', 64),
      dt('verifiedAt'), bool('isActive', true),
    ],
    indexes: [idx('idx_type_active', ['type', 'isActive']), idx('idx_geohash', ['geohash']), idx('idx_dept_city', ['department', 'city']), fulltext('ft_name', ['name'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_ARTICLES', 'tour_articles'),
    name: 'Tourisme : articles (culture, infos pratiques, FAQ)',
    documentSecurity: false,
    permissions: [ANY_READ, ...superadmin],
    attributes: [
      enm('type', ['culture', 'history', 'vodun', 'customs', 'practical', 'safety', 'food', 'faq', 'blog'], req),
      str('title', 200, req), str('slug', 200, req), str('excerpt', 400), str('content', 50000, req), str('coverId', 36),
      str('authorName', 100), enm('language', ['fr', 'en'], { default: 'fr' }), str('tags', 32, arr), str('relatedSiteIds', 36, arr),
      int('readingMinutes', { min: 0 }), enm('status', PUBLISH, { default: 'draft' }), dt('publishedAt'),
    ],
    indexes: [unique('idx_slug', ['slug']), idx('idx_type_status', ['type', 'status']), fulltext('ft_title', ['title']), fulltext('ft_excerpt', ['excerpt'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_NOTIFICATIONS', 'tour_notifications'),
    name: 'Tourisme : notifications',
    documentSecurity: true,
    permissions: [],
    attributes: [
      str('userId', 36, req),
      enm('type', ['booking_pending', 'booking_confirmed', 'booking_rejected', 'booking_cancelled', 'booking_reminder', 'payment', 'review_request', 'system'], req),
      str('title', 120, req), str('body', 500), str('link', 255), str('bookingId', 36), bool('isRead', false), dt('readAt'),
    ],
    indexes: [idx('idx_user_read', ['userId', 'isRead'])],
  },
  {
    id: idFrom('VITE_APPWRITE_COLLECTION_TOUR_CHAT_USAGE', 'tour_chat_usage'),
    name: 'Tourisme : quota de discussion',
    documentSecurity: false,
    permissions: [],
    attributes: [str('userId', 36, req), str('dayKey', 10, req), int('count', { min: 0, default: 0 }), int('tokens', { min: 0, default: 0 })],
    indexes: [unique('idx_user_day', ['userId', 'dayKey'])],
  },
]

/* ------------------------------------------------------------
   Buckets (stockage de fichiers)
------------------------------------------------------------ */
const IMAGES = ['jpg', 'jpeg', 'png', 'webp', 'avif']
const MB = 1024 * 1024

export const BUCKETS = [
  { id: idFrom('VITE_APPWRITE_BUCKET_TOUR_SITES', 'tour_sites_media'), name: 'Tourisme : photos des sites', permissions: [ANY_READ, ...agencyCreate], max: 5 * MB },
  { id: idFrom('VITE_APPWRITE_BUCKET_TOUR_GUIDES', 'tour_guides_media'), name: 'Tourisme : photos des guides', permissions: [ANY_READ, ...agencyCreate], max: 3 * MB },
  { id: idFrom('VITE_APPWRITE_BUCKET_TOUR_ARTICLES', 'tour_articles_media'), name: 'Tourisme : photos des articles', permissions: [ANY_READ, 'create("label:superadmin")'], max: 5 * MB },
  { id: idFrom('VITE_APPWRITE_BUCKET_TOUR_AGENCIES', 'tour_agency_assets'), name: 'Tourisme : logos et bannières', permissions: [ANY_READ, ...agencyCreate], max: 2 * MB },
  { id: idFrom('VITE_APPWRITE_BUCKET_TOUR_REVIEWS', 'tour_review_photos'), name: 'Tourisme : photos des avis', permissions: [ANY_READ, 'create("users")'], max: 5 * MB },
].map((bucket) => ({ ...bucket, fileSecurity: false, extensions: IMAGES }))