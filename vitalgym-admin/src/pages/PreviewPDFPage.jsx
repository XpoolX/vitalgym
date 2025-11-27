import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import NavBar from "../components/NavBar";
import PageHeader from "../components/PageHeader";
import api from "../api/axios";
import html2pdf from "html2pdf.js";
import "./PreviewPDFPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";

// Versión más robusta de normalizeSeries
function normalizeSeries(series) {
  if (series == null) return [];
  if (Array.isArray(series))
    return series.map((s) => String(s).trim()).filter(Boolean);
  if (typeof series === "number") return [String(series)];
  if (typeof series === "object") return [String(series)];

  let s = String(series).trim();

  // Intentar parsear JSON repetidamente (maneja doble-encoding)
  for (let i = 0; i < 3; i++) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed))
        return parsed.map((x) => String(x).trim()).filter(Boolean);
      if (parsed == null) return [];
      // Si parsed es string/number, continuar con ese valor
      s = String(parsed).trim();
    } catch (e) {
      break;
    }
  }

  // Si está entre comillas, quitar comillas externas
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }

  // Quitar corchetes externos si existen
  if (s.startsWith("[") && s.endsWith("]")) {
    s = s.slice(1, -1).trim();
  }

  if (s === "") return [];

  // Intentar extraer números con regex (maneja casos como 10,10 o [10,10] o "10")
  const numberMatches = s.match(/-?\d+(\.\d+)?/g);
  if (numberMatches && numberMatches.length) {
    return numberMatches.map((n) => String(n));
  }

  // Fallback: dividir por separadores comunes: comas, punto y coma, barras, guiones o espacios
  const parts = s
    .split(/[,;\/\|\-]+|\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.map((p) => p.replace(/^["']|["']$/g, "").trim());
}

// ExerciseBlock: muestra título (espacio fijo), imagen (altura fija), tags y repeticiones/descanso
const ExerciseBlock = ({ exercise, numero }) => {
  const seriesArray = normalizeSeries(exercise.series);
  const seriesText = seriesArray.join(" - ");
  const descanso = exercise.descansoSegundos ?? 60;

  // Construir lista de tags desde los campos del ejercicio (si existen)
  const tags = [];
  if (exercise.zonaCorporal)
    tags.push({ type: "zona", text: exercise.zonaCorporal });
  if (exercise.grupoMuscular)
    tags.push({ type: "grupo", text: exercise.grupoMuscular });
  if (exercise.equipo) tags.push({ type: "equipo", text: exercise.equipo });
  if (exercise.nivel) tags.push({ type: "nivel", text: exercise.nivel });

  return (
    <div className="exercise-block">
      {/* Zona de título: se le reserva un espacio fijo vía CSS */}
      <div className="exercise-title-area">
        <div className="exercise-title-row">
          <div className="exercise-number">{numero}.</div>
          <div className="exercise-title">
            <div className="exercise-name">
              {(exercise.nombre || "").toUpperCase()}
            </div>
            {exercise.grupoMuscular && (
              <div className="exercise-category">{exercise.grupoMuscular}</div>
            )}
          </div>
        </div>
      </div>

      {/* Imagen: siempre se coloca en la misma posición gracias a la space reserved en .exercise-title-area */}
      {exercise.imagenUrl ? (
        <div className="exercise-img-wrap">
          <img
            src={exercise.imagenUrl}
            alt={exercise.nombre}
            crossOrigin="anonymous"
            className="exercise-img"
          />
        </div>
      ) : null}

      {/* TAGS: aparece justo debajo de la imagen */}
      {tags.length > 0 && (
        <div className="exercise-tags" aria-hidden={false}>
          {tags.map((t, i) => (
            <span key={i} className={`tag tag--${t.type}`}>
              {t.text}
            </span>
          ))}
        </div>
      )}

      {/* Repeticiones y descanso debajo de la imagen */}
      <div className="exercise-reps">
        {seriesText ? seriesText + ` • (${descanso} Seg)` : "—"}
      </div>

      {exercise.notas && <div className="exercise-notes">{exercise.notas}</div>}
    </div>
  );
};

export default function PreviewPDFPage() {
  const { id } = useParams();
  const [dias, setDias] = useState([]);
  const [rutina, setRutina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchRutina = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/admin/routines/${id}`);
        console.log("DEBUG: API response for /admin/routines/:id ->", res.data);
        setRutina(res.data || null);
        setDias(res.data && res.data.dias ? res.data.dias : []);
      } catch (err) {
        console.error("Error cargando rutina:", err);
        if (err?.response) {
          setError({
            message: "Error del servidor al obtener la rutina.",
            status: err.response.status,
            serverData: err.response.data,
          });
        } else {
          setError({ message: err.message || "Error de red" });
        }
        setRutina(null);
        setDias([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRutina();
  }, [id]);

  const ensureImagesLoaded = (element) => {
    const imgs = Array.from(element.querySelectorAll("img"));
    const promises = imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (!img.src) return resolve();
          if (img.complete && img.naturalHeight !== 0) return resolve();
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn("Image failed to load for PDF:", img.src);
            resolve();
          };
          setTimeout(resolve, 8000);
        })
    );
    return Promise.all(promises);
  };

  const exportarPDF = async () => {
    if (!containerRef.current) return;
    const element = containerRef.current;

    const nav =
      document.querySelector("nav") ||
      document.querySelector(".navbar") ||
      document.querySelector(".site-header");
    const navOriginalDisplay = nav ? nav.style.display : null;
    if (nav) nav.style.display = "none";

    try {
      await ensureImagesLoaded(element);

      const filename = `Rutina_${
        rutina?.nombre ? rutina.nombre.replace(/\s+/g, "_") : id
      }.pdf`;

      const opt = {
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };

      await html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get("pdf")
        .then((pdf) => {
          try {
            const totalPages = pdf.internal.getNumberOfPages();
            const pageSize = pdf.internal.pageSize;
            const pageWidth = pageSize.getWidth();
            const pageHeight = pageSize.getHeight();
            pdf.setFontSize(10);
            for (let i = 1; i <= totalPages; i++) {
              pdf.setPage(i);
              const footerText = `Página ${i} de ${totalPages}`;
              pdf.text(footerText, pageWidth / 2, pageHeight - 10, {
                align: "center",
              });
            }
          } catch (err) {
            console.warn("No se pudo añadir numeración de páginas:", err);
          }
        })
        .save();
    } finally {
      if (nav) nav.style.display = navOriginalDisplay || "";
    }
  };

  return (
    <div className="preview-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, black 50%, crimson 50%)', paddingTop: '150px' }}>
      <NavBar />
      <div className="preview-inner" style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <PageHeader 
          icon={faFilePdf} 
          title="Previsualización PDF" 
          subtitle="Vista previa y exportación de la rutina"
        />

        {loading && <p>Cargando rutina...</p>}

        {error && (
          <div className="error-box">
            <strong>{error.message}</strong>
            {error.status && <div>Estado: {error.status}</div>}
            {error.serverData && (
              <pre className="server-data">
                {JSON.stringify(error.serverData, null, 2)}
              </pre>
            )}
          </div>
        )}

        {!loading && !error && (
          <>
            {rutina && (
              <div className="rutina-header">
                <div>
                  <h3 className="rutina-nombre">{rutina.nombre}</h3>
                  {rutina.descripcion && (
                    <p className="rutina-desc">{rutina.descripcion}</p>
                  )}
                </div>
              </div>
            )}

            <div className="all-folios" ref={containerRef}>
              {dias.length === 0 ? (
                <div className="folio-a4">
                  <p style={{ textAlign: "center" }}>
                    No hay datos de rutina para mostrar.
                  </p>
                </div>
              ) : (
                dias.map((diaData, diaIndex) => (
                  <div className="folio-a4" key={diaData.dia ?? diaIndex}>
                    <header className="folio-top">
                      <div className="folio-top-left">
                        <div className="rutina-subtitle">
                          {rutina?.nombre ? rutina.nombre.toUpperCase() : ""}
                        </div>
                        <div className="rutina-subtitle2">
                          {rutina?.nombre ? rutina.descripcion.toUpperCase() : ""}
                        </div>
                      </div>
                      <div className="folio-day">DÍA {diaData.dia}</div>
                    </header>

                    <div className="exercise-grid">
                      {Array.isArray(diaData.ejercicios) &&
                      diaData.ejercicios.length > 0 ? (
                        diaData.ejercicios.map((exercise, idx) => (
                          <ExerciseBlock
                            key={idx}
                            exercise={exercise}
                            numero={idx + 1}
                          />
                        ))
                      ) : (
                        <div>No hay ejercicios para este día.</div>
                      )}
                    </div>

                    <footer className="folio-footer">
                      {diaData.notasGenerales && (
                        <div className="notas-generales">
                          {diaData.notasGenerales}
                        </div>
                      )}
                    </footer>
                  </div>
                ))
              )}
            </div>

            {dias.length > 0 && (
              <div className="export-btn">
                <button onClick={exportarPDF} className="btn btn-primary" style={{ borderRadius: '12px', padding: '12px 24px' }}>
                  <FontAwesomeIcon icon={faFilePdf} /> Exportar PDF
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
