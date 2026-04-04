import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { MemberLayout } from "./layouts/MemberLayout";
import { HomePage } from "../features/referentiel/pages/HomePage";
import { CategoriesPage } from "../features/referentiel/pages/CategoriesPage";
import { CategoryDetailPage } from "../features/referentiel/pages/CategoryDetailPage";
import { ThemesPage } from "../features/referentiel/pages/ThemesPage";
import { ThemeDetailPage } from "../features/referentiel/pages/ThemeDetailPage";
import { SituationsLibraryPage } from "../features/referentiel/pages/SituationsLibraryPage";
import { SituationDetailPage } from "../features/referentiel/pages/SituationDetailPage";
import { GeneratorPage } from "../features/generator/components/GeneratorPage";
import { SessionBuilderPage } from "../features/sessions/components/SessionBuilderPage";
import { LoginPage } from "../features/auth/components/LoginPage";
import { RequireAuth } from "../features/auth/components/RequireAuth";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { LibraryHubPage } from "../features/library/pages/LibraryHubPage";
import { ClubHubPage } from "../features/club/pages/ClubHubPage";
import { AdminPage } from "../features/admin/pages/AdminPage";

const basename = import.meta.env.VITE_APP_BASENAME || "/";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "connexion", element: <LoginPage /> },
        { path: "categories", element: <CategoriesPage /> },
        { path: "categories/:categoryId", element: <CategoryDetailPage /> },
        { path: "themes", element: <ThemesPage /> },
        { path: "themes/:themeId", element: <ThemeDetailPage /> },
        { path: "situations", element: <SituationsLibraryPage /> },
        { path: "situations/:situationId", element: <SituationDetailPage /> }
      ]
    },
    {
      element: <RequireAuth />,
      children: [
        {
          path: "/",
          element: <MemberLayout />,
          children: [
            { path: "espace", element: <DashboardPage /> },
            { path: "generateur", element: <GeneratorPage /> },
            { path: "seances", element: <SessionBuilderPage /> },
            { path: "bibliotheque", element: <LibraryHubPage /> },
            { path: "club", element: <ClubHubPage /> }
          ]
        }
      ]
    },
    {
      element: <RequireAuth roles={["admin", "dirigeant"]} />,
      children: [
        {
          path: "/",
          element: <MemberLayout />,
          children: [{ path: "admin", element: <AdminPage /> }]
        }
      ]
    }
  ],
  {
    basename
  }
);
