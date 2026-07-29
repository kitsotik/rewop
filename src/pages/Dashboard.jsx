import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { ESTADOS, ESTADO_LABELS } from "../constants";
import EstadoBadge from "../components/EstadoBadge";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [soloMias, setSoloMias] = useState(false);

  useEffect(() => {
    loadOrdenes();
  }, []);

  async function loadOrdenes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("ordenes_trabajo")
      .select("id, numero, estado, descripcion_problema, fecha_ingreso, tecnico_id, clientes(nombre), equipos(tipo, marca, modelo)")
      .order("created_at", { ascending: false });
    if (error) console.error(error.message);
    setOrdenes(data || []);
    setLoading(false);
  }

  const filtradas = ordenes.filter((o) => {
    if (filtroEstado !== "todos" && o.estado !== filtroEstado) return false;
    if (soloMias && o.tecnico_id !== profile?.id) return false;
    return true;
  });

  return (
    <div>
      <div className="topbar" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Panel de ordenes</h2>
        <button className="btn" onClick={() => navigate("/ordenes/nueva")}>
          + Nueva orden
        </button>
      </div>

      <div className="filters">
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADO_LABELS[e]}
            </option>
          ))}
        </select>
        {profile?.role === "tecnico" && (
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={soloMias} onChange={(e) => setSoloMias(e.target.checked)} />
            Solo mis ordenes
          </label>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">Cargando ordenes...</div>
        ) : filtradas.length === 0 ? (
          <div className="empty-state">No hay ordenes que coincidan con el filtro.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Problema</th>
                <th>Ingreso</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((o) => (
                <tr key={o.id} onClick={() => navigate(`/ordenes/${o.id}`)}>
                  <td>#{o.numero}</td>
                  <td>{o.clientes?.nombre || "-"}</td>
                  <td>
                    {o.equipos ? `${o.equipos.tipo} ${o.equipos.marca || ""} ${o.equipos.modelo || ""}` : "-"}
                  </td>
                  <td>{o.descripcion_problema?.slice(0, 40) || "-"}</td>
                  <td>{new Date(o.fecha_ingreso).toLocaleDateString()}</td>
                  <td>
                    <EstadoBadge estado={o.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
