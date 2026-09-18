import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAdmin } from "./auth/RequireAdmin";
import { LoginPage } from "./pages/LoginPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { CardListPage } from "./pages/admin/CardListPage";
import { CardFormPage } from "./pages/admin/CardFormPage";
import { PlayerMasterListPage } from "./pages/admin/PlayerMasterListPage";
import { PlayerMasterFormPage } from "./pages/admin/PlayerMasterFormPage";
import { PackMasterListPage } from "./pages/admin/PackMasterListPage";
import { PackMasterFormPage } from "./pages/admin/PackMasterFormPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<CardListPage />} />
            <Route path="cards" element={<CardListPage />} />
            <Route path="cards/new" element={<CardFormPage />} />
            <Route path="cards/:cardId" element={<CardFormPage />} />
            <Route path="players" element={<PlayerMasterListPage />} />
            <Route path="players/new" element={<PlayerMasterFormPage />} />
            <Route path="players/:playerId" element={<PlayerMasterFormPage />} />
            <Route path="packs" element={<PackMasterListPage />} />
            <Route path="packs/new" element={<PackMasterFormPage />} />
            <Route path="packs/:packId" element={<PackMasterFormPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
