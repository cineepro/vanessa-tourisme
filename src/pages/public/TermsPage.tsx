// src/pages/public/TermsPage.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'

import { LegalPage, LegalSection } from '@/components/layout/LegalPage'
import { ROUTES } from '@/config/constants'

export default function TermsPage() {
  return (
    <LegalPage
      title="Conditions d’utilisation"
      updatedAt="novembre 2026"
      intro="Ces conditions encadrent l’utilisation de Vanessa Tourisme, éditée par ASILLIA (Cotonou, Bénin). En créant un compte ou en réservant, vous les acceptez."
    >
      <LegalSection title="1. Le service">
        <p>
          Vanessa Tourisme permet de découvrir les sites touristiques du Bénin, de consulter les guides et
          leurs tarifs, de réserver des visites guidées et de dialoguer avec Vanessa, une assistante virtuelle.
          La consultation du site ne nécessite pas de compte ; discuter avec Vanessa, réserver et gérer ses
          favoris nécessitent de se connecter.
        </p>
      </LegalSection>

      <LegalSection title="2. Votre compte">
        <p>
          Votre compte est commun à Vanessa et à Vanessa Tourisme : les mêmes identifiants fonctionnent sur les
          deux plateformes. Votre adresse email doit être vérifiée avant l’activation du compte. Vous vous
          engagez à fournir des informations exactes et à garder votre mot de passe confidentiel.
        </p>
      </LegalSection>

      <LegalSection title="3. Réservations">
        <p>
          Les visites sont proposées et assurées par des agences de tourisme et des guides partenaires.
          ASILLIA fournit la plateforme et n’est pas le prestataire de la visite. Le prix, la durée, les
          conditions d’annulation et le mode de paiement sont affichés avant la confirmation de votre demande.
        </p>
        <p>
          Selon la prestation, la réservation est confirmée immédiatement ou après validation par l’agence.
          Vous êtes informé de son statut dans votre espace et par notification.
        </p>
      </LegalSection>

      <LegalSection title="4. Annulation">
        <p>
          Vous pouvez annuler une réservation depuis votre espace « Mes réservations ». Les conditions
          (délai d’annulation gratuit, remboursement éventuel) sont celles indiquées sur la prestation au
          moment de la réservation.
        </p>
      </LegalSection>

      <LegalSection title="5. Vanessa, l’assistante virtuelle">
        <p>
          Vanessa fournit des conseils et des informations à titre indicatif. Elle peut se tromper et ne
          remplace ni un professionnel de santé, ni un conseil juridique, ni les consignes des autorités.
          Vérifiez les informations importantes (horaires, tarifs, formalités) auprès de l’agence ou des
          sources officielles.
        </p>
        <p>
          <strong>En cas d’urgence, appelez directement les secours</strong> (SAMU 112, pompiers 118, police
          117) : ne comptez pas sur l’assistante virtuelle.
        </p>
      </LegalSection>

      <LegalSection title="6. Avis">
        <p>
          Seuls les voyageurs ayant effectué une visite peuvent publier un avis. Les avis sont modérés avant
          publication et doivent rester respectueux, sincères et fondés sur votre expérience. Nous pouvons
          refuser ou retirer un avis injurieux, mensonger ou hors sujet.
        </p>
      </LegalSection>

      <LegalSection title="7. Comportement attendu">
        <p>
          Vous vous engagez à ne pas détourner le service (usurpation d’identité, réservations fictives,
          tentative d’accès non autorisé, usage abusif de l’assistante). Un compte peut être suspendu en cas
          de manquement.
        </p>
      </LegalSection>

      <LegalSection title="8. Responsabilité">
        <p>
          ASILLIA s’efforce d’assurer la disponibilité et l’exactitude du service, sans pouvoir garantir
          l’absence d’interruption ou d’erreur. La responsabilité de la bonne exécution d’une visite incombe à
          l’agence et au guide concernés.
        </p>
      </LegalSection>

      <LegalSection title="9. Propriété intellectuelle">
        <p>
          Les contenus du site (textes, visuels, marque, logiciel) sont protégés. Les photos et textes publiés
          par les agences restent leur propriété. Vous conservez vos droits sur les contenus que vous publiez
          (avis, photos) et nous autorisez à les afficher sur la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="10. Données personnelles">
        <p>
          Le traitement de vos données est décrit dans notre{' '}
          <Link to={ROUTES.privacy} className="font-semibold text-primary-700 hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Évolution et droit applicable">
        <p>
          Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de cette page. Elles sont
          soumises au droit béninois. En cas de litige, une solution amiable est recherchée avant toute action
          devant les juridictions compétentes de Cotonou.
        </p>
      </LegalSection>
    </LegalPage>
  )
}