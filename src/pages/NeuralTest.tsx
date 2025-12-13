import { NeuralCanvas } from '@/components/neural'

/**
 * Test page for Neural Network visualization
 * Access at /neural-test route
 */
export function NeuralTestPage() {
  return (
    <div className="w-screen h-screen bg-slate-900">
      <NeuralCanvas className="w-full h-full" />

      {/* Overlay info */}
      <div className="absolute bottom-4 left-4 text-white/70 text-sm">
        <p>Neural Network Foundation Test</p>
        <p className="text-white/40 text-xs mt-1">
          If you see glowing spheres with pulsing animations, WebGL is working!
        </p>
      </div>
    </div>
  )
}

export default NeuralTestPage
