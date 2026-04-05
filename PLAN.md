# Spelling Game — Implementation Plan

A Pokemon-themed spelling practice app for an 8-year-old in 2nd grade. Built for iPad landscape in a browser. Inspired by Duolingo's varied exercise approach with spaced repetition for long-term retention.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Database | Neon Postgres (prod), Docker Postgres (local dev) |
| ORM | Drizzle |
| Auth | NextAuth.js (username/password, credentials provider) |
| UI | Shadcn/ui + Tailwind CSS |
| Animations | Framer Motion |
| Text-to-Speech | OpenAI TTS API, cached to Vercel Blob Storage |
| Unit/Component Tests | Vitest + React Testing Library |
| E2E Tests | Playwright |
| Hosting | Vercel |

---

## User Roles

### Parent
- Signs up with username/password
- Creates and manages child accounts (each child has username/password, linked to parent)
- Creates, edits, and deletes word lists (paste text, upload CSV, or manual entry)
- Views progress dashboard per child (accuracy, mastery, spaced repetition status)
- Can assign a focus list to a child
- Can reset progress on a word or list
- Has a "play as [child]" preview button

### Child
- Logs in with username/password (parent sets this up)
- Sees only the game — no admin UI
- Session stays logged in indefinitely (until explicit logout)
- No tutorial — drops straight into gameplay

---

## Onboarding Flow

1. Parent creates account (username/password)
2. Parent creates one or more child profiles
3. Parent adds word lists (paste, CSV, or one-at-a-time)
4. Parent logs in as child on iPad, hands it over

---

## Core Game Loop

### Two Modes

1. **Practice Mode (default):** Spaced repetition pulls due words across all lists. This is the daily driver.
2. **Focus Mode:** Drill a specific word list (e.g. cramming before a Friday spelling test). Still tracks results for spaced repetition.

### Five Exercise Types

| Exercise | How it works | Input method |
|----------|-------------|-------------|
| **Listen & Type** | Hear the word via TTS, type it. Replay button available. | iPad keyboard |
| **Unscramble** | Scrambled letter tiles shown. Tap in correct order. Tap again to deselect. | Tap tiles |
| **Fill in the Blanks** | Word shown with 1-3 missing letters (underscores). Pick correct letter from options. | Tap letter options |
| **Multiple Choice** | Hear the word, see 4 options (1 correct + 3 plausible misspellings). Tap correct one. | Tap option |
| **Flash Memory** | Word displays for 2-3 seconds, fades out, then type it from memory. | iPad keyboard |

### Difficulty Progression

Exercise type is selected based on word mastery level:

| Tier | Mastery Level | Exercise Types |
|------|--------------|----------------|
| Tier 1 | New / Struggling | Multiple choice, Fill in the blanks |
| Tier 2 | Learning | Unscramble, Flash memory |
| Tier 3 | Nearly mastered | Listen & type |

The spaced repetition ease_factor drives which tier a word falls into.

### Wrong Answer Handling

1. First attempt wrong → hint shown, retry allowed
2. Second attempt wrong → correct spelling revealed, mistake highlighted (show which part was wrong)

---

## Spaced Repetition (SM-2 Algorithm)

Each word tracks per-child:
- `correct_count` / `incorrect_count`
- `ease_factor` (starts at 2.5, adjusts based on performance)
- `interval` (days until next review)
- `next_review_at` (timestamp)

Words due for review are prioritized. Words answered correctly get longer intervals. Words answered incorrectly reset to shorter intervals and drop to easier exercise tiers.

---

## Gamification (Pokemon Theme — Medium Level)

No actual Pokemon IP or assets. Uses Pokemon-style language and metaphors.

### Encounter Framing
- Each word is an "encounter" — "A wild word appeared!"
- Correct answer: "It's super effective!" / "You caught the spelling!"
- Wrong answer (gentle): "The word got away... Try again!"

### Progression Systems
- **XP:** Earned per correct answer. Bonus XP for first-try correct, streaks.
- **Levels:** XP thresholds to level up (with animation).
- **Streaks:** Consecutive correct answers in a session + daily login streaks.
- **Gym Badges:** Milestone rewards:
  - Master 10 words
  - Master 25 words
  - Master 50 words
  - 7-day streak
  - 30-day streak
  - Complete a full word list
  - Perfect session (all correct on first try)

### Animations (Framer Motion)
- Word encounter entrance animation
- Correct answer celebration (green flash, confetti-style)
- Level up animation
- Badge earned animation
- Streak counter increment

---

## Word Lists

### Custom Lists (Parent-Created)
- Name the list (e.g. "Week 12 - April")
- Add words via:
  - **Paste:** Into a text box, one word per line or comma-separated (parser handles both)
  - **CSV upload:** File upload, parsed client-side
  - **Manual:** Add one at a time for quick edits
- All inputs land in an editable review list before saving
- Edit and delete lists and individual words after creation

### Built-in Lists
- Pre-loaded 2nd grade word lists (Dolch sight words, common grade-level words)
- Available for extra practice without parent setup

---

## Database Schema

```
users
  id            UUID PRIMARY KEY
  username      TEXT UNIQUE NOT NULL
  password_hash TEXT NOT NULL
  role          TEXT NOT NULL ('parent' | 'child')
  parent_id     UUID REFERENCES users(id) (nullable, set for child accounts)
  created_at    TIMESTAMP

word_lists
  id            UUID PRIMARY KEY
  name          TEXT NOT NULL
  created_by    UUID REFERENCES users(id) NOT NULL
  is_builtin    BOOLEAN DEFAULT false
  created_at    TIMESTAMP

words
  id            UUID PRIMARY KEY
  word          TEXT NOT NULL
  word_list_id  UUID REFERENCES word_lists(id) NOT NULL

progress
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id) NOT NULL
  word_id         UUID REFERENCES words(id) NOT NULL
  correct_count   INTEGER DEFAULT 0
  incorrect_count INTEGER DEFAULT 0
  ease_factor     FLOAT DEFAULT 2.5
  interval        INTEGER DEFAULT 0 (days)
  next_review_at  TIMESTAMP
  UNIQUE(user_id, word_id)

sessions
  id            UUID PRIMARY KEY
  user_id       UUID REFERENCES users(id) NOT NULL
  word_list_id  UUID REFERENCES word_lists(id) (nullable, null = spaced rep mode)
  started_at    TIMESTAMP
  ended_at      TIMESTAMP (nullable)

session_results
  id            UUID PRIMARY KEY
  session_id    UUID REFERENCES sessions(id) NOT NULL
  word_id       UUID REFERENCES words(id) NOT NULL
  exercise_type TEXT NOT NULL
  correct       BOOLEAN NOT NULL
  attempt_number INTEGER NOT NULL (1 = first try, 2 = retry)
```

---

## Parent Dashboard

- **Children list:** See all linked child accounts
- **Per-child progress:**
  - Words mastered / learning / new
  - Accuracy percentage overall and per-list
  - Spaced repetition queue (what's coming up)
  - Session history with scores
  - Streak info
- **Word list management:** Create, edit, delete lists
- **Focus mode control:** Assign a list as the child's current focus
- **Reset:** Reset progress for a word or entire list
- **"Play as [child]" button:** Preview the game as the child sees it

---

## Local Development & Testing

### Local Environment
- Docker Compose with Postgres for local dev/test
- `npm run dev` for Next.js dev server
- Seed scripts for known test state:
  - Parent user + child user
  - Sample word lists
  - Some progress history (mix of mastered, learning, new words)

### Test Strategy

| Level | Tool | What it covers |
|-------|------|---------------|
| Unit | Vitest | Spaced repetition algorithm, word scrambling logic, misspelling generation, exercise type selection |
| Component | Vitest + React Testing Library | Individual UI components render correctly, respond to interactions |
| API | Vitest | Next.js API routes return correct responses, DB state updates correctly |
| E2E | Playwright | Full user flows: parent signup → create child → add word list → child login → play game → verify progress updates |

### Primary Dev Loop
```
pnpm dev             # Start Next.js dev server
pnpm playwright test # Run full E2E suite to verify everything works
pnpm test            # Run unit + component + API tests
```

---

## Infrastructure

| Service | Tier | Purpose |
|---------|------|---------|
| Vercel | Free | Hosting (Next.js) |
| Neon Postgres | Free (0.5 GB) | Production database |
| Vercel Blob Storage | Free (500 MB) | Cached TTS audio files |
| OpenAI API | Pay-as-you-go | TTS generation (~$0.01-0.10/month) |
| Docker | Local only | Local Postgres for dev/test |

Domain: `*.vercel.app` to start, custom domain later if desired.

---

## Implementation Phases

### Phase 1: Foundation
- Next.js project setup with Tailwind, Shadcn/ui, Drizzle
- Docker Compose for local Postgres
- Database schema and migrations
- NextAuth.js with credentials provider
- Seed script

### Phase 2: Parent Admin
- Parent signup/login
- Create child accounts
- Word list management (paste, CSV, manual entry)
- Built-in word lists

### Phase 3: Core Game
- Game session flow (practice mode + focus mode)
- All five exercise types
- Difficulty progression (tier selection)
- Spaced repetition algorithm (SM-2)
- OpenAI TTS integration + Vercel Blob caching

### Phase 4: Gamification
- XP and leveling system
- Streak tracking
- Gym badges / milestones
- Pokemon-themed copy and framing
- Framer Motion animations

### Phase 5: Parent Dashboard
- Per-child progress views
- Session history
- Spaced repetition queue visibility
- Focus mode assignment
- "Play as child" preview
- Reset progress

### Phase 6: Polish & Testing
- Full Playwright E2E test suite
- Unit tests for core logic
- Component tests
- iPad landscape optimization
- Touch target sizing
- Performance optimization
