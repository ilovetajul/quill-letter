"use client";

import { useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Feather, Sparkles, Copy, Download, RotateCcw, FileText, User, Users, Globe, MessageSquare, AlignLeft, CheckCircle2, AlertCircle, Loader2, Eraser } from "lucide-react";
import { APPLICATION_TYPES, LANGUAGE_OPTIONS, TONE_OPTIONS } from "@/lib/types";
import type { ApplicationType, LanguageType, ToneType } from "@/lib/types";
import { downloadLetterAsPDF } from "@/lib/pdfExport";

interface FormState {
  applicationType: ApplicationType;
  subject: string;
  applicantInfo: string;
  recipientInfo: string;
  language: LanguageType;
  tone: ToneType;
  additionalContext: string;
}

const DEFAULT: FormState = {
  applicationType: "Leave Application",
  subject: "", applicantInfo: "", recipientInfo: "",
  language: "English", tone: "Highly Formal", additionalContext: "",
};

export default function HomePage() {
  const [form, setForm] = useState<FormState>(DEFAULT);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [letter, setLetter] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [tokens, setTokens] = useState<number | null>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const set = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  }, []);

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.subject || form.subject.trim().length < 5) e.subject = "Subject must be at least 5 characters.";
    if (!form.applicantInfo || form.applicantInfo.trim().length < 10) e.applicantInfo = "Please provide more detail (at least 10 characters).";
    if (!form.recipientInfo || form.recipientInfo.trim().length < 5) e.recipientInfo = "Recipient info must be at least 5 characters.";
    return e;
  };

  const handleGenerate = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error("Please fix the errors before generating."); return; }
    setIsGenerating(true); setLetter(""); setTokens(null);
    const tid = toast.loading("Crafting your letter…");
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setLetter(data.letter); setTokens(data.tokensUsed ?? null); setHasGenerated(true);
      toast.dismiss(tid); toast.success("Letter generated!");
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (err: any) {
      toast.dismiss(tid); toast.error(err.message || "Something went wrong.");
    } finally { setIsGenerating(false); }
  }, [form]);

  const handleCopy = useCallback(async () => {
    const text = letterRef.current?.innerText || letter;
    if (!text) return;
    try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard!"); }
    catch { const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); toast.success("Copied!"); }
  }, [letter]);

  const handlePDF = useCallback(async () => {
    const text = letterRef.current?.innerText || letter;
    if (!text) return;
    setIsExportingPDF(true);
    const tid = toast.loading("Preparing PDF…");
    try { await downloadLetterAsPDF(text, form.subject, form.applicationType); toast.dismiss(tid); toast.success("PDF downloaded!"); }
    catch { toast.dismiss(tid); toast.error("PDF generation failed."); }
    finally { setIsExportingPDF(false); }
  }, [letter, form.subject, form.applicationType]);

  const handleReset = useCallback(() => {
    setForm(DEFAULT); setErrors({}); setLetter(""); setHasGenerated(false); setTokens(null);
    window.scrollTo({ top: 0, behavior: "smooth" }); toast("Form cleared.");
  }, []);

  const wordCount = (letterRef.current?.innerText || letter).trim().split(/\s+/).filter(Boolean).length;

  return (
    <div>
      <header className="header">
        <div className="container">
          <div className="header-inner">
            <div className="logo">
              <div className="logo-icon"><Feather size={15} color="#fdfcf9" strokeWidth={2.5} /></div>
              <span className="logo-name">Quill</span>
              <span className="logo-sub">AI Letter Writer</span>
            </div>
            {hasGenerated && <button onClick={handleReset} className="btn-new"><Eraser size={13} />New Letter</button>}
          </div>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div className="hero-badge"><Sparkles size={11} />Powered by Gemini 1.5 Flash</div>
          <h1>Craft Letters That <span>Command Attention</span></h1>
          <p>Generate professionally crafted application letters in seconds. Tailored tone, perfect structure — in English or Bengali.</p>
          <div className="hero-stats">
            {[{v:"8+",l:"Letter Types"},{v:"2",l:"Languages"},{v:"3",l:"Tone Modes"}].map(({v,l})=>(
              <div key={l} style={{textAlign:"center"}}><div className="stat-value">{v}</div><div className="stat-label">{l}</div></div>
            ))}
          </div>
        </section>

        <div className="main-grid">
          {/* Form */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon"><FileText size={14} color="#fdfcf9" /></div>
              <div><h2>Letter Details</h2><p>Fill in the fields to generate your letter</p></div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div>
                  <div className="field-label"><FileText size={13} color="#c9953a" strokeWidth={2.5} />Type <span className="req">*</span></div>
                  <div className="select-wrap">
                    <select value={form.applicationType} onChange={e=>set("applicationType",e.target.value as ApplicationType)} disabled={isGenerating}>
                      {APPLICATION_TYPES.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="field-label"><Globe size={13} color="#c9953a" strokeWidth={2.5} />Language <span className="req">*</span></div>
                  <div className="select-wrap">
                    <select value={form.language} onChange={e=>set("language",e.target.value as LanguageType)} disabled={isGenerating}>
                      {LANGUAGE_OPTIONS.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="field-label"><MessageSquare size={13} color="#c9953a" strokeWidth={2.5} />Tone <span className="req">*</span></div>
                <div className="field-hint">Controls formality and urgency level</div>
                <div className="tone-grid">
                  {TONE_OPTIONS.map(t=>(
                    <button key={t} className={`tone-btn${form.tone===t?" active":""}`} onClick={()=>!isGenerating&&set("tone",t)} disabled={isGenerating}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="field-label"><AlignLeft size={13} color="#c9953a" strokeWidth={2.5} />Subject <span className="req">*</span></div>
                <div className="field-hint">A brief, clear title for your letter</div>
                <input type="text" value={form.subject} onChange={e=>set("subject",e.target.value)} placeholder="e.g. Application for 5-Day Medical Leave" maxLength={200} disabled={isGenerating} style={{marginTop:"8px",borderColor:errors.subject?"#b83a4d":undefined}} />
                {errors.subject&&<div className="field-error"><AlertCircle size={11}/>{errors.subject}</div>}
                <div className="char-count">{form.subject.length}/200</div>
              </div>

              <div>
                <div className="field-label"><User size={13} color="#c9953a" strokeWidth={2.5} />About You (Applicant) <span className="req">*</span></div>
                <div className="field-hint">Your name, role, contact info, and relevant background</div>
                <textarea value={form.applicantInfo} onChange={e=>set("applicantInfo",e.target.value)} placeholder={"Name: John Smith\nPosition: Software Engineer\nCompany: Acme Corp\nEmail: john@acme.com"} rows={5} maxLength={2000} disabled={isGenerating} style={{marginTop:"8px",borderColor:errors.applicantInfo?"#b83a4d":undefined}} />
                {errors.applicantInfo&&<div className="field-error"><AlertCircle size={11}/>{errors.applicantInfo}</div>}
                <div className="char-count">{form.applicantInfo.length}/2000</div>
              </div>

              <div>
                <div className="field-label"><Users size={13} color="#c9953a" strokeWidth={2.5} />Recipient <span className="req">*</span></div>
                <div className="field-hint">Name, designation, organization, address</div>
                <textarea value={form.recipientInfo} onChange={e=>set("recipientInfo",e.target.value)} placeholder={"The HR Manager\nAcme Corporation\n123 Business Park, New York"} rows={4} maxLength={800} disabled={isGenerating} style={{marginTop:"8px",borderColor:errors.recipientInfo?"#b83a4d":undefined}} />
                {errors.recipientInfo&&<div className="field-error"><AlertCircle size={11}/>{errors.recipientInfo}</div>}
                <div className="char-count">{form.recipientInfo.length}/800</div>
              </div>

              <div>
                <div className="field-label"><Sparkles size={13} color="#c9953a" strokeWidth={2.5} />Key Points / Context</div>
                <div className="field-hint">Optional: specific points or details to include</div>
                <textarea value={form.additionalContext} onChange={e=>set("additionalContext",e.target.value)} placeholder="e.g. Mention 5 years of experience, doctor's note attached..." rows={3} maxLength={1000} disabled={isGenerating} style={{marginTop:"8px"}} />
                <div className="char-count">{form.additionalContext.length}/1000</div>
              </div>

              <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (<><div className="spinner"/>Crafting your letter…</>) : (<><Feather size={16} strokeWidth={2.5}/>{hasGenerated?"Regenerate Letter":"Generate Letter"}<Sparkles size={13} style={{opacity:0.7}}/></>)}
              </button>
              <p style={{textAlign:"center",fontSize:"0.72rem",color:"#8a8178"}}>Fields marked <span style={{color:"#b83a4d"}}>*</span> are required</p>
            </div>
          </div>

          {/* Output */}
          <div ref={outputRef}>
            {!isGenerating && !letter && (
              <div className="empty-state">
                <div className="empty-icon"><Feather size={28} color="rgba(201,149,58,0.5)" strokeWidth={1.5}/></div>
                <h3>Your letter will appear here</h3>
                <p>Fill in the details and click <strong>Generate Letter</strong> to craft your correspondence.</p>
              </div>
            )}

            {isGenerating && (
              <div className="card">
                <div className="card-header">
                  <Loader2 size={15} color="#c9953a" style={{animation:"spin 0.8s linear infinite"}}/>
                  <div><h2>Gemini is writing…</h2><p>Crafting a {form.tone} {form.applicationType} in {form.language}</p></div>
                </div>
                <div className="skeleton-wrap">
                  {[120,280,240,0,280,260,200,0,280,240,180,0,120,80].map((w,i)=>(
                    <div key={i} className="skeleton-line" style={{width:w===0?"0px":`${w}px`,height:w===0?"6px":"13px",animationDelay:`${i*0.05}s`}}/>
                  ))}
                </div>
              </div>
            )}

            {!isGenerating && letter && (
              <div className="card">
                <div className="output-toolbar">
                  <div className="toolbar-left">
                    <div className="badge-ready"><CheckCircle2 size={11}/>Generated</div>
                    {tokens&&<span style={{fontSize:"0.7rem",color:"#8a8178"}}>~{tokens.toLocaleString()} tokens</span>}
                  </div>
                  <div className="toolbar-right">
                    <button className="btn-action" onClick={handleGenerate} disabled={isGenerating}><RotateCcw size={12} strokeWidth={2.5}/>Regenerate</button>
                    <button className="btn-action" onClick={handleCopy}><Copy size={12} strokeWidth={2.5}/>Copy</button>
                    <button className="btn-action btn-dark" onClick={handlePDF} disabled={isExportingPDF}>
                      {isExportingPDF?<Loader2 size={12} style={{animation:"spin 0.8s linear infinite"}}/>:<Download size={12} strokeWidth={2.5}/>}
                      {isExportingPDF?"Exporting…":"PDF"}
                    </button>
                  </div>
                </div>
                <div className="output-hint"><div className="hint-dot"/>Click anywhere in the letter to edit it directly</div>
                <div className="letter-paper">
                  <div ref={letterRef} contentEditable suppressContentEditableWarning className="letter-editable"
                    dangerouslySetInnerHTML={{__html:letter.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>")}}/>
                </div>
                <div className="output-footer">
                  <span className="word-count">{wordCount.toLocaleString()} words</span>
                  <div className="footer-actions">
                    <button className="btn-action" onClick={handleCopy}><Copy size={11} strokeWidth={2.5}/>Copy Letter</button>
                    <button className="btn-action btn-gold" onClick={handlePDF} disabled={isExportingPDF}>
                      {isExportingPDF?<Loader2 size={11} style={{animation:"spin 0.8s linear infinite"}}/>:<Download size={11} strokeWidth={2.5}/>}
                      {isExportingPDF?"Exporting…":"Download PDF"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {!hasGenerated && (
          <section className="how-section">
            <div className="how-title"><div className="gold-line"/><h2>How It Works</h2></div>
            <div className="how-grid">
              {[{n:"01",icon:FileText,title:"Fill the Details",desc:"Select type, language, tone. Describe yourself and your recipient."},
                {n:"02",icon:Sparkles,title:"AI Crafts Your Letter",desc:"Gemini 1.5 Flash generates a perfectly structured letter in seconds."},
                {n:"03",icon:Download,title:"Edit, Copy & Export",desc:"Refine in the editor, copy it, or download a formatted PDF."}
              ].map(({n,icon:Icon,title,desc})=>(
                <div className="how-card" key={n}>
                  <div className="how-num">{n}</div>
                  <div className="how-icon"><Icon size={14} color="#9e7120"/></div>
                  <h3>{title}</h3><p>{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand"><Feather size={13} color="#c9953a" strokeWidth={2}/>Quill AI</div>
          <p className="footer-note">Powered by Google Gemini 1.5 Flash · Review letters before sending</p>
          <div className="footer-status"><div className="status-dot"/>AI service operational</div>
        </div>
      </footer>
    </div>
  );
}
