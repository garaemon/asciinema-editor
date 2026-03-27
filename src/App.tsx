import { useState, useCallback, useMemo } from 'react'
import { useHistory } from './hooks/useHistory'
import { FileUpload } from './components/FileUpload'
import { Player } from './components/Player'
import { Timeline } from './components/Timeline'
import { SpeedControls } from './components/SpeedControls'
import { TrimControls } from './components/TrimControls'
import { EventList } from './components/EventList'
import { ExportPanel } from './components/ExportPanel'
import { FontSettings } from './components/FontSettings'
import { DEFAULT_FONT_CONFIG } from './types/fontConfig'
import type { FontConfig } from './types/fontConfig'
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
  fontConfig: FontConfig;
  onFontConfigChange: (config: FontConfig) => void;
}

function computeTotalDuration(data: AsciicastData): number {
  if (data.events.length === 0) {
    return 0;
  }
  return data.events[data.events.length - 1][0];
}

function EditingScreen({ data, castContent, onDataChange, onReset, hasChanges, fontConfig, onFontConfigChange }: EditingScreenProps) {
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
          <FontSettings fontConfig={fontConfig} onFontConfigChange={onFontConfigChange} />
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
            fontConfig={fontConfig}
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
        <div className="sidebar-panel" style={{ margin: '0 12px 12px' }}>
          <h3>Events</h3>
          <EventList data={data} onDataChange={onDataChange} />
        </div>
      </div>
    </div>
  )
}

interface AppState {
  data: AsciicastData;
  fontConfig: FontConfig;
}

function App() {
  const [screen, setScreen] = useState<AppScreen>('upload')
  const {
    current: appState,
    canUndo,
    canRedo,
    push: pushHistory,
    undo: undoHistory,
    redo: redoHistory,
    reset: resetHistory,
  } = useHistory<AppState | null>(null);
  // Stores the original data at file load time so trim operations can be reverted
  const [originalData, setOriginalData] = useState<AsciicastData | null>(null)

  const asciicastData = appState?.data ?? null;
  const fontConfig = appState?.fontConfig ?? DEFAULT_FONT_CONFIG;

  // Derive castContent from asciicastData so undo/redo automatically updates it
  const castContent = useMemo(() => {
    if (asciicastData) {
      return serializeAsciicast(asciicastData);
    }
    return '';
  }, [asciicastData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFileLoaded = (data: AsciicastData, _rawContent: string) => {
    resetHistory({ data, fontConfig: DEFAULT_FONT_CONFIG })
    setOriginalData(data)
    setScreen('editing')
  }

  const handleDataChange = (updatedData: AsciicastData) => {
    pushHistory({ data: updatedData, fontConfig })
  }

  const handleFontConfigChange = (config: FontConfig) => {
    if (appState) {
      pushHistory({ ...appState, fontConfig: config })
    }
  }

  const handleReset = () => {
    if (originalData) {
      pushHistory({ data: originalData, fontConfig })
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
            <button disabled={!canUndo} onClick={undoHistory}>
              Undo
            </button>
            <button disabled={!canRedo} onClick={redoHistory}>
              Redo
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
            hasChanges={appState?.data !== originalData}
            fontConfig={fontConfig}
            onFontConfigChange={handleFontConfigChange}
          />
        )}
        {screen === 'export' && asciicastData && (
          <div className="export-screen">
            <ExportPanel data={asciicastData} castContent={castContent} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
