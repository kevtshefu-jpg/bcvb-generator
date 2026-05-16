import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import RequireAuth from '../features/auth/components/RequireAuth'

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

// CLUB
import ClubPage from '../features/club/pages/ClubPage'
import PilotagePage from '../features/club/pages/PilotagePage'

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

// ADMIN
import AdminPage from '../features/admin/pages/AdminPage'
import PlatformPage from '../features/admin/pages/PlatformPage'
import UnlockManagementPage from '../features/admin/pages/UnlockManagementPage'
import AdminRegistrationRequestsPage from '../features/registration/pages/AdminRegistrationRequestsPage'

// IMPORT
import ImportBatchValidationPage from '../features/import/pages/ImportBatchValidationPage'
import ImportCenterPage from '../features/import/pages/ImportCenterPage'
import ImportPlayersPage from '../features/import/pages/ImportPlayersPage'

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

  {
    path: 'test-ia',
    element: <AdminAIDocumentsPage />,
  },

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
          { path: 'generateur', element: <GeneratorRoutePage /> },
          { path: 'seances', element: <SessionsPage /> },
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
      // ADMIN + COACH + DIRIGEANT
      // =========================
      {
        element: <RequireAuth allowedRoles={['admin', 'coach', 'dirigeant']} />,
        children: [
          { path: 'admin/inscriptions', element: <AdminRegistrationRequestsPage /> },
        ],
      },

      // =========================
      // COACH + ADMIN
      // =========================
      {
        element: <RequireAuth allowedRoles={['admin', 'coach']} />,
        children: [
          { path: 'coach/joueurs/:id/progression', element: <CoachJoueurProgressionPage /> },
        ],
      },

      // =========================
      // ADMIN + DIRIGEANT
      // =========================
      {
        element: <RequireAuth allowedRoles={['admin', 'dirigeant']} />,
        children: [
          { path: 'club/pilotage', element: <PilotagePage /> },
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
          { path: 'admin/import-joueurs', element: <ImportPlayersPage /> },
          { path: 'admin/import-export', element: <ImportCenterPage /> },
          { path: 'admin/import-validation/:batchId', element: <ImportBatchValidationPage /> },

          // 🔥 IA DOCUMENTAIRE
          { path: 'admin/ia-documentaire', element: <AdminAIDocumentsPage /> },
        ],
      },
    ],
  },
])