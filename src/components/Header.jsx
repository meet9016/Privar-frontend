import React, { useContext, useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Search, Sparkles, KeyRound, ChevronDown, User, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { masterLabels, routeTitles } from '../config/navigation'
import GoogleTranslate from './GoogleTranslate'
import GlobalSearch from './GlobalSearch'
import { getUserRoleLabel } from '../lib/roles'
import ThemePicker from './ThemePicker'
import NotificationDropdown from './NotificationDropdown'
import { confirm } from '../lib/confirm'
import api from '../lib/api'
import { toast } from '../lib/toast'

export default function Header() {
  const { logout, user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const roleLabel = user ? getUserRoleLabel(user) : ''

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  
  // Password Form State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [passLoading, setPassLoading] = useState(false)
  const [passError, setPassError] = useState('')

  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setIsDropdownOpen(false)
    const isConfirmed = await confirm('Are you sure you want to logout?', {
      confirmText: 'Yes',
      cancelText: 'Cancel'
    })
    
    if (isConfirmed) {
      logout()
      navigate('/login')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPassError('')

    if (!newPassword) {
      setPassError('Please enter a new password.')
      return
    }

    if (newPassword.length < 5) {
      setPassError('Password must be at least 5 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match! Please check.')
      return
    }

    setPassLoading(true)
    try {
      const res = await api.post('/change-password', {
        new_password: newPassword,
        confirm_password: confirmPassword
      })

      if (res.data?.status === 200 || res.status === 200) {
        toast.success(res.data?.message || 'Password updated successfully!')
        setIsPasswordModalOpen(false)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPassError(res.data?.message || 'Failed to update password.')
      }
    } catch (err) {
      setPassError(err.response?.data?.message || err.message || 'Error updating password.')
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 bg-surface border-b border-border shadow-glass-md backdrop-blur-xl">
        {/* Title block */}
        <div className="flex items-center gap-3">
          <GlobalSearch />
        </div>

        {/* Control bar */}
        <div className="flex items-center gap-4">
          <ThemePicker />
          <NotificationDropdown variant="dark" />

          {/* Vertical divider */}
          <span className="w-px h-6 bg-border"></span>

          {/* Profile Card with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-1.5 pr-2.5 rounded-2xl hover:bg-surface-secondary/70 border border-transparent hover:border-border transition-all duration-200 cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>

              <div className="hidden sm:flex flex-col">
                <div className="text-sm font-bold text-text flex items-center gap-1.5">
                  <span>{user?.name || 'Administrator'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                <div className="text-xs text-primary font-bold flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary/80" />
                  <span>{roleLabel || 'Admin'}</span>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-2xl shadow-xl p-1.5 z-50 animate-slide-up space-y-1">
                {/* User details header on mobile */}
                <div className="px-3 py-2 border-b border-border sm:hidden">
                  <p className="text-xs font-bold text-text truncate">{user?.name || 'Administrator'}</p>
                  <p className="text-[11px] text-text-secondary truncate">{user?.email}</p>
                </div>

                {/* Change Password Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false)
                    setPassError('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setIsPasswordModalOpen(true)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text hover:bg-surface-secondary hover:text-primary transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-primary" />
                  <span>Change Password</span>
                </button>

                <div className="h-px bg-border/60 my-1"></div>

                {/* Sign out */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">Change Password</h3>
                  <p className="text-xs text-text-secondary">Update your admin account password</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="w-8 h-8 rounded-xl text-text-secondary hover:text-text hover:bg-surface-secondary flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 5 chars)"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-input-bg text-text placeholder-text-secondary/40 border border-border focus:border-primary rounded-xl text-sm outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-3 text-text-secondary hover:text-text"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full pl-3.5 pr-10 py-2.5 bg-input-bg text-text placeholder-text-secondary/40 border rounded-xl text-sm outline-none transition-all ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-rose-400 focus:border-rose-500'
                        : confirmPassword && newPassword === confirmPassword
                        ? 'border-emerald-400 focus:border-emerald-500'
                        : 'border-border focus:border-primary'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-3 text-text-secondary hover:text-text"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Error Banner */}
              {passError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-surface-secondary border border-border transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {passLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{passLoading ? 'Saving...' : 'Save Password'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}
