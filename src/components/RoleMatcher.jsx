import React, { useState, useEffect, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { supabase } from '../lib/supabase'

// Helper function to extract last name for sorting
const getLastName = (fullName) => {
  const parts = fullName.trim().split(/\s+/)
  return parts[parts.length - 1].toLowerCase()
}

const sortByLastName = (a, b) => {
  const lastNameA = getLastName(a)
  const lastNameB = getLastName(b)
  return lastNameA.localeCompare(lastNameB)
}

// Original trio IDs that cannot be deleted
const ORIGINAL_TRIO_IDS = ['trio-1', 'trio-2', 'trio-3', 'trio-4', 'trio-5', 'trio-6']

const defaultTrios = [
  {
    id: 'trio-1',
    name: "UME-MD Trio",
    subtitle: "",
    color: "blue",
    roles: [
      { id: "ume-educator", title: "Clinical Skills Director", type: "Educator", assignee: "" },
      { id: "ume-learner", title: "MS3 Student", type: "Learner", assignee: "" },
      { id: "ume-tech", title: "Medical Education Technologist", type: "Tech SME", assignee: "" }
    ]
  },
  {
    id: 'trio-2',
    name: "OPDP Trio",
    subtitle: "Other Professional Degree Programs",
    color: "green",
    roles: [
      { id: "opdp-educator", title: "Program Director (SLP or AuD)", type: "Educator", assignee: "" },
      { id: "opdp-learner", title: "MS-ACI Student", type: "Learner", assignee: "" },
      { id: "opdp-tech", title: "IPE Coordinator with Tech Interest", type: "Tech SME", assignee: "" }
    ]
  },
  {
    id: 'trio-3',
    name: "GME Trio",
    subtitle: "",
    color: "purple",
    roles: [
      { id: "gme-educator", title: "Residency Program Director", type: "Educator", assignee: "" },
      { id: "gme-learner", title: "PGY-2 Resident", type: "Learner", assignee: "" },
      { id: "gme-tech", title: "Chief Resident with Informatics Interest", type: "Tech SME", assignee: "" }
    ]
  },
  {
    id: 'trio-4',
    name: "CPD Trio",
    subtitle: "Continuing Professional Development",
    color: "amber",
    roles: [
      { id: "cpd-educator", title: "CPD Director", type: "Educator", assignee: "" },
      { id: "cpd-learner", title: "Mid-career Faculty Member", type: "Learner", assignee: "" },
      { id: "cpd-tech", title: "IT Clinical Liaison", type: "Tech SME", assignee: "" }
    ]
  },
  {
    id: 'trio-5',
    name: "Cross-Cutting Trio",
    subtitle: "",
    color: "rose",
    roles: [
      { id: "cross-educator", title: "Simulation Center Director", type: "Educator", assignee: "" },
      { id: "cross-learner", title: "Fellow", type: "Learner", assignee: "" },
      { id: "cross-tech", title: "EBL Director", type: "Tech SME", assignee: "Philip Walker" }
    ]
  },
  {
    id: 'trio-6',
    name: "Innovation Trio",
    subtitle: "",
    color: "teal",
    roles: [
      { id: "innov-educator", title: "Assessment Director", type: "Educator", assignee: "" },
      { id: "innov-learner", title: "MS4 or DMP Student", type: "Learner", assignee: "" },
      { id: "innov-tech", title: "Faculty AI Early Adopter", type: "Tech SME", assignee: "" }
    ]
  }
]

const defaultAdditionalRoles = [
  {
    id: "skeptic",
    title: "Integrated Skeptic",
    description: "Senior faculty member known for thoughtful technology adoption (rotates through trios)",
    assignee: ""
  }
]

const colorSchemes = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", header: "bg-blue-100", accent: "text-blue-700" },
  green: { bg: "bg-green-50", border: "border-green-200", header: "bg-green-100", accent: "text-green-700" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", header: "bg-purple-100", accent: "text-purple-700" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", header: "bg-amber-100", accent: "text-amber-700" },
  rose: { bg: "bg-rose-50", border: "border-rose-200", header: "bg-rose-100", accent: "text-rose-700" },
  teal: { bg: "bg-teal-50", border: "border-teal-200", header: "bg-teal-100", accent: "text-teal-700" },
  slate: { bg: "bg-slate-50", border: "border-slate-200", header: "bg-slate-100", accent: "text-slate-700" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", header: "bg-indigo-100", accent: "text-indigo-700" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", header: "bg-pink-100", accent: "text-pink-700" },
  cyan: { bg: "bg-cyan-50", border: "border-cyan-200", header: "bg-cyan-100", accent: "text-cyan-700" },
}

export default function RoleMatcher({ session }) {
  const [trios, setTrios] = useState([])
  const [additionalRoles, setAdditionalRoles] = useState([])
  const [stakeholders, setStakeholders] = useState([])
  const [newStakeholder, setNewStakeholder] = useState('')
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [lastSaved, setLastSaved] = useState(null)
  const [lastUpdatedBy, setLastUpdatedBy] = useState(null)

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await supabase
          .from('role_assignments')
          .select('*')
          .eq('id', 'main')
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Load error:', error)
        }

        if (data) {
          setTrios(data.trios || defaultTrios)
          setAdditionalRoles(data.additional_roles || defaultAdditionalRoles)
          setStakeholders(data.stakeholders || [])
          setComments(data.comments || [])
          setLastSaved(data.updated_at ? new Date(data.updated_at) : null)
          setLastUpdatedBy(data.updated_by_email)
        } else {
          // Initialize with defaults
          setTrios(defaultTrios)
          setAdditionalRoles(defaultAdditionalRoles)
          setStakeholders([])
          setComments([])
        }
      } catch (err) {
        console.error('Load error:', err)
        setTrios(defaultTrios)
        setAdditionalRoles(defaultAdditionalRoles)
        setStakeholders([])
        setComments([])
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('role_assignments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'role_assignments', filter: 'id=eq.main' },
        (payload) => {
          if (payload.new && payload.new.updated_by !== session.user.id) {
            // Another user made changes, update our state
            setTrios(payload.new.trios || defaultTrios)
            setAdditionalRoles(payload.new.additional_roles || defaultAdditionalRoles)
            setStakeholders(payload.new.stakeholders || [])
            setComments(payload.new.comments || [])
            setLastSaved(new Date(payload.new.updated_at))
            setLastUpdatedBy(payload.new.updated_by_email)
            setSaveStatus('saved')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session.user.id])

  // Save data to Supabase
  const saveData = useCallback(async (newTrios, newAdditionalRoles, newStakeholders, newComments) => {
    setSaveStatus('saving')
    try {
      const { error } = await supabase
        .from('role_assignments')
        .upsert({
          id: 'main',
          trios: newTrios,
          additional_roles: newAdditionalRoles,
          stakeholders: newStakeholders,
          comments: newComments,
          updated_at: new Date().toISOString(),
          updated_by: session.user.id,
          updated_by_email: session.user.email
        })

      if (error) throw error

      setLastSaved(new Date())
      setLastUpdatedBy(session.user.email)
      setSaveStatus('saved')
    } catch (err) {
      console.error('Save failed:', err)
      setSaveStatus('error')
    }
  }, [session.user.id, session.user.email])

  // Debounced save
  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      saveData(trios, additionalRoles, stakeholders, comments)
    }, 800)
    return () => clearTimeout(timer)
  }, [trios, additionalRoles, stakeholders, comments, loading, saveData])

  // Trio management functions
  const updateTrioName = (trioId, name) => {
    setTrios(prev => prev.map(t => t.id === trioId ? { ...t, name } : t))
    setSaveStatus('unsaved')
  }

  const updateTrioSubtitle = (trioId, subtitle) => {
    setTrios(prev => prev.map(t => t.id === trioId ? { ...t, subtitle } : t))
    setSaveStatus('unsaved')
  }

  const updateTrioColor = (trioId, color) => {
    setTrios(prev => prev.map(t => t.id === trioId ? { ...t, color } : t))
    setSaveStatus('unsaved')
  }

  const updateRoleTitle = (trioId, roleId, title) => {
    setTrios(prev => prev.map(t => 
      t.id === trioId 
        ? { ...t, roles: t.roles.map(r => r.id === roleId ? { ...r, title } : r) }
        : t
    ))
    setSaveStatus('unsaved')
  }

  const updateRoleAssignee = (trioId, roleId, assignee) => {
    setTrios(prev => prev.map(t => 
      t.id === trioId 
        ? { ...t, roles: t.roles.map(r => r.id === roleId ? { ...r, assignee } : r) }
        : t
    ))
    setSaveStatus('unsaved')
  }

  const updateAdditionalRoleAssignee = (roleId, assignee) => {
    setAdditionalRoles(prev => prev.map(r => r.id === roleId ? { ...r, assignee } : r))
    setSaveStatus('unsaved')
  }

  // Alternative suggestion management
  const addAlternative = (trioId, roleId, stakeholderName) => {
    if (!stakeholderName) return
    setTrios(prev => prev.map(t => 
      t.id === trioId 
        ? { 
            ...t, 
            roles: t.roles.map(r => {
              if (r.id !== roleId) return r
              const alternatives = r.alternatives || []
              // Don't add duplicates or self
              if (alternatives.some(a => a.name.toLowerCase() === stakeholderName.toLowerCase()) || 
                  r.assignee?.toLowerCase() === stakeholderName.toLowerCase()) {
                return r
              }
              return {
                ...r,
                alternatives: [...alternatives, {
                  name: stakeholderName,
                  suggested_by: session.user.email,
                  suggested_by_id: session.user.id,
                  suggested_at: new Date().toISOString()
                }]
              }
            })
          }
        : t
    ))
    setSaveStatus('unsaved')
  }

  const removeAlternative = (trioId, roleId, alternativeName) => {
    setTrios(prev => prev.map(t => 
      t.id === trioId 
        ? { 
            ...t, 
            roles: t.roles.map(r => 
              r.id === roleId 
                ? { ...r, alternatives: (r.alternatives || []).filter(a => a.name !== alternativeName) }
                : r
            )
          }
        : t
    ))
    setSaveStatus('unsaved')
  }

  const addAdditionalRoleAlternative = (roleId, stakeholderName) => {
    if (!stakeholderName) return
    setAdditionalRoles(prev => prev.map(r => {
      if (r.id !== roleId) return r
      const alternatives = r.alternatives || []
      if (alternatives.some(a => a.name.toLowerCase() === stakeholderName.toLowerCase()) ||
          r.assignee?.toLowerCase() === stakeholderName.toLowerCase()) {
        return r
      }
      return {
        ...r,
        alternatives: [...alternatives, {
          name: stakeholderName,
          suggested_by: session.user.email,
          suggested_by_id: session.user.id,
          suggested_at: new Date().toISOString()
        }]
      }
    }))
    setSaveStatus('unsaved')
  }

  const removeAdditionalRoleAlternative = (roleId, alternativeName) => {
    setAdditionalRoles(prev => prev.map(r => 
      r.id === roleId 
        ? { ...r, alternatives: (r.alternatives || []).filter(a => a.name !== alternativeName) }
        : r
    ))
    setSaveStatus('unsaved')
  }

  // Comment management
  const addComment = () => {
    const text = newComment.trim()
    if (!text) return
    
    const comment = {
      id: `comment-${Date.now()}`,
      text,
      author_id: session.user.id,
      author_email: session.user.email,
      created_at: new Date().toISOString()
    }
    setComments(prev => [...prev, comment])
    setNewComment('')
    setSaveStatus('unsaved')
  }

  const deleteComment = (commentId) => {
    const comment = comments.find(c => c.id === commentId)
    if (comment && comment.author_id === session.user.id) {
      if (window.confirm('Delete this comment?')) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        setSaveStatus('unsaved')
      }
    }
  }

  const startEditComment = (comment) => {
    if (comment.author_id === session.user.id) {
      setEditingCommentId(comment.id)
      setEditingCommentText(comment.text)
    }
  }

  const saveEditComment = () => {
    if (!editingCommentText.trim()) return
    setComments(prev => prev.map(c => 
      c.id === editingCommentId 
        ? { ...c, text: editingCommentText.trim(), edited_at: new Date().toISOString() }
        : c
    ))
    setEditingCommentId(null)
    setEditingCommentText('')
    setSaveStatus('unsaved')
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  const addTrio = () => {
    const colors = Object.keys(colorSchemes)
    const newId = `trio-${Date.now()}`
    const newTrio = {
      id: newId,
      name: "New Trio",
      subtitle: "",
      color: colors[trios.length % colors.length],
      roles: [
        { id: `${newId}-educator`, title: "Educator Role", type: "Educator", assignee: "" },
        { id: `${newId}-learner`, title: "Learner Role", type: "Learner", assignee: "" },
        { id: `${newId}-tech`, title: "Tech SME Role", type: "Tech SME", assignee: "" }
      ]
    }
    setTrios(prev => [...prev, newTrio])
    setSaveStatus('unsaved')
  }

  const deleteTrio = (trioId) => {
    // Prevent deletion of original trios
    if (ORIGINAL_TRIO_IDS.includes(trioId)) {
      return
    }
    if (window.confirm('Delete this trio? This cannot be undone.')) {
      setTrios(prev => prev.filter(t => t.id !== trioId))
      setSaveStatus('unsaved')
    }
  }

  // Stakeholder management
  const [duplicateWarning, setDuplicateWarning] = useState('')
  
  const addStakeholder = () => {
    const name = newStakeholder.trim()
    if (!name) return
    
    // Case-insensitive duplicate check
    const isDuplicate = stakeholders.some(s => s.toLowerCase() === name.toLowerCase())
    if (isDuplicate) {
      setDuplicateWarning(`"${name}" is already in the stakeholder pool`)
      setTimeout(() => setDuplicateWarning(''), 3000)
      return
    }
    
    setStakeholders(prev => [...prev, name].sort(sortByLastName))
    setNewStakeholder('')
    setDuplicateWarning('')
    setSaveStatus('unsaved')
  }

  const removeStakeholder = (name) => {
    setStakeholders(prev => prev.filter(s => s !== name))
    setSaveStatus('unsaved')
  }

  const addMultipleStakeholders = (text) => {
    const names = text.split(/[\n,]/).map(n => n.trim()).filter(n => n)
    // Case-insensitive deduplication
    const existingLower = stakeholders.map(s => s.toLowerCase())
    const newNames = names.filter(n => !existingLower.includes(n.toLowerCase()))
    const unique = [...stakeholders, ...newNames].sort(sortByLastName)
    
    const duplicateCount = names.length - newNames.length
    if (duplicateCount > 0) {
      setDuplicateWarning(`${duplicateCount} duplicate name(s) skipped`)
      setTimeout(() => setDuplicateWarning(''), 3000)
    }
    
    setStakeholders(unique)
    setSaveStatus('unsaved')
  }

  // Stats
  const filledCount = trios.reduce((acc, trio) => 
    acc + trio.roles.filter(r => r.assignee).length, 0
  ) + additionalRoles.filter(r => r.assignee).length
  
  const totalRoles = trios.reduce((acc, trio) => acc + trio.roles.length, 0) + additionalRoles.length

  // Export functions
  const generateMarkdown = () => {
    let output = "# VUSM RoleMatcher: Entangled Trio Role Assignments\n\n"
    output += `*Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}*\n\n`
    output += "---\n\n"
    
    trios.forEach(trio => {
      output += `## ${trio.name}\n`
      if (trio.subtitle) output += `*${trio.subtitle}*\n`
      output += "\n"
      output += "| Role Type | Position | Assigned To |\n"
      output += "|-----------|----------|-------------|\n"
      trio.roles.forEach(role => {
        const name = role.assignee || "*(Not assigned)*"
        output += `| ${role.type} | ${role.title} | ${name} |\n`
      })
      output += "\n"
    })
    
    if (additionalRoles.length > 0) {
      output += "## Additional Roles\n\n"
      output += "| Role | Assigned To |\n"
      output += "|------|-------------|\n"
      additionalRoles.forEach(role => {
        const name = role.assignee || "*(Not assigned)*"
        output += `| ${role.title} | ${name} |\n`
      })
    }

    output += "\n---\n\n"
    output += `**Progress:** ${filledCount}/${totalRoles} roles assigned\n`

    return output
  }

  const generateCSV = () => {
    let output = "Trio,Role Type,Position,Assigned To\n"
    
    trios.forEach(trio => {
      trio.roles.forEach(role => {
        output += `"${trio.name}","${role.type}","${role.title}","${role.assignee || ''}"\n`
      })
    })
    
    additionalRoles.forEach(role => {
      output += `"Additional","Critical Friend","${role.title}","${role.assignee || ''}"\n`
    })

    return output
  }

  const exportFile = (format) => {
    const content = format === 'md' ? generateMarkdown() : generateCSV()
    const mimeType = format === 'md' ? 'text/markdown' : 'text/csv'
    const filename = `phase1_role_assignments.${format}`
    
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // Components
  const TypeBadge = ({ type }) => {
    const colors = {
      Educator: "bg-indigo-100 text-indigo-700 border-indigo-200",
      Learner: "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Tech SME": "bg-orange-100 text-orange-700 border-orange-200"
    }
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
        {type}
      </span>
    )
  }

  const getPillColors = (type) => {
    const pillColors = {
      Educator: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200", button: "text-indigo-500" },
      Learner: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", button: "text-emerald-500" },
      "Tech SME": { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", button: "text-orange-500" },
      "Critical Friend": { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", button: "text-red-500" }
    }
    return pillColors[type] || { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200", button: "text-gray-500" }
  }

  const SaveIndicator = () => {
    const states = {
      saved: { icon: "✓", text: "Saved", color: "text-green-600" },
      saving: { icon: "○", text: "Saving...", color: "text-amber-600" },
      unsaved: { icon: "●", text: "Unsaved", color: "text-amber-600" },
      error: { icon: "✕", text: "Save failed", color: "text-red-600" }
    }
    const state = states[saveStatus]
    return (
      <div className="text-right">
        <div className={`flex items-center justify-end gap-1.5 text-sm ${state.color}`}>
          <span className="font-mono">{state.icon}</span>
          <span>{state.text}</span>
        </div>
        {lastSaved && lastUpdatedBy && (
          <p className="text-xs text-slate-400 mt-0.5">
            by {lastUpdatedBy === session.user.email ? 'you' : lastUpdatedBy}
          </p>
        )}
      </div>
    )
  }

  const SearchableDropdown = ({ value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
    const buttonRef = useRef(null)
    const dropdownRef = useRef(null)
    const searchInputRef = useRef(null)

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (buttonRef.current && !buttonRef.current.contains(e.target) &&
            dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width
        })
        // Focus search input after position is set, without scrolling
        requestAnimationFrame(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus({ preventScroll: true })
          }
        })
      }
    }, [isOpen])

    // Sort by last name and filter
    const sortedStakeholders = [...stakeholders].sort(sortByLastName)
    
    const filtered = sortedStakeholders.filter(s => 
      s.toLowerCase().includes(search.toLowerCase())
    )

    const handleSelect = (name, e) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      // Capture scroll position before state change
      const scrollY = window.scrollY
      const scrollX = window.scrollX
      onChange(name)
      setIsOpen(false)
      setSearch('')
      // Restore scroll position after React re-render
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY)
      })
    }

    const handleClear = (e) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      const scrollY = window.scrollY
      const scrollX = window.scrollX
      onChange('')
      setIsOpen(false)
      setSearch('')
      requestAnimationFrame(() => {
        window.scrollTo(scrollX, scrollY)
      })
    }

    const handleToggle = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsOpen(!isOpen)
    }

    return (
      <>
        <div 
          ref={buttonRef}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white cursor-pointer flex items-center justify-between text-sm"
          onClick={handleToggle}
        >
          <span className={value ? 'text-slate-900' : 'text-slate-400'}>
            {value || placeholder}
          </span>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {isOpen && ReactDOM.createPortal(
          <div 
            ref={dropdownRef}
            className="bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden"
            style={{ 
              position: 'absolute',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 9999
            }}
            onMouseDown={(e) => {
              // Only prevent default if not clicking on the search input
              if (e.target.tagName !== 'INPUT') {
                e.preventDefault()
              }
            }}
          >
            <div className="p-2 border-b border-slate-100">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search stakeholders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-44 overflow-y-auto">
              {value && (
                <div
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer border-b border-slate-100"
                  onClick={handleClear}
                >
                  ✕ Clear assignment
                </div>
              )}
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-sm text-slate-400 text-center">
                  {stakeholders.length === 0 ? 'Add stakeholders above first' : 'No matches found'}
                </div>
              ) : (
                filtered.map(name => (
                  <div
                    key={name}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === name ? 'bg-blue-100 font-medium' : ''}`}
                    onClick={(e) => handleSelect(name, e)}
                  >
                    {name}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                VUSM RoleMatcher
              </h1>
              <p className="text-slate-500 text-sm">
                AI Strategy for Medical Education • {trios.length} Trios • {totalRoles} Roles
              </p>
            </div>
            <SaveIndicator />
          </div>
          
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="bg-slate-100 px-4 py-2 rounded-xl">
              <span className="text-slate-900 font-bold text-lg">{filledCount}</span>
              <span className="text-slate-500 text-sm">/{totalRoles} assigned</span>
            </div>
            
            <div className="flex-1" />

            <span className="text-sm text-slate-500">{session.user.email}</span>
            
            {session.user.email === 'shane.stenner@vumc.org' && (
              <>
                <button onClick={() => exportFile('md')} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all font-medium text-sm shadow-sm">
                  Export MD
                </button>
                <button onClick={() => exportFile('csv')} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium text-sm">
                  Export CSV
                </button>
              </>
            )}
            <button onClick={handleSignOut} className="px-4 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all font-medium text-sm">
              Sign Out
            </button>
          </div>
        </div>

        {/* Purpose Explanation */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-5">
          <h2 className="font-bold text-slate-900 text-lg mb-1">Why We Need Your Help</h2>
          <p className="text-sm text-slate-500 mb-3">
            We're taking a deliberate <strong>bottom-up approach</strong> to AI strategy: six to ten small "Entangled Trios" — each composed of an educator, a learner, and a tech/informatics SME — will independently explore AI opportunities and challenges from the perspective of their part of the education continuum. Their outputs will feed into a broader sense-making workshop where we'll synthesize themes, prioritize, and build a shared roadmap.
          </p>
          <p className="text-sm text-slate-500 mb-3">
            The trio model ensures we hear from <strong>people closest to the work</strong> before leadership filters set in, and it gives every segment of our programs an equal voice.
          </p>
          <p className="text-sm text-slate-500">
            <strong>Your task:</strong> Suggest stakeholders who should be involved, assign people to open trio roles where you see a good fit, and propose a new trio if you identify a group we haven't covered.
          </p>
        </div>

        {/* Stakeholder Pool */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-5">
          <h2 className="font-bold text-slate-900 text-lg mb-1">
            <span className="text-blue-600">Step 1:</span> Add Stakeholders
          </h2>
          <p className="text-sm text-slate-500 mb-3">
            Add people here, then assign them to roles below. Names can be assigned to multiple roles.
          </p>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newStakeholder}
              onChange={(e) => setNewStakeholder(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStakeholder()}
              placeholder="Add a name..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            <button onClick={addStakeholder} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm">
              Add
            </button>
          </div>

          <details className="mb-3">
            <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
              Bulk add (paste multiple names)
            </summary>
            <div className="mt-2">
              <textarea
                placeholder="Paste names here, one per line or comma-separated..."
                className="w-full h-20 px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                onBlur={(e) => { if (e.target.value) { addMultipleStakeholders(e.target.value); e.target.value = '' }}}
              />
            </div>
          </details>

          {duplicateWarning && (
            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              {duplicateWarning}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {stakeholders.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No stakeholders added yet</p>
            ) : (
              [...stakeholders]
                .sort(sortByLastName)
                .map(name => (
                  <span key={name} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm">
                    {name}
                    <button
                      onClick={() => removeStakeholder(name)}
                      className="ml-1 text-slate-400 hover:text-red-500 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))
            )}
          </div>
        </div>

        {/* Trios Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-5">
          <h2 className="font-bold text-slate-900 text-lg mb-1">
            <span className="text-blue-600">Step 2:</span> Match Stakeholders to Trio Roles
          </h2>
          <p className="text-sm text-slate-500 mb-4">Assign stakeholders from your pool to each role in the trios below. If you identify a gap in coverage, use the "Add New Trio" card to propose additional trios.</p>
          
          {/* Role Types Reference */}
          <div className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
            <h3 className="font-semibold text-amber-900 mb-2 text-sm">Role Types Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-white/60 rounded-lg p-2">
                <TypeBadge type="Educator" />
                <p className="mt-1 text-slate-600 text-xs">
                  Faculty members, directors, and instructional leaders responsible for curriculum and teaching.
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <TypeBadge type="Learner" />
                <p className="mt-1 text-slate-600 text-xs">
                  Students, residents, fellows, and faculty in learning roles who experience the educational process.
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <TypeBadge type="Tech SME" />
                <p className="mt-1 text-slate-600 text-xs">
                  Technology specialists, informatics experts, and early adopters who understand AI/tech capabilities.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
          {trios.map((trio) => {
            const colors = colorSchemes[trio.color] || colorSchemes.slate
            return (
              <div key={trio.id} className={`rounded-2xl border-2 ${colors.bg} ${colors.border} shadow-sm`} style={{ overflow: 'visible' }}>
                <div className={`${colors.header} px-4 py-3 border-b border-opacity-50`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={trio.name}
                        onChange={(e) => updateTrioName(trio.id, e.target.value)}
                        className="font-bold text-slate-800 bg-transparent border-none outline-none w-full focus:bg-white/50 rounded px-1 -ml-1"
                      />
                      <input
                        type="text"
                        value={trio.subtitle}
                        onChange={(e) => updateTrioSubtitle(trio.id, e.target.value)}
                        placeholder="Add subtitle..."
                        className="text-xs text-slate-600 bg-transparent border-none outline-none w-full focus:bg-white/50 rounded px-1 -ml-1 mt-0.5"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <select
                        value={trio.color}
                        onChange={(e) => updateTrioColor(trio.id, e.target.value)}
                        className="text-xs bg-white/50 border border-slate-300 rounded px-1 py-0.5"
                      >
                        {Object.keys(colorSchemes).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {!ORIGINAL_TRIO_IDS.includes(trio.id) && (
                        <button
                          onClick={() => deleteTrio(trio.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Delete trio"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-3 space-y-2" style={{ overflow: 'visible' }}>
                  {trio.roles.map((role, roleIndex) => (
                    <div key={role.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100" style={{ position: 'relative', zIndex: 10 - roleIndex }}>
                      <div className="flex items-center gap-2 mb-2">
                        <TypeBadge type={role.type} />
                        <input
                          type="text"
                          value={role.title}
                          onChange={(e) => updateRoleTitle(trio.id, role.id, e.target.value)}
                          className="flex-1 text-sm font-medium text-slate-700 bg-transparent border-none outline-none focus:bg-slate-50 rounded px-1"
                        />
                      </div>
                      
                      {/* Assignee - show pill if assigned, dropdown if not */}
                      {role.assignee ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const pillColors = getPillColors(role.type)
                            return (
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 ${pillColors.bg} ${pillColors.text} rounded-lg text-sm font-medium border ${pillColors.border}`}>
                                {role.assignee}
                                <button
                                  onClick={() => updateRoleAssignee(trio.id, role.id, '')}
                                  className={`${pillColors.button} hover:text-red-500 font-bold ml-1`}
                                >
                                  ×
                                </button>
                              </span>
                            )
                          })()}
                        </div>
                      ) : (
                        <SearchableDropdown
                          value={role.assignee}
                          onChange={(val) => updateRoleAssignee(trio.id, role.id, val)}
                          placeholder="Select stakeholder..."
                        />
                      )}
                      
                      {/* Alternative suggestions */}
                      {role.assignee && (
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-500">Alternative suggestions:</span>
                          </div>
                          {(role.alternatives && role.alternatives.length > 0) && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {role.alternatives.map((alt, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs border border-amber-200">
                                  {alt.name}
                                  {alt.suggested_by_id === session.user.id && (
                                    <button
                                      onClick={() => removeAlternative(trio.id, role.id, alt.name)}
                                      className="text-amber-500 hover:text-red-500 font-bold ml-0.5"
                                    >
                                      ×
                                    </button>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                          <SearchableDropdown
                            value=""
                            onChange={(val) => addAlternative(trio.id, role.id, val)}
                            placeholder="+ Suggest alternative..."
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          
          {/* Add Trio Card */}
          <button
            onClick={addTrio}
            className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all min-h-[200px] flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-700"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Add New Trio</span>
          </button>
          </div>
        </div>

        {/* Additional Roles */}
        <div className="mt-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 text-lg mb-1">
            <span className="text-blue-600">Step 3:</span> Assign Additional Roles
          </h2>
          <p className="text-sm text-slate-500 mb-4">Assign stakeholders to cross-cutting roles that support all trios.</p>
          {additionalRoles.map((role) => (
            <div key={role.id} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded border border-red-200">
                  Critical Friend
                </span>
                <span className="font-semibold text-slate-800">{role.title}</span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{role.description}</p>
              
              {/* Assignee - show pill if assigned, dropdown if not */}
              {role.assignee ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const pillColors = getPillColors('Critical Friend')
                    return (
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 ${pillColors.bg} ${pillColors.text} rounded-lg text-sm font-medium border ${pillColors.border}`}>
                        {role.assignee}
                        <button
                          onClick={() => updateAdditionalRoleAssignee(role.id, '')}
                          className={`${pillColors.button} hover:text-red-600 font-bold ml-1`}
                        >
                          ×
                        </button>
                      </span>
                    )
                  })()}
                </div>
              ) : (
                <SearchableDropdown
                  value={role.assignee}
                  onChange={(val) => updateAdditionalRoleAssignee(role.id, val)}
                  placeholder="Select stakeholder..."
                />
              )}
              
              {/* Alternative suggestions */}
              {role.assignee && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Alternative suggestions:</span>
                  </div>
                  {(role.alternatives && role.alternatives.length > 0) && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {role.alternatives.map((alt, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs border border-amber-200">
                          {alt.name}
                          {alt.suggested_by_id === session.user.id && (
                            <button
                              onClick={() => removeAdditionalRoleAlternative(role.id, alt.name)}
                              className="text-amber-500 hover:text-red-500 font-bold ml-0.5"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  <SearchableDropdown
                    value=""
                    onChange={(val) => addAdditionalRoleAlternative(role.id, val)}
                    placeholder="+ Suggest alternative..."
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ideas and Comments */}
        <div className="mt-5 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="font-bold text-slate-900 text-lg mb-1">
            <span className="text-blue-600">Step 4:</span> Share Ideas &amp; Comments
          </h2>
          <p className="text-sm text-slate-500 mb-4">Share any other thoughts, suggestions, or ideas for the AI strategy process.</p>
          
          {/* Add new comment */}
          <div className="mb-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment or idea..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
              rows={3}
            />
            <button 
              onClick={addComment}
              disabled={!newComment.trim()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Comment
            </button>
          </div>

          {/* Comments list */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No comments yet. Be the first to share an idea!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  {editingCommentId === comment.id ? (
                    // Editing mode
                    <div>
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={saveEditComment}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-xs"
                        >
                          Save
                        </button>
                        <button 
                          onClick={cancelEditComment}
                          className="px-3 py-1.5 text-slate-600 hover:text-slate-800 transition-all font-medium text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.text}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200">
                        <div className="text-xs text-slate-400">
                          <span className="font-medium text-slate-500">{comment.author_email}</span>
                          {' • '}
                          {new Date(comment.created_at).toLocaleDateString()}
                          {comment.edited_at && ' (edited)'}
                        </div>
                        {comment.author_id === session.user.id && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => startEditComment(comment)}
                              className="text-xs text-slate-500 hover:text-blue-600 transition-all"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => deleteComment(comment.id)}
                              className="text-xs text-slate-500 hover:text-red-600 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
