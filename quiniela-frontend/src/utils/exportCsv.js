export const exportarCSV = (datos, columnas, nombreArchivo) => {
  const encabezados = columnas.map((c) => `"${c.label}"`).join(",");
  const filas = datos.map((fila) =>
    columnas
      .map((c) => {
        const val = fila[c.key] ?? "";
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );
  const csv = [encabezados, ...filas].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombreArchivo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
