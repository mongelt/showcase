'use client'

import Link from "next/link"
import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider"
import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <AdminRouteGuard>
        <div className="min-h-screen bg-gray-950">
          <header className="border-b border-gray-800 bg-gray-900">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <h1 className="text-xl font-bold text-white">Portfolio Admin</h1>
                  <nav className="flex gap-4">
                    <Link 
                      href="/admin" 
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/admin/content" 
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Content
                    </Link>
                    <Link 
                      href="/admin/categories" 
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Categories
                    </Link>
                    <Link 
                      href="/admin/collections" 
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Collections
                    </Link>
                    <Link 
                      href="/admin/resume" 
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Resume
                    </Link>
                    <Link 
                      href="/admin/resume-types" 
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Resume Types
                    </Link>
                    <Link
                      href="/admin/menu"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Menu
                    </Link>
                    <Link
                      href="/admin/custom-pdfs"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Custom PDFs
                    </Link>
                    <Link
                      href="/admin/profile"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/admin/about"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      About
                    </Link>
                    <Link
                      href="/admin/seo"
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      SEO
                    </Link>
                  </nav>
                </div>
                <Link 
                  href="/" 
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View Site →
                </Link>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </AdminRouteGuard>
    </AdminAuthProvider>
  )
}

