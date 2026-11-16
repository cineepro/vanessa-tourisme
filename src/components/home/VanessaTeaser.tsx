// src/components/home/VanessaTeaser.tsx — Vanessa Tourisme
import { useNavigate } from 'react-router-dom'
import { BookOpenText, MessageCircle, Navigation, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/config/constants'
import { useRequireAuth } from '@/hooks/useRequireAuth'

const MISSIONS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Sparkles,
    title: 'Elle vous aide à choisir',
    text: 'Plus de destination prise au hasard : le site qui colle à votre envie.',
  },
  {
    icon: BookOpenText,
    title: 'Elle vous fait connaître le terrain',
    text: 'Histoire, vodun, coutumes et bons réflexes pour visiter avec respect.',
  },
  {
    icon: Navigation,
    title: 'Elle vous accompagne sur place',
    text: 'Santé, restauration, loisirs près de vous, à toute heure.',
  },
]

/** Aperçu d'une conversation avec Vanessa (exemple illustratif) et accès au chat. */
export function VanessaTeaser() {
  const navigate = useNavigate()
  const requireAuth = useRequireAuth()

  const openChat = () =>
    requireAuth({ redirectTo: ROUTES.chat, onSuccess: () => navigate(ROUTES.chat) })

  return (
    <section className="section" aria-labelledby="teaser-title">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 id="teaser-title" className="text-3xl font-bold text-sable-900 sm:text-4xl">
            Une assistante qui parle comme chez nous
          </h2>
          <p className="mt-4 text-lg text-sable-600">
            Vanessa connaît le Bénin de l’intérieur : son histoire, ses religions, sa cuisine, ses
            habitudes. Elle ne répond pas avec des informations génériques, elle répond comme quelqu’un
            qui connaît le pays.
          </p>

          <ul className="mt-6 space-y-4">
            {MISSIONS.map((mission) => {
              const Icon = mission.icon
              return (
                <li key={mission.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-100 text-accent-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sable-900">{mission.title}</h3>
                    <p className="text-sm text-sable-600">{mission.text}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          <Button
            size="lg"
            className="mt-8"
            onClick={openChat}
            leftIcon={<MessageCircle className="h-5 w-5" aria-hidden="true" />}
          >
            Discuter avec Vanessa
          </Button>
        </div>

        <div
          className="rounded-[2rem] border border-sable-200 bg-white p-5 shadow-lift sm:p-6"
          aria-label="Exemple de conversation avec Vanessa"
        >
          <div className="space-y-4">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-3xl rounded-br-md bg-primary-600 px-4 py-3 text-[15px] text-white">
                Je cherche quelque chose de calme, au bord de l’eau, avec un peu de culture locale.
              </p>
            </div>

            <div className="flex gap-2.5">
              <span
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 font-display text-sm font-extrabold text-white"
                aria-hidden="true"
              >
                V
              </span>
              <p className="max-w-[85%] rounded-3xl rounded-bl-md border border-sable-200 bg-sable-50 px-4 py-3 text-[15px] text-sable-900">
                Ça tombe bien ! Dis-moi, tu préfères une balade en pirogue ou plutôt une plage
                tranquille ? Et tu as combien de jours ? Avec ça, je te propose les sites qui collent
                vraiment à ton envie.
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-sable-400">
            Exemple illustratif : le contenu réel dépend des sites et offres de l’agence.
          </p>
        </div>
      </div>
    </section>
  )
}