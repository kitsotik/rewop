import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import OrderDetail from "./pages/OrderDetail";
import ClientPortal from "./pages/ClientPortal";

function Layout({ children }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const isStaff = profile && (profile.role === "admin" || profile.role === "tecnico");

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Rewop</h1>
        <nav>
          {isStaff && <Link to="/">Panel de ordenes</Link>}
          {isStaff && <Link to="/ordenes/nueva">Nueva orden</Link>}
          {profile && profile.role === "cliente" && <Link to="/">Mis ordenes</Link>}
          <button onClick={handleSignOut}>Cerrar sesion</button>
        </nav>
      </aside>
      <div className="main">
        <div className="topbar">
          <div />
          <div className="user-info">
            {profile ? `${profile.full_name || "Usuario"} - ${profile.role}` : ""}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Home() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="empty-state">Cargando...</div>;
  if (!profile) return <div className="empty-state">No se encontro el perfil del usuario.</div>;
  if (profile.role === "cliente") return <ClientPortal />;
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordenes/nueva"
          element={
            <ProtectedRoute roles={["admin", "tecnico"]}>
              <Layout>
                <NewOrder />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordenes/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <OrderDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
