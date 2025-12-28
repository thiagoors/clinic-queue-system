import { useCallback } from 'react'

// Simple notification sound using Web Audio API
export function useSound() {
  const playNotification = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // Create a simple beep sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)

      // Play a second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator()
        const gain2 = audioContext.createGain()

        osc2.connect(gain2)
        gain2.connect(audioContext.destination)

        osc2.frequency.value = 1000
        osc2.type = 'sine'

        gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

        osc2.start(audioContext.currentTime)
        osc2.stop(audioContext.currentTime + 0.5)
      }, 200)
    } catch (e) {
      console.log('Audio not supported')
    }
  }, [])

  return { playNotification }
}
