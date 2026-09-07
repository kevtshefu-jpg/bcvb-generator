import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy } from 'react'

import { MainLayout } from './layouts/MainLayout'

import RequireAuth from '../features/auth/components/RequireAuth'
import { RequireRole } from '../components/auth/RequireRole'
import { areInternalRoutesEnabled } from '../config/internalRoutes'

// =========================
// PUBLIC
// =========================
import HomePage from '../features/referentiel/pages/HomePage'
import LoginPage from '../features/auth/components/LoginPage'
import RegistrationPage from '../features/registration/pages/RegistrationPage'
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage'

// =========================
// GLOBAL AUTH
// =========================
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'))

// =========================
// REFERENTIEL
// =========================
const CategoriesPage = lazy(() => import('../features/referentiel/pages/CategoriesPage').then((module) => ({ default: module.CategoriesPage })))
const CategoryDetailPage = lazy(() => import('../features/referentiel/pages/CategoryDetailPage').then((module) => ({ default: module.CategoryDetailPage })))
const ThemesPage = lazy(() => import('../features/referentiel/pages/ThemesPage').then((module) => ({ default: module.ThemesPage })))
const SituationsLibraryPage = lazy(() => import('../features/referentiel/pages/SituationsLibraryPage').then((module) => ({ default: module.SituationsLibraryPage })))
const SituationDetailPage = lazy(() => import('../features/referentiel/pages/SituationDetailPage').then((module) => ({ default: module.SituationDetailPage })))

// =========================
// LIBRARY / GENERATOR / SESSIONS
// =========================
const LibraryPage = lazy(() => import('../features/library/pages/LibraryPage'))
const GeneratorRoutePage = lazy(() => import('../features/generator/pages/GeneratorRoutePage'))
const SessionsPage = lazy(() => import('../features/sessions/pages/SessionsPage'))
const DocumentReaderPage = lazy(() => import('../pages/DocumentReaderPage').then((module) => ({ default: module.DocumentReaderPage })))
import ModulePlaceholder from '../components/ModulePlaceholder'
import NotFoundPage from '../pages/NotFoundPage'
const FAQPage = lazy(() => import('../pages/FAQPage'))
const ContentCreatorTutorial = lazy(() => import('../pages/tutorials/ContentCreatorTutorial'))
const PlatformTutorial = lazy(() => import('../pages/tutorials/PlatformTutorial'))
const RosterImportPage = lazy(() => import('../pages/RosterImportPage'))
const PlanningBuilderPage = lazy(() => import('../pages/PlanningBuilderPage'))
const OperationalPlanningPage = lazy(() => import('../features/operational-planning/OperationalPlanningPage'))
const SessionBuilderPage = lazy(() => import('../pages/SessionBuilderPage'))
const SessionLibraryPage = lazy(() => import('../modules/sessions/SessionLibraryPage'))
const SituationLibraryPage = lazy(() => import('../modules/sessions/SituationLibraryPage'))
const AttendancePage = lazy(() => import('../pages/AttendancePage'))
const PlayerEvaluationPage = lazy(() => import('../pages/PlayerEvaluationPage'))
const EditorialStudioPage = lazy(() => import('../pages/EditorialStudioPage'))
const EditorialRoadmapPage = lazy(() => import('../pages/EditorialRoadmapPage'))
const CreateDocumentPage = lazy(() => import('../features/document-creation/pages/CreateDocumentPage'))
const TeamsManagementPage = lazy(() => import('../features/modules/pages/TeamsManagementPage'))
const TeamProfilePage = lazy(() => import('../components/teams/TeamProfilePage'))
const DirigeantsSpacePage = lazy(() => import('../features/modules/pages/DirigeantsSpacePage'))
const ParentReferentsSpacePage = lazy(() => import('../features/modules/pages/ParentReferentsSpacePage'))
const AdminSettingsPage = lazy(() => import('../features/modules/pages/AdminSettingsPage'))
const AdminOcrAttachmentsPage = lazy(() => import('../features/modules/pages/AdminOcrAttachmentsPage'))
const QualityExportsPage = lazy(() => import('../features/modules/pages/QualityExportsPage'))
const AdminSessionManager = lazy(() => import('../modules/admin/AdminSessionManager'))
const AdminSituationManager = lazy(() => import('../modules/admin/AdminSituationManager'))

// =========================
// CLUB
// =========================
const ClubPage = lazy(() => import('../features/club/pages/ClubPage'))
const PilotagePage = lazy(() => import('../features/club/pages/PilotagePage'))
const ClubDashboardPage = lazy(() => import('../pages/club/ClubDashboardPage'))
const ClubTeamsPage = lazy(() => import('../pages/club/ClubTeamsPage'))
const ClubIndicatorsPage = lazy(() => import('../pages/club/ClubIndicatorsPage'))
const ClubCoachFollowUpPage = lazy(() => import('../pages/club/ClubCoachFollowUpPage'))

// =========================
// JOUEUR
// =========================
const JoueurContenusPage = lazy(() => import('../features/joueur/pages/JoueurContenusPage'))
const JoueurChartePage = lazy(() => import('../features/joueur/pages/JoueurChartePage'))
const JoueurEngagementPage = lazy(() => import('../features/joueur/pages/JoueurEngagementPage'))
const JoueurFondamentauxPage = lazy(() => import('../features/joueur/pages/JoueurFondamentauxPage'))
const JoueurProgressionPage = lazy(() => import('../features/joueur/pages/JoueurProgressionPage'))

// =========================
// PARENT
// =========================
const ParentChartePage = lazy(() => import('../features/parent/pages/ParentChartePage'))
const ParentVieClubPage = lazy(() => import('../features/parent/pages/ParentVieClubPage'))
const ParentRolesPage = lazy(() => import('../features/parent/pages/ParentRolesPage'))
const ParentReferentPage = lazy(() => import('../features/parent/pages/ParentReferentPage'))
const ParentProjetClubPage = lazy(() => import('../features/parent/pages/ParentProjetClubPage'))

// =========================
// COACH
// =========================
const CoachJoueurProgressionPage = lazy(() => import('../features/coach/pages/CoachJoueurProgressionPage'))
const CoachDashboardPage = lazy(() => import('../pages/coach/CoachDashboardPage'))
const CoachTeamsPage = lazy(() => import('../pages/coach/CoachTeamsPage'))
const CoachPlayersPage = lazy(() => import('../pages/coach/CoachPlayersPage'))

// =========================
// ADMIN
// =========================
const AdminPage = lazy(() => import('../features/admin/pages/AdminPage'))
const PlatformPage = lazy(() => import('../features/admin/pages/PlatformPage'))
const UnlockManagementPage = lazy(() => import('../features/admin/pages/UnlockManagementPage'))
const AdminRegistrationRequestsPage = lazy(() => import('../features/registration/pages/AdminRegistrationRequestsPage'))
const AdminProfileRequestsPage = lazy(() => import('../features/admin/pages/AdminProfileRequestsPage'))
const AdminProfilesPage = lazy(() => import('../features/admin/pages/AdminProfilesPage'))
import {
  MEMBER_MANAGEMENT_LEGACY_ROUTES,
  MEMBER_MANAGEMENT_PATH,
  MEMBER_MANAGEMENT_ROUTE,
} from '../features/admin/memberManagementRoute'
const AdminAIDocumentsPage = lazy(() => import('../features/admin/pages/AdminAIDocumentsPage'))

// =========================
// IMPORT
// =========================
const ImportBatchValidationPage = lazy(() => import('../features/import/pages/ImportBatchValidationPage'))
const ImportCenterPage = lazy(() => import('../features/import/pages/ImportCenterPage'))

const internalRoutesEnabled = areInternalRoutesEnabled({
  isDev: import.meta.env.DEV,
  enabledFlag: import.meta.env.VITE_ENABLE_INTERNAL_ROUTES,
})

const internalRoutes = internalRoutesEnabled
  ? [
      {
        path: 'debug-local',
        element: (() => {
          const DebugLocal = lazy(() => import('../pages/DebugLocal'))
          return <DebugLocal />
        })(),
      },
      {
        path: 'demo-commission',
        element: (() => {
          const CommissionDemoPage = lazy(() => import('../pages/CommissionDemoPage'))
          return <CommissionDemoPage />
        })(),
      },
    ]
  : []

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // =========================
      // PUBLIC
      // =========================
      {
        index: true,
        element: <HomePage />,
      },
      ...internalRoutes,
      {
        path: 'connexion',
        element: <LoginPage />,
      },
      {
        path: 'inscription',
        element: <RegistrationPage />,
      },
      {
        path: 'mot-de-passe-oublie',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reinitialisation-mot-de-passe',
        element: <ResetPasswordPage />,
      },

      // =========================
      // AUTHENTIFIÉ — TOUS LES PROFILS CONNECTÉS
      // =========================
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'categories',
            element: <CategoriesPage />,
          },
          {
            path: 'categories/:categoryId',
            element: <CategoryDetailPage />,
          },
          {
            path: 'themes',
            element: <ThemesPage />,
          },
          {
            path: 'situations',
            element: <SituationsLibraryPage />,
          },
          {
            path: 'situations/:situationId',
            element: <SituationDetailPage />,
          },
          {
            path: 'bibliotheque',
            element: <LibraryPage />,
          },
          {
            path: 'library/:id',
            element: <DocumentReaderPage />,
          },
          {
            path: 'documents/:id',
            element: <DocumentReaderPage />,
          },
          {
            path: 'generateur',
            element: <GeneratorRoutePage />,
          },
          {
            path: 'seances',
            element: <SessionsPage />,
          },
          {
            path: 'faq',
            element: <FAQPage />,
          },
          {
            path: 'tutoriels',
            element: <PlatformTutorial />,
          },
          {
            path: 'tutoriels/plateforme',
            element: <PlatformTutorial />,
          },
          {
            path: 'tutoriels/createur-document',
            element: <ContentCreatorTutorial />,
          },
          {
            path: 'documents-utiles',
            element: <LibraryPage />,
          },
          {
            path: 'logistique',
            element: <ModulePlaceholder title="Informations logistiques" />,
          },
          {
            path: 'club',
            element: <ClubPage />,
          },
          {
            path: 'effectifs',
            element: <RosterImportPage />,
          },
          {
            path: 'effectifs/import',
            element: <Navigate to="/effectifs" replace />,
          },

          // =========================
          // JOUEUR
          // =========================
          {
            path: 'joueur/contenus',
            element: <JoueurContenusPage />,
          },
          {
            path: 'joueur/fondamentaux',
            element: <JoueurFondamentauxPage />,
          },
          {
            path: 'joueur/progression',
            element: <JoueurProgressionPage />,
          },
          {
            path: 'joueur/charte',
            element: <JoueurChartePage />,
          },
          {
            path: 'joueur/engagement',
            element: <JoueurEngagementPage />,
          },

          // =========================
          // PARENT
          // =========================
          {
            path: 'parent/charte',
            element: <ParentChartePage />,
          },
          {
            path: 'parent/vie-club',
            element: <ParentVieClubPage />,
          },
          {
            path: 'parent/roles',
            element: <ParentRolesPage />,
          },
          {
            path: 'parent/referent',
            element: <ParentReferentPage />,
          },
          {
            path: 'parent/projet-club',
            element: <ParentProjetClubPage />,
          },
        ],
      },

      // =========================
      // ADMIN — DEMANDES ET INSCRIPTIONS
      // =========================
      {
        element: (
          <RequireAuth allowedRoles={['admin', 'responsable_technique']} />
        ),
        children: [
          {
            path: 'admin/inscriptions',
            element: <AdminRegistrationRequestsPage />,
          },
          {
            path: 'admin/demandes-profils',
            element: <AdminProfileRequestsPage />,
          },
        ],
      },

      // Gestion globale des membres : administrateur strict uniquement.
      {
        element: <RequireAuth allowedRoles={['admin']} />,
        children: [
          {
            path: MEMBER_MANAGEMENT_ROUTE,
            element: <AdminProfilesPage />,
          },
          ...MEMBER_MANAGEMENT_LEGACY_ROUTES.map((path) => ({
            path,
            element: <Navigate to={MEMBER_MANAGEMENT_PATH} replace />,
          })),
        ],
      },

      // =========================
      // COACH + ADMIN + RESPONSABLE TECHNIQUE
      // =========================
      {
        element: (
          <RequireAuth allowedRoles={['admin', 'coach', 'responsable_technique']} />
        ),
        children: [
          {
            path: 'coach',
            element: <CoachDashboardPage />,
          },
          {
            path: 'coach/equipes',
            element: <CoachTeamsPage />,
          },
          {
            path: 'coach/equipes/:teamId',
            element: <TeamProfilePage />,
          },
          {
            path: 'coach/joueurs',
            element: <CoachPlayersPage />,
          },
          {
            path: 'coach/seances',
            element: <SessionBuilderPage />,
          },
          {
            path: 'coach/seances/bibliotheque',
            element: <SessionLibraryPage />,
          },
          {
            path: 'coach/situations/bibliotheque',
            element: <SituationLibraryPage />,
          },
          {
            path: 'coach/planifications',
            element: <PlanningBuilderPage />,
          },
          {
            path: 'coach/presences',
            element: <AttendancePage />,
          },
          {
            path: 'coach/evaluations',
            element: <PlayerEvaluationPage />,
          },
          {
            path: 'coach/joueurs/:id/progression',
            element: <CoachJoueurProgressionPage />,
          },

          // Alias historiques / raccourcis
          {
            path: 'presences',
            element: <AttendancePage />,
          },
          {
            path: 'evaluations',
            element: <PlayerEvaluationPage />,
          },
          {
            path: 'seances/bibliotheque',
            element: <SessionLibraryPage />,
          },
          {
            path: 'situations/bibliotheque',
            element: <SituationLibraryPage />,
          },
        ],
      },

      // Planning opérationnel partagé, distinct de la planification sportive.
      {
        element: <RequireAuth allowedRoles={['admin', 'responsable_technique', 'dirigeant', 'coach', 'team_staff', 'parent_referent']} />,
        children: [{ path: 'planning', element: <OperationalPlanningPage /> }],
      },

      // =========================
      // STAFF ÉQUIPE / PARENT RÉFÉRENT
      // =========================
      {
        element: (
          <RequireAuth
            allowedRoles={[
              'admin',
              'coach',
              'responsable_technique',
              'team_staff',
              'parent_referent',
            ]}
          />
        ),
        children: [
          {
            path: 'equipe',
            element: (
              <RequireRole allow="team_staff">
                <ParentReferentsSpacePage />
              </RequireRole>
            ),
          },
          {
            path: 'equipe/presences',
            element: (
              <RequireRole allow="team_staff">
                <AttendancePage />
              </RequireRole>
            ),
          },
          {
            path: 'equipe/communication',
            element: (
              <RequireRole allow="team_staff">
                <CoachTeamsPage />
              </RequireRole>
            ),
          },
          {
            path: 'equipe/communication/:teamId',
            element: (
              <RequireRole allow="team_staff">
                <TeamProfilePage />
              </RequireRole>
            ),
          },
          {
            path: 'parents-referents',
            element: <ParentReferentsSpacePage />,
          },
          {
            path: 'parents-referents/presences',
            element: <AttendancePage />,
          },
          {
            path: 'parents-referents/effectifs',
            element: <Navigate to="/effectifs" replace />,
          },
          {
            path: 'parents-referents/equipes',
            element: <TeamsManagementPage />,
          },
          {
            path: 'parents-referents/equipes/:teamId',
            element: <TeamProfilePage />,
          },
          {
            path: 'parents-referents/planifications',
            element: <PlanningBuilderPage readOnly />,
          },
        ],
      },

      // =========================
      // ADMIN + COACH — MODULES SPORTIFS TRANSVERSAUX
      // =========================
      {
        element: (
          <RequireAuth allowedRoles={['admin', 'coach', 'responsable_technique']} />
        ),
        children: [
          {
            path: 'planifications',
            element: <PlanningBuilderPage />,
          },
          {
            path: 'equipes',
            element: <TeamsManagementPage />,
          },
          {
            path: 'equipes/:teamId',
            element: <TeamProfilePage />,
          },
        ],
      },

      // =========================
      // ADMIN + DIRIGEANT
      // =========================
      {
        element: (
          <RequireAuth allowedRoles={['admin', 'dirigeant', 'responsable_technique']} />
        ),
        children: [
          {
            path: 'club/tableau-de-bord',
            element: <ClubDashboardPage />,
          },
          {
            path: 'club/equipes',
            element: <ClubTeamsPage />,
          },
          {
            path: 'club/equipes/:teamId',
            element: <TeamProfilePage />,
          },
          {
            path: 'club/indicateurs',
            element: <ClubIndicatorsPage />,
          },
          {
            path: 'club/suivi-coachs',
            element: <ClubCoachFollowUpPage />,
          },
          {
            path: 'club/effectifs',
            element: <Navigate to="/effectifs" replace />,
          },
          {
            path: 'club/evaluations',
            element: <PlayerEvaluationPage />,
          },
          {
            path: 'club/planifications',
            element: <PlanningBuilderPage readOnly />,
          },
          {
            path: 'club/pilotage',
            element: <PilotagePage />,
          },
          {
            path: 'dirigeants',
            element: <DirigeantsSpacePage />,
          },
          {
            path: 'documents-club',
            element: <LibraryPage />,
          },
        ],
      },

      // =========================
      // Admin uniquement — paramétrage, données et studio documentaire
      // =========================
      {
        element: <RequireAuth allowedRoles={['admin', 'responsable_technique']} />,
        children: [
          {
            path: 'admin',
            element: <AdminPage />,
          },
          {
            path: 'admin/plateforme',
            element: <PlatformPage />,
          },
          {
            path: 'admin/deblocages',
            element: <UnlockManagementPage />,
          },
          {
            path: 'admin/import-joueurs',
            element: <Navigate to="/effectifs" replace />,
          },
          {
            path: 'seances/nouveau',
            element: <SessionBuilderPage />,
          },
          {
            path: 'admin/import-export',
            element: <ImportCenterPage />,
          },
          {
            path: 'admin/import-validation/:batchId',
            element: <ImportBatchValidationPage />,
          },

          // Studio documentaire admin
          {
            path: 'admin/ia-documentaire',
            element: <AdminAIDocumentsPage />,
          },
          {
            path: 'admin/studio-editorial',
            element: <EditorialStudioPage />,
          },
          {
            path: 'admin/documents/nouveau',
            element: <CreateDocumentPage />,
          },
          {
            path: 'admin/documents/transformer',
            element: <EditorialStudioPage />,
          },
          {
            path: 'admin/controle-qualite',
            element: <EditorialStudioPage />,
          },
          {
            path: 'admin/roadmap-documentaire',
            element: <EditorialRoadmapPage />,
          },
          {
            path: 'admin/qualite-exports',
            element: <QualityExportsPage />,
          },
          {
            path: 'admin/ocr-pieces-jointes',
            element: <AdminOcrAttachmentsPage />,
          },
          {
            path: 'admin/gestion-seances',
            element: <AdminSessionManager />,
          },
          {
            path: 'admin/gestion-situations',
            element: <AdminSituationManager />,
          },
          {
            path: 'parametres',
            element: <AdminSettingsPage />,
          },
        ],
      },

      // =========================
      // FALLBACK
      // =========================
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
