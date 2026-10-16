import { randomUUID } from 'crypto'
import { test, expect, Page } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { createClient } from '@supabase/supabase-js'

// .env.local의 Supabase 설정 로드 (테스트 프로세스용)
loadEnvConfig(process.cwd())

const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_PUBLISHABLE_KEY ?? ''
)

interface TestMemo {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  summary?: string
}

// 병렬 실행(브라우저별)에서 충돌하지 않도록 매번 고유한 임시 메모를 생성
const createTestMemo = (overrides: Partial<TestMemo> = {}): TestMemo => {
  const id = randomUUID()
  return {
    id,
    title: `요약 테스트 메모 ${id.slice(0, 8)}`,
    content: '요약 테스트를 위한 본문입니다.',
    category: 'work',
    tags: ['테스트'],
    ...overrides,
  }
}

const createdIds: string[] = []

const seedMemo = async (memo: TestMemo) => {
  const { error } = await supabase.from('memos').insert({
    id: memo.id,
    title: memo.title,
    content: memo.content,
    category: memo.category,
    tags: memo.tags,
    summary: memo.summary ?? null,
  })
  if (error) throw error
  createdIds.push(memo.id)
}

const storedMemo = async (id: string) => {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

test.afterEach(async () => {
  // 시드 데이터는 건드리지 않고 직접 만든 임시 메모만 정리
  if (createdIds.length === 0) return
  await supabase.from('memos').delete().in('id', createdIds)
  createdIds.length = 0
})

const mockSummarize = async (
  page: Page,
  handler: (callCount: number) => { status: number; body: object }
) => {
  const state = { calls: 0 }
  await page.route('**/api/summarize', async route => {
    state.calls += 1
    const { status, body } = handler(state.calls)
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
  return state
}

const openViewer = async (page: Page, memo: TestMemo) => {
  await page.goto('/')
  await page.getByTestId('memo-card').filter({ hasText: memo.title }).click()
  await expect(page.getByTestId('memo-viewer')).toBeVisible()
}

const editContent = async (page: Page, content: string) => {
  await page.getByTestId('memo-viewer-edit-btn').click()
  const textarea = page.locator('#content')
  await textarea.fill(content)
}

test.describe('메모 AI 요약', () => {
  test('요약을 생성하면 상세보기에 표시되고 새로고침 후에도 유지된다', async ({
    page,
  }) => {
    const memo = createTestMemo()
    await seedMemo(memo)
    await mockSummarize(page, () => ({
      status: 200,
      body: { summary: '- 첫 번째 핵심\n- 두 번째 핵심' },
    }))

    await openViewer(page, memo)
    await page.getByTestId('memo-viewer-summarize-btn').click()

    await expect(page.getByTestId('memo-viewer-summary')).toContainText(
      '첫 번째 핵심'
    )
    await expect(page.getByTestId('memo-viewer-summarize-btn')).toHaveText(
      '다시 요약'
    )

    await page.reload()
    await page.getByTestId('memo-card').filter({ hasText: memo.title }).click()
    await expect(page.getByTestId('memo-viewer-summary')).toContainText(
      '두 번째 핵심'
    )
  })

  test('요약 생성 실패 시 오류와 재시도 버튼이 표시된다', async ({ page }) => {
    const memo = createTestMemo()
    await seedMemo(memo)
    await mockSummarize(page, () => ({
      status: 502,
      body: { error: '요약 생성에 실패했습니다.' },
    }))

    await openViewer(page, memo)
    await page.getByTestId('memo-viewer-summarize-btn').click()

    await expect(page.getByTestId('memo-viewer-summary-error')).toContainText(
      '요약 생성에 실패했습니다.'
    )
    await expect(page.getByTestId('memo-viewer-summarize-btn')).toHaveText(
      '다시 시도'
    )
    expect((await storedMemo(memo.id)).summary).toBeNull()
  })

  test('요약이 있는 메모의 본문을 수정하면 새 요약으로 교체된다', async ({
    page,
  }) => {
    const memo = createTestMemo({ summary: '- 이전 요약' })
    await seedMemo(memo)
    const mock = await mockSummarize(page, () => ({
      status: 200,
      body: { summary: '- 새 요약' },
    }))

    await openViewer(page, memo)
    await editContent(page, '수정된 본문입니다.')
    await page.getByTestId('memo-form-submit-btn').click()

    await expect(page.getByTestId('memo-form-submit-btn')).toBeHidden()
    expect(mock.calls).toBe(1)
    const stored = await storedMemo(memo.id)
    expect(stored.content).toBe('수정된 본문입니다.')
    expect(stored.summary).toBe('- 새 요약')
  })

  test('요약 재생성에 실패하면 저장이 막히고 폼이 유지된다', async ({
    page,
  }) => {
    const memo = createTestMemo({ summary: '- 이전 요약' })
    await seedMemo(memo)
    await mockSummarize(page, () => ({
      status: 429,
      body: { error: '요약 요청 한도를 초과했습니다.' },
    }))

    await openViewer(page, memo)
    await editContent(page, '수정된 본문입니다.')
    await page.getByTestId('memo-form-submit-btn').click()

    await expect(page.getByTestId('memo-form-error')).toContainText(
      '요약 요청 한도를 초과했습니다.'
    )
    await expect(page.getByTestId('memo-form-submit-btn')).toBeVisible()
    const stored = await storedMemo(memo.id)
    expect(stored.content).toBe(memo.content)
    expect(stored.summary).toBe('- 이전 요약')
  })

  test('요약이 없는 메모는 수정해도 요약 API를 호출하지 않는다', async ({
    page,
  }) => {
    const memo = createTestMemo()
    await seedMemo(memo)
    const mock = await mockSummarize(page, () => ({
      status: 200,
      body: { summary: '- 호출되면 안 됨' },
    }))

    await openViewer(page, memo)
    await editContent(page, '수정된 본문입니다.')
    await page.getByTestId('memo-form-submit-btn').click()

    await expect(page.getByTestId('memo-form-submit-btn')).toBeHidden()
    expect(mock.calls).toBe(0)
    expect((await storedMemo(memo.id)).summary).toBeNull()
  })

  test('본문이 그대로이면 요약이 있어도 재생성하지 않고 유지한다', async ({
    page,
  }) => {
    const memo = createTestMemo({ summary: '- 기존 요약' })
    await seedMemo(memo)
    const mock = await mockSummarize(page, () => ({
      status: 200,
      body: { summary: '- 호출되면 안 됨' },
    }))

    await openViewer(page, memo)
    await page.getByTestId('memo-viewer-edit-btn').click()
    await page.locator('#title').fill('제목만 변경')
    await page.getByTestId('memo-form-submit-btn').click()

    await expect(page.getByTestId('memo-form-submit-btn')).toBeHidden()
    expect(mock.calls).toBe(0)
    const stored = await storedMemo(memo.id)
    expect(stored.title).toBe('제목만 변경')
    expect(stored.summary).toBe('- 기존 요약')
  })
})
