'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'
import type { PartialBlock } from '@blocknote/core'

const BlockNoteEditor = dynamic(() => import('@/components/editor/BlockNoteEditorDynamic'), {
  ssr: false,
})

type NavCardOption = {
  type: 'category' | 'subcategory' | 'collection'
  id: string
  name: string
}

type ResumeEntryOption = {
  id: string
  title: string
  subtitle: string | null
  date_start: string | null
  date_end: string | null
}

export default function ProfileManagement() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState('')
  
  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [jobTitle1, setJobTitle1] = useState('')
  const [jobTitle2, setJobTitle2] = useState('')
  const [jobTitle3, setJobTitle3] = useState('')
  const [jobTitle4, setJobTitle4] = useState('')
  const [shortBioData, setShortBioData] = useState<PartialBlock[] | undefined>()
  const [fullBioData, setFullBioData] = useState<PartialBlock[] | undefined>()
  const [collapsedProfileHeight, setCollapsedProfileHeight] = useState<string>('') // pixels
  const [shortBioMarginTop, setShortBioMarginTop] = useState<string>('')
  const [shortBioLoadingMarginTop, setShortBioLoadingMarginTop] = useState<string>('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [showPhone, setShowPhone] = useState(false)
  const [showSocialMedia, setShowSocialMedia] = useState(false)
  const [education, setEducation] = useState('')
  const [navCardOptions, setNavCardOptions] = useState<NavCardOption[]>([])
  const [resumeEntryOptions, setResumeEntryOptions] = useState<ResumeEntryOption[]>([])
  const [portfolioCard1, setPortfolioCard1] = useState('')
  const [portfolioCard2, setPortfolioCard2] = useState('')
  const [portfolioCard3, setPortfolioCard3] = useState('')
  const [resumeCard1, setResumeCard1] = useState('')
  const [resumeCard2, setResumeCard2] = useState('')
  const [jhuEntryId, setJhuEntryId] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    try {
    const { data: profileData, error: profileError } = await supabase
        .from('profile')
        .select('*')
        .limit(1)
        .single()

      if (profileError || !profileData) {
        alert('Error loading profile')
        setLoading(false)
        return
      }

      setProfileId(profileData.id)
      setFullName(profileData.full_name || '')
      setLocation(profileData.location || '')
      setJobTitle1(profileData.job_title_1 || '')
      setJobTitle2(profileData.job_title_2 || '')
      setJobTitle3(profileData.job_title_3 || '')
      setJobTitle4(profileData.job_title_4 || '')
      setShortBioData(profileData.short_bio)
      setFullBioData(profileData.full_bio)
      setCollapsedProfileHeight(
        profileData.collapsed_profile_height !== null && profileData.collapsed_profile_height !== undefined
          ? String(profileData.collapsed_profile_height)
          : ''
      )
      setShortBioMarginTop(
        profileData.short_bio_margin_top != null ? String(profileData.short_bio_margin_top) : ''
      )
      setShortBioLoadingMarginTop(
        profileData.short_bio_loading_margin_top != null ? String(profileData.short_bio_loading_margin_top) : ''
      )
      setEmail(profileData.email || '')
      setPhone(profileData.phone || '')
      setLinkedin(profileData.linkedin || '')
      setShowEmail(profileData.show_email || false)
      setShowPhone(profileData.show_phone || false)
      setShowSocialMedia(profileData.show_social_media || false)
      setEducation(profileData.education || '')

      const [
        { data: collectionsData },
        { data: categoriesData },
        { data: subcategoriesData },
        { data: resumeEntriesData },
      ] = await Promise.all([
        supabase.from('collections').select('id, name').order('name'),
        supabase.from('categories').select('id, name').order('order_index'),
        supabase.from('subcategories').select('id, name').order('order_index'),
        supabase.from('resume_entries').select('id, title, subtitle, date_start, date_end').order('date_start', { ascending: false }),
      ])

      const navOptions: NavCardOption[] = [
        ...(categoriesData || []).map((r: any) => ({ type: 'category' as const, id: r.id, name: r.name })),
        ...(subcategoriesData || []).map((r: any) => ({ type: 'subcategory' as const, id: r.id, name: r.name })),
        ...(collectionsData || []).map((r: any) => ({ type: 'collection' as const, id: r.id, name: r.name })),
      ]
      setNavCardOptions(navOptions)

      setResumeEntryOptions(
        (resumeEntriesData || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          subtitle: r.subtitle ?? null,
          date_start: r.date_start ?? null,
          date_end: r.date_end ?? null,
        }))
      )

      const pCards: Array<{ type: string; id: string }> = profileData.portfolio_plane_cards || []
      setPortfolioCard1(pCards[0] ? `${pCards[0].type}:${pCards[0].id}` : '')
      setPortfolioCard2(pCards[1] ? `${pCards[1].type}:${pCards[1].id}` : '')
      setPortfolioCard3(pCards[2] ? `${pCards[2].type}:${pCards[2].id}` : '')

      const rCards: string[] = profileData.resume_plane_cards || []
      setResumeCard1(rCards[0] || '')
      setResumeCard2(rCards[1] || '')
      setJhuEntryId(profileData.jhu_entry_id || '')
    } catch (err) {
      alert('Error loading profile data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!profileId) {
      alert('Profile not loaded yet.')
      return
    }

    const parsedHeight =
      collapsedProfileHeight.trim() === ''
        ? null
        : Math.floor(Number(collapsedProfileHeight))

    if (parsedHeight !== null) {
      if (Number.isNaN(parsedHeight)) {
        alert('Collapsed height must be a number (pixels).')
        return
      }
      if (parsedHeight < 20) {
        alert('Collapsed height must be at least 20px.')
        return
      }
    }

    const parsedShortBioMarginTop =
      shortBioMarginTop.trim() === '' ? null : Math.floor(Number(shortBioMarginTop))
    if (parsedShortBioMarginTop !== null && (Number.isNaN(parsedShortBioMarginTop) || parsedShortBioMarginTop < 0)) {
      alert('Short bio margin-top must be a non-negative number (pixels).')
      return
    }

    const parsedShortBioLoadingMarginTop =
      shortBioLoadingMarginTop.trim() === '' ? null : Math.floor(Number(shortBioLoadingMarginTop))
    if (parsedShortBioLoadingMarginTop !== null && (Number.isNaN(parsedShortBioLoadingMarginTop) || parsedShortBioLoadingMarginTop < 0)) {
      alert('Short bio loading state margin-top must be a non-negative number (pixels).')
      return
    }

    if (!portfolioCard1) {
      alert('Portfolio Card 1 is required.')
      return
    }
    if (!resumeCard1) {
      alert('Resume Card 1 is required.')
      return
    }

    const parseNavCard = (val: string) => {
      if (!val) return null
      const colonIdx = val.indexOf(':')
      return { type: val.substring(0, colonIdx), id: val.substring(colonIdx + 1) }
    }
    const portfolioPlaneCards = [portfolioCard1, portfolioCard2, portfolioCard3]
      .map(parseNavCard)
      .filter(Boolean)
    const resumePlaneCards = [resumeCard1, resumeCard2].filter(Boolean)

    // Extract image sizes from BlockNote image blocks in full_bio
    // BlockNote only stores previewWidth - let browser calculate height to preserve aspect ratio
    let fullBioImageSizes: Record<string, { width?: number; height?: number }> | null = null
    if (fullBioData) {
      fullBioImageSizes = {}
      fullBioData.forEach((block) => {
        if (block.type === 'image' && block.props?.url) {
          const url = block.props.url as string
          const width = block.props.previewWidth as number | undefined
          if (width) {
            // Only store width - browser will calculate height to maintain aspect ratio
            fullBioImageSizes![url] = { width }
          }
        }
      })
      // Set to null if no images found (matches original behavior)
      if (fullBioImageSizes && Object.keys(fullBioImageSizes).length === 0) {
        fullBioImageSizes = null
      }
    }

    const profileData = {
      full_name: fullName,
      location: location,
      job_title_1: jobTitle1,
      job_title_2: jobTitle2,
      job_title_3: jobTitle3,
      job_title_4: jobTitle4,
      short_bio: shortBioData,
      full_bio: fullBioData,
      full_bio_image_sizes: fullBioImageSizes,
      collapsed_profile_height: parsedHeight,
      short_bio_margin_top: parsedShortBioMarginTop,
      short_bio_loading_margin_top: parsedShortBioLoadingMarginTop,
      email: email,
      phone: phone,
      linkedin: linkedin,
      show_email: showEmail,
      show_phone: showPhone,
      show_social_media: showSocialMedia,
      education: education,
      portfolio_plane_cards: portfolioPlaneCards.length > 0 ? portfolioPlaneCards : null,
      resume_plane_cards: resumePlaneCards.length > 0 ? resumePlaneCards : null,
      jhu_entry_id: jhuEntryId || null,
    }

    const { error: profileError } = await supabase
      .from('profile')
      .update(profileData)
      .eq('id', profileId)

    if (profileError) {
      alert('Error updating profile: ' + profileError.message)
      return
    }

    alert('Profile updated successfully!')
  }

  if (loading) return <div className="text-white">Loading...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Profile Management</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name *
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Collapsed Profile height (px)
            </label>
            <Input
              type="number"
              min={0}
              value={collapsedProfileHeight}
              onChange={(e) => setCollapsedProfileHeight(e.target.value)}
              placeholder="e.g., 200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Sets the collapsed Profile card height in pixels; overflow is clipped.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Short bio margin-top (px)
            </label>
            <Input
              type="number"
              min={0}
              value={shortBioMarginTop}
              onChange={(e) => setShortBioMarginTop(e.target.value)}
              placeholder="e.g., 24"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pushes the short bio down in the desktop profile card. Leave empty for no margin.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Short bio loading state margin-top (px)
            </label>
            <Input
              type="number"
              min={0}
              value={shortBioLoadingMarginTop}
              onChange={(e) => setShortBioLoadingMarginTop(e.target.value)}
              placeholder="e.g., 24"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pushes the short bio down in the loading screen. Leave empty for no margin.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., New York, USA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Title 1
            </label>
            <Input
              value={jobTitle1}
              onChange={(e) => setJobTitle1(e.target.value)}
              placeholder="e.g., Senior Journalist"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Title 2
            </label>
            <Input
              value={jobTitle2}
              onChange={(e) => setJobTitle2(e.target.value)}
              placeholder="e.g., Content Creator"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Title 3
            </label>
            <Input
              value={jobTitle3}
              onChange={(e) => setJobTitle3(e.target.value)}
              placeholder="Additional title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Title 4
            </label>
            <Input
              value={jobTitle4}
              onChange={(e) => setJobTitle4(e.target.value)}
              placeholder="Additional title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Short Bio
            </label>
            <p className="text-xs text-gray-500 mb-2">Brief professional summary (shows on collapsed business card)</p>
            <div className="rounded-lg border border-gray-700 min-h-[300px] p-6" style={{ backgroundColor: '#1f1f1f', colorScheme: 'light' }}>
              <BlockNoteEditor
                data={shortBioData}
                onChange={(data) => setShortBioData(data as any)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Bio
            </label>
            <p className="text-xs text-gray-500 mb-2">Detailed bio (shows when business card is expanded)</p>
            <div className="rounded-lg border border-gray-700 min-h-[400px] p-6" style={{ backgroundColor: '#1f1f1f', colorScheme: 'light' }}>
              <BlockNoteEditor
                data={fullBioData}
                onChange={(data) => setFullBioData(data as any)}
              />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
            <label className="flex items-center gap-2 text-gray-300 mt-2">
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                className="rounded border-gray-700 bg-gray-950"
              />
              <span className="text-sm">Show email on public profile</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
            <label className="flex items-center gap-2 text-gray-300 mt-2">
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(e) => setShowPhone(e.target.checked)}
                className="rounded border-gray-700 bg-gray-950"
              />
              <span className="text-sm">Show phone on public profile</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              LinkedIn URL
            </label>
            <Input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
            />
            <label className="flex items-center gap-2 text-gray-300 mt-2">
              <input
                type="checkbox"
                checked={showSocialMedia}
                onChange={(e) => setShowSocialMedia(e.target.checked)}
                className="rounded border-gray-700 bg-gray-950"
              />
              <span className="text-sm">Show social media on public profile</span>
            </label>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h2 className="text-xl font-semibold text-white mb-4">Professional Details</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Education
            </label>
            <Input
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g., BA in Journalism, University of Example"
            />
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h2 className="text-xl font-semibold text-white mb-1">Profile Navigation Planes</h2>
            <p className="text-sm text-gray-400 mb-6">Cards shown in the Portfolio and Resume sections of the expanded profile tab.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Portfolio Plane Cards</label>
                <p className="text-xs text-gray-500 mb-3">Card 1 is required. Each card can be a category, subcategory, or collection.</p>
                {(['1', '2', '3'] as const).map((slot) => {
                  const value = slot === '1' ? portfolioCard1 : slot === '2' ? portfolioCard2 : portfolioCard3
                  const setValue = slot === '1' ? setPortfolioCard1 : slot === '2' ? setPortfolioCard2 : setPortfolioCard3
                  return (
                    <div key={slot} className="mb-3">
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Card {slot}{slot === '1' ? ' *' : ' (optional)'}
                      </label>
                      <select
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                      >
                        <option value="">— Select a card —</option>
                        <optgroup label="Categories">
                          {navCardOptions.filter(o => o.type === 'category').map(o => (
                            <option key={o.id} value={`category:${o.id}`}>{o.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Subcategories">
                          {navCardOptions.filter(o => o.type === 'subcategory').map(o => (
                            <option key={o.id} value={`subcategory:${o.id}`}>{o.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Collections">
                          {navCardOptions.filter(o => o.type === 'collection').map(o => (
                            <option key={o.id} value={`collection:${o.id}`}>{o.name}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )
                })}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">JHU Logo — Links to Resume Entry</label>
                <p className="text-xs text-gray-500 mb-3">When set, clicking the JHU logo on the resume plane opens this entry in the Resume tab.</p>
                <select
                  value={jhuEntryId}
                  onChange={(e) => setJhuEntryId(e.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                >
                  <option value="">— No link (logo not clickable) —</option>
                  {resumeEntryOptions.map(entry => {
                    const startYear = entry.date_start ? new Date(entry.date_start).getFullYear() : ''
                    const endYear = entry.date_end ? new Date(entry.date_end).getFullYear() : 'Present'
                    const dateRange = startYear ? `${startYear}–${endYear}` : ''
                    const label = [entry.title, entry.subtitle, dateRange].filter(Boolean).join(' · ')
                    return <option key={entry.id} value={entry.id}>{label}</option>
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Resume Plane Cards</label>
                <p className="text-xs text-gray-500 mb-3">Card 1 is required. Select resume entries to display.</p>
                {(['1', '2'] as const).map((slot) => {
                  const value = slot === '1' ? resumeCard1 : resumeCard2
                  const setValue = slot === '1' ? setResumeCard1 : setResumeCard2
                  return (
                    <div key={slot} className="mb-3">
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Card {slot}{slot === '1' ? ' *' : ' (optional)'}
                      </label>
                      <select
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                      >
                        <option value="">— Select a resume entry —</option>
                        {resumeEntryOptions.map(entry => {
                          const startYear = entry.date_start ? new Date(entry.date_start).getFullYear() : ''
                          const endYear = entry.date_end ? new Date(entry.date_end).getFullYear() : 'Present'
                          const dateRange = startYear ? `${startYear}–${endYear}` : ''
                          const label = [entry.title, entry.subtitle, dateRange].filter(Boolean).join(' · ')
                          return <option key={entry.id} value={entry.id}>{label}</option>
                        })}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit">Save Profile</Button>
          <Button type="button" variant="outline" onClick={() => loadProfile()}>
            Reset Changes
          </Button>
        </div>
      </form>
    </div>
  )
}

