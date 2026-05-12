'use client'

import { useState } from 'react'
import BlockNoteEditor from '@/components/editor/BlockNoteEditorDynamic'
import BlockNoteRenderer from '@/components/BlockNoteRendererDynamic'
import type { CustomPartialBlock, CustomBlockNoteEditor } from '@/lib/blocknote'

type ImageSizeMap = Record<string, { width?: number; height?: number }>

/**
 * Design-system test page for all BlockNote blocks.
 * Every native and custom block type is represented in the initial content.
 * The editor on the left is live; the renderer on the right mirrors it read-only.
 */

// Initial content covering every block type in the design system
const INITIAL_CONTENT: CustomPartialBlock[] = [
  // ── Native: Paragraph ──────────────────────────────────────────────────────
  {
    type: 'paragraph',
    content: 'This is the BlockNote design system test page. Every block type is shown below — edit freely to test behaviour.',
  },

  // ── Native: Headings H1–H3 ─────────────────────────────────────────────────
  { type: 'heading', props: { level: 1 }, content: 'Heading 1 — Display font, 3px bottom padding' },
  { type: 'heading', props: { level: 2 }, content: 'Heading 2' },
  { type: 'heading', props: { level: 3 }, content: 'Heading 3' },

  // ── Native: Bulleted list (5px left indent) ─────────────────────────────────
  { type: 'bulletListItem', content: 'Bullet list — burgundy marker, 5px left indent' },
  { type: 'bulletListItem', content: 'Second bullet item' },

  // ── Native: Numbered list (5px left indent) ─────────────────────────────────
  { type: 'numberedListItem', content: 'Numbered list — burgundy number, 5px left indent' },
  { type: 'numberedListItem', content: 'Second numbered item' },

  // ── Native: Check list ──────────────────────────────────────────────────────
  { type: 'checkListItem', props: { checked: false }, content: 'Unchecked checklist item' },
  { type: 'checkListItem', props: { checked: true }, content: 'Checked checklist item' },

  // ── Native: Quote (5px left indent, 10px block padding) ────────────────────
  {
    type: 'quote',
    content: 'This is a block quote — italic text, burgundy left border, 5px left indent, 10px block padding.',
  },

  // ── Native: Divider ─────────────────────────────────────────────────────────
  { type: 'paragraph', content: 'Divider below:' },
  { type: 'divider' },

  // ── Native: Code block ──────────────────────────────────────────────────────
  {
    type: 'codeBlock',
    props: { language: 'typescript' },
    content: 'const greeting = "Hello, world!"\nconsole.log(greeting)',
  },

  // ── Native: Toggle (accent-light arrow, 10px block padding) ────────────────
  {
    type: 'toggleListItem',
    content: 'Toggle block — accent-light arrow, 10px block padding',
    children: [
      { type: 'paragraph', content: 'Hidden content revealed when toggle is open.' },
    ],
  },

  // ── Native: Table ───────────────────────────────────────────────────────────
  {
    type: 'table',
    content: {
      type: 'tableContent',
      rows: [
        { cells: [['Column A'], ['Column B'], ['Column C']] },
        { cells: [['Row 1A'], ['Row 1B'], ['Row 1C']] },
        { cells: [['Row 2A'], ['Row 2B'], ['Row 2C']] },
      ],
    } as any,
  },

  // ── Custom: Heading-line block ──────────────────────────────────────────────
  { type: 'headingLine', props: { level: '2' }, content: 'Heading Line — H2 with burgundy rule' },
  { type: 'paragraph', content: 'Text after a heading-line block.' },

  // ── Custom: Alert ───────────────────────────────────────────────────────────
  {
    type: 'alert',
    props: { type: 'info' } as any,
    content: 'Info alert block — supports info, warning, and danger types.',
  },

  // ── Custom: Embed (10px block padding, noPadding toggle) ───────────────────
  {
    type: 'embed',
    props: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      previewWidth: 0,
      caption: 'YouTube embed — 10px block padding. Use toolbar to toggle.',
    } as any,
  },

  // ── Custom: Button (10px block padding, noPadding toggle) ──────────────────
  {
    type: 'button',
    props: {
      buttonTextColor: '#ffffff',
      buttonBackgroundColor: '#6B2A2A',
      outputType: 'external',
      url: 'https://example.com',
      align: 'left',
      buttonWidth: 160,
    } as any,
    content: 'Button — External Link',
  },

  // ── Custom: Link Preview ────────────────────────────────────────────────────
  {
    type: 'linkPreview',
    props: { url: 'https://example.com' } as any,
  },

  // ── Custom: Column layout ───────────────────────────────────────────────────
  {
    type: 'columnList',
    children: [
      {
        type: 'column',
        props: { columnWidth: 50 } as any,
        children: [{ type: 'paragraph', content: 'Left column — 50%' }],
      },
      {
        type: 'column',
        props: { columnWidth: 50 } as any,
        children: [{ type: 'paragraph', content: 'Right column — 50%' }],
      },
    ],
  },

  // ── Inline: Tag (accent-light pill, font-ui, icon by type) ─────────────────
  {
    type: 'paragraph',
    content: [
      { type: 'text', text: 'Inline tags: ', styles: {} },
      {
        type: 'tag',
        props: {
          label: 'External link',
          outputType: 'external',
          url: 'https://example.com',
          tabTargetType: '',
          tabTargetId: '',
          tabTargetLabel: '',
        },
      } as any,
      { type: 'text', text: ' ', styles: {} },
      {
        type: 'tag',
        props: {
          label: 'Download',
          outputType: 'download',
          url: 'https://example.com/file.pdf',
          tabTargetType: '',
          tabTargetId: '',
          tabTargetLabel: '',
        },
      } as any,
      { type: 'text', text: ' ', styles: {} },
      {
        type: 'tag',
        props: {
          label: 'Internal tab',
          outputType: 'tab',
          url: '',
          tabTargetType: '',
          tabTargetId: '',
          tabTargetLabel: 'Home',
        },
      } as any,
    ] as any,
  },

  // ── Spacer paragraph ────────────────────────────────────────────────────────
  { type: 'paragraph', content: '' },
]

export default function BlockNoteTestPage() {
  const [editorContent, setEditorContent] = useState<CustomPartialBlock[] | undefined>(
    INITIAL_CONTENT
  )
  const [editorReady, setEditorReady] = useState(false)
  const [rendererReady, setRendererReady] = useState(false)
  const [onChangeCount, setOnChangeCount] = useState(0)
  const [imageSizes, setImageSizes] = useState<ImageSizeMap>({})

  const handleEditorChange = (data: CustomPartialBlock[]) => {
    setEditorContent(data)
    setOnChangeCount(prev => prev + 1)
    const sizes: ImageSizeMap = {}
    data.forEach((block) => {
      if (block.type === 'image' && block.props?.url) {
        const url = block.props.url as string
        const width = block.props.previewWidth as number | undefined
        if (width) sizes[url] = { width }
      }
    })
    setImageSizes(sizes)
  }

  const handleEditorReady = (editor: CustomBlockNoteEditor) => {
    setEditorReady(true)
    console.log('Editor onReady fired:', editor)
  }

  const handleRendererReady = () => {
    setRendererReady(true)
    console.log('Renderer onReady fired')
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-1">BlockNote Design System</h1>
        <p className="text-gray-400 mb-6">All native and custom blocks — editor on the left, renderer on the right.</p>

        {/* Status */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700 flex gap-8 text-sm">
          <div>
            <span className="text-gray-400">Editor </span>
            <span className={editorReady ? 'text-green-400' : 'text-yellow-400'}>{editorReady ? '✅ Ready' : '⏳'}</span>
          </div>
          <div>
            <span className="text-gray-400">Renderer </span>
            <span className={rendererReady ? 'text-green-400' : 'text-yellow-400'}>{rendererReady ? '✅ Ready' : '⏳'}</span>
          </div>
          <div>
            <span className="text-gray-400">Changes </span>
            <span className="text-white">{onChangeCount}</span>
          </div>
          <div>
            <span className="text-gray-400">Blocks </span>
            <span className="text-white">{editorContent?.length ?? 0}</span>
          </div>
        </div>

        {/* Side-by-side editor + renderer */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <h2 className="text-sm font-semibold text-white">Editor (editable)</h2>
            </div>
            <div className="p-4" style={{ backgroundColor: '#c7c7c2', colorScheme: 'light' }}>
              <BlockNoteEditor
                data={editorContent}
                onChange={handleEditorChange}
                onReady={handleEditorReady}
              />
            </div>
          </div>

          {/* Renderer */}
          <div className="rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <h2 className="text-sm font-semibold text-white">Renderer (read-only)</h2>
            </div>
            <div className="p-4 bg-[#c7c7c2]">
              <BlockNoteRenderer
                data={editorContent}
                imageSizes={Object.keys(imageSizes).length > 0 ? imageSizes : undefined}
                onReady={handleRendererReady}
              />
            </div>
          </div>
        </div>

        {/* Block index */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-sm font-semibold text-white mb-3">Block index</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-300">
            {[
              'Paragraph', 'Heading H1–H3', 'Bullet list', 'Numbered list',
              'Check list', 'Quote', 'Divider', 'Code block',
              'Toggle', 'Table', 'Image (upload)', 'Video (upload)',
              'File download', 'Heading-line', 'Alert', 'Embed',
              'Button', 'Link Preview', 'Columns', 'Audio (upload)',
              'Tag (inline)',
            ].map((name, i) => (
              <div key={`${name}-${i}`} className="bg-gray-700 rounded px-2 py-1">{name}</div>
            ))}
          </div>
        </div>

        {/* JSON debug */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
            Content JSON (debug)
          </summary>
          <div className="mt-2 bg-gray-900 rounded p-3 max-h-96 overflow-auto border border-gray-700">
            <pre className="text-xs text-gray-300">
              {editorContent ? JSON.stringify(editorContent, null, 2) : 'No content'}
            </pre>
          </div>
        </details>
      </div>
    </div>
  )
}
