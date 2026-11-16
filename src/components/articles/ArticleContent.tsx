// src/components/articles/ArticleContent.tsx — Vanessa Tourisme
import { Fragment, type ReactNode } from 'react'

/**
 * Affiche le contenu d'un article écrit en Markdown simplifié :
 * titres (#, ##, ###), listes (- et 1.), citations (>), **gras**, *italique*.
 * Rien n'est injecté en HTML : le texte est toujours échappé.
 */
function renderInline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
        return <em key={index}>{part.slice(1, -1)}</em>
      }
      return <Fragment key={index}>{part}</Fragment>
    })
}

const BULLET = /^\s*[-•]\s+/
const NUMBERED = /^\s*\d+[.)]\s+/

export function ArticleContent({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, '\n').trim().split(/\n{2,}/)

  return (
    <div className="space-y-5 text-lg leading-relaxed text-sable-800">
      {blocks.map((block, index) => {
        const lines = block.split('\n')
        const first = lines[0]

        const heading = /^(#{1,3})\s+(.*)$/.exec(first)
        if (heading && lines.length === 1) {
          const level = heading[1].length
          const text = renderInline(heading[2])
          if (level === 1) return <h2 key={index} className="pt-4 text-3xl font-bold text-sable-900">{text}</h2>
          if (level === 2) return <h3 key={index} className="pt-3 text-2xl font-bold text-sable-900">{text}</h3>
          return <h4 key={index} className="pt-2 text-xl font-bold text-sable-900">{text}</h4>
        }

        if (lines.every((line) => BULLET.test(line))) {
          return (
            <ul key={index} className="list-disc space-y-1.5 pl-6">
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.replace(BULLET, ''))}</li>
              ))}
            </ul>
          )
        }

        if (lines.every((line) => NUMBERED.test(line))) {
          return (
            <ol key={index} className="list-decimal space-y-1.5 pl-6">
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.replace(NUMBERED, ''))}</li>
              ))}
            </ol>
          )
        }

        if (lines.every((line) => line.startsWith('>'))) {
          return (
            <blockquote key={index} className="border-l-4 border-accent-400 bg-accent-50 px-5 py-3 italic">
              {renderInline(lines.map((line) => line.replace(/^>\s?/, '')).join(' '))}
            </blockquote>
          )
        }

        return (
          <p key={index} className="whitespace-pre-line">
            {renderInline(block)}
          </p>
        )
      })}
    </div>
  )
}