import { useState } from 'react'
import Home from './components/Home.jsx'
import Drill from './components/Drill.jsx'

export default function App() {
  const [drill, setDrill] = useState(null) // { cls, topic } — topic null = mixed set

  return drill ? (
    <Drill cls={drill.cls} topic={drill.topic} onExit={() => setDrill(null)} />
  ) : (
    <Home onDrill={(cls, topic) => setDrill({ cls, topic })} />
  )
}
