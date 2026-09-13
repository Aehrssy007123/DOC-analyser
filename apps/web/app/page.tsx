"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, FileText, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import type { Report } from "../../../packages/types/report";
import DocumentConstellation from "./DocumentConstellation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const stages = ["Uploading", "Parsing", "Understanding", "Classifying", "Checking requirements", "Finding gaps", "Evaluating quality", "Generating recommendations", "Complete"];

export default function Home() {
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setError(""); setReport(null);
    const body = new FormData(); body.append("file", file);
    let timer: ReturnType<typeof setInterval> | undefined;
    let stageIndex = 0;
    try {
      const response = await fetch(`${API}/api/v1/documents/analyze/async`, { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "Analysis failed");
      setStage("Uploading");
      timer = setInterval(() => {
        stageIndex = Math.min(stageIndex + 1, stages.length - 2);
        setStage(stages[stageIndex]);
      }, 650);
      let job: { status: string; document_id?: string; error?: string } = payload;
      while (job.status === "queued" || job.status === "processing") {
        await new Promise((resolve) => setTimeout(resolve, 700));
        const statusResponse = await fetch(`${API}/api/v1/jobs/${payload.job_id}`);
        job = await statusResponse.json();
      }
      if (job.status !== "complete" || !job.document_id) throw new Error(job.error ?? "Analysis failed");
      const reportResponse = await fetch(`${API}/api/v1/documents/${job.document_id}`);
      const reportPayload = await reportResponse.json();
      if (!reportResponse.ok) throw new Error(reportPayload.detail ?? "Report retrieval failed");
      setReport(reportPayload); setStage("Complete");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Analysis failed"); }
    finally { if (timer) clearInterval(timer); setBusy(false); }
  }

  return <main className="shell">
    <div className="orb orb-a" /><div className="orb orb-b" />
    <nav><div className="brand"><span className="brand-mark"><Sparkles size={16} /></span> structura<span className="muted">.ai</span></div><div className="nav-note">DOCUMENT INTELLIGENCE <span className="dot" /> PRIVATE BETA</div></nav>
    {!report ? <section className="hero">
      <div className="eyebrow"><span className="pulse" /> STRUCTURE, MADE VISIBLE</div>
      <h1>Turn document chaos<br /><em>into clear direction.</em></h1>
      <p className="lede">Structura maps what your document says, how it is arranged, and what it needs to become stronger.</p>
      <label className={`dropzone ${busy ? "busy" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files[0]); }}>
        <input type="file" accept=".pdf,.docx,.pptx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.webp" onChange={(e) => upload(e.target.files?.[0])} />
        <div className="upload-icon"><UploadCloud size={25} /></div>
        <strong>{busy ? stage || "Analyzing document..." : "Drop a PDF to begin"}</strong>
        <span>{busy ? "Your document is being understood stage by stage" : "PDF, DOCX, PPTX, XLSX, CSV, TXT, and images · up to 15 MB"}</span>
        {!busy && <button type="button">Choose file <ArrowUpRight size={15} /></button>}
      </label>
      {error && <div className="error">{error}</div>}
      <div className="trust"><ShieldCheck size={15} /> Files are validated and treated as untrusted input <span /> <FileText size={15} /> No model output is presented as fact without confidence</div>
    </section> : <Analysis report={report} onReset={() => setReport(null)} />}
    <footer><span>© 2026 STRUCTURA AI</span><span>UNDERSTAND · DIAGNOSE · RESTRUCTURE</span></footer>
  </main>;
}

function Analysis({ report, onReset }: { report: Report; onReset: () => void }) {
  return <section className="analysis">
    <div className="analysis-head"><div><div className="eyebrow"><Check size={14} /> ANALYSIS COMPLETE</div><h2>{report.title}</h2><p>{report.filename} · {report.pages} page{report.pages === 1 ? "" : "s"} · {report.document_type.replaceAll("_", " ")}</p></div><button className="ghost" onClick={onReset}>Analyze another <ArrowUpRight size={15} /></button></div>
    <div className="metrics">{Object.entries(report.scores).map(([key, value]) => <div className="metric" key={key}><span>{key.replaceAll("_", " ")}</span><strong>{value}</strong><div className="bar"><i style={{ width: `${value}%` }} /></div></div>)}</div>
    <div className="grid">
      <div className="panel visual-panel"><div className="panel-title">DOCUMENT CONSTELLATION <span>INTERACTIVE</span></div><DocumentConstellation count={report.sections.length} /></div>
      <div className="panel structure-panel"><div className="panel-title">RECOMMENDED STRUCTURE <span>{report.sections.length} detected · {report.missing_sections.length} missing</span></div><div className="outline">{report.restructured_outline.map((item, index) => <div className={`outline-row ${report.missing_sections.includes(item) ? "missing" : ""}`} key={item}><span>{String(index + 1).padStart(2, "0")}</span><b>{item}</b>{report.missing_sections.includes(item) && <small>MISSING</small>}</div>)}</div></div>
      <div className="panel"><div className="panel-title">FINDINGS <span>{report.ordering_issues.length + report.content_issues.length} issues</span></div><div className="findings">{[...report.ordering_issues, ...report.content_issues].map((issue) => <div className="finding" key={issue.id}><div className={`severity ${issue.severity}`} /> <div><strong>{issue.category.replaceAll("_", " ")}</strong><p>{issue.explanation}</p><small>{issue.recommendation}</small></div></div>)}{report.missing_sections.map((item) => <div className="finding" key={item}><div className="severity high" /><div><strong>missing section</strong><p>{item} is not present in the detected structure.</p><small>Add it where shown in the recommended outline.</small></div></div>)}</div></div>
    </div>
  </section>;
}
