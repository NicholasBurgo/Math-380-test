import { useState } from 'react'
import Home from './components/Home.jsx'
import Drill from './components/Drill.jsx'

export default function App() {
  const [drill, setDrill] = useState(null) // { cls, topic, unit } - topic null = mixed set over the unit

  return drill ? (
    <Drill cls={drill.cls} topic={drill.topic} unit={drill.unit} onExit={() => setDrill(null)} />
  ) : (
    <Home onDrill={(cls, topic, unit) => setDrill({ cls, topic, unit })} />
  )
}
