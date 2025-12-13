import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { useThreeScene, useInteraction } from '@/hooks'

interface NeuralCanvasProps {
  className?: string
  onNeuronSelect?: (neuronId: string) => void
  onNeuronComplete?: (neuronId: string) => void
}

/**
 * NeuralCanvas - The main WebGL canvas component
 * Renders the neural network visualization as a full-screen background
 */
export function NeuralCanvas({
  className = '',
  onNeuronSelect,
  onNeuronComplete,
}: NeuralCanvasProps) {
  const { containerRef, sceneManager, isReady, metrics } = useThreeScene({
    sceneConfig: {
      backgroundColor: 0x0a0a1a,
      ambientLightIntensity: 0.4,
    },
    cameraConfig: {
      fov: 60,
      position: { x: 0, y: 0, z: 50 },
      lookAt: { x: 0, y: 0, z: 0 },
    },
  })

  // Track interactable objects
  const [interactableObjects, setInteractableObjects] = useState<THREE.Object3D[]>([])

  // Setup interaction system
  useInteraction({
    sceneManager,
    interactableObjects,
    interactionOptions: {
      enableDrag: true,
      enableHover: true,
      enableContextMenu: true,
    },
    onSelect: (neuronId) => {
      console.log('Neuron selected:', neuronId)
      onNeuronSelect?.(neuronId)
    },
    onDoubleClick: (neuronId) => {
      console.log('Neuron double-clicked (complete):', neuronId)
      onNeuronComplete?.(neuronId)
    },
    onLongPress: (neuronId, position) => {
      console.log('Long press on neuron:', neuronId, position)
      // Could show context menu here
    },
    onDrag: (neuronId, position) => {
      // Update neuron position during drag
      const object = interactableObjects.find(obj => obj.userData.neuronId === neuronId)
      if (object) {
        object.position.copy(position)
      }
    },
    onPinchZoom: (scale) => {
      // Handle camera zoom
      if (sceneManager) {
        const camera = sceneManager.getCamera()
        camera.position.z = Math.max(10, Math.min(100, camera.position.z / scale))
      }
    },
    onTwoFingerPan: (deltaX, deltaY) => {
      // Handle camera pan
      if (sceneManager) {
        const camera = sceneManager.getCamera()
        camera.position.x -= deltaX * 0.05
        camera.position.y += deltaY * 0.05
      }
    },
  })

  // Add demo content to verify WebGL is working
  useEffect(() => {
    if (!sceneManager || !isReady) return

    const scene = sceneManager.getScene()

    // Create a simple test sphere (placeholder neuron)
    const geometry = new THREE.SphereGeometry(2, 32, 32)
    const material = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.8,
    })
    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.set(0, 0, 0)
    sphere.userData.neuronId = 'neuron-center' // Add neuron ID for interaction
    scene.add(sphere)

    // Create a glow effect (outer sphere)
    const glowGeometry = new THREE.SphereGeometry(2.5, 32, 32)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.2,
    })
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial)
    glowSphere.position.set(0, 0, 0)
    scene.add(glowSphere)

    // Create some additional test spheres around the center
    const additionalSpheres: THREE.Mesh[] = []
    const positions = [
      { x: -15, y: 8, z: -5 },
      { x: 12, y: -6, z: -3 },
      { x: -8, y: -10, z: -2 },
      { x: 18, y: 5, z: -8 },
      { x: -20, y: -3, z: -10 },
    ]

    positions.forEach((pos, index) => {
      const geo = new THREE.SphereGeometry(1.2, 24, 24)
      const mat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4, // Cyan accent
        transparent: true,
        opacity: 0.7,
      })
      const s = new THREE.Mesh(geo, mat)
      s.position.set(pos.x, pos.y, pos.z)
      s.userData.neuronId = `neuron-${index}` // Add neuron ID for interaction
      scene.add(s)
      additionalSpheres.push(s)

      // Connect to center with a line
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(pos.x, pos.y, pos.z),
      ])
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.3,
      })
      const line = new THREE.Line(lineGeometry, lineMaterial)
      scene.add(line)
    })

    // Set interactable objects for the interaction system
    setInteractableObjects([sphere, ...additionalSpheres])

    // Add subtle animation
    const unsubscribe = sceneManager.onUpdate((delta, elapsed) => {
      // Pulse the center sphere
      const scale = 1 + Math.sin(elapsed * 2) * 0.1
      sphere.scale.set(scale, scale, scale)
      glowSphere.scale.set(scale * 1.25, scale * 1.25, scale * 1.25)

      // Subtle rotation
      sphere.rotation.y += delta * 0.2
      glowSphere.rotation.y -= delta * 0.1

      // Animate other spheres
      additionalSpheres.forEach((s, i) => {
        const offset = i * 0.5
        const pulseScale = 1 + Math.sin(elapsed * 1.5 + offset) * 0.15
        s.scale.set(pulseScale, pulseScale, pulseScale)
      })
    })

    // Cleanup
    return () => {
      unsubscribe()
      scene.remove(sphere)
      scene.remove(glowSphere)
      additionalSpheres.forEach((s) => scene.remove(s))
      geometry.dispose()
      material.dispose()
      glowGeometry.dispose()
      glowMaterial.dispose()
    }
  }, [sceneManager, isReady])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Three.js canvas container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Performance metrics overlay (dev only) */}
      {import.meta.env.DEV && metrics && (
        <div className="absolute top-2 left-2 text-xs text-white/50 font-mono bg-black/30 px-2 py-1 rounded">
          {metrics.fps} FPS | {metrics.drawCalls} draws
        </div>
      )}

      {/* Loading state */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-white/50 text-sm">Initializing neural network...</div>
        </div>
      )}
    </div>
  )
}

export default NeuralCanvas
