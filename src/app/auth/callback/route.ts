import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Redirigir al home si todo sale bien
      return NextResponse.redirect(new URL('/', requestUrl.origin))
    }
  }

  // Redirigir a error si falla o no hay código
  return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
}

