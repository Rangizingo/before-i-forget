# Audio System

Complete audio system for the "Before I Forget" neural network visualization.

## Features

- **Procedural Sound Generation**: All sounds are generated programmatically using Web Audio API
- **Howler.js Integration**: Professional audio playback with cross-browser support
- **React Hook**: Easy integration with `useSound()` hook
- **Persistent Settings**: Configuration saved to localStorage
- **Sound ON by Default**: Ready to use immediately
- **Individual Volume Controls**: Fine-tune each effect

## Quick Start

### Basic Usage in Components

```tsx
import { useSound } from '@/hooks'

function MyComponent() {
  const { playEffect, isEnabled, setEnabled } = useSound()

  const handleAction = () => {
    playEffect('neuron-complete')
  }

  return (
    <button onClick={handleAction}>
      Complete Task
    </button>
  )
}
```

### Add Sound Settings UI

```tsx
import { SoundSettings } from '@/components/neural'

function SettingsPanel() {
  return (
    <div>
      <SoundSettings />
    </div>
  )
}
```

## Sound Effects

### Available Sounds

1. **neuron-create** - Light, airy "pop" when neurons are created
2. **neuron-complete** - Satisfying "ding" when tasks complete
3. **connection-form** - Subtle "click" when connections form
4. **pulse-propagate** - Soft "swoosh" for energy pulses
5. **layer-switch** - Gentle transition sound
6. **ambient-loop** - 30-second atmospheric drone (loops seamlessly)

### Sound Characteristics

- **Duration**: 0.15s - 1.0s for effects, 30s for ambient
- **Volume**: Pre-tuned for pleasant listening
- **Quality**: Professional, non-intrusive audio design

## Architecture

### Files

```
src/systems/audio/
├── SoundGenerator.ts    # Procedural sound generation with Web Audio API
├── SoundManager.ts      # Audio management with Howler.js
└── index.ts             # Exports

src/hooks/
└── useSound.ts          # React hook for sound integration

src/components/neural/
└── SoundSettings.tsx    # UI component for audio controls
```

### How It Works

1. **Sound Generation**: `SoundGenerator` creates AudioBuffers using Web Audio API oscillators and filters
2. **Audio Management**: `SoundManager` converts buffers to WAV data URLs and manages playback via Howler.js
3. **React Integration**: `useSound` hook provides simple interface for components
4. **Settings UI**: `SoundSettings` component offers user controls

### Storage

Configuration is automatically saved to localStorage:
- Key: `'before-i-forget-sound-config'`
- Stored: enabled state, master volume, individual effect volumes

## API Reference

### useSound() Hook

```typescript
const {
  playEffect,        // (effect: SoundEffect) => void
  setEnabled,        // (enabled: boolean) => void
  setVolume,         // (volume: number) => void
  setEffectVolume,   // (effect: SoundEffect, volume: number) => void
  isEnabled,         // boolean
  volume,            // number (0-1)
  config,            // SoundConfig
  initialized        // boolean
} = useSound()
```

### SoundManager Methods

```typescript
await soundManager.initialize()                    // Load all sounds
soundManager.play('neuron-complete')               // Play effect
soundManager.playAmbient()                         // Start ambient loop
soundManager.stopAmbient()                         // Stop ambient loop
soundManager.setMasterVolume(0.7)                  // Set master volume
soundManager.setEffectVolume('neuron-create', 0.8) // Set effect volume
soundManager.setEnabled(false)                     // Disable all sounds
soundManager.dispose()                             // Clean up
```

## Integration Examples

### In Neural Network Events

```tsx
import { useSound } from '@/hooks'

function NeuralNetwork() {
  const { playEffect } = useSound()

  const handleTaskComplete = (taskId: string) => {
    // Visual effects...
    playEffect('neuron-complete')
  }

  const handleConnectionForm = (from: string, to: string) => {
    // Visual effects...
    playEffect('connection-form')
  }

  return <Canvas />
}
```

### With Ambient Background

```tsx
import { useEffect } from 'react'
import { useSound } from '@/hooks'

function App() {
  const { playEffect } = useSound()

  useEffect(() => {
    // Start ambient when app loads
    soundManager.playAmbient()

    return () => {
      soundManager.stopAmbient()
    }
  }, [])

  return <YourApp />
}
```

## Performance

- Sounds are generated once and cached
- Minimal memory footprint (~2MB for all sounds)
- No network requests (procedural generation)
- Efficient playback via Howler.js
- Supports multiple simultaneous sounds

## Browser Compatibility

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile support (iOS, Android)
- Graceful degradation if Web Audio API not available
- Respects autoplay policies

## Customization

To modify sound characteristics, edit `SoundGenerator.ts`:

```typescript
// Example: Change neuron complete sound
generateNeuronComplete(): AudioBuffer {
  // Modify frequencies, duration, envelope, etc.
  const freq1 = 523.25  // C5 - change to any frequency
  const duration = 1.0  // Change duration
  // ...
}
```

## Troubleshooting

### Sounds not playing
- Check if audio is enabled: `useSound().isEnabled`
- Verify initialization: `useSound().initialized`
- Check browser console for errors

### Volume too low/high
- Adjust master volume: `setVolume(0.7)`
- Adjust individual effects in Settings UI

### Ambient loop not seamless
- Ensure browser supports loop attribute
- Check that buffer generation includes fade in/out

## License

All sounds are procedurally generated and royalty-free.
