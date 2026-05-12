'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

type CustomPDF = {
  id: string
  title: string
  description: string | null
  file_url: string
  file_name: string
  order_index: number
  is_featured: boolean
  created_at: string
}

type CollectionOption = {
  id: string
  name: string
}


type PdfLinkState = {
  targetType: '' | 'collection' | 'resume'
  targetId: string
}

export default function CustomPDFsManagement() {
  const [pdfs, setPdfs] = useState<CustomPDF[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [pdfLinks, setPdfLinks] = useState<Record<string, PdfLinkState>>({})
  const supabase = createClient()

  useEffect(() => {
    loadPDFs()
    loadTargetOptions()
    loadPdfLinks()
  }, [])

  async function loadPDFs() {
    try {
      const { data, error } = await supabase
        .from('custom_pdfs')
        .select('*')
        .order('order_index', { ascending: true })
      
      if (error) {
        console.error('Error loading PDFs:', error)
        if (error.code === '42P01') {
          alert('The custom_pdfs table does not exist. Please run the SQL script in create-custom-pdfs-table.sql in your Supabase SQL editor.')
        }
        throw error
      }
      setPdfs(data || [])
    } catch (error) {
      console.error('Error loading PDFs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTargetOptions() {
    const { data: collectionsData } = await supabase
      .from('collections')
      .select('id, name')
      .order('name')
    setCollections(collectionsData || [])
  }

  async function loadPdfLinks() {
    try {
      const { data, error } = await supabase
        .from('custom_pdf_links')
        .select('pdf_id, target_type, target_id')
      if (error) {
        if (error.code === '42P01') {
          alert('The custom_pdf_links table does not exist. Please run the SQL for custom PDF links.')
          return
        }
        throw error
      }
      const linkMap: Record<string, PdfLinkState> = {}
      ;(data || []).forEach((row) => {
        linkMap[row.pdf_id] = {
          targetType: row.target_type === 'content' ? '' : row.target_type,
          targetId: row.target_id || ''
        }
      })
      setPdfLinks(linkMap)
    } catch (error) {
      console.error('Error loading custom PDF links:', error)
    }
  }

  async function savePdfLink(pdfId: string) {
    const link = pdfLinks[pdfId]
    if (!link || !link.targetType) {
      const { error } = await supabase
        .from('custom_pdf_links')
        .delete()
        .eq('pdf_id', pdfId)
      if (error && error.code !== '42P01') {
        alert('Failed to clear PDF link')
      }
      await loadPdfLinks()
      return
    }

    const targetId = link.targetType === 'resume' ? null : link.targetId || null
    if (link.targetType !== 'resume' && !targetId) {
      alert('Please select a target item.')
      return
    }

    const { error: deleteError } = await supabase
      .from('custom_pdf_links')
      .delete()
      .eq('pdf_id', pdfId)
    if (deleteError && deleteError.code !== '42P01') {
      alert('Failed to update PDF link')
      return
    }

    const { error: insertError } = await supabase
      .from('custom_pdf_links')
      .insert({
        pdf_id: pdfId,
        target_type: link.targetType,
        target_id: targetId
      })
    if (insertError) {
      alert(`Failed to save PDF link: ${insertError.message}`)
      return
    }
    await loadPdfLinks()
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file')
      return
    }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string
          
          const { error } = await supabase
            .from('custom_pdfs')
            .insert({
              title: file.name.replace('.pdf', ''),
              file_url: dataUrl,
              file_name: file.name,
              order_index: pdfs.length
            })

          if (error) {
            console.error('Error saving PDF:', error)
            if (error.code === '42P01') {
              alert('The custom_pdfs table does not exist. Please run the SQL script in create-custom-pdfs-table.sql in your Supabase SQL editor.')
            } else {
              alert(`Failed to save PDF: ${error.message}`)
            }
            throw error
          }
          
          await loadPDFs()
          alert('PDF uploaded successfully!')
        } catch (error) {
          console.error('Error saving PDF:', error)
        } finally {
          setUploading(false)
        }
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading PDF:', error)
      alert('Failed to upload PDF')
      setUploading(false)
    }
  }

  async function deletePDF(id: string) {
    if (!confirm('Are you sure you want to delete this PDF?')) return
    
    try {
      const { error } = await supabase
        .from('custom_pdfs')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      loadPDFs()
    } catch (error) {
      console.error('Error deleting PDF:', error)
      alert('Failed to delete PDF')
    }
  }

  async function updatePDF(id: string, updates: Partial<CustomPDF>) {
    try {
      const { error } = await supabase
        .from('custom_pdfs')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error
      
      loadPDFs()
    } catch (error) {
      console.error('Error updating PDF:', error)
      alert('Failed to update PDF')
    }
  }

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Custom PDFs</h1>
        <Link href="/admin">
          <Button variant="outline">← Back to Admin</Button>
        </Link>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Upload New PDF</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            {uploading && (
              <div className="flex items-center gap-2 text-blue-400">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </div>
            )}
          </div>
          
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Upload PDF files that will appear on the Downloads page and can be linked from the Resume page.
        </p>
      </div>

      {pdfs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">No custom PDFs uploaded yet.</p>
          <p className="text-gray-500 text-sm">Upload your first PDF using the form above.</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Title</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">File</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Link Target</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Featured</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Created</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {pdfs.map((pdf) => (
                (() => {
                  const linkState = pdfLinks[pdf.id] || { targetType: '', targetId: '' }
                  return (
                <tr key={pdf.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{pdf.title}</div>
                      {pdf.description && (
                        <div className="text-gray-400 text-sm">{pdf.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={pdf.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {pdf.file_name}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <select
                        value={linkState.targetType}
                        onChange={(e) =>
                          setPdfLinks((prev) => ({
                            ...prev,
                            [pdf.id]: {
                              targetType: e.target.value as PdfLinkState['targetType'],
                              targetId: ''
                            }
                          }))
                        }
                        className="w-full bg-gray-950 border border-gray-700 text-gray-200 rounded px-3 py-2"
                      >
                        <option value="">No link</option>
                        <option value="collection">Collection</option>
                        <option value="resume">Resume</option>
                      </select>
                      {linkState.targetType === 'collection' && (
                        <select
                          value={linkState.targetId}
                          onChange={(e) =>
                            setPdfLinks((prev) => ({
                              ...prev,
                              [pdf.id]: {
                                targetType: linkState.targetType,
                                targetId: e.target.value
                              }
                            }))
                          }
                          className="w-full bg-gray-950 border border-gray-700 text-gray-200 rounded px-3 py-2"
                        >
                          <option value="">Select collection</option>
                          {collections.map((collection) => (
                            <option key={collection.id} value={collection.id}>
                              {collection.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {linkState.targetType === 'resume' && (
                        <p className="text-xs text-gray-500">Links to Resume download</p>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => savePdfLink(pdf.id)}
                      >
                        {linkState.targetType ? 'Save Link' : 'Clear Link'}
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={pdf.is_featured}
                      onChange={(e) => updatePDF(pdf.id, { is_featured: e.target.checked })}
                      className="rounded border-gray-700 bg-gray-950"
                    />
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(pdf.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deletePDF(pdf.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
                  )
                })()
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
