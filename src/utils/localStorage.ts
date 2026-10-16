import {
  FontSize,
  FONT_SIZE_OPTIONS,
  DEFAULT_FONT_SIZE,
} from '@/types/fontSize'

const FONT_SIZE_STORAGE_KEY = 'memo-app-font-size'

// 글자 크기 같은 UI 설정만 LocalStorage에 저장 (메모 데이터는 Supabase)
export const localStorageUtils = {
  // 글자 크기 설정 가져오기
  getFontSize: (): FontSize => {
    if (typeof window === 'undefined') return DEFAULT_FONT_SIZE

    try {
      const stored = localStorage.getItem(FONT_SIZE_STORAGE_KEY)
      return (
        FONT_SIZE_OPTIONS.find(option => option === stored) ?? DEFAULT_FONT_SIZE
      )
    } catch (error) {
      console.error('Error loading font size from localStorage:', error)
      return DEFAULT_FONT_SIZE
    }
  },

  // 글자 크기 설정 저장하기
  saveFontSize: (fontSize: FontSize): void => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize)
    } catch (error) {
      console.error('Error saving font size to localStorage:', error)
    }
  },
}
