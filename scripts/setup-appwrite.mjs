// scripts/setup-appwrite.mjs — Vanessa Tourisme
//
// Compare votre base Appwrite au schéma du projet (scripts/lib/schema.mjs) et, sur demande,
// crée ce qui manque. Sans option, il ne MODIFIE RIEN : il affiche seulement un rapport.
//
//   npm run setup:appwrite                        rapport (aucune modification)
//   npm run setup:appwrite -- --apply             crée les collections, attributs, index et buckets manquants
//   npm run setup:appwrite -- --apply --fix-permissions
//                                                 aligne aussi les permissions des collections et buckets existants
//   npm run setup:appwrite -- --only=tour_sites   limite à une collection ou un bucket
//
// Nécessite dans .env : VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID, VITE_APPWRITE_DATABASE_ID, APPWRITE_API_KEY
// (clé API avec les scopes : databases.read/write, collections.read/write, attributes.read/write,
//  indexes.read/write, buckets.read/write)
import { BUCKETS, COLLECTIONS } from './lib/schema.mjs'
import { DB, RestError, api, getOrNull, requireEnv, sleep } from './lib/rest.mjs'

requireEnv()

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const FIX_PERMS = args.includes('--fix-permissions')
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').replace('--only=', '')

const stats = { ok: 0, missing: 0, created: 0, warnings: 0, errors: 0 }
const log = {
  ok: (m) => { stats.ok += 1; console.log(`  ✔ ${m}`) },
  missing: (m) => { stats.missing += 1; console.log(`  ✖ MANQUE  ${m}`) },
  created: (m) => { stats.created += 1; console.log(`  ＋ créé   ${m}`) },
  warn: (m) => { stats.warnings += 1; console.log(`  ⚠ ${m}`) },
  error: (m) => { stats.errors += 1; console.log(`  ✖ ERREUR  ${m}`) },
}

const sameSet = (a = [], b = []) => a.length === b.length && [...a].every((x) => b.includes(x))
const permsOf = (resource) => (resource.$permissions || []).map((p) => p.replace(/\s+/g, ''))

/* ------------------------------------------------------------
   Attributs
------------------------------------------------------------ */
function attributeBody(a) {
  const base = { key: a.key, required: a.required === true }
  if (a.array) base.array = true
  if (!base.required && a.default !== undefined && !a.array) base.default = a.default
  switch (a.type) {
    case 'string': return { type: 'string', body: { ...base, size: a.size } }
    case 'enum': return { type: 'enum', body: { ...base, elements: a.elements } }
    case 'integer':
    case 'float': {
      const body = { ...base }
      if (a.min !== undefined) body.min = a.min
      if (a.max !== undefined) body.max = a.max
      return { type: a.type, body }
    }
    default: return { type: a.type, body: base }
  }
}

async function waitForAttributes(collectionId, keys) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const { attributes } = await api('GET', `/databases/${DB}/collections/${collectionId}/attributes?queries[]=${encodeURIComponent('{"method":"limit","values":[200]}')}`)
    const pending = attributes.filter((a) => keys.includes(a.key) && a.status !== 'available')
    const failed = pending.filter((a) => a.status === 'failed')
    if (failed.length > 0) throw new Error(`attribut(s) en échec : ${failed.map((a) => a.key).join(', ')}`)
    if (pending.length === 0) return
    await sleep(2000)
  }
  throw new Error('délai dépassé en attendant la création des attributs')
}

/* ------------------------------------------------------------
   Collections
------------------------------------------------------------ */
async function syncCollection(def) {
  console.log(`\n▸ ${def.id}  (${def.name})`)
  const base = `/databases/${DB}/collections/${def.id}`

  let collection = await getOrNull(base)
  if (!collection) {
    if (!APPLY) {
      log.missing(`collection « ${def.id} » (sera créée avec --apply)`)
      return
    }
    collection = await api('POST', `/databases/${DB}/collections`, {
      collectionId: def.id,
      name: def.name,
      permissions: def.permissions,
      documentSecurity: def.documentSecurity,
    })
    log.created(`collection ${def.id}`)
  } else {
    log.ok('collection présente')

    // Permissions : comparaison avec le schéma
    const expected = def.permissions.map((p) => p.replace(/\s+/g, ''))
    const samePerms = sameSet(permsOf(collection), expected)
    const sameSecurity = collection.documentSecurity === def.documentSecurity
    if (samePerms && sameSecurity) {
      log.ok('permissions conformes')
    } else if (APPLY && FIX_PERMS) {
      await api('PUT', base, { name: collection.name, permissions: def.permissions, documentSecurity: def.documentSecurity, enabled: collection.enabled })
      log.created(`permissions alignées (documentSecurity=${def.documentSecurity})`)
    } else {
      log.warn(`permissions différentes. Attendu : [${def.permissions.join(', ') || 'aucune'}], sécurité documents : ${def.documentSecurity}. Actuel : [${(collection.$permissions || []).join(', ') || 'aucune'}], sécurité documents : ${collection.documentSecurity}. (--apply --fix-permissions pour corriger)`)
    }
  }

  /* ---- attributs ---- */
  const existing = new Map()
  try {
    const list = await api('GET', `${base}/attributes?queries[]=${encodeURIComponent('{"method":"limit","values":[200]}')}`)
    list.attributes.forEach((a) => existing.set(a.key, a))
  } catch (e) {
    if (!(e instanceof RestError) || e.status !== 404) throw e
  }

  const newKeys = []
  for (const a of def.attributes) {
    const found = existing.get(a.key)
    if (found) {
      if (found.type !== a.type) log.warn(`${a.key} : type « ${found.type} » dans la console, « ${a.type} » attendu`)
      else if (a.type === 'string' && found.size < a.size) log.warn(`${a.key} : taille ${found.size} dans la console, ${a.size} attendu`)
      else if (a.type === 'enum' && !a.elements.every((v) => (found.elements || []).includes(v))) log.warn(`${a.key} : valeurs d'énumération incomplètes dans la console (attendu : ${a.elements.join(', ')})`)
      else if (Boolean(found.array) !== Boolean(a.array)) log.warn(`${a.key} : ${a.array ? 'doit être un tableau' : 'ne doit pas être un tableau'}`)
      else if (Boolean(found.required) !== Boolean(a.required)) log.warn(`${a.key} : « obligatoire » = ${found.required}, attendu ${Boolean(a.required)}`)
      else stats.ok += 1
      continue
    }
    if (!APPLY) {
      log.missing(`attribut ${def.id}.${a.key} (${a.type})`)
      continue
    }
    try {
      const { type, body } = attributeBody(a)
      await api('POST', `${base}/attributes/${type}`, body)
      newKeys.push(a.key)
      log.created(`attribut ${a.key}`)
    } catch (e) {
      log.error(`attribut ${a.key} : ${e.message}`)
    }
  }
  if (newKeys.length > 0) {
    process.stdout.write('  … attente de la disponibilité des attributs')
    await waitForAttributes(def.id, newKeys)
    console.log(' OK')
  }
  if (newKeys.length === 0 && def.attributes.every((a) => existing.has(a.key))) {
    console.log(`  ✔ ${def.attributes.length} attributs présents`)
  }

  /* ---- index ---- */
  let existingIndexes = []
  try {
    existingIndexes = (await api('GET', `${base}/indexes`)).indexes
  } catch (e) {
    if (!(e instanceof RestError) || e.status !== 404) throw e
  }
  const presentAttrs = new Set([...existing.keys(), ...newKeys])

  for (const ix of def.indexes) {
    // On cherche un index équivalent même s'il porte un autre nom
    const same = existingIndexes.find((e) => e.type === ix.type && sameSet(e.attributes, ix.attributes) && e.attributes.join() === ix.attributes.join())
    if (same) {
      stats.ok += 1
      continue
    }
    if (!APPLY) {
      log.missing(`index ${ix.key} (${ix.type} sur ${ix.attributes.join(' + ')})`)
      continue
    }
    if (!ix.attributes.every((k) => presentAttrs.has(k))) {
      log.error(`index ${ix.key} : attribut(s) absent(s)`)
      continue
    }
    try {
      await api('POST', `${base}/indexes`, { key: ix.key, type: ix.type, attributes: ix.attributes, orders: ix.attributes.map(() => 'ASC') })
      log.created(`index ${ix.key} (${ix.attributes.join(' + ')})`)
    } catch (e) {
      log.error(`index ${ix.key} : ${e.message}`)
    }
  }
}

/* ------------------------------------------------------------
   Buckets
------------------------------------------------------------ */
async function syncBucket(def) {
  console.log(`\n▸ bucket ${def.id}  (${def.name})`)
  const bucket = await getOrNull(`/storage/buckets/${def.id}`)
  const body = {
    name: def.name,
    permissions: def.permissions,
    fileSecurity: def.fileSecurity,
    enabled: true,
    maximumFileSize: def.max,
    allowedFileExtensions: def.extensions,
    compression: 'gzip',
    encryption: true,
    antivirus: true,
  }

  if (!bucket) {
    if (!APPLY) return log.missing(`bucket « ${def.id} » (sera créé avec --apply)`)
    await api('POST', '/storage/buckets', { bucketId: def.id, ...body })
    return log.created(`bucket ${def.id}`)
  }

  log.ok('bucket présent')
  const expected = def.permissions.map((p) => p.replace(/\s+/g, ''))
  if (sameSet(permsOf(bucket), expected) && bucket.fileSecurity === def.fileSecurity) {
    log.ok('permissions conformes')
  } else if (APPLY && FIX_PERMS) {
    await api('PUT', `/storage/buckets/${def.id}`, { ...body, enabled: bucket.enabled })
    log.created('permissions alignées')
  } else {
    log.warn(`permissions différentes. Attendu : [${def.permissions.join(', ')}]. Actuel : [${(bucket.$permissions || []).join(', ') || 'aucune'}]. (--apply --fix-permissions pour corriger)`)
  }
  if (bucket.maximumFileSize < def.max) log.warn(`taille maximale ${bucket.maximumFileSize} octets, ${def.max} attendus`)
}

/* ------------------------------------------------------------
   Exécution
------------------------------------------------------------ */
console.log(`Base Appwrite : ${DB}`)
console.log(APPLY ? 'Mode : APPLICATION (création de ce qui manque)' : 'Mode : RAPPORT (aucune modification, ajoutez --apply pour créer)')

try {
  await api('GET', `/databases/${DB}`)
} catch (e) {
  console.error(`\n✖ Base introuvable ou clé API insuffisante : ${e.message}\n`)
  process.exit(1)
}

for (const def of COLLECTIONS) {
  if (ONLY && def.id !== ONLY) continue
  try {
    await syncCollection(def)
  } catch (e) {
    log.error(`${def.id} : ${e.message}`)
  }
}
for (const def of BUCKETS) {
  if (ONLY && def.id !== ONLY) continue
  try {
    await syncBucket(def)
  } catch (e) {
    log.error(`${def.id} : ${e.message}`)
  }
}

console.log('\n──────────── Résumé ────────────')
console.log(`  conformes : ${stats.ok}   manquants : ${stats.missing}   créés : ${stats.created}   avertissements : ${stats.warnings}   erreurs : ${stats.errors}`)
if (!APPLY && stats.missing > 0) console.log('\n  → Relancez avec --apply pour créer ce qui manque.')
process.exit(stats.errors > 0 ? 1 : 0)