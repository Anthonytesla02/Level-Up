
import { useEffect, useRef } from 'react';
import { Howl } from 'howler';

// Sound types
type SoundType = 'levelUp' | 'taskComplete' | 'taskFailed' | 'buttonClick' | 'tabClick' | 'modal';

// Sound URLs
const SOUND_URLS: Record<SoundType, string> = {
  levelUp: '/Solo Grind levelup.mp3',
  taskComplete: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=message-incoming-132126.mp3',
  taskFailed: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=error-126627.mp3',
  buttonClick: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_3ad2c171ed.mp3?filename=click-21156.mp3',
  tabClick: '/Solo Grind tabs.mp3',
  modal: '/Solo Grind modal.mp3'
};

// Cache for loaded sound instances
const soundInstances: Record<SoundType, Howl | null> = {
  levelUp: null,
  taskComplete: null,
  taskFailed: null,
  buttonClick: null,
  tabClick: null,
  modal: null
};

export function useSound() {
  const loadedRef = useRef<boolean>(false);

  // Load sounds
  useEffect(() => {
    if (loadedRef.current) return;
    
    // Load each sound
    Object.entries(SOUND_URLS).forEach(([type, url]) => {
      soundInstances[type as SoundType] = new Howl({
        src: [url],
        preload: true,
        volume: 0.5
      });
    });

    loadedRef.current = true;

    // Cleanup function
    return () => {
      Object.values(soundInstances).forEach(sound => {
        if (sound) sound.unload();
      });
      loadedRef.current = false;
    };
  }, []);

  // Play sound function
  const playSound = (type: SoundType) => {
    const sound = soundInstances[type];
    if (sound) {
      // Stop any currently playing instances of this sound
      sound.stop();
      // Play the sound
      sound.play();
    }
  };

  return { playSound };
}
