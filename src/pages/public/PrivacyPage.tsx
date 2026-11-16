// src/pages/public/PrivacyPage.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'

import { LegalPage, LegalSection } from '@/components/layout/LegalPage'
import { ROUTES } from '@/config/constants'

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      updatedAt="novembre 2026"
      intro="ASILLIA (Cotonou, Bénin), éditeur de Vanessa Tourisme, est responsable du traitement de vos données personnelles. Voici ce que nous collectons, pourquoi, et comment vous gardez la main."
    >
      <LegalSection title="1. Données que nous collectons">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong>Votre compte</strong> : nom, adresse email, téléphone (facultatif). Ce compte est partagé
            avec Vanessa.
          </li>
          <li>
            <strong>Votre profil voyageur</strong> (facultatif) : nationalité, pays de résidence, langue,
            centres d’intérêt, style et budget de voyage, dates et ville du séjour, contact d’urgence.
          </li>
          <li>
            <strong>Notes de santé</strong> (facultatif) : allergies ou informations que vous choisissez de
            renseigner. Elles ne sont visibles que de vous.
          </li>
          <li>
            <strong>Vos réservations</strong> : prestation, date, participants, coordonnées de contact,
            demandes particulières, paiement.
          </li>
          <li>
            <strong>Vos conversations avec Vanessa</strong> : messages et réponses, pour vous les afficher et
            améliorer le service.
          </li>
          <li>
            <strong>Votre position</strong> : uniquement si vous activez le partage (voir plus bas).
          </li>
          <li>
            <strong>Avis</strong> : note, commentaire et photos que vous publiez.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Pourquoi nous les utilisons">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Gérer votre compte et sécuriser la connexion.</li>
          <li>Traiter vos réservations et les transmettre à l’agence concernée.</li>
          <li>Vous conseiller et vous accompagner grâce à Vanessa.</li>
          <li>Vous envoyer des confirmations et rappels liés à vos réservations.</li>
          <li>Modérer les avis, prévenir les abus et améliorer le service.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Votre position">
        <p>
          La géolocalisation n’est utilisée que si vous l’activez expressément, pour trouver des lieux proches
          de vous (pharmacie, restaurant, sortie). Vous pouvez la désactiver à tout moment dans votre profil :
          votre dernière position enregistrée est alors effacée. Sans cette autorisation, Vanessa vous répond
          quand même, sans lieux à proximité.
        </p>
      </LegalSection>

      <LegalSection title="4. Avec qui nous les partageons">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong>L’agence et le guide</strong> de votre réservation, pour les coordonnées et informations
            nécessaires à la visite.
          </li>
          <li>
            <strong>Nos prestataires techniques</strong> : hébergement et base de données (Appwrite), envoi
            d’emails, et le service d’assistance virtuelle Vanessa qui traite vos messages.
          </li>
          <li>Les autorités, si la loi l’exige.</li>
        </ul>
        <p>Nous ne vendons pas vos données.</p>
      </LegalSection>

      <LegalSection title="5. Combien de temps">
        <p>
          Nous conservons vos données tant que votre compte est actif, puis le temps nécessaire pour respecter
          nos obligations légales (par exemple liées aux réservations et paiements). Vous pouvez demander la
          suppression de votre compte.
        </p>
      </LegalSection>

      <LegalSection title="6. Vos droits">
        <p>
          Vous pouvez accéder à vos données, les corriger, demander leur suppression, vous opposer à certains
          traitements ou retirer un consentement (par exemple la position). Une partie de ces actions est
          possible directement depuis votre{' '}
          <Link to={ROUTES.profile} className="font-semibold text-primary-700 hover:underline">
            profil
          </Link>
          ; pour le reste, contactez-nous via ASILLIA. Vous pouvez aussi saisir l’autorité béninoise de
          protection des données personnelles.
        </p>
      </LegalSection>

      <LegalSection title="7. Stockage sur votre appareil">
        <p>
          Nous utilisons le stockage de votre navigateur pour maintenir votre session et conserver
          temporairement une réservation en cours de saisie. Nous n’utilisons pas de cookies publicitaires.
        </p>
      </LegalSection>

      <LegalSection title="8. Sécurité et mineurs">
        <p>
          Les échanges sont chiffrés et les accès à vos données sont restreints. Aucun système n’étant
          infaillible, choisissez un mot de passe robuste. Le service s’adresse aux personnes majeures ; un
          mineur ne doit pas créer de compte sans l’accord de son représentant légal.
        </p>
      </LegalSection>

      <LegalSection title="9. Modifications">
        <p>
          Cette politique peut évoluer ; la date de mise à jour figure en haut de la page. En cas de
          changement important, nous vous en informerons.
        </p>
      </LegalSection>
    </LegalPage>
  )
}