import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeJwt } from 'jose' // Import JWT decoder

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // 🔹 Debug: Print all cookies received
  console.log("Cookies received in middleware:", req.cookies.getAll());

  const accessToken = req.cookies.get("sb-access-token")?.value;

  let session = null;

  if (accessToken) {
    console.log("✅ Access token found:", accessToken);

    try {
      // Decode the JWT token to extract session data
      session = decodeJwt(accessToken);
      console.log("✅ Decoded session from token:", session);
    } catch (error) {
      console.error("⚠️ Error decoding access token:", error);
    }
  } else {
    console.log("⚠️ No access token found in middleware!");
  }

  console.log('Request URL:', req.nextUrl.pathname)

  // Protect routes that require authentication
  if (!session && (
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/petition')
  )) {
    console.log('🔒 Redirecting to login - No session found')
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Redirect authenticated users away from auth pages
  if (session && (
    req.nextUrl.pathname.startsWith('/auth/login') ||
    req.nextUrl.pathname.startsWith('/auth/signup')
  )) {
    console.log('🔄 Redirecting to dashboard - Already authenticated')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/petition/:path*', '/auth/:path*'],
}
