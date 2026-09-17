import MathText from './MathText.jsx'

const LETTERS = 'abcdefgh'

// Lettered answer options under a problem. An option is plain text or
// { latex } for a rendered formula. The answer is the letter.
export default function Options({ options }) {
  if (!options?.length) return null
  return (
    <ol className="options">
      {options.map((o, i) => (
        <li key={i}>
          <span className="opt-key">({LETTERS[i]})</span>
          <span className="opt-body">
            {typeof o === 'string' ? o : <MathText latex={o.latex} />}
          </span>
        </li>
      ))}
    </ol>
  )
}
