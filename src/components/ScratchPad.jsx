import { useEffect, useRef } from 'react'

// Pencil scratch area. Clears itself whenever clearKey changes (new problem).
export default function ScratchPad({ clearKey }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)

  useEffect(() => {
    resetCanvas()
  }, [clearKey])

  function resetCanvas() {
    const c = canvasRef.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    c.width = c.clientWidth * dpr
    c.height = c.clientHeight * dpr
    const ctx = c.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#3d4a59'
  }

  function pos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function down(e) {
    e.preventDefault()
    canvasRef.current.setPointerCapture(e.pointerId)
    drawing.current = true
    const { x, y } = pos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function move(e) {
    if (!drawing.current) return
    const { x, y } = pos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function up() {
    drawing.current = false
  }

  return (
    <div className="scratch">
      <div className="scratch-bar">
        <span className="scratch-label">scratch work</span>
        <button className="btn ghost" type="button" onClick={resetCanvas}>
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="scratch-canvas"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      />
    </div>
  )
}
