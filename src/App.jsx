import { useState, useRef, useEffect } from "react";
import { STAGES, STAGE_META, CAPTURE, STAGE_DATA, QUESTION_BANK, QUICK_ANSWERS } from "./callTrack.js";

const C = {
  pageBg: "#f4f5f7",
  panelBg: "#ffffff",
  border: "#e3e6ea",
  textPrimary: "#16202b",
  textSecondary: "#4b5a6a",
  textMuted: "#7d8794",
  black: "#16202b",
  white: "#ffffff",
  sidebar: "#ffffff",
  emerald: "#2563eb",
  emeraldLight: "#e9effe",
  emeraldMid: "#bccdf5",
  yellow: "#eff3f9",
  yellowBorder: "#d6deea",
  yellowText: "#4a5d78",
  yellowRule: "rgba(74,93,120,0.12)",
  coral: "#c44848",
  coralLight: "#fdf2f2",
  coralBorder: "#f3c9c9",
  coralText: "#9b2c2c",
  amber: "#b45309",
  filledBg: "#e3f4ea",
  filledText: "#14532d",
  sand: "#f8f9fb",
};

// Strip "Q1 — " / "Say — " / "3 — " prefixes: the card's badge already carries that.
function cleanLabel(label = "") {
  return label.replace(/^(Q\d+|Say|\d+)\s*[—–-]\s*/, "").replace(/^Say$/, "");
}

// Inline markup: **bold** = words to land; [placeholder] = fill-in. If resolve() knows the
// placeholder (from the prep brief or capture pane), their words are dropped in, marked green.
function renderInline(str, resolve, kp = "x", sentenceStart = true) {
  const parts = String(str).split(/(\*\*[^*]+\*\*|\[[^\]]+\])/g);
  return parts.map((seg, j) => {
    const atStart = sentenceStart && j === 1 && parts[0].trim() === "";
    const key = `${kp}-${j}`;
    if (/^\*\*[^*]+\*\*$/.test(seg)) return <strong key={key} style={{ fontWeight:700, color:C.black }}>{renderInline(seg.slice(2, -2), resolve, key, atStart)}</strong>;
    if (/^\[[^\]]+\]$/.test(seg)) {
      const name = seg.slice(1, -1);
      const raw = resolve?.(name);
      const val = raw && atStart ? raw[0].toUpperCase() + raw.slice(1) : raw;
      return val
        ? <span key={key} title={`From your notes: ${name}`} style={{ background:C.filledBg, color:C.filledText, borderRadius:4, padding:"0 3px", boxDecorationBreak:"clone", WebkitBoxDecorationBreak:"clone" }}>{val}</span>
        : <span key={key} style={{ background:"#e8eefc", color:"#1d4ed8", borderRadius:4, padding:"0 3px", fontWeight:600, boxDecorationBreak:"clone", WebkitBoxDecorationBreak:"clone" }}>{seg}</span>;
    }
    return <span key={key}>{seg}</span>;
  });
}

// Spoken text. Line breaks within a paragraph reflow; "\n\n" starts a new paragraph.
// With followups, paragraphs after the first render as smaller "then" lines.
function Script({ text, size = 19, weight = 500, color = C.textPrimary, resolve, followups = false }) {
  const paras = String(text).split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, " "));
  return (
    <div style={{ fontSize:size, lineHeight:1.45, fontWeight:weight, color, letterSpacing:"-0.006em" }}>
      {paras.map((p, i) => (followups && i > 0)
        ? <div key={i} style={{ marginTop:8, display:"flex", gap:8, fontSize:Math.round(size * 0.86), color:C.textSecondary }}>
            <span style={{ color:C.textMuted, fontWeight:600, flexShrink:0 }}>↳</span><span>{renderInline(p, resolve, i)}</span>
          </div>
        : <div key={i} style={{ marginTop: i ? "0.6em" : 0 }}>{renderInline(p, resolve, i)}</div>
      )}
    </div>
  );
}

const fmtClock = ms => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Script items to show. Items tagged with an area (Pipeline / Labor cost / Retention)
// show only for the area they picked, unless "all areas" is on.
function visibleScript(stageId, area, showAll) {
  const script = STAGE_DATA[stageId]?.script || [];
  if (!area || area === "All three" || showAll) return script;
  return script.filter(it => !it.group || it.group === area);
}

// Flat list of focusable lines for a stage: every spoken beat and every question.
function flattenScript(script) {
  const out = [];
  let q = 0;
  script.forEach((item, i) => {
    if (item.kind === "say") item.beats.forEach((_, b) => out.push({ kind:"beat", item:i, beat:b }));
    else if (item.kind === "ask") out.push({ kind:"ask", item:i, q:++q });
  });
  return out;
}

const TREES = [
  // Pain trees live here. Add one object per pain:
  // {
  //   id: "my-pain",
  //   label: "Pain label",
  //   sub: "One-line description",
  //   situation: [ { text: "...", note: "..." }, { lead: "...", text: "...", note: "..." } ],
  //   pain:       [ ... ],
  //   impact:     [ ... ],
  //   critical:   [ ... ],
  //   decision:   [ ... ],
  // },
];


const DISCOVERY_CONTEXT = `You are an AI sales coach in a live enterprise discovery call companion. Coach using Chris Orlob's framework.

VALUE SELLING = 3 things: 1) Painful measurable current state 2) Compelling measurable future state 3) Your product as the bridge.

BUYER JOURNEY: Latent pain (dormant, back of mind) → Active pain (problem-language, not shopping) → Actively evaluating (solution-language, comparing vendors).

DIAGNOSTIC (first 2 min before ROE): Inbound: "So what brought you to the table today — what made this worth exploring?" Outbound: "We reached out to you, so this might sound odd — what made you agree to take this call?" Listen: latent=vague | active pain=problem language | evaluating=solution language.

KEY ORLOB SCRIPTS:
- Rapport: "I'm glad we found the time to meet today." Shut up. Read their response.
- ROE: "Here's what I'm thinking in terms of an agenda. Let me know if you had something else in mind..." → "Does that feel fair?"
- Go Back In Time (4 steps): 1-Align "Can you help me understand what you're looking for?" 2-Wallow "What else are you looking for it to do?" 3-Segue "How are you handling things today without those capabilities?" 4-Go back "Can I go back in time with you for a second? What was the original trigger event that made you prioritize this?"
- Killer go-back: "Can I go back in time with you for a second? It's clear you know what you want more than most people I talk to. I'm curious — what did that meeting look like, and how did you all define the problem that set this in motion?"
- Peel onion: "What is going on in your business that's driving this to be a priority?" (they chuckle — that's the signal)
- Softening T-up: "This is going to sound redundant. You could be focusing on any number of challenges, but I sense energy behind this one. What's going on behind the scenes?"
- Aside from template: "Aside from [what they said], is there something going on behind the scenes driving you to prioritize fixing this?"
- Summarize: "Let me see if I've understood you so far... [their exact words] ...Did I get that right?"
- Validate: "Before we move on — is this the challenge we should anchor our conversations to, or did I lead you somewhere you only mildly care about?"
- Baseline metric: "What metric is below expectations as a result of the challenges you've shared with me?"
- Future state: "Imagine we started working together today. Put yourself 365 days from now — what would have to be true for you to feel good about the progress we've made?"
- Root cause: "What's your opinion on why this is happening?"
- Ripple effects: "What are the ripple effects this challenge is having across the business?" NOT "how does this impact you?"
- CFO test: Would a CFO fund this? No → symptom, keep peeling. Yes → you're at a problem.
- Symptoms get ghosted. Problems get funded.
- Next step: "You know your company better than me. But based on what you told me today, what I recommend we do next is ___. Does that feel fair?"

Anytime you transition topics — summarize first, then transition. Every time.
Be specific, brief, direct. Word-for-word scripts. Personalize using prep brief and notes.`;




const SESSION_KEY = "discovery-session-v1";
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}") || {}; } catch { return {}; }
}
const EMPTY_BRIEF = { prospect:"", company:"", colleague:"", source:"", signals:"", role:"", systemSize:"", roles:"", turnover:"", signOns:"", contract:"", benefits:"", schools:"", decision:"", pain:"" };

export default function App() {
  const saved = useRef(loadSession()).current;
  const [activeStage, setActiveStage] = useState(STAGES.some(st => st.id === saved.activeStage) ? saved.activeStage : "prep");
  const [buyerPath, setBuyerPath] = useState(saved.buyerPath ?? null);
  const [selectedTree, setSelectedTree] = useState(null);
  const [callSource, setCallSource] = useState(saved.callSource ?? null);
  const [notes, setNotes] = useState(saved.notes || {});
  const [captures, setCaptures] = useState(saved.captures || {});
  const [focus, setFocus] = useState(saved.focus || {});
  const [noteOpen, setNoteOpen] = useState({});
  const [liveMode, setLiveMode] = useState(false);
  const [liveMeetingTitle, setLiveMeetingTitle] = useState("");
  const [liveAnalyzing, setLiveAnalyzing] = useState(false);
  const [liveStatus, setLiveStatus] = useState(""); // status message shown in UI
  const [liveLastPoll, setLiveLastPoll] = useState(null); // timestamp of last successful poll
  const liveLastLength = useRef(0);
  const cardRegistry = useRef({});
  const [prepBrief, setPrepBrief] = useState(saved.prepBrief || "");
  const [openSpiced, setOpenSpiced] = useState(null);
  const [openAnswer, setOpenAnswer] = useState(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [outputs, setOutputs] = useState({ spiced:"", email:"", score:"", whatweheard:"", debrief:"", fixplan:"" });
  const [outputLoading, setOutputLoading] = useState("");
  const [fixPlanLoading, setFixPlanLoading] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState({});
  const [briefFields, setBriefFields] = useState({ ...EMPTY_BRIEF, ...(saved.briefFields || {}) });
  const [coveredCards, setCoveredCards] = useState({});
  const [briefParsing, setBriefParsing] = useState(false);
  const [questionnaireText, setQuestionnaireText] = useState("");
  const [briefParseStatus, setBriefParseStatus] = useState("");
  const [roi, setRoi] = useState({ unitsPerMonth:"", minsPerUnit:"", teamSize:"", hourlyRate:"75", targetTimeMins:"15" });
  const [rightTab, setRightTab] = useState("capture"); // "capture" | "spiced" | "enterprise" | "roi"
  const [rightPanelOpen, setRightPanelOpen] = useState(() => typeof window === "undefined" || window.innerWidth >= 1200);
  const [confirmReset, setConfirmReset] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [coachingVisible, setCoachingVisible] = useState(false);
  const [callTranscript, setCallTranscript] = useState("");
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [scriptEdits, setScriptEdits] = useState(() => {
    try { return JSON.parse(localStorage.getItem("discovery-script-edits") || "{}"); } catch { return {}; }
  });
  const [editingKey, setEditingKey] = useState(null);
  useEffect(() => {
    try { localStorage.setItem("discovery-script-edits", JSON.stringify(scriptEdits)); } catch {}
  }, [scriptEdits]);
  const currentIdx = STAGES.findIndex(s => s.id === activeStage);
  const stageNote = notes[activeStage] || "";
  const showOutputsShortcut = activeStage !== "outputs";
  const B = { fontFamily:"'Inter', system-ui, sans-serif", cursor:"pointer" };

  // Call clock starts the first time you land on the opener; stage clock resets per stage.
  const [callStart, setCallStart] = useState(saved.callStart ?? null);
  const [stageStart, setStageStart] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setStageStart(Date.now());
    if (!callStart && activeStage !== "prep" && activeStage !== "outputs") setCallStart(Date.now());
  }, [activeStage]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo(0, 0); }, [activeStage]);

  // Keep the call in this browser so a reload mid-call loses nothing.
  useEffect(() => {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ activeStage, buyerPath, callSource, notes, captures, focus, prepBrief, briefFields, callStart })); } catch {}
  }, [activeStage, buyerPath, callSource, notes, captures, focus, prepBrief, briefFields, callStart]);

  function resetCall() {
    setNotes({}); setCaptures({}); setFocus({}); setPrepBrief(""); setBriefFields(EMPTY_BRIEF);
    setBuyerPath(null); setCallSource(null); setCoveredCards({}); setCallStart(null);
    setQuestionnaireText(""); setCallTranscript(""); setBriefParseStatus("");
    setOutputs({ spiced:"", email:"", score:"", whatweheard:"", debrief:"", fixplan:"" });
    setActiveStage("prep"); setConfirmReset(false);
  }

  const setCapture = (key, val) => setCaptures(c => ({ ...c, [key]: val }));

  // Fill [placeholders] from the prep brief and what you've captured so far.
  function resolveToken(name) {
    const c = captures, b = briefFields;
    const v = x => (x || "").trim();
    const join = parts => parts.map(v).filter(Boolean).join("; ");
    const today = [v(c.turnover) && `first-year turnover is ${v(c.turnover)}`, v(c.signOns) && `you're offering ${v(c.signOns)} in sign-ons`, v(c.contract) && `you're using ${v(c.contract)} in contract labor`].filter(Boolean).join(", ");
    const current = today && `${today}${v(c.target) ? `, and you want to get to ${v(c.target)}` : ""}`;
    const cause = v(c.rootCause) && `and it sounds like the root cause is ${v(c.rootCause)}`;
    switch (name.toLowerCase()) {
      case "names": case "name": return v(b.prospect);
      case "their company": return v(b.company);
      case "colleague name": return v(b.colleague);
      case "the area they chose": return { "Pipeline":"build a bigger pipeline of soon-to-graduate talent", "Labor cost":"spend less on sign-ons and contract labor", "Retention":"retain and grow their people", "All three":"build a bigger pipeline of soon-to-graduate talent" }[c.startArea] || "";
      case "what you spotted": return v(b.signals);
      case "recommended next step": return v(c.nextStep);
      case "who should join": return v(c.who);
      case "roles they named": return v(c.roles) || v(b.roles);
      case "date": return v(c.date);

      case "surface need": return v(c.surfaceNeed);
      case "what they said": return v(c.startWhy) || v(c.surfaceNeed);
      case "suspected root cause": return v(c.suspected);
      case "capability": return v(c.capability);
      case "your honest read": return v(c.read);
      case "business problem and current state": return join([c.businessDriver, current]);
      case "business problem + root causes": return join([c.businessDriver, cause]);
      case "brief summary": return join([c.businessDriver, current, cause, v(c.ripple) && `it's causing ${v(c.ripple)}`, v(c.cost) && `and it's costing about ${v(c.cost)} a month`]);
      default: return "";
    }
  }

  // Teleprompter cursor: one highlighted line per stage. Index == length means the stage is done.
  const [showAllAreas, setShowAllAreas] = useState(false);
  const beatConditions = { hasColleague: !!(briefFields.colleague || "").trim(), noColleague: !(briefFields.colleague || "").trim(),
    inbound: briefFields.source !== "Outbound", outbound: briefFields.source !== "Inbound",
    hesitant: captures.reaction === "Hesitant", notHesitant: captures.reaction !== "Hesitant",
    funnel: !captures.startArea || captures.startArea === "Pipeline" || captures.startArea === "All three",
    notFunnel: !!captures.startArea && captures.startArea !== "Pipeline" && captures.startArea !== "All three" };
  // Sub-tracks (e.g. sign-ons vs contract labor) show only what was picked; nothing picked shows all.
  const subVisible = (it, picks = captures) => {
    if (it.when && !beatConditions[it.when]) return false;
    if (!it.sub) return true;
    const v = picks[it.subKey];
    return !v || v === "Both" || v === it.sub;
  };
  const script = visibleScript(activeStage, captures.startArea, showAllAreas)
    .filter(it => subVisible(it))
    .map(it => it.kind === "say" ? { ...it, beats: it.beats.filter(bt => !bt.when || beatConditions[bt.when]) } : it);
  const flat = flattenScript(script);
  const focusIdx = Math.min(focus[activeStage] ?? 0, flat.length);
  const setFocusIdx = i => setFocus(f => ({ ...f, [activeStage]: Math.max(0, Math.min(i, flat.length)) }));
  function pickSub(key, value) {
    setCapture(key, value);
    const picks = { ...captures, [key]: value };
    const visible = visibleScript(activeStage, captures.startArea, showAllAreas).filter(it => subVisible(it, picks));
    let line = 0, jump = -1;
    visible.forEach(it => {
      if (jump < 0 && it.subKey === key && it.sub) jump = line;
      if (it.kind === "say") line += it.beats.length; else if (it.kind === "ask") line += 1;
    });
    if (jump >= 0) setFocus(f => ({ ...f, [activeStage]: jump }));
  }

  useEffect(() => {
    if (!flat.length) return;
    const el = document.querySelector(`[data-line="${activeStage}-${focusIdx}"]`);
    if (el) el.scrollIntoView({ block:"center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [focusIdx, activeStage]);

  useEffect(() => { setTipsOpen(false); setWatchOpen(false); }, [activeStage]);

  async function generateDebrief() {
    if (!callTranscript.trim()) return;
    setDebriefLoading(true);
    setOutputs(o => ({ ...o, debrief:"" }));
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1500, system:DISCOVERY_CONTEXT,
          messages:[{ role:"user", content:`You are coaching an enterprise AE using Chris Orlob's exact discovery framework from pclub.io. Analyze this call transcript and give a specific, honest debrief. Do not be generic. Reference exact moments from the transcript by quoting what was said.

TRANSCRIPT:
${callTranscript}

PREP BRIEF (if available):
${prepBrief || "None"}

Analyze against these specific criteria. For each one, state: what happened (or didn't), quote the exact moment from the transcript, and give the precise corrective script they should have used.

1. BUYER JOURNEY DIAGNOSIS — Did they identify whether the buyer was latent pain, active pain, or actively evaluating from their opening language? Did they ask the diagnostic question ("what motivated you to reach out / what made you agree to take this call")?

2. PEELING THE ONION — Did they accept the first answer or did they keep going? Did they ask "what is going on in your business that's driving this to be a priority?" Did they use the "aside from ___" template to ask the same question twice naturally? Did they find the need behind the need — the CFO-worthy problem — or did they stop at the symptom?

3. CFO ACID TEST — Would a CFO fund the problem they uncovered? Is it a symptom (gets ghosted) or a problem (gets funded)? Quote the exact statement from the transcript and call it.

4. BASELINE — Did they get a metric? Did they ask "what metric is below expectations as a result of the challenges you've shared with me?" Did they get the current state number, the expected number, and the trajectory? No metric = no business case.

5. SUMMARIZE BEFORE TRANSITION — Did they summarize in the buyer's exact words before moving to a new topic? Did they use "let me see if I've understood you so far... did I get that right?" How many questions did they ask in a row without summarizing?

6. VALIDATE PRIORITY — Did they ask "is this the challenge we should anchor our conversations to, or did I lead you somewhere you only mildly care about?" Once per call. Did it happen?

7. FUTURE STATE — Did they ask the 365-day question: "Imagine we started working together today. Put yourself 365 days from now — what would have to be true for you to feel good about the progress we've made?" Did they quantify the desired state? Did they build the value delta between current and desired?

8. SOFTENING LANGUAGE — Did they use T-ups before hard follow-up questions? ("This is going to sound redundant, but..." / "If the question I'm about to ask comes across as overbearing...") Or did questions feel like an interrogation?

9. NO LOGO CHALLENGE — Based on what was uncovered, could someone identify this company from the problem description alone? Rate 1-5. If below 4, what specific information is still missing?

10. WHAT TO DO DIFFERENTLY NEXT CALL — Give 2-3 specific actions with exact scripts. Not general advice. Exact words to say.

Be direct. Be specific. Quote the transcript. This rep is trying to get better and needs real feedback, not encouragement.` }] }),
      });
      const data = await res.json();
      setOutputs(o => ({ ...o, debrief: data.content?.[0]?.text || "Failed." }));
    } catch { setOutputs(o => ({ ...o, debrief:"Generation failed." })); }
    setDebriefLoading(false);
  }

  async function generateFixPlan() {
    if (!callTranscript.trim()) return;
    setFixPlanLoading(true);
    setOutputs(o => ({ ...o, fixplan:"" }));
    try {
      const debriefContext = outputs.debrief ? `\n\nDEBRIEF ALREADY RUN:\n${outputs.debrief}` : "";
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:2400, system: DISCOVERY_CONTEXT,
          messages:[{ role:"user", content:`You are an enterprise sales coach. Based on this transcript, tell me EXACTLY what to do to fix and advance this deal. Be surgical. No fluff.

TRANSCRIPT:
${callTranscript}
${debriefContext}

PREP BRIEF (if available):
${prepBrief || "None"}

Give me five sections:

1. EMAIL TO SEND TODAY
Write the full subject line and email body. Rules: reference ONE specific thing they said — not a summary of everything. Do not list "next steps" like a CRM update. Do not say "as discussed" or "per our conversation" or "excited to work together." Do not open with "Hope this finds you well." Write it the way a sharp rep texts a contact they actually like — direct, specific, a little personality. The goal is to show you actually listened and make them want to reply. Three sentences max for the body, then one clear ask.

2. AGENDA FOR NEXT CALL
What are the first 3 things I say when the call starts? What specific discovery gaps do I need to fill — give me the exact questions word for word. What must I get them to say out loud before I can move forward?

3. WHAT TO SHOW IN THE DEMO
Based on their specific situation from this call, what should I actually show in the demo? Map each part of the demo directly to something THEY said. Be specific to this account — not a generic demo list.

4. MULTITHREAD — WHO ELSE I NEED TO BE TALKING TO
This deal dies if I only have one contact. Based on everything in this transcript:
- Who else at this company should be in the conversation? (Name the likely titles — economic buyer, end user, IT, legal, finance — and WHY each one matters for this specific deal)
- What's my ask to my current contact to get introduced? Give me the exact words — a one-sentence ask that doesn't feel like I'm going around them.
- What's the risk if I don't multithread, specific to this account? What scenario ends the deal?
- Who is most likely the real economic buyer and what do I know about their priorities from this call?

5. DEAL RISK + HOW TO DE-RISK IT
What are the 1-2 things most likely to kill this deal beyond single-threading? For each one, give me the exact words to say on the next call to get ahead of it.

CRITICAL LANGUAGE RULES for every script in this output:
- Do NOT write ROI calculator questions. "What would your team do with that time back?" is banned. "How does that translate to more business for you?" is banned. These sound like a sales training video and every prospect hates them.
- Do NOT lead with your product's value prop. Never say "if we could cut your time from X to Y" as a way to set up a question — that's pitching, not asking.
- Do NOT write rhetorical questions designed to get a yes. "Wouldn't it be great if..." is banned.
- Do NOT use phrases like "best bang for your buck," "game-changer," "solution," "streamline," or "leverage."
- Write like a human who listened carefully and is genuinely curious, not like someone running a play. Short sentences. Acknowledge their reality first. Then ask from curiosity.
- The best scripts sound like something you'd say to a colleague you respect — not something you'd read off a card.

Use their actual language from the transcript. Make every line actionable. This is for the AE to read 5 minutes before the next call.` }] }),
      });
      const data = await res.json();
      setOutputs(o => ({ ...o, fixplan: data.content?.[0]?.text || "Failed." }));
    } catch { setOutputs(o => ({ ...o, fixplan:"Generation failed." })); }
    setFixPlanLoading(false);
  }

  async function generateOutput(type) {
    setOutputLoading(type);
    const captured = Object.values(CAPTURE).flat().filter(f => (captures[f.key] || "").trim()).map(f => `${f.label}: ${captures[f.key]}`);
    const allNotes = [...captured, ...Object.entries(notes).filter(([,v])=>v).map(([k,v])=>k+": "+v)].join("\n");
    const prompts = {
      spiced:`Filled SPICED + next step for this deal.\nPrep: ${prepBrief||"None"}\nBuyer path: ${buyerPath||"unknown"}\nNotes:\n${allNotes}\nUse their exact words. S=situation, P=need behind the need+root cause, I=metric+cost of inaction, C=timeline+trajectory+dissatisfaction, D=decision process. Recommend next step with What/Who/Why.`,
      email:`Post-discovery follow-up email for this prospect.\nPrep: ${prepBrief||"None"}\nNotes:\n${allNotes}\nRules: Reference ONE specific thing they said — not a summary. No "as discussed," no "per our conversation," no "hope this finds you well," no bullet-point next steps list. Do not open with a compliment. Do not say "excited to work together" or "looking forward to the journey." Write it the way a sharp rep messages a contact they actually like — direct, a little personality, three sentences max, one clear ask. Make them want to reply.`,
      score:`Score this discovery call out of 100.\nPrep: ${prepBrief||"None"}\nNotes:\n${allNotes}\nBuyer path: ${buyerPath||"unknown"}\nScore /20 each: 1) ROE set + buyer journey diagnosed 2) Need behind the need uncovered (not just symptoms) 3) Current state baselined with metric+trajectory 4) Future state quantified with value delta 5) Next step secured with What/Who/Why. Top 3 failure modes. 3 coaching actions for next call.`,
      whatweheard:`Create a 'What We Heard' slide.\nPrep: ${prepBrief||"None"}\nNotes:\n${allNotes}\n\nFormat:\nCURRENT STATE: [problem in their exact words + metric suffering + current measurement]\nNEED BEHIND THE NEED: [underlying business problem + why it matters]\nDESIRED STATE: [what good looks like 365 days from now + target metric]\nVALUE DELTA: [current vs desired metric — calculate financial gap if possible]\nNO LOGO TEST: [could someone identify this company from this description alone? Rate 1-5 and explain]\nThis opens the next meeting.`,
    };
    try {
      const res = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:DISCOVERY_CONTEXT, messages:[{ role:"user", content:prompts[type] }] }),
      });
      const data = await res.json();
      setOutputs(o => ({ ...o, [type]:data.content?.[0]?.text || "Failed." }));
    } catch { setOutputs(o => ({ ...o, [type]:"Generation failed." })); }
    setOutputLoading("");
  }



  function copyText(t) { navigator.clipboard.writeText(t); }

  // Live transcript analysis
  async function analyzeLiveTranscript(transcript) {
    const cards = Object.entries(cardRegistry.current);
    if (!cards.length || !transcript.trim()) return;
    setLiveAnalyzing(true);
    try {
      const cardList = cards.map(([key, label]) => `${key}|||${label}`).join('\n');
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: 'You analyze sales call transcripts to determine which discovery topics have been covered. Be conservative — only mark something covered if it was clearly discussed.',
          messages: [{ role: 'user', content: `Which of these discovery card topics were clearly covered in the transcript below? A topic is covered if it was asked OR organically answered by the prospect.

TRANSCRIPT:
${transcript}

CARDS (cardKey|||label):
${cardList}

Return ONLY a JSON array of cardKeys that were clearly covered. Example: ["current-state-2", "business-problem-0"]
If nothing is covered yet, return [].` }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || '';
      const match = raw.match(/\[[\s\S]*?\]/);
      if (match) {
        const coveredKeys = JSON.parse(match[0]);
        if (Array.isArray(coveredKeys) && coveredKeys.length > 0) {
          setCoveredCards(s => {
            const next = { ...s };
            coveredKeys.forEach(k => { if (next[k] !== false) next[k] = true; });
            return next;
          });
        }
      }
    } catch(e) { console.error('live analyze error', e); }
    setLiveAnalyzing(false);
  }

  useEffect(() => {
    if (!liveMode) return;
    setLiveStatus("Connecting to bridge...");
    async function poll() {
      try {
        const res = await fetch('http://localhost:3001/transcript');
        if (!res.ok) { setLiveStatus(`Bridge error: HTTP ${res.status}`); return; }
        const data = await res.json();
        if (data.error) { setLiveStatus(`Bridge error: ${data.error}`); return; }
        if (!data.transcript) { setLiveStatus(`Connected — no transcript yet (is Granola recording?)`); return; }
        setLiveMeetingTitle(data.title || '');
        setLiveLastPoll(new Date());
        const chars = data.transcript.length;
        if (chars <= liveLastLength.current + 200) {
          setLiveStatus(`Listening — ${data.title?.slice(0,30) || 'meeting'} — ${data.segments} segments, no new content`);
        } else {
          liveLastLength.current = chars;
          setLiveStatus(`New transcript — analyzing ${data.segments} segments...`);
          await analyzeLiveTranscript(data.transcript);
          setLiveStatus(`✓ Analysis done — ${data.segments} segments, next check in 30s`);
        }
      } catch(e) {
        setLiveStatus(`Can't reach bridge — is "node bridge.js" running? (${e.message})`);
      }
    }
    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [liveMode]);

  async function parseBrief() {
    const combinedText = [prepBrief, questionnaireText].filter(s => s.trim()).join("\n\n---\n\n");
    if (!combinedText.trim()) return;
    setBriefParsing(true);
    setBriefParseStatus("");
    try {
      const res = await fetch("/api/claude", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:600,
          system:"You extract structured fields from sales prep briefs and questionnaire answers. Only populate fields that are EXPLICITLY stated — do not infer or guess. Return ONLY a valid JSON object, no markdown, no explanation.",
          messages:[{ role:"user", content:`Extract ONLY explicitly stated fields from the text below (may include a prep brief and/or questionnaire answers separated by ---). If something is not clearly written, use "". Do not infer, guess, or calculate.

Return a JSON object with these keys:
- prospect: first names of the people on the call, comma-separated (explicit)
- company: the health system or organization name (explicit)
- role: their exact job titles (explicit)
- signals: specific things noticed about them, e.g. a new site opening, sign-ons on their careers page
- systemSize: hospitals, clinics, beds or employee count if stated
- roles: hard-to-fill clinical or allied health roles named (e.g. RNs, imaging techs, PT/OT)
- turnover: first-year or overall turnover numbers if stated
- signOns: sign-on bonuses offered, with amounts if stated
- contract: contract labor / traveler usage if stated
- benefits: current tuition reimbursement or student loan benefits if stated
- schools: school or clinical program partnerships if stated
- decision: who decides and how, if explicitly described
- pain: one sentence summary of their stated pain

TEXT:
${combinedText}` }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || "";
      if (!raw) { setBriefParseStatus("error: no response — " + JSON.stringify(data).slice(0,100)); setBriefParsing(false); return; }
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) { setBriefParseStatus("error: couldn't parse JSON from: " + raw.slice(0,80)); setBriefParsing(false); return; }
      const json = JSON.parse(match[0]);
      setBriefFields(prev => {
        const merged = { ...prev };
        Object.keys(merged).forEach(k => { if (json[k]) merged[k] = json[k]; });
        return merged;
      });
      setBriefParseStatus("ok");
    } catch(e) {
      setBriefParseStatus("error: " + e.message);
    }
    setBriefParsing(false);
  }

  function renderTreePicker() {
    return (
      <div>
        <div style={{ fontSize:14, color:C.textMuted, marginBottom:24, lineHeight:1.7 }}>
          Tap the pain that's the raging fire. You heard it while they were talking — this is where you go deep.
        </div>
        {TREES.length === 0 && (
          <div style={{ padding:"28px 24px", borderRadius:12, border:`1.5px dashed ${C.border}`, background:C.sand, textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.textSecondary, marginBottom:8 }}>No pain trees yet</div>
            <div style={{ fontSize:13, color:C.textMuted, lineHeight:1.7 }}>Add your pain trees to the <span style={{ fontFamily:"monospace", background:"#eef0f3", padding:"1px 6px", borderRadius:4 }}>TREES</span> array in <span style={{ fontFamily:"monospace", background:"#eef0f3", padding:"1px 6px", borderRadius:4 }}>src/App.jsx</span> — one per pain, each with situation / pain / impact / critical / decision question sets.</div>
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {TREES.map(tree => (
            <button
              key={tree.id}
              onClick={() => { setSelectedTree(tree.id); setActiveStage("tree"); }}
              style={{ ...B, textAlign:"left", padding:"18px 20px", borderRadius:12, border:`1.5px solid ${C.border}`, background:C.white, transition:"border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.emerald}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary, marginBottom:5, lineHeight:1.3 }}>{tree.label}</div>
              <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>{tree.sub}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderTree() {
    const tree = TREES.find(t => t.id === selectedTree);
    if (!tree) return (
      <div style={{ color:C.textMuted, fontSize:14 }}>
        No tree selected. <button onClick={() => setActiveStage("business-problem")} style={{ ...B, color:C.emerald, background:"none", border:"none", fontWeight:600 }}>← Go back</button>
      </div>
    );

    const sectionStyles = [
      { key:"situation",  label:"S — Situation",       sub:"Map their process. Understand the context.",                  accent:"#2563eb", bg:"#eef3ff", border:"#bccdf5" },
      { key:"pain",       label:"P — Pain",             sub:"Find the need behind the need. Don't stop at the symptom.",   accent:C.emerald, bg:C.emeraldLight, border:C.emeraldMid,
        transition: "Summarize before you go deeper — \"Let me see if I've got this right — [their exact words]. Did I catch that?\"" },
      { key:"impact",     label:"I — Impact",           sub:"Quantify — metric, ripple effects, cost of inaction.",        accent:"#a07820", bg:"#fdf7e6", border:"#c09818",
        transition: "Validate the priority — \"Before we keep going — is this the challenge we should anchor our whole conversation to, or did I lead you somewhere you only mildly care about?\"" },
      { key:"critical",   label:"C — Critical Event",   sub:"Why now? What happens if this doesn't get solved?",           accent:"#3b82c4", bg:"#eef3ff", border:"#7ba3f0",
        transition: "Summarize impact before timing — \"So just to make sure I have the full picture — [your impact summary]. Does that feel right?\"" },
      { key:"decision",   label:"D — Decision",         sub:"Who decides, how, and what are the hurdles?",                 accent:"#1d4ed8", bg:"#eef3ff", border:"#7ba3f0",
        transition: "Bridge to process — \"I really appreciate you sharing all of that. Anything I missed before I ask a few questions about how decisions like this typically get made?\"" },
    ];
    const layers = sectionStyles.map(s => tree[s.key] || []);

    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24, padding:"12px 16px", borderRadius:10, background:C.emeraldLight, border:`1.5px solid ${C.emeraldMid}` }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.emerald, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:3 }}>Raging fire</div>
            <div style={{ fontSize:17, fontWeight:700, color:C.textPrimary }}>{tree.label}</div>
          </div>
          <button onClick={() => setActiveStage("business-problem")} style={{ ...B, fontSize:11, color:C.textMuted, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 12px", fontWeight:600 }}>← change</button>
        </div>

        {sectionStyles.map((section, si) => (
          <div key={si} style={{ marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:800, color:section.accent, textTransform:"uppercase", letterSpacing:"0.08em" }}>{section.label}</div>
              <div style={{ fontSize:12, color:C.textMuted }}>{section.sub}</div>
            </div>
            {section.transition && (
              <div style={{ marginBottom:12, padding:"9px 14px", borderRadius:8, background:"#fffbf0", border:"1px solid #e8d080", display:"flex", gap:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:10, fontWeight:700, color:"#9a7010", letterSpacing:"0.07em", textTransform:"uppercase", flexShrink:0, marginTop:1 }}>Transition</span>
                <div style={{ fontSize:12, color:"#7a5808", lineHeight:1.6, fontStyle:"italic" }}>{section.transition}</div>
              </div>
            )}
            {layers[si].map((item, i) => {
              const cardKey = `${tree.id}-${section.key}-${i}`;
              const isEditing = editingKey === cardKey;
              const baseText = item.lead ? `${item.lead} ${item.text}` : item.text;
              const displayText = scriptEdits[cardKey] !== undefined ? scriptEdits[cardKey] : baseText;
              const isCustomized = scriptEdits[cardKey] !== undefined;
              return (
                <div key={i} style={{ marginBottom:10, padding:"14px 18px", borderRadius:10, background:section.bg, border:`1.5px solid ${section.border}`, position:"relative" }}>
                  {isEditing ? (
                    <>
                      <textarea
                        value={scriptEdits[cardKey] !== undefined ? scriptEdits[cardKey] : baseText}
                        onChange={e => setScriptEdits(s => ({ ...s, [cardKey]: e.target.value }))}
                        style={{ width:"100%", boxSizing:"border-box", minHeight:90, fontSize:14, lineHeight:1.7, border:`1px solid ${section.border}`, borderRadius:6, padding:"8px 10px", fontFamily:"'Inter', system-ui, sans-serif", resize:"vertical", background:"#fff", color:C.textPrimary }}
                        autoFocus
                      />
                      <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
                        <button onClick={() => setEditingKey(null)} style={{ ...B, fontSize:11, padding:"4px 14px", borderRadius:5, background:section.accent, color:"#fff", border:"none", fontWeight:700 }}>Save</button>
                        <button onClick={() => { if (!isCustomized) setScriptEdits(s => { const n={...s}; delete n[cardKey]; return n; }); setEditingKey(null); }} style={{ ...B, fontSize:11, padding:"4px 12px", borderRadius:5, background:"none", border:`1px solid ${section.border}`, color:C.textMuted, fontWeight:600 }}>Cancel</button>
                        {isCustomized && (
                          <button onClick={() => { setScriptEdits(s => { const n={...s}; delete n[cardKey]; return n; }); setEditingKey(null); }} style={{ ...B, fontSize:11, padding:"4px 12px", borderRadius:5, background:"none", border:"1px solid #ffb0b0", color:"#c44848", fontWeight:600 }}>Reset</button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize:15, color:C.textPrimary, lineHeight:1.85, fontWeight:400, paddingRight:36 }}>&ldquo;{displayText}&rdquo;</div>
                      {coachingVisible && item.note && (
                        <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${section.border}`, fontSize:12, color:section.accent, lineHeight:1.6 }}>{item.note}</div>
                      )}
                      <button
                        onClick={() => { setScriptEdits(s => s[cardKey] !== undefined ? s : { ...s, [cardKey]: item.text }); setEditingKey(cardKey); }}
                        style={{ ...B, position:"absolute", top:10, right:10, fontSize:10, padding:"2px 8px", borderRadius:4, background:"none", border:`1px solid ${section.border}`, color:C.textMuted, fontWeight:600, opacity: isCustomized ? 1 : 0.55 }}
                        title={isCustomized ? "Edited — click to change" : "Edit this script"}
                      >{isCustomized ? "✎ edited" : "edit"}</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  const Collapsible = ({ label, isOpen, onToggle, accent, children }) => (
    <div style={{ marginTop:12, marginBottom:10, borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden", background:C.white }}>
      <button onClick={onToggle} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 18px", background:C.white, border:"none", textAlign:"left" }}>
        <span style={{ fontSize:12, fontWeight:700, color:accent, letterSpacing:"0.08em", textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontSize:18, color:accent, fontWeight:700 }}>{isOpen?"−":"+"}</span>
      </button>
      {isOpen && <div style={{ padding:"16px 18px 18px", background:C.white }}>{children}</div>}
    </div>
  );

  function RhythmCard({ r, idx, prefix }) {
    const typeAccent = {
      say: C.yellowText,
      ask: C.emerald,
      wallow: "#2563eb",
      segue: "#7a5808",
      summarize: "#b07a14",
      validate: "#2563eb",
      transition: "#2563eb",
    };
    const typeTag = { wallow:"Wallow", segue:"Segue", summarize:"Summarize", validate:"Validate", transition:"Transition" };
    const accent = typeAccent[r.type] || C.emerald;
    const text = r.text || "";
    const body = r.alts
      ? <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {r.alts.map((alt, i) => (
            <div key={i}>
              {i > 0 && <div style={{ display:"flex", alignItems:"center", gap:10, margin:"2px 0 10px", fontSize:10, fontWeight:800, letterSpacing:"0.14em", color:C.textMuted }}><span style={{ flex:1, height:1, background:C.border }} />OR<span style={{ flex:1, height:1, background:C.border }} /></div>}
              <Script text={alt.replace(/^— OR —\n/, "")} size={18} resolve={resolveToken} />
            </div>
          ))}
        </div>
      : <Script text={text} size={19} resolve={resolveToken} followups />;
    const cardKey = `${prefix}-${idx}`;
    cardRegistry.current[cardKey] = r.label; // register for live transcript analysis
    const isCovered = coveredCards[cardKey] === true;
    const label = cleanLabel(r.label);
    const toggleCovered = () => setCoveredCards(s => ({ ...s, [cardKey]: !s[cardKey] }));

    if (r.type === "say") return (
      <div className="card" style={{ marginBottom:14, background:C.yellow, border:`1px solid ${C.yellowBorder}`, borderRadius:12, padding:"18px 22px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <span style={{ fontSize:10, fontWeight:800, color:C.yellowText, letterSpacing:"0.12em", textTransform:"uppercase" }}>Say</span>
          {label && <span style={{ fontSize:12, fontWeight:600, color:C.yellowText, opacity:0.8 }}>{label}</span>}
        </div>
        <Script text={text} size={20} resolve={resolveToken} />
        {r.note && coachingVisible && (
          <div style={{ marginTop:12, fontSize:13, color:C.yellowText, lineHeight:1.6, background:"rgba(255,255,255,0.6)", padding:"10px 14px", borderRadius:8 }}>{r.note}</div>
        )}
      </div>
    );

    const qNum = /^Q(\d+)/.exec(r.label || "")?.[1] || /^(\d+)\s*[—-]/.exec(r.label || "")?.[1];
    const tag = typeTag[r.type];
    return (
      <div className="card" style={{ marginBottom:10, display:"flex", gap:14, padding:"16px 18px", background:C.white, border:`1px solid ${C.border}`, borderRadius:12, opacity: isCovered ? 0.45 : 1, transition:"opacity 0.15s" }}>
        <button onClick={toggleCovered} title={isCovered ? "Mark as not asked" : `Mark as asked${qNum ? ` (key ${qNum})` : ""}`}
          style={{ ...B, flexShrink:0, width:30, height:30, borderRadius:"50%", marginTop:1, border:`1.5px solid ${isCovered ? C.emerald : accent+"55"}`, background:isCovered ? C.emerald : C.white, color:isCovered ? "#fff" : accent, fontSize:13, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>
          {isCovered ? "✓" : (qNum || "•")}
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, minHeight:18 }}>
            {tag && <span style={{ fontSize:10, fontWeight:800, color:accent, letterSpacing:"0.1em", textTransform:"uppercase" }}>{tag}</span>}
            {label && <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</span>}
            <div style={{ flex:1 }} />
            {!noteOpen[cardKey] && (
              <button className="ctl" onClick={() => setNoteOpen(s => ({ ...s, [cardKey]: true }))} style={{ ...B, fontSize:11, padding:"2px 8px", borderRadius:5, border:`1px solid ${C.border}`, background:C.white, color:C.textMuted, fontWeight:600 }}>
                {notes[cardKey] ? "✎ note" : "＋ note"}
              </button>
            )}
          </div>
          {body}
          {r.note && coachingVisible && (
            <div style={{ marginTop:10, fontSize:13, color:C.textSecondary, lineHeight:1.6, background:C.sand, padding:"9px 13px", borderRadius:8, borderLeft:`2px solid ${accent}60` }}>{r.note}</div>
          )}
          {notes[cardKey] && !noteOpen[cardKey] && (
            <div onClick={() => setNoteOpen(s => ({ ...s, [cardKey]: true }))} style={{ marginTop:10, fontSize:13, color:"#1d4ed8", background:"#eef3ff", padding:"7px 12px", borderRadius:7, cursor:"pointer", lineHeight:1.5 }}>
              {notes[cardKey]}
            </div>
          )}
          {noteOpen[cardKey] && (
            <textarea
              autoFocus
              defaultValue={notes[cardKey] || ""}
              onBlur={e => {
                const val = e.target.value.trim();
                if (!val) setNotes(s => { const n={...s}; delete n[cardKey]; return n; });
                else setNotes(s => ({ ...s, [cardKey]: val }));
                setNoteOpen(s => ({ ...s, [cardKey]: false }));
              }}
              placeholder="What did they say?"
              rows={2}
              style={{ marginTop:10, width:"100%", fontSize:14, padding:"8px 12px", border:"1.5px solid #7ba3f0", borderRadius:8, background:"#fff", color:C.textPrimary, resize:"none", boxSizing:"border-box", fontFamily:"inherit", outline:"none" }}
            />
          )}
        </div>
      </div>
    );
  }

  function noteControls(cardKey) {
    return {
      button: !noteOpen[cardKey] && (
        <button className="ctl" onClick={e => { e.stopPropagation(); setNoteOpen(s => ({ ...s, [cardKey]: true })); }} style={{ ...B, fontSize:11, padding:"2px 8px", borderRadius:5, border:`1px solid ${C.border}`, background:C.white, color:C.textMuted, fontWeight:600 }}>
          {notes[cardKey] ? "✎ note" : "＋ note"}
        </button>
      ),
      body: <>
        {notes[cardKey] && !noteOpen[cardKey] && (
          <div onClick={e => { e.stopPropagation(); setNoteOpen(s => ({ ...s, [cardKey]: true })); }} style={{ marginTop:10, fontSize:14, color:"#1d4ed8", background:"#eef3ff", padding:"7px 12px", borderRadius:7, cursor:"pointer", lineHeight:1.5 }}>{notes[cardKey]}</div>
        )}
        {noteOpen[cardKey] && (
          <textarea autoFocus defaultValue={notes[cardKey] || ""} onClick={e => e.stopPropagation()}
            onBlur={e => {
              const val = e.target.value.trim();
              if (!val) setNotes(s => { const n = { ...s }; delete n[cardKey]; return n; });
              else setNotes(s => ({ ...s, [cardKey]: val }));
              setNoteOpen(s => ({ ...s, [cardKey]: false }));
            }}
            placeholder="What did they say?" rows={2}
            style={{ marginTop:10, width:"100%", fontSize:14, padding:"8px 12px", border:"1.5px solid #7ba3f0", borderRadius:8, background:"#fff", color:C.textPrimary, resize:"none", fontFamily:"inherit", outline:"none" }} />
        )}
      </>,
    };
  }

  // The live script for a stage: spoken beats in a "Say" pane, then question cards.
  // One line at a time is "on" (Space advances); finished lines dim.
  function renderStageScript(stageId, handoff = true) {
    let line = -1;
    let lastGroup = null;
    const groupHeader = item => {
      if (!item.group || item.group === lastGroup) return null;
      lastGroup = item.group;
      const chosen = item.group === captures.startArea;
      return (
        <div key={`g-${item.group}`} style={{ display:"flex", alignItems:"center", gap:10, margin:"18px 2px 10px" }}>
          <span style={{ fontSize:12, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color: chosen ? C.emerald : C.textSecondary }}>{item.group}</span>
          {chosen && <span style={{ fontSize:10, fontWeight:700, color:C.emerald, background:C.emeraldLight, borderRadius:99, padding:"2px 8px" }}>Their pick</span>}
          <span style={{ flex:1, height:1, background:C.border }} />
        </div>
      );
    };
    const lineState = i => i === focusIdx ? "now" : i < focusIdx ? "done" : "next";
    return (
      <div>
        {script.map((item, i) => {
          if (item.kind === "picker") return (
            <div key={i} style={{ margin:"-4px 0 14px", padding:"14px 16px", borderRadius:14, background:C.white, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:C.textMuted, marginBottom:10 }}>{item.label}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:10 }}>
                {item.options.map(o => {
                  const on = captures[item.key] === o.value;
                  return (
                    <button key={o.value} onClick={e => { e.stopPropagation(); pickSub(item.key, o.value); }}
                      style={{ ...B, textAlign:"left", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${on ? C.emerald : C.border}`, background:on ? C.emerald : C.white, color:on ? "#fff" : C.textPrimary, boxShadow:on ? "0 4px 14px rgba(37,99,235,0.25)" : "none" }}>
                      <div style={{ fontSize:16, fontWeight:700, marginBottom:2 }}>{on ? "✓ " : ""}{o.value}</div>
                      <div style={{ fontSize:13, color:on ? "rgba(255,255,255,0.85)" : C.textMuted }}>{o.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
          if (item.kind === "say") return (
            <div key={i}>
            {groupHeader(item)}
            <div style={{ background:C.yellow, border:`1px solid ${C.yellowBorder}`, borderRadius:14, overflow:"hidden", marginBottom:14 }}>
              {item.title && (
                <div style={{ padding:"11px 18px 9px", fontSize:13, fontWeight:700, color:C.yellowText }}>{item.title}</div>
              )}
              {item.proof && (
                <div style={{ margin:"-2px 18px 10px", display:"flex", flexDirection:"column", gap:2 }}>
                  {item.proof.map((pf, k) => (
                    <div key={k} style={{ fontSize:12, lineHeight:1.45, color:C.textMuted }}>· {pf}</div>
                  ))}
                </div>
              )}
              {item.beats.map((beat, b) => {
                line++;
                const idx = line, st = lineState(idx);
                return (
                  <div key={b} data-line={`${stageId}-${idx}`} onClick={() => setFocusIdx(idx)}
                    style={{ cursor:"pointer", display:"grid", gridTemplateColumns:"116px minmax(0,1fr)", gap:18, padding:"14px 20px 14px 18px", borderTop:(b === 0 && !item.title && !item.proof) ? "none" : `1px solid ${C.yellowRule}`,
                      background: st === "now" ? C.white : "transparent", boxShadow: st === "now" ? `inset 4px 0 0 ${C.emerald}` : "none",
                      opacity: st === "done" ? 0.42 : 1, transition:"opacity 0.15s, background 0.15s" }}>
                    <div style={{ paddingTop:5 }}>
                      <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", lineHeight:1.3, color: st === "now" ? C.emerald : C.yellowText }}>
                        {st === "done" ? "✓ " : ""}{beat.cue}
                      </div>
                      
                    </div>
                    <div style={{ minWidth:0 }}>
                      {beat.text && <Script text={beat.text} size={20} resolve={resolveToken} />}
                      {beat.list && (
                        <div style={{ marginTop:beat.text ? 12 : 2, display:"flex", flexDirection:"column", gap:12 }}>
                          {beat.list.map((pt, k) => (
                            <div key={k} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                              <span style={{ flexShrink:0, width:22, height:22, marginTop:3, borderRadius:"50%", background:C.yellowRule, color:C.yellowText, fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{k + 1}</span>
                              <div style={{ minWidth:0 }}>
                                {pt.tag && <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase", color:C.yellowText, marginBottom:2 }}>{pt.tag}</div>}
                                <Script text={pt.text ?? pt} size={18} resolve={resolveToken} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {beat.then && <div style={{ marginTop:"0.6em" }}><Script text={beat.then} size={20} resolve={resolveToken} /></div>}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          );

          line++;
          const idx = line, st = lineState(idx);
          const qn = flat[idx].q;
          const cardKey = `${stageId}-q${qn}`;
          cardRegistry.current[`${stageId}-${qn}`] = item.label; // live transcript analysis
          const heard = coveredCards[`${stageId}-${qn}`] === true;
          const nc = noteControls(cardKey);
          const header = groupHeader(item);
          return (
            <div key={i}>
            {header}
            <div className="card" data-line={`${stageId}-${idx}`} onClick={() => setFocusIdx(idx)}
              style={{ cursor:"pointer", marginBottom:10, display:"flex", gap:16, padding:"16px 20px 18px 16px", background:C.white, borderRadius:12,
                border:`1px solid ${st === "now" ? C.emerald : C.border}`,
                boxShadow: st === "now" ? "0 0 0 3px rgba(37,99,235,0.12), 0 6px 18px rgba(16,24,40,0.06)" : "none",
                opacity: st === "done" ? 0.45 : 1, transition:"opacity 0.15s, box-shadow 0.15s" }}>
              <div style={{ flexShrink:0, width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800,
                background: st === "next" ? C.white : C.emerald, color: st === "next" ? C.emerald : "#fff", border:`1.5px solid ${st === "next" ? C.emeraldMid : C.emerald}` }}>
                {st === "done" ? "✓" : qn}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, minHeight:20 }}>
                  <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color: st === "now" ? C.emerald : C.textMuted }}>Ask · {item.label}</span>
                  {heard && <span style={{ fontSize:10, fontWeight:700, color:C.filledText, background:C.filledBg, borderRadius:99, padding:"1px 8px" }}>✓ heard on call</span>}
                  <div style={{ flex:1 }} />
                  {nc.button}
                </div>
                <Script text={item.text} size={20} resolve={resolveToken} followups />
                {nc.body}
              </div>
            </div>
            </div>
          );
        })}

        {stageId === "orient" && (
          <div style={{ marginTop:4, marginBottom:14, padding:"16px 18px", borderRadius:14, background:C.white, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:C.textMuted, marginBottom:12 }}>Where do they want to start?</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:10 }}>
              {[
                { a:"Pipeline", sub:"Bigger, stronger pipeline" },
                { a:"Labor cost", sub:"Less on sign-ons + contract labor" },
                { a:"Retention", sub:"Retain + grow current staff" },
                { a:"All three", sub:"Pipeline, then spend, then retention" },
              ].map(({ a, sub }) => {
                const on = captures.startArea === a;
                return (
                  <button key={a} onClick={() => { setCapture("startArea", a); setShowAllAreas(false); setFocus(f => ({ ...f, "value-drop": 0 })); setActiveStage("value-drop"); }}
                    style={{ ...B, textAlign:"left", padding:"14px 16px", borderRadius:12, border:`1.5px solid ${on ? C.emerald : C.border}`, background:on ? C.emerald : C.white, color:on ? "#fff" : C.textPrimary, boxShadow:on ? "0 4px 14px rgba(37,99,235,0.25)" : "none" }}>
                    <div style={{ fontSize:17, fontWeight:700, marginBottom:3 }}>{on ? "✓ " : ""}{a}</div>
                    <div style={{ fontSize:13, color:on ? "rgba(255,255,255,0.85)" : C.textMuted, lineHeight:1.4 }}>{sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {handoff && renderHandoff(stageId)}
      </div>
    );
  }

  function renderHandoff(stageId) {
    const done = focusIdx >= flat.length;
    const next = STAGES[currentIdx + 1];
    const nextData = next && STAGE_DATA[next.id];
    const nextFirst = nextData?.script[0];
    const nextPreview = nextFirst ? (nextFirst.kind === "say" ? nextFirst.beats[0].text : nextFirst.text) : "";
    return (
      <>
        {next && (
          <button onClick={() => setActiveStage(next.id)} data-line={`${stageId}-${flat.length}`}
            style={{ ...B, width:"100%", marginTop:8, textAlign:"left", display:"flex", alignItems:"center", gap:16, padding:"14px 18px", borderRadius:12,
              border:`1px ${done ? "solid" : "dashed"} ${done ? C.emerald : C.border}`, background: done ? C.emeraldLight : "transparent" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color: done ? C.emerald : C.textMuted, marginBottom:4 }}>
                {done ? "Stage done" : "Up next"} · {next.short}
              </div>
              {nextPreview && <div style={{ fontSize:15, color: done ? C.textPrimary : C.textMuted, lineHeight:1.45, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{renderInline(nextPreview.replace(/\n+/g, " "), resolveToken, "nx")}</div>}
            </div>
            <span style={{ fontSize:18, color: done ? C.emerald : C.textMuted }}>→</span>
          </button>
        )}
      </>
    );
  }

  function renderBuyerType() {
    const allPaths = [
      { path:"evaluating", border:"#bccdf5", bg:"#eef3ff", titleColor:"#2563eb", bodyColor:"#1d4ed8", badge:"#bccdf5", badgeText:"#1d4ed8", icon:"⚡", title:"Solution language", sub:'"We\'re looking for a product that can do X..." — Actively evaluating. Comparing solutions.', technique:"→ Go Back In Time" },
      { path:"active-pain", border:"#bcd0f7", bg:"#e9effe", titleColor:"#2563eb", bodyColor:"#1d4ed8", badge:"#2563eb", badgeText:"#fff", icon:"⚠", title:"Problem language", sub:'"We have a challenge with Y... Z is not where we want it..." — Active pain. Not yet solution-focused.', technique:"→ Symptoms → Problems" },
      { path:"latent", border:"#d4a830", bg:"#fdf7e6", titleColor:"#7a5808", bodyColor:"#6a4a08", badge:"#d4a830", badgeText:"#7a5808", icon:"◎", title:"Vague or can\'t remember", sub:'"You said something that caught my attention..." — Latent pain. Dormant. Not top of mind.', technique:"→ Discovery Prompter" },
    ];
    const visiblePaths = callSource === "inbound" ? allPaths.filter(p=>p.path!=="latent") : allPaths;

    if (!buyerPath) return (
      <div style={{ marginBottom:28 }}>
        {!callSource ? (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", margin:"28px 0 10px", paddingTop:20, borderTop:`1px solid ${C.border}` }}>Diagnose the buyer — how did this call originate?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <button onClick={()=>setCallSource("inbound")} style={{ ...B, width:"100%", padding:"14px 18px", border:`1px solid ${C.border}`, borderRadius:12, background:C.white, textAlign:"left" }}>
                <div style={{ fontSize:12, fontWeight:800, color:C.emerald, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Inbound</div>
                <div style={{ fontSize:15, color:C.textPrimary, lineHeight:1.5, fontWeight:500 }}>"So what brought you to the table today — what made this worth exploring?"</div>
              </button>
              <button onClick={()=>setCallSource("outbound")} style={{ ...B, width:"100%", padding:"14px 18px", border:`1px solid ${C.border}`, borderRadius:12, background:C.white, textAlign:"left" }}>
                <div style={{ fontSize:12, fontWeight:800, color:C.emerald, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:6 }}>Outbound</div>
                <div style={{ fontSize:15, color:C.textPrimary, lineHeight:1.5, fontWeight:500 }}>"I know we reached out to you first, so this might sound like a funny question — but I'm curious, what made you agree to take the call?"</div>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ margin:"28px 0 16px", padding:"10px 16px", borderRadius:10, background:C.emeraldLight, border:`1px solid ${C.emeraldMid}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:14, fontWeight:600, color:callSource==="inbound"?"#2563eb":"#2563eb" }}>
              {callSource==="inbound" ? "Inbound — What motivated you to reach out?" : "Outbound — What made you agree to take this call?"}
            </div>
            <button onClick={()=>setCallSource(null)} style={{ ...B, fontSize:11, color:C.textMuted, background:"transparent", border:`1px solid ${C.border}`, borderRadius:5, padding:"3px 10px" }}>change</button>
          </div>
        )}
        {callSource && (
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>What did their answer sound like?</div>
            <div style={{ display:"grid", gridTemplateColumns:`repeat(${visiblePaths.length}, 1fr)`, gap:10 }}>
              {visiblePaths.map(opt=>(
                <button key={opt.path} onClick={()=>setBuyerPath(opt.path)} style={{ ...B, padding:"14px 16px", border:`1px solid ${C.border}`, borderTop:`3px solid ${opt.border}`, borderRadius:12, background:C.white, textAlign:"left" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:opt.titleColor, marginBottom:6 }}>{opt.icon} {opt.title}</div>
                  <div style={{ fontSize:13, color:C.textSecondary, lineHeight:1.55, marginBottom:10 }}>{opt.sub}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:opt.titleColor, background:opt.badge, padding:"3px 10px", borderRadius:6, display:"inline-block" }}>{opt.technique}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    const pathLabel = buyerPath==="evaluating"?"⚡ Actively Evaluating":buyerPath==="active-pain"?"⚠ Active Pain":"◎ Latent Pain";
    const pathColor = buyerPath==="evaluating"?"#2563eb":buyerPath==="active-pain"?C.emerald:"#7a5808";

    return (
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", margin:"28px 0 14px", paddingTop:20, borderTop:`1px solid ${C.border}` }}>
          <div style={{ fontSize:13, fontWeight:700, color:pathColor, letterSpacing:"0.06em", textTransform:"uppercase" }}>{pathLabel}</div>
          <button onClick={()=>{setBuyerPath(null);setCallSource(null);}} style={{ ...B, fontSize:12, color:C.textSecondary, background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 12px", fontWeight:600 }}>Change path</button>
        </div>

        {buyerPath === "evaluating" && <>
          {[
            { type:"ask", label:"1 — Reflect + wallow on requirements", text:"So it sounds like you're actively looking at solutions and you want to get a sense of whether we can help. Seems like a great place to start. Can you help me understand what else you're looking for in a product like ours?", note:"Reflect their solution language back. Then wallow. Get everything on the table before you go anywhere." },
            { type:"wallow", label:"2 — Keep wallowing", text:"What else? I want to make sure I focus on the right things. The good and bad thing about our platform is it can do a lot — and if anything is irrelevant to you I'd rather not spend energy there.", note:"Don't rush. Stay here 2-3 follow-ups minimum. Wallowing is what makes everything else feel earned." },
            { type:"summarize", label:"3 — Summarize requirements", text:"Okay so you're looking for [X, Y, Z]. Did I miss anything?", note:"Prove you listened. Give it back organized. If they add something — that's what mattered most." },
            { type:"ask", label:"4 — Accomplish question", text:"This might be a question you're tired of answering — but what are you looking to accomplish with capabilities like the ones you just listed?", note:"Bridges from solution requirements to business outcomes." },
            { type:"segue", label:"5 — Current state bridge", text:"Mind if I ask how you're getting along without those capabilities today? Everyone I talk to is getting by, maybe there's room for improvement — but you're still cruising I'm sure. What does that look like right now?", note:"Orlob segue — bridge from solution land to current reality." },
            { type:"ask", label:"6 — Go back in time", text:"This is going to sound like an odd pivot — but bear with me for a second.\n\nCan I go back in time with you for a second? It's clear you know what you want more than most people I talk to — which usually means something specific set this in motion. What was that moment for you?", note:"Always ask permission first. Short, no examples, no anchoring. Let them fill it." },
            { type:"summarize", label:"7 — Summarize before Current Process", text:"Let me see if I have this right so far. [Their exact words — what they're looking for, what they want to accomplish, and the original challenge.] Did I get that right?", note:"Their words — not yours. When they say that's right you have alignment." },
          ].map((r,i)=><RhythmCard key={i} r={r} idx={i} prefix="eval" />)}
          {coachingVisible && <div style={{ marginTop:16, background:"#fdf2f2", border:"1.5px solid #f3c9c9", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9b2c2c", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>⚠ Watch For</div>
            {["Asking about challenges before wallowing — they're in solution mode, don't fight it","Checking the box on wallow and rushing forward — stay there, 2-3 follow-ups minimum","Skipping 'can I go back in time' — that permission phrase must be said every time"].map((w,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:i<2?8:0 }}><span style={{ background:C.coral, color:C.white, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0, marginTop:2 }}>!</span><span style={{ fontSize:13, color:"#9b2c2c", lineHeight:1.65 }}>{w}</span></div>
            ))}
          </div>}
          <button onClick={()=>setActiveStage("baseline-current")} style={{ ...B, width:"100%", marginTop:14, padding:"14px 20px", background:C.emerald, border:"none", borderRadius:12, fontSize:15, fontWeight:700, color:"#fff", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>Summarize, then baseline the current state</span><span style={{ fontSize:18 }}>→</span>
          </button>
        </>}

        {buyerPath === "active-pain" && <>
          {[
            { type:"ask", label:"1 — Soft intro", text:"It sounds like there are some challenges going on in the business and you want to get a sense of whether our product might help. I'd love to have that conversation. Can you tell me a little more about what's going on?", note:"Warm, inviting, no pressure. Let them lead." },
            { type:"ask", label:"2 — Natural peeling", alts:["Ouch — what's that leading to?","And how long has that been going on?","What does that look like day to day?"], note:"No script needed. Just listen and follow. React genuinely." },
            { type:"ask", label:"3 — Need behind the need", alts:["🔵 Cold read — if they surfaced the driver:\n\"So it sounds like [what they said] is really what's driving this. Is that fair to say?\"","— OR —\n🟠 T-up 1 — if they haven't surfaced it:\n\"If the question I'm about to ask comes across as overbearing, feel free to kick me in the teeth. With that said — what's going on in the business that's driving this to make its way to your priority list?\"","— OR —\n🟡 T-up 2 — if you've already asked something similar:\n\"This is going to sound a little redundant. You could be focusing on any number of challenges, but I sense energy behind this one specifically. What's going on behind the scenes that has you focused on this above the others?\""], note:"Pick one. Never use more than one on the same call." },
            { type:"ask", label:"4 — Priority rank", text:"And look — you could be solving any number of things right now, I get it. But I do sense a lot of energy behind this one specifically. Where would you say it ranks on your priority list today?", note:"Gets them to commit to the priority without feeling interrogated." },
            { type:"ask", label:"5 — Cost of inaction", text:"And I don't want to be doom and gloom here — but I'm curious, what happens if other priorities pop up and this doesn't get fixed? I ask because it happens a lot — fires come up. What does that look like for you?", note:"Makes the invisible cost visible. Soften it first." },
            { type:"summarize", label:"6 — Summarize before Current Process", text:"Let me see if I have this right so far. [Their exact words — problem + business driver + what's at stake.] Did I get that right?", note:"Their words — not yours. When they say that's right you have alignment." },
          ].map((r,i)=><RhythmCard key={i} r={r} idx={i} prefix="active" />)}
          {coachingVisible && <div style={{ marginTop:16, background:"#fdf2f2", border:"1.5px solid #f3c9c9", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9b2c2c", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>⚠ Watch For</div>
            {["Jumping to process mapping before you have the business driver","Using both T-up versions back to back — pick one","Stopping at the symptom — the first answer is almost never the real problem"].map((w,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:i<2?8:0 }}><span style={{ background:C.coral, color:C.white, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0, marginTop:2 }}>!</span><span style={{ fontSize:13, color:"#9b2c2c", lineHeight:1.65 }}>{w}</span></div>
            ))}
          </div>}
          <button onClick={()=>setActiveStage("baseline-current")} style={{ ...B, width:"100%", marginTop:14, padding:"14px 20px", background:C.emerald, border:"none", borderRadius:12, fontSize:15, fontWeight:700, color:"#fff", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>Summarize, then baseline the current state</span><span style={{ fontSize:18 }}>→</span>
          </button>
        </>}

        {buyerPath === "latent" && <>
          <div style={{ fontSize:14, color:C.textSecondary, lineHeight:1.75, marginBottom:16, padding:"12px 16px", background:"#fdf7e6", borderRadius:10, border:"1.5px solid #c09818" }}>Their pain is dormant. Pushing it to the back of their mind. Questions tap into what's top of mind — and by definition, latent pain is not top of mind. Stories activate it. Your tool is the Discovery Prompter.</div>
          <div style={{ background:"#eef3ff", border:"1.5px solid #7ba3f0", borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#1d4ed8", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>Why they have latent pain — diagnose first</div>
            {["Ignorance — don't know a solution exists for what you solve","Rationalization — tried to solve it, failed, gave up and decided to live with it","Too many other priorities — it's buried under six other things","No pain — genuinely unqualified. Different from latent."].map((r,i)=>(
              <div key={i} style={{ display:"flex", gap:8, marginBottom:i<3?8:0 }}><span style={{ color:"#2b4fa3", fontSize:13, flexShrink:0, fontWeight:700 }}>{i+1}.</span><span style={{ fontSize:13, color:"#1c2f5e", lineHeight:1.6 }}>{r}</span></div>
            ))}
          </div>
          {[
            { type:"ask", label:"Set the agenda first — relieve their fatigue", text:'"Here\'s how I\'m thinking about the agenda. How about I spend the first few minutes walking you through the challenges we typically solve so you have some context for the rest of the conversation. And from there I\'ll pass the torch to you. Is that fair?"', note:"Many latent buyers come in expecting 20 bad discovery questions. This relieves them instantly. They hear 'I'll give you something before asking you anything' and relax. Now you've set up the Discovery Prompter." },
            { type:"ask", label:"Discovery Prompter — 6 steps (practice this 5-6 times first)", alts:[
              "1 — PROBLEM: \"Most of our customers before working with us were struggling with [pain statement — e.g. losing new-grad nurses in their first year, paying bigger sign-ons every year, and leaning on travelers to fill the gaps].\"",
              "2 — AGITATE: \"They were dealing with [articulate pain better than they can — e.g. paying a sign-on, then paying it again when the role turns over; competing with every system in town for the same graduating class].\"",
              "3 — FAILED ATTEMPTS: \"Before partnering with us, they had tried [traditional solutions — e.g. bigger sign-ons, tuition reimbursement, more travelers] but all of them fell short. So they gave up and assumed they'd have to live with it.\"",
              "4 — NEW APPROACH: \"When they met us, they realized we have a unique approach that gets at the source of the problem — [tease it lightly, don't go into feature detail].\"",
              "5 — POSITIVE OUTCOME: \"After rolling this out, most of our customers see [business outcome — e.g. single-digit turnover for clinicians in the program, fewer sign-ons and travelers]. In fact, [short customer story with a metric].\"",
              "6 — PASS THE TORCH: \"Anyway — enough about our customers. Help me understand the challenges you might be having when it comes to [problem area] that you'd like to see resolved.\"",
            ], note:"This is a PAIN story — not a success story. Step 3 (failed attempts) is the step most people skip and it's often the most important one — latent buyers have usually tried to solve this before. When you name it, they identify with it. Practice this 5-6 times before going live. It needs to feel conversational, not recited." },
            { type:"ask", label:"If it doesn't land — diagnose why", text:"If they don't respond with anything useful: either they don't have pain (not qualified), your narrative needs work (not hitting the mark), or you misdiagnosed — they might be in the evaluating path. Don't double down. Pivot to a direct question.", note:"Ask: 'Help me understand what's going on in your world when it comes to [area].' If still nothing — they may not be qualified. Better to know now." },
          ].map((r,i)=><RhythmCard key={i} r={r} idx={i} prefix="latent" />)}
          <div style={{ marginTop:16, background:"#fdf2f2", border:"1.5px solid #f3c9c9", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9b2c2c", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>⚠ Watch For</div>
            {["Telling a success story instead of a pain story — they need to see themselves in the struggle, not the outcome","Skipping Step 3 (failed attempts) — this is the step that makes them say 'that's exactly us'","Using the prompter on a warm buyer — you're overcomplicating it, go direct instead"].map((w,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:i<2?8:0 }}><span style={{ background:C.coral, color:C.white, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0, marginTop:2 }}>!</span><span style={{ fontSize:13, color:"#9b2c2c", lineHeight:1.65 }}>{w}</span></div>
            ))}
          </div>
          <button onClick={()=>setActiveStage("baseline-current")} style={{ ...B, width:"100%", marginTop:14, padding:"14px 20px", background:C.emerald, border:"none", borderRadius:12, fontSize:15, fontWeight:700, color:"#fff", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>Summarize, then baseline the current state</span><span style={{ fontSize:18 }}>→</span>
          </button>
        </>}
      </div>
    );
  }

const sd = STAGE_DATA[activeStage];

  const meta = STAGE_META[activeStage] || {};
  const timeboxMs = (parseInt(meta.timebox) || 0) * 60000;
  const stageElapsed = now - stageStart;
  const overTime = timeboxMs && stageElapsed > timeboxMs;
  const nextStage = STAGES[currentIdx + 1];
  const stageTitle = {"prep":"Pre-Call Prep Brief","rapport-opener":"Opening + Intros","rules-engagement":"Objective → Agenda → Decision","context":"Clasp Context","orient":"Orient to Buyer Focus","value-drop":"Value Drop: Talk Tracks","summary-buyin":"Summary + Buy-in","business-problem":"Identify + Validate the Business Problem","baseline-current":"Current State","cause-analysis":"Cause Analysis","negative-impact":"Build Negative Impact","future-state":"Future State","close-next-steps":"Close + Next Steps","outputs":"Outputs"}[activeStage];
  const stageSub = {"prep":"Who's on the call, and anything you spotted.","outputs":"Generate your end-of-call outputs."}[activeStage];
  const isNumbered = /^\d+$/.test(STAGES[currentIdx]?.icon || "");

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Inter', system-ui, sans-serif", background:C.pageBg, color:C.textPrimary, overflow:"hidden" }}>

      {/* SIDEBAR */}
      <div style={{ width:232, background:C.sidebar, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto" }}>
        <div style={{ padding:"20px 20px 14px", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:C.emerald, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800 }}>D</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:C.textPrimary, lineHeight:1.1 }}>Discovery</div>
            <div style={{ fontSize:11, color:C.textMuted, fontWeight:500 }}>Enterprise call track</div>
          </div>
        </div>

        <div style={{ flex:1, padding:"6px 10px" }}>
          {["setup","orient","value","discovery","close"].map(group => {
            const groupStages = STAGES.filter(s => s.group === group);
            const groupLabel = { setup:"Setup", orient:"Orient", value:"Value", discovery:"Discovery", close:"Close" }[group];
            return (
              <div key={group} style={{ marginBottom:14 }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase", padding:"0 10px", marginBottom:4 }}>{groupLabel}</div>
                {groupStages.map(s => {
                  const isActive = s.id === activeStage;
                  const idx = STAGES.findIndex(x => x.id === s.id);
                  const isPast = idx < currentIdx;
                  const tb = (STAGE_META[s.id] || {}).timebox;
                  return (
                    <button key={s.id} className={isActive ? "" : "navrow"} onClick={() => setActiveStage(s.id)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", gap:10, padding:"7px 10px", borderRadius:8, background:isActive ? C.emeraldLight : "transparent", border:"none", textAlign:"left", marginBottom:1 }}>
                      <span style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:s.icon.length > 1 ? 10 : 11, fontWeight:700,
                        background: isActive ? C.emerald : isPast ? "#dde3ea" : "transparent",
                        border: isActive || isPast ? "none" : `1.5px solid ${C.border}`,
                        color: isActive ? "#fff" : isPast ? C.textSecondary : C.textMuted }}>{s.icon}</span>
                      <span style={{ flex:1, fontSize:13, color:isActive ? "#1d4ed8" : isPast ? C.textSecondary : C.textPrimary, fontWeight:isActive ? 700 : 500, lineHeight:1.3 }}>{s.short}</span>
                      {tb && <span style={{ fontSize:10, color:isActive ? "#1d4ed8" : C.textMuted, fontWeight:600, flexShrink:0 }}>{tb.replace(" min","m")}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {buyerPath && (
          <div style={{ padding:"12px 20px 16px", borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.textMuted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.12em" }}>Buyer path</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:99, background:buyerPath==="latent"?"#fdf0d0":C.emeraldLight, color:buyerPath==="latent"?"#7a5808":"#1d4ed8" }}>
                {buyerPath==="evaluating"?"⚡ Evaluating":buyerPath==="active-pain"?"⚠ Active pain":"◎ Latent"}
              </span>
              <button onClick={()=>setBuyerPath(null)} style={{ ...B, fontSize:11, color:C.textMuted, background:"none", border:"none", textDecoration:"underline" }}>change</button>
            </div>
          </div>
        )}
        <div style={{ padding:"12px 20px 16px", borderTop:`1px solid ${C.border}` }}>
          <button onClick={() => confirmReset ? resetCall() : setConfirmReset(true)} onBlur={() => setConfirmReset(false)}
            style={{ ...B, width:"100%", padding:"8px 10px", borderRadius:8, fontSize:12, fontWeight:600, border:`1px solid ${confirmReset ? C.coralBorder : C.border}`, background:confirmReset ? C.coralLight : C.white, color:confirmReset ? C.coralText : C.textSecondary }}>
            {confirmReset ? "Click again to clear this call" : "New call"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

        {/* TOP BAR */}
        <div style={{ padding:"12px 24px 12px 32px", borderBottom:`1px solid ${C.border}`, background:C.white, display:"flex", alignItems:"center", flexWrap:"wrap", gap:"8px 16px", flexShrink:0 }}>
          <div style={{ flex:"1 1 240px", minWidth:0 }}>
            <div style={{ fontSize:22, fontWeight:700, color:C.textPrimary, letterSpacing:"-0.02em", lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{stageTitle}</div>
            {stageSub && <div style={{ fontSize:13, color:C.textMuted, marginTop:2 }}>{stageSub}</div>}
          </div>

          {/* CLOCKS */}
          {timeboxMs > 0 && (
            <div title="Time on this stage vs. timebox" style={{ textAlign:"right", padding:"4px 12px", borderRadius:8, background:overTime ? "#fff7ed" : C.sand, border:`1px solid ${overTime ? "#fed7aa" : C.border}` }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:overTime ? C.amber : C.textMuted }}>{overTime ? "Over" : "Stage"}</div>
              <div style={{ fontSize:16, fontWeight:700, fontVariantNumeric:"tabular-nums", color:overTime ? C.amber : C.textPrimary }}>{fmtClock(stageElapsed)}<span style={{ color:C.textMuted, fontWeight:500 }}> / {fmtClock(timeboxMs)}</span></div>
            </div>
          )}
          {callStart && (
            <button onClick={() => setCallStart(Date.now())} title="Call clock — click to restart" style={{ ...B, textAlign:"right", padding:"4px 12px", borderRadius:8, background:C.sand, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.textMuted }}>Call</div>
              <div style={{ fontSize:16, fontWeight:700, fontVariantNumeric:"tabular-nums", color:C.textPrimary }}>{fmtClock(now - callStart)}</div>
            </button>
          )}

          <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
            <button disabled={currentIdx === 0} onClick={()=>setActiveStage(STAGES[currentIdx-1].id)} title="Previous" style={{ ...B, fontSize:16, width:38, height:38, border:`1px solid ${C.border}`, borderRadius:8, background:C.white, color:C.textSecondary, fontWeight:600, opacity:currentIdx === 0 ? 0.4 : 1 }}>←</button>
            {nextStage && <button onClick={()=>setActiveStage(nextStage.id)} title="Next" style={{ ...B, height:38, padding:"0 16px", border:"none", borderRadius:8, background:C.emerald, color:C.white, fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>
              <span style={{ opacity:0.75, fontWeight:600 }}>Next</span><span className="hide-narrow">{nextStage.short}</span><span style={{ fontSize:16 }}>→</span>
            </button>}
          </div>
        </div>

        {/* OVER TIME NUDGE */}
        {overTime && nextStage && (
          <div style={{ padding:"8px 32px", background:"#fff7ed", borderBottom:"1px solid #fed7aa", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
            <span style={{ fontSize:14, fontWeight:700, color:C.amber }}>Over time.</span>
            <span style={{ fontSize:14, color:C.textPrimary, flex:1 }}>Land the next check-in and move on.</span>
            <button onClick={()=>setActiveStage(nextStage.id)} style={{ ...B, fontSize:13, fontWeight:700, padding:"6px 14px", borderRadius:8, border:"none", background:C.amber, color:C.white, whiteSpace:"nowrap" }}>
              Go to {nextStage.short} →
            </button>
          </div>
        )}

        {/* LIVE STATUS BAR */}
        {liveMode && (
          <div style={{ padding:"6px 32px", background: liveStatus.startsWith("Can't") || liveStatus.startsWith("Bridge error") ? "#fdf2f2" : "#f0f5ff", borderBottom:`1px solid ${liveStatus.startsWith("Can't") || liveStatus.startsWith("Bridge error") ? "#f3c9c9" : "#bccdf5"}`, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background: liveStatus.startsWith("Can't") || liveStatus.startsWith("Bridge error") ? C.coral : "#2563eb", display:"inline-block", flexShrink:0, animation:"pulse 1.5s infinite" }} />
            <span style={{ fontSize:12, color: liveStatus.startsWith("Can't") || liveStatus.startsWith("Bridge error") ? C.coralText : "#1d4ed8", fontWeight:500 }}>{liveStatus}</span>
            {liveLastPoll && !liveStatus.startsWith("Can't") && <span style={{ fontSize:11, color:"#1d4ed8", marginLeft:"auto" }}>Last checked {liveLastPoll.toLocaleTimeString()}</span>}
          </div>
        )}

        {/* BODY */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
          <div ref={scrollRef} style={{ flex:1, overflowY:"auto", padding:"24px 32px 40px" }}>
          <div style={{ maxWidth:860, margin:"0 auto" }}>

            {/* PREP */}
            {activeStage === "prep" && (() => {
              const field = f => (
                <div key={f.key} style={f.wide ? { gridColumn:"1 / -1" } : {}}>
                  <label htmlFor={`brief-${f.key}`} style={{ display:"block", fontSize:11, color:C.textMuted, fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.08em" }}>{f.label}</label>
                  <input id={`brief-${f.key}`} value={briefFields[f.key] || ""} onChange={e => setBriefFields(s => ({ ...s, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width:"100%", fontSize:15, padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8, background:C.white, color:C.textPrimary, outline:"none", fontFamily:"inherit" }} />
                </div>
              );
              const card = { background:C.white, border:`1px solid ${C.border}`, borderRadius:14, marginBottom:12 };
              const toggle = (open, set, title, sub) => (
                <button onClick={() => set(v => !v)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", background:"none", border:"none", textAlign:"left" }}>
                  <span><span style={{ fontSize:15, fontWeight:700, color:C.textPrimary }}>{title}</span>{sub && <span style={{ fontSize:13, color:C.textMuted, marginLeft:10 }}>{sub}</span>}</span>
                  <span style={{ fontSize:16, color:C.textMuted, transform: open ? "rotate(180deg)" : "none", transition:"transform 0.2s" }}>▾</span>
                </button>
              );
              return (
                <div style={{ marginBottom:28 }}>
                  <div style={{ ...card, padding:"18px 20px 20px" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary, marginBottom:4 }}>Who's on the call</div>
                    <div style={{ fontSize:13, color:C.textMuted, marginBottom:16 }}>These fill the script.</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      {[
                        { key:"prospect", label:"Prospect name(s)", placeholder:"e.g. Jane, Sam" },
                        { key:"company",  label:"Their organization", placeholder:"e.g. Acme Health" },
                        { key:"colleague", label:"Your colleague on the call", placeholder:"Leave blank if it's just you" },
                        { key:"signals",  label:"What you spotted", placeholder:"e.g. new rehab site, sign-ons on careers page" },
                      ].map(field)}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:14 }}>
                      <span style={{ fontSize:11, color:C.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginRight:4 }}>How they came in</span>
                      {["Inbound","Outbound"].map(o => {
                        const on = briefFields.source === o;
                        return (
                          <button key={o} onClick={() => setBriefFields(f => ({ ...f, source: on ? "" : o }))}
                            style={{ ...B, fontSize:13, fontWeight:700, padding:"7px 16px", borderRadius:8, border:`1px solid ${on ? C.emerald : C.border}`, background: on ? C.emerald : C.white, color: on ? C.white : C.textPrimary }}>
                            {on ? "✓ " : ""}{o}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={card}>
                    {toggle(prepOpen, setPrepOpen, "More intel", "Brief, auto-fill, and account details")}
                    {prepOpen && (
                      <div style={{ padding:"0 20px 20px", display:"flex", flexDirection:"column", gap:16 }}>
                        <div>
                          <label htmlFor="prep-brief" style={{ display:"block", fontSize:11, color:C.textMuted, fontWeight:700, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.08em" }}>Prep brief or questionnaire answers</label>
                          <textarea id="prep-brief" value={prepBrief} onChange={e=>setPrepBrief(e.target.value)} rows={6}
                            placeholder={"CALL BRIEF: [Organization] — [Date]\nContacts, titles, inbound / outbound\nSystem size, new sites, hard-to-fill roles\nSign-ons, turnover, contract labor signals\nTuition / loan benefits, school partnerships"}
                            style={{ width:"100%", fontSize:14, lineHeight:1.6, padding:"10px 12px", border:`1px solid ${C.border}`, borderRadius:8, background:C.sand, color:C.textPrimary, resize:"vertical", fontFamily:"inherit", outline:"none" }} />
                          <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:8 }}>
                            <button onClick={parseBrief} disabled={briefParsing || !prepBrief.trim()} style={{ ...B, fontSize:13, padding:"8px 14px", borderRadius:8, border:"none", background: !prepBrief.trim() ? C.sand : C.emerald, color: !prepBrief.trim() ? C.textMuted : "#fff", fontWeight:700 }}>
                              {briefParsing ? "Reading…" : "Auto-fill fields from brief"}
                            </button>
                            {briefParseStatus === "ok" && <span style={{ fontSize:13, color:C.filledText, fontWeight:600 }}>✓ Fields filled</span>}
                            {briefParseStatus.startsWith("error") && <span style={{ fontSize:12, color:C.coralText }}>Couldn't read the brief. Fill the fields by hand.</span>}
                          </div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                          {[
                            { key:"role",       label:"Their roles",          placeholder:"e.g. VP Talent Acquisition, Dir. of Nursing" },
                            { key:"systemSize", label:"System size",          placeholder:"e.g. 6 hospitals, 12k employees" },
                            { key:"roles",      label:"Hard-to-fill roles",   placeholder:"e.g. new-grad RNs, imaging techs, PT/OT" },
                            { key:"turnover",   label:"First-year turnover",  placeholder:"e.g. ~25% for new-grad RNs" },
                            { key:"signOns",    label:"Sign-on bonuses",      placeholder:"e.g. $15k RN sign-on" },
                            { key:"contract",   label:"Contract labor",       placeholder:"e.g. travelers in ICU nights" },
                            { key:"benefits",   label:"Tuition / loan benefits", placeholder:"e.g. tuition reimbursement only" },
                            { key:"schools",    label:"School partnerships",  placeholder:"e.g. rotations with local BSN program" },
                            { key:"decision",   label:"Decision process",     placeholder:"e.g. CHRO and CFO sign off" },
                            { key:"pain",       label:"Known pain",           placeholder:"e.g. losing new-grad nurses in year one" },
                          ].map(field)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={card}>
                    {toggle(tipsOpen, setTipsOpen, "Pre-call reminders", "Read them before you dial")}
                    {tipsOpen && (
                      <div style={{ padding:"0 20px 20px", display:"flex", flexDirection:"column", gap:14, fontSize:14, color:C.textSecondary, lineHeight:1.55 }}>
                        <div><b style={{ color:C.textPrimary }}>Say "glad we found the time" — then stop.</b> Their response tells you whether to linger on small talk or get to business. Don't thank them for their time.</div>
                        <div><b style={{ color:C.textPrimary }}>Strong suggestion, loosely held.</b> Propose the agenda and the next step, and give them room to change it.</div>
                        <div><b style={{ color:C.textPrimary }}>Their words, not yours.</b> Summarize every few questions using their exact language, then ask "Did I get that right?"</div>
                        <div><b style={{ color:C.textPrimary }}>Give a reason before a hard question.</b> "The reason I ask is…" makes the uncomfortable ones land.</div>
                        <div><b style={{ color:C.textPrimary }}>Read them in the first minute.</b> I/me/my means personal stakes; we/us/our means consensus. If they volunteer a frustration, that's the center.</div>
                        <div><b style={{ color:C.textPrimary }}>Value = three things.</b> A painful, measurable current state; a compelling, measurable future state; Clasp as the bridge.</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* LIVE SCRIPT */}
            {sd && (
              <div>
                {renderStageScript(activeStage, activeStage !== "business-problem")}
              </div>
            )}
            {activeStage === "business-problem" && renderHandoff(activeStage)}


            {/* OUTPUTS */}
            {activeStage === "outputs" && (
              <div>
                <div style={{ background:"#fdf7e6", border:"1.5px solid #c09818", borderRadius:12, padding:"16px 20px", marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#a07820", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>No Logo Challenge — before you generate</div>
                  <div style={{ fontSize:14, color:"#7a5a10", lineHeight:1.75 }}>Could someone read your description of this customer's problem and identify the company — without seeing the logo? If it describes every company on the planet, you haven't gone deep enough. That specificity is the acid test of good discovery.</div>
                </div>
                {/* CALL DEBRIEF */}
                <div style={{ background:C.white, border:`2px solid ${C.emerald}`, borderRadius:14, padding:26, marginBottom:18 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:C.textPrimary, marginBottom:4 }}>Post-Call Debrief</div>
                  <div style={{ fontSize:14, color:C.textMuted, marginBottom:18, lineHeight:1.6 }}>Paste your Granola transcript. Get specific coaching on exactly what you missed and what to say differently next time — referenced against the Orlob framework.</div>
                  <textarea
                    value={callTranscript}
                    onChange={e => setCallTranscript(e.target.value)}
                    placeholder="Paste your Granola transcript here... (e.g. 0:00 | Tyler — hey how's it going...)"
                    style={{ width:"100%", minHeight:160, fontSize:14, lineHeight:1.75, padding:"14px 16px", border:`1.5px solid ${C.border}`, borderRadius:10, background:"#f7f8fa", color:C.textPrimary, resize:"vertical", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none", marginBottom:14 }}
                  />
                  <button
                    onClick={generateDebrief}
                    disabled={debriefLoading || !callTranscript.trim()}
                    style={{ ...B, fontSize:14, padding:"11px 26px", border:"none", borderRadius:8, background:debriefLoading||!callTranscript.trim()?C.emeraldLight:C.emerald, color:debriefLoading||!callTranscript.trim()?C.emerald:C.white, fontWeight:700 }}>
                    {debriefLoading ? "Analyzing call..." : "Run Debrief ↗"}
                  </button>
                  {outputs.debrief && (
                    <div style={{ marginTop:20 }}>
                      <div style={{ fontSize:15, color:C.textSecondary, lineHeight:1.9, whiteSpace:"pre-wrap", borderTop:`1px solid ${C.border}`, paddingTop:16 }}>{outputs.debrief}</div>
                    </div>
                  )}
                </div>

                {/* FIX PLAN */}
                <div style={{ background:C.white, border:`2px solid #1d4ed8`, borderRadius:14, padding:26, marginBottom:18 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: outputs.fixplan ? 0 : 0 }}>
                    <div>
                      <div style={{ fontSize:18, fontWeight:700, color:C.textPrimary, marginBottom:4 }}>Deal Fix Plan</div>
                      <div style={{ fontSize:14, color:C.textMuted, lineHeight:1.6 }}>Email to send today, next call agenda, what to demo, and how to de-risk — all mapped to what they actually said.</div>
                    </div>
                    <button
                      onClick={generateFixPlan}
                      disabled={fixPlanLoading || !callTranscript.trim()}
                      style={{ ...B, fontSize:14, padding:"10px 22px", border:"none", borderRadius:8, background:fixPlanLoading||!callTranscript.trim()?"#eef3ff":"#1d4ed8", color:fixPlanLoading||!callTranscript.trim()?"#1d4ed8":"#fff", fontWeight:700, flexShrink:0, marginLeft:16 }}>
                      {fixPlanLoading ? "Building plan..." : "Fix This Deal ↗"}
                    </button>
                  </div>
                  {outputs.fixplan && (
                    <div style={{ marginTop:20 }}>
                      <div style={{ fontSize:15, color:C.textSecondary, lineHeight:1.9, whiteSpace:"pre-wrap", borderTop:"1px solid #dfe8fa", paddingTop:16 }}>{outputs.fixplan}</div>
                    </div>
                  )}
                </div>

                {[
                  { key:"whatweheard", label:"What We Heard Slide", desc:"Current state + metric + need behind the need + desired state + value delta. Opens every subsequent meeting." },
                  { key:"spiced", label:"SPICED Summary + Next Step", desc:"Filled discovery summary using their words, with recommended next step" },
                  { key:"email", label:"Follow-up Email", desc:"Ready to send — their words, no corporate speak" },
                  { key:"score", label:"Call Score + Coaching", desc:"Score out of 100 across 5 dimensions with gap analysis and coaching actions" },
                ].map(o=>(
                  <div key={o.key} style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:26, marginBottom:18 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                      <div><div style={{ fontSize:18, fontWeight:700, color:C.textPrimary }}>{o.label}</div><div style={{ fontSize:14, color:C.textMuted, marginTop:4 }}>{o.desc}</div></div>
                      <button onClick={()=>generateOutput(o.key)} disabled={!!outputLoading} style={{ ...B, fontSize:14, padding:"10px 22px", border:"none", borderRadius:8, background:outputLoading===o.key?C.emeraldLight:C.emerald, color:outputLoading===o.key?C.emerald:C.white, fontWeight:700, flexShrink:0 }}>
                        {outputLoading===o.key?"Generating...":"Generate ↗"}
                      </button>
                    </div>
                    {outputs[o.key] && (
                      <div>
                        <div style={{ fontSize:15, color:C.textSecondary, lineHeight:1.85, whiteSpace:"pre-wrap", borderTop:`1px solid ${C.border}`, paddingTop:16, marginTop:4 }}>{outputs[o.key]}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}


          </div>
          </div>

          </div>

          {/* RIGHT — CAPTURE, QUESTION BANK, ROI */}
          <div style={{ width:rightPanelOpen?340:44, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, background:C.white, transition:"width 0.2s ease" }}>

            {!rightPanelOpen && (
              <button onClick={()=>setRightPanelOpen(true)} title="Open capture pane" style={{ ...B, flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:12, paddingTop:16, background:"transparent", border:"none", color:C.textMuted }}>
                <span style={{ fontSize:16, fontWeight:700 }}>←</span>
                <span style={{ writingMode:"vertical-rl", fontSize:11, fontWeight:700, letterSpacing:"0.14em", textTransform:"uppercase" }}>Capture</span>
              </button>
            )}

            {rightPanelOpen && <>
            <div style={{ display:"flex", alignItems:"stretch", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
              {[
                { id:"capture",    label:"Capture" },
                { id:"spiced",     label:"Backup questions" },
                { id:"answers",    label:"Quick answers" },
              ].map(t => (
                <button key={t.id} onClick={()=>setRightTab(t.id)} style={{ ...B, flex:1, padding:"13px 4px 11px", fontSize:12, fontWeight:700, letterSpacing:"0.04em", border:"none", borderBottom: rightTab===t.id ? `2px solid ${C.emerald}` : "2px solid transparent", background:"transparent", color: rightTab===t.id ? C.emerald : C.textMuted, marginBottom:-1 }}>
                  {t.label}
                </button>
              ))}
              <button onClick={()=>setRightPanelOpen(false)} title="Collapse pane" style={{ ...B, width:40, border:"none", borderLeft:`1px solid ${C.border}`, background:"transparent", color:C.textMuted, fontSize:15, fontWeight:700 }}>→</button>
            </div>

            {/* CAPTURE TAB */}
            {rightTab === "capture" && (() => {
              const fields = CAPTURE[activeStage] || [];
              const stageName = STAGES[currentIdx]?.short;
              const capturedGroups = STAGES.map(st => ({ st, items:(CAPTURE[st.id] || []).filter(f => (captures[f.key] || "").trim()) })).filter(g => g.items.length && g.st.id !== activeStage);
              const label = { fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:C.textMuted, marginBottom:6 };
              const input = { width:"100%", fontSize:14, lineHeight:1.45, padding:"8px 11px", border:`1px solid ${C.border}`, borderRadius:8, background:C.sand, color:C.textPrimary, resize:"none", fontFamily:"inherit", outline:"none" };
              return (
                <div style={{ overflowY:"auto", flex:1, padding:"18px 18px 28px", display:"flex", flexDirection:"column", gap:20 }}>
                  {coachingVisible && sd && (sd.tips || sd.watch) && (
                    <div style={{ borderRadius:10, border:`1px solid ${C.emeraldMid}`, background:"#f5f8ff", padding:"12px 14px", display:"flex", flexDirection:"column", gap:10 }}>
                      <div style={{ ...label, color:C.emerald, marginBottom:0 }}>Coach</div>
                      {(sd.tips || []).map((t,i) => <div key={i} style={{ fontSize:13, color:C.textSecondary, lineHeight:1.5 }}>{t}</div>)}
                      {sd.watch && <div style={{ display:"flex", flexDirection:"column", gap:6, paddingTop:8, borderTop:`1px solid ${C.emeraldMid}` }}>
                        <div style={{ ...label, color:C.coralText, marginBottom:0 }}>Watch for</div>
                        {sd.watch.map((w,i) => <div key={i} style={{ fontSize:13, color:C.coralText, lineHeight:1.5 }}>{w}</div>)}
                      </div>}
                    </div>
                  )}

                  {fields.length > 0 && (
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary }}>{stageName}</div>
                      {fields.map(f => (
                        <div key={f.key}>
                          <label htmlFor={`cap-${f.key}`} style={{ ...label, display:"block" }}>{f.label}</label>
                          {f.type === "choice"
                            ? <div style={{ display:"flex", gap:6 }}>
                                {f.options.map(o => {
                                  const on = captures[f.key] === o;
                                  return <button key={o} id={`cap-${f.key}-${o}`} onClick={() => setCapture(f.key, on ? "" : o)} style={{ ...B, flex:1, padding:"7px 0", borderRadius:8, fontSize:13, fontWeight:600, border:`1px solid ${on ? C.emerald : C.border}`, background:on ? C.emerald : C.white, color:on ? "#fff" : C.textSecondary }}>{o}</button>;
                                })}
                              </div>
                            : <textarea id={`cap-${f.key}`} rows={2} value={captures[f.key] || ""} onChange={e => setCapture(f.key, e.target.value)} placeholder={f.hint || ""} style={input} />}
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label htmlFor="stage-notes" style={{ ...label, display:"block" }}>{fields.length ? "Other notes" : "Notes"}</label>
                    <textarea id="stage-notes" rows={fields.length ? 3 : 6} value={stageNote} onChange={e=>setNotes(n=>({...n,[activeStage]:e.target.value}))} placeholder="Their exact words, numbers, names…" style={input} />
                  </div>

                  {capturedGroups.length > 0 && (
                    <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16, display:"flex", flexDirection:"column", gap:12 }}>
                      <div style={label}>Heard so far</div>
                      {capturedGroups.map(({ st, items }) => (
                        <button key={st.id} onClick={() => setActiveStage(st.id)} style={{ ...B, textAlign:"left", background:"transparent", border:"none", padding:0, display:"flex", flexDirection:"column", gap:4 }}>
                          <span style={{ fontSize:11, fontWeight:700, color:C.emerald }}>{st.icon}. {st.short}</span>
                          {items.map(f => (
                            <span key={f.key} style={{ fontSize:13, color:C.textSecondary, lineHeight:1.45 }}><span style={{ color:C.textMuted }}>{f.label}: </span>{captures[f.key]}</span>
                          ))}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* QUICK ANSWERS TAB */}
            {rightTab === "answers" && (
              <div style={{ overflowY:"auto", flex:1 }}>
                <div style={{ padding:"16px 20px 10px", fontSize:13, color:C.textMuted, lineHeight:1.5 }}>When they ask, open the question for a short answer.</div>
                {QUICK_ANSWERS.map((qa, i) => {
                  const isOpen = openAnswer === i;
                  return (
                    <div key={i} style={{ borderTop:`1px solid ${C.border}` }}>
                      <button onClick={()=>setOpenAnswer(isOpen ? null : i)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, padding:"14px 20px", background:isOpen?C.sand:"transparent", border:"none", textAlign:"left" }}>
                        <span style={{ fontSize:13, fontWeight:700, color:isOpen?C.emerald:C.textPrimary }}>{qa.q}</span>
                        <span style={{ fontSize:14, color:isOpen?C.emerald:C.textMuted, fontWeight:700 }}>{isOpen?"▲":"▼"}</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding:"4px 20px 16px", background:C.sand, borderTop:`1px solid ${C.border}`, fontSize:14, color:C.textPrimary, lineHeight:1.6 }}>
                          {renderInline(qa.a, resolveToken)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* QUESTION BANK TAB */}
            {rightTab === "spiced" && (
              <div style={{ overflowY:"auto", flex:1 }}>
                <div style={{ padding:"16px 20px 10px", fontSize:13, color:C.textMuted, lineHeight:1.5 }}>If you get stuck, open a group for a question to try.</div>
                {QUESTION_BANK.map(s=>{
                  const isOpen = openSpiced === s.key;
                  return (
                    <div key={s.key} style={{ borderTop:`1px solid ${C.border}` }}>
                      <button onClick={()=>setOpenSpiced(isOpen?null:s.key)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", background:isOpen?C.sand:"transparent", border:"none", textAlign:"left" }}>
                        <span style={{ fontSize:13, fontWeight:700, color:isOpen?C.emerald:C.textPrimary }}>{s.label}</span>
                        <span style={{ fontSize:14, color:isOpen?C.emerald:C.textMuted, fontWeight:700 }}>{isOpen?"▲":"▼"}</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding:"4px 20px 16px", background:C.sand, borderTop:`1px solid ${C.border}` }}>
                          {s.questions.map((q,i)=>(
                            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:i<s.questions.length-1?12:0 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:C.emerald, marginTop:4, flexShrink:0 }}>→</span>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:14, color:C.textPrimary, lineHeight:1.55 }}>{q}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
