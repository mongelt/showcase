'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminAuth } from '@/components/admin/AdminAuthProvider'

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (loading) return

    if (!session && !isLoginPage) {
      router.replace('/')
      return
    }

    if (session && isLoginPage) {
      router.replace('/admin')
    }
  }, [loading, session, isLoginPage, router])

  if (loading) {
    return <div className="text-white">Checking login...</div>
  }

  if (!session && !isLoginPage) {
    return null
  }

  return <>{children}</>
}
