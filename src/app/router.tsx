import { Navigate, createBrowserRouter } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import HomePage from '../features/referentiel/pages/HomePage'
import LoginPage from '../features/auth/components/LoginPage'
import RequireAuth from '../features/auth/components/RequireAuth'
import DashboardPage from '../features/dashboard/pages/DashboardPage'
import LibraryHubPage from '../features/library/pages/LibraryHubPage'
import ClubHubPage from '../features/club/pages/ClubHubPage'
import AdminPage from '../features/admin/pages/AdminPage'
import { CategoriesPage } from '../features/referentiel/pages/CategoriesPage'
import { CategoryDetailPage } from '../features/referentiel/pages/CategoryDetailPage'
import { ThemesPage } from '../features/referentiel/pages/ThemesPage'
import { ThemeDetailPage } from '../features/referentiel/pages/ThemeDetailPage'
import { SituationsLibraryPage } from '../features/referentiel/pages/SituationsLibraryPage'
import { SituationDetailPage } from '../features/referentiel/pages/SituationDetailPage'
import { GeneratorPage } from '../features/generator/components/GeneratorPage'
import { SessionBuilderPage } from '../features/sessions/components/SessionBuilderPage'
import AccessDeniedPage from '../features/shared/pages/AccessDeniedPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'connexion', element: <LoginPage /> },
      { path: 'acces-refuse', element: <AccessDeniedPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'espace', element: <Navigate to="/dashboard" replace /> },
          { path: 'bibliotheque', element: <LibraryHubPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'categories/:categoryId', element: <CategoryDetailPage /> },
          { path: 'themes', element: <ThemesPage /> },
          { path: 'themes/:themeId', element: <ThemeDetailPage /> },
          { path: 'situations', element: <SituationsLibraryPage /> },
          { path: 'situations/:situationId', element: <SituationDetailPage /> },
          { path: 'generateur', element: <GeneratorPage /> },
          { path: 'seances', element: <SessionBuilderPage /> },
        ],
      },
      {
        element: <RequireAuth allowedRoles={['admin', 'dirigeant']} />,
        children: [{ path: 'club', element: <ClubHubPage /> }],
      },
      {
        element: <RequireAuth allowedRoles={['admin']} />,
        children: [{ path: 'admin', element: <AdminPage /> }],
      },
    ],
  },
])
