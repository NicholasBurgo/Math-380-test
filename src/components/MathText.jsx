import katex from 'katex'

export default function MathText({ latex, display = false }) {
  const html = katex.renderToString(String(latex), {
    displayMode: display,
    throwOnError: false,
  })
  return <span className="math" dangerouslySetInnerHTML={{ __html: html }} />
}
