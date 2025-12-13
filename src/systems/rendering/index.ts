export { SceneManager } from './SceneManager'
export { ShaderManager } from './ShaderManager'
export * from './ShaderManager'

export { LODManager } from './LODManager'
export type { LODLevel, LODObjectInfo } from './LODManager'

export { ClusterManager } from './ClusterManager'
export type { ClusterConfig, Cluster } from './ClusterManager'

export { FogSystem } from './FogSystem'
export type { FogConfig } from './FogSystem'

export { RenderOptimizer } from './RenderOptimizer'
export type { RenderOptimizerConfig } from './RenderOptimizer'

export { ObjectPool, MeshPool, MemoryManager, getMemoryManager, disposeMemoryManager } from './ObjectPool'
export type { PoolConfig } from './ObjectPool'
