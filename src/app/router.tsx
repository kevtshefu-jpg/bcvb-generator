import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import RequireAuth from '../features/auth/components/RequireAuth'
import { RequireRole } from '../components/auth/RequireRole'

// PUBLIC
import HomePage from '../features/referentiel/pages/HomePage'
import LoginPage from '../features/auth/components/LoginPage'
import RegistrationPage from '../features/registration/pages/RegistrationPage'
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage'

// GLOBAL AUTH
import DashboardPage from '../features/dashboard/pages/DashboardPage'

// REFERENTIEL
import { CategoriesPage } from '../features/referentiel/pages/CategoriesPage'
import { CategoryDetailPage } from '../features/referentiel/pages/CategoryDetailPage'
import { ThemesPage } from '../features/referentiel/pages/ThemesPage'
import { SituationsLibraryPage } from '../features/referentiel/pages/SituationsLibraryPage'
import { SituationDetailPage } from '../features/referentiel/pages/SituationDetailPage'

// LIBRARY / GENERATOR / SESSIONS
import LibraryPage from '../features/library/pages/LibraryPage'
import GeneratorRoutePage from '../features/generator/pages/GeneratorRoutePage'
import SessionsPage from '../features/sessions/pages/SessionsPage'
import { DocumentReaderPage } from '../pages/DocumentReaderPage'
import DebugLocal from '../pages/DebugLocal'
import CommissionDemoPage from '../pages/CommissionDemoPage'
import ModulePlaceholder from '../components/ModulePlaceholder'
import FAQPage from '../pages/FAQPage'
import ContentCreatorTutorial from '../pages/tutorials/ContentCreatorTutorial'
import PlatformTutorial from '../pages/tutorials/PlatformTutorial'
import RosterImportPage from '../pages/RosterImportPage'
import PlanningBuilderPage from '../pages/PlanningBuilderPage'
import SessionBuilderPage from '../pages/SessionBuilderPage'
import SessionLibraryPage from '../modules/sessions/SessionLibraryPage'
import SituationLibraryPage from '../modules/sessions/SituationLibraryPage'
import AttendancePage from '../pages/AttendancePage'
import PlayerEvaluationPage from '../pages/PlayerEvaluationPage'
import EditorialStudioPage from '../pages/EditorialStudioPage'
import EditorialRoadmapPage from '../pages/EditorialRoadmapPage'
import CreateDocumentPage from '../features/document-creation/pages/CreateDocumentPage'
import TeamsManagementPage from '../features/modules/pages/TeamsManagementPage'
import TeamProfilePage from '../components/teams/TeamProfilePage'
import DirigeantsSpacePage from '../features/modules/pages/DirigeantsSpacePage'
import ParentReferentsSpacePage from '../features/modules/pages/ParentReferentsSpacePage'
import AdminSettingsPage from '../features/modules/pages/AdminSettingsPage'
import AdminOcrAttachmentsPage from '../features/modules/pages/AdminOcrAttachmentsPage'
import QualityExportsPage from '../features/modules/pages/QualityExportsPage'
import AdminSessionManager from '../modules/admin/AdminSessionManager'
import AdminSituationManager from '../modules/admin/AdminSituationManager'

// CLUB
import ClubPage from '../features/club/pages/ClubPage'
import PilotagePage from '../features/club/pages/PilotagePage'
import ClubDashboardPage from '../pages/club/ClubDashboardPage'
import ClubTeamsPage from '../pages/club/ClubTeamsPage'
import ClubIndicatorsPage from '../pages/club/ClubIndicatorsPage'
import ClubCoachFollowUpPage from '../pages/club/ClubCoachFollowUpPage'

// JOUEUR
import JoueurContenusPage from '../features/joueur/pages/JoueurContenusPage'
import JoueurChartePage from '../features/joueur/pages/JoueurChartePage'
import JoueurEngagementPage from '../features/joueur/pages/JoueurEngagementPage'
import JoueurFondamentauxPage from '../features/joueur/pages/JoueurFondamentauxPage'
import JoueurProgressionPage from '../features/joueur/pages/JoueurProgressionPage'

// PARENT
import ParentChartePage from '../features/parent/pages/ParentChartePage'
import ParentVieClubPage from '../features/parent/pages/ParentVieClubPage'
import ParentRolesPage from '../features/parent/pages/ParentRolesPage'
import ParentReferentPage from '../features/parent/pages/ParentReferentPage'
import ParentProjetClubPage from '../features/parent/pages/ParentProjetClubPage'

// COACH
import CoachJoueurProgressionPage from '../features/coach/pages/CoachJoueurProgressionPage'
import CoachDashboardPage from '../pages/coach/CoachDashboardPage'
import CoachTeamsPage from '../pages/coach/CoachTeamsPage'
import CoachPlayersPage from '../pages/coach/CoachPlayersPage'

// ADMIN
import AdminPage from '../features/admin/pages/AdminPage'
import PlatformPage from '../features/admin/pages/PlatformPage'
import UnlockManagementPage from '../features/admin/pages/UnlockManagementPage'
import AdminRegistrationRequestsPage from '../features/registration/pages/AdminRegistrationRequestsPage'

// IMPORT
import ImportBatchValidationPage from '../features/import/pages/ImportBatchValidationPage'
import ImportCenterPage from '../features/import/pages/ImportCenterPage'

// 🔥 IA DOCUMENTAIRE
import AdminAIDocumentsPage from '../features/admin/pages/AdminAIDocumentsPage'
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // =========================
      // PUBLIC
      // =========================
  { index: true, element: <HomePage /> },

		  { path: 'debug-local', element: <DebugLocal /> },
		  { path: 'demo-commission', element: <CommissionDemoPage /> },

  { path: 'connexion', element: <LoginPage /> },
      { path: 'inscription', element: <RegistrationPage /> },
      { path: 'mot-de-passe-oublie', element: <ForgotPasswordPage /> },
      { path: 'reinitialisation-mot-de-passe', element: <ResetPasswordPage /> },

      // =========================
      // AUTHENTIFIÉ (TOUS)
      // =========================
      {
        element: <RequireAuth />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'categories/:categoryId', element: <CategoryDetailPage /> },
          { path: 'themes', element: <ThemesPage /> },
          { path: 'situations', element: <SituationsLibraryPage /> },
          { path: 'situations/:situationId', element: <SituationDetailPage /> },
          { path: 'bibliotheque', element: <LibraryPage /> },
          { path: 'library/:id', element: <DocumentReaderPage /> },
          { path: 'documents/:id', element: <DocumentReaderPage /> },
          { path: 'generateur', element: <GeneratorRoutePage /> },
          { path: 'seances', element: <SessionsPage /> },
          { path: 'faq', element: <FAQPage /> },
          { path: 'tutoriels', element: <PlatformTutorial /> },
          { path: 'tutoriels/plateforme', element: <PlatformTutorial /> },
          { path: 'tutoriels/createur-document', element: <ContentCreatorTutorial /> },
          { path: 'documents-utiles', element: <LibraryPage /> },
          { path: 'logistique', element: <ModulePlaceholder title="Informations logistiques" /> },
          { path: 'club', element: <ClubPage /> },

          // JOUEUR
          { path: 'joueur/contenus', element: <JoueurContenusPage /> },
          { path: 'joueur/fondamentaux', element: <JoueurFondamentauxPage /> },
          { path: 'joueur/progression', element: <JoueurProgressionPage /> },
          { path: 'joueur/charte', element: <JoueurChartePage /> },
          { path: 'joueur/engagement', element: <JoueurEngagementPage /> },

          // PARENT
          { path: 'parent/charte', element: <ParentChartePage /> },
          { path: 'parent/vie-club', element: <ParentVieClubPage /> },
          { path: 'parent/roles', element: <ParentRolesPage /> },
          { path: 'parent/referent', element: <ParentReferentPage /> },
          { path: 'parent/projet-club', element: <ParentProjetClubPage /> },
        ],
      },

      // =========================
	      // ADMIN
	      // =========================
	      {
	        element: <RequireAuth allowedRoles={['admin']} />,
	        children: [
	          { path: 'admin/inscriptions', element: <AdminRegistrationRequestsPage /> },
	        ],
      },

      // =========================
      // COACH + ADMIN
      // =========================
	      {
	        element: <RequireAuth allowedRoles={['admin', 'coach', 'responsable_technique']} />,
	        children: [
	          { path: 'coach', element: <CoachDashboardPage /> },
	          { path: 'coach/equipes', element: <CoachTeamsPage /> },
	          { path: 'coach/equipes/:teamId', element: <TeamProfilePage /> },
	          { path: 'coach/joueurs', element: <CoachPlayersPage /> },
	          { path: 'coach/seances', element: <SessionBuilderPage /> },
	          { path: 'coach/seances/bibliotheque', element: <SessionLibraryPage /> },
	          { path: 'coach/situations/bibliotheque', element: <SituationLibraryPage /> },
	          { path: 'coach/planifications', element: <PlanningBuilderPage /> },
	          { path: 'coach/presences', element: <AttendancePage /> },
	          { path: 'coach/evaluations', element: <PlayerEvaluationPage /> },
	          { path: 'effectifs', element: <RosterImportPage /> },
	          { path: 'effectifs/import', element: <RosterImportPage /> },
	          { path: 'planning', element: <PlanningBuilderPage /> },
	          { path: 'presences', element: <AttendancePage /> },
	          { path: 'evaluations', element: <PlayerEvaluationPage /> },
	          { path: 'seances/bibliotheque', element: <SessionLibraryPage /> },
	          { path: 'situations/bibliotheque', element: <SituationLibraryPage /> },
	          { path: 'coach/joueurs/:id/progression', element: <CoachJoueurProgressionPage /> },
	        ],
	      },

	      // =========================
	      // STAFF ÉQUIPE
	      // =========================
	      {
	        element: <RequireAuth allowedRoles={['admin', 'coach', 'responsable_technique', 'team_staff', 'parent_referent']} />,
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
	          { path: 'parents-referents', element: <ParentReferentsSpacePage /> },
	          { path: 'parents-referents/presences', element: <AttendancePage /> },
	          { path: 'parents-referents/effectifs', element: <RosterImportPage /> },
	          { path: 'parents-referents/equipes', element: <TeamsManagementPage /> },
	          { path: 'parents-referents/equipes/:teamId', element: <TeamProfilePage /> },
	          { path: 'parents-referents/planifications', element: <PlanningBuilderPage readOnly /> },
	        ],
	      },

      // =========================
      // ADMIN + COACH
      // =========================
	      {
	        element: <RequireAuth allowedRoles={['admin', 'coach', 'responsable_technique']} />,
	        children: [
	          { path: 'planifications', element: <PlanningBuilderPage /> },
	          { path: 'equipes', element: <TeamsManagementPage /> },
	          { path: 'equipes/:teamId', element: <TeamProfilePage /> },
	        ],
	      },

      // =========================
      // ADMIN + DIRIGEANT
      // =========================
	      {
	        element: <RequireAuth allowedRoles={['admin', 'dirigeant', 'responsable_technique']} />,
	        children: [
	          { path: 'club/tableau-de-bord', element: <ClubDashboardPage /> },
	          { path: 'club/equipes', element: <ClubTeamsPage /> },
	          { path: 'club/equipes/:teamId', element: <TeamProfilePage /> },
	          { path: 'club/indicateurs', element: <ClubIndicatorsPage /> },
	          { path: 'club/suivi-coachs', element: <ClubCoachFollowUpPage /> },
	          { path: 'club/effectifs', element: <RosterImportPage /> },
	          { path: 'club/evaluations', element: <PlayerEvaluationPage /> },
	          { path: 'club/planifications', element: <PlanningBuilderPage readOnly /> },
	          { path: 'club/pilotage', element: <PilotagePage /> },
	          { path: 'dirigeants', element: <DirigeantsSpacePage /> },
	          { path: 'documents-club', element: <LibraryPage /> },
	        ],
	      },

      // =========================
      // ADMIN UNIQUEMENT
      // =========================
      {
        element: <RequireAuth allowedRoles={['admin']} />,
        children: [
          { path: 'admin', element: <AdminPage /> },
          { path: 'admin/plateforme', element: <PlatformPage /> },
          { path: 'admin/deblocages', element: <UnlockManagementPage /> },
          { path: 'admin/import-joueurs', element: <RosterImportPage /> },
          { path: 'seances/nouveau', element: <SessionBuilderPage /> },
          { path: 'admin/import-export', element: <ImportCenterPage /> },
          { path: 'admin/import-validation/:batchId', element: <ImportBatchValidationPage /> },

	          // 🔥 IA DOCUMENTAIRE
	          { path: 'admin/ia-documentaire', element: <AdminAIDocumentsPage /> },
	          { path: 'admin/studio-editorial', element: <EditorialStudioPage /> },
	          { path: 'admin/documents/nouveau', element: <CreateDocumentPage /> },
	          { path: 'admin/documents/transformer', element: <EditorialStudioPage /> },
	          { path: 'admin/controle-qualite', element: <EditorialStudioPage /> },
	          { path: 'admin/roadmap-documentaire', element: <EditorialRoadmapPage /> },
	          { path: 'admin/qualite-exports', element: <QualityExportsPage /> },
	          { path: 'admin/ocr-pieces-jointes', element: <AdminOcrAttachmentsPage /> },
	          { path: 'admin/gestion-seances', element: <AdminSessionManager /> },
	          { path: 'admin/gestion-situations', element: <AdminSituationManager /> },
	          { path: 'admin/utilisateurs', element: <AdminPage /> },
	          { path: 'parametres', element: <AdminSettingsPage /> },
	        ],
	      },
	      { path: '*', element: <ModulePlaceholder /> },
    ],
  },
])
