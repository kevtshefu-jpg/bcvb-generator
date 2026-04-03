import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { HomePage } from "../features/referentiel/pages/HomePage";
import { CategoriesPage } from "../features/referentiel/pages/CategoriesPage";
import { CategoryDetailPage } from "../features/referentiel/pages/CategoryDetailPage";
import { ThemesPage } from "../features/referentiel/pages/ThemesPage";
import { ThemeDetailPage } from "../features/referentiel/pages/ThemeDetailPage";
import { SituationsLibraryPage } from "../features/referentiel/pages/SituationsLibraryPage";
import { SituationDetailPage } from "../features/referentiel/pages/SituationDetailPage";
import { GeneratorPage } from "../features/generator/components/GeneratorPage";
import { SessionBuilderPage } from "../features/sessions/components/SessionBuilderPage";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <MainLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "categories", element: <CategoriesPage /> },
        { path: "categories/:categoryId", element: <CategoryDetailPage /> },
        { path: "themes", element: <ThemesPage /> },
        { path: "themes/:themeId", element: <ThemeDetailPage /> },
        { path: "situations", element: <SituationsLibraryPage /> },
        { path: "situations/:situationId", element: <SituationDetailPage /> },
        { path: "generateur", element: <GeneratorPage /> },
        { path: "seances", element: <SessionBuilderPage /> }
      ]
    }
  ],
  {
    basename: "/tools/generator/"
  }
);