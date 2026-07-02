import { useState } from "react";

const SIZES = {
  sm: { box: "w-10 h-10", text: "text-xs"  },
  md: { box: "w-16 h-16", text: "text-sm"  },
  lg: { box: "w-48 h-48", text: "text-base" },
};

export default function TeamShield({
  nombre = "",
  escudoUrl,
  color = "#6B7280",
  size = "md",
  showName = true,
}) {
  const [imgError, setImgError] = useState(false);
  const { box, text } = SIZES[size] ?? SIZES.md;

  const initials = nombre
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      {escudoUrl && !imgError ? (
        <img
          src={escudoUrl}
          alt={nombre}
          className={`${box} object-contain`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`${box} rounded-full flex items-center justify-center font-bold ${text} text-white flex-shrink-0`}
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
      )}
      {showName && (
        <span className={`${text} font-semibold text-center leading-tight`}>
          {nombre}
        </span>
      )}
    </div>
  );
}
