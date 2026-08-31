import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Briefcase, UserCog, Loader2, X } from 'lucide-react';
import { getUsersList, getBusinessesList, getCommitteeMembersList, getCommunitySurname } from '../lib/api';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], businesses: [], committee: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults({ users: [], businesses: [], committee: [] });
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setIsOpen(true);
      try {
        const [usersRes, businessRes, committeeRes] = await Promise.allSettled([
          getUsersList({ search: query, limit: 5 }),
          getBusinessesList({ search: query, limit: 5 }),
          getCommitteeMembersList({ search: query, limit: 5 })
        ]);

        setResults({
          users: usersRes.status === 'fulfilled' ? (usersRes.value.data?.data || []) : [],
          businesses: businessRes.status === 'fulfilled' ? (businessRes.value.data?.data || []) : [],
          committee: committeeRes.status === 'fulfilled' ? (committeeRes.value.data?.data || []) : []
        });
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (type, item) => {
    setIsOpen(false);
    setQuery('');
    
    // Pass the full item object to open the modal on the target page
    if (type === 'user') navigate(`/admin/users`, { state: { editItem: item } });
    else if (type === 'business') navigate(`/admin/businesses`, { state: { editItem: item } });
    else if (type === 'committee') navigate(`/admin/committee`, { state: { editItem: item } });
  };

  const totalResults = results.users.length + results.businesses.length + results.committee.length;

  return (
    <div className="relative group hidden md:block" ref={dropdownRef}>
      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary transition-colors">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
      </span>
      <input
        type="text"
        placeholder="Global Search (Name, Contact...)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim() && totalResults > 0) setIsOpen(true);
        }}
        className={`w-80 md:w-[480px] lg:w-[600px] bg-input-bg text-text placeholder-text-secondary/50 border border-primary focus:border-primary-dark rounded-xl py-2.5 pl-10 ${query ? 'pr-9' : 'pr-4'} text-sm leading-tight outline-none focus:ring-4 focus:ring-primary/20 focus:shadow-glow-primary transition-all duration-300`}
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setIsOpen(false);
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary/60 hover:text-text cursor-pointer transition-colors"
          title="Clear search"
        >
          <div className="w-4 h-4 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-border/60 transition-colors">
            <X className="w-2.5 h-2.5" />
          </div>
        </button>
      )}

      {isOpen && (query.trim().length > 0) && (
        <div className="absolute top-full left-0 mt-2 w-full bg-surface border border-border rounded-xl shadow-glass-lg overflow-hidden z-50 max-h-96 flex flex-col">
          {isLoading && totalResults === 0 ? (
            <div className="p-4 text-center text-sm text-text-secondary">Searching...</div>
          ) : totalResults === 0 ? (
            <div className="p-4 text-center text-sm text-text-secondary">No results found for "{query}"</div>
          ) : (
            <div className="overflow-y-auto p-2 space-y-3">
              {results.users.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-xs font-semibold tracking-wider text-text-secondary uppercase">Members</div>
                  {results.users.map(u => (
                    <div key={u.id || u._id} onClick={() => handleResultClick('user', u)} className="flex items-center gap-3 p-2 hover:bg-surface-secondary rounded-lg cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {u.image ? <img src={u.image} className="w-full h-full rounded-full object-cover" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text truncate">{u.first_name} {getCommunitySurname()}</div>
                        <div className="text-xs text-text-secondary truncate">{u.number}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.committee.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-xs font-semibold tracking-wider text-text-secondary uppercase">Committee</div>
                  {results.committee.map(c => (
                    <div key={c.id || c._id} onClick={() => handleResultClick('committee', c)} className="flex items-center gap-3 p-2 hover:bg-surface-secondary rounded-lg cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {c.image ? <img src={c.image} className="w-full h-full rounded-full object-cover" /> : <UserCog className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text truncate">{c.first_name} {getCommunitySurname()}</div>
                        <div className="text-xs text-text-secondary truncate">{c.designation || 'Member'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.businesses.length > 0 && (
                <div>
                  <div className="px-2 pb-1 text-xs font-semibold tracking-wider text-text-secondary uppercase">Businesses</div>
                  {results.businesses.map(b => (
                    <div key={b.id || b._id} onClick={() => handleResultClick('business', b)} className="flex items-center gap-3 p-2 hover:bg-surface-secondary rounded-lg cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {b.image ? <img src={b.image} className="w-full h-full rounded-full object-cover" /> : <Briefcase className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-text truncate">{b.business_name}</div>
                        <div className="text-xs text-text-secondary truncate">{b.address || b.city || ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
