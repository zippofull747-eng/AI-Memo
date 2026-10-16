import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 서버 전용 클라이언트 (서버 액션에서만 사용)
export const createSupabaseServerClient = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      '.env.local에 SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY를 설정해주세요.'
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
