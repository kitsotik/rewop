import React from "react";
import { ESTADO_LABELS, ESTADO_COLORS } from "../constants";

export default function EstadoBadge({ estado }) {
  const color = ESTADO_COLORS[estado] || "#64748b";
  const label = ESTADO_LABELS[estado] || estado;
  return (
    <span className="badge" style={{ backgroundColor: color }}>
      {label}
    </span>
  );
}
