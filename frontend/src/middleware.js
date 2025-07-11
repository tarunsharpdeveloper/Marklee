import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // User routes that admins shouldn't access
  const userRoutes = ['/dashboard', '/marketing', '/library', '/pre-homepage'];
  // Admin routes that regular users shouldn't access
  const adminRoutes = ['/usermanagement'];

  const isUserRoute = userRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  try {
    // Get user data from cookies
    const userData = request.cookies.get('user')?.value;
    if (!userData) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const user = JSON.parse(userData);

    // Check admin trying to access user routes
    if (isUserRoute && user.role === 'admin') {
      return NextResponse.redirect(new URL('/usermanagement', request.url));
    }

    // Check regular user trying to access admin routes
    if (isAdminRoute && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // If there's any error, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }
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