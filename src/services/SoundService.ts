/**
 * Sound Service - Manages game audio playback
 * 
 * Responsibilities:
 * - Load and cache audio assets
 * - Play weapon fire sounds with volume control
 * - Manage background music looping
 * - Handle mute state with LocalStorage persistence
 * - Gracefully handle browser autoplay restrictions
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
    this.sfxVolume = config.defaultSfxVolume;
    this.musicVolume = config.defaultMusicVolume;
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
      this.weaponFireAudio.volume = this.isMuted ? 0 : this.sfxVolume;
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
      this.backgroundMusic.volume = this.isMuted ? 0 : this.musicVolume;
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
    if (this.isMuted === muted) return;
    this.toggleMute();
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
    if (this.weaponFireAudio && !this.isMuted) {
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
