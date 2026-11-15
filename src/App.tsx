import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { APP_NAME, SLOGAN } from '@/config/constants'
import { missingEnv } from '@/config/env'

/**
 * TEMPORAIRE : page d'accueil de verification.
 * Sera remplacee par <AppRouter /> (src/router) au bloc suivant.
 */
function Welcome() {
  const configOk = missingEnv.length === 0

  return (
    <main className="flex min-h-screen flex-col">
      <div className="flag-stripe h-1.5" />

      <section className="container-page flex flex-1 animate-fade-up flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-700">
          ASILLIA
        </p>
        <h1 className="mt-3 text-5xl font-bold text-sable-900 sm:text-6xl">
          {APP_NAME}
        </h1>
        <p className="mt-4 max-w-xl text-balance text-lg text-sable-700">
          {SLOGAN}
        </p>

        <div className="mt-10 w-full max-w-md rounded-2xl bg-white p-5 text-left shadow-card">
          <h2 className="text-base font-semibold text-sable-900">
            Vérification de la configuration
          </h2>

          {configOk ? (
            <p className="mt-2 text-sm text-primary-700">
              Les variables Appwrite sont bien renseignées.
            </p>
          ) : (
            <div className="mt-2 text-sm text-danger-700">
              <p>Variables manquantes dans votre fichier .env :</p>
              <ul className="mt-2 list-disc pl-5 font-mono text-xs">
                {missingEnv.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<Welcome />} />
      </Routes>
    </BrowserRouter>
  )
}