'use client'

import { useState, useEffect, useCallback } from 'react'
import { FontSize, DEFAULT_FONT_SIZE } from '@/types/fontSize'
import { localStorageUtils } from '@/utils/localStorage'

export const useFontSize = () => {
  const [fontSize, setFontSize] = useState<FontSize>(DEFAULT_FONT_SIZE)

  // 저장된 설정 불러오기
  useEffect(() => {
    if (typeof window === 'undefined') return
    setFontSize(localStorageUtils.getFontSize())
  }, [])

  // <html>에 data 속성으로 반영 (globals.css에서 크기 지정)
  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize
  }, [fontSize])

  const changeFontSize = useCallback((next: FontSize) => {
    setFontSize(next)
    localStorageUtils.saveFontSize(next)
  }, [])

  return { fontSize, changeFontSize }
}
