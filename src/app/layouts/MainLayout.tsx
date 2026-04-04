import { Outlet } from "react-router-dom";
import { Sidebar } from "../../components/navigation/Sidebar";
import "../../styles/tokens.css";
import "../../styles/base.css";
import "../../styles/layout.css";
import "../../styles/referentiel.css";

export function MainLayout() {
  return (
    <div className="public-shell">
      <Sidebar />
      <main className="public-main">
        <div className="public-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
