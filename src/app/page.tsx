'use client'

import { useState, useCallback, useMemo } from 'react'
import { useMemos } from '@/hooks/useMemos'
import { useFontSize } from '@/hooks/useFontSize'
import { Memo, MemoFormData } from '@/types/memo'
import { requestSummary } from '@/utils/summarize'
import MemoList from '@/components/MemoList'
import MemoForm from '@/components/MemoForm'
import MemoViewer from '@/components/MemoViewer'
import FontSizeControl from '@/components/FontSizeControl'

export default function Home() {
  const {
    memos,
    allMemos,
    loading,
    error,
    searchQuery,
    selectedCategory,
    stats,
    createMemo,
    updateMemo,
    setMemoSummary,
    deleteMemo,
    searchMemos,
    filterByCategory,
  } = useMemos()

  const { fontSize, changeFontSize } = useFontSize()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [viewingMemoId, setViewingMemoId] = useState<string | null>(null)

  // 요약 저장 등 메모 변경이 상세 보기에 반영되도록 id로 파생
  const viewingMemo = useMemo(
    () => allMemos.find(memo => memo.id === viewingMemoId) ?? null,
    [allMemos, viewingMemoId]
  )

  const handleCreateMemo = async (formData: MemoFormData) => {
    await createMemo(formData)
    setIsFormOpen(false)
  }

  const handleUpdateMemo = async (formData: MemoFormData) => {
    if (!editingMemo) return

    // 요약이 있는 메모의 본문이 바뀌면 새 요약이 만들어질 때까지 저장을 보류
    // (실패하면 예외가 폼으로 전달되어 저장이 취소됨)
    const needsNewSummary =
      editingMemo.summary !== undefined &&
      editingMemo.content !== formData.content
    const newSummary = needsNewSummary
      ? await requestSummary(formData.title, formData.content)
      : undefined

    await updateMemo(editingMemo.id, formData, newSummary)
    setEditingMemo(null)
  }

  const handleSummarize = useCallback(
    async (memo: Memo) => {
      const summary = await requestSummary(memo.title, memo.content)
      await setMemoSummary(memo.id, summary, memo.content)
    },
    [setMemoSummary]
  )

  const handleEditMemo = (memo: Memo) => {
    setViewingMemoId(null)
    setEditingMemo(memo)
    setIsFormOpen(true)
  }

  const handleViewMemo = useCallback((memo: Memo) => {
    setViewingMemoId(memo.id)
  }, [])

  const handleCloseViewer = useCallback(() => {
    setViewingMemoId(null)
  }, [])

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingMemo(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">📝 메모 앱</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <FontSizeControl fontSize={fontSize} onChange={changeFontSize} />
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                새 메모
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div
            role="alert"
            data-testid="memo-error"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        <MemoList
          memos={memos}
          loading={loading}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onSearchChange={searchMemos}
          onCategoryChange={filterByCategory}
          onViewMemo={handleViewMemo}
          onEditMemo={handleEditMemo}
          onDeleteMemo={deleteMemo}
          stats={stats}
        />
      </main>

      {/* 상세 보기 모달 */}
      <MemoViewer
        memo={viewingMemo}
        onClose={handleCloseViewer}
        onEdit={handleEditMemo}
        onDelete={deleteMemo}
        onSummarize={handleSummarize}
      />

      {/* 모달 폼 */}
      <MemoForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={editingMemo ? handleUpdateMemo : handleCreateMemo}
        editingMemo={editingMemo}
      />
    </div>
  )
}
