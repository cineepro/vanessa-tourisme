// src/App.tsx — Vanessa Tourisme
import { APP_NAME, SLOGAN } from '@/config/constants'
import { missingEnv } from '@/config/env'
import { AppRouter } from '@/router'

/** Affiché uniquement si le fichier .env est incomplet. */
function ConfigError() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flag-stripe h-1.5" />
      <section className="container-page flex flex-1 flex-col items-center justify-center py-16 text-center">
        <h1 className="text-4xl font-bold text-sable-900">{APP_NAME}</h1>
        <p className="mt-3 text-sable-600">{SLOGAN}</p>

        <div className="mt-10 w-full max-w-md rounded-2xl bg-white p-5 text-left shadow-card">
          <h2 className="text-base font-semibold text-danger-700">Configuration incomplète</h2>
          <p className="mt-2 text-sm text-sable-700">
            Ajoutez ces variables dans votre fichier .env (ou dans Netlify), puis relancez :
          </p>
          <ul className="mt-3 list-disc pl-5 font-mono text-xs text-sable-800">
            {missingEnv.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  )
}

export default function App() {
  if (missingEnv.length > 0) return <ConfigError />
  return <AppRouter />
}