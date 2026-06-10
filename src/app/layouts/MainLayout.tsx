import { Outlet } from 'react-router-dom'

import '../../styles/tokens.css'
import '../../styles/base.css'
import '../../styles/layout.css'
import '../../styles/referentiel.css'
import '../../styles/mobile-premium.css'

import { Sidebar } from '../../components/navigation/Sidebar'
import { TopBar } from '../../components/navigation/TopBar'
import MobileNavigation from '../../components/navigation/MobileNavigation'

export function MainLayout() {
  return (
    <div className="public-shell app-shell app-shell--with-mobile-navigation">
      <MobileNavigation />

      <Sidebar />

      <main className="public-main main-content" id="main-content">
        <div className="public-content">
          <TopBar />
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout