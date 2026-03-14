import { useState } from 'react'
import { FileUpload } from './components/FileUpload'
import { Player } from './components/Player'
import { ExportPanel } from './components/ExportPanel'
import type { AsciicastData } from './types/asciicast'
import './App.css'

type AppScreen = 'upload' | 'editing' | 'export'

interface EditingScreenProps {
  // Parsed asciicast data containing the header and event list from the .cast file
  data: AsciicastData
  // Raw text content of the uploaded .cast file, passed to the Player for playback
  castContent: string
}

function EditingScreen({ data, castContent }: EditingScreenProps) {
  return (
    <div className="editing-screen">
      <aside className="sidebar">
        <div className="sidebar-panel">
          <h3>Speed</h3>
          <p className="placeholder">Speed controls will appear here</p>
        </div>
        <div className="sidebar-panel">
          <h3>Trim</h3>
          <p className="placeholder">Trim controls will appear here</p>
        </div>
        <div className="sidebar-panel">
          <h3>Mask</h3>
          <p className="placeholder">Mask controls will appear here</p>
        </div>
        <div className="sidebar-panel">
          <h3>Font</h3>
          <p className="placeholder">Font settings will appear here</p>
        </div>
        <div className="sidebar-panel">
          <h3>Annotations</h3>
          <p className="placeholder">Annotation controls will appear here</p>
        </div>
      </aside>
      <div className="main-content">
        <div className="player-area">
          <Player
            castContent={castContent}
            width={data.header.width}
            height={data.header.height}
          />
        </div>
        <div className="timeline-area">
          <p className="placeholder">Timeline will appear here</p>
        </div>
      </div>
    </div>
  )
}

// Placeholder removed — ExportPanel component now handles export UI

function App() {
  const [screen, setScreen] = useState<AppScreen>('upload')
  const [asciicastData, setAsciicastData] = useState<AsciicastData | null>(null)
  const [castContent, setCastContent] = useState('')

  const handleFileLoaded = (data: AsciicastData, rawContent: string) => {
    setAsciicastData(data)
    setCastContent(rawContent)
    setScreen('editing')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>asciinema editor</h1>
        {screen !== 'upload' && (
          <nav className="app-nav">
            <button
              className={screen === 'editing' ? 'active' : ''}
              onClick={() => setScreen('editing')}
            >
              Edit
            </button>
            <button
              className={screen === 'export' ? 'active' : ''}
              onClick={() => setScreen('export')}
            >
              Export
            </button>
          </nav>
        )}
      </header>
      <main className="app-main">
        {screen === 'upload' && (
          <div className="upload-screen">
            <FileUpload onFileLoaded={handleFileLoaded} />
          </div>
        )}
        {screen === 'editing' && asciicastData && (
          <EditingScreen data={asciicastData} castContent={castContent} />
        )}
        {screen === 'export' && asciicastData && (
          <div className="export-screen">
            <ExportPanel data={asciicastData} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
