import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  X,
  Mail,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Calendar,
  AlertCircle,
  Send,
} from 'lucide-react'
import { interactionService } from '../../services/api'

export default function FollowUpDraftModal({
  isOpen,
  onClose,
  interactionId,
  doctorName: initialDoctorName,
}) {
  const [activeTab, setActiveTab] = useState('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState(null)
  const [copiedSection, setCopiedSection] = useState(null)

  const fetchDraft = useCallback(async () => {
    if (!interactionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await interactionService.draftFollowUp(interactionId)
      setDraft(res.data)
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Failed to generate follow-up draft'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [interactionId])

  useEffect(() => {
    if (isOpen && interactionId) {
      // If we don't have draft or if interaction changed, fetch fresh draft
      fetchDraft()
    } else if (!isOpen) {
      // Reset transient error when modal closes
      setError(null)
    }
  }, [isOpen, interactionId, fetchDraft])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null

  const doctorDisplayName =
    draft?.doctor_name || initialDoctorName || 'Doctor'
  const modalTitle = `AI-Generated Follow-Up for Dr. ${doctorDisplayName.replace(/^Dr\.?\s*/i, '')}`

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(label)
      toast.success(`${label} copied to clipboard!`)
      setTimeout(() => setCopiedSection(null), 2500)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleCopyFullEmail = () => {
    if (!draft) return
    const fullText = `Subject: ${draft.email_subject}\n\n${draft.email_body}`
    copyToClipboard(fullText, 'Email')
  }

  const handleOpenEmailClient = () => {
    if (!draft) return
    const subject = encodeURIComponent(draft.email_subject || '')
    const body = encodeURIComponent(draft.email_body || '')
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleOpenWhatsApp = () => {
    if (!draft) return
    const encoded = encodeURIComponent(draft.whatsapp_text || '')
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!loading) onClose()
          }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-primary-50/50 via-white to-white dark:from-primary-950/20 dark:via-gray-900 dark:to-gray-900">
            <div className="space-y-1 pr-6">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300">
                  <Sparkles size={18} />
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {modalTitle}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1 font-medium text-primary-600 dark:text-primary-400">
                  AI Communication Drafter
                </span>
                {draft?.followup_date && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    <Calendar size={12} /> Target: {draft.followup_date}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0 disabled:opacity-40"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="px-5 pt-3 pb-1 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'email'
                    ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm border border-gray-200/80 dark:border-gray-700'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/60'
                }`}
              >
                <Mail size={16} />
                Formal Email
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('whatsapp')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'whatsapp'
                    ? 'bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 shadow-sm border border-gray-200/80 dark:border-gray-700'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/60 dark:hover:bg-gray-800/60'
                }`}
              >
                <MessageSquare size={16} />
                Quick WhatsApp
              </button>
            </div>
          </div>

          {/* Modal Body Content */}
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <RefreshCw
                  size={32}
                  className="animate-spin text-primary-600 dark:text-primary-400"
                />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generating professional follow-up drafts with AI...
                </p>
                <p className="text-xs text-gray-400">
                  Synthesizing doctor notes, products discussed, and scheduled follow-ups
                </p>
              </div>
            ) : error ? (
              <div className="p-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 space-y-3">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle size={18} />
                  <span>Could not generate follow-up</span>
                </div>
                <p className="text-xs leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={fetchDraft}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  <RefreshCw size={13} />
                  Retry Generation
                </button>
              </div>
            ) : draft ? (
              <>
                {activeTab === 'email' ? (
                  <div className="space-y-4">
                    {/* Subject Line */}
                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Subject Line
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(draft.email_subject, 'Subject')}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                        >
                          {copiedSection === 'Subject' ? (
                            <>
                              <Check size={12} className="text-green-500" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy Subject
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {draft.email_subject}
                      </p>
                    </div>

                    {/* Email Body */}
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Email Body
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(draft.email_body, 'Email body')}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                        >
                          {copiedSection === 'Email body' ? (
                            <>
                              <Check size={12} className="text-green-500" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy Body
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-sans max-h-72 overflow-y-auto pr-1">
                        {draft.email_body}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* WhatsApp Message */}
                    <div className="p-4 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-200/80 dark:border-green-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider flex items-center gap-1">
                          <MessageSquare size={13} /> WhatsApp Message
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(draft.whatsapp_text, 'WhatsApp message')}
                          className="text-xs text-green-700 dark:text-green-400 hover:underline flex items-center gap-1"
                        >
                          {copiedSection === 'WhatsApp message' ? (
                            <>
                              <Check size={12} className="text-green-500" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy Message
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3.5 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed shadow-sm border border-green-100 dark:border-green-900/40">
                        {draft.whatsapp_text}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-lg flex items-center gap-1.5">
                  <Sparkles size={12} className="shrink-0 text-primary-500" />
                  <span>
                    Medical drafts are generated strictly from interaction records. Always review before sending.
                  </span>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary text-sm px-4 py-2"
            >
              Close
            </button>

            {draft && !loading && (
              <div className="flex items-center gap-2">
                {activeTab === 'email' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyFullEmail}
                      className="btn-secondary text-sm px-3.5 py-2 flex items-center gap-1.5"
                    >
                      {copiedSection === 'Email' ? (
                        <>
                          <Check size={15} className="text-green-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={15} /> Copy Email
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenEmailClient}
                      className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink size={15} />
                      Open in Mail App
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(draft.whatsapp_text, 'WhatsApp message')
                      }
                      className="btn-secondary text-sm px-3.5 py-2 flex items-center gap-1.5"
                    >
                      {copiedSection === 'WhatsApp message' ? (
                        <>
                          <Check size={15} className="text-green-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={15} /> Copy Message
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenWhatsApp}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Send size={15} />
                      Send via WhatsApp
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
