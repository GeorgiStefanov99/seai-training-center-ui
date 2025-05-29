import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Empty middleware that does nothing - for static export compatibility
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Empty matcher to avoid middleware running on any routes
export const config = {
  matcher: []
}
