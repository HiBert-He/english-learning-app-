export function speak(text: string, lang = 'en-US') {
  if (!('speechSynthesis' in window) || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
