import React, { useState, useMemo } from 'react'
import { X, Search, HelpCircle, Check, Users, BookOpen } from 'lucide-react'

export const RELATION_GUIDE_DATA = [
  {
    relation: 'Wife',
    gujarati: 'પત્ની',
    meaning: 'પરિવારના વડા (Head) ના ધર્મપત્ની',
    gender: 'Female',
    category: 'Immediate'
  },
  {
    relation: 'Husband',
    gujarati: 'પતિ',
    meaning: 'પરિવારના વડા (Head) ના પતિ / જીવનસાથી',
    gender: 'Male',
    category: 'Immediate'
  },
  {
    relation: 'Son',
    gujarati: 'પુત્ર',
    meaning: 'પરિવારના વડાના દીકરા / પુત્ર',
    gender: 'Male',
    category: 'Immediate'
  },
  {
    relation: 'Daughter',
    gujarati: 'પુત્રી',
    meaning: 'પરિવારના વડાની દીકરી / પુત્રી',
    gender: 'Female',
    category: 'Immediate'
  },
  {
    relation: 'Father',
    gujarati: 'પિતા',
    meaning: 'પરિવારના વડાના પિતાશ્રી (બાપુજી/પપ્પા)',
    gender: 'Male',
    category: 'Immediate'
  },
  {
    relation: 'Mother',
    gujarati: 'માતા',
    meaning: 'પરિવારના વડાના માતુશ્રી (બા/મમ્મી)',
    gender: 'Female',
    category: 'Immediate'
  },
  {
    relation: 'Brother',
    gujarati: 'ભાઈ (મોટા / નાના)',
    meaning: 'પરિવારના વડાના સગા મોટા અથવા નાના ભાઈ',
    gender: 'Male',
    category: 'Immediate'
  },
  {
    relation: 'Bhabhi',
    gujarati: 'ભાભી / મોટી ભાભી / જેઠાણી',
    meaning: 'મોટા ભાઈના પત્ની (મોટી ભાભી / જેઠાણી) અથવા નાના ભાઈના પત્ની (ભાભી / દેરાણી)',
    gender: 'Female',
    category: 'Immediate'
  },
  {
    relation: 'Nephew',
    gujarati: 'ભત્રીજો / ભાણો',
    meaning: 'સગા ભાઈનો દીકરો (ભત્રીજો) અથવા સગી બહેનનો દીકરો (ભાણો)',
    gender: 'Male',
    category: 'Immediate'
  },
  {
    relation: 'Niece',
    gujarati: 'ભત્રીજી / ભાણી',
    meaning: 'સગા ભાઈની દીકરી (ભત્રીજી) અથવા સગી બહેનની દીકરી (ભાણી)',
    gender: 'Female',
    category: 'Immediate'
  },
  {
    relation: 'Sister',
    gujarati: 'બહેન (મોટી / નાની)',
    meaning: 'પરિવારના વડાની સગી મોટી અથવા નાની બહેન',
    gender: 'Female',
    category: 'Immediate'
  },
  {
    relation: 'Grandfather',
    gujarati: 'દાદા',
    meaning: 'પરિવારના વડાના દાદા (પિતાના પિતા) અથવા નાના (માતાના પિતા)',
    gender: 'Male',
    category: 'Extended'
  },
  {
    relation: 'Grandmother',
    gujarati: 'દાદી',
    meaning: 'પરિવારના વડાના દાદી (પિતાની માતા) અથવા નાની (માતાની માતા)',
    gender: 'Female',
    category: 'Extended'
  },
  {
    relation: 'Uncle',
    gujarati: 'કાકા / મામા / ફુવા / માસા',
    meaning: 'પિતાના ભાઈ (કાકા), માતાના ભાઈ (મામા), ફોઈના પતિ (ફુવા) અથવા માસીના પતિ (માસા)',
    gender: 'Male',
    category: 'Extended'
  },
  {
    relation: 'Aunt',
    gujarati: 'કાકી / મામી / ફોઈ / માસી',
    meaning: 'કાકાની પત્ની (કાકી), મામાની પત્ની (મામી), પિતાની બહેન (ફોઈ) અથવા માતાની બહેન (માસી)',
    gender: 'Female',
    category: 'Extended'
  },
  {
    relation: 'Daughter-in-law',
    gujarati: 'પુત્રવધૂ',
    meaning: 'પરિવારના વડાના દીકરાની પત્ની (પુત્રવધૂ / વહુ)',
    gender: 'Female',
    category: 'Immediate'
  },
  {
    relation: 'Son-in-law',
    gujarati: 'જમાઈ',
    meaning: 'પરિવારના વડાની દીકરીના પતિ (જમાઈ)',
    gender: 'Male',
    category: 'Immediate'
  },
  {
    relation: 'Grandson',
    gujarati: 'પૌત્ર / દોહિત્ર',
    meaning: 'દીકરાનો દીકરો (પૌત્ર) અથવા દીકરીનો દીકરો (દોહિત્ર)',
    gender: 'Male',
    category: 'Extended'
  },
  {
    relation: 'Granddaughter',
    gujarati: 'પૌત્રી / દોહિત્રી',
    meaning: 'દીકરાની દીકરી (પૌત્રી) અથવા દીકરીની દીકરી (દોહિત્રી)',
    gender: 'Female',
    category: 'Extended'
  },
  {
    relation: 'Cousin',
    gujarati: 'પિતરાઈ ભાઈ/બહેન',
    meaning: 'કાકા, મામા, ફોઈ અથવા માસીના સંતાન (પિતરાઈ ભાઈ કે બહેન)',
    gender: 'Other',
    category: 'Extended'
  },
  {
    relation: 'Father-in-law',
    gujarati: 'સસરા',
    meaning: 'પત્ની અથવા પતિના પિતાશ્રી (સસરા)',
    gender: 'Male',
    category: 'In-laws'
  },
  {
    relation: 'Mother-in-law',
    gujarati: 'સાસુ',
    meaning: 'પત્ની અથવા પતિના માતુશ્રી (સાસુ)',
    gender: 'Female',
    category: 'In-laws'
  },
  {
    relation: 'Brother-in-law',
    gujarati: 'સાળો / બનેવી / દિયર / જેઠ',
    meaning: 'પત્નીનો ભાઈ (સાળો), બહેનનો પતિ (બનેવી), અથવા પતિનો ભાઈ (દિયર/જેઠ)',
    gender: 'Male',
    category: 'In-laws'
  },
  {
    relation: 'Sister-in-law',
    gujarati: 'સાળી / ભાભી / નણંદ',
    meaning: 'પત્નીની બહેન (સાળી), ભાઈની પત્ની (ભાભી), અથવા પતિની બહેન (નણંદ)',
    gender: 'Female',
    category: 'In-laws'
  },
  {
    relation: 'Other',
    gujarati: 'અન્ય સંબંધ',
    meaning: 'ઉપર જણાવેલ સિવાયનો અન્ય કોઈ કૌટુંબિક સંબંધ',
    gender: 'Other',
    category: 'Other'
  }
]

export default function RelationshipGuideModal({
  isOpen,
  onClose,
  selectedRelation,
  onSelectRelation,
  dynamicRelations = []
}) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Combine static guide with dynamic relations from master if any
  const combinedList = useMemo(() => {
    const list = [...RELATION_GUIDE_DATA]
    if (Array.isArray(dynamicRelations)) {
      dynamicRelations.forEach((dr) => {
        const name = typeof dr === 'string' ? dr : dr.name || dr.label || dr.value
        if (!name) return
        const cleanName = name.replace(/\s*\(.*?\)\s*/g, '').trim()
        const existing = list.find((item) => item.relation.toLowerCase() === cleanName.toLowerCase())
        if (!existing) {
          list.push({
            relation: cleanName,
            gujarati: dr.gujarati_name || 'નવો સંબંધ',
            meaning: dr.description || 'માસ્ટર દ્વારા ઉમેરેલ સંબંધ',
            gender: 'Other',
            category: 'Other'
          })
        }
      })
    }
    return list
  }, [dynamicRelations])

  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase()
    return combinedList.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory
      if (!matchCat) return false
      if (!query) return true
      return (
        item.relation.toLowerCase().includes(query) ||
        item.gujarati.toLowerCase().includes(query) ||
        item.meaning.toLowerCase().includes(query)
      )
    })
  }, [combinedList, search, selectedCategory])

  if (!isOpen) return null

  const categories = [
    { key: 'All', label: 'All / બધા સંબંધ' },
    { key: 'Immediate', label: 'Immediate / નજીકના' },
    { key: 'In-laws', label: 'In-laws / સાસરી પક્ષ' },
    { key: 'Extended', label: 'Extended / વિસ્તૃત' }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-glass-lg overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-surface-secondary/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                Relationship Guide
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  સંબંધ માર્ગદર્શિકા
                </span>
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                પરિવારના મુખ્ય વડા (Family Head) સાથેનો ચોક્કસ સંબંધ સમજવા માટે નીચે જુઓ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-text-secondary hover:text-text hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-border/80 bg-surface/30 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search relation by English or Gujarati (દા.ત. કાકા, Son, જમાઈ, Sister)..."
              className="w-full bg-input-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary hover:text-text font-bold"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-secondary/70 text-text-secondary hover:text-text hover:bg-surface-secondary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Relationship Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[50vh]">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
              <p className="text-sm font-semibold text-text">No relationships match your search</p>
              <p className="text-xs text-text-secondary mt-1">Try another search keyword in English or Gujarati</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredList.map((item) => {
                const isCurrent =
                  selectedRelation &&
                  selectedRelation.toLowerCase() === item.relation.toLowerCase()

                return (
                  <div
                    key={item.relation}
                    onClick={() => {
                      if (onSelectRelation) {
                        onSelectRelation(item.relation)
                        onClose()
                      }
                    }}
                    className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm'
                        : 'bg-card border-border hover:border-primary/50 hover:bg-surface-secondary/40 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <span className="font-bold text-sm text-text group-hover:text-primary transition-colors">
                            {item.relation}
                          </span>
                          <span className="ml-1.5 font-bold text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md inline-block">
                            ({item.gujarati})
                          </span>
                        </div>
                        {isCurrent ? (
                          <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-text-secondary/70 group-hover:text-primary uppercase tracking-wider">
                            Select
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary font-medium leading-relaxed">
                        {item.meaning}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-text-secondary">
                      <span className="font-semibold">{item.category}</span>
                      <span className="capitalize">{item.gender}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface-secondary/30 flex items-center justify-between text-xs text-text-secondary">
          <span>
            Showing <strong className="text-text">{filteredList.length}</strong> relationships
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface-secondary hover:bg-border text-text font-bold transition-colors cursor-pointer"
          >
            Close / બંધ કરો
          </button>
        </div>
      </div>
    </div>
  )
}
