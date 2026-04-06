import { JoueurContenusPage, JoueurChartePage, JoueurEngagementPage } from '../features/joueur/pages'
import { ParentChartePage, ParentVieClubPage, ParentRolesPage, ParentReferentPage, ParentProjetClubPage } from '../features/parent/pages'
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

import ClubPage from '../features/club/pages/ClubPage'
import PilotagePage from '../features/club/pages/PilotagePage'

import LibraryPage from '../features/library/pages/LibraryPage'
import GeneratorRoutePage from '../features/generator/pages/GeneratorRoutePage'
import SessionsPage from '../features/sessions/pages/SessionsPage'

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
         // Joueur pages
         {
           path: 'joueur/charte',
           element: <JoueurChartePage />,
         },
         {
           path: 'joueur/engagement',
           element: <JoueurEngagementPage />,
         },
         {
           path: 'joueur/contenus',
           element: <JoueurContenusPage />,
         },
         // Parent pages
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
        ],
      },
    ],
  },
])