// src/components/home/Hero.tsx — Vanessa Tourisme
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ROUTES, SLOGAN } from '@/config/constants'
import { useRequireAuth } from '@/hooks/useRequireAuth'

const IDEAS = [
  'Calme, au bord de l’eau',
  'Voir des animaux sauvages',
  'Histoire et vodun',
  'Une journée en famille',
] as const

/** Bandeau d'accueil : le touriste décrit son envie, Vanessa propose le site qui lui correspond. */
export function Hero() {
  const [wish, setWish] = useState('')
  const navigate = useNavigate()
  const requireAuth = useRequireAuth()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const text = wish.trim()
    const target = text
      ? `${ROUTES.chat}?mode=advisor&q=${encodeURIComponent(text)}`
      : `${ROUTES.chat}?mode=advisor`

    requireAuth({ redirectTo: target, onSuccess: () => navigate(target) })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white">
      {/* Décor : soleil et formes */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-400/90" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-primary-600/50" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-24 w-24 rounded-full bg-danger-600/80" aria-hidden="true" />

      <div className="container-page relative py-16 sm:py-24">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
          <Sparkles className="h-4 w-4 text-accent-300" aria-hidden="true" />
          L’assistante virtuelle béninoise
        </p>

        <h1 className="mt-5 max-w-3xl text-balance text-4xl font-extrabold leading-[1.1] sm:text-6xl">
          {SLOGAN}
        </h1>

        <p className="mt-5 max-w-xl text-lg text-primary-50">
          Dites ce que vous voulez vivre. Vanessa vous propose le site qui vous correspond, vous aide à
          réserver et reste à vos côtés jusqu’à la fin de votre séjour.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex max-w-2xl flex-col gap-3 rounded-[2rem] bg-white p-2 shadow-lift sm:flex-row sm:items-center sm:rounded-full"
        >
          <label htmlFor="hero-wish" className="sr-only">
            Ce que vous voulez vivre au Bénin
          </label>
          <input
            id="hero-wish"
            value={wish}
            onChange={(event) => setWish(event.target.value)}
            maxLength={300}
            placeholder="Ex : un endroit calme au bord de l’eau avec de la culture locale"
            className="h-12 flex-1 rounded-full bg-transparent px-5 text-base text-sable-900 placeholder:text-sable-400 focus:outline-none"
          />
          <Button type="submit" variant="accent" size="lg" rightIcon={<ArrowRight className="h-5 w-5" aria-hidden="true" />}>
            Demander à Vanessa
          </Button>
        </form>

        <div className="mt-4 flex max-w-2xl flex-wrap gap-2">
          {IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => setWish(idea)}
              className="rounded-full border border-white/30 px-3.5 py-1.5 text-sm text-white transition-colors hover:bg-white/15"
            >
              {idea}
            </button>
          ))}
        </div>

        <Link
          to={ROUTES.sites}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent-300 hover:underline"
        >
          Ou parcourez tous les sites
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="flag-stripe h-1.5" />
    </section>
  )
}