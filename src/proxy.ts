import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function proxy(req) {
    // 🪵 This will flash inside your terminal window on every single page click
    //console.log('🛡️ PROXY TRIGGERED FOR PATH:', req.nextUrl.pathname)
    return NextResponse.next()
  },
  {
    pages: {
      // If unauthorized, seamlessly redirect them to your root login screen
      signIn: '/',
    },
  },
)

export const config = {
  /*
   * 🚀 Global Catch-All Matcher
   * Matches all request paths EXCEPT for:
   * 1. / (Your root public landing/login page)
   * 2. /api/auth (Next-Auth endpoint files)
   * 3. /_next/static, /_next/image (Next.js framework compilation files)
   * 4. /favicon.ico, /images, /public (Static visual assets)
   */
  matcher: ['/((?!$|api/auth|api/cron|_next/static|_next/image|favicon.ico|public|images|logo).*)'],
}
