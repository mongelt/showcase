import { createClient } from '@/lib/supabase/client'

const getHtml2Pdf = async () => {
  if (typeof window === 'undefined') return null
  const html2pdf = (await import('html2pdf.js')).default
  return html2pdf
}

type ContentData = {
  id: string
  title: string
  subtitle: string | null
  author_name: string | null
  publication_name: string | null
  publication_date: string | null
  copyright_notice: string | null
  content_body: any
}

type CollectionData = {
  id: string
  slug: string
  name: string
  description: any
}

type CollectionContentItem = {
  id: string
  title: string
  subtitle: string | null
  content_body: any
  order_index: number | null
}

// Shared CSS for .content blocks and .pdf-block — used in both article and collection PDF templates
const CONTENT_CSS = `
  .content {
    font-size: 14px;
    line-height: 1.8;
  }

  .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
    color: #000;
    margin-top: 25px;
    margin-bottom: 15px;
  }

  .content h1 { font-size: 20px; }
  .content h2 { font-size: 18px; }
  .content h3 { font-size: 16px; }
  .content h4 { font-size: 14px; }

  .content p {
    margin-bottom: 15px;
    text-align: justify;
  }

  .content ul, .content ol {
    margin-bottom: 15px;
    padding-left: 0;
    list-style: none;
  }

  .content li {
    margin-bottom: 5px;
    line-height: 1.6;
    position: relative;
    padding-left: 20px;
  }

  .content ul > li::before {
    content: '•';
    position: absolute;
    left: 0;
    top: 0.35em;
    font-size: 0.9em;
    line-height: 1;
  }

  .content ol {
    counter-reset: pdf-ol;
  }

  .content ol > li {
    counter-increment: pdf-ol;
    padding-left: 28px;
  }

  .content ol > li::before {
    content: counter(pdf-ol) ".";
    position: absolute;
    left: 0;
    top: 0.25em;
    font-size: 0.9em;
    line-height: 1;
  }

  .content blockquote {
    border-left: 4px solid #ccc;
    margin: 20px 0;
    padding-left: 20px;
    font-style: italic;
    color: #666;
  }

  .content code {
    background-color: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }

  .content pre {
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 5px;
    overflow-x: auto;
    margin: 15px 0;
  }

  .content pre code {
    background: none;
    padding: 0;
  }

  .content table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }

  .content th, .content td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  .content th {
    background-color: #f5f5f5;
    font-weight: bold;
  }

  .content table.pdf-columns,
  .content table.pdf-columns td {
    border: none !important;
  }

  .content table.pdf-columns {
    margin: 15px 0;
  }

  .pdf-block {
    break-inside: avoid;
    page-break-inside: avoid;
  }
`

export async function generateArticlePDF(contentId: string): Promise<Blob> {
  const supabase = createClient()

  const { data: content, error } = await supabase
    .from('content')
    .select(`
      id,
      title,
      subtitle,
      author_name,
      publication_name,
      publication_date,
      copyright_notice,
      content_body
    `)
    .eq('id', contentId)
    .single()

  if (error || !content) {
    throw new Error('Content not found')
  }

  const htmlContent = createPDFHTML(content)

  const html2pdf = await getHtml2Pdf()
  if (!html2pdf) {
    throw new Error('PDF generation not available in this environment')
  }

  const options = {
    margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
    filename: `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: {
      unit: 'in' as const,
      format: 'letter' as const,
      orientation: 'portrait' as const
    },
    pagebreak: {
      mode: ['css', 'avoid-all', 'legacy']
    }
  }

  const pdfBlob = await html2pdf().set(options).from(htmlContent).outputPdf('blob')

  return pdfBlob
}

export async function generateCollectionPDF(collectionSlug: string): Promise<Blob> {
  const supabase = createClient()

  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id, slug, name, description')
    .eq('slug', collectionSlug)
    .single()

  if (collectionError || !collection) {
    throw new Error('Collection not found')
  }

  const { data: contentRows, error: contentError } = await supabase
    .from('content_collections')
    .select('content:content_id (id, title, subtitle, content_body, order_index)')
    .eq('collection_id', collection.id)

  if (contentError) {
    throw new Error('Failed to load collection content')
  }

  const items: CollectionContentItem[] = (contentRows || [])
    .flatMap((row: { content: CollectionContentItem | CollectionContentItem[] | null }) => {
      if (!row.content) return []
      return Array.isArray(row.content) ? row.content : [row.content]
    })
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  const htmlContent = createCollectionPDFHTML(collection, items)

  const html2pdf = await getHtml2Pdf()
  if (!html2pdf) {
    throw new Error('PDF generation not available in this environment')
  }

  const options = {
    margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
    filename: `${collection.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: {
      unit: 'in' as const,
      format: 'letter' as const,
      orientation: 'portrait' as const
    },
    pagebreak: {
      mode: ['css', 'avoid-all', 'legacy']
    }
  }

  const pdfBlob = await html2pdf().set(options).from(htmlContent).outputPdf('blob')

  return pdfBlob
}

function createPDFHTML(content: ContentData): string {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          color: #333;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in 0.5in 1.2in;
        }

        .header {
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #000;
        }

        .subtitle {
          font-size: 18px;
          font-style: italic;
          color: #666;
          margin-bottom: 15px;
        }

        .metadata {
          font-size: 12px;
          color: #666;
          margin-bottom: 20px;
        }

        .metadata div {
          margin-bottom: 5px;
        }

        .footer {
          margin-top: 40px;
          padding-top: 16px;
          padding-bottom: 12px;
          border-top: 1px solid #ccc;
          font-size: 10px;
          color: #666;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .copyright {
          margin-top: 10px;
          font-size: 9px;
          color: #999;
        }

        ${CONTENT_CSS}
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${escapeHtml(content.title)}</div>
        ${content.subtitle ? `<div class="subtitle">${escapeHtml(content.subtitle)}</div>` : ''}

        <div class="metadata">
          ${content.author_name ? `<div><strong>Author:</strong> ${escapeHtml(content.author_name)}</div>` : ''}
          ${content.publication_name ? `<div><strong>Publication:</strong> ${escapeHtml(content.publication_name)}</div>` : ''}
          ${content.publication_date ? `<div><strong>Published:</strong> ${formatDate(content.publication_date)}</div>` : ''}
        </div>
      </div>

      <div class="content">
        ${renderBlockNoteContent(content.content_body)}
      </div>

      <div class="footer">
        <div>Generated on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</div>
        ${content.copyright_notice ? `<div class="copyright">${escapeHtml(content.copyright_notice)}</div>` : ''}
      </div>
    </body>
    </html>
  `
}

function createCollectionPDFHTML(collection: CollectionData, items: CollectionContentItem[]): string {
  const hasDescription = Boolean(collection.description)
  const descriptionHtml = hasDescription
    ? renderBlockNoteContent(collection.description)
    : ''

  const listItems = items.map((item, index) => {
    const subtitle = item.subtitle ? `<div class="collection-item-subtitle">${escapeHtml(item.subtitle)}</div>` : ''
    return `
      <div class="collection-item">
        <div class="collection-item-title">${index + 1}. ${escapeHtml(item.title)}</div>
        ${subtitle}
      </div>
    `
  }).join('')

  const contentSections = items.map((item, index) => {
    const subtitle = item.subtitle ? `<div class="collection-item-subtitle">${escapeHtml(item.subtitle)}</div>` : ''
    const body = item.content_body ? renderBlockNoteContent(item.content_body) : '<p>No content available</p>'
    return `
      <div class="pdf-page-break"></div>
      <div class="collection-section">
        <div class="collection-item-title">${index + 1}. ${escapeHtml(item.title)}</div>
        ${subtitle}
        <div class="content">
          ${body}
        </div>
      </div>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          color: #333;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in;
        }

        .header {
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #000;
        }

        .collection-description {
          font-size: 14px;
          line-height: 1.7;
          margin-top: 10px;
        }

        .collection-list-title {
          font-size: 16px;
          font-weight: bold;
          margin: 20px 0 10px;
        }

        .collection-item {
          margin-bottom: 12px;
        }

        .collection-item-title {
          font-size: 14px;
          font-weight: bold;
          color: #000;
        }

        .collection-item-subtitle {
          font-size: 12px;
          color: #666;
        }

        .collection-section {
          margin-bottom: 30px;
        }

        .pdf-page-break {
          break-before: page;
          page-break-before: always;
        }

        ${CONTENT_CSS}
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${escapeHtml(collection.name)}</div>
        ${hasDescription ? `<div class="collection-description">${descriptionHtml}</div>` : ''}
      </div>

      <div class="collection-list">
        <div class="collection-list-title">Contents</div>
        ${listItems || '<div>No content items in this collection.</div>'}
      </div>

      ${contentSections}
    </body>
    </html>
  `
}

// ── BlockNote rendering ──────────────────────────────────────────────────────

function renderBlockNoteContent(data: any): string {
  if (!data) return '<p>No content available</p>'
  const blocks = Array.isArray(data) ? data : []
  if (blocks.length === 0) return '<p>No content available</p>'
  const html = renderBlockNoteBlocks(blocks)
  return html.trim() ? html : '<p>No content available</p>'
}

function renderBlockNoteBlocks(blocks: any[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return ''

  let html = ''
  let i = 0

  while (i < blocks.length) {
    const block = blocks[i]
    if (!block) { i++; continue }

    // Group consecutive bullet list items into one <ul>
    if (block.type === 'bulletListItem') {
      const group: any[] = []
      while (i < blocks.length && blocks[i]?.type === 'bulletListItem') {
        group.push(blocks[i])
        i++
      }
      html += `<div class="pdf-block">${renderBNBulletList(group)}</div>`
      continue
    }

    // Group consecutive numbered list items into one <ol>
    if (block.type === 'numberedListItem') {
      const group: any[] = []
      while (i < blocks.length && blocks[i]?.type === 'numberedListItem') {
        group.push(blocks[i])
        i++
      }
      html += `<div class="pdf-block">${renderBNNumberedList(group)}</div>`
      continue
    }

    // columnList wraps its own table structure — no extra pdf-block wrapper
    if (block.type === 'columnList') {
      const blockHtml = renderBNBlock(block)
      if (blockHtml) html += blockHtml
      i++
      continue
    }

    const blockHtml = renderBNBlock(block)
    if (blockHtml) html += `<div class="pdf-block">${blockHtml}</div>`
    i++
  }

  return html
}

function renderBNBulletList(items: any[]): string {
  if (!items.length) return ''
  const liItems = items.map(item => {
    const content = renderBNInlineContent(item.content)
    let nested = ''
    if (item.children?.length) {
      const bullets = item.children.filter((c: any) => c.type === 'bulletListItem')
      const numbered = item.children.filter((c: any) => c.type === 'numberedListItem')
      const other = item.children.filter((c: any) => c.type !== 'bulletListItem' && c.type !== 'numberedListItem')
      if (bullets.length) nested += renderBNBulletList(bullets)
      if (numbered.length) nested += renderBNNumberedList(numbered)
      if (other.length) nested += renderBlockNoteBlocks(other)
    }
    return `<li style="margin-bottom: 5px; line-height: 1.6;">${content}${nested}</li>`
  }).join('')
  // Use native disc bullets via inline style, overriding the .content CSS that strips list-style
  return `<ul style="list-style: disc outside; padding-left: 22px; margin-bottom: 15px;">${liItems}</ul>`
}

function renderBNNumberedList(items: any[]): string {
  if (!items.length) return ''
  const liItems = items.map(item => {
    const content = renderBNInlineContent(item.content)
    let nested = ''
    if (item.children?.length) {
      const bullets = item.children.filter((c: any) => c.type === 'bulletListItem')
      const numbered = item.children.filter((c: any) => c.type === 'numberedListItem')
      const other = item.children.filter((c: any) => c.type !== 'bulletListItem' && c.type !== 'numberedListItem')
      if (bullets.length) nested += renderBNBulletList(bullets)
      if (numbered.length) nested += renderBNNumberedList(numbered)
      if (other.length) nested += renderBlockNoteBlocks(other)
    }
    return `<li style="margin-bottom: 5px; line-height: 1.6;">${content}${nested}</li>`
  }).join('')
  // Use native decimal numbering via inline style, overriding the .content CSS
  return `<ol style="list-style: decimal outside; padding-left: 28px; margin-bottom: 15px;">${liItems}</ol>`
}

function renderBNBlock(block: any): string {
  if (!block?.type) return ''

  switch (block.type) {
    case 'paragraph': {
      const text = renderBNInlineContent(block.content)
      if (!text.trim()) return ''
      const align = block.props?.textAlignment
      const bg = bnBgColorToCSS(block.props?.backgroundColor)
      const styles: string[] = []
      if (align && align !== 'left') styles.push(`text-align: ${align}`)
      if (bg !== 'transparent') styles.push(`background-color: ${bg}; padding: 4px 8px`)
      return `<p${styles.length ? ` style="${styles.join('; ')}"` : ''}>${text}</p>`
    }

    case 'heading': {
      const text = renderBNInlineContent(block.content)
      if (!text.trim()) return ''
      const level = Math.min(Math.max(Number(block.props?.level) || 1, 1), 6)
      const align = block.props?.textAlignment
      const style = align && align !== 'left' ? ` style="text-align: ${align}"` : ''
      return `<h${level}${style}>${text}</h${level}>`
    }

    case 'checkListItem': {
      const text = renderBNInlineContent(block.content)
      const mark = block.props?.checked ? '☑' : '☐'
      let nested = ''
      if (block.children?.length) nested = renderBlockNoteBlocks(block.children)
      return `<div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 5px; line-height: 1.6;"><span style="flex-shrink: 0; font-size: 1.1em;">${mark}</span><span>${text}</span></div>${nested}`
    }

    case 'table': {
      const tc = block.content
      if (!tc || tc.type !== 'tableContent' || !Array.isArray(tc.rows)) return ''
      const rows = tc.rows.map((row: any, ri: number) => {
        const cells = (row.cells || []).map((cell: any) => {
          const cellHtml = renderBNInlineContent(cell)
          const tag = ri === 0 ? 'th' : 'td'
          return `<${tag}>${cellHtml}</${tag}>`
        }).join('')
        return `<tr>${cells}</tr>`
      }).join('')
      return `<table><tbody>${rows}</tbody></table>`
    }

    case 'image': {
      const url = block.props?.url
      if (!url) return ''
      const caption = block.props?.caption || ''
      const align = block.props?.textAlignment || 'center'
      const imgStyle = align === 'right' ? 'display: block; margin-left: auto;' : 'display: block; margin: 0 auto;'
      return `<div style="margin: 20px 0; text-align: center;">
        <img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" style="max-width: 100%; max-height: 480px; width: auto; height: auto; ${imgStyle}">
        ${caption ? `<p style="font-size: 12px; color: #666; margin-top: 10px;">${escapeHtml(caption)}</p>` : ''}
      </div>`
    }

    case 'video': {
      const url = block.props?.url
      if (!url) return ''
      const caption = block.props?.caption || url
      return `<div style="border: 1px solid #ddd; padding: 12px; margin: 15px 0; text-align: center;">
        <p style="color: #666; font-size: 13px; margin: 0;">[Video] <a href="${escapeHtml(url)}" target="_blank">${escapeHtml(caption)}</a></p>
      </div>`
    }

    case 'file': {
      const url = block.props?.url
      if (!url) return ''
      const name = block.props?.name || 'Download file'
      const caption = block.props?.caption || ''
      return `<div style="border: 1px solid #ddd; padding: 12px; margin: 15px 0;">
        <p style="margin: 0;"><a href="${escapeHtml(url)}" target="_blank" style="font-weight: bold;">${escapeHtml(name)}</a></p>
        ${caption ? `<p style="font-size: 12px; color: #666; margin: 4px 0 0;">${escapeHtml(caption)}</p>` : ''}
      </div>`
    }

    // ── Custom blocks ─────────────────────────────────────────────────────────

    case 'alert': {
      const alertType = block.props?.type || 'warning'
      const content = renderBNInlineContent(block.content)
      if (!content.trim()) return ''
      const alertConfigs: Record<string, { bg: string; border: string; icon: string }> = {
        warning: { bg: '#fff6e6', border: '#e69819', icon: '⚠' },
        error:   { bg: '#ffe6e6', border: '#d80d0d', icon: '✗' },
        info:    { bg: '#e6ebff', border: '#507aff', icon: 'ℹ' },
        success: { bg: '#e6ffe6', border: '#0bc10b', icon: '✓' },
      }
      const cfg = alertConfigs[alertType] || alertConfigs.warning
      return `<div style="background: ${cfg.bg}; border-left: 4px solid ${cfg.border}; padding: 12px 16px; margin: 15px 0;">
        <span style="font-size: 14px; color: ${cfg.border}; margin-right: 8px;">${cfg.icon}</span>${content}</div>`
    }

    case 'headingLine': {
      const text = renderBNInlineContent(block.content)
      if (!text.trim()) return ''
      const lvl = Math.min(Math.max(parseInt(block.props?.level || '2', 10), 2), 6)
      return `<div style="margin: 25px 0 5px;">
        <h${lvl} style="margin: 0; padding: 0;">${text}</h${lvl}>
        <div style="height: 5px; background: #fc5454; margin-top: 6px; border: none;"></div>
      </div>`
    }

    case 'embed': {
      const url = block.props?.url
      if (!url) return ''
      const caption = block.props?.caption || ''
      const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      if (ytMatch) {
        const videoId = ytMatch[1]
        const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        return `<div style="text-align: center; margin: 20px 0;">
          <a href="${escapeHtml(url)}" target="_blank" style="text-decoration: none;">
            <img src="${escapeHtml(thumbUrl)}" alt="YouTube video" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
            <p style="font-size: 12px; color: #507aff; margin: 6px 0 0;">▶ Watch on YouTube</p>
          </a>
          ${caption ? `<p style="font-size: 12px; color: #666; margin-top: 6px;">${escapeHtml(caption)}</p>` : ''}
        </div>`
      }
      return `<div style="border: 1px solid #ddd; padding: 12px; margin: 15px 0;">
        <p style="margin: 0; font-size: 13px; color: #666;">[Embedded content] <a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url)}</a></p>
        ${caption ? `<p style="font-size: 12px; color: #999; margin: 4px 0 0;">${escapeHtml(caption)}</p>` : ''}
      </div>`
    }

    case 'button': {
      const outputType = block.props?.outputType || 'external'
      const url = outputType === 'external' ? (block.props?.url || '') : ''
      const bg = sanitizeCssColor(block.props?.buttonBackgroundColor, '#2563eb')
      const fg = sanitizeCssColor(block.props?.buttonTextColor, '#ffffff')
      const width = Number(block.props?.buttonWidth) || 100
      const align = block.props?.align || 'left'
      const label = renderBNInlineContent(block.content) || 'Button'
      const justifyMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' }
      const justify = justifyMap[align] || 'flex-start'
      const btnStyle = `display: inline-block; width: ${width}px; padding: 8px 14px; background: ${bg}; color: ${fg}; text-align: center; font-weight: 500; text-decoration: none;`
      return `<div style="display: flex; justify-content: ${justify}; margin: 10px 0;">
        ${url
          ? `<a href="${escapeHtml(url)}" target="_blank" style="${btnStyle}">${label}</a>`
          : `<span style="${btnStyle}">${label}</span>`
        }
      </div>`
    }

    case 'linkPreview': {
      const url = block.props?.url || ''
      if (!url) return ''
      const title = block.props?.title || url
      const favicon = block.props?.favicon || ''
      const description = block.props?.customDescription || block.props?.description || ''
      let domain = ''
      try { domain = new URL(url).hostname.replace(/^www\./, '') } catch {}
      return `<div style="display: flex; align-items: center; border: 1px solid #e0e0e0; padding: 12px 16px; margin: 15px 0; background: #fafafa;">
        <span style="margin-right: 12px; flex-shrink: 0; font-size: 14px; color: #999;">🔗</span>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px;">
            <span style="font-weight: 600; font-size: 13px;">${escapeHtml(title)}</span>
            ${domain ? `<span style="font-size: 11px; color: #999; white-space: nowrap;">${escapeHtml(domain)} →</span>` : ''}
          </div>
          ${description ? `<p style="font-size: 11px; color: #666; margin: 3px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(description)}</p>` : ''}
        </div>
      </div>`
    }

    case 'audio': {
      const url = block.props?.url || ''
      if (!url) return ''
      const caption = block.props?.caption || ''
      // html2canvas cannot render <audio> elements — use a styled link box instead
      return `<div style="display: flex; align-items: center; gap: 12px; border: 1px solid #e0e0e0; padding: 12px 16px; margin: 15px 0; background: #fafafa;">
        <span style="font-size: 20px; flex-shrink: 0;">🎵</span>
        <div>
          <a href="${escapeHtml(url)}" target="_blank" style="font-size: 13px; color: #333; word-break: break-all;">${escapeHtml(url)}</a>
          ${caption ? `<p style="font-size: 11px; color: #999; margin: 3px 0 0;">${escapeHtml(caption)}</p>` : ''}
        </div>
      </div>`
    }

    case 'columnList': {
      const columns = (block.children || []).filter((c: any) => c.type === 'column')
      if (!columns.length) return ''
      const total = columns.reduce((s: number, c: any) => s + (Number(c.props?.width) || 50), 0)
      const colHtml = columns.map((col: any) => {
        const pct = ((Number(col.props?.width) || 50) / total * 100).toFixed(1)
        return `<td style="vertical-align: top; padding: 0 8px; width: ${pct}%;">${renderBlockNoteBlocks(col.children || [])}</td>`
      }).join('')
      return `<table class="pdf-columns" style="width: 100%; table-layout: fixed;"><tbody><tr>${colHtml}</tr></tbody></table>`
    }

    case 'column':
      return renderBlockNoteBlocks(block.children || [])

    default:
      return ''
  }
}

function renderBNInlineContent(content: any): string {
  if (!content) return ''
  if (typeof content === 'string') return escapeHtml(content)
  if (!Array.isArray(content)) return ''
  return content.map((item: any): string => {
    if (!item) return ''

    if (item.type === 'text') {
      if (!item.text) return ''
      let text = escapeHtml(item.text)
      const s = item.styles || {}
      if (s.code) return `<code>${text}</code>`
      if (s.bold) text = `<strong>${text}</strong>`
      if (s.italic) text = `<em>${text}</em>`
      if (s.underline) text = `<span style="text-decoration: underline;">${text}</span>`
      if (s.strikethrough) text = `<span style="text-decoration: line-through;">${text}</span>`
      const bg = bnBgColorToCSS(s.backgroundColor)
      if (bg !== 'transparent') text = `<span style="background-color: ${bg}; padding: 0 2px;">${text}</span>`
      const fg = bnColorToCSS(s.textColor)
      if (fg !== 'inherit') text = `<span style="color: ${fg};">${text}</span>`
      return text
    }

    if (item.type === 'link') {
      const inner = renderBNInlineContent(item.content)
      const href = item.href || ''
      const safe = /^(https?:|mailto:|tel:|\/|#)/.test(href) ? href : ''
      if (!safe) return inner
      return `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
    }

    if (item.type === 'tag') {
      const p = item.props || {}
      const label = escapeHtml(p.label || 'tag')
      const ot = p.outputType || 'external'
      const url = p.url || ''
      const tagStyle = 'display: inline-block; background: #e6e6e6; border-radius: 3px; padding: 1px 6px; font-size: 0.85em; margin: 0 2px; color: #333; text-decoration: none;'
      if (ot === 'external' && url) {
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="${tagStyle}">${label}</a>`
      }
      return `<span style="${tagStyle}">${label}</span>`
    }

    return ''
  }).join('')
}

const bnColorMap: Record<string, string> = {
  red:    '#c0392b',
  orange: '#d35400',
  yellow: '#b7950b',
  green:  '#1e8449',
  blue:   '#1a5276',
  purple: '#6c3483',
  pink:   '#a93226',
  gray:   '#707070',
  brown:  '#6e4c3e',
}

const bnBgColorMap: Record<string, string> = {
  red:    '#fce4e4',
  orange: '#fdebd0',
  yellow: '#fef9e7',
  green:  '#d5f5e3',
  blue:   '#d6eaf8',
  purple: '#e8daef',
  pink:   '#fadbd8',
  gray:   '#eaecee',
  brown:  '#e8d5c4',
}

function bnColorToCSS(color: string | undefined): string {
  if (!color || color === 'default') return 'inherit'
  return bnColorMap[color] ?? color
}

function bnBgColorToCSS(color: string | undefined): string {
  if (!color || color === 'default') return 'transparent'
  return bnBgColorMap[color] ?? color
}

function escapeHtml(text: string): string {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function sanitizeCssColor(value: string, fallback: string): string {
  const trimmed = (value || '').trim()
  if (
    /^#[0-9a-fA-F]{3,8}$/.test(trimmed) ||
    /^[a-zA-Z]+$/.test(trimmed) ||
    /^(rgb|rgba|hsl|hsla)\([^)]*\)$/.test(trimmed)
  ) return trimmed
  return fallback
}
