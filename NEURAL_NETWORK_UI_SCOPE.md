# Neural Network UI - Project Scope & Development Checklist

## Overview

Transform "Before I Forget" from a traditional todo list into a living, breathing neural network visualization where:
- Each task is a neuron
- Completing tasks grows the network
- The visualization is ambient, beautiful, and satisfying
- Designed for permanent display on a dedicated monitor

### Core Philosophy
- **ADHD-friendly**: Quick capture, visual rewards
- **Ambient**: Can be left running as living wallpaper
- **Satisfying**: Every completion contributes to visible growth
- **Immersive**: All UI elements fit the neural network theme

---

## Architecture

### Tech Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Renderer | Three.js (WebGL) | GPU-accelerated 2D/3D graphics |
| UI Framework | React 18 | Component architecture |
| State | React Context + Hooks | App state management |
| Animation | Three.js + GSAP | Smooth, organic animations |
| Audio | Howler.js | Sound effects |
| Backend | Firebase (existing) | Auth, Firestore, sync |
| Build | Vite (existing) | Fast dev/build |

### File Structure (New/Modified)
```
src/
├── components/
│   ├── neural/                    # NEW: Neural network components
│   │   ├── NeuralCanvas.tsx       # Main Three.js canvas
│   │   ├── NeuralNetwork.ts       # Network logic & state
│   │   ├── Neuron.ts              # Individual neuron class
│   │   ├── Connection.ts          # Connection between neurons
│   │   ├── ProceduralLayout.ts    # Organic positioning algorithm
│   │   ├── LayerManager.ts        # Active/All/Completed switching
│   │   ├── InteractionHandler.ts  # Touch/mouse/keyboard input
│   │   ├── NodeDetail.tsx         # Expanded node view (React overlay)
│   │   ├── ThoughtStream.tsx      # Bottom input bar
│   │   ├── LayerIndicator.tsx     # Current layer display
│   │   └── index.ts
│   ├── settings/                  # NEW: Settings components
│   │   ├── ColorCustomizer.tsx    # Color palette editor
│   │   ├── SoundSettings.tsx      # Audio toggles
│   │   └── index.ts
│   └── ...existing
├── systems/                       # NEW: Core systems
│   ├── rendering/
│   │   ├── SceneManager.ts        # Three.js scene setup
│   │   ├── CameraController.ts    # Pan, zoom controls
│   │   ├── ShaderManager.ts       # Custom glow/pulse shaders
│   │   ├── LODManager.ts          # Level of detail system
│   │   └── FogSystem.ts           # Edge fade effect
│   ├── animation/
│   │   ├── PulseAnimator.ts       # Neuron pulse animations
│   │   ├── FireAnimator.ts        # Completion cascade effect
│   │   ├── GrowthAnimator.ts      # Network expansion animation
│   │   └── DecayAnimator.ts       # Overdue task effects
│   ├── procedural/
│   │   ├── NetworkGenerator.ts    # Procedural layout algorithm
│   │   ├── ClusterManager.ts      # Tag-based clustering
│   │   └── SpatialHash.ts         # Efficient collision detection
│   └── audio/
│       ├── SoundManager.ts        # Audio controller
│       └── sounds/                # Audio assets
├── hooks/
│   ├── useNeuralNetwork.ts        # NEW: Network state hook
│   ├── useThreeScene.ts           # NEW: Three.js lifecycle
│   └── ...existing
├── types/
│   ├── neural.ts                  # NEW: Neural network types
│   └── ...existing
├── utils/
│   ├── colorTheory.ts             # NEW: Color palette generation
│   └── ...existing
└── pages/
    └── Home.tsx                   # MODIFIED: Replace with neural UI
```

---

## Development Phases

### Phase 1: Foundation (WebGL & Core Systems)
Setup Three.js, basic rendering, and core data structures.

### Phase 2: Neural Network Logic
Procedural generation, neuron/connection classes, layout algorithm.

### Phase 3: Interaction System
Touch, mouse, keyboard input handling within the neural theme.

### Phase 4: Visual Design & Animation
Shaders, glow effects, pulse animations, organic aesthetics.

### Phase 5: Task Integration
Connect to existing Firebase/task system, CRUD operations.

### Phase 6: Layer System & Navigation
Active/All/Completed views, swipe navigation.

### Phase 7: Performance Optimization
LOD, clustering, fog, handle 500+ nodes.

### Phase 8: Customization & Sound
Color themes, sound effects, user preferences.

### Phase 9: Polish & Edge Cases
Empty state, overdue decay, bulk completion cascades.

### Phase 10: Testing & Deployment
Cross-device testing, performance profiling, deploy.

---

## Task Checklist

### Phase 1: Foundation
> Setup Three.js rendering pipeline and core infrastructure

- [ ] **1.1** Install dependencies
  - [ ] 1.1.1 Install three.js: `npm install three @types/three`
  - [ ] 1.1.2 Install GSAP: `npm install gsap`
  - [ ] 1.1.3 Install Howler.js: `npm install howler @types/howler`
  - **Acceptance**: All packages in package.json, no version conflicts

- [ ] **1.2** Create Three.js scene manager
  - [ ] 1.2.1 Create `src/systems/rendering/SceneManager.ts`
  - [ ] 1.2.2 Initialize WebGL renderer with alpha background
  - [ ] 1.2.3 Setup orthographic camera (2D view)
  - [ ] 1.2.4 Create render loop with requestAnimationFrame
  - [ ] 1.2.5 Handle canvas resize for responsive design
  - **Acceptance**: Blank canvas renders, resizes properly on all screen sizes

- [ ] **1.3** Create React integration hook
  - [ ] 1.3.1 Create `src/hooks/useThreeScene.ts`
  - [ ] 1.3.2 Handle mount/unmount lifecycle
  - [ ] 1.3.3 Cleanup WebGL context on unmount
  - [ ] 1.3.4 Expose scene, camera, renderer refs
  - **Acceptance**: React component can mount/unmount Three.js without memory leaks

- [ ] **1.4** Create main canvas component
  - [ ] 1.4.1 Create `src/components/neural/NeuralCanvas.tsx`
  - [ ] 1.4.2 Full-screen canvas with proper z-indexing
  - [ ] 1.4.3 Integrate with useThreeScene hook
  - **Acceptance**: Full-screen WebGL canvas renders in app

- [ ] **1.5** Define neural network types
  - [ ] 1.5.1 Create `src/types/neural.ts`
  - [ ] 1.5.2 Define NeuronData interface (position, connections, state)
  - [ ] 1.5.3 Define ConnectionData interface
  - [ ] 1.5.4 Define NetworkState interface
  - [ ] 1.5.5 Define LayerType enum (Active, All, Completed)
  - **Acceptance**: All types compile, match Task type from existing system

---

### Phase 2: Neural Network Logic
> Core neuron/connection system and procedural layout

- [ ] **2.1** Create Neuron class
  - [ ] 2.1.1 Create `src/components/neural/Neuron.ts`
  - [ ] 2.1.2 Properties: position, radius, color, pulsePhase, taskId
  - [ ] 2.1.3 Method: updatePulse(delta) for animation
  - [ ] 2.1.4 Method: setIntensity(priority) for size/glow
  - [ ] 2.1.5 Method: setUrgency(dueDate) for pulse speed
  - [ ] 2.1.6 Create Three.js mesh (circle geometry + shader material)
  - **Acceptance**: Single neuron renders with pulsing animation

- [ ] **2.2** Create Connection class
  - [ ] 2.2.1 Create `src/components/neural/Connection.ts`
  - [ ] 2.2.2 Properties: startNeuron, endNeuron, color, pulsePosition
  - [ ] 2.2.3 Method: updatePulse(delta) for traveling pulse
  - [ ] 2.2.4 Create Three.js line with curved geometry
  - [ ] 2.2.5 Support organic bezier curves between neurons
  - **Acceptance**: Connection renders between two neurons with traveling pulse

- [ ] **2.3** Create procedural layout algorithm
  - [ ] 2.3.1 Create `src/systems/procedural/NetworkGenerator.ts`
  - [ ] 2.3.2 Implement force-directed graph algorithm
  - [ ] 2.3.3 Add randomness seed for "living" variation
  - [ ] 2.3.4 Respect screen bounds with padding
  - [ ] 2.3.5 Create `src/systems/procedural/SpatialHash.ts` for collision
  - **Acceptance**: 20 neurons position organically without overlap

- [ ] **2.4** Create cluster manager for tags
  - [ ] 2.4.1 Create `src/systems/procedural/ClusterManager.ts`
  - [ ] 2.4.2 Group neurons by tag
  - [ ] 2.4.3 Assign cluster colors based on tag
  - [ ] 2.4.4 Bias positioning toward cluster center
  - **Acceptance**: Tagged tasks visually group together

- [ ] **2.5** Create NeuralNetwork controller
  - [ ] 2.5.1 Create `src/components/neural/NeuralNetwork.ts`
  - [ ] 2.5.2 Manage collection of neurons and connections
  - [ ] 2.5.3 Method: addNeuron(task, position?)
  - [ ] 2.5.4 Method: removeNeuron(taskId)
  - [ ] 2.5.5 Method: connectNeurons(id1, id2)
  - [ ] 2.5.6 Method: update(delta) for animation loop
  - **Acceptance**: Can add/remove neurons, connections auto-generate

---

### Phase 3: Interaction System
> Touch, mouse, keyboard input with thematic feel

- [ ] **3.1** Create interaction handler
  - [ ] 3.1.1 Create `src/components/neural/InteractionHandler.ts`
  - [ ] 3.1.2 Raycasting for neuron hit detection
  - [ ] 3.1.3 Track pointer position in world coordinates
  - [ ] 3.1.4 Differentiate tap, drag, double-tap, long-press
  - **Acceptance**: Console logs correct interaction type and hit neuron

- [ ] **3.2** Implement camera controls
  - [ ] 3.2.1 Create `src/systems/rendering/CameraController.ts`
  - [ ] 3.2.2 Pan: drag empty space
  - [ ] 3.2.3 Zoom: scroll wheel / pinch gesture
  - [ ] 3.2.4 Smooth damping on all movements
  - [ ] 3.2.5 Clamp zoom to min/max bounds
  - **Acceptance**: Can pan and zoom smoothly on all devices

- [ ] **3.3** Implement tap-to-add
  - [ ] 3.3.1 Tap empty space opens quick-add at position
  - [ ] 3.3.2 New neuron animates into existence at tap location
  - [ ] 3.3.3 Focus input immediately
  - **Acceptance**: Tap creates neuron at exact position with input

- [ ] **3.4** Implement node tap-to-expand
  - [ ] 3.4.1 Create `src/components/neural/NodeDetail.tsx`
  - [ ] 3.4.2 Tap neuron triggers organic expansion animation
  - [ ] 3.4.3 Show task details in themed overlay
  - [ ] 3.4.4 Edit task inline
  - [ ] 3.4.5 Tap outside to collapse
  - **Acceptance**: Node expands smoothly, shows editable details

- [ ] **3.5** Implement node dragging
  - [ ] 3.5.1 Drag neuron repositions it
  - [ ] 3.5.2 Connections stretch organically
  - [ ] 3.5.3 Other neurons gently repel (soft collision)
  - [ ] 3.5.4 Release snaps to natural position
  - **Acceptance**: Can drag nodes, network adjusts organically

- [ ] **3.6** Implement double-tap-to-complete
  - [ ] 3.6.1 Double-tap triggers completion
  - [ ] 3.6.2 Fire signal cascade animation
  - [ ] 3.6.3 Update task in Firebase
  - [ ] 3.6.4 Neuron transitions to completed state (dimmed)
  - **Acceptance**: Double-tap completes task with satisfying cascade

- [ ] **3.7** Create thought stream input
  - [ ] 3.7.1 Create `src/components/neural/ThoughtStream.tsx`
  - [ ] 3.7.2 Persistent input bar at bottom
  - [ ] 3.7.3 Themed styling (glowing border, neural aesthetic)
  - [ ] 3.7.4 Enter creates neuron, auto-places in network
  - [ ] 3.7.5 Integrates with existing priority/tag selection
  - **Acceptance**: Can type task, press enter, see neuron appear

- [ ] **3.8** Implement keyboard shortcuts
  - [ ] 3.8.1 `N` or `/` focuses thought stream
  - [ ] 3.8.2 `Escape` closes expanded node / unfocuses
  - [ ] 3.8.3 Arrow keys pan camera
  - [ ] 3.8.4 `+`/`-` zoom
  - [ ] 3.8.5 `1`/`2`/`3` switch layers
  - **Acceptance**: All shortcuts work, documented in settings

---

### Phase 4: Visual Design & Animation
> Shaders, glow effects, organic aesthetics

- [ ] **4.1** Create glow shader
  - [ ] 4.1.1 Create `src/systems/rendering/ShaderManager.ts`
  - [ ] 4.1.2 Neuron glow shader (soft radial gradient)
  - [ ] 4.1.3 Intensity based on priority
  - [ ] 4.1.4 Color tinting support
  - **Acceptance**: Neurons have soft, customizable glow

- [ ] **4.2** Create pulse animation system
  - [ ] 4.2.1 Create `src/systems/animation/PulseAnimator.ts`
  - [ ] 4.2.2 Gentle breathing pulse for all neurons
  - [ ] 4.2.3 Speed varies by due date urgency
  - [ ] 4.2.4 Slight size oscillation
  - **Acceptance**: All neurons pulse gently, urgent ones faster

- [ ] **4.3** Create connection pulse animation
  - [ ] 4.3.1 Light travels along connections
  - [ ] 4.3.2 Random timing for organic feel
  - [ ] 4.3.3 Brighter pulses on primary connections
  - **Acceptance**: Connections show traveling light pulses

- [ ] **4.4** Create fire/cascade animation
  - [ ] 4.4.1 Create `src/systems/animation/FireAnimator.ts`
  - [ ] 4.4.2 Completion triggers bright flash
  - [ ] 4.4.3 Signal cascades through connections
  - [ ] 4.4.4 Connected neurons briefly brighten
  - [ ] 4.4.5 Particle burst effect
  - **Acceptance**: Completing task triggers satisfying cascade

- [ ] **4.5** Create growth animation
  - [ ] 4.5.1 Create `src/systems/animation/GrowthAnimator.ts`
  - [ ] 4.5.2 New neurons fade/scale in organically
  - [ ] 4.5.3 Connections grow outward from neuron
  - [ ] 4.5.4 Network gently shifts to accommodate
  - **Acceptance**: Adding task shows organic growth animation

- [ ] **4.6** Create overdue decay effects
  - [ ] 4.6.1 Create `src/systems/animation/DecayAnimator.ts`
  - [ ] 4.6.2 Stage 1: Color shifts toward red
  - [ ] 4.6.3 Stage 2: Flicker/unstable pulse
  - [ ] 4.6.4 Stage 3: Connections become jagged
  - [ ] 4.6.5 Progressive based on how overdue
  - **Acceptance**: Overdue tasks visually degrade over time

- [ ] **4.7** Create ambient background
  - [ ] 4.7.1 Subtle particle field (distant stars/particles)
  - [ ] 4.7.2 Very slow drift animation
  - [ ] 4.7.3 Depth gradient (darker at edges)
  - **Acceptance**: Background has subtle life without distraction

---

### Phase 5: Task Integration
> Connect neural network to existing Firebase/task system

- [ ] **5.1** Create neural network hook
  - [ ] 5.1.1 Create `src/hooks/useNeuralNetwork.ts`
  - [ ] 5.1.2 Bridge existing useTasks with neural network
  - [ ] 5.1.3 Convert Task[] to NeuronData[]
  - [ ] 5.1.4 Sync changes bidirectionally
  - **Acceptance**: Tasks from Firebase render as neurons

- [ ] **5.2** Integrate task CRUD
  - [ ] 5.2.1 addTask → creates neuron with growth animation
  - [ ] 5.2.2 updateTask → updates neuron properties
  - [ ] 5.2.3 deleteTask → neuron dissolves animation
  - [ ] 5.2.4 toggleComplete → fire cascade + dim
  - **Acceptance**: All CRUD operations work through neural UI

- [ ] **5.3** Persist neuron positions
  - [ ] 5.3.1 Store position in Firestore (optional field on Task)
  - [ ] 5.3.2 Load positions on startup
  - [ ] 5.3.3 Regenerate layout for tasks without positions
  - **Acceptance**: Neuron positions persist across sessions

- [ ] **5.4** Handle real-time sync
  - [ ] 5.4.1 New tasks from other devices animate in
  - [ ] 5.4.2 Completed tasks from other devices cascade
  - [ ] 5.4.3 Deleted tasks dissolve
  - **Acceptance**: Multi-device sync has proper animations

---

### Phase 6: Layer System & Navigation
> Active/All/Completed views with swipe navigation

- [ ] **6.1** Create layer manager
  - [ ] 6.1.1 Create `src/components/neural/LayerManager.ts`
  - [ ] 6.1.2 Track current layer (Active, All, Completed)
  - [ ] 6.1.3 Filter visible neurons by layer
  - [ ] 6.1.4 Smooth transition animation between layers
  - **Acceptance**: Can switch layers, neurons fade in/out

- [ ] **6.2** Implement swipe navigation
  - [ ] 6.2.1 Vertical swipe detection
  - [ ] 6.2.2 Swipe up: Active → All → Completed
  - [ ] 6.2.3 Swipe down: reverse
  - [ ] 6.2.4 Momentum and snap behavior
  - **Acceptance**: Swipe changes layers with smooth transition

- [ ] **6.3** Create layer indicator
  - [ ] 6.3.1 Create `src/components/neural/LayerIndicator.tsx`
  - [ ] 6.3.2 Subtle themed indicator (glow at screen edge, or small label)
  - [ ] 6.3.3 Shows current layer name
  - [ ] 6.3.4 Fades out after inactivity
  - **Acceptance**: User knows which layer they're viewing

- [ ] **6.4** Completed layer styling
  - [ ] 6.4.1 Completed neurons are dimmed
  - [ ] 6.4.2 Slower/no pulse animation
  - [ ] 6.4.3 Connections are more transparent
  - [ ] 6.4.4 Can still tap to view details
  - **Acceptance**: Completed layer feels like archived memories

---

### Phase 7: Performance Optimization
> Handle 500+ nodes smoothly

- [ ] **7.1** Implement Level of Detail (LOD)
  - [ ] 7.1.1 Create `src/systems/rendering/LODManager.ts`
  - [ ] 7.1.2 Distant neurons use simpler geometry
  - [ ] 7.1.3 Very distant neurons become points
  - [ ] 7.1.4 Dynamic based on zoom level
  - **Acceptance**: 500 neurons render at 60fps

- [ ] **7.2** Implement clustering
  - [ ] 7.2.1 Auto-cluster distant node groups
  - [ ] 7.2.2 Cluster shows count badge
  - [ ] 7.2.3 Zoom in to expand cluster
  - **Acceptance**: Zoomed out view clusters gracefully

- [ ] **7.3** Implement edge fog
  - [ ] 7.3.1 Create `src/systems/rendering/FogSystem.ts`
  - [ ] 7.3.2 Neurons fade toward screen edges
  - [ ] 7.3.3 Sharp center, soft edges
  - [ ] 7.3.4 Fog adjusts with camera position
  - **Acceptance**: Network feels infinite, edges soft

- [ ] **7.4** Optimize render loop
  - [ ] 7.4.1 Frustum culling (don't render off-screen)
  - [ ] 7.4.2 Instanced rendering for neurons
  - [ ] 7.4.3 Throttle updates for hidden tab
  - [ ] 7.4.4 Batch connection geometry
  - **Acceptance**: Maintains 60fps with 1000 nodes

- [ ] **7.5** Memory management
  - [ ] 7.5.1 Object pooling for neurons/connections
  - [ ] 7.5.2 Dispose unused textures
  - [ ] 7.5.3 Limit particle count
  - **Acceptance**: No memory leaks after hours of use

---

### Phase 8: Customization & Sound
> Color themes, sound effects, user preferences

- [ ] **8.1** Create color system
  - [ ] 8.1.1 Create `src/utils/colorTheory.ts`
  - [ ] 8.1.2 Complementary color generation
  - [ ] 8.1.3 Analogous color schemes
  - [ ] 8.1.4 Triadic color schemes
  - [ ] 8.1.5 User override for any color
  - **Acceptance**: Multiple preset themes, full customization

- [ ] **8.2** Create color customizer UI
  - [ ] 8.2.1 Create `src/components/settings/ColorCustomizer.tsx`
  - [ ] 8.2.2 Theme presets (dark, light, cyberpunk, organic)
  - [ ] 8.2.3 Individual color pickers
  - [ ] 8.2.4 Live preview
  - [ ] 8.2.5 Save to user preferences (Firestore)
  - **Acceptance**: User can fully customize colors

- [ ] **8.3** Implement dark/light modes
  - [ ] 8.3.1 Dark mode default
  - [ ] 8.3.2 Light mode option
  - [ ] 8.3.3 Auto-detect system preference
  - [ ] 8.3.4 Smooth transition between modes
  - **Acceptance**: Both modes look polished

- [ ] **8.4** Create sound system
  - [ ] 8.4.1 Create `src/systems/audio/SoundManager.ts`
  - [ ] 8.4.2 Integrate Howler.js
  - [ ] 8.4.3 Preload all sounds
  - [ ] 8.4.4 Volume control
  - **Acceptance**: Sound system initializes, plays test sound

- [ ] **8.5** Add sound effects
  - [ ] 8.5.1 Ambient: subtle synth hum (looping)
  - [ ] 8.5.2 Add task: soft crystalline ping
  - [ ] 8.5.3 Complete task: satisfying cascade chime
  - [ ] 8.5.4 Layer switch: whoosh/transition
  - [ ] 8.5.5 Node expand: organic unfold
  - [ ] 8.5.6 All sounds subtle, not intrusive
  - **Acceptance**: All interactions have audio feedback

- [ ] **8.6** Sound settings
  - [ ] 8.6.1 Create `src/components/settings/SoundSettings.tsx`
  - [ ] 8.6.2 Master toggle (default: ON)
  - [ ] 8.6.3 Individual sound toggles
  - [ ] 8.6.4 Volume slider
  - [ ] 8.6.5 Persist preferences
  - **Acceptance**: User can customize audio experience

---

### Phase 9: Polish & Edge Cases
> Empty state, tutorials, bulk operations

- [ ] **9.1** Create empty state / tutorial
  - [ ] 9.1.1 First-time user sees single seed neuron
  - [ ] 9.1.2 Seed neuron contains tutorial prompt
  - [ ] 9.1.3 Tap seed to start first task
  - [ ] 9.1.4 Gentle guidance without being annoying
  - **Acceptance**: New user understands how to start

- [ ] **9.2** Implement bulk completion cascade
  - [ ] 9.2.1 Detect multiple completions in short window
  - [ ] 9.2.2 Chain reaction animation (domino effect)
  - [ ] 9.2.3 Staggered timing for satisfaction
  - [ ] 9.2.4 Big particle burst at end
  - **Acceptance**: Completing 5+ tasks feels amazing

- [ ] **9.3** Handle network growth milestones
  - [ ] 9.3.1 Subtle celebration at 10, 50, 100, 500 nodes
  - [ ] 9.3.2 Brief visual flourish
  - [ ] 9.3.3 Optional: save milestone screenshots
  - **Acceptance**: Growth milestones feel rewarding

- [ ] **9.4** Offline indicator
  - [ ] 9.4.1 Subtle neural-themed offline indicator
  - [ ] 9.4.2 Network slightly dims when offline
  - [ ] 9.4.3 Pulse resumes when back online
  - **Acceptance**: Offline state clear but not alarming

- [ ] **9.5** Error handling
  - [ ] 9.5.1 Firebase errors show themed toast
  - [ ] 9.5.2 Graceful degradation if WebGL fails
  - [ ] 9.5.3 Recovery from lost connections
  - **Acceptance**: Errors handled gracefully

---

### Phase 10: Testing & Deployment
> Cross-device testing, performance, deploy

- [ ] **10.1** Cross-device testing
  - [ ] 10.1.1 Desktop Chrome, Firefox, Safari, Edge
  - [ ] 10.1.2 Tablet (iPad, Android tablet)
  - [ ] 10.1.3 Phone (iPhone, Android)
  - [ ] 10.1.4 Various screen sizes
  - **Acceptance**: Works on all target devices

- [ ] **10.2** Performance profiling
  - [ ] 10.2.1 Profile with 100 nodes
  - [ ] 10.2.2 Profile with 500 nodes
  - [ ] 10.2.3 Profile with 1000 nodes
  - [ ] 10.2.4 Memory usage over time
  - [ ] 10.2.5 Fix any bottlenecks
  - **Acceptance**: 60fps on mid-range devices with 500 nodes

- [ ] **10.3** Accessibility review
  - [ ] 10.3.1 Keyboard navigation complete
  - [ ] 10.3.2 Screen reader announcements for key actions
  - [ ] 10.3.3 Reduced motion preference respected
  - [ ] 10.3.4 Color contrast sufficient
  - **Acceptance**: Basic accessibility requirements met

- [ ] **10.4** Final polish
  - [ ] 10.4.1 Remove all console.logs
  - [ ] 10.4.2 Loading state while network initializes
  - [ ] 10.4.3 Smooth page transitions
  - [ ] 10.4.4 Favicon and PWA icons updated
  - **Acceptance**: Production-ready polish

- [ ] **10.5** Deploy
  - [ ] 10.5.1 Build production bundle
  - [ ] 10.5.2 Test production build locally
  - [ ] 10.5.3 Deploy to Firebase Hosting
  - [ ] 10.5.4 Verify live site
  - [ ] 10.5.5 Monitor for errors
  - **Acceptance**: Live at production URL, no errors

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| WebGL not supported | High | Detect and show fallback message |
| Performance on mobile | Medium | Aggressive LOD, reduce particles |
| Three.js bundle size | Medium | Tree-shaking, lazy load |
| Touch vs mouse differences | Medium | Extensive cross-device testing |
| Firebase sync conflicts | Low | Existing system handles well |

---

## Success Metrics

1. **Performance**: 60fps with 500 nodes on 2-year-old phone
2. **Engagement**: User keeps app open for extended periods
3. **Satisfaction**: Completing tasks feels rewarding
4. **Adoption**: Easy for new users to understand

---

## Timeline Estimate

| Phase | Complexity |
|-------|------------|
| Phase 1: Foundation | Low |
| Phase 2: Neural Logic | Medium |
| Phase 3: Interaction | Medium |
| Phase 4: Visual Design | High |
| Phase 5: Task Integration | Low |
| Phase 6: Layer System | Medium |
| Phase 7: Performance | High |
| Phase 8: Customization | Medium |
| Phase 9: Polish | Medium |
| Phase 10: Testing | Medium |

---

*This document serves as both scope definition and development checklist. Work through tasks sequentially, testing each before proceeding.*
