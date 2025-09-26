import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  // Auth routes
  '/sign-in(.*)',

  // Public browsing routes
  '/',
  '/search(.*)',
  '/website/(.*)',
  '/blog(.*)',
  '/category(.*)',
  '/tag(.*)',
  '/collection(.*)',

  // Public API routes (read-only)
  '/api/websites(.*)',
  '/api/categories(.*)',
  '/api/tags(.*)',
  '/api/health(.*)',
  '/api/favicon(.*)',
])

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/submit(.*)',
  '/admin(.*)',
  '/dashboard(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // If it's a protected route and user is not signed in, redirect to sign-in
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Allow all other requests
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
