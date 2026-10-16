export type FontSize = 'small' | 'medium' | 'large'

export const FONT_SIZES: Record<FontSize, string> = {
  small: '작게',
  medium: '보통',
  large: '크게',
}

export const FONT_SIZE_OPTIONS = Object.keys(FONT_SIZES) as FontSize[]

export const DEFAULT_FONT_SIZE: FontSize = 'medium'
