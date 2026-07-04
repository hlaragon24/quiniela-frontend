import { useEffect, useState } from "react";
import { API } from "./config/api";
import { Card, CardContent } from "@/components/ui/card";

function Reglamento({ torneoId }) {
  const [contenido, setContenido] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!torneoId) return;
    setCargando(true);
    fetch(`${API}/reglamento?torneo_id=${torneoId}`)
      .then((r) => r.json())
      .then((data) => setContenido(data.contenido ?? ""))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [torneoId]);

  if (cargando) return <div className="mt-6 text-gray-500">Cargando reglamento...</div>;

  return (
    <div className="mt-6">
      <Card className="shadow-md border">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">📋 Reglamento</h2>
          {contenido ? (
            <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{contenido}</div>
          ) : (
            <p className="text-gray-400">El reglamento aún no ha sido configurado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Reglamento;
