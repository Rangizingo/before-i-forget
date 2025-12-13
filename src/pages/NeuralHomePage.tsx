import { useEffect, useState } from 'react'
import { NeuralCanvas } from '@/components/neural/NeuralCanvas'
import { NeuralTaskList } from '@/components/neural/NeuralTaskList'
import { useNeuralNetwork } from '@/contexts/NeuralNetworkContext'
import { useNeuralTasks } from '@/hooks/useNeuralTasks'
import { useAuth } from '@/hooks/useAuth'

/**
 * NeuralHomePage - Main page combining neural visualization with task management
 * Features:
 * - Full-screen neural network visualization background
 * - Task list overlay on the right side
 * - Real-time sync between tasks and neurons
 * - Offline support with localStorage caching
 */
export function NeuralHomePage() {
  const { user, signOut } = useAuth()
  const { network, loading: networkLoading, error: networkError, saveState } = useNeuralNetwork()
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    addTask,
    toggleComplete,
    deleteTask,
    taskNeuronMap
  } = useNeuralTasks({
    network,
    enabled: true
  })

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showMetrics, setShowMetrics] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)

  // Update metrics periodically
  useEffect(() => {
    if (!network || !showMetrics) return

    const updateMetrics = () => {
      setMetrics(network.getMetrics())
    }

    // Initial update
    updateMetrics()

    // Update every 2 seconds
    const interval = setInterval(updateMetrics, 2000)

    return () => clearInterval(interval)
  }, [network, showMetrics])

  const handleAddTask = async (content: string) => {
    await addTask({ content })
  }

  const handleSignOut = async () => {
    // Save network state before signing out
    if (network) {
      await saveState()
    }
    await signOut()
  }

  const loading = networkLoading || tasksLoading
  const error = networkError || tasksError

  return (
    <div className="neural-home-page">
      {/* Neural Network Visualization Background */}
      <div className="neural-canvas-container">
        <NeuralCanvas className="w-full h-full" />
      </div>

      {/* Top Bar */}
      <header className="top-bar">
        <div className="logo-section">
          <h1 className="app-title">Before I Forget</h1>
          <p className="app-subtitle">Neural Task Memory</p>
        </div>

        <div className="user-section">
          {user && (
            <>
              <span className="user-email">{user.email}</span>
              <button onClick={handleSignOut} className="sign-out-btn">
                Sign Out
              </button>
            </>
          )}
        </div>
      </header>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`sidebar-toggle ${isSidebarOpen ? 'open' : 'closed'}`}
        title={isSidebarOpen ? 'Hide tasks' : 'Show tasks'}
      >
        {isSidebarOpen ? '→' : '←'}
      </button>

      {/* Task List Sidebar */}
      <aside className={`task-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <NeuralTaskList
          tasks={tasks}
          loading={loading}
          error={error}
          onAddTask={handleAddTask}
          onToggleComplete={toggleComplete}
          onDeleteTask={deleteTask}
          taskNeuronMap={taskNeuronMap}
        />
      </aside>

      {/* Bottom Controls */}
      <div className="bottom-controls">
        <button
          onClick={() => setShowMetrics(!showMetrics)}
          className="metrics-toggle"
          title="Toggle metrics"
        >
          {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
        </button>

        {showMetrics && metrics && (
          <div className="metrics-panel">
            <h3>Network Metrics</h3>
            <div className="metrics-grid">
              <div className="metric">
                <span className="metric-label">Total Neurons:</span>
                <span className="metric-value">{metrics.totalNeurons}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Active:</span>
                <span className="metric-value">{metrics.activeNeurons}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Completed:</span>
                <span className="metric-value">{metrics.completedNeurons}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Dormant:</span>
                <span className="metric-value">{metrics.dormantNeurons}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Connections:</span>
                <span className="metric-value">{metrics.totalConnections}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Avg Connections:</span>
                <span className="metric-value">{metrics.avgConnectionsPerNeuron.toFixed(2)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Clusters:</span>
                <span className="metric-value">{metrics.totalClusters}</span>
              </div>
            </div>
          </div>
        )}

        {/* Info overlay */}
        <div className="info-overlay">
          <p className="info-text">
            {loading
              ? 'Initializing neural network...'
              : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} in memory`}
          </p>
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>

      {/* Add inline styles for the page */}
      <style>{`
        .neural-home-page {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #0a0a1a;
        }

        .neural-canvas-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .top-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(10, 10, 26, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2rem;
          z-index: 10;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .app-title {
          color: #8b5cf6;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .app-subtitle {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.875rem;
          margin: 0;
        }

        .user-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-email {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
        }

        .sign-out-btn {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.4);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .sign-out-btn:hover {
          background: rgba(139, 92, 246, 0.3);
          border-color: rgba(139, 92, 246, 0.6);
        }

        .sidebar-toggle {
          position: absolute;
          top: 50%;
          right: 0;
          transform: translateY(-50%);
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.4);
          padding: 1rem 0.5rem;
          border-radius: 0.5rem 0 0 0.5rem;
          cursor: pointer;
          z-index: 15;
          transition: all 0.3s;
        }

        .sidebar-toggle.open {
          right: 400px;
        }

        .sidebar-toggle:hover {
          background: rgba(139, 92, 246, 0.3);
        }

        .task-sidebar {
          position: absolute;
          top: 64px;
          right: 0;
          width: 400px;
          height: calc(100vh - 64px);
          background: rgba(10, 10, 26, 0.95);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(139, 92, 246, 0.2);
          z-index: 10;
          transition: transform 0.3s ease;
          overflow-y: auto;
        }

        .task-sidebar.closed {
          transform: translateX(100%);
        }

        .bottom-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(10, 10, 26, 0.8);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(139, 92, 246, 0.2);
          padding: 1rem 2rem;
          z-index: 10;
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .metrics-toggle {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.4);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .metrics-toggle:hover {
          background: rgba(139, 92, 246, 0.3);
        }

        .metrics-panel {
          background: rgba(15, 15, 30, 0.9);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 0.5rem;
          padding: 1rem;
          flex: 1;
          max-width: 600px;
        }

        .metrics-panel h3 {
          color: #8b5cf6;
          font-size: 1rem;
          margin: 0 0 0.75rem 0;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .metric-label {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.75rem;
        }

        .metric-value {
          color: #06b6d4;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .info-overlay {
          margin-left: auto;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }

        .info-text {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          margin: 0;
        }

        .error-text {
          color: #ef4444;
          font-size: 0.875rem;
          margin: 0;
        }

        /* Task List Styles */
        .neural-task-list {
          padding: 1.5rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(139, 92, 246, 0.2);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .task-input-form {
          display: flex;
          gap: 0.75rem;
        }

        .task-input {
          flex: 1;
          background: rgba(15, 15, 30, 0.8);
          border: 1px solid rgba(139, 92, 246, 0.3);
          color: white;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        .task-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .task-input:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.6);
        }

        .add-task-btn {
          background: rgba(139, 92, 246, 0.3);
          color: #8b5cf6;
          border: 1px solid rgba(139, 92, 246, 0.5);
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .add-task-btn:hover:not(:disabled) {
          background: rgba(139, 92, 246, 0.4);
        }

        .add-task-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .task-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
        }

        .task-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .section-title {
          color: #8b5cf6;
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }

        .task-item {
          background: rgba(15, 15, 30, 0.6);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 0.5rem;
          padding: 0.75rem;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          transition: all 0.2s;
        }

        .task-item:hover {
          background: rgba(15, 15, 30, 0.8);
          border-color: rgba(139, 92, 246, 0.4);
        }

        .task-item.completed {
          opacity: 0.6;
        }

        .task-checkbox {
          margin-top: 0.25rem;
          cursor: pointer;
        }

        .task-content {
          flex: 1;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .task-text {
          color: white;
          font-size: 0.875rem;
          margin: 0;
        }

        .task-item.completed .task-text {
          text-decoration: line-through;
        }

        .priority-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .priority-high {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .priority-medium {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
        }

        .priority-low {
          background: rgba(6, 182, 212, 0.2);
          color: #06b6d4;
        }

        .task-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .tag {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }

        .task-actions {
          display: flex;
          gap: 0.5rem;
        }

        .pulse-btn,
        .delete-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          opacity: 0.6;
          transition: all 0.2s;
        }

        .pulse-btn:hover,
        .delete-btn:hover {
          opacity: 1;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}

export default NeuralHomePage
