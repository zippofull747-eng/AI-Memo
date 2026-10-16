import { SummarizeResponse } from '@/types/memo'

const DEFAULT_ERROR_MESSAGE = '요약 생성에 실패했습니다. 다시 시도해주세요.'

export const requestSummary = async (
  title: string,
  content: string
): Promise<string> => {
  let response: Response
  try {
    response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    })
  } catch (error) {
    console.error('Error requesting summary:', error)
    throw new Error('네트워크 오류로 요약을 생성하지 못했습니다.')
  }

  if (!response.ok) {
    const data: { error?: string } | null = await response
      .json()
      .catch(() => null)
    throw new Error(data?.error ?? DEFAULT_ERROR_MESSAGE)
  }

  const data: SummarizeResponse = await response.json()
  return data.summary
}
