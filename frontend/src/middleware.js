import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // User routes that admins shouldn't access
  const userRoutes = ['/dashboard', '/marketing', '/library', '/pre-homepage'];
  // Admin routes that regular users shouldn't access
  const adminRoutes = ['/usermanagement'];

  const isUserRoute = userRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // Since we can't access localStorage in middleware (server-side),
  // we'll handle auth in the components and use this middleware just for path protection
  if (isUserRoute || isAdminRoute) {
    // Allow the request to proceed - auth will be checked in the component
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // User routes
    '/dashboard/:path*',
    '/marketing/:path*',
    '/library/:path*',
    '/pre-homepage/:path*',
    // Admin routes
    '/usermanagement/:path*',
    '/usermanagement/prompt-edit/:path*',
    '/usermanagement/brief-questions/:path*'
  ]
}; 