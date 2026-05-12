import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Content</h2>
          <p className="text-gray-400 mb-4">
            Manage your articles, images, videos, and audio files
          </p>
          <Link href="/admin/content">
            <Button>Manage Content</Button>
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Categories</h2>
          <p className="text-gray-400 mb-4">
            Organize your content with categories and subcategories
          </p>
          <Link href="/admin/categories">
            <Button>Manage Categories</Button>
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Collections</h2>
          <p className="text-gray-400 mb-4">
            Create curated collections like "Featured Work" or "B2B Marketing"
          </p>
          <Link href="/admin/collections">
            <Button>Manage Collections</Button>
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Resume</h2>
          <p className="text-gray-400 mb-4">
            Build your interactive resume timeline (2025→2010)
          </p>
          <Link href="/admin/resume">
            <Button>Edit Resume</Button>
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">Profile</h2>
          <p className="text-gray-400 mb-4">
            Update your business card, bio, skills, and contact info
          </p>
          <Link href="/admin/profile">
            <Button>Edit Profile</Button>
          </Link>
        </div>

      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-500">0</div>
            <div className="text-sm text-gray-400">Total Content</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-500">0</div>
            <div className="text-sm text-gray-400">Categories</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-500">0</div>
            <div className="text-sm text-gray-400">Collections</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-3xl font-bold text-orange-500">4</div>
            <div className="text-sm text-gray-400">Resume Types</div>
          </div>
        </div>
      </div>
    </div>
  )
}

