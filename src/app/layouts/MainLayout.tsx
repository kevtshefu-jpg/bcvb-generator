import { Outlet } from 'react-router-dom'
import '../../styles/tokens.css'
import '../../styles/base.css'
import '../../styles/layout.css'
import '../../styles/referentiel.css'
import { Sidebar } from '../../components/navigation/Sidebar'
import { TopBar } from '../../components/navigation/TopBar'

export function MainLayout() {
  return (
    <div className="public-shell">
      <Sidebar />

      <main className="public-main">
        <div className="public-content">
          <TopBar />
          <Outlet />
        </div>
      </main>
    </div>
  )
}
