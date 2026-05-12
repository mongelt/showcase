import type { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const params = await searchParams
  if (params.content) {
    return { robots: { index: false, follow: false } }
  }
  return {}
}

export default function Home() {
  return <HomeClient />
}
