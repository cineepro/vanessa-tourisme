// src/components/home/HowItWorks.tsx — Vanessa Tourisme
import { CalendarCheck, Compass, LifeBuoy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Step {
  icon: LucideIcon
  title: string
  text: string
}

const STEPS: Step[] = [
  {
    icon: Compass,
    title: '1. Choisissez le bon site',
    text: 'Décrivez l’ambiance, le cadre, ce que vous voulez ressentir. Vanessa croise vos envies avec chaque site et vous recommande celui qui correspond.',
  },
  {
    icon: CalendarCheck,
    title: '2. Réservez en ligne',
    text: 'Choisissez votre site, votre guide et votre date, tarifs affichés clairement. Votre billet avec QR code arrive tout de suite.',
  },
  {
    icon: LifeBuoy,
    title: '3. Soyez accompagné',
    text: 'Histoire, vodun, coutumes avant de partir. Une fois sur place : pharmacie, restaurant, sortie, bons réflexes. Une réponse à toute heure.',
  },
]

export function HowItWorks() {
  return (
    <section className="section" aria-labelledby="how-title">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="how-title" className="text-3xl font-bold text-sable-900 sm:text-4xl">
            Du choix au retour, Vanessa est là
          </h2>
          <p className="mt-3 text-sable-600">
            Un touriste qui connaît mal le Bénin a besoin de repères. Vanessa les apporte à chaque étape.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <li key={step.title} className="rounded-3xl border border-sable-200 bg-white p-6 shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-bold text-sable-900">{step.title}</h3>
                <p className="mt-2 text-sable-600">{step.text}</p>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}