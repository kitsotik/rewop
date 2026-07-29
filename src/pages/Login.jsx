import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error.message);
      } else {
        setInfo("Cuenta creada. Revisa tu email para confirmar el acceso, luego inicia sesion.");
        setMode("login");
      }
    }
    setBusy(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <h2 style={{ marginTop: 0 }}>
          {mode === "login" ? "Iniciar sesion" : "Crear cuenta de cliente"}
        </h2>
        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="form-group">
              <label>Nombre completo</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Contrasena</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          {error && <div className="error-text">{error}</div>}
          {info && <div className="error-text" style={{ color: "#16a34a" }}>{info}</div>}
          <button className="btn" type="submit" disabled={busy} style={{ width: "100%", marginTop: 8 }}>
            {busy ? "Un momento..." : mode === "login" ? "Ingresar" : "Registrarme"}
          </button>
        </form>
        <div style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
          {mode === "login" ? (
            <span>
              Sos cliente y no tenes cuenta?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("signup"); }}>
                Registrate
              </a>
            </span>
          ) : (
            <span>
              Ya tenes cuenta?{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); }}>
                Iniciar sesion
              </a>
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 16 }}>
          El personal del taller (admin/tecnico) debe ser creado o promovido por un administrador
          desde el panel de Supabase.
        </p>
      </div>
    </div>
  );
}
