'use server'

import { v4 as uuidv4 } from 'uuid'
import { Memo, MemoFormData } from '@/types/memo'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { MemoRow, rowToMemo, formDataToRow } from '@/utils/memoMapper'

const TABLE = 'memos'

const fail = (message: string, error: unknown): never => {
  console.error(message, error)
  throw new Error(message)
}

export async function getMemos(): Promise<Memo[]> {
  const { data, error } = await createSupabaseServerClient()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .returns<MemoRow[]>()

  if (error) return fail('메모를 불러오지 못했습니다.', error)
  return data.map(rowToMemo)
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const { data, error } = await createSupabaseServerClient()
    .from(TABLE)
    .insert({ id: uuidv4(), ...formDataToRow(formData) })
    .select('*')
    .single<MemoRow>()

  if (error) return fail('메모를 저장하지 못했습니다.', error)
  return rowToMemo(data)
}

export async function updateMemo(
  id: string,
  formData: MemoFormData,
  summary?: string
): Promise<Memo> {
  const { data, error } = await createSupabaseServerClient()
    .from(TABLE)
    .update({
      ...formDataToRow(formData),
      ...(summary !== undefined && { summary }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single<MemoRow>()

  if (error) return fail('메모를 수정하지 못했습니다.', error)
  return rowToMemo(data)
}

// 요약 저장 (요청 이후 본문이 바뀌었다면 오래된 요약이므로 null 반환, updated_at은 유지)
export async function setMemoSummary(
  id: string,
  summary: string,
  sourceContent: string
): Promise<Memo | null> {
  const { data, error } = await createSupabaseServerClient()
    .from(TABLE)
    .update({ summary })
    .eq('id', id)
    .eq('content', sourceContent)
    .select('*')
    .maybeSingle<MemoRow>()

  if (error) return fail('요약을 저장하지 못했습니다.', error)
  return data ? rowToMemo(data) : null
}

export async function deleteMemo(id: string): Promise<void> {
  const { error } = await createSupabaseServerClient()
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) fail('메모를 삭제하지 못했습니다.', error)
}
