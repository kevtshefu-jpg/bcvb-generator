import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BCVBRichDocumentRenderer } from '../features/documents/components/BCVBRichDocumentRenderer'
import type { LibraryDocumentRow } from '../features/library/services/libraryService'
import { useSafeLoading } from '../hooks/useSafeLoading'
import { withTimeout } from '../utils/withTimeout'
import { PRESENTATION_MODE } from '../config/presentationMode'

export function DocumentReaderPage() {
  const { id } = useParams()
  const [document, setDocument] = useState<LibraryDocumentRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { safeLoading, hasTimedOut } = useSafeLoading(loading, 2500)

  useEffect(() => {
    let active = true

    async function loadDocument() {
      if (!id) {
        setError('Document introuvable.')
        setLoading(false)
        return
      }

	      const { data, error: queryError } = await withTimeout(
	        supabase
	          .from('library_documents')
	          .select('*')
	          .eq('id', id)
	          .single(),
	        12000,
	        'Chargement du document trop long.'
	      )

      if (!active) return

      if (queryError) {
        setError(queryError.message)
        setLoading(false)
        return
      }

      setDocument(data as LibraryDocumentRow)
      setLoading(false)
    }

    loadDocument()

    return () => {
      active = false
    }
  }, [id])

	  if (safeLoading) return <section style={{ padding: 40 }}>Chargement de l’espace BCVB...</section>
	  if (hasTimedOut && PRESENTATION_MODE) {
	    return (
	      <section className="bcvb-demo-fallback">
	        <p className="bcvb-eyebrow">Mode présentation</p>
	        <h2>Document prêt à être affiché</h2>
	        <p>Le chargement distant est temporairement indisponible. Réessaie depuis la bibliothèque ou poursuis la démonstration du Studio éditorial.</p>
	      </section>
	    )
	  }
	  if (error) {
	    return (
	      <section className="bcvb-demo-fallback">
	        <p className="bcvb-eyebrow">Document</p>
	        <h2>Lecture temporairement indisponible</h2>
	        <p>{PRESENTATION_MODE ? 'La ressource sera consultable dès que la connexion aux données répond.' : error}</p>
	      </section>
	    )
	  }
  if (!document?.content) {
    return <section style={{ padding: 40 }}>Ce document ne contient pas de source Markdown lisible.</section>
  }

  return (
    <section style={{ padding: 24 }}>
      <BCVBRichDocumentRenderer content={document.content} document={document} />
    </section>
  )
}
