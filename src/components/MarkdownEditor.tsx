'use client'

import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { openExternalLinksInNewTab } from '@/utils/markdown'

// 브라우저 전용 라이브러리이므로 SSR 비활성화
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] flex items-center justify-center border border-gray-300 rounded-lg text-sm text-gray-500">
      에디터를 불러오는 중...
    </div>
  ),
})

interface MarkdownEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

export default function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  height = 360,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light" data-testid="markdown-editor">
      <MDEditor
        value={value}
        onChange={val => onChange(val ?? '')}
        preview="live"
        height={height}
        visibleDragbar={false}
        textareaProps={{ id, placeholder }}
        previewOptions={{ rehypeRewrite: openExternalLinksInNewTab }}
      />
    </div>
  )
}
