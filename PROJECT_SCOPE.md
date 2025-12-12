# Project Scope: Before I Forget

> A cross-platform, offline-capable todo list application with real-time sync

---

## Overview

### Problem Statement
Users with ADHD often lose track of tasks when new ideas interrupt their current work. They need a frictionless way to capture tasks instantly without breaking their flow, then manage those tasks effectively.

### Solution
A Progressive Web App (PWA) that provides:
- **Quick task entry** - Minimal friction to add tasks
- **Cross-platform access** - Works on desktop, mobile, tablet (Windows, iOS)
- **Offline support** - Works without internet, syncs when connected
- **Real-time sync** - Changes appear instantly across all devices
- **Beautiful UI** - Smooth animations and polished experience

### Success Criteria
- [ ] Working application deployed and accessible
- [ ] Can add tasks in under 2 seconds
- [ ] Works offline and syncs correctly
- [ ] Runs on all target platforms (Windows desktop, iOS mobile/tablet)

---

## Architecture

### Tech Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend | React 18 + TypeScript | Type safety, large ecosystem, excellent PWA support |
| Styling | Tailwind CSS | Rapid development, small bundle, highly customizable |
| Animations | Framer Motion | Best-in-class React animations |
| Build | Vite + vite-plugin-pwa | Fast builds, native PWA support |
| Auth | Firebase Authentication | Free tier, Google + magic link built-in |
| Database | Firestore | Real-time sync, offline persistence, generous free tier |
| Hosting | Firebase Hosting | Free, automatic SSL, global CDN |
| CI/CD | GitHub Actions | Auto-deploy on push, free for public repos |
| Testing | Vitest + Playwright + RTL | Fast unit tests, reliable E2E |

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (PWA)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React UI  │  │   Service   │  │   IndexedDB         │  │
│  │   + Framer  │  │   Worker    │  │   (Offline Cache)   │  │
│  │   Motion    │  │             │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────┼───────────────────────────────────┐
│                     FIREBASE                                 │
├──────────────────────────┼───────────────────────────────────┤
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────────────┐  │
│  │  Firebase   │  │  Firestore  │  │  Firebase           │  │
│  │  Auth       │  │  Database   │  │  Hosting            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

```typescript
interface Task {
  id: string;              // Firestore document ID
  content: string;         // Task text (required)
  completed: boolean;      // Completion status
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];         // Optional categorization
  dueDate?: Timestamp;     // Optional deadline
  sortOrder: number;       // For manual ordering
  createdAt: Timestamp;    // Auto-set on creation
  updatedAt: Timestamp;    // Auto-set on update
  userId: string;          // Owner (from auth)
}

interface User {
  uid: string;             // Firebase Auth UID
  email: string;
  displayName?: string;
  photoURL?: string;
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tasks/{taskId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

---

## Development Phases & Checklist

### Phase 1: Project Foundation

#### 1.1 Project Setup

- [ ] **1.1.1** Initialize Vite project with React + TypeScript template
  ```bash
  npm create vite@latest before-i-forget -- --template react-ts
  ```
  - *Acceptance: Project runs with `npm run dev`*

- [ ] **1.1.2** Install and configure Tailwind CSS
  - Install tailwindcss, postcss, autoprefixer
  - Create tailwind.config.js
  - Add Tailwind directives to index.css
  - *Acceptance: Tailwind classes work in components*

- [ ] **1.1.3** Install Framer Motion for animations
  ```bash
  npm install framer-motion
  ```
  - *Acceptance: Package in dependencies*

- [ ] **1.1.4** Set up project folder structure
  ```
  src/
  ├── components/
  │   ├── ui/
  │   ├── tasks/
  │   └── layout/
  ├── hooks/
  ├── services/
  ├── types/
  ├── utils/
  └── pages/
  ```
  - *Acceptance: Folders created with index.ts exports*

- [ ] **1.1.5** Configure TypeScript strict mode and path aliases
  - Enable strict mode in tsconfig.json
  - Add `@/*` path alias for `src/*`
  - *Acceptance: Imports like `@/components` work*

- [ ] **1.1.6** Create .env.example template file
  - Document all required environment variables
  - *Acceptance: File exists with Firebase config placeholders*

#### 1.2 Firebase Setup

- [ ] **1.2.1** Create Firebase project in console *(USER ACTION)*
  - Go to console.firebase.google.com
  - Create new project named "before-i-forget"
  - *Acceptance: Project visible in Firebase console*

- [ ] **1.2.2** Enable Firestore database *(USER ACTION)*
  - Create Firestore in production mode
  - *Acceptance: Firestore accessible in console*

- [ ] **1.2.3** Enable Firebase Authentication *(USER ACTION)*
  - Enable Google sign-in provider
  - Enable Email link (passwordless) provider
  - Add authorized domains
  - *Acceptance: Auth providers show as enabled*

- [ ] **1.2.4** Install Firebase SDK
  ```bash
  npm install firebase
  ```
  - *Acceptance: Package in dependencies*

- [ ] **1.2.5** Create firebase.ts config file
  - Initialize Firebase app
  - Export auth, db instances
  - *Acceptance: No console errors on import*

- [ ] **1.2.6** Set up Firestore security rules
  - Deploy user-scoped read/write rules
  - *Acceptance: Rules deployed, shown in console*

#### 1.3 PWA Configuration

- [ ] **1.3.1** Install vite-plugin-pwa
  ```bash
  npm install -D vite-plugin-pwa
  ```
  - *Acceptance: Package in devDependencies*

- [ ] **1.3.2** Create manifest.json with app metadata
  - App name: "Before I Forget"
  - Short name: "BIF"
  - Description, theme colors
  - Start URL, display mode (standalone)
  - *Acceptance: Manifest loads without errors*

- [ ] **1.3.3** Generate app icons (all required sizes)
  - 192x192, 512x512 minimum
  - Maskable icon variant
  - *Acceptance: Icons in public/icons/, referenced in manifest*

- [ ] **1.3.4** Configure service worker for offline caching
  - Configure workbox in vite.config.ts
  - Cache app shell and assets
  - *Acceptance: App loads offline after first visit*

- [ ] **1.3.5** Enable Firestore offline persistence
  - Call enableIndexedDbPersistence()
  - Handle multi-tab errors gracefully
  - *Acceptance: Data persists when offline*

#### 1.4 CI/CD Pipeline

- [ ] **1.4.1** Create GitHub repository *(USER ACTION)*
  - Create repo: `before-i-forget`
  - Initialize repo, push initial code
  - *Acceptance: Code visible on GitHub*

- [ ] **1.4.2** Set up GitHub Actions workflow file
  - Create `.github/workflows/deploy.yml`
  - Build on push to main
  - *Acceptance: Workflow file exists*

- [ ] **1.4.3** Configure Firebase Hosting
  - Run `firebase init hosting`
  - Set public directory to `dist`
  - *Acceptance: firebase.json configured*

- [ ] **1.4.4** Add Firebase deploy token to GitHub secrets *(USER ACTION)*
  - Generate token with `firebase login:ci`
  - Add as FIREBASE_TOKEN secret
  - *Acceptance: Secret visible in repo settings*

- [ ] **1.4.5** Test auto-deploy on push
  - Push a commit, verify deployment
  - *Acceptance: Site live at Firebase URL*

---

### Phase 2: Authentication

#### 2.1 Auth Service Layer

- [ ] **2.1.1** Create auth types/interfaces
  - AuthUser type
  - AuthState type (user, loading, error)
  - *Acceptance: Types exported from types/auth.ts*

- [ ] **2.1.2** Implement Google sign-in function
  - Use signInWithPopup with GoogleAuthProvider
  - Handle errors gracefully
  - *Acceptance: Function works in browser console*

- [ ] **2.1.3** Implement magic link send function
  - Use sendSignInLinkToEmail
  - Store email in localStorage for verification
  - Configure actionCodeSettings
  - *Acceptance: Email received with sign-in link*

- [ ] **2.1.4** Implement magic link verification function
  - Use isSignInWithEmailLink + signInWithEmailLink
  - Retrieve email from localStorage
  - Clear localStorage after success
  - *Acceptance: User signed in after clicking link*

- [ ] **2.1.5** Implement sign-out function
  - Use signOut from Firebase
  - *Acceptance: User logged out, auth state cleared*

- [ ] **2.1.6** Create auth state listener
  - Use onAuthStateChanged
  - Update state on auth changes
  - *Acceptance: State updates on login/logout*

#### 2.2 Auth UI Components

- [ ] **2.2.1** Create AuthContext provider
  - Provide user, loading, error state
  - Provide auth functions
  - *Acceptance: Context wraps app in main.tsx*

- [ ] **2.2.2** Create useAuth hook
  - Consume AuthContext
  - Throw if used outside provider
  - *Acceptance: Hook returns auth state and functions*

- [ ] **2.2.3** Build Login page component
  - Clean, centered layout
  - App branding/logo: "Before I Forget"
  - *Acceptance: Page renders at /login route*

- [ ] **2.2.4** Build Google sign-in button
  - Google branding guidelines
  - Loading state while authenticating
  - *Acceptance: Button triggers Google popup*

- [ ] **2.2.5** Build magic link email form
  - Email input with validation
  - Submit button
  - Success message after sending
  - *Acceptance: Form sends magic link email*

- [ ] **2.2.6** Build magic link verification page
  - Handle /auth/verify route
  - Show loading while verifying
  - Redirect to app on success
  - Show error on failure
  - *Acceptance: Clicking email link logs user in*

- [ ] **2.2.7** Create protected route wrapper
  - Redirect to /login if not authenticated
  - Show loading while checking auth
  - *Acceptance: Unauthenticated users can't access app*

- [ ] **2.2.8** Add loading/error states
  - Auth loading spinner
  - Error toast/message display
  - *Acceptance: Users see feedback during auth operations*

---

### Phase 3: Core Todo Functionality

#### 3.1 Data Layer

- [ ] **3.1.1** Define Task TypeScript interface
  - All fields from data model
  - Export from types/task.ts
  - *Acceptance: Type used in services*

- [ ] **3.1.2** Create Firestore collection structure
  - Collection: `tasks`
  - Document ID: auto-generated
  - *Acceptance: Collection visible in Firestore console*

- [ ] **3.1.3** Implement addTask function
  - Accept content string (minimum)
  - Auto-set createdAt, updatedAt, userId
  - Default completed to false
  - Return new task ID
  - *Acceptance: Task appears in Firestore*

- [ ] **3.1.4** Implement getTasks function (real-time listener)
  - Query tasks where userId == current user
  - Order by sortOrder, then createdAt
  - Return unsubscribe function
  - *Acceptance: Tasks update in real-time*

- [ ] **3.1.5** Implement updateTask function
  - Accept task ID and partial update
  - Auto-update updatedAt
  - *Acceptance: Task updates in Firestore*

- [ ] **3.1.6** Implement deleteTask function
  - Accept task ID
  - Hard delete from Firestore
  - *Acceptance: Task removed from Firestore*

- [ ] **3.1.7** Implement toggleComplete function
  - Accept task ID
  - Toggle completed boolean
  - Update updatedAt
  - *Acceptance: Completed status toggles*

#### 3.2 Task Hooks

- [ ] **3.2.1** Create useTasks hook with real-time sync
  - Subscribe to getTasks on mount
  - Unsubscribe on unmount
  - Return tasks, loading, error
  - *Acceptance: Components receive live task data*

- [ ] **3.2.2** Add optimistic updates for responsiveness
  - Update local state immediately
  - Revert on error
  - *Acceptance: UI feels instant*

- [ ] **3.2.3** Handle loading and error states
  - isLoading boolean
  - error object with message
  - *Acceptance: States available to consumers*

#### 3.3 Core UI Components

- [ ] **3.3.1** Create base UI components (Button, Input, Checkbox)
  - Consistent styling with Tailwind
  - Proper accessibility (labels, focus states)
  - *Acceptance: Components render correctly*

- [ ] **3.3.2** Build TaskInput component (quick add)
  - Text input for task content
  - Enter key to submit
  - Clear after submit
  - Auto-focus option
  - *Acceptance: Can add tasks via input*

- [ ] **3.3.3** Build TaskItem component
  - Display task content
  - Checkbox for completion
  - Visual completed state (strikethrough)
  - Delete button
  - Edit trigger
  - *Acceptance: Task displays all info*

- [ ] **3.3.4** Build TaskList component
  - Map over tasks array
  - Handle empty state
  - *Acceptance: All tasks render in list*

- [ ] **3.3.5** Build main App layout
  - Header with logo ("Before I Forget") and user menu
  - TaskInput at top
  - TaskList below
  - *Acceptance: Full app layout visible*

- [ ] **3.3.6** Implement add task flow
  - Type in TaskInput
  - Press Enter
  - Task appears in list
  - *Acceptance: End-to-end add works*

- [ ] **3.3.7** Implement complete task flow
  - Click checkbox
  - Task shows as completed
  - *Acceptance: End-to-end complete works*

- [ ] **3.3.8** Implement delete task flow
  - Click delete button
  - Confirmation (optional)
  - Task removed from list
  - *Acceptance: End-to-end delete works*

- [ ] **3.3.9** Implement edit task flow (inline editing)
  - Click task text or edit button
  - Text becomes editable
  - Enter or blur to save
  - Escape to cancel
  - *Acceptance: End-to-end edit works*

---

### Phase 4: Organization Features

#### 4.1 Priority System

- [ ] **4.1.1** Add priority field to Task interface
  - Optional field: 'low' | 'medium' | 'high'
  - *Acceptance: Type updated*

- [ ] **4.1.2** Create PrioritySelector component
  - Dropdown or button group
  - Visual indicators (colors)
  - *Acceptance: Component selects priority*

- [ ] **4.1.3** Add priority indicator to TaskItem
  - Color-coded badge or border
  - *Acceptance: Priority visible on tasks*

- [ ] **4.1.4** Implement priority filtering
  - Filter to show only selected priority
  - *Acceptance: Filter works correctly*

- [ ] **4.1.5** Add priority-based sorting option
  - High → Medium → Low order
  - *Acceptance: Tasks sort by priority*

#### 4.2 Tags/Categories

- [ ] **4.2.1** Add tags field to Task interface
  - Optional string array
  - *Acceptance: Type updated*

- [ ] **4.2.2** Create TagInput component
  - Add tags by typing and pressing Enter/comma
  - Remove tags by clicking X
  - *Acceptance: Can add/remove tags*

- [ ] **4.2.3** Create TagBadge component
  - Pill-style display
  - Optional color coding
  - *Acceptance: Tags display nicely*

- [ ] **4.2.4** Display tags on TaskItem
  - Show tag badges inline
  - *Acceptance: Tags visible on tasks*

- [ ] **4.2.5** Implement filter by tag
  - Click tag to filter
  - Multi-tag filter support
  - *Acceptance: Filter works correctly*

#### 4.3 Due Dates

- [ ] **4.3.1** Add dueDate field to Task interface
  - Optional Timestamp
  - *Acceptance: Type updated*

- [ ] **4.3.2** Create DatePicker component
  - Calendar popup or native input
  - Clear date option
  - *Acceptance: Can select dates*

- [ ] **4.3.3** Display due date on TaskItem
  - Human-readable format
  - Relative time (e.g., "Tomorrow")
  - *Acceptance: Date visible on tasks*

- [ ] **4.3.4** Add overdue visual indicator
  - Red highlight if past due and not completed
  - *Acceptance: Overdue tasks stand out*

- [ ] **4.3.5** Implement sort by due date
  - Nearest due first
  - No date at end
  - *Acceptance: Tasks sort by date*

#### 4.4 Search & Filter

- [ ] **4.4.1** Create SearchBar component
  - Text input with search icon
  - Clear button
  - *Acceptance: Component renders*

- [ ] **4.4.2** Implement text search filtering
  - Filter tasks where content includes query
  - Case-insensitive
  - *Acceptance: Search filters tasks*

- [ ] **4.4.3** Create FilterPanel component
  - Status filter (all/active/completed)
  - Priority filter
  - Tag filter
  - Date filter (overdue/today/this week)
  - *Acceptance: Panel shows all filter options*

- [ ] **4.4.4** Combine filters (status + priority + tags + date)
  - Filters apply additively (AND logic)
  - *Acceptance: Multiple filters work together*

- [ ] **4.4.5** Add clear filters action
  - Reset all filters button
  - *Acceptance: Clears all active filters*

#### 4.5 Drag and Drop

- [ ] **4.5.1** Install dnd-kit library
  ```bash
  npm install @dnd-kit/core @dnd-kit/sortable
  ```
  - *Acceptance: Package in dependencies*

- [ ] **4.5.2** Add sortOrder field to Task interface
  - Number field for ordering
  - *Acceptance: Type updated*

- [ ] **4.5.3** Implement drag-and-drop on TaskList
  - Drag handle on TaskItem
  - Visual feedback while dragging
  - *Acceptance: Can reorder tasks by dragging*

- [ ] **4.5.4** Persist new order to Firestore
  - Update sortOrder on drop
  - Batch update for efficiency
  - *Acceptance: Order persists after refresh*

---

### Phase 5: Offline & Sync

#### 5.1 Offline Support

- [ ] **5.1.1** Verify Firestore offline persistence works
  - Test adding task while offline
  - Verify it syncs when back online
  - *Acceptance: Offline changes sync correctly*

- [ ] **5.1.2** Create useOnlineStatus hook
  - Use navigator.onLine
  - Listen to online/offline events
  - *Acceptance: Hook returns current status*

- [ ] **5.1.3** Build OfflineIndicator component
  - Banner or icon when offline
  - *Acceptance: User knows when offline*

- [ ] **5.1.4** Show sync status feedback
  - "Syncing..." indicator
  - "All changes saved" confirmation
  - *Acceptance: User knows sync status*

- [ ] **5.1.5** Test offline → online sync flow
  - Make changes offline
  - Go online
  - Verify sync
  - *Acceptance: All scenarios work*

---

### Phase 6: Polish & Animations

#### 6.1 Animations

- [ ] **6.1.1** Add task enter/exit animations
  - Fade + slide in on add
  - Fade + slide out on delete
  - *Acceptance: Smooth add/remove transitions*

- [ ] **6.1.2** Add checkbox completion animation
  - Checkmark draw animation
  - Strikethrough animation on text
  - *Acceptance: Satisfying completion feel*

- [ ] **6.1.3** Add drag-and-drop animations
  - Lift effect on drag start
  - Smooth position transitions
  - *Acceptance: Dragging feels polished*

- [ ] **6.1.4** Add page transition animations
  - Login → App transition
  - *Acceptance: Page changes feel smooth*

- [ ] **6.1.5** Add button/input micro-interactions
  - Hover states
  - Press states
  - Focus animations
  - *Acceptance: Interactive elements feel responsive*

#### 6.2 UI Polish

- [ ] **6.2.1** Responsive design (mobile/tablet/desktop)
  - Mobile-first approach
  - Breakpoints for tablet/desktop
  - *Acceptance: Looks good on all screen sizes*

- [ ] **6.2.2** Dark mode support
  - System preference detection
  - Manual toggle
  - Persist preference
  - *Acceptance: Dark mode works correctly*

- [ ] **6.2.3** Keyboard shortcuts (add task, navigation)
  - `Ctrl/Cmd + N` to focus task input
  - `Escape` to close modals
  - *Acceptance: Shortcuts work as expected*

- [ ] **6.2.4** Empty state illustrations
  - Friendly message when no tasks
  - *Acceptance: Empty state looks good*

- [ ] **6.2.5** Loading skeletons
  - Placeholder UI while loading
  - *Acceptance: No layout shift on load*

---

### Phase 7: Testing

#### 7.1 Unit Tests

- [ ] **7.1.1** Set up Vitest configuration
  - Configure in vite.config.ts
  - Add test scripts to package.json
  - *Acceptance: `npm test` runs*

- [ ] **7.1.2** Test task service functions
  - addTask, updateTask, deleteTask
  - Mock Firestore
  - *Acceptance: All service tests pass*

- [ ] **7.1.3** Test auth service functions
  - signInWithGoogle, sendMagicLink, etc.
  - Mock Firebase Auth
  - *Acceptance: All auth tests pass*

- [ ] **7.1.4** Test utility functions
  - Any helper functions
  - *Acceptance: All utility tests pass*

#### 7.2 Component Tests

- [ ] **7.2.1** Set up React Testing Library
  - Install @testing-library/react
  - Configure with Vitest
  - *Acceptance: Component tests run*

- [ ] **7.2.2** Test TaskInput component
  - Renders correctly
  - Calls onAdd with input value
  - Clears after submit
  - *Acceptance: All TaskInput tests pass*

- [ ] **7.2.3** Test TaskItem component
  - Renders task content
  - Calls onToggle when checkbox clicked
  - Calls onDelete when delete clicked
  - *Acceptance: All TaskItem tests pass*

- [ ] **7.2.4** Test TaskList component
  - Renders list of tasks
  - Shows empty state
  - *Acceptance: All TaskList tests pass*

- [ ] **7.2.5** Test auth components
  - Login page renders
  - Auth buttons trigger correct functions
  - *Acceptance: All auth component tests pass*

#### 7.3 E2E Tests

- [ ] **7.3.1** Set up Playwright
  - Install playwright
  - Configure playwright.config.ts
  - *Acceptance: `npm run test:e2e` runs*

- [ ] **7.3.2** Test auth flow (login/logout)
  - Visit app → redirected to login
  - Sign in → redirected to app
  - Sign out → redirected to login
  - *Acceptance: Auth E2E tests pass*

- [ ] **7.3.3** Test add/complete/delete task flow
  - Add a task → appears in list
  - Complete task → shows completed
  - Delete task → removed from list
  - *Acceptance: Task CRUD E2E tests pass*

- [ ] **7.3.4** Test offline functionality
  - Add task offline
  - Go online
  - Verify sync
  - *Acceptance: Offline E2E test passes*

- [ ] **7.3.5** Test PWA installation
  - Visit app
  - Install prompt appears (or manual)
  - App installs correctly
  - *Acceptance: PWA installs and runs*

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Firebase free tier exceeded | Low | Medium | Monitor usage; upgrade if needed |
| PWA issues on iOS Safari | Medium | Medium | Test thoroughly; provide fallback |
| Offline sync conflicts | Medium | Low | Last-write-wins; tasks are simple |
| Scope creep | High | High | Stick to phases; defer extras to Phase 8+ |
| Auth edge cases | Medium | Medium | Handle all error states |

---

## Future Enhancements (Post-MVP)

- [ ] Voice input for tasks
- [ ] Browser extension for quick capture
- [ ] Recurring tasks
- [ ] Subtasks/checklists
- [ ] Collaboration/sharing
- [ ] Calendar integration
- [ ] API for third-party integrations
- [ ] Widget for mobile home screen

---

## Workflow

1. Work through tasks sequentially (1.1.1 → 1.1.2 → etc.)
2. Each task marked complete only when acceptance criteria met
3. User tests when applicable
4. Commit after each logical unit of work
5. Deploy automatically on push to main

---

*Document created: Phase 1 ready to begin*
