'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Category = {
  id: string
  name: string
  order_index: number
  short_title?: string | null
  short_desc?: string | null
  desc?: string | null
}

type Subcategory = {
  id: string
  category_id: string
  name: string
  order_index: number
  short_title?: string | null
  short_desc?: string | null
  peri_desc?: string | null
  desc?: string | null
  collection_column_override?: string | null
}

export default function CategoriesManagement() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null)
  const [editSubcategoryName, setEditSubcategoryName] = useState('')
  const [editingCategoryOrder, setEditingCategoryOrder] = useState<string | null>(null)
  const [editCategoryOrder, setEditCategoryOrder] = useState('')
  const [editingSubcategoryOrder, setEditingSubcategoryOrder] = useState<string | null>(null)
  const [editSubcategoryOrder, setEditSubcategoryOrder] = useState('')

  // Category menu display fields
  const [newCategoryShortTitle, setNewCategoryShortTitle] = useState('')
  const [newCategoryShortDesc, setNewCategoryShortDesc] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [editCategoryShortTitle, setEditCategoryShortTitle] = useState('')
  const [editCategoryShortDesc, setEditCategoryShortDesc] = useState('')
  const [editCategoryDesc, setEditCategoryDesc] = useState('')

  // Subcategory menu display fields
  const [newSubcategoryShortTitle, setNewSubcategoryShortTitle] = useState('')
  const [newSubcategoryShortDesc, setNewSubcategoryShortDesc] = useState('')
  const [newSubcategoryPeriDesc, setNewSubcategoryPeriDesc] = useState('')
  const [newSubcategoryDesc, setNewSubcategoryDesc] = useState('')
  const [newSubcategoryCollectionOverride, setNewSubcategoryCollectionOverride] = useState('auto')
  const [editSubcategoryShortTitle, setEditSubcategoryShortTitle] = useState('')
  const [editSubcategoryShortDesc, setEditSubcategoryShortDesc] = useState('')
  const [editSubcategoryPeriDesc, setEditSubcategoryPeriDesc] = useState('')
  const [editSubcategoryDesc, setEditSubcategoryDesc] = useState('')
  const [editSubcategoryCollectionOverride, setEditSubcategoryCollectionOverride] = useState('auto')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [catResult, subResult] = await Promise.all([
      supabase.from('categories').select('*').order('order_index'),
      supabase.from('subcategories').select('*').order('order_index')
    ])
    
    setCategories(catResult.data || [])
    setSubcategories(subResult.data || [])
  }

  async function createCategory() {
    if (!newCategoryName.trim()) return
    
    const { error } = await supabase
      .from('categories')
      .insert({
        name: newCategoryName,
        order_index: categories.length,
        short_title: newCategoryShortTitle || null,
        short_desc: newCategoryShortDesc || null,
        desc: newCategoryDesc || null,
      })

    if (error) {
      alert('Error creating category: ' + error.message)
    } else {
      setNewCategoryName('')
      setNewCategoryShortTitle('')
      setNewCategoryShortDesc('')
      setNewCategoryDesc('')
      loadData()
    }
  }

  async function createSubcategory() {
    if (!newSubcategoryName.trim() || !selectedCategoryForSub) return
    
    const categorySubcategories = subcategories.filter(
      sub => sub.category_id === selectedCategoryForSub
    )
    
    const { error } = await supabase
      .from('subcategories')
      .insert({
        name: newSubcategoryName,
        category_id: selectedCategoryForSub,
        order_index: categorySubcategories.length,
        short_title: newSubcategoryShortTitle || null,
        short_desc: newSubcategoryShortDesc || null,
        peri_desc: newSubcategoryPeriDesc || null,
        desc: newSubcategoryDesc || null,
        collection_column_override: newSubcategoryCollectionOverride,
      })

    if (error) {
      alert('Error creating subcategory: ' + error.message)
    } else {
      setNewSubcategoryName('')
      setNewSubcategoryShortTitle('')
      setNewSubcategoryShortDesc('')
      setNewSubcategoryPeriDesc('')
      setNewSubcategoryDesc('')
      setNewSubcategoryCollectionOverride('auto')
      loadData()
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete category? This will also delete all subcategories and content!')) return
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadData()
    }
  }

  async function deleteSubcategory(id: string) {
    if (!confirm('Delete subcategory? This will affect related content!')) return
    
    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadData()
    }
  }

  async function updateCategory(id: string) {
    if (!editCategoryName.trim()) return
    
    const { error } = await supabase
      .from('categories')
      .update({
        name: editCategoryName,
        short_title: editCategoryShortTitle || null,
        short_desc: editCategoryShortDesc || null,
        desc: editCategoryDesc || null,
      })
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setEditingCategory(null)
      setEditCategoryName('')
      setEditCategoryShortTitle('')
      setEditCategoryShortDesc('')
      setEditCategoryDesc('')
      loadData()
    }
  }

  async function updateSubcategory(id: string) {
    if (!editSubcategoryName.trim()) return
    
    const { error } = await supabase
      .from('subcategories')
      .update({
        name: editSubcategoryName,
        short_title: editSubcategoryShortTitle || null,
        short_desc: editSubcategoryShortDesc || null,
        peri_desc: editSubcategoryPeriDesc || null,
        desc: editSubcategoryDesc || null,
        collection_column_override: editSubcategoryCollectionOverride,
      })
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setEditingSubcategory(null)
      setEditSubcategoryName('')
      setEditSubcategoryShortTitle('')
      setEditSubcategoryShortDesc('')
      setEditSubcategoryPeriDesc('')
      setEditSubcategoryDesc('')
      setEditSubcategoryCollectionOverride('auto')
      loadData()
    }
  }

  function startEditCategory(category: Category) {
    setEditingCategory(category.id)
    setEditCategoryName(category.name)
    setEditCategoryShortTitle(category.short_title || '')
    setEditCategoryShortDesc(category.short_desc || '')
    setEditCategoryDesc(category.desc || '')
  }

  function startEditSubcategory(subcategory: Subcategory) {
    setEditingSubcategory(subcategory.id)
    setEditSubcategoryName(subcategory.name)
    setEditSubcategoryShortTitle(subcategory.short_title || '')
    setEditSubcategoryShortDesc(subcategory.short_desc || '')
    setEditSubcategoryPeriDesc(subcategory.peri_desc || '')
    setEditSubcategoryDesc(subcategory.desc || '')
    setEditSubcategoryCollectionOverride(subcategory.collection_column_override || 'auto')
  }

  async function updateCategoryOrder(id: string, newOrder: string) {
    const orderValue = newOrder.trim() === '' ? 0 : parseInt(newOrder, 10)
    
    if (isNaN(orderValue)) {
      setEditingCategoryOrder(null)
      setEditCategoryOrder('')
      return
    }
    
    const { error } = await supabase
      .from('categories')
      .update({ order_index: orderValue })
      .eq('id', id)
    
    if (error) {
      alert('Error updating order: ' + error.message)
    } else {
      setEditingCategoryOrder(null)
      setEditCategoryOrder('')
      loadData()
    }
  }

  function startEditCategoryOrder(category: Category) {
    setEditingCategoryOrder(category.id)
    setEditCategoryOrder(category.order_index.toString())
  }

  async function updateSubcategoryOrder(id: string, newOrder: string) {
    const orderValue = newOrder.trim() === '' ? 0 : parseInt(newOrder, 10)
    
    if (isNaN(orderValue)) {
      setEditingSubcategoryOrder(null)
      setEditSubcategoryOrder('')
      return
    }
    
    const { error } = await supabase
      .from('subcategories')
      .update({ order_index: orderValue })
      .eq('id', id)
    
    if (error) {
      alert('Error updating order: ' + error.message)
    } else {
      setEditingSubcategoryOrder(null)
      setEditSubcategoryOrder('')
      loadData()
    }
  }

  function startEditSubcategoryOrder(subcategory: Subcategory) {
    setEditingSubcategoryOrder(subcategory.id)
    setEditSubcategoryOrder(subcategory.order_index.toString())
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Categories & Subcategories</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Categories</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name *"
                  onKeyPress={(e) => e.key === 'Enter' && createCategory()}
                />
                <Button onClick={createCategory}>Add</Button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Short Title <span className="text-gray-500">{newCategoryShortTitle.length}/15</span></label>
                  <Input value={newCategoryShortTitle} onChange={(e) => setNewCategoryShortTitle(e.target.value)} placeholder="Short title" maxLength={15} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-400 mb-1">Short Desc <span className="text-gray-500">{newCategoryShortDesc.length}/30</span></label>
                  <Input value={newCategoryShortDesc} onChange={(e) => setNewCategoryShortDesc(e.target.value)} placeholder="Short description" maxLength={30} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea value={newCategoryDesc} onChange={(e) => setNewCategoryDesc(e.target.value)} placeholder="Full description" rows={2} className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white text-sm resize-y" />
              </div>
            </div>

            <div className="space-y-2">
              {categories.map(category => (
                <div 
                  key={category.id} 
                  className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
                >
                  {editingCategory === category.id ? (
                    <div className="flex gap-2 flex-1">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          placeholder="Name *"
                          onKeyPress={(e) => e.key === 'Enter' && updateCategory(category.id)}
                        />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Short Title <span className="text-gray-500">{editCategoryShortTitle.length}/15</span></label>
                            <Input value={editCategoryShortTitle} onChange={(e) => setEditCategoryShortTitle(e.target.value)} placeholder="Short title" maxLength={15} />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-400 mb-1">Short Desc <span className="text-gray-500">{editCategoryShortDesc.length}/30</span></label>
                            <Input value={editCategoryShortDesc} onChange={(e) => setEditCategoryShortDesc(e.target.value)} placeholder="Short description" maxLength={30} />
                          </div>
                        </div>
                        <textarea value={editCategoryDesc} onChange={(e) => setEditCategoryDesc(e.target.value)} placeholder="Description" rows={2} className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white text-sm resize-y" />
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm" onClick={() => updateCategory(category.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        {editingCategoryOrder === category.id ? (
                          <Input
                            type="number"
                            value={editCategoryOrder}
                            onChange={(e) => setEditCategoryOrder(e.target.value)}
                            className="w-16"
                            onBlur={() => updateCategoryOrder(category.id, editCategoryOrder)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateCategoryOrder(category.id, editCategoryOrder)
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="text-xs text-gray-500 cursor-pointer hover:text-gray-400"
                            onClick={() => startEditCategoryOrder(category)}
                          >
                            [{category.order_index}]
                          </span>
                        )}
                        <span className="text-white">{category.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-xs text-gray-500">
                          {subcategories.filter(s => s.category_id === category.id).length} subs
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startEditCategory(category)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteCategory(category.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {categories.length === 0 && (
                <p className="text-gray-500 text-center py-8">No categories yet</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Subcategories</h2>
            
            <div className="space-y-2 mb-6">
              <select
                value={selectedCategoryForSub}
                onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              >
                <option value="">Select parent category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    placeholder="New subcategory name *"
                    disabled={!selectedCategoryForSub}
                    onKeyPress={(e) => e.key === 'Enter' && createSubcategory()}
                  />
                  <Button onClick={createSubcategory} disabled={!selectedCategoryForSub}>Add</Button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Short Title <span className="text-gray-500">{newSubcategoryShortTitle.length}/15</span></label>
                    <Input value={newSubcategoryShortTitle} onChange={(e) => setNewSubcategoryShortTitle(e.target.value)} placeholder="Short title" maxLength={15} disabled={!selectedCategoryForSub} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Short Desc <span className="text-gray-500">{newSubcategoryShortDesc.length}/30</span></label>
                    <Input value={newSubcategoryShortDesc} onChange={(e) => setNewSubcategoryShortDesc(e.target.value)} placeholder="Short description" maxLength={30} disabled={!selectedCategoryForSub} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Peri Desc <span className="text-gray-500">{newSubcategoryPeriDesc.length}/22</span></label>
                    <Input value={newSubcategoryPeriDesc} onChange={(e) => setNewSubcategoryPeriDesc(e.target.value)} placeholder="Peri description" maxLength={22} disabled={!selectedCategoryForSub} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Description</label>
                  <textarea value={newSubcategoryDesc} onChange={(e) => setNewSubcategoryDesc(e.target.value)} placeholder="Full description" rows={2} className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white text-sm resize-y disabled:opacity-50" disabled={!selectedCategoryForSub} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Collection Column</label>
                  <select value={newSubcategoryCollectionOverride} onChange={(e) => setNewSubcategoryCollectionOverride(e.target.value)} className="w-full h-9 rounded-md border border-gray-700 bg-gray-950 px-3 text-white text-sm" disabled={!selectedCategoryForSub}>
                    <option value="auto">Auto</option>
                    <option value="force_on">Force On</option>
                    <option value="force_off">Force Off</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {categories.map(category => {
                const categorySubs = subcategories.filter(s => s.category_id === category.id)
                if (categorySubs.length === 0) return null
                
                return (
                  <div key={category.id} className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">{category.name}</h3>
                    {categorySubs.map(sub => (
                      <div 
                        key={sub.id}
                        className="flex items-center justify-between bg-gray-800 rounded-lg p-3 mb-2"
                      >
                        {editingSubcategory === sub.id ? (
                          <div className="flex gap-2 flex-1">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={editSubcategoryName}
                                onChange={(e) => setEditSubcategoryName(e.target.value)}
                                placeholder="Name *"
                                onKeyPress={(e) => e.key === 'Enter' && updateSubcategory(sub.id)}
                              />
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-400 mb-1">Short Title <span className="text-gray-500">{editSubcategoryShortTitle.length}/15</span></label>
                                  <Input value={editSubcategoryShortTitle} onChange={(e) => setEditSubcategoryShortTitle(e.target.value)} placeholder="Short title" maxLength={15} />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-400 mb-1">Short Desc <span className="text-gray-500">{editSubcategoryShortDesc.length}/30</span></label>
                                  <Input value={editSubcategoryShortDesc} onChange={(e) => setEditSubcategoryShortDesc(e.target.value)} placeholder="Short description" maxLength={30} />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-400 mb-1">Peri Desc <span className="text-gray-500">{editSubcategoryPeriDesc.length}/22</span></label>
                                  <Input value={editSubcategoryPeriDesc} onChange={(e) => setEditSubcategoryPeriDesc(e.target.value)} placeholder="Peri description" maxLength={22} />
                                </div>
                              </div>
                              <textarea value={editSubcategoryDesc} onChange={(e) => setEditSubcategoryDesc(e.target.value)} placeholder="Description" rows={2} className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white text-sm resize-y" />
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Collection Column</label>
                                <select value={editSubcategoryCollectionOverride} onChange={(e) => setEditSubcategoryCollectionOverride(e.target.value)} className="w-full h-9 rounded-md border border-gray-700 bg-gray-950 px-3 text-white text-sm">
                                  <option value="auto">Auto</option>
                                  <option value="force_on">Force On</option>
                                  <option value="force_off">Force Off</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <Button size="sm" onClick={() => updateSubcategory(sub.id)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingSubcategory(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-1">
                              {editingSubcategoryOrder === sub.id ? (
                                <Input
                                  type="number"
                                  value={editSubcategoryOrder}
                                  onChange={(e) => setEditSubcategoryOrder(e.target.value)}
                                  className="w-16"
                                  onBlur={() => updateSubcategoryOrder(sub.id, editSubcategoryOrder)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      updateSubcategoryOrder(sub.id, editSubcategoryOrder)
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <span 
                                  className="text-xs text-gray-500 cursor-pointer hover:text-gray-400"
                                  onClick={() => startEditSubcategoryOrder(sub)}
                                >
                                  [{sub.order_index}]
                                </span>
                              )}
                              <span className="text-white text-sm">{sub.name}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => startEditSubcategory(sub)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => deleteSubcategory(sub.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
              
              {subcategories.length === 0 && (
                <p className="text-gray-500 text-center py-8">No subcategories yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

