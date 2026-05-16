import { useEffect, useState } from 'react'
import {
  fetchLibraryDocuments,
  createLibraryDocumentSignedUrl,
  type LibraryDocumentRow,
} from '../services/libraryService'

function formatDocumentType(value: string) {
  if (value === 'pdf') return 'PDF'
  if (value === 'docx') return 'Word'
  if (value === 'image') return 'Image'
  return value
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function openLibraryDocument(document: any) {
  if (document.content && document.content.trim().length > 0) {
    const newWindow = window.open('', '_blank')

    if (!newWindow) {
      alert('Impossible d’ouvrir le document. Vérifie que les pop-ups ne sont pas bloqués.')
      return
    }

    newWindow.document.write(`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(document.title || 'Document BCVB')}</title>
          <style>
            body {
              margin: 0;
              background: #f4f4f5;
              font-family: Arial, sans-serif;
              color: #111827;
            }
            .page {
              max-width: 900px;
              margin: 32px auto;
              background: white;
              padding: 40px;
              border-radius: 18px;
              box-shadow: 0 16px 40px rgba(0,0,0,0.08);
            }
            .kicker {
              color: #C8102E;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: .08em;
              font-size: 12px;
              margin-bottom: 8px;
            }
            h1 {
              margin: 0 0 24px;
              font-size: 30px;
              line-height: 1.2;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: Arial, sans-serif;
              font-size: 15px;
              line-height: 1.65;
            }
          </style>
        </head>
        <body>
          <main class="page">
            <div class="kicker">BCVB Référentiel</div>
            <h1>${escapeHtml(document.title || 'Document BCVB')}</h1>
            <pre>${escapeHtml(document.content)}</pre>
          </main>
        </body>
      </html>
    `)

    newWindow.document.close()
    return
  }

  alert('Ce document ne contient pas de contenu texte intégré.')
}

export default function LibraryPage() {
  const [documents, setDocuments] = useState<LibraryDocumentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const rows = await fetchLibraryDocuments()

        if (active) {
          setDocuments(rows)
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Erreur lors du chargement de la bibliothèque.'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  async function handleOpenDocument(doc: LibraryDocumentRow) {
  try {
    setError(null)
    setOpeningId(doc.id)

    if (doc.content && doc.content.trim().length > 0) {
      openLibraryDocument(doc)
      return
    }

    if (!doc.bucket_name || !doc.storage_path) {
      throw new Error(
        "Ce document ne contient ni contenu texte intégré, ni fichier associé."
      )
    }

    const signedUrl = await createLibraryDocumentSignedUrl(
      doc.bucket_name,
      doc.storage_path
    )

    window.open(signedUrl, '_blank', 'noopener,noreferrer')
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Impossible d’ouvrir le document."
    )
  } finally {
    setOpeningId(null)
  }
}

  return (
    <section className="library-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Bibliothèque BCVB</p>
          <h2 className="dashboard-page__title">Documents du club</h2>
          <p className="dashboard-page__text">
            Retrouvez ici les ressources, documents cadres, fichiers techniques et supports du club.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Documents actifs</span>
          <strong>{documents.length}</strong>
        </div>
      </div>

      {loading && <p>Chargement de la bibliothèque...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && documents.length === 0 && (
        <article className="dashboard-panelCard">
          <h3 className="dashboard-panelCard__title">Bibliothèque vide</h3>
          <p className="dashboard-panelCard__text">
            Aucun document actif n’est encore enregistré dans la bibliothèque.
          </p>
        </article>
      )}

      <div className="dashboard-page__grid">
        {documents.map((doc) => (
          <article className="dashboard-actionCard" key={doc.id}>
            <p className="dashboard-page__eyebrow">{formatDocumentType(doc.document_type)}</p>

            <h3 className="dashboard-actionCard__title">{doc.title}</h3>

            <p className="dashboard-actionCard__text">
              <strong>Description :</strong> {doc.description || '—'}
            </p>

            <p className="dashboard-actionCard__text">
              <strong>Audience :</strong> {doc.audience}
            </p>

            <p className="dashboard-actionCard__text">
              <strong>Saison :</strong> {doc.season || '—'}
            </p>

            <p className="dashboard-actionCard__text">
              <strong>Catégorie :</strong> {doc.category_code || '—'}
            </p>

            <p className="dashboard-actionCard__text">
              <strong>Thème :</strong> {doc.theme_code || '—'}
            </p>

            <p className="dashboard-actionCard__text">
              <strong>Fichier :</strong> {doc.storage_path}
            </p>

            {doc.content && (
              <details style={{ marginTop: '12px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                  Voir le contenu
                </summary>

                <pre style={{
                  marginTop: '12px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '14px',
                  lineHeight: 1.55,
                  background: '#f9fafb',
                  padding: '14px',
                  borderRadius: '12px',
                }}>
                  {doc.content}
                </pre>
              </details>
            )}

            <div style={{ marginTop: 16 }}>
              <button
                type="button"

  onClick={() => handleOpenDocument(doc)}

  disabled={openingId === doc.id}

>

  {openingId === doc.id ? 'Ouverture...' : 'Ouvrir le document'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}