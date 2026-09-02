import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { API } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ""}/pdf.worker.min.mjs`;

export default function PaperViewer() {
  const { subjectId, paperId } = useParams();
  const navigate = useNavigate();
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(Math.min(window.innerWidth - 24, 820));

  const src = `${API}/papers/${subjectId}/${paperId}`;

  useEffect(() => {
    const onResize = () => setWidth(Math.min(window.innerWidth - 24, 820));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-slate-900">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          data-testid="paper-viewer-back"
          onClick={() => navigate(`/subject/${subjectId}/papers`)}
          className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-sm font-bold text-white">Model Question Paper {paperId}</span>
        <span className="w-16" />
      </div>

      <div
        className="flex-1 overflow-y-auto px-2 py-4"
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: "none" }}
      >
        <Document
          file={src}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <div className="flex h-full items-center justify-center py-20 text-white/70">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          }
          error={<div className="py-20 text-center text-sm text-white/70">Unable to load paper.</div>}
          className="flex flex-col items-center gap-4"
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-lg bg-white shadow-2xl">
              <Page
                pageNumber={i + 1}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
