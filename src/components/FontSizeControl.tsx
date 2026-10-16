'use client'

import { FontSize, FONT_SIZES, FONT_SIZE_OPTIONS } from '@/types/fontSize'

interface FontSizeControlProps {
  fontSize: FontSize
  onChange: (fontSize: FontSize) => void
}

export default function FontSizeControl({
  fontSize,
  onChange,
}: FontSizeControlProps) {
  return (
    <div
      role="group"
      aria-label="글자 크기"
      className="inline-flex items-center rounded-lg border border-gray-300 bg-white p-0.5"
      data-testid="font-size-control"
    >
      {FONT_SIZE_OPTIONS.map(option => {
        const isActive = option === fontSize
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={isActive}
            aria-label={`글자 크기 ${FONT_SIZES[option]}`}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            data-testid={`font-size-${option}-btn`}
          >
            {FONT_SIZES[option]}
          </button>
        )
      })}
    </div>
  )
}
