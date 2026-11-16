// src/pages/public/AboutPage.tsx — Vanessa Tourisme
import { Link } from 'react-router-dom'
import { Building2, Globe2, HeartHandshake, Sparkles } from 'lucide-react'

import { buttonClasses } from '@/components/ui/Button'
import { ROUTES, SLOGAN } from '@/config/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const VALUES = [
  {
    icon: Sparkles,
    title: 'Un choix éclairé',
    text: 'Le touriste ne choisit plus un site au hasard : il dit ce qu’il veut vivre, et Vanessa lui propose l’expérience qui lui correspond.',
  },
  {
    icon: Globe2,
    title: 'Une connaissance du terrain',
    text: 'Entraînée sur les réalités du Bénin (histoire, religions, cuisine, habitudes), Vanessa répond comme quelqu’un qui connaît le pays, pas avec des informations génériques.',
  },
  {
    icon: HeartHandshake,
    title: 'Un accompagnement de bout en bout',
    text: 'De la réservation à la fin du séjour : santé, restauration, loisirs, conseils pratiques, une réponse immédiate à toute heure.',
  },
]

export default function AboutPage() {
  useDocumentTitle('À propos')

  return (
    <div className="container-page max-w-4xl space-y-14 py-10 sm:py-16">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-700">À propos</p>
        <h1 className="mt-2 text-3xl font-extrabold text-sable-900 sm:text-5xl">{SLOGAN}</h1>
        <p className="mt-5 text-lg text-sable-700">
          Vanessa Tourisme est une plateforme de découverte et de réservation des sites touristiques du Bénin,
          dotée d’une assistante virtuelle intégrée. Elle conseille le touriste avant son choix, répond à ses
          questions sur la culture béninoise et l’accompagne pendant tout son séjour.
        </p>
      </header>

      <section aria-labelledby="who-title">
        <h2 id="who-title" className="text-2xl font-bold text-sable-900">
          Qui est Vanessa ?
        </h2>
        <p className="mt-3 text-sable-700">
          Vanessa est une assistante virtuelle à la personnalité africaine, conçue par ASILLIA à Cotonou. Elle
          s’exprime dans un registre chaleureux et proche des gens, et adapte son ton à son interlocuteur. Elle
          a été pensée pour assister chaque Béninois au quotidien ; Vanessa Tourisme met ces mêmes connaissances
          locales au service du voyage.
        </p>
      </section>

      <section aria-labelledby="values-title">
        <h2 id="values-title" className="sr-only">
          Nos engagements
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {VALUES.map((value) => {
            const Icon = value.icon
            return (
              <li key={value.title} className="rounded-3xl border border-sable-200 bg-white p-6 shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-sable-900">{value.title}</h3>
                <p className="mt-2 text-sm text-sable-600">{value.text}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="agencies-title" className="rounded-3xl bg-sable-900 p-8 text-white">
        <Building2 className="h-8 w-8 text-accent-300" aria-hidden="true" />
        <h2 id="agencies-title" className="mt-4 text-2xl font-bold">
          Vous êtes une agence de tourisme ?
        </h2>
        <p className="mt-3 text-sable-200">
          ASILLIA conçoit et met en place la plateforme Vanessa Tourisme sous le nom de votre agence, puis vous
          concède une licence d’exploitation. Vous renseignez vos sites, vos guides, vos tarifs et vos offres ;
          Vanessa prend en charge une grande partie des demandes d’assistance qui mobilisent habituellement vos
          équipes, 24 h sur 24.
        </p>
        <p className="mt-3 text-sable-300">
          Moins de dépenses, plus de clients, une image moderne et distinctive : parlons-en ensemble.
        </p>
        <Link to={ROUTES.agency} className={buttonClasses({ variant: 'accent', className: 'mt-6' })}>
          Accéder à l’espace agence
        </Link>
      </section>
    </div>
  )
}