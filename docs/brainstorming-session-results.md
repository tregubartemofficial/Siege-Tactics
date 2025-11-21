# Brainstorming Session Results

**Session Date:** November 21, 2025  
**Facilitator:** Business Analyst Mary  
**Participant:** Developer

---

## Executive Summary

**Topic:** Browser-based hackathon game design - Medieval siege weapon tactics on hex grid

**Session Goals:** 
- Define unique game concept different from existing tank-based games
- Design core mechanics feasible within 5-hour development constraint
- Create reward/progression system meeting hackathon requirements
- Establish clear scope for MVP delivery

**Techniques Used:** 
1. Analogical Thinking (15 min) - Theme exploration
2. SCAMPER Method (25 min) - Core concept transformation

**Total Ideas Generated:** 25+ concepts across theme, mechanics, progression, and scope

**Key Themes Identified:**
- Medieval warfare provides unique visual identity vs modern tank games
- Hex-grid + fog of war creates strategic depth
- Weapon variety through distinct siege equipment types
- Shrinking map adds urgency without turn timers
- XP-based weapon unlock system provides clear progression

---

## Technique Sessions

### Technique 1: Analogical Thinking - 15 minutes

**Description:** Finding inspiration by comparing the game concept to other systems and real-world scenarios that share similar mechanics (positioning, limited visibility, turn-based decisions, confrontation).

**Ideas Generated:**

1. **Submarine warfare** - Sonar pings revealing limited information
2. **Ninja duels** - Stealth combat with shadow mechanics
3. **Heist scenarios** - Thieves vs guards asymmetric gameplay
4. **Gladiatorial combat** - Arena-based weapon variety
5. **Civilization 6 influence** - Hex grids with fog of war and strategic positioning
6. **Tank Ops reference** - Turn-based multiplayer combat foundation

**Insights Discovered:**
- "Persons moves" theme felt less visually clear than mechanical units
- Stealth/ninja concept risked being too complex for pixel art readability
- Medieval siege weapons emerged as sweet spot: visually distinct, mechanically clear, pixel-art friendly
- Original tank concept's strength was its clarity and simplicity

**Notable Connections:**
- Civ 6's hex-grid system + Tank Ops' combat = perfect fusion for this concept
- Medieval theme differentiates from Tank Ops while maintaining mechanical clarity
- Siege weapons naturally create weapon variety without complex systems

---

### Technique 2: SCAMPER Method - 25 minutes

**Description:** Systematically transforming the core concept through Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, and Reverse/Rearrange.

**Ideas Generated:**

**S - Substitute:**
1. **Mech suits** instead of tanks
2. **Siege weapons** (catapults, ballistas, trebuchets) - SELECTED
3. **Robots/mechs** with customization
4. **Battle cars** Mad Max style
5. **Steampunk hybrid** - siege mechs

**C - Combine:**
6. Terrain destruction mechanics
7. Weather effects on projectiles
8. Resource gathering during combat
9. Mid-battle construction
10. *(Eliminated for scope)*

**A - Adapt:**
11. **Zone of control** from Civ 6 - SELECTED
12. **Projectile physics** with arc trajectories - SELECTED
13. Chess-like movement patterns
14. Card-based deck building
15. Friendly fire mechanics

**M - Modify:**
16. **15x15 hex map** size - SELECTED
17. **3 weapon types** (streamlined) - SELECTED
18. **2-3 units per player** maximum
19. Enhanced fog of war mechanics
20. Quick match duration (5-10 minutes)

**P - Put to other uses:**
21. Target practice PvE mode
22. Puzzle challenges
23. Training tutorial
24. *(Focused on PvE combat only)*

**E - Eliminate:**
25. Turn timer removed - manual turn control
26. Multiplayer deferred - PvE only for MVP
27. Tutorial mode removed
28. **Sound effects eliminated** - visual focus
29. Complex currency system - XP only

**R - Reverse/Rearrange:**
30. **Shrinking map mechanic** (battle royale style) - SELECTED
31. Random map generation - SELECTED

**Insights Discovered:**
- Scope management critical for 5-hour constraint
- Eliminating features as important as adding them
- Medieval siege weapons solve visual identity problem
- Progression through weapon unlocks simpler than upgrades
- Shrinking map adds drama without complex timers

**Notable Connections:**
- Zone of control + projectile physics = strategic positioning matters
- Random maps + shrinking boundary = high replayability
- XP unlocks + 3 weapons = clear progression path
- Fog of war + siege weapons = range advantage becomes tactical

---

## Idea Categorization

### Immediate Opportunities
*Ideas ready to implement now*

1. **Core Hex-Grid Combat System**
   - Description: 15x15 randomly generated hex battlefield with fog of war, turn-based siege weapon combat
   - Why immediate: Proven concept from Tank Ops reference, core mechanic for entire game
   - Resources needed: Hex grid library (Three.js or similar), pathfinding algorithm, basic rendering

2. **Three Weapon Types**
   - Description: Catapult (balanced starter), Ballista (fast/accurate), Trebuchet (powerful/long-range)
   - Why immediate: Provides weapon variety without overwhelming scope, clear stat differences easy to implement
   - Resources needed: 3 sprite sets, basic projectile physics, damage/range values

3. **XP-Based Weapon Unlocks**
   - Description: Start with Catapult, earn XP to unlock Ballista, then Trebuchet
   - Why immediate: Simple linear progression, meets hackathon reward requirement
   - Resources needed: XP counter, localStorage for persistence, unlock UI

4. **PvE Against Basic AI**
   - Description: Single-player combat against AI opponent that shoots at player
   - Why immediate: Simpler than multiplayer, no networking required, faster to implement
   - Resources needed: Basic AI pathfinding, target selection algorithm

5. **Shrinking Map Mechanic**
   - Description: Playable area reduces over time, forcing engagement
   - Why immediate: Creates urgency without turn timers, visually dramatic effect
   - Resources needed: Timer system, hex invalidation logic, visual boundary effects

### Future Innovations
*Ideas requiring development/research*

1. **Ram/Melee Weapon Type**
   - Description: Close-range high-damage unit creating risk/reward gameplay
   - Development needed: Melee attack mechanics, movement-based gameplay balance
   - Timeline estimate: Post-hackathon, adds 2-3 hours development

2. **Multiplayer PvP Mode**
   - Description: Real-time or async multiplayer using WebSockets
   - Development needed: Backend server (Go/Node.js), matchmaking, synchronization
   - Timeline estimate: 10-15 hours additional development

3. **Terrain Destruction**
   - Description: Projectiles permanently modify battlefield, creating craters/obstacles
   - Development needed: Dynamic map state system, collision detection updates
   - Timeline estimate: 5-8 hours, impacts core engine

4. **Advanced AI Behaviors**
   - Description: AI with tactical awareness, flanking, defensive positioning
   - Development needed: AI decision tree, behavior systems, testing/balancing
   - Timeline estimate: 8-12 hours for sophisticated implementation

5. **Weapon Upgrade System**
   - Description: Vertical progression (Catapult Lvl 1 → Lvl 2) in addition to unlocks
   - Development needed: Stat scaling system, UI for upgrade paths, balance testing
   - Timeline estimate: 4-6 hours

### Moonshots
*Ambitious, transformative concepts*

1. **Steampunk Siege Mechs Hybrid**
   - Description: Combine medieval siege weapons with robotic/mechanical aesthetic
   - Transformative potential: Unique visual identity, broad appeal, merchandising opportunity
   - Challenges to overcome: Art asset complexity, thematic consistency, animation requirements

2. **Dynamic Weather System**
   - Description: Wind affects projectile trajectories, rain impacts movement/visibility
   - Transformative potential: Adds unpredictability and realism, emergent tactical depth
   - Challenges to overcome: Physics complexity, visual effects workload, balance implications

3. **Asymmetric Faction Warfare**
   - Description: Different civilizations with unique siege equipment and abilities
   - Transformative potential: Deep replayability, esports potential, expanded universe
   - Challenges to overcome: Massive content requirement, balance complexity, art multiplication

4. **Environmental Puzzle Campaigns**
   - Description: Single-player story mode with physics-based siege puzzles
   - Transformative potential: Appeal to puzzle game audience, narrative potential
   - Challenges to overcome: Level design time, different gameplay focus than PvP

### Insights & Learnings
*Key realizations from the session*

- **Visual clarity trumps complexity**: Medieval siege weapons immediately communicate function better than abstract or futuristic designs for pixel art
- **Constraints drive creativity**: 5-hour limit forced focus on core mechanics rather than feature bloat
- **Proven concepts reduce risk**: Borrowing hex-grid + fog of war from established games creates familiar foundation
- **Scope elimination is design**: Removing multiplayer, sound, and tutorials wasn't compromise—it was smart prioritization
- **Progression systems satisfy requirements**: Simple XP unlocks meet hackathon reward mandate elegantly
- **Theme differentiation matters**: "Just like Tank Ops but..." needed the medieval twist for uniqueness
- **Shrinking map solves multiple problems**: Adds urgency, prevents stalemates, creates visual drama without complex timers

---

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: Core Hex Combat Engine
- **Rationale:** Foundation for entire game; nothing else works without this. Hex-grid with fog of war is the unique selling point.
- **Next steps:** 
  1. Set up project structure (TypeScript + renderer choice)
  2. Implement hex coordinate system and rendering
  3. Add basic unit placement and movement
  4. Implement fog of war visibility calculations
- **Resources needed:** Hex grid math library (cube coordinates), WebGL/Canvas renderer, pathfinding (A* for hexes)
- **Timeline:** Hour 1-2 of development

#### #2 Priority: Three Weapon Types with Projectile Physics
- **Rationale:** Core differentiation from generic tactics games; visible projectile arcs provide satisfying feedback and visual appeal
- **Next steps:**
  1. Define weapon stats (range, damage, fire rate, projectile speed)
  2. Implement arc trajectory calculation for projectiles
  3. Create simple sprite/visual for each weapon type
  4. Add attack action to turn system
- **Resources needed:** Physics calculations for parabolic motion, sprite sheets (even placeholder), hit detection
- **Timeline:** Hour 2-3 of development

#### #3 Priority: XP System with Weapon Unlocks
- **Rationale:** Meets hackathon mandatory reward requirement; provides player progression motivation; simple to implement
- **Next steps:**
  1. Create XP counter (earn per enemy destroyed/damage dealt)
  2. Implement localStorage persistence between battles
  3. Add unlock thresholds (e.g., 100 XP = Ballista, 300 XP = Trebuchet)
  4. Create simple unlock notification UI
- **Resources needed:** localStorage API, UI elements for XP display and unlock notifications
- **Timeline:** Hour 4 of development (after core gameplay works)

---

## Reflection & Follow-up

### What Worked Well
- Analogical thinking quickly identified that original tank concept was strongest, saving time on excessive alternatives
- SCAMPER provided systematic framework to transform concept without losing focus
- Explicit scope constraints (5 hours, hackathon requirements) kept brainstorming practical
- Building on existing reference (Tank Ops) provided clear technical foundation
- Medieval theme emerged naturally through elimination process

### Areas for Further Exploration
- **Visual art style decisions**: Exact pixel art approach, isometric vs top-down perspective, color palette
- **AI difficulty progression**: How to make later battles challenging with simple AI
- **Map generation algorithms**: Ensuring balanced, interesting terrain layouts
- **Victory/defeat conditions**: Beyond "destroy all enemies" - time limits, objectives?
- **UI/UX flow**: Main menu, battle screen, progression screen layouts
- **Balancing weapon stats**: Exact damage, range, and fire rate numbers through playtesting

### Recommended Follow-up Techniques
- **Morphological Analysis**: Map out all parameter combinations for weapon stats to ensure differentiation
- **Role Playing**: Playtest from perspective of different player types (strategic vs aggressive) to validate mechanics
- **Five Whys**: Dig deeper into "why fog of war matters" and "why shrinking map adds value" for pitch clarity
- **Mind Mapping**: Visual map of technical architecture dependencies for implementation planning

### Questions That Emerged
- Should fog of war reveal hexes permanently or temporarily?
- Does each player control one unit or multiple units?
- What exactly triggers map shrinking - turn count or time-based?
- How much XP per battle? How many battles to unlock all weapons?
- Should AI get same weapon progression or always use basic units?
- What happens when player unlocks all weapons - endless mode or new challenge?
- Mobile support worth attempting or desktop-only for hackathon?

### Next Session Planning
- **Suggested topics:** 
  - Technical architecture planning session (tech stack choices, code structure)
  - Art style definition and asset creation planning
  - Detailed game balance spreadsheet (weapon stats, XP curves)
  - Hackathon pitch/presentation strategy
- **Recommended timeframe:** Before starting development (next 24 hours)
- **Preparation needed:** 
  - Research hex-grid libraries (Three.js hexagons, Red Blob Games tutorials)
  - Gather medieval siege weapon sprite references
  - Set up development environment
  - Create wireframes for UI screens

---

## Final Game Concept: "Siege Tactics"

**Elevator Pitch:**  
Turn-based medieval siege weapon combat on a shrinking hex battlefield. Master fog of war, unlock powerful siege engines, and outmaneuver your opponent in this browser-based tactical showdown.

**Core Features:**
- 🎯 **Hex-Grid Battlefield**: 15x15 randomly generated tactical arena
- 👁️ **Fog of War**: Limited vision radius around units creates strategic uncertainty
- ⚔️ **Three Siege Weapons**: Catapult (balanced), Ballista (fast), Trebuchet (powerful)
- 🏹 **Physics-Based Projectiles**: Visible arc trajectories with impact effects
- 🎮 **Zone of Control**: Units influence surrounding hexes tactically
- ⏱️ **Shrinking Map**: Arena boundary closes in over time
- 🎯 **PvE Combat**: Battle against AI opponents
- ⭐ **XP Progression**: Unlock new siege weapons through victories
- 🎨 **Pixel Art Aesthetic**: Isometric medieval visual style
- 🌐 **Browser-Based**: Runs in Chrome, no installation required

**MVP Scope (5 Hours):**
1. Functional hex-grid engine with rendering
2. Three weapon types with distinct behaviors
3. Basic AI opponent
4. Fog of war implementation
5. Shrinking map mechanic
6. XP system with weapon unlocks
7. Single battle mode with persistence

**Stretch Goals:**
- Ram/melee weapon type
- Enhanced visual effects
- Mobile responsiveness
- Sound effects and music
- Multiple map variants

---

*Session facilitated using the BMAD-METHOD™ brainstorming framework*