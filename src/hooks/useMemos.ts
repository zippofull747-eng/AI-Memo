'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Memo, MemoFormData } from '@/types/memo'
import * as memoActions from '@/app/actions/memoActions'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 메모 로드
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const loadedMemos = await memoActions.getMemos()
        if (!cancelled) {
          setMemos(loadedMemos)
          setError(null)
        }
      } catch (err) {
        console.error('Failed to load memos:', err)
        if (!cancelled) setError('메모를 불러오지 못했습니다.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  // 메모 생성
  const createMemo = useCallback(
    async (formData: MemoFormData): Promise<Memo> => {
      const newMemo = await memoActions.createMemo(formData)
      setMemos(prev => [newMemo, ...prev])
      return newMemo
    },
    []
  )

  // 메모 업데이트
  const updateMemo = useCallback(
    async (
      id: string,
      formData: MemoFormData,
      summary?: string
    ): Promise<void> => {
      const updatedMemo = await memoActions.updateMemo(id, formData, summary)
      setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
    },
    []
  )

  // 메모 요약 저장 (요청 이후 본문이 바뀌었다면 오래된 요약이므로 서버에서 무시)
  const setMemoSummary = useCallback(
    async (
      id: string,
      summary: string,
      sourceContent: string
    ): Promise<void> => {
      const updatedMemo = await memoActions.setMemoSummary(
        id,
        summary,
        sourceContent
      )
      if (!updatedMemo) return
      setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
    },
    []
  )

  // 메모 삭제
  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    try {
      await memoActions.deleteMemo(id)
      setMemos(prev => prev.filter(memo => memo.id !== id))
    } catch (err) {
      console.error('Failed to delete memo:', err)
      setError('메모를 삭제하지 못했습니다.')
    }
  }, [])

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading,
    error,
    searchQuery,
    selectedCategory,
    stats,

    // 메모 CRUD
    createMemo,
    updateMemo,
    setMemoSummary,
    deleteMemo,
    getMemoById,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,
  }
}
