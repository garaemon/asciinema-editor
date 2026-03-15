import { useState, useCallback } from 'react'
import { FileUpload } from './components/FileUpload'
import { Player } from './components/Player'
import { Timeline } from './components/Timeline'
import { SpeedControls } from './components/SpeedControls'
import { TrimControls } from './components/TrimControls'
import { ExportPanel } from './components/ExportPanel'
import { serializeAsciicast } from './lib/serializer'
import type { AsciicastData } from './types/asciicast'
import type { Player as AsciinemaPlayerType } from 'asciinema-player'
import './App.css'

type AppScreen = 'upload' | 'editing' | 'export'

interface EditingScreenProps {
  // Parsed asciicast data containing the header and event list from the .cast file
  data: AsciicastData;
  // Raw text content of the uploaded .cast file, passed to the Player for playback
  castContent: string;
  // Callback to update the asciicast data after editing operations
  onDataChange: (data: AsciicastData) => void;
  onReset: () => void;
  hasChanges: boolean;
}

function computeTotalDuration(data: AsciicastData): number {
  if (data.events.length === 0) {
    return 0;
  }
  return data.events[data.events.length - 1][0];
}

function EditingScreen({ data, castContent, onDataChange, onReset, hasChanges }: EditingScreenProps) {
  const [playerInstance, setPlayerInstance] = useState<AsciinemaPlayerType | null>(null);

  const handlePlayerReady = useCallback((player: AsciinemaPlayerType) => {
    setPlayerInstance(player);
  }, []);

  const handlePlayerDispose = useCallback(() => {
    setPlayerInstance(null);
  }, []);

  return (
    <div className="editing-screen">
      <aside className="sidebar">
        <div className="sidebar-panel">
          <h3>Speed</h3>
          <SpeedControls data={data} onDataChange={onDataChange} />
        </div>
        <div className="sidebar-panel">
          <h3>Trim</h3>
          <TrimControls data={data} onDataChange={onDataChange} onReset={onReset} hasChanges={hasChanges} />
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
            onPlayerReady={handlePlayerReady}
            onPlayerDispose={handlePlayerDispose}
          />
        </div>
        <div className="timeline-area">
          <Timeline
            player={playerInstance}
            totalDuration={computeTotalDuration(data)}
          />
        </div>
      </div>
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState<AppScreen>('upload')
  const [asciicastData, setAsciicastData] = useState<AsciicastData | null>(null)
  // Stores the original data at file load time so trim operations can be reverted
  const [originalData, setOriginalData] = useState<AsciicastData | null>(null)
  const [castContent, setCastContent] = useState('')

  const handleFileLoaded = (data: AsciicastData, rawContent: string) => {
    setAsciicastData(data)
    setOriginalData(data)
    setCastContent(rawContent)
    setScreen('editing')
  }

  const handleDataChange = (updatedData: AsciicastData) => {
    setAsciicastData(updatedData)
    setCastContent(serializeAsciicast(updatedData))
  }

  const handleReset = () => {
    if (originalData) {
      setAsciicastData(originalData)
      setCastContent(serializeAsciicast(originalData))
    }
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
          <EditingScreen
            data={asciicastData}
            castContent={castContent}
            onDataChange={handleDataChange}
            onReset={handleReset}
            hasChanges={asciicastData !== originalData}
          />
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
