import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function NewOrder() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");

  const [equipoTipo, setEquipoTipo] = useState("");
  const [equipoMarca, setEquipoMarca] = useState("");
  const [equipoModelo, setEquipoModelo] = useState("");
  const [equipoSerie, setEquipoSerie] = useState("");

  const [descripcion, setDescripcion] = useState("");
  const [fechaEstimada, setFechaEstimada] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("clientes").select("id, nombre").order("nombre").then(({ data }) => setClientes(data || []));
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "tecnico")
      .then(({ data }) => setTecnicos(data || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      let finalClienteId = clienteId;

      if (nuevoCliente) {
        const { data: nuevo, error: errCliente } = await supabase
          .from("clientes")
          .insert({ nombre: clienteNombre, telefono: clienteTelefono, email: clienteEmail })
          .select()
          .single();
        if (errCliente) throw errCliente;
        finalClienteId = nuevo.id;
      }

      if (!finalClienteId) throw new Error("Selecciona o crea un cliente.");

      const { data: equipo, error: errEquipo } = await supabase
        .from("equipos")
        .insert({
          cliente_id: finalClienteId,
          tipo: equipoTipo,
          marca: equipoMarca,
          modelo: equipoModelo,
          numero_serie: equipoSerie,
        })
        .select()
        .single();
      if (errEquipo) throw errEquipo;

      const { data: orden, error: errOrden } = await supabase
        .from("ordenes_trabajo")
        .insert({
          cliente_id: finalClienteId,
          equipo_id: equipo.id,
          descripcion_problema: descripcion,
          fecha_entrega_estimada: fechaEstimada || null,
          tecnico_id: tecnicoId || null,
        })
        .select()
        .single();
      if (errOrden) throw errOrden;

      navigate(`/ordenes/${orden.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>Nueva orden de trabajo</h2>
      <form onSubmit={handleSubmit} className="card">
        <h3 style={{ marginTop: 0 }}>Cliente</h3>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, marginBottom: 12 }}>
          <input type="checkbox" checked={nuevoCliente} onChange={(e) => setNuevoCliente(e.target.checked)} />
          Es un cliente nuevo
        </label>

        {nuevoCliente ? (
          <>
            <div className="form-group">
              <label>Nombre</label>
              <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Telefono</label>
              <input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} />
            </div>
          </>
        ) : (
          <div className="form-group">
            <label>Cliente existente</label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <h3>Equipo</h3>
        <div className="form-group">
          <label>Tipo (ej: Notebook, Aire acondicionado)</label>
          <input value={equipoTipo} onChange={(e) => setEquipoTipo(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Marca</label>
          <input value={equipoMarca} onChange={(e) => setEquipoMarca(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Modelo</label>
          <input value={equipoModelo} onChange={(e) => setEquipoModelo(e.target.value)} />
        </div>
        <div className="form-group">
          <label>N° de serie</label>
          <input value={equipoSerie} onChange={(e) => setEquipoSerie(e.target.value)} />
        </div>

        <h3>Orden</h3>
        <div className="form-group">
          <label>Descripcion del problema</label>
          <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Fecha de entrega estimada</label>
          <input type="date" value={fechaEstimada} onChange={(e) => setFechaEstimada(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Asignar tecnico (opcional)</label>
          <select value={tecnicoId} onChange={(e) => setTecnicoId(e.target.value)}>
            <option value="">Sin asignar</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name || t.id}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-text">{error}</div>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Creando..." : "Crear orden"}
        </button>
      </form>
    </div>
  );
}
