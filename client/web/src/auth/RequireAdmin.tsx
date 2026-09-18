import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { fetchCurrentUser } from "../api/adminApi";

/**
 * /admin配下を保護するルートガード。
 * 未ログインなら/loginへ、ログイン済みだが管理者でなければアクセス拒否メッセージを表示する。
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!session) {
      setChecking(false);
      return;
    }
    fetchCurrentUser()
      .then((user) => setIsAdmin(user.isAdmin))
      .catch(() => setIsAdmin(false))
      .finally(() => setChecking(false));
  }, [session]);

  if (authLoading || checking) {
    return <p style={{ padding: 24 }}>確認中...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 24 }}>
        <p>このアカウントには管理者権限がありません。</p>
        <p>
          管理者にする場合は、Supabaseのusersテーブルで対象アカウントの`is_admin`を`true`に更新してください。
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
