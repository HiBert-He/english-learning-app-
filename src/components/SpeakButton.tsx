import { speak, canSpeak } from '../lib/speech'

export default function SpeakButton({ text, className = '' }: { text: string; className?: string }) {
  if (!canSpeak) return null

  return (
    <button
      onClick={(e) => { e.stopPropagation(); speak(text) }}
      className={`text-gray-400 active:text-blue-600 ${className}`}
      aria-label="发音"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.54 8.46a5 5 0 010 7.07M18.36 5.64a9 9 0 010 12.72" />
      </svg>
    </button>
  )
}
