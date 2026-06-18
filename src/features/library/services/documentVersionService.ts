export type LibraryDocumentVersion = {
  id: string
  documentId: string
  version: number
  title?: string | null
  content?: string | null
  sourceMarkdown?: string | null
  qualityScore?: number | null
  parentDocumentId?: string | null
  createdFromDocumentId?: string | null
  isLatestVersion: boolean
  changeLog: string[]
  createdAt: string
  createdBy?: string | null
}

export type CreateDocumentVersionPayload = {
  documentId: string
  title?: string | null
  content?: string | null
  sourceMarkdown?: string | null
  qualityScore?: number | null
  parentDocumentId?: string | null
  createdFromDocumentId?: string | null
  changeLog?: string[]
  createdBy?: string | null
}

const VERSION_STORAGE_KEY = 'bcvb:library-document-versions'

function canUseLocalStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function createVersionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `library-version-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

function assertDocumentId(documentId: string) {
  if (!documentId?.trim()) {
    throw new Error('Versionnage impossible : identifiant document manquant.')
  }
}

function readStoredVersions(): LibraryDocumentVersion[] {
  if (!canUseLocalStorage()) return []

  try {
    const raw = window.localStorage.getItem(VERSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LibraryDocumentVersion[]) : []
  } catch {
    return []
  }
}

function writeStoredVersions(versions: LibraryDocumentVersion[]) {
  if (!canUseLocalStorage()) {
    throw new Error(
      'Versionnage local indisponible dans cet environnement. TODO SQL : brancher une table document_versions côté Supabase.',
    )
  }

  window.localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions))
}

function sortVersions(versions: LibraryDocumentVersion[]) {
  return [...versions].sort((a, b) => {
    if (a.isLatestVersion !== b.isLatestVersion) return a.isLatestVersion ? -1 : 1
    return b.version - a.version
  })
}

export async function fetchDocumentVersions(documentId: string): Promise<LibraryDocumentVersion[]> {
  assertDocumentId(documentId)

  return sortVersions(
    readStoredVersions().filter((version) => version.documentId === documentId),
  )
}

export async function createDocumentVersion(
  payload: CreateDocumentVersionPayload,
): Promise<LibraryDocumentVersion> {
  assertDocumentId(payload.documentId)

  const storedVersions = readStoredVersions()
  const documentVersions = storedVersions.filter(
    (version) => version.documentId === payload.documentId,
  )
  const nextVersion = Math.max(0, ...documentVersions.map((version) => version.version)) + 1

  const version: LibraryDocumentVersion = {
    id: createVersionId(),
    documentId: payload.documentId,
    version: nextVersion,
    title: payload.title ?? null,
    content: payload.content ?? null,
    sourceMarkdown: payload.sourceMarkdown ?? payload.content ?? null,
    qualityScore: payload.qualityScore ?? null,
    parentDocumentId:
      payload.parentDocumentId ??
      documentVersions.find((candidate) => candidate.isLatestVersion)?.id ??
      null,
    createdFromDocumentId: payload.createdFromDocumentId ?? null,
    isLatestVersion: true,
    changeLog: payload.changeLog ?? ['Version créée depuis la bibliothèque BCVB.'],
    createdAt: new Date().toISOString(),
    createdBy: payload.createdBy ?? null,
  }

  writeStoredVersions([
    version,
    ...storedVersions.map((storedVersion) =>
      storedVersion.documentId === payload.documentId
        ? { ...storedVersion, isLatestVersion: false }
        : storedVersion,
    ),
  ])

  return version
}

export async function markVersionAsLatest(
  documentId: string,
  versionId: string,
): Promise<LibraryDocumentVersion[]> {
  assertDocumentId(documentId)

  const storedVersions = readStoredVersions()
  const target = storedVersions.find(
    (version) => version.documentId === documentId && version.id === versionId,
  )

  if (!target) {
    throw new Error('Version introuvable : impossible de la marquer comme version actuelle.')
  }

  const nextVersions = storedVersions.map((version) =>
    version.documentId === documentId
      ? { ...version, isLatestVersion: version.id === versionId }
      : version,
  )

  writeStoredVersions(nextVersions)
  return sortVersions(nextVersions.filter((version) => version.documentId === documentId))
}

export async function restoreDocumentVersion(
  documentId: string,
  versionId: string,
): Promise<LibraryDocumentVersion> {
  assertDocumentId(documentId)

  const versionToRestore = readStoredVersions().find(
    (version) => version.documentId === documentId && version.id === versionId,
  )

  if (!versionToRestore) {
    throw new Error('Version introuvable : restauration impossible.')
  }

  return createDocumentVersion({
    documentId,
    title: versionToRestore.title,
    content: versionToRestore.content,
    sourceMarkdown: versionToRestore.sourceMarkdown,
    qualityScore: versionToRestore.qualityScore,
    parentDocumentId: versionToRestore.id,
    createdFromDocumentId: versionToRestore.createdFromDocumentId ?? documentId,
    changeLog: [`Restauration de la version ${versionToRestore.version}.`],
    createdBy: versionToRestore.createdBy,
  })
}

