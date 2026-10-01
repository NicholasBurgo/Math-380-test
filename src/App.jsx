import { useState } from 'react'
import Home from './components/Home.jsx'
import Drill from './components/Drill.jsx'
import Learn from './components/Learn.jsx'
import PracticeTest from './components/PracticeTest.jsx'

export default function App() {
  const [screen, setScreen] = useState(null)

  if (!screen) {
    return (
      <Home
        onDrill={(cls, topic, unit) => setScreen({ kind: 'drill', cls, topic, unit })}
        onLearn={(cls, topic) => setScreen({ kind: 'learn', cls, topic })}
        onTest={(cls, unit) => setScreen({ kind: 'test', cls, unit })}
      />
    )
  }

  if (screen.kind === 'test') {
    return (
      <PracticeTest
        cls={screen.cls}
        unit={screen.unit}
        onExit={() => setScreen(null)}
        onDrill={(cls, topic, unit) => setScreen({ kind: 'drill', cls, topic, unit })}
      />
    )
  }

  if (screen.kind === 'learn') {
    return (
      <Learn
        cls={screen.cls}
        topic={screen.topic}
        onExit={() => setScreen(null)}
        onDrill={() => setScreen({ kind: 'drill', cls: screen.cls, topic: screen.topic, unit: null })}
      />
    )
  }

  return (
    <Drill
      cls={screen.cls}
      topic={screen.topic}
      unit={screen.unit}
      onExit={() => setScreen(null)}
    />
  )
}
