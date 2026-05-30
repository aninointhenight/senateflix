import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function CategoriesManager() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [newName,    setNewName]    = useState('')
  const [editId,     setEditId]     = useState(null)
  const [editName,   setEditName]   = useState('')
  const [saving,     setSaving]     = useState(false)

  useEffect(() => { fetchCats() }, [])

  async function fetchCats() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('display_order')
    setCategories(data || [])
    setLoading(false)
  }

  async function addCategory(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.display_order || 0), 0)
    await supabase.from('categories').insert({ name: newName.trim(), display_order: maxOrder + 1 })
    setNewName('')
    fetchCats()
    setSaving(false)
  }

  async function saveEdit(id) {
    if (!editName.trim()) { setEditId(null); return }
    await supabase.from('categories').update({ name: editName.trim() }).eq('id', id)
    setEditId(null)
    fetchCats()
  }

  async function swap(idxA, idxB) {
    const a = categories[idxA], b = categories[idxB]
    await Promise.all([
      supabase.from('categories').update({ display_order: b.display_order }).eq('id', a.id),
      supabase.from('categories').update({ display_order: a.display_order }).eq('id', b.id),
    ])
    fetchCats()
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category? Shows in it will become uncategorized.')) return
    await supabase.from('categories').delete().eq('id', id)
    fetchCats()
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold">Categories</h1>
        <p className="text-gray-600 text-sm">
          Manage browse categories. Order here = order in navbar and browse rows.
        </p>
      </div>

      {/* Add new */}
      <form onSubmit={addCategory} className="flex gap-3 mb-6">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New category name..."
          className="flex-1 bg-[#1f1f1f] border border-gray-700 text-white rounded px-4 py-2.5 text-sm focus:outline-none focus:border-gray-500 placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="bg-sf-red hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2 rounded transition-colors"
        >
          Add
        </button>
      </form>

      {loading ? (
        <p className="text-gray-600 text-sm">Loading...</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="bg-[#1a1a1a] border border-gray-800/50 rounded-lg px-4 py-3 flex items-center gap-3"
            >
              {/* Up/down reorder */}
              <div className="flex flex-col gap-0 shrink-0">
                <button
                  onClick={() => swap(idx, idx - 1)}
                  disabled={idx === 0}
                  className="text-gray-600 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => swap(idx, idx + 1)}
                  disabled={idx === categories.length - 1}
                  className="text-gray-600 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Name / edit field */}
              {editId === cat.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  saveEdit(cat.id)
                    if (e.key === 'Escape') setEditId(null)
                  }}
                  className="flex-1 bg-[#2a2a2a] border border-gray-600 text-white rounded px-3 py-1.5 text-sm focus:outline-none"
                />
              ) : (
                <span className="flex-1 text-white text-sm">{cat.name}</span>
              )}

              {/* Actions */}
              <div className="flex gap-3 shrink-0">
                {editId === cat.id ? (
                  <>
                    <button onClick={() => saveEdit(cat.id)} className="text-green-400 hover:text-green-300 text-xs transition-colors">Save</button>
                    <button onClick={() => setEditId(null)}  className="text-gray-600 hover:text-white text-xs transition-colors">Cancel</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditId(cat.id); setEditName(cat.name) }}
                      className="text-gray-500 hover:text-white text-xs transition-colors"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {!categories.length && (
            <p className="text-gray-600 text-sm text-center py-6">No categories yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
