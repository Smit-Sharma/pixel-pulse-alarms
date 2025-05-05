
/**
 * Audio service to handle sound playback
 */
class AudioService {
  private audioElement: HTMLAudioElement | null = null;
  private initialized = false;
  private soundsLoaded: Record<string, boolean> = {};
  private preloadedSounds: Record<string, HTMLAudioElement> = {};

  /**
   * Initialize the audio service
   */
  public init(): void {
    if (this.initialized) return;
    
    try {
      // Create audio element
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';
      
      // Set up event listeners for debugging
      this.audioElement.addEventListener('error', (e) => {
        console.error('Audio error:', e);
      });
      
      this.audioElement.addEventListener('canplaythrough', () => {
        const src = this.audioElement?.src || '';
        console.log(`Audio can play through: ${src}`);
        if (src) {
          this.soundsLoaded[src] = true;
        }
      });
      
      // Try to preload common sounds
      this.preloadSounds([
        '/alarm-sound.mp3',
        '/alarm-sound-classic.mp3',
        '/alarm-sound-digital.mp3'
      ]);
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
  }
  
  /**
   * Preload sounds for better performance
   */
  private preloadSounds(sounds: string[]): void {
    sounds.forEach(sound => {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = sound;
        
        // Store the preloaded sound
        this.preloadedSounds[sound] = audio;
        
        audio.addEventListener('canplaythrough', () => {
          this.soundsLoaded[sound] = true;
          console.log(`Preloaded sound: ${sound}`);
        });
        
        audio.addEventListener('error', (e) => {
          console.error(`Error preloading sound ${sound}:`, e);
        });
        
        // Force load
        audio.load();
      } catch (error) {
        console.error(`Error creating audio for ${sound}:`, error);
      }
    });
  }

  /**
   * Play a sound
   * @param soundUrl URL of the sound to play
   * @param loop Whether to loop the sound
   */
  public async play(soundUrl: string, loop: boolean = false): Promise<void> {
    if (!this.initialized) {
      this.init();
    }

    try {
      // Stop any currently playing sound first
      this.stop();
      
      // Use preloaded sound if available
      if (this.preloadedSounds[soundUrl]) {
        this.audioElement = this.preloadedSounds[soundUrl];
      } else {
        // Create a new audio element if no preloaded version
        this.audioElement = new Audio(soundUrl);
      }
      
      // Set properties
      if (this.audioElement) {
        this.audioElement.loop = loop;
        this.audioElement.volume = 1.0;
        
        // Log attempts to play
        console.log(`Attempting to play sound: ${soundUrl}`);
        
        // Try multiple play strategies for better browser compatibility
        this.tryMultiplePlayStrategies();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      // Fallback to a different audio implementation
      this.playFallback(soundUrl, loop);
    }
  }
  
  /**
   * Try multiple strategies to play audio to overcome browser restrictions
   */
  private tryMultiplePlayStrategies(): void {
    if (!this.audioElement) return;
    
    // Strategy 1: Standard play
    const playPromise = this.audioElement.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Audio playback started successfully');
        })
        .catch((error) => {
          console.error('Could not play audio with standard strategy:', error);
          
          // Strategy 2: Set up user interaction handler
          this.setupUserInteractionPlayback();
          
          // Strategy 3: Create and play a new Audio
          this.playWithNewAudio(this.audioElement.src, this.audioElement.loop);
        });
    } else {
      // For browsers that don't return a promise
      console.log('Browser does not return play promise, assuming playback started');
    }
  }
  
  /**
   * Set up a handler to play audio on user interaction
   */
  private setupUserInteractionPlayback(): void {
    const userInteractionHandler = () => {
      if (this.audioElement) {
        const retryPlay = this.audioElement.play();
        if (retryPlay) {
          retryPlay
            .then(() => console.log('Audio played after user interaction'))
            .catch((err) => console.error('Still could not play audio:', err));
        }
      }
      
      // Remove event listener after attempt
      document.removeEventListener('click', userInteractionHandler);
      document.removeEventListener('touchstart', userInteractionHandler);
    };
    
    document.addEventListener('click', userInteractionHandler, { once: true });
    document.addEventListener('touchstart', userInteractionHandler, { once: true });
  }
  
  /**
   * Alternative approach using a new Audio instance
   */
  private playWithNewAudio(src: string, loop: boolean): void {
    try {
      const newAudio = new Audio();
      newAudio.src = src;
      newAudio.loop = loop;
      newAudio.volume = 1.0;
      
      const newPlayPromise = newAudio.play();
      if (newPlayPromise) {
        newPlayPromise
          .then(() => {
            console.log('Audio played with new Audio instance');
            this.audioElement = newAudio;
          })
          .catch(err => console.error('Failed to play with new Audio:', err));
      }
    } catch (error) {
      console.error('Error creating new Audio:', error);
    }
  }
  
  /**
   * Fallback method using Web Audio API
   */
  private playFallback(soundUrl: string, loop: boolean): void {
    try {
      console.log('Attempting fallback audio playback for:', soundUrl);
      
      // Use the audio element for simplicity, but could be replaced with Web Audio API
      const fallbackAudio = new Audio(soundUrl);
      fallbackAudio.loop = loop;
      fallbackAudio.volume = 1.0;
      
      // Add event listeners
      fallbackAudio.addEventListener('play', () => console.log('Fallback audio playing'));
      fallbackAudio.addEventListener('error', (e) => console.error('Fallback audio error:', e));
      
      // Attempt to play
      fallbackAudio.play()
        .then(() => {
          console.log('Fallback audio started');
          this.audioElement = fallbackAudio;
        })
        .catch(e => console.error('Fallback audio play failed:', e));
    } catch (error) {
      console.error('Fallback audio system failed:', error);
    }
  }

  /**
   * Stop playing sound
   */
  public stop(): void {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (error) {
        console.error('Error stopping sound:', error);
      }
    }
  }

  /**
   * Test audio playback to verify it works
   */
  public testSound(soundUrl: string): void {
    this.play(soundUrl, false);
    
    // Stop after 2 seconds
    setTimeout(() => {
      this.stop();
    }, 2000);
  }
}

// Export singleton instance
export const audioService = new AudioService();

// Initialize on import
audioService.init();
