import * as THREE from 'three'

/**
 * ShaderManager - Custom GLSL shaders for neural network visuals
 * Provides materials for neurons, connections, and effects
 */

// ============================================================================
// Neuron Glow Shader
// Soft, pulsing glow effect for neurons
// ============================================================================

export const neuronGlowVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const neuronGlowFragmentShader = `
  uniform vec3 glowColor;
  uniform float glowIntensity;
  uniform float time;
  uniform float energy;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Fresnel effect for edge glow
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 3.0);

    // Pulsing effect based on time and energy
    float pulse = 0.5 + 0.5 * sin(time * 2.0);
    float combinedIntensity = glowIntensity * (0.7 + 0.3 * pulse * energy);

    // Combine fresnel and glow
    float glowStrength = fresnel * combinedIntensity;

    vec3 glow = glowColor * glowStrength;

    // Add core color
    vec3 coreColor = glowColor * 0.3;
    vec3 finalColor = coreColor + glow;

    // Alpha based on glow strength
    float alpha = glowStrength * 0.8 + 0.2;

    gl_FragColor = vec4(finalColor, alpha);
  }
`

// ============================================================================
// Connection Pulse Shader
// Energy traveling along connections between neurons
// ============================================================================

export const connectionPulseVertexShader = `
  attribute float lineDistance;
  varying float vLineDistance;

  void main() {
    vLineDistance = lineDistance;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const connectionPulseFragmentShader = `
  uniform vec3 color;
  uniform float pulseProgress;
  uniform float opacity;
  uniform float time;

  varying float vLineDistance;

  void main() {
    // Create a moving pulse along the line
    float pulseWidth = 0.2;
    float dist = abs(vLineDistance - pulseProgress);
    float pulse = smoothstep(pulseWidth, 0.0, dist);

    // Base line opacity
    float baseOpacity = opacity * 0.3;

    // Add pulse brightness
    float brightness = baseOpacity + pulse * 0.7;

    // Subtle shimmer
    float shimmer = 0.5 + 0.5 * sin(time * 3.0 + vLineDistance * 10.0);
    brightness *= (0.8 + 0.2 * shimmer);

    gl_FragColor = vec4(color, brightness);
  }
`

// ============================================================================
// Background Ambient Shader
// Subtle, drifting particle/nebula effect
// ============================================================================

export const backgroundAmbientVertexShader = `
  attribute float particleSize;
  attribute float particlePhase;

  uniform float time;
  uniform float scale;

  varying float vAlpha;

  void main() {
    // Floating motion
    vec3 pos = position;
    pos.x += sin(time * 0.5 + particlePhase) * 0.5;
    pos.y += cos(time * 0.3 + particlePhase * 1.3) * 0.5;
    pos.z += sin(time * 0.4 + particlePhase * 0.7) * 0.3;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Fade based on distance
    float distFade = 1.0 - smoothstep(50.0, 200.0, -mvPosition.z);

    // Pulsing alpha
    float pulse = 0.3 + 0.7 * sin(time + particlePhase * 2.0);
    vAlpha = distFade * pulse * 0.4;

    gl_PointSize = particleSize * scale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const backgroundAmbientFragmentShader = `
  uniform vec3 color;
  varying float vAlpha;

  void main() {
    // Circular particle shape
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // Soft edges
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;

    gl_FragColor = vec4(color, alpha);
  }
`

// ============================================================================
// ShaderManager Class
// ============================================================================

export class ShaderManager {
  private materials: Map<string, THREE.ShaderMaterial> = new Map()
  private clock: THREE.Clock

  constructor() {
    this.clock = new THREE.Clock()
  }

  /**
   * Create a neuron material with glow effect
   */
  createNeuronMaterial(color: string, energy: number): THREE.ShaderMaterial {
    const c = new THREE.Color(color)

    const material = new THREE.ShaderMaterial({
      vertexShader: neuronGlowVertexShader,
      fragmentShader: neuronGlowFragmentShader,
      uniforms: {
        glowColor: { value: c },
        glowIntensity: { value: energy },
        time: { value: 0 },
        energy: { value: energy },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    return material
  }

  /**
   * Create a connection material with pulse effect
   */
  createConnectionMaterial(
    color: string,
    pulseProgress: number = 0
  ): THREE.ShaderMaterial {
    const c = new THREE.Color(color)

    const material = new THREE.ShaderMaterial({
      vertexShader: connectionPulseVertexShader,
      fragmentShader: connectionPulseFragmentShader,
      uniforms: {
        color: { value: c },
        pulseProgress: { value: pulseProgress },
        opacity: { value: 0.6 },
        time: { value: 0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    return material
  }

  /**
   * Create a glow material for halos and effects
   */
  createGlowMaterial(color: string, intensity: number): THREE.ShaderMaterial {
    const c = new THREE.Color(color)

    const material = new THREE.ShaderMaterial({
      vertexShader: neuronGlowVertexShader,
      fragmentShader: neuronGlowFragmentShader,
      uniforms: {
        glowColor: { value: c },
        glowIntensity: { value: intensity },
        time: { value: 0 },
        energy: { value: 1.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    })

    return material
  }

  /**
   * Create background ambient particles material
   */
  createAmbientParticlesMaterial(color: string): THREE.ShaderMaterial {
    const c = new THREE.Color(color)

    const material = new THREE.ShaderMaterial({
      vertexShader: backgroundAmbientVertexShader,
      fragmentShader: backgroundAmbientFragmentShader,
      uniforms: {
        color: { value: c },
        time: { value: 0 },
        scale: { value: 1.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    return material
  }

  /**
   * Update shader uniforms (call this each frame)
   */
  update(): void {
    const elapsed = this.clock.getElapsedTime()

    this.materials.forEach((material) => {
      if (material.uniforms.time) {
        material.uniforms.time.value = elapsed
      }
    })
  }

  /**
   * Register a material for automatic updates
   */
  registerMaterial(id: string, material: THREE.ShaderMaterial): void {
    this.materials.set(id, material)
  }

  /**
   * Unregister a material
   */
  unregisterMaterial(id: string): void {
    const material = this.materials.get(id)
    if (material) {
      material.dispose()
      this.materials.delete(id)
    }
  }

  /**
   * Update a specific uniform on a registered material
   */
  updateUniform(
    materialId: string,
    uniformName: string,
    value: number | THREE.Color | THREE.Vector3
  ): void {
    const material = this.materials.get(materialId)
    if (material && material.uniforms[uniformName]) {
      material.uniforms[uniformName].value = value
    }
  }

  /**
   * Clean up all materials
   */
  dispose(): void {
    this.materials.forEach((material) => material.dispose())
    this.materials.clear()
  }
}

export default ShaderManager
