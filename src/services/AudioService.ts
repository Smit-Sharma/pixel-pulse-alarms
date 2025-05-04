
/**
 * Audio service to handle sound playback
 */
class AudioService {
  private audioElement: HTMLAudioElement | null = null;
  private initialized = false;
  private soundsLoaded: Record<string, boolean> = {};

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
      const audio = new Audio();
      audio.src = sound;
      audio.preload = 'auto';
      audio.load();
      audio.addEventListener('canplaythrough', () => {
        this.soundsLoaded[sound] = true;
        console.log(`Preloaded sound: ${sound}`);
      });
      audio.addEventListener('error', (e) => {
        console.error(`Error preloading sound ${sound}:`, e);
      });
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

    // Create a new audio element each time to avoid issues with reusing the same element
    try {
      // Stop any currently playing sound first
      this.stop();
      
      // Create a new audio element
      this.audioElement = new Audio(soundUrl);
      this.audioElement.loop = loop;
      
      // Log attempts to play
      console.log(`Attempting to play sound: ${soundUrl}`);
      
      // Attempt to play
      const playPromise = this.audioElement.play();
      
      // Handle play promise
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log('Audio playback started successfully'))
          .catch((error) => {
            console.error('Could not play audio:', error);
            
            // Try again with user interaction - useful for browsers that require user gesture
            const userInteractionHandler = () => {
              if (this.audioElement) {
                const retryPlay = this.audioElement.play();
                retryPlay
                  .then(() => console.log('Audio played after user interaction'))
                  .catch((err) => console.error('Still could not play audio:', err));
              }
              
              // Remove event listener after attempt
              document.removeEventListener('click', userInteractionHandler);
            };
            
            document.addEventListener('click', userInteractionHandler, { once: true });
          });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
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
