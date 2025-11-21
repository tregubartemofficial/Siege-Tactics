# Product Requirements Document: Siege Tactics

**Version:** 1.0  
**Date:** November 21, 2025  
**Product Owner:** Developer  
**Business Analyst:** Mary  
**Project Type:** Browser-Based Hackathon Game  
**Development Timeline:** 5 hours

---

## 1. Executive Summary

### 1.1 Product Vision
Siege Tactics is a browser-based turn-based tactical combat game featuring medieval siege weapons on a hex-grid battlefield. Players navigate fog of war, unlock powerful siege engines through gameplay progression, and engage in strategic combat against AI opponents. The game delivers accessible tactical depth within a 5-10 minute match duration.

### 1.2 Business Objectives
- **Primary Goal:** Create a unique, playable tactical combat game within 5-hour hackathon constraint
- **Differentiation:** Stand apart from existing tank-based tactical games through medieval theme and siege weapon mechanics
- **Engagement:** Provide rewarding progression system through weapon unlocks
- **Technical Achievement:** Demonstrate hex-grid tactical engine with fog of war in browser environment

### 1.3 Success Metrics
- Game fully playable within 5-hour development window
- XP progression system functional with weapon unlock mechanics
- AI opponent provides meaningful challenge
- Fog of war and hex-grid mechanics working correctly
- Browser compatibility (Chrome minimum)

---

## 2. Product Overview

### 2.1 Target Audience
- **Primary:** Hackathon judges and tactical game enthusiasts
- **Secondary:** Casual strategy game players seeking quick tactical experiences
- **Player Profile:** Individuals who enjoy turn-based strategy, hex-grid games (Civilization, XCOM), and tactical positioning challenges

### 2.2 Core Value Proposition
"Turn-based medieval siege weapon combat on a shrinking hex battlefield—master fog of war, unlock powerful siege engines, and outmaneuver your opponent in 5-10 minute tactical battles."

### 2.3 Key Differentiators
- **Medieval Siege Theme:** Unique visual identity compared to modern/sci-fi tactical games
- **Physics-Based Projectiles:** Visible arc trajectories provide satisfying visual feedback
- **Shrinking Battlefield:** Battle royale-inspired mechanic creates urgency without turn timers
- **Browser-Native:** No installation required, instant play
- **Clear Progression:** Simple XP-based weapon unlock system

---

## 3. User Stories & Requirements

### 3.1 Core Gameplay Stories

#### Story 1: Hex-Grid Battlefield Navigation
**As a** player  
**I want to** move my siege weapon unit across a hex-grid battlefield  
**So that** I can position myself strategically for combat

**Acceptance Criteria:**
- 15x15 hex-grid battlefield renders correctly
- Player unit can be selected and moved to valid hexes
- Movement is restricted by unit movement range
- Hex-based pathfinding calculates valid paths
- Invalid moves are prevented (occupied hexes, out of range)
- Turn-based system enforces alternating player/AI actions

**Priority:** P0 (Must Have)  
**Story Points:** 8

---

#### Story 2: Fog of War Visibility
**As a** player  
**I want to** have limited visibility around my units  
**So that** the game requires tactical positioning and creates strategic uncertainty

**Acceptance Criteria:**
- Each unit has defined visibility radius (e.g., 3-4 hexes)
- Hexes outside visibility range are obscured/darkened
- Enemy units only visible when within player's visibility range
- Visibility updates dynamically as units move
- Previously explored areas may remain partially visible (or fully dark—TBD)

**Priority:** P0 (Must Have)  
**Story Points:** 5

---

#### Story 3: Weapon Attack Actions
**As a** player  
**I want to** attack enemy units with my siege weapon  
**So that** I can defeat opponents and win battles

**Acceptance Criteria:**
- Player can select "Attack" action when enemy is in range
- Each weapon type has defined range (Catapult: 4-5 hexes, Ballista: 5-6 hexes, Trebuchet: 6-8 hexes)
- Projectile visually travels in arc from attacker to target
- Hit detection calculates if attack lands
- Damage is applied to target unit (reduces health)
- Turn advances after attack completes

**Priority:** P0 (Must Have)  
**Story Points:** 8

---

#### Story 4: Three Distinct Weapon Types
**As a** player  
**I want to** use different siege weapon types with unique characteristics  
**So that** I can employ varied tactical approaches

**Acceptance Criteria:**
- **Catapult (Starter Weapon):**
  - Range: 4-5 hexes
  - Damage: Medium (e.g., 30-40)
  - Fire Rate: Medium (1 shot per turn)
  - Available from start
  
- **Ballista (Unlock at 100 XP):**
  - Range: 5-6 hexes
  - Damage: Low-Medium (e.g., 25-35)
  - Fire Rate: Fast (potential for double shot—optional stretch)
  - High accuracy
  
- **Trebuchet (Unlock at 300 XP):**
  - Range: 6-8 hexes
  - Damage: High (e.g., 50-70)
  - Fire Rate: Slow (higher cooldown—optional)
  - Devastating impact

- Each weapon has distinct visual sprite/appearance
- Weapon stats clearly communicated in UI

**Priority:** P0 (Must Have)  
**Story Points:** 13

---

#### Story 5: XP-Based Weapon Unlocks
**As a** player  
**I want to** earn XP through battles and unlock new siege weapons  
**So that** I have progression and motivation to continue playing

**Acceptance Criteria:**
- Player earns XP for destroying enemy units (e.g., 50 XP per kill)
- XP persists between battles (localStorage)
- Unlock thresholds defined:
  - Ballista unlocks at 100 XP
  - Trebuchet unlocks at 300 XP
- UI displays current XP and next unlock threshold
- Notification appears when weapon unlocked
- Player can select unlocked weapons before battle starts

**Priority:** P0 (Must Have)  
**Story Points:** 5

---

#### Story 6: PvE Combat Against AI
**As a** player  
**I want to** battle against an AI opponent  
**So that** I have a single-player tactical challenge

**Acceptance Criteria:**
- AI opponent spawns with 1-3 units on battlefield
- AI takes turn after player completes action
- AI selects valid moves (movement or attack)
- AI targets player units within range
- AI pathfinding avoids invalid moves
- Basic tactical behavior (moves toward player, attacks when able)

**Priority:** P0 (Must Have)  
**Story Points:** 8

---

#### Story 7: Shrinking Map Mechanic
**As a** player  
**I want to** see the battlefield boundary shrink over time  
**So that** matches have urgency and cannot stalemate indefinitely

**Acceptance Criteria:**
- Playable area visually indicated on battlefield
- Boundary shrinks at defined intervals (e.g., every 5 turns)
- Hexes outside boundary become invalid for movement
- Units caught outside boundary take damage per turn
- Shrinking forces players toward center engagement
- Visual warning before boundary shrinks

**Priority:** P1 (Should Have)  
**Story Points:** 5

---

#### Story 8: Victory & Defeat Conditions
**As a** player  
**I want to** know when I've won or lost a battle  
**So that** matches have clear resolution

**Acceptance Criteria:**
- Victory condition: All enemy units destroyed
- Defeat condition: All player units destroyed
- End-of-battle screen displays result (Victory/Defeat)
- XP earned shown on end screen
- Option to return to main menu or start new battle

**Priority:** P0 (Must Have)  
**Story Points:** 3

---

### 3.2 UI/UX Stories

#### Story 9: Main Menu
**As a** player  
**I want to** access game functions from a main menu  
**So that** I can start battles and view progression

**Acceptance Criteria:**
- "Start Battle" button launches new game
- Current XP total displayed
- Unlocked weapons shown with visual indicators
- Simple, clear pixel-art themed interface

**Priority:** P1 (Should Have)  
**Story Points:** 3

---

#### Story 10: Battle UI
**As a** player  
**I want to** see relevant information during combat  
**So that** I can make informed tactical decisions

**Acceptance Criteria:**
- Current turn indicator (Player/AI)
- Unit health bars visible
- Selected unit highlighted
- Available actions displayed (Move/Attack/End Turn)
- Weapon range preview when selecting attack
- XP gained during battle tracked and displayed

**Priority:** P0 (Must Have)  
**Story Points:** 5

---

### 3.3 Technical Stories

#### Story 11: Random Map Generation
**As a** developer  
**I want to** procedurally generate hex-grid maps  
**So that** each battle has varied terrain and replayability

**Acceptance Criteria:**
- Each battle generates new 15x15 hex layout
- Starting positions for player and AI randomized (with minimum distance)
- Map layout ensures valid pathfinding between all areas
- Repeatable seed system for testing (optional)

**Priority:** P1 (Should Have)  
**Story Points:** 5

---

#### Story 12: Data Persistence
**As a** system  
**I want to** save player progression locally  
**So that** XP and unlocks persist across browser sessions

**Acceptance Criteria:**
- XP total saved to localStorage
- Unlocked weapons saved to localStorage
- Data loads on game initialization
- Graceful handling if localStorage unavailable

**Priority:** P0 (Must Have)  
**Story Points:** 2

---

## 4. Functional Requirements

### 4.1 Gameplay Mechanics

#### 4.1.1 Hex-Grid System
- **Grid Size:** 15x15 hexagonal tiles
- **Coordinate System:** Cube coordinates for hex calculations
- **Pathfinding:** A* algorithm adapted for hexagonal grids
- **Movement:** Units move N hexes per turn (TBD: 3-5 hexes)

#### 4.1.2 Combat System
- **Turn Structure:** Player action → AI action → repeat
- **Action Types:** Move, Attack, End Turn
- **Damage Calculation:** Direct hit deals weapon's base damage
- **Health System:** Units have health pool (e.g., 100 HP)
- **Unit Destruction:** Unit removed when health reaches 0

#### 4.1.3 Fog of War
- **Visibility Radius:** 3-4 hexes around each unit
- **Enemy Visibility:** Only shown when in visibility range
- **Terrain Memory:** TBD—permanent vs. temporary revelation

#### 4.1.4 Weapon System
- **Starting Weapon:** Catapult (always available)
- **Unlock Progression:** Linear (Catapult → Ballista → Trebuchet)
- **Weapon Selection:** Pre-battle loadout screen
- **Stat Differentiation:** Range, damage, fire rate vary per weapon

#### 4.1.5 Progression System
- **XP Sources:** Enemy unit destruction
- **XP Amount:** 50 XP per unit destroyed (TBD based on testing)
- **Unlock Costs:**
  - Ballista: 100 XP
  - Trebuchet: 300 XP
- **Persistence:** LocalStorage-based save system

#### 4.1.6 AI Behavior
- **Decision Making:** Basic tactical AI (move toward player, attack when in range)
- **Pathfinding:** Uses same hex pathfinding as player
- **Target Selection:** Closest player unit or lowest health target
- **Weapon:** AI uses basic Catapult (TBD: scales with player progression)

#### 4.1.7 Map Shrinking
- **Trigger:** Every N turns (TBD: 5-10 turns)
- **Shrink Pattern:** Circular/hexagonal contraction toward center
- **Out-of-Bounds Penalty:** Damage per turn (e.g., 10-20 HP)
- **Visual Indicator:** Red/danger zone highlighting

---

### 4.2 User Interface Requirements

#### 4.2.1 Main Menu Screen
- Game title/logo
- "Start Battle" button
- XP display (e.g., "XP: 250/300")
- Weapon unlock status indicators
- Simple pixel-art background

#### 4.2.2 Battle Screen
- Hex-grid battlefield (primary viewport)
- Unit sprites (player and AI)
- Health bars above units
- Turn indicator (top/bottom)
- Action buttons (Move/Attack/End Turn)
- XP counter (corner display)
- Pause/Menu button

#### 4.2.3 End Battle Screen
- Victory/Defeat message
- XP earned display
- New unlock notification (if applicable)
- "Continue" button (return to menu)
- Battle stats (optional: enemies destroyed, turns taken)

#### 4.2.4 Weapon Select Screen (Pre-Battle)
- Available weapons displayed
- Locked weapons shown with unlock requirements
- Select button for unlocked weapons
- Weapon stat comparison

---

### 4.3 Visual & Audio Requirements

#### 4.3.1 Art Style
- **Theme:** Medieval pixel art, isometric perspective
- **Sprites:** Siege weapons (Catapult, Ballista, Trebuchet)
- **Battlefield:** Hex tiles with grass/dirt texture
- **Effects:** Projectile arcs, impact explosions, fog overlay
- **UI:** Medieval-themed buttons and panels

#### 4.3.2 Visual Effects
- Projectile trajectory animation
- Impact effects on hit
- Unit selection highlight
- Movement path preview
- Damage numbers (optional)
- Fog of war gradient/overlay

#### 4.3.3 Audio (Stretch Goal—NOT P0)
- Sound effects deferred for MVP
- Focus on visual-only experience for hackathon timeline

---

### 4.4 Technical Requirements

#### 4.4.1 Platform
- **Target:** Web browsers (Chrome minimum)
- **Responsive:** Desktop-optimized (mobile stretch goal)
- **Performance:** 60fps target on modern hardware

#### 4.4.2 Technology Stack
- **Frontend:** TypeScript (recommended)
- **Rendering:** Canvas 2D or WebGL (Three.js potential)
- **Hex Library:** Red Blob Games hex algorithms or similar
- **Build Tool:** Vite, Webpack, or Parcel
- **State Management:** Simple state object or reactive system (TBD)

#### 4.4.3 Data Storage
- **Local Storage:** XP and unlock state
- **No Backend:** Fully client-side for MVP
- **Session State:** In-memory during active battle

#### 4.4.4 Browser Compatibility
- **Primary:** Chrome (latest)
- **Secondary:** Firefox, Safari, Edge (best effort)
- **No IE Support**

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load time under 3 seconds
- Smooth animations (60fps)
- Responsive input handling (<100ms)
- Efficient fog of war calculations

### 5.2 Usability
- Intuitive controls (click/tap to select and move)
- Clear visual feedback for actions
- Minimal learning curve (<2 minutes to understand)
- No tutorial required for basic gameplay (self-evident mechanics)

### 5.3 Accessibility
- Colorblind-friendly palette (future consideration)
- Clear contrast for fog of war
- Readable text sizes

### 5.4 Scalability
- Codebase structured for future multiplayer addition
- Weapon system extensible for additional types
- Map generation parameterized for different sizes

### 5.5 Maintainability
- Clean code architecture
- Comments for complex algorithms (hex math, pathfinding)
- Modular component structure

---

## 6. Constraints & Assumptions

### 6.1 Constraints
- **Time:** 5-hour development window
- **Scope:** Single-player PvE only (no multiplayer)
- **Audio:** No sound effects or music in MVP
- **Art:** Simple pixel art, minimal animation frames
- **Testing:** Manual testing only (no automated tests)

### 6.2 Assumptions
- Developer has TypeScript/JavaScript proficiency
- Hex-grid library or reference algorithms available
- Pixel art assets can be created or sourced quickly
- LocalStorage available in target browsers
- Single developer working solo

### 6.3 Out of Scope (MVP)
- Multiplayer PvP
- Sound effects and music
- Tutorial mode
- Multiple map types or biomes
- Advanced AI behaviors (flanking, defensive positioning)
- Weapon upgrade system (vertical progression)
- Melee weapon types (Ram)
- Terrain destruction
- Weather effects
- Mobile-specific optimizations

---

## 7. Risks & Mitigation

### 7.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Hex-grid math complexity exceeds timeline | High | Medium | Use proven library (Red Blob Games reference), pre-test coordinate system |
| Fog of war performance issues | Medium | Low | Optimize visibility calculations, limit battlefield size to 15x15 |
| AI pathfinding bugs | High | Medium | Use well-tested A* implementation, add fallback simple movement |
| Projectile physics calculations difficult | Medium | Low | Use simple parabolic equations, sacrifice realism for speed |
| Browser compatibility issues | Low | Low | Test in Chrome only for hackathon, document known issues |

### 7.2 Scope Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Feature creep extends beyond 5 hours | High | High | Strict prioritization (P0 only), timeboxing per feature, eliminate stretch goals proactively |
| Art asset creation takes too long | Medium | Medium | Use placeholder sprites initially, simplify art style, generate with tools if needed |
| Weapon balancing requires extensive testing | Medium | Medium | Use predefined stat templates, skip deep balancing for MVP |

### 7.3 User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Fog of war too confusing without tutorial | Medium | Medium | Ensure clear visual distinction, add simple text tooltip on first launch |
| AI too easy or too hard | Medium | High | Quick playtest after basic AI implementation, adjust aggression/decision making |
| Shrinking map feels unfair | Low | Low | Add warning system, generous timing, visual indicators |

---

## 8. Success Criteria & Acceptance

### 8.1 MVP Definition of Done
The product is considered complete for hackathon submission when:

✅ **Core Gameplay:**
- [x] 15x15 hex-grid battlefield renders
- [x] Player can move unit on hex grid
- [x] Player can attack AI unit with projectile animation
- [x] Fog of war limits visibility
- [x] AI opponent moves and attacks player
- [x] Victory/defeat conditions trigger correctly

✅ **Weapon System:**
- [x] Three weapon types (Catapult, Ballista, Trebuchet) implemented
- [x] Each weapon has distinct stats (range, damage)
- [x] Weapon selection available pre-battle

✅ **Progression:**
- [x] XP system awards points for enemy destruction
- [x] XP persists via localStorage
- [x] Weapon unlocks trigger at thresholds
- [x] UI displays XP and unlock status

✅ **Polish:**
- [x] Main menu functional
- [x] Battle UI shows relevant information
- [x] End-of-battle screen displays results
- [x] Game runs in Chrome without crashes

### 8.2 Stretch Goal Success
If time permits, these add significant value:

⭐ Shrinking map mechanic implemented  
⭐ Random map generation per battle  
⭐ Enhanced visual effects (particle systems, impact animations)  
⭐ Mobile responsive design  
⭐ Multiple AI units per battle

### 8.3 Demo Readiness
For hackathon presentation:
- Game loads and starts within 5 seconds
- Core gameplay loop demonstrable (3-5 minute battle)
- XP system visible and functional
- At least one weapon unlock achievable during demo
- No critical bugs during typical gameplay

---

## 9. Timeline & Milestones

### Hour 1: Foundation
- Project setup (TypeScript, build tool, file structure)
- Hex-grid coordinate system implemented
- Basic rendering (hexes visible)
- Unit placement on grid

### Hour 2: Core Mechanics
- Movement system (pathfinding, turn-based)
- Attack action (projectile launch, hit detection)
- Basic damage and health system
- AI opponent (simple movement and attack)

### Hour 3: Weapon Variety
- Implement three weapon types with distinct stats
- Weapon selection UI
- Sprite differentiation per weapon
- Fog of war system

### Hour 4: Progression & UI
- XP system implementation
- LocalStorage persistence
- Main menu screen
- Battle UI elements
- End-of-battle screen

### Hour 5: Polish & Testing
- Victory/defeat logic
- Visual effects (projectile arcs, impacts)
- Bug fixes and playtesting
- Shrinking map (if time allows)
- Final integration testing

---

## 10. Future Roadmap (Post-Hackathon)

### Phase 2: Enhanced Single-Player (10-15 hours)
- Advanced AI behaviors (flanking, defensive positioning)
- Multiple difficulty levels
- Campaign mode with progressive challenges
- Additional weapon types (Ram/melee unit)
- Terrain destruction mechanics
- Enhanced visual effects and animations

### Phase 3: Multiplayer (20-30 hours)
- WebSocket-based real-time PvP
- Matchmaking system
- Backend server (Node.js/Go)
- Lobby and game rooms
- Spectator mode

### Phase 4: Content Expansion (30-50 hours)
- Asymmetric factions with unique units
- Multiple map types and biomes
- Weather system affecting gameplay
- Upgrade paths for weapons
- Achievements and leaderboards
- Mobile-optimized version

---

## 11. Appendices

### 11.1 Glossary
- **Hex-Grid:** Hexagonal tile-based game board using cube coordinate system
- **Fog of War:** Limited visibility mechanic hiding unexplored or distant areas
- **Zone of Control:** Area of influence around units affecting enemy movement
- **XP (Experience Points):** Progression currency earned through gameplay
- **PvE:** Player vs. Environment (AI opponent)
- **MVP:** Minimum Viable Product (core features only)

### 11.2 References
- Brainstorming Session Results (November 21, 2025)
- Red Blob Games: Hexagonal Grids (hexagonal grid mathematics)
- Tank Ops (reference game for core mechanics)
- Civilization VI (hex-grid and fog of war reference)

### 11.3 Contact Information
- **Product Owner:** Developer
- **Business Analyst:** Mary
- **Project Repository:** E:\Projects\AI-driven Hackathon '25

---

**Document Status:** Draft v1.0  
**Last Updated:** November 21, 2025  
**Next Review:** Post-development retrospective

---

*This PRD created using BMAD-METHOD™ product management framework*
