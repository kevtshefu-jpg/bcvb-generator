import { useState } from 'react'
import { buildManualPrompt } from '../utils/buildManualPrompt'

type ManualChatGptGeneratorProps = {
  generationType: string
  sourceTitle?: string
  sourceContent?: string
  userInstruction?: string
  useBcvbIdentity?: boolean
  useFfbbFrame?: boolean
  useEuropeanTrends?: boolean
  useUsCanadaApproach?: boolean
  useOperationalApproach?: boolean
  onSaveGeneratedContent: (content: string) => Promise<void>
}

export function ManualChatGptGenerator({
  generationType,
  sourceTitle,
  sourceContent,
  userInstruction,
  useBcvbIdentity = true,
  useFfbbFrame = false,
  useEuropeanTrends = false,
  useUsCanadaApproach = false,
  useOperationalApproach = true,
  onSaveGeneratedContent,
}: ManualChatGptGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [chatGptResponse, setChatGptResponse] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function handleBuildPrompt() {
    const nextPrompt = buildManualPrompt({
      generationType,
      sourceTitle,
      sourceContent,
      userInstruction,
      useBcvbIdentity,
      useFfbbFrame,
      useEuropeanTrends,
      useUsCanadaApproach,
      useOperationalApproach,
    })

    setPrompt(nextPrompt)
    setCopied(false)
    setMessage(null)
  }

  async function handleCopyPrompt() {
    if (!prompt.trim()) return

    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setMessage('Prompt copié. Tu peux maintenant le coller dans ChatGPT.')
  }

 async function handleSave() {
  if (!chatGptResponse.trim()) {
    setMessage('Colle d’abord la réponse générée par ChatGPT.')
    return
  }

  try {
    setSaving(true)
    setMessage('Enregistrement en cours...')

    console.log('Clic sur Enregistrer dans la bibliothèque')
    console.log('Longueur réponse ChatGPT :', chatGptResponse.trim().length)

    await onSaveGeneratedContent(chatGptResponse.trim())

    setMessage('✅ Document enregistré dans la bibliothèque BCVB.')
    setChatGptResponse('')
  } catch (error) {
    console.error('Erreur enregistrement manuel ChatGPT :', error)

    const message =
      error instanceof Error
        ? error.message
        : "Erreur inconnue pendant l'enregistrement."

    setMessage(`❌ Impossible d'enregistrer le document : ${message}`)
  } finally {
    setSaving(false)
  }
}

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <p style={styles.kicker}>Mode manuel ChatGPT</p>

        <h2 style={styles.title}>Génération sans crédit API</h2>

        <p style={styles.description}>
          Le site prépare un prompt complet. Tu le copies dans ChatGPT, puis tu
          colles la réponse ici pour l’enregistrer dans la bibliothèque BCVB.
        </p>
      </div>

      <div style={styles.buttonRow}>
        <button
          type="button"
          onClick={handleBuildPrompt}
          style={styles.primaryButton}
        >
          Générer le prompt
        </button>

        <button
          type="button"
          onClick={handleCopyPrompt}
          disabled={!prompt.trim()}
          style={{
            ...styles.secondaryButton,
            opacity: prompt.trim() ? 1 : 0.45,
            cursor: prompt.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          {copied ? 'Prompt copié' : 'Copier le prompt'}
        </button>
      </div>

      <div style={styles.fieldBlock}>
        <label style={styles.label}>Prompt à envoyer dans ChatGPT</label>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={16}
          style={styles.textareaPrompt}
          placeholder="Clique sur “Générer le prompt”."
        />
      </div>

      <div style={styles.fieldBlock}>
        <label style={styles.label}>Réponse générée par ChatGPT</label>

        <textarea
          value={chatGptResponse}
          onChange={(event) => setChatGptResponse(event.target.value)}
          rows={18}
          style={styles.textareaResponse}
          placeholder="Colle ici la réponse complète donnée par ChatGPT."
        />
      </div>

      <div style={styles.saveRow}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            ...styles.saveButton,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? 'wait' : 'pointer',
          }}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer dans la bibliothèque'}
        </button>

        {message && <p style={styles.message}>{message}</p>}
      </div>
    </section>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    width: '100%',
    maxWidth: '980px',
    marginTop: '32px',
    padding: '24px',
    borderRadius: '22px',
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
    boxSizing: 'border-box',
  },

  header: {
    marginBottom: '20px',
  },

  kicker: {
    margin: 0,
    marginBottom: '6px',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#C8102E',
  },

  title: {
    margin: 0,
    fontSize: '24px',
    lineHeight: 1.2,
    fontWeight: 800,
    color: '#111827',
  },

  description: {
    marginTop: '8px',
    marginBottom: 0,
    fontSize: '15px',
    lineHeight: 1.55,
    color: '#4b5563',
  },

  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '22px',
  },

  primaryButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '11px 18px',
    background: '#111827',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },

  secondaryButton: {
    border: '1px solid #d1d5db',
    borderRadius: '14px',
    padding: '11px 18px',
    background: '#ffffff',
    color: '#111827',
    fontSize: '14px',
    fontWeight: 700,
  },

  fieldBlock: {
    display: 'block',
    width: '100%',
    marginTop: '20px',
  },

  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '15px',
    fontWeight: 800,
    color: '#111827',
  },

  textareaPrompt: {
    display: 'block',
    width: '100%',
    minHeight: '320px',
    resize: 'vertical',
    boxSizing: 'border-box',
    borderRadius: '16px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    padding: '14px',
    fontSize: '14px',
    lineHeight: 1.55,
    color: '#111827',
    outline: 'none',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  textareaResponse: {
    display: 'block',
    width: '100%',
    minHeight: '360px',
    resize: 'vertical',
    boxSizing: 'border-box',
    borderRadius: '16px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    padding: '14px',
    fontSize: '14px',
    lineHeight: 1.55,
    color: '#111827',
    outline: 'none',
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  saveRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
    marginTop: '20px',
  },

  saveButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '12px 18px',
    background: '#C8102E',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 800,
  },

  message: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
}