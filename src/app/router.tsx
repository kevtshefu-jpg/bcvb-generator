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
import PilotagePage from '../features/club/pages/PilotagePage'

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