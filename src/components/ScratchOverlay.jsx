import { useEffect, useRef } from 'react'

// Full-page scratch layer. Pen (S Pen / Apple Pencil) and mouse draw anywhere;
// fingers keep scrolling and tapping as usual, which doubles as palm rejection.
// Interactive elements stay clickable for every pointer type.
export default function ScratchOverlay({ repKey, clearSignal, erase = false }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const eraseStroke = useRef(false)
  const eraseMode = useRef(erase)
  eraseMode.current = erase

  useEffect(() => {
    reset(false)
  }, [repKey, clearSignal])

  useEffect(() => {
    const onResize = () => reset(true)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // preserve = keep existing strokes (viewport resize, phone URL bar collapse)
  function reset(preserve) {
    const c = canvasRef.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    let snap = null
    if (preserve && c.width > 0 && c.height > 0) {
      snap = document.createElement('canvas')
      snap.width = c.width
      snap.height = c.height
      snap.getContext('2d').drawImage(c, 0, 0)
    }
    c.width = window.innerWidth * dpr
    c.height = window.innerHeight * dpr
    // CSS size must match the bitmap exactly; 100vh lies when the URL bar is
    // visible and would scale strokes away from the pen tip
    c.style.width = `${window.innerWidth}px`
    c.style.height = `${window.innerHeight}px`
    const ctx = c.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#3d4a59'
    if (snap) ctx.drawImage(snap, 0, 0, snap.width / dpr, snap.height / dpr)
  }

  useEffect(() => {
    function canDraw(e) {
      if (e.pointerType === 'touch') return false
      if (e.target instanceof Element && e.target.closest('button, input, a, select, textarea')) {
        return false
      }
      return true
    }

    function widthFor(e) {
      return e.pointerType === 'pen' && e.pressure > 0 ? 0.5 + e.pressure * 3 : 2
    }

    // barrel button = buttons bit 2 (or button 2), eraser tip = bit 32 (or button 5)
    function barrelHeld(e) {
      return (e.buttons & 34) !== 0 || e.button === 2 || e.button === 5
    }

    function down(e) {
      if (!canDraw(e)) return
      drawing.current = true
      // some browsers only report the barrel state reliably at pen-down, so
      // latch it for the whole stroke
      eraseStroke.current = barrelHeld(e)
      last.current = { x: e.clientX, y: e.clientY }
      e.preventDefault()
    }

    function move(e) {
      if (!drawing.current || e.pointerType === 'touch') return
      e.preventDefault()
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx || !last.current) return
      const erasing = eraseMode.current || eraseStroke.current || barrelHeld(e)
      ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over'
      ctx.lineWidth = erasing ? 26 : widthFor(e)
      ctx.beginPath()
      ctx.moveTo(last.current.x, last.current.y)
      ctx.lineTo(e.clientX, e.clientY)
      ctx.stroke()
      last.current = { x: e.clientX, y: e.clientY }
    }

    function up() {
      drawing.current = false
      eraseStroke.current = false
      last.current = null
    }

    function onContextMenu(e) {
      // barrel-button drags fire contextmenu; keep it quiet away from controls
      if (e.target instanceof Element && !e.target.closest('button, input, a, select, textarea')) {
        e.preventDefault()
      }
    }

    // Browsers start a scroll gesture from touch-action, not from pointer-event
    // preventDefault, and a stylus counts as touch for scrolling. Cancel the
    // compat touch events for the pen so it inks instead of panning; fingers
    // (drawing.current stays false for them) keep scrolling normally.
    function onTouchStart(e) {
      if (drawing.current) e.preventDefault()
    }

    function onTouchMove(e) {
      if (drawing.current) {
        e.preventDefault()
        return
      }
      // iOS reports Apple Pencil touches as touchType 'stylus'
      for (const t of e.touches) {
        if (t.touchType === 'stylus') {
          e.preventDefault()
          return
        }
      }
    }

    window.addEventListener('pointerdown', down, { passive: false })
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="scratch-overlay" aria-hidden="true" />
}
