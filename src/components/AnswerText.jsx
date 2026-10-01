import MathText from './MathText.jsx'
import { answerDisplay, rightOption } from '../engine/display.js'

// The right answer after a miss. Lettered word options show as plain text so
// long ones wrap on a phone; everything else renders as math.
export default function AnswerText({ problem }) {
  const o = rightOption(problem)
  if (o?.text !== undefined) {
    return (
      <span className="answer-option">
        ({o.letter}) {o.text}
      </span>
    )
  }
  return <MathText latex={answerDisplay(problem)} />
}
