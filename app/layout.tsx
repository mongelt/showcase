import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Crimson_Pro, Public_Sans } from 'next/font/google'
import "./globals.css";
import { fetchSeoData, buildSchema } from '@/lib/seo/schema'

// Redesign Fonts
const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '600', '700'],
  display: 'swap',
})

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-ui',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500'],
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://beregovskiy.com'

export async function generateMetadata(): Promise<Metadata> {
  const { profile, seo } = await fetchSeoData()

  const title = seo?.page_title || 'Beregovskiy Portfolio'
  const description = seo?.page_description || 'Professional Portfolio Website'
  const imageUrl = seo?.image_url ?? null

  const nameParts = (profile?.full_name ?? '').trim().split(/\s+/)
  const firstName = nameParts[0] ?? ''
  const lastName = nameParts.slice(1).join(' ') ?? ''

  return {
    title,
    description,
    authors: profile?.full_name ? [{ name: profile.full_name }] : undefined,
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      type: 'profile',
      title,
      description,
      url: SITE_URL,
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
      firstName,
      lastName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const schema = await buildSchema(SITE_URL)

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${crimsonPro.variable} ${publicSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-body antialiased`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        {children}
      </body>
    </html>
  );
}
