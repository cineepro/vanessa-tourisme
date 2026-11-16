import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const getMatch = () => typeof window !== 'undefined' && window.matchMedia(query).matches
  const [matches, setMatches] = useState(getMatch)

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Ecran de telephone (moins de 768 px, comme `md` de Tailwind). */
export const useIsMobile = (): boolean => useMediaQuery('(max-width: 767px)')