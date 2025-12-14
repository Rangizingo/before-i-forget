import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { useThreeScene, useInteraction } from '@/hooks'
import type { NeuronData, ConnectionData } from '@/types/neural'

interface NeuralCanvasProps {
  className?: string
  neurons?: NeuronData[]
  connections?: ConnectionData[]
  onNeuronSelect?: (neuronId: string) => void
  onNeuronComplete?: (neuronId: string) => void
  onNeuronPositionChange?: (neuronId: string, position: { x: number; y: number; z: number }) => void
}

const COLORS = {
  active: 0x8b5cf6,
  completed: 0x10b981,
  dormant: 0x64748b,
  connection: 0x8b5cf6,
  connectionPulsing: 0x06b6d4,
}

export function NeuralCanvas({
  className = '',
  neurons = [],
  connections = [],
  onNeuronSelect,
  onNeuronComplete,
  onNeuronPositionChange,
}: NeuralCanvasProps) {
  const { containerRef, sceneManager, isReady, metrics } = useThreeScene({
    sceneConfig: { backgroundColor: 0x0a0a1a, ambientLightIntensity: 0.4 },
    cameraConfig: { fov: 60, position: { x: 0, y: 0, z: 50 }, lookAt: { x: 0, y: 0, z: 0 } },
  })

  const interactableObjectsRef = useRef<THREE.Object3D[]>([])
  const neuronMeshesRef = useRef<Map<string, { mesh: THREE.Mesh; glow: THREE.Mesh }>>(new Map())
  const connectionLinesRef = useRef<Map<string, THREE.Line>>(new Map())
  const animUnsubRef = useRef<(() => void) | null>(null)

  const { setInteractableObjects } = useInteraction({
    sceneManager,
    interactableObjects: interactableObjectsRef.current,
    interactionOptions: { enableDrag: true, enableHover: true, enableContextMenu: true },
    onSelect: (id) => onNeuronSelect?.(id),
    onDoubleClick: (id) => onNeuronComplete?.(id),
    onLongPress: () => {},
    onDrag: (id, pos) => {
      const md = neuronMeshesRef.current.get(id)
      if (md) {
        md.mesh.position.copy(pos)
        md.glow.position.copy(pos)
        onNeuronPositionChange?.(id, { x: pos.x, y: pos.y, z: pos.z })
      }
    },
    onPinchZoom: (s) => {
      if (sceneManager) {
        const cam = sceneManager.getCamera()
        cam.position.z = Math.max(10, Math.min(100, cam.position.z / s))
      }
    },
    onTwoFingerPan: (dx, dy) => {
      if (sceneManager) {
        const cam = sceneManager.getCamera()
        cam.position.x -= dx * 0.05
        cam.position.y += dy * 0.05
      }
    },
  })

  const createNeuronMesh = useCallback((n: NeuronData, scene: THREE.Scene) => {
    const color = n.state === 'completed' ? COLORS.completed : n.state === 'dormant' ? COLORS.dormant : COLORS.active
    const sz = n.size * 1.5
    const geo = new THREE.SphereGeometry(sz, 32, 32)
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 * n.energy })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(n.position.x, n.position.y, n.position.z)
    mesh.userData.neuronId = n.id
    scene.add(mesh)
    const gGeo = new THREE.SphereGeometry(sz * 1.3, 32, 32)
    const gMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2 * n.energy })
    const glow = new THREE.Mesh(gGeo, gMat)
    glow.position.set(n.position.x, n.position.y, n.position.z)
    scene.add(glow)
    return { mesh, glow, geometry: geo, material: mat, glowGeometry: gGeo, glowMaterial: gMat }
  }, [])

  const createConnLine = useCallback((c: ConnectionData, nMap: Map<string, NeuronData>, scene: THREE.Scene) => {
    const src = nMap.get(c.sourceId), tgt = nMap.get(c.targetId)
    if (!src || !tgt) return null
    const color = c.state === 'pulsing' ? COLORS.connectionPulsing : COLORS.connection
    const pts = [new THREE.Vector3(src.position.x, src.position.y, src.position.z), new THREE.Vector3(tgt.position.x, tgt.position.y, tgt.position.z)]
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 + c.strength * 0.4 })
    const line = new THREE.Line(geo, mat)
    scene.add(line)
    return { line, geometry: geo, material: mat }
  }, [])

  useEffect(() => {
    if (!sceneManager || !isReady) return
    const scene = sceneManager.getScene()
    neuronMeshesRef.current.forEach((m) => { scene.remove(m.mesh); scene.remove(m.glow) })
    neuronMeshesRef.current.clear()
    connectionLinesRef.current.forEach((l) => scene.remove(l))
    connectionLinesRef.current.clear()
    const nMap = new Map<string, NeuronData>()
    neurons.forEach((n) => nMap.set(n.id, n))
    const interacts: THREE.Object3D[] = []
    const meshList: any[] = []
    neurons.forEach((n) => {
      const md = createNeuronMesh(n, scene)
      neuronMeshesRef.current.set(n.id, { mesh: md.mesh, glow: md.glow })
      interacts.push(md.mesh)
      meshList.push(md)
    })
    const lineList: any[] = []
    connections.forEach((c) => {
      const ld = createConnLine(c, nMap, scene)
      if (ld) { connectionLinesRef.current.set(c.id, ld.line); lineList.push(ld) }
    })
    interactableObjectsRef.current = interacts; setInteractableObjects(interacts)
    if (animUnsubRef.current) animUnsubRef.current()
    animUnsubRef.current = sceneManager.onUpdate((dt, elapsed) => {
      neuronMeshesRef.current.forEach((md, nid) => {
        const n = nMap.get(nid)
        if (!n) return
        const ps = n.state === 'active' ? 2 : 1, pa = n.state === 'active' ? 0.1 : 0.05
        const s = 1 + Math.sin(elapsed * ps + n.createdAt % 10) * pa
        md.mesh.scale.set(s, s, s)
        md.glow.scale.set(s * 1.3, s * 1.3, s * 1.3)
        md.mesh.rotation.y += dt * 0.2
      })
      connectionLinesRef.current.forEach((line, cid) => {
        const c = connections.find((x) => x.id === cid)
        if (!c) return
        const sm = neuronMeshesRef.current.get(c.sourceId), tm = neuronMeshesRef.current.get(c.targetId)
        if (sm && tm) {
          const pos = line.geometry.attributes.position as THREE.BufferAttribute
          pos.setXYZ(0, sm.mesh.position.x, sm.mesh.position.y, sm.mesh.position.z)
          pos.setXYZ(1, tm.mesh.position.x, tm.mesh.position.y, tm.mesh.position.z)
          pos.needsUpdate = true
        }
      })
    })
    return () => {
      if (animUnsubRef.current) { animUnsubRef.current(); animUnsubRef.current = null }
      meshList.forEach((md) => { scene.remove(md.mesh); scene.remove(md.glow); md.geometry.dispose(); md.material.dispose(); md.glowGeometry.dispose(); md.glowMaterial.dispose() })
      lineList.forEach((ld) => { scene.remove(ld.line); ld.geometry.dispose(); ld.material.dispose() })
    }
  }, [sceneManager, isReady, neurons, connections, createNeuronMesh, createConnLine])

  useEffect(() => {
    if (!sceneManager || !isReady || neurons.length > 0) return
    const scene = sceneManager.getScene()
    const geo = new THREE.SphereGeometry(2, 32, 32)
    const mat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.3 })
    const sphere = new THREE.Mesh(geo, mat)
    scene.add(sphere)
    const rgeo = new THREE.RingGeometry(3, 3.5, 32)
    const rmat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.2, side: THREE.DoubleSide })
    const ring = new THREE.Mesh(rgeo, rmat)
    scene.add(ring)
    const unsub = sceneManager.onUpdate((_, elapsed) => {
      const s = 1 + Math.sin(elapsed * 2) * 0.2
      sphere.scale.set(s, s, s)
      ring.scale.set(s * 1.5, s * 1.5, 1)
      rmat.opacity = 0.1 + Math.sin(elapsed * 2) * 0.1
    })
    return () => { unsub(); scene.remove(sphere); scene.remove(ring); geo.dispose(); mat.dispose(); rgeo.dispose(); rmat.dispose() }
  }, [sceneManager, isReady, neurons.length])

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ touchAction: 'none' }} />
      {import.meta.env.DEV && metrics && (
        <div className="absolute top-2 left-2 text-xs text-white/50 font-mono bg-black/30 px-2 py-1 rounded">
          {metrics.fps} FPS | {metrics.drawCalls} draws | {neurons.length} neurons
        </div>
      )}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-white/50 text-sm">Initializing neural network...</div>
        </div>
      )}
    </div>
  )
}

export default NeuralCanvas
