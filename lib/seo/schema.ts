import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const fetchSeoData = cache(async () => {
  try {
    const supabase = await createClient()

    const [profileResult, resumeResult, collectionsResult, seoResult] = await Promise.all([
      supabase.from('profile').select('full_name, location').single(),
      supabase.from('resume_entries').select('title, subtitle').is('date_end', null),
      supabase.from('collections').select('name').order('order_index', { ascending: true }),
      supabase.from('seo_settings').select('*').eq('id', 1).single(),
    ])

    return {
      profile: profileResult.data ?? null,
      activeEntries: resumeResult.data ?? [],
      collections: collectionsResult.data ?? [],
      seo: seoResult.data ?? null,
    }
  } catch {
    return { profile: null, activeEntries: [], collections: [], seo: null }
  }
})

export async function buildSchema(siteUrl: string) {
  const supabase = await createClient()
  const { profile, activeEntries, collections, seo } = await fetchSeoData()

  // title = organization, subtitle = role/job title
  const jobTitles = activeEntries.map(e => e.subtitle).filter((s): s is string => !!s)
  const worksFor = activeEntries
    .filter(e => e.title)
    .map(e => ({ '@type': 'Organization', name: e.title }))

  // alumni_of stores [{ id, url? }] — fetch those entries to build alumniOf
  type AlumniRecord = { id: string; url?: string }
  const alumniRecords = (seo?.alumni_of as AlumniRecord[] | null) ?? []
  let alumniOf: Array<Record<string, string>> = []
  if (alumniRecords.length > 0) {
    const ids = alumniRecords.map(r => r.id)
    const { data: alumniEntries } = await supabase
      .from('resume_entries')
      .select('id, title, subtitle')
      .in('id', ids)
    if (alumniEntries) {
      // title = institution name, subtitle = degree/program
      alumniOf = alumniEntries.map(e => {
        const record = alumniRecords.find(r => r.id === e.id)
        return {
          '@type': 'Organization',
          name: e.title,
          ...(e.subtitle ? { description: e.subtitle } : {}),
          ...(record?.url ? { url: record.url } : {}),
        }
      })
    }
  }

  const person: Record<string, unknown> = {
    '@type': 'Person',
    name: profile?.full_name ?? '',
    url: siteUrl,
  }

  if (seo?.image_url) person.image = seo.image_url
  if (jobTitles.length > 0) person.jobTitle = jobTitles
  if (worksFor.length > 0) person.worksFor = worksFor
  if (alumniOf.length > 0) person.alumniOf = alumniOf
  if (collections.length > 0) person.knowsAbout = collections.map(c => c.name)
  if (profile?.location) person.homeLocation = { '@type': 'Place', name: profile.location }
  if (seo?.person_description) person.description = seo.person_description
  if (seo?.same_as?.length) person.sameAs = seo.same_as
  if (seo?.knows_language?.length) person.knowsLanguage = seo.knows_language

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: seo?.page_title ?? '',
    url: siteUrl,
    ...(seo?.updated_at ? { dateModified: seo.updated_at } : {}),
    mainEntity: person,
  }
}
