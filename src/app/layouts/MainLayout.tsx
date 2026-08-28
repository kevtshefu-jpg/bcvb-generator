import { Outlet } from 'react-router-dom'

import '../../styles/tokens.css'
import '../../styles/base.css'
import '../../styles/layout.css'
import '../../styles/referentiel.css'
import '../../styles/mobile-premium.css'
import '../../styles/mobile-components.css'

import { Sidebar } from '../../components/navigation/Sidebar'
import { TopBar } from '../../components/navigation/TopBar'
import MobileNavigation from '../../components/navigation/MobileNavigation'
import { ExperienceProvider, useExperience } from '../../features/ux/context/ExperienceContext'

function ExperienceLayout() {
  const { mode, textSize } = useExperience()

  return (
    <div className={`public-shell app-shell app-shell--with-mobile-navigation experience--${mode} text-size--${textSize}`}>
      <a className="skip-link" href="#main-content">Aller directement au contenu</a>
      <MobileNavigation />

      <Sidebar />

      <main className="public-main main-content" id="main-content" tabIndex={-1}>
        <div className="public-content">
          <TopBar />
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export function MainLayout() {
  return (
    <ExperienceProvider>
      <ExperienceLayout />
    </ExperienceProvider>
  )
}

export default MainLayout
