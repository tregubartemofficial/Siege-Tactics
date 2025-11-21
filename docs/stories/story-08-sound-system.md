# Story 08: Sound System with Weapon Audio & Background Music

**Story ID:** SIEGE-008  
**Story Points:** 2  
**Priority:** Medium  
**Dependencies:** Story 02 (Unit Rendering), Story 04 (Combat Service)

## User Story
As a player, I want to hear satisfying sound effects when weapons fire and atmospheric background music, so that combat feels more impactful and the game feels more immersive.

## Description
Implement a sound system that plays trebuchet audio effects for all weapon types (Catapult, Ballista, Trebuchet) during combat actions, plus looping background music ("River walk.mp3") for atmospheric immersion. This adds audio feedback to enhance the tactical gameplay experience without requiring unique sounds for each weapon.

## Acceptance Criteria

### 1. Sound Asset Integration
- [ ] Trebuchet sound file loaded and cached
- [ ] Background music file ("River walk.mp3") loaded and cached
- [ ] Sound plays when any weapon type fires
- [ ] Background music loops continuously during gameplay
- [ ] No errors if sound files fail to load (graceful degradation)
- [ ] Separate volume controls for SFX (70%) and music (50%)

### 2. Combat Action Audio
- [ ] Sound triggers when CombatService.executeAttack() is called
- [ ] Single sound instance plays per attack (no overlapping duplicates)
- [ ] Sound completes before next attack can trigger
- [ ] Audio feedback for both player and AI attacks

### 3. User Controls
- [ ] Mute/unmute toggle button in UI (affects both SFX and music)
- [ ] Mute state persists in LocalStorage
- [ ] Visual indication of muted state (icon change)
- [ ] Keyboard shortcut (M key) for quick mute toggle
- [ ] Music starts automatically when game loads (respecting mute state)

### 4. Performance & Quality
- [ ] Sounds load asynchronously without blocking game start
- [ ] Background music loops seamlessly without gaps
- [ ] No audio glitches or pops during gameplay
- [ ] Works across major browsers (Chrome, Firefox, Edge)
- [ ] Graceful handling if browser blocks autoplay
- [ ] Music fades in smoothly on game start

## Technical Implementation

### File 1: `src/services/SoundService.ts`

```typescript
/**
 * Sound Service - Manages game audio playback
 * 
 * Responsibilities:
 * - Load and cache audio assets
 * - Play weapon fire sounds with volume control
 * - Manage mute state with persistence
 * - Handle browser autoplay restrictions gracefully
 */

export interface SoundConfig {
  weaponFireUrl: string;
  backgroundMusicUrl: string;
  defaultSfxVolume: number;
  defaultMusicVolume: number;
}

export class SoundService {
  private weaponFireAudio: HTMLAudioElement | null = null;
  private backgroundMusic: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.7; // 70% default volume for sound effects
  private musicVolume: number = 0.5; // 50% default volume for music
  private isLoaded: boolean = false;
  private isMusicLoaded: boolean = false;
  private isPlaying: boolean = false;

  constructor(private config: SoundConfig) {
    this.loadMuteState();
    this.preloadSounds();
  }

  /**
   * Preload sound assets asynchronously
   */
  private async preloadSounds(): Promise<void> {
    // Load weapon fire sound
    try {
      this.weaponFireAudio = new Audio(this.config.weaponFireUrl);
      this.weaponFireAudio.volume = this.sfxVolume;
      this.weaponFireAudio.preload = 'auto';

      // Wait for audio to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.weaponFireAudio) {
          reject(new Error('Audio element not created'));
          return;
        }

        this.weaponFireAudio.addEventListener('canplaythrough', () => resolve(), { once: true });
        this.weaponFireAudio.addEventListener('error', (e) => reject(e), { once: true });
        
        // Load the audio
        this.weaponFireAudio.load();
      });

      this.isLoaded = true;
      console.log('[SoundService] Weapon fire sound loaded successfully');
    } catch (error) {
      console.warn('[SoundService] Failed to load weapon fire sound:', error);
      this.isLoaded = false;
      // Graceful degradation - game continues without sound
    }

    // Load background music
    try {
      this.backgroundMusic = new Audio(this.config.backgroundMusicUrl);
      this.backgroundMusic.volume = this.musicVolume;
      this.backgroundMusic.loop = true; // Loop continuously
      this.backgroundMusic.preload = 'auto';

      await new Promise<void>((resolve, reject) => {
        if (!this.backgroundMusic) {
          reject(new Error('Music element not created'));
          return;
        }

        this.backgroundMusic.addEventListener('canplaythrough', () => resolve(), { once: true });
        this.backgroundMusic.addEventListener('error', (e) => reject(e), { once: true });
        
        this.backgroundMusic.load();
      });

      this.isMusicLoaded = true;
      console.log('[SoundService] Background music loaded successfully');
      
      // Start music automatically if not muted
      if (!this.isMuted) {
        this.startBackgroundMusic();
      }
    } catch (error) {
      console.warn('[SoundService] Failed to load background music:', error);
      this.isMusicLoaded = false;
    }
  }

  /**
   * Start background music with fade-in effect
   */
  private startBackgroundMusic(): void {
    if (!this.isMusicLoaded || !this.backgroundMusic || this.isMuted) {
      return;
    }

    try {
      // Start at low volume and fade in
      this.backgroundMusic.volume = 0;
      const playPromise = this.backgroundMusic.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[SoundService] Background music started');
            // Fade in over 2 seconds
            this.fadeIn(this.backgroundMusic!, this.musicVolume, 2000);
          })
          .catch((error) => {
            console.warn('[SoundService] Music playback prevented by browser:', error);
            // Browser autoplay blocked - will play after user interaction
          });
      }
    } catch (error) {
      console.warn('[SoundService] Error starting background music:', error);
    }
  }

  /**
   * Fade in audio element to target volume
   */
  private fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number): void {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeIncrement = targetVolume / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      if (currentStep >= steps || this.isMuted) {
        audio.volume = this.isMuted ? 0 : targetVolume;
        clearInterval(fadeInterval);
        return;
      }

      currentStep++;
      audio.volume = Math.min(volumeIncrement * currentStep, targetVolume);
    }, stepDuration);
  }

  /**
   * Play weapon fire sound for any weapon type
   * Trebuchet sound used for all weapons as they sound similar
   */
  public playWeaponFire(): void {
    if (this.isMuted || !this.isLoaded || !this.weaponFireAudio || this.isPlaying) {
      return;
    }

    try {
      // Reset audio to start if it was played before
      this.weaponFireAudio.currentTime = 0;
      
      // Play the sound
      const playPromise = this.weaponFireAudio.play();
      
      if (playPromise !== undefined) {
        this.isPlaying = true;
        
        playPromise
          .then(() => {
            console.log('[SoundService] Weapon fire sound played');
          })
          .catch((error) => {
            console.warn('[SoundService] Playback prevented by browser:', error);
            this.isPlaying = false;
            // Browser might block autoplay - this is expected behavior
          });

        // Track when sound finishes
        this.weaponFireAudio.addEventListener('ended', () => {
          this.isPlaying = false;
        }, { once: true });
      }
    } catch (error) {
      console.warn('[SoundService] Error playing weapon fire sound:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Toggle mute state and persist to LocalStorage
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.saveMuteState();
    
    // Apply mute to background music
    if (this.backgroundMusic) {
      if (this.isMuted) {
        this.backgroundMusic.volume = 0;
      } else {
        this.backgroundMusic.volume = this.musicVolume;
        // Start music if it wasn't playing
        if (this.isMusicLoaded && this.backgroundMusic.paused) {
          this.startBackgroundMusic();
        }
      }
    }
    
    console.log(`[SoundService] Sound ${this.isMuted ? 'muted' : 'unmuted'}`);
  }

  /**
   * Set mute state directly
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.saveMuteState();
    
    // Apply to background music
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = muted ? 0 : this.musicVolume;
    }
  }

  /**
   * Get current mute state
   */
  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Set volume level for sound effects (0.0 to 1.0)
   */
  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.weaponFireAudio) {
      this.weaponFireAudio.volume = this.sfxVolume;
    }
  }

  /**
   * Set volume level for background music (0.0 to 1.0)
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.backgroundMusic && !this.isMuted) {
      this.backgroundMusic.volume = this.musicVolume;
    }
  }

  /**
   * Get current SFX volume level
   */
  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  /**
   * Get current music volume level
   */
  public getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Check if sounds are loaded and ready
   */
  public isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Load mute state from LocalStorage
   */
  private loadMuteState(): void {
    try {
      const storedMute = localStorage.getItem('siege-tactics-sound-muted');
      this.isMuted = storedMute === 'true';
    } catch (error) {
      console.warn('[SoundService] Could not load mute state:', error);
      this.isMuted = false;
    }
  }

  /**
   * Save mute state to LocalStorage
   */
  private saveMuteState(): void {
    try {
      localStorage.setItem('siege-tactics-sound-muted', this.isMuted.toString());
    } catch (error) {
      console.warn('[SoundService] Could not save mute state:', error);
    }
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    if (this.weaponFireAudio) {
      this.weaponFireAudio.pause();
      this.weaponFireAudio.src = '';
      this.weaponFireAudio = null;
    }
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.src = '';
      this.backgroundMusic = null;
    }
    this.isLoaded = false;
    this.isMusicLoaded = false;
    this.isPlaying = false;
  }
}
```

### File 2: Integration with `src/core/GameEngine.ts`

Add SoundService initialization:

```typescript
import { SoundService } from '../services/SoundService';

export class GameEngine {
  // ... existing properties ...
  private soundService: SoundService;

  constructor() {
    // ... existing initialization ...
    
    // Initialize sound service
    this.soundService = new SoundService({
      weaponFireUrl: '/assets/sounds/trebuchet-fire.mp3', // User provides this asset
      backgroundMusicUrl: '/assets/music/River walk.mp3', // User's main theme
      defaultSfxVolume: 0.7,
      defaultMusicVolume: 0.5
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // ... existing event listeners ...

    // Play sound when attack is executed
    this.eventBus.on('attackExecuted', () => {
      this.soundService.playWeaponFire();
    });

    // Keyboard shortcut for mute toggle
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') {
        this.soundService.toggleMute();
        this.updateMuteButtonUI();
      }
    });
  }

  /**
   * Update mute button visual state
   */
  private updateMuteButtonUI(): void {
    const muteBtn = document.getElementById('mute-button');
    if (muteBtn) {
      const isMuted = this.soundService.isSoundMuted();
      muteBtn.textContent = isMuted ? '🔇 Unmute' : '🔊 Mute';
      muteBtn.setAttribute('aria-label', isMuted ? 'Unmute sounds' : 'Mute sounds');
    }
  }

  // ... rest of existing code ...
}
```

### File 3: Integration with `src/services/CombatService.ts`

Emit event when attack is executed:

```typescript
import { EventBus } from '../core/EventBus';

export class CombatService {
  constructor(private eventBus: EventBus) {}

  public executeAttack(attacker: Unit, target: Unit): AttackResult {
    // ... existing attack logic ...

    const damage = attacker.getDamage();
    target.takeDamage(damage);

    // Emit event to trigger sound
    this.eventBus.emit('attackExecuted', {
      attackerId: attacker.id,
      targetId: target.id,
      damage: damage,
      weaponType: attacker.weaponType
    });

    return {
      success: true,
      damage: damage,
      targetDestroyed: target.currentHealth <= 0
    };
  }

  // ... rest of existing code ...
}
```

### File 4: UI Updates in `public/index.html`

Add mute button to game controls:

```html
<!-- Inside the #game-controls div -->
<div id="game-controls" class="controls-panel">
  <h3>Game Controls</h3>
  
  <!-- Existing controls -->
  <button id="end-turn-btn" class="btn btn-primary">End Turn</button>
  <button id="reset-game-btn" class="btn btn-secondary">Reset Game</button>
  
  <!-- New mute button -->
  <button id="mute-button" class="btn btn-secondary" aria-label="Mute sounds">
    🔊 Mute
  </button>
  
  <div id="turn-info">
    <p><strong>Current Turn:</strong> <span id="current-turn-text">Player</span></p>
    <p><strong>Turn Number:</strong> <span id="turn-number-text">1</span></p>
  </div>
</div>
```

### File 5: UI Controller Integration in `src/ui/UIController.ts`

Wire up mute button:

```typescript
export class UIController {
  // ... existing properties ...

  private setupEventListeners(): void {
    // ... existing listeners ...

    // Mute button
    const muteBtn = document.getElementById('mute-button');
    muteBtn?.addEventListener('click', () => {
      this.eventBus.emit('muteToggled');
    });
  }

  // ... rest of existing code ...
}
```

And in GameEngine, handle the mute event:

```typescript
this.eventBus.on('muteToggled', () => {
  this.soundService.toggleMute();
  this.updateMuteButtonUI();
});
```

### File 6: CSS Updates in `src/styles/main.css`

Style the mute button:

```css
/* Mute button styling */
#mute-button {
  margin-top: 10px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

#mute-button:hover {
  transform: translateY(-2px);
}

#mute-button:active {
  transform: translateY(0);
}
```

## Asset Requirements

### Trebuchet Sound File
- **Path:** `/public/assets/sounds/trebuchet-fire.mp3`
- **Source:** User to provide trebuchet firing sound
- **Format:** MP3 (best browser compatibility)
- **Duration:** 1-3 seconds recommended
- **Volume:** Normalized to prevent clipping

**Alternative Sources if needed:**
- Freesound.org (search "trebuchet" or "catapult")
- OpenGameArt.org
- Record custom sound effects

### Background Music File
- **Path:** `/public/assets/music/River walk.mp3`
- **Source:** User-provided "River walk.mp3" main theme
- **Format:** MP3
- **Duration:** 2-5 minutes (will loop seamlessly)
- **Volume:** Normalized, mixed to allow SFX to be heard clearly
- **Style:** Atmospheric theme suitable for tactical gameplay

## Testing Instructions

### Manual Testing
1. **Sound Playback:**
   - Start the game and verify sound loads without errors
   - Background music should start playing automatically (looping)
   - Execute an attack with Catapult → weapon sound plays
   - Execute an attack with Ballista → same weapon sound plays
   - Execute an attack with Trebuchet → same weapon sound plays
   - Verify music continues looping in background

2. **Mute Functionality:**
   - Click mute button → icon changes to 🔇
   - Background music volume goes to 0 (or stops)
   - Execute attack → no weapon sound plays
   - Click unmute → icon changes back to 🔊
   - Music resumes at normal volume
   - Execute attack → weapon sound plays again

3. **Keyboard Shortcut:**
   - Press 'M' key → sound and music mutes
   - Press 'M' key again → sound and music unmutes

4. **Persistence:**
   - Mute the sound
   - Refresh the browser
   - Verify sound remains muted after reload (no music plays)
   - Unmute and verify music starts

5. **Graceful Degradation:**
   - Remove sound file from `/public/assets/sounds/`
   - Reload game
   - Verify game still plays without errors (music continues)
   - Check console for warning message
   - Remove music file and verify game continues with just SFX

6. **Music Looping:**
   - Let the game run for full music duration
   - Verify music loops seamlessly without gaps or pops

### Browser Compatibility
- Test in Chrome (autoplay policy)
- Test in Firefox
- Test in Edge
- Verify no console errors in any browser

### Edge Cases
1. **Rapid Attacks:** Execute multiple attacks quickly → only one weapon sound plays at a time (no overlap), music continues
2. **Missing Assets:** Remove sound/music files → game continues, console shows warnings
3. **Browser Autoplay Block:** Some browsers may block sound on first load → sound/music works after user interaction
4. **LocalStorage Full:** If storage quota exceeded, mute state may not persist (game continues)
5. **Music File Corruption:** If music file is corrupted → game continues without music, shows console warning

## Definition of Done
- [ ] SoundService.ts created and tested
- [ ] Background music integration with looping
- [ ] Music fade-in effect implemented
- [ ] GameEngine integrated with sound system
- [ ] CombatService emits attackExecuted event
- [ ] Mute button added to UI with icon toggle (affects both SFX and music)
- [ ] Keyboard shortcut (M) works
- [ ] Mute state persists across sessions
- [ ] All weapon types trigger same trebuchet sound
- [ ] "River walk.mp3" plays as looping background music
- [ ] Separate volume levels for SFX (70%) and music (50%)
- [ ] No console errors if sound/music assets missing
- [ ] Cross-browser tested (Chrome, Firefox, Edge)
- [ ] Code reviewed and follows project patterns

## Time Estimate
**2 Story Points = ~1.5 hours**

Breakdown:
- SoundService implementation with music support: 40 minutes
- Fade-in effect and looping logic: 15 minutes
- GameEngine/CombatService integration: 15 minutes
- UI button and styling: 10 minutes
- Testing and browser compatibility: 20 minutes

## Notes
- Using trebuchet sound for all weapons simplifies asset management
- All siege weapons have similar firing mechanics (tension release + projectile launch)
- "River walk.mp3" provides atmospheric background for tactical gameplay
- Music loops seamlessly at 50% volume to avoid overpowering SFX
- Fade-in effect prevents jarring music start
- Graceful degradation ensures game works even without sound/music assets
- LocalStorage persistence improves UX (mute preference remembered)
- Single sound instance prevents audio chaos during rapid combat
- Background music starts automatically but respects mute state

## Future Enhancements (Out of Scope)
- Unique sounds per weapon type
- Impact/explosion sounds when attacks land
- Multiple music tracks with dynamic switching
- UI click/hover sounds
- Victory/defeat music stings
- Volume slider controls for SFX and music separately
- Music intensity changes based on combat state
- Ambient environmental sounds
