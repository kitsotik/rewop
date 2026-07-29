import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { ESTADOS, ESTADO_LABELS } from "../constants";
import EstadoBadge from "../components/EstadoBadge";
import { useAuth } from "../context/AuthContext";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isStaff = profile && (profile.role === "admin" || profile.role === "tecnico");

  const [orden, setOrden] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nuevoEstado, setNuevoEstado] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [montoPresupuesto, setMontoPresupuesto] = useState("");
  const [descPresupuesto, setDescPresupuesto] = useState("");
  const [nombreRepuesto, setNombreRepuesto] = useState("");
  const [cantidadRepuesto, setCantidadRepuesto] = useState(1);
  const [costoRepuesto, setCostoRepuesto] = useState("");

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadAll() {
    setLoading(true);
    const { data: ordenData, error: errOrden } = await supabase
      .from("ordenes_trabajo")
      .select("*, clientes(nombre, telefono, email), equipos(tipo, marca, modelo, numero_serie), tecnico:profiles(full_name)")
      .eq("id", id)
      .single();

    if (errOrden) {
      setError(errOrden.message);
      setLoading(false);
      return;
    }

    setOrden(ordenData);
    setNuevoEstado(ordenData.estado);
    setDiagnostico(ordenData.diagnostico || "");

    const [{ data: hist }, { data: pres }, { data: rep }] = await Promise.all([
      supabase.from("historial_estados").select("*").eq("orden_id", id).order("created_at", { ascending: false }),
      supabase.from("presupuestos").select("*").eq("orden_id", id).order("created_at", { ascending: false }),
      supabase.from("repuestos_usados").select("*").eq("orden_id", id).order("created_at", { ascending: false }),
    ]);

    setHistorial(hist || []);
    setPresupuestos(pres || []);
    setRepuestos(rep || []);
    setLoading(false);
  }

  async function actualizarOrden() {
    setError("");
    const { error } = await supabase
      .from("ordenes_trabajo")
      .update({ estado: nuevoEstado, diagnostico })
      .eq("id", id);
    if (error) setError(error.message);
    else loadAll();
  }

  async function crearPresupuesto(e) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("presupuestos").insert({
      orden_id: id,
      monto: parseFloat(montoPresupuesto),
      descripcion: descPresupuesto,
    });
    if (error) setError(error.message);
    else {
      setMontoPresupuesto("");
      setDescPresupuesto("");
      loadAll();
    }
  }

  async function responderPresupuesto(presupuestoId, estado) {
    setError("");
    const { error } = await supabase
      .from("presupuestos")
      .update({ estado, respondido_at: new Date().toISOString() })
      .eq("id", presupuestoId);
    if (error) setError(error.message);
    else loadAll();
  }

  async function agregarRepuesto(e) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.from("repuestos_usados").insert({
      orden_id: id,
      nombre: nombreRepuesto,
      cantidad: parseInt(cantidadRepuesto, 10) || 1,
      costo_unitario: costoRepuesto ? parseFloat(costoRepuesto) : null,
    });
    if (error) setError(error.message);
    else {
      setNombreRepuesto("");
      setCantidadRepuesto(1);
      setCostoRepuesto("");
      loadAll();
    }
  }

  if (loading) return <div className="empty-state">Cargando orden...</div>;
  if (error && !orden) return <div className="error-text">{error}</div>;
  if (!orden) return <div className="empty-state">Orden no encontrada.</div>;

  return (
    <div>
      <button className="btn secondary" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        Volver
      </button>

      <div className="card">
        <div className="topbar" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Orden #{orden.numero}</h2>
          <EstadoBadge estado={orden.estado} />
        </div>
        <p>
          <strong>Cliente:</strong> {orden.clientes?.nombre} {orden.clientes?.telefono ? `- ${orden.clientes.telefono}` : ""}
        </p>
        <p>
          <strong>Equipo:</strong> {orden.equipos?.tipo} {orden.equipos?.marca} {orden.equipos?.modelo}
          {orden.equipos?.numero_serie ? ` (S/N: ${orden.equipos.numero_serie})` : ""}
        </p>
        <p>
          <strong>Tecnico asignado:</strong> {orden.tecnico?.full_name || "Sin asignar"}
        </p>
        <p>
          <strong>Ingreso:</strong> {new Date(orden.fecha_ingreso).toLocaleString()}
        </p>
        {orden.fecha_entrega_estimada && (
          <p>
            <strong>Entrega estimada:</strong> {orden.fecha_entrega_estimada}
          </p>
        )}
        <p>
          <strong>Problema reportado:</strong> {orden.descripcion_problema}
        </p>
        {orden.diagnostico && (
          <p>
            <strong>Diagnostico:</strong> {orden.diagnostico}
          </p>
        )}
      </div>

      {isStaff && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Actualizar orden</h3>
          <div className="form-group">
            <label>Estado</label>
            <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
              {ESTADOS.map((es) => (
                <option key={es} value={es}>
                  {ESTADO_LABELS[es]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Diagnostico</label>
            <textarea rows={3} value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
          </div>
          <button className="btn" onClick={actualizarOrden}>
            Guardar cambios
          </button>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Presupuestos</h3>
        {presupuestos.length === 0 && <p style={{ color: "#6b7280" }}>Todavia no hay presupuestos cargados.</p>}
        {presupuestos.map((p) => (
          <div key={p.id} style={{ borderBottom: "1px solid #e2e4e9", padding: "10px 0" }}>
            <p style={{ margin: 0 }}>
              <strong>${Number(p.monto).toLocaleString("es-AR")}</strong> - {p.descripcion || "sin descripcion"}
            </p>
            <p style={{ margin: "4px 0", fontSize: 13, color: "#6b7280" }}>
              Estado: {p.estado} {p.respondido_at ? `(respondido ${new Date(p.respondido_at).toLocaleString()})` : ""}
            </p>
            {!isStaff && p.estado === "pendiente" && (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => responderPresupuesto(p.id, "aprobado")}>
                  Aprobar
                </button>
                <button className="btn danger" onClick={() => responderPresupuesto(p.id, "rechazado")}>
                  Rechazar
                </button>
              </div>
            )}
          </div>
        ))}

        {isStaff && (
          <form onSubmit={crearPresupuesto} style={{ marginTop: 16 }}>
            <h4>Cargar nuevo presupuesto</h4>
            <div className="form-group">
              <label>Monto</label>
              <input
                type="number"
                step="0.01"
                value={montoPresupuesto}
                onChange={(e) => setMontoPresupuesto(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Descripcion</label>
              <input value={descPresupuesto} onChange={(e) => setDescPresupuesto(e.target.value)} />
            </div>
            <button className="btn" type="submit">
              Guardar presupuesto
            </button>
          </form>
        )}
      </div>

      {isStaff && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Repuestos utilizados</h3>
          {repuestos.length === 0 && <p style={{ color: "#6b7280" }}>Sin repuestos cargados.</p>}
          <table>
            <thead>
              <tr>
                <th>Repuesto</th>
                <th>Cantidad</th>
                <th>Costo unitario</th>
              </tr>
            </thead>
            <tbody>
              {repuestos.map((r) => (
                <tr key={r.id}>
                  <td>{r.nombre}</td>
                  <td>{r.cantidad}</td>
                  <td>{r.costo_unitario ? `$${Number(r.costo_unitario).toLocaleString("es-AR")}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <form onSubmit={agregarRepuesto} style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
              <label>Nombre</label>
              <input value={nombreRepuesto} onChange={(e) => setNombreRepuesto(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Cantidad</label>
              <input type="number" min="1" value={cantidadRepuesto} onChange={(e) => setCantidadRepuesto(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Costo unitario</label>
              <input type="number" step="0.01" value={costoRepuesto} onChange={(e) => setCostoRepuesto(e.target.value)} />
            </div>
            <button className="btn" type="submit">
              Agregar
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Historial</h3>
        <div className="timeline">
          {historial.map((h) => (
            <div key={h.id} className="timeline-item">
              <div><EstadoBadge estado={h.estado} /></div>
              <div className="ts">{new Date(h.created_at).toLocaleString()}</div>
              {h.comentario && <div>{h.comentario}</div>}
            </div>
          ))}
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
