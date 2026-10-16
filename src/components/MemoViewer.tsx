'use client'

import { useState, useEffect, useCallback } from 'react'
import { Memo, MEMO_CATEGORIES, getCategoryColor } from '@/types/memo'
import MarkdownViewer from './MarkdownViewer'

interface MemoViewerProps {
  memo: Memo | null
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onSummarize: (memo: Memo) => Promise<void>
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function MemoViewer({
  memo,
  onClose,
  onEdit,
  onDelete,
  onSummarize,
}: MemoViewerProps) {
  const isOpen = memo !== null
  const memoId = memo?.id
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // 다른 메모로 바뀌면 요약 오류 상태 초기화
  useEffect(() => {
    setSummaryError(null)
  }, [memoId])

  const handleSummarize = useCallback(async () => {
    if (!memo) return
    setIsSummarizing(true)
    setSummaryError(null)
    try {
      await onSummarize(memo)
    } catch (error) {
      setSummaryError(
        error instanceof Error ? error.message : '요약 생성에 실패했습니다.'
      )
    } finally {
      setIsSummarizing(false)
    }
  }, [memo, onSummarize])

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!memo) return null

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="memo-viewer-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-viewer-title"
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        data-testid="memo-viewer"
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h2
                id="memo-viewer-title"
                className="text-2xl font-semibold text-gray-900 mb-2 break-words"
              >
                {memo.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getCategoryColor(memo.category)}`}
                >
                  {MEMO_CATEGORIES[
                    memo.category as keyof typeof MEMO_CATEGORIES
                  ] || memo.category}
                </span>
                <span className="text-xs text-gray-500">
                  수정 {formatDate(memo.updatedAt)}
                </span>
                <span className="text-xs text-gray-500">
                  작성 {formatDate(memo.createdAt)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="memo-viewer-close-btn"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* AI 요약 */}
          <section
            className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg"
            aria-label="AI 요약"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-blue-900">AI 요약</h3>
              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="memo-viewer-summarize-btn"
              >
                {isSummarizing
                  ? '요약 중...'
                  : summaryError
                    ? '다시 시도'
                    : memo.summary
                      ? '다시 요약'
                      : 'AI 요약'}
              </button>
            </div>
            {summaryError && (
              <p
                role="alert"
                className="text-sm text-red-600"
                data-testid="memo-viewer-summary-error"
              >
                {summaryError}
              </p>
            )}
            {memo.summary ? (
              <div className="break-words" data-testid="memo-viewer-summary">
                <MarkdownViewer source={memo.summary} />
              </div>
            ) : (
              !summaryError && (
                <p className="text-sm text-gray-500">
                  버튼을 눌러 이 메모를 AI로 요약해보세요.
                </p>
              )
            )}
          </section>

          {/* 내용 */}
          <div className="mb-6 break-words">
            <MarkdownViewer source={memo.content} />
          </div>

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              data-testid="memo-viewer-delete-btn"
            >
              삭제
            </button>
            <button
              onClick={() => onEdit(memo)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              data-testid="memo-viewer-edit-btn"
            >
              편집
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
