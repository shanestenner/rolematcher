import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    // Validate email domain
    const emailLower = email.toLowerCase()
    const isValidDomain = emailLower.endsWith('@vumc.org')

    if (!isValidDomain) {
      setMessage({ 
        type: 'error', 
        text: 'Only vumc.org email addresses are allowed.' 
      })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setShowOtpInput(true)
      setMessage({ 
        type: 'success', 
        text: 'Check your email for the 8-digit login code!' 
      })
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    }
    // If successful, the auth state will change and redirect automatically
    setLoading(false)
  }

  const handleBackToEmail = () => {
    setShowOtpInput(false)
    setOtpCode('')
    setMessage({ type: '', text: '' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              VUSM RoleMatcher
            </h1>
            <p className="text-slate-500 text-sm">
              AI Strategy for Medical Education
            </p>
          </div>

          {!showOtpInput ? (
            // Step 1: Email input
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@vumc.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Login Code'}
              </button>
            </form>
          ) : (
            // Step 2: OTP code input
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-700 mb-1">
                  Enter 8-Digit Code
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Sent to {email}
                </p>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="00000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 8}
                className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={handleBackToEmail}
                className="w-full px-4 py-2 text-slate-600 hover:text-slate-900 transition-all text-sm"
              >
                ← Use a different email
              </button>
            </form>
          )}

          {message.text && (
            <div className={`mt-4 p-4 rounded-xl text-sm ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message.text}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            {!showOtpInput 
              ? <>You must use a vumc.org email address to access this tool.<br />An 8-digit login code will be sent to your email.</>
              : <>The code expires in 1 hour.<br />Check spam if you don't see it.</>
            }
          </p>
        </div>
      </div>
    </div>
  )
}
