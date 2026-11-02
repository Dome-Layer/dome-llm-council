'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { useT } from '@/lib/i18n'

interface QuestionFormProps {
  onSubmit: (question: string) => void
  isSubmitting: boolean
}

export default function QuestionForm({ onSubmit, isSubmitting }: QuestionFormProps) {
  const t = useT()
  const [question, setQuestion] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || isSubmitting) return
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="card"
        style={{
          padding: 'var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <label htmlFor="question" className="input-label">
          {t.form.label}
        </label>
        <textarea
          id="question"
          className="input"
          placeholder={t.form.placeholder}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={3}
          disabled={isSubmitting}
          style={{ minHeight: 80 }}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !question.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: '1.5px' }} />
                {t.form.submitting}
              </>
            ) : (
              <>
                {t.form.submit}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
