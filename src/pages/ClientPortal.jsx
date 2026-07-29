import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import EstadoBadge from "../components/EstadoBadge";

export default function ClientPortal() {
  const navigate = useNavigate();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("ordenes_trabajo")
      .select("id, numero, estado, descripcion_problema, fecha_ingreso, fecha_entrega_estimada, equipos(tipo, marca, modelo)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error.message);
        setOrdenes(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2>Mis ordenes de trabajo</h2>
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">Cargando...</div>
        ) : ordenes.length === 0 ? (
          <div className="empty-state">Todavia no tenes ordenes de trabajo registradas.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Equipo</th>
                <th>Problema</th>
                <th>Ingreso</th>
                <th>Entrega estimada</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((o) => (
                <tr key={o.id} onClick={() => navigate(`/ordenes/${o.id}`)}>
                  <td>#{o.numero}</td>
                  <td>{o.equipos ? `${o.equipos.tipo} ${o.equipos.marca || ""} ${o.equipos.modelo || ""}` : "-"}</td>
                  <td>{o.descripcion_problema?.slice(0, 40) || "-"}</td>
                  <td>{new Date(o.fecha_ingreso).toLocaleDateString()}</td>
                  <td>{o.fecha_entrega_estimada || "-"}</td>
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
