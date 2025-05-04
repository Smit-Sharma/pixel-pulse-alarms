
/**
 * Audio service to handle sound playback
 */
class AudioService {
  private audioElement: HTMLAudioElement | null = null;
  private initialized = false;

  /**
   * Initialize the audio service
   */
  public init(): void {
    if (this.initialized) return;
    
    try {
      // Create audio element
      this.audioElement = document.createElement('audio');
      this.audioElement.preload = 'auto';
      
      // Add to DOM to ensure it works on iOS
      document.body.appendChild(this.audioElement);
      
      // Set up event listeners for debugging
      this.audioElement.addEventListener('error', (e) => {
        console.error('Audio error:', e);
      });
      
      this.audioElement.addEventListener('canplaythrough', () => {
        console.log('Audio can play through');
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
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

    if (!this.audioElement) {
      console.error('Audio element not initialized');
      return;
    }

    try {
      // Stop any currently playing sound first
      this.stop();
      
      // Set source and loop
      this.audioElement.src = soundUrl;
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
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
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
