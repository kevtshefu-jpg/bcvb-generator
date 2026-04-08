import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import RequireAuth from '../features/auth/components/RequireAuth'

import HomePage from '../features/referentiel/pages/HomePage'
import LoginPage from '../features/auth/components/LoginPage'
import DashboardPage from '../features/dashboard/pages/DashboardPage'

import { CategoriesPage } from '../features/referentiel/pages/CategoriesPage'
import { CategoryDetailPage } from '../features/referentiel/pages/CategoryDetailPage'
import { ThemesPage } from '../features/referentiel/pages/ThemesPage'
import { SituationsLibraryPage } from '../features/referentiel/pages/SituationsLibraryPage'
import { SituationDetailPage } from '../features/referentiel/pages/SituationDetailPage'

import AdminPage from '../features/admin/pages/AdminPage'
import PlatformPage from '../features/admin/pages/PlatformPage'
import UnlockManagementPage from '../features/admin/pages/UnlockManagementPage'

import ClubPage from '../features/club/pages/ClubPage'
import PilotagePage from '../features/club/pages/PilotagePage'

import LibraryPage from '../features/library/pages/LibraryPage'
import GeneratorRoutePage from '../features/generator/pages/GeneratorRoutePage'
import SessionsPage from '../features/sessions/pages/SessionsPage'

import JoueurContenusPage from '../features/joueur/pages/JoueurContenusPage'
import JoueurChartePage from '../features/joueur/pages/JoueurChartePage'
import JoueurEngagementPage from '../features/joueur/pages/JoueurEngagementPage'
import JoueurFondamentauxPage from '../features/joueur/pages/JoueurFondamentauxPage'
import JoueurProgressionPage from '../features/joueur/pages/JoueurProgressionPage'

import ParentChartePage from '../features/parent/pages/ParentChartePage'
import ParentVieClubPage from '../features/parent/pages/ParentVieClubPage'
import ParentRolesPage from '../features/parent/pages/ParentRolesPage'
import ParentReferentPage from '../features/parent/pages/ParentReferentPage'
import ParentProjetClubPage from '../features/parent/pages/ParentProjetClubPage'

import CoachJoueurProgressionPage from '../features/coach/pages/CoachJoueurProgressionPage'

import RegistrationPage from '../features/registration/pages/RegistrationPage'
import AdminRegistrationRequestsPage from '../features/registration/pages/AdminRegistrationRequestsPage'

import ImportBatchValidationPage from '../features/import/pages/ImportBatchValidationPage'
import ImportCenterPage from '../features/import/pages/ImportCenterPage'
import ImportPlayersPage from '../features/import/pages/ImportPlayersPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'connexion',
        element: <LoginPage />,
      },
      {
        path: 'inscription',
        element: <RegistrationPage />,
      },

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
            path: 'generateur',
            element: <GeneratorRoutePage />,
          },
          {
            path: 'seances',
            element: <SessionsPage />,
          },
          {
            path: 'club',
            element: <ClubPage />,
          },

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

      {
        element: <RequireAuth allowedRoles={['admin', 'coach', 'dirigeant']} />,
        children: [
          {
            path: 'admin/inscriptions',
            element: <AdminRegistrationRequestsPage />,
          },
        ],
      },

      {
        element: <RequireAuth allowedRoles={['admin', 'coach']} />,
        children: [
          {
            path: 'coach/joueurs/:id/progression',
            element: <CoachJoueurProgressionPage />,
          },
        ],
      },

      {
        element: <RequireAuth allowedRoles={['admin', 'dirigeant']} />,
        children: [
          {
            path: 'club/pilotage',
            element: <PilotagePage />,
          },
        ],
      },

      {
        element: <RequireAuth allowedRoles={['admin']} />,
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
            element: <ImportPlayersPage />,
          },
          {
            path: 'admin/import-export',
            element: <ImportCenterPage />,
          },
          {
            path: 'admin/import-validation/:batchId',
            element: <ImportBatchValidationPage />,
          },
        ],
      },
    ],
  },
])