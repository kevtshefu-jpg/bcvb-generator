import BasketDiagram from '../../../components/basket/BasketDiagram'
import { generateAIDocument } from '../services/generateAIDocument'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  fetchAIExpertModes,
  type AIExpertModeRow,
} from '../services/aiExpertModesService'
import {
  fetchLibraryDocuments,
  type LibraryDocumentRow,
} from '../../library/services/libraryService'
import { fetchAIResults } from '../services/aiResultsService'
import { useAuth } from '../../auth/context/AuthContext'
import { createAIGenerationRequest } from '../services/aiGenerationRequestService'
import { ManualChatGptGenerator } from '../../../components/ManualChatGptGenerator'
import { saveManualGeneratedDocument } from '../../../services/manualGeneratedDocuments'

export default function AdminAIDocumentsPage() {
  const { user } = useAuth()

  const [modes, setModes] = useState<AIExpertModeRow[]>([])
  const [documents, setDocuments] = useState<LibraryDocumentRow[]>([])
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [selectedModes, setSelectedModes] = useState<string[]>([])
  const [selectedGenerationType, setSelectedGenerationType] = useState('theme_content')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])

  async function loadData() {
    const modesData = await fetchAIExpertModes()
    const docsData = await fetchLibraryDocuments()
    const resultsData = await fetchAIResults()

    setModes(modesData)
    setDocuments(docsData)
    setResults(resultsData)

    setSelectedModes(
      modesData.filter((mode) => mode.is_default).map((mode) => mode.mode_key)
    )
  }

  useEffect(() => {
    loadData().catch((error) => {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Erreur lors du chargement du module IA.'
      )
    })
  }, [])

  function toggleDoc(id: string) {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  function toggleMode(key: string) {
    setSelectedModes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  async function handlePrepareRequest() {
    try {
      setSuccessMessage(null)
      setErrorMessage(null)

      if (selectedDocs.length === 0) return

      const optionsJson = selectedModes.reduce<Record<string, boolean>>((acc, key) => {
        acc[key] = true
        return acc
      }, {})

      const request = await createAIGenerationRequest({
        document_id: selectedDocs[0],
        requested_by: user?.id ?? null,
        generation_type: selectedGenerationType,
        target_audience: 'coach',
        options_json: optionsJson,
      })

      await generateAIDocument(request.id)
      await loadData()

      setSuccessMessage('Demande IA préparée et génération lancée.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Erreur lors de la génération IA.'
      )
    }
  }

  return (
    <section style={{ padding: 40 }}>
      <h1>IA documentaire BCVB</h1>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

      <h2>Type de génération</h2>

      <select
        value={selectedGenerationType}
        onChange={(e) => setSelectedGenerationType(e.target.value)}
      >
        <option value="theme_content">Fiche thème</option>
        <option value="category_content">Fiche catégorie</option>
        <option value="situation">Fiche situation</option>
        <option value="session_outline">Trame de séance</option>
        <option value="coach_note">Note coach</option>
        <option value="parent_resource">Ressource parent</option>
        <option value="diagram_description">Description de schéma</option>
        <option value="diagram_structured_data">Schéma structuré</option>
      </select>

      <h2 style={{ marginTop: 40 }}>Modes experts</h2>

      {modes.map((mode) => (
        <label key={mode.id} style={{ display: 'block', marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={selectedModes.includes(mode.mode_key)}
            onChange={() => toggleMode(mode.mode_key)}
          />{' '}
          <strong>{mode.label}</strong>
          <p>{mode.description}</p>
        </label>
      ))}

      <h2 style={{ marginTop: 40 }}>Documents source</h2>

      {documents.map((doc) => (
        <div key={doc.id} style={{ marginBottom: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={selectedDocs.includes(doc.id)}
              onChange={() => toggleDoc(doc.id)}
            />{' '}
            {doc.title}
          </label>
        </div>
      ))}

      <button
        className="bcvb-primary-btn"
        style={{ marginTop: 24 }}
        disabled={selectedDocs.length === 0}
        onClick={handlePrepareRequest}
      >
        Préparer la demande IA
      </button>

      <h2 style={{ marginTop: 40 }}>Résultats IA</h2>

      {results.length === 0 && <p>Aucun contenu généré pour le moment.</p>}

      {results.map((result) => {
  let parsed = null

  try {
    parsed = JSON.parse(result.content)
  } catch {
    parsed = null
  }

  return (
    <div
      key={result.id}
      style={{
        border: '1px solid #ddd',
        padding: 16,
        marginBottom: 16,
        borderRadius: 8,
        background: '#fff',
      }}
    >
      <p>
        <strong>Statut :</strong> {result.status}
      </p>

      {parsed?.players ? (
        <BasketDiagram data={parsed} />
      ) : (
        <pre style={{ whiteSpace: 'pre-wrap' }}>{result.content}</pre>
      )}
    </div>
  )
})}
      {/* Générateur manuel ChatGPT (mode vierge) */}
      <div style={{ width: '100%', maxWidth: '980px', marginTop: '32px' }}>
  <ManualChatGptGenerator
    generationType="Document technique BCVB"
    sourceTitle="Génération manuelle"
    sourceContent=""
    userInstruction=""
    useBcvbIdentity={true}
    useFfbbFrame={false}
    useEuropeanTrends={false}
    useUsCanadaApproach={false}
    useOperationalApproach={true}
    onSaveGeneratedContent={async (content) => {
      await saveManualGeneratedDocument({
        title: 'Document généré manuellement avec ChatGPT',
        content,
        category: 'Document généré',
        subcategory: 'Mode manuel ChatGPT',
        sourceDocumentId: null,
        generationType: 'manual_chatgpt',
      })
    }}
  />
</div>
    </section>
  )
}