import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export function AdminLayout() {
  const { signOut } = useAuth();

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    marginRight: 16,
    fontWeight: isActive ? ("bold" as const) : ("normal" as const),
  });

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 24px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <nav>
          <NavLink to="/admin/cards" style={linkStyle}>
            カード
          </NavLink>
          <NavLink to="/admin/players" style={linkStyle}>
            Playerアバター
          </NavLink>
          <NavLink to="/admin/packs" style={linkStyle}>
            パック
          </NavLink>
        </nav>
        <button onClick={() => signOut()}>ログアウト</button>
      </header>
      <div style={{ padding: 24 }}>
        <Outlet />
      </div>
    </div>
  );
}
