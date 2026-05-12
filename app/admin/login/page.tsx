'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleGoogleLogin() {
    setIsLoading(true)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/admin`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (error) {
      console.error('Admin login error:', error)
      alert('Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h1 className="mb-2 text-2xl font-bold text-white">Admin Login</h1>
        <p className="mb-6 text-sm text-gray-400">
          Sign in with the approved Google account.
        </p>
        <Button onClick={handleGoogleLogin} disabled={isLoading} className="w-full">
          {isLoading ? 'Redirecting...' : 'Continue with Google'}
        </Button>
      </div>
    </div>
  )
}
