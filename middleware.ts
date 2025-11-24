import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from './lib/auth-edge'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    const publicPaths = ['/', '/api/auth/login']

    if (publicPaths.includes(pathname)) {
        return NextResponse.next()
    }

    const token = request.cookies.get('token')?.value

    console.log('Middleware - Path:', pathname)
    console.log('Middleware - Token:', token ? 'exists' : 'missing')

    if (!token) {
        console.log('Middleware - Redirecting to login (no token)')
        return NextResponse.redirect(new URL('/', request.url))
    }

    const payload = await verifyTokenEdge(token)

    if (!payload) {
        console.log('Middleware - Redirecting to login (invalid token)')
        return NextResponse.redirect(new URL('/', request.url))
    }

    console.log('Middleware - Token valid, allowing access')

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-role', payload.role)
    requestHeaders.set('x-user-branch', payload.branchId)

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    })
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/requisitions/:path*',
        '/reconciliations/:path*',
        '/fuel-coupons/:path*',
        '/imprest/:path*',
        '/reports/:path*',
        '/users/:path*',
        '/api/dashboard/:path*',
    ],
}
