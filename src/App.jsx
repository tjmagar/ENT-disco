import { useState, useRef, useEffect } from "react";

const C = {
  pageBg: "#141e2b",
  panelBg: "#1a2738",
  border: "#263548",
  textPrimary: "#eef2f7",
  textSecondary: "#7d9ab5",
  textMuted: "#4d6478",
  black: "#0d1724",
  white: "#1a2738",
  sidebar: "#0d1724",
  emerald: "#4a9e78",
  emeraldLight: "#0f2b1e",
  emeraldMid: "#163d2a",
  coral: "#e05c5c",
  sand: "#1a2738",
};

const STAGES = [
  { id:"prep",             icon:"◎",  short:"Prep Brief",       group:"setup" },
  { id:"open",             icon:"①",  short:"Open",             group:"setup" },
  { id:"buyer-type",       icon:"②",  short:"Buyer Type",       group:"setup" },
  { id:"business-problem", icon:"1",  short:"Business Problem", group:"framework" },
  { id:"current-process",  icon:"2",  short:"Current State",    group:"framework" },
  { id:"cause-analysis",   icon:"3",  short:"Cause Analysis",   group:"framework" },
  { id:"negative-impact",  icon:"4",  short:"Negative Impact",  group:"framework" },
  { id:"future-state",     icon:"5",  short:"Future State",     group:"framework" },
  { id:"next-step",        icon:"⑦",  short:"Next Step",        group:"close" },
  { id:"outputs",          icon:"✦",  short:"Outputs",          group:"close" },
];

const SPICED_QUESTIONS = [
  {
    key:"situation",
    label:"S — Situation",
    color:"#5b8fd4",
    bg:"#111d30",
    border:"#1e3a5f",
    questions:[
      "How many people generate, send, track, or approve documents at your company?",
      "How many documents do you typically send out on a monthly or annual basis?",
      "What departments would be using a tool like PandaDoc?",
      "From the beginning of your process to the end — what documents are sent, how are they completed, and where are they stored?",
      "What solution are you using currently, if any?",
      "What CRM do you use?",
      "Are there any security or compliance requirements we need to account for?",
    ]
  },
  {
    key:"pain",
    label:"P — Pain",
    color:C.emerald,
    bg:C.emeraldLight,
    border:C.emeraldMid,
    questions:[
      "What is going on in your business that's driving this to be a priority?",
      "Aside from [what they said] — is there something going on behind the scenes driving you to prioritize fixing this?",
      "What's your take on why this is happening?",
      "Could you tell me about the moment when you realized this was actually a problem?",
      "What have you tried to do about it? Did it work?",
      "Is a solution like this a nice to have or a need to have?",
      "Out of everything you could have chosen to solve for — why this?",
    ]
  },
  {
    key:"impact",
    label:"I — Impact",
    color:"#d4a03a",
    bg:"#1c1a0e",
    border:"#7a6010",
    questions:[
      "What metric is below expectations as a result of the challenges you've shared with me?",
      "What are the ripple effects this challenge is having across the business?",
      "How much time are you spending each day dealing with this problem?",
      "How much do you think this has cost you?",
      "What is the potential impact on revenue if this isn't solved?",
      "Who else in your organization is aware of and affected by this issue?",
      "Have you lost clients because of these issues?",
    ]
  },
  {
    key:"critical_event",
    label:"C — Critical Event",
    color:"#d47aaa",
    bg:"#1e1020",
    border:"#6b2060",
    questions:[
      "When do you need this implemented by? What happens if we can't hit that timeline?",
      "Why now — not two months ago or two months from now?",
      "Would anything prevent your team from moving forward this month if you saw everything you needed?",
      "Is there a renewal, contract expiration, or hiring deadline driving the timing?",
      "I'm getting the sense this might not be the top priority right now — am I off on that?",
    ]
  },
  {
    key:"decision",
    label:"D — Decision",
    color:"#9a80e0",
    bg:"#16122a",
    border:"#4a3a9a",
    questions:[
      "What steps do you and your company need to take to make a go or no-go decision on this?",
      "Who would be involved in each of those steps — and who ultimately signs off?",
      "Who else cares about this besides you?",
      "How does your company typically purchase software?",
      "Whose budget would this come from?",
      "What are the possible hurdles you've had in the past getting a solution like this approved?",
      "What specific steps do we need to take to get your legal team to sign off?",
    ]
  },
];

const PANDADOC_CONTEXT = `You are an AI sales coach in a live PandaDoc SMB discovery call companion. Coach using Chris Orlob's framework from pclub.io.

VALUE SELLING = 3 things: 1) Painful measurable current state 2) Compelling measurable future state 3) Your product as the bridge.

PANDADOC: All-in-one document workflow. 50% reduction in doc creation time, 87% increase in closed deals/month, 36% increase in close rate, 20 min saved/contract via CRM auto-population. Core pains: manual proposals (30-45min→5min), no CRM integration, approval bottlenecks, no post-send visibility, inconsistent docs, slow e-sign.

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




export default function App() {
  const [activeStage, setActiveStage] = useState("prep");
  const [buyerPath, setBuyerPath] = useState(null);
  const [callSource, setCallSource] = useState(null);
  const [notes, setNotes] = useState({});
  const [prepBrief, setPrepBrief] = useState("");
  const [openSpiced, setOpenSpiced] = useState(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [outputs, setOutputs] = useState({ spiced:"", email:"", score:"", whatweheard:"", debrief:"" });
  const [outputLoading, setOutputLoading] = useState("");
  const [tipsOpen, setTipsOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState({});
  const [briefFields, setBriefFields] = useState({ prospect:"", company:"", role:"", tool:"", reps:"", volume:"", timePerDoc:"", metric:"", pain:"", integrations:"", approval:"" });
  const [coveredCards, setCoveredCards] = useState({});
  const [briefParsing, setBriefParsing] = useState(false);
  const [questionnaireText, setQuestionnaireText] = useState("");
  const [briefParseStatus, setBriefParseStatus] = useState("");
  const [roi, setRoi] = useState({ proposalsPerMonth:"", minsPerProposal:"", teamSize:"", hourlyRate:"75", pandadocTimeMins:"15" });
  const [rightTab, setRightTab] = useState("spiced"); // "spiced" | "enterprise" | "roi"
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [coachingVisible, setCoachingVisible] = useState(false);
  const [callTranscript, setCallTranscript] = useState("");
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [scriptEdits, setScriptEdits] = useState({}); // key -> edited text
  const [editingKey, setEditingKey] = useState(null);  // which card is in edit mode
  const currentIdx = STAGES.findIndex(s => s.id === activeStage);
  const stageNote = notes[activeStage] || "";
  const showOutputsShortcut = activeStage !== "outputs";
  const B = { fontFamily:"'Inter', system-ui, sans-serif", cursor:"pointer" };

  useEffect(() => { setTipsOpen(false); setWatchOpen(false); }, [activeStage]);

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' && currentIdx < STAGES.length - 1) setActiveStage(STAGES[currentIdx + 1].id);
      if (e.key === 'ArrowLeft' && currentIdx > 0) setActiveStage(STAGES[currentIdx - 1].id);
      // Number keys 1-9: toggle that card open/closed
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) {
        const cardIdx = n - 1;
        const prefix = activeStage === "buyer-type"
          ? (buyerPath === "evaluating" ? "eval" : buyerPath === "active-pain" ? "active" : "latent")
          : activeStage;
        const key = `${prefix}-${cardIdx}`;
        setCollapsedCards(s => {
          const currentOpen = s[key] !== undefined ? !s[key] : cardIdx === 0;
          return { ...s, [key]: currentOpen };
        });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIdx, activeStage, buyerPath]);

  async function generateDebrief() {
    if (!callTranscript.trim()) return;
    setDebriefLoading(true);
    setOutputs(o => ({ ...o, debrief:"" }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1500, system:PANDADOC_CONTEXT,
          messages:[{ role:"user", content:`You are coaching a PandaDoc AE using Chris Orlob's exact discovery framework from pclub.io. Analyze this call transcript and give a specific, honest debrief. Do not be generic. Reference exact moments from the transcript by quoting what was said.

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

  async function generateOutput(type) {
    setOutputLoading(type);
    const allNotes = Object.entries(notes).filter(([,v])=>v).map(([k,v])=>k+": "+v).join("\n");
    const prompts = {
      spiced:`Filled SPICED + next step for PandaDoc.\nPrep: ${prepBrief||"None"}\nBuyer path: ${buyerPath||"unknown"}\nNotes:\n${allNotes}\nUse their exact words. S=situation, P=need behind the need+root cause, I=metric+cost of inaction, C=timeline+trajectory+dissatisfaction, D=decision process. Recommend next step with What/Who/Why.`,
      email:`Post-discovery follow-up email for PandaDoc.\nPrep: ${prepBrief||"None"}\nNotes:\n${allNotes}\nGreeting + 4-5 word genuine callback. One sentence in their exact words. Bridge to next steps. Max 4 bullet next steps with dates. Sign off: Excited to tackle this together. No corporate speak.`,
      score:`Score this PandaDoc call out of 100.\nPrep: ${prepBrief||"None"}\nNotes:\n${allNotes}\nBuyer path: ${buyerPath||"unknown"}\nScore /20 each: 1) ROE set + buyer journey diagnosed 2) Need behind the need uncovered (not just symptoms) 3) Current state baselined with metric+trajectory 4) Future state quantified with value delta 5) Next step secured with What/Who/Why. Top 3 failure modes. 3 coaching actions for next call.`,
      whatweheard:`Create a 'What We Heard' slide for PandaDoc.\nPrep: ${prepBrief||"None"}\nNotes:\n${allNotes}\n\nFormat:\nCURRENT STATE: [problem in their exact words + metric suffering + current measurement]\nNEED BEHIND THE NEED: [underlying business problem + why it matters]\nDESIRED STATE: [what good looks like 365 days from now + target metric]\nVALUE DELTA: [current vs desired metric — calculate financial gap if possible]\nNO LOGO TEST: [could someone identify this company from this description alone? Rate 1-5 and explain]\nThis opens the next meeting.`,
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:PANDADOC_CONTEXT, messages:[{ role:"user", content:prompts[type] }] }),
      });
      const data = await res.json();
      setOutputs(o => ({ ...o, [type]:data.content?.[0]?.text || "Failed." }));
    } catch { setOutputs(o => ({ ...o, [type]:"Generation failed." })); }
    setOutputLoading("");
  }



  function copyText(t) { navigator.clipboard.writeText(t); }

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
- prospect: first name only (explicit)
- company: company name (explicit)
- role: their exact job title (explicit)
- tool: current doc/sign tool explicitly named
- reps: number of people sending docs — digits only e.g. "15", NOT words like "fifteen". Use "" if not a specific number
- volume: docs per month — digits only. Use "" if not stated
- timePerDoc: minutes per doc — digits only. Use "" if not stated
- metric: business metric they explicitly care about (e.g. "win rate"). Use "" if not stated
- integrations: tools explicitly mentioned for integration
- approval: approval process if explicitly described
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

  function fillTemplate(text) {
    let t = text;
    if (briefFields.metric)     t = t.replace(/\[metric they named\]/g, briefFields.metric);
    if (briefFields.reps)       t = t.replace(/\[X\] reps/g, `${briefFields.reps} reps`);
    if (briefFields.volume)     t = t.replace(/\[Y\] agreements a month/g, `${briefFields.volume} agreements a month`);
    if (briefFields.timePerDoc) t = t.replace(/\[Z\] minutes each/g, `${briefFields.timePerDoc} minutes each`).replace(/\[X minutes\]/g, `${briefFields.timePerDoc} minutes`);
    return t;
  }

  function getCardBriefValue(label) {
    const l = (label || "").toLowerCase();
    if (l.includes("4 —") || l.includes("current tool"))       return briefFields.tool;
    if (l.includes("2 —") || l.includes("time to build"))      return briefFields.timePerDoc ? `${briefFields.timePerDoc} min to build` : "";
    if (l.includes("3 —") || l.includes("who's involved")) {
      // Only show hint if we have BOTH team size and volume — one alone isn't the full picture
      if (!briefFields.reps || !briefFields.volume) return "";
      return `${briefFields.reps} reps, ${briefFields.volume} docs/mo`;
    }
    if (l.includes("integration"))   return briefFields.integrations;
    if (l.includes("approval"))      return briefFields.approval;
    if (l.includes("6 —") || l.includes("roi math")) {
      // Only auto-cover ROI if we have enough to actually compute math (reps + volume or reps + timePerDoc)
      const hasMinROI = briefFields.reps && (briefFields.volume || briefFields.timePerDoc);
      if (!hasMinROI) return "";
      const p = [briefFields.reps && `${briefFields.reps} reps`, briefFields.volume && `${briefFields.volume}/mo`, briefFields.timePerDoc && `${briefFields.timePerDoc} min each`, briefFields.metric && `→ ${briefFields.metric}`].filter(Boolean);
      return p.join(", ");
    }
    return "";
  }

  const Collapsible = ({ label, isOpen, onToggle, accent, children }) => (
    <div style={{ marginBottom:16, borderRadius:12, border:`1.5px solid ${accent}30`, overflow:"hidden" }}>
      <button onClick={onToggle} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", background:`${accent}12`, border:"none", textAlign:"left" }}>
        <span style={{ fontSize:13, fontWeight:700, color:accent, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontSize:18, color:accent, fontWeight:700 }}>{isOpen?"−":"+"}</span>
      </button>
      {isOpen && <div style={{ padding:"16px 18px 18px", background:C.white }}>{children}</div>}
    </div>
  );

  function RhythmCard({ r, idx, prefix }) {
    const typeAccent = {
      ask: C.emerald,
      wallow: "#5b8fd4",
      segue: "#c08a20",
      summarize: "#b07a14",
      validate: "#8060d0",
      transition: "#5b8fd4",
    };
    const typeTag = { ask:"Question", wallow:"Wallow", segue:"Segue", summarize:"Summarize", validate:"Validate", transition:"Transition" };
    const accent = typeAccent[r.type] || C.emerald;
    const tag = typeTag[r.type] || "Question";
    const rawText = r.text || (r.alts ? r.alts.join("\n\n— or —\n\n") : "");
    const text = fillTemplate(rawText);
    const cardKey = `${prefix}-${idx}`;
    const cardState = coveredCards[cardKey]; // true = manually marked, false = dismissed
    const isCovered = cardState === true;

    if (isCovered) return (
      <div style={{ marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 12px", borderRadius:8, background:"#0a1f15", border:"1px solid #1a4a30" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"#4a9e78", color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase", flexShrink:0 }}>✓</span>
          <span style={{ fontSize:13, fontWeight:700, color:"#4a9e78", fontStyle:"italic" }}>{r.label}</span>
        </div>
        <button onClick={() => setCoveredCards(s => ({ ...s, [cardKey]: false }))} style={{ ...B, fontSize:10, padding:"2px 8px", borderRadius:5, border:"1px solid #1a4a30", background:"transparent", color:"#2a7a50", fontWeight:600, flexShrink:0 }}>↩ unmark</button>
      </div>
    );

    return (
      <div style={{ marginBottom:20, paddingLeft:14, borderLeft:`2px solid ${accent}50` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:10, fontWeight:700, padding:"2px 9px", borderRadius:99, background:accent, color:"#fff", letterSpacing:"0.06em", textTransform:"uppercase", flexShrink:0 }}>{tag}</span>
            <span style={{ fontSize:15, fontWeight:800, color:"#f2deb8", letterSpacing:"-0.02em", fontStyle:"italic" }}>{r.label}</span>
          </div>
          <button onClick={() => setCoveredCards(s => ({ ...s, [cardKey]: true }))} style={{ ...B, fontSize:10, padding:"2px 8px", borderRadius:5, border:`1px solid ${C.border}`, background:"transparent", color:C.textMuted, fontWeight:600, flexShrink:0 }}>✓ mark covered</button>
        </div>
        <div style={{ fontSize:15, color:C.textPrimary, lineHeight:1.9, whiteSpace:"pre-wrap", fontWeight:400 }}>{text}</div>
        {r.note && coachingVisible && (
          <div style={{ marginTop:10, fontSize:12, color:C.textSecondary, lineHeight:1.65, background:"#111c28", padding:"10px 14px", borderRadius:7, borderLeft:`2px solid ${accent}60` }}>{r.note}</div>
        )}
      </div>
    );
  }

  function renderBuyerType() {
    const allPaths = [
      { path:"evaluating", border:"#1e3a5f", bg:"#111d30", titleColor:"#5b8fd4", bodyColor:"#7ab0d8", badge:"#1e3a5f", badgeText:"#7ab0d8", icon:"⚡", title:"Solution language", sub:'"We\'re looking for a product that can do X..." — Actively evaluating. Comparing solutions.', technique:"→ Go Back In Time" },
      { path:"active-pain", border:"#2d4a1e", bg:"#0f2b1e", titleColor:"#4a9e78", bodyColor:"#6ab898", badge:"#4a9e78", badgeText:"#fff", icon:"⚠", title:"Problem language", sub:'"We have a challenge with Y... Z is not where we want it..." — Active pain. Not yet solution-focused.', technique:"→ Symptoms → Problems" },
      { path:"latent", border:"#4a3800", bg:"#1c1a0e", titleColor:"#c08a20", bodyColor:"#a07820", badge:"#4a3800", badgeText:"#c08a20", icon:"◎", title:"Vague or can\'t remember", sub:'"You said something that caught my attention..." — Latent pain. Dormant. Not top of mind.', technique:"→ Discovery Prompter" },
    ];
    const visiblePaths = callSource === "inbound" ? allPaths.filter(p=>p.path!=="latent") : allPaths;

    if (!buyerPath) return (
      <div style={{ marginBottom:28 }}>
        {!callSource ? (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>How did this call originate?</div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <button onClick={()=>setCallSource("inbound")} style={{ ...B, width:"100%", padding:"24px 28px", border:"2px solid #4a9e78", borderRadius:14, background:"#0f2b1e", textAlign:"left" }}>
                <div style={{ fontSize:22, fontWeight:800, color:"#4a9e78", marginBottom:10 }}>Inbound</div>
                <div style={{ fontSize:17, color:"#6ab898", lineHeight:1.7, fontWeight:500 }}>"So what brought you to the table today — what made this worth exploring?"</div>
              </button>
              <button onClick={()=>setCallSource("outbound")} style={{ ...B, width:"100%", padding:"24px 28px", border:"2px solid #3b82f6", borderRadius:14, background:"#111d30", textAlign:"left" }}>
                <div style={{ fontSize:22, fontWeight:800, color:"#3b82f6", marginBottom:10 }}>Outbound</div>
                <div style={{ fontSize:17, color:"#5b8fd4", lineHeight:1.7, fontWeight:500 }}>"I know we reached out to you first, so this might sound like a funny question — but I'm curious, what made you agree to take the call?"</div>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom:20, padding:"12px 16px", borderRadius:10, background:callSource==="inbound"?"#0f2b1e":"#111d30", border:`1.5px solid ${callSource==="inbound"?"#4a9e78":"#3b82f6"}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:14, fontWeight:600, color:callSource==="inbound"?"#4a9e78":"#5b8fd4" }}>
              {callSource==="inbound" ? "Inbound — What motivated you to reach out?" : "Outbound — What made you agree to take this call?"}
            </div>
            <button onClick={()=>setCallSource(null)} style={{ ...B, fontSize:11, color:C.textMuted, background:"transparent", border:`1px solid ${C.border}`, borderRadius:5, padding:"3px 10px" }}>change</button>
          </div>
        )}
        {callSource && (
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>What did their response sound like?</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {visiblePaths.map(opt=>(
                <button key={opt.path} onClick={()=>setBuyerPath(opt.path)} style={{ ...B, padding:"18px 22px", border:`2px solid ${opt.border}`, borderRadius:12, background:opt.bg, textAlign:"left" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:opt.titleColor, marginBottom:6 }}>{opt.icon} {opt.title}</div>
                  <div style={{ fontSize:13, color:opt.bodyColor, lineHeight:1.65, marginBottom:8 }}>{opt.sub}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:opt.titleColor, background:opt.badge, padding:"3px 10px", borderRadius:6, display:"inline-block" }}>{opt.technique}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    const pathLabel = buyerPath==="evaluating"?"⚡ Actively Evaluating":buyerPath==="active-pain"?"⚠ Active Pain":"◎ Latent Pain";
    const pathColor = buyerPath==="evaluating"?"#5b8fd4":buyerPath==="active-pain"?C.emerald:"#c08a20";

    return (
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:pathColor, letterSpacing:"0.06em", textTransform:"uppercase" }}>{pathLabel}</div>
          <button onClick={()=>{setBuyerPath(null);setCallSource(null);}} style={{ ...B, fontSize:12, color:C.white, background:C.coral, border:"none", borderRadius:6, padding:"5px 14px", fontWeight:600 }}>← Change</button>
        </div>

        {buyerPath === "evaluating" && <>
          {[
            { type:"ask", label:"1 — Reflect + wallow on requirements", text:"So it sounds like you're actively looking at solutions and you want to get a sense of whether we can help. Seems like a great place to start. Can you help me understand what else you're looking for in a product like ours?", note:"Reflect their solution language back. Then wallow. Get everything on the table before you go anywhere." },
            { type:"wallow", label:"2 — Keep wallowing", text:"What else? I want to make sure I focus on the right things. The good and bad thing about PandaDoc is it can do a lot — and if anything is irrelevant to you I'd rather not spend energy there.", note:"Don't rush. Stay here 2-3 follow-ups minimum. Wallowing is what makes everything else feel earned." },
            { type:"summarize", label:"3 — Summarize requirements", text:"Okay so you're looking for [X, Y, Z]. Did I miss anything?", note:"Prove you listened. Give it back organized. If they add something — that's what mattered most." },
            { type:"ask", label:"4 — Accomplish question", text:"This might be a question you're tired of answering — but what are you looking to accomplish with capabilities like the ones you just listed?", note:"Bridges from solution requirements to business outcomes." },
            { type:"segue", label:"5 — Current state bridge", text:"Mind if I ask how you're getting along without those capabilities today? Everyone I talk to is getting by, maybe there's room for improvement — but you're still cruising I'm sure. What does that look like right now?", note:"Orlob segue — bridge from solution land to current reality." },
            { type:"ask", label:"6 — Go back in time", text:"This is going to sound like an odd pivot — but bear with me for a second.\n\nCan I go back in time with you for a second? It's clear you know what you want more than most people I talk to — which usually means something specific set this in motion. What was that moment for you?", note:"Always ask permission first. Short, no examples, no anchoring. Let them fill it." },
            { type:"summarize", label:"7 — Summarize before Current Process", text:"Let me see if I have this right so far. [Their exact words — what they're looking for, what they want to accomplish, and the original challenge.] Did I get that right?", note:"Their words — not yours. When they say that's right you have alignment." },
          ].map((r,i)=><RhythmCard key={i} r={r} idx={i} prefix="eval" />)}
          {coachingVisible && <div style={{ marginTop:16, background:"#1e1010", border:"1.5px solid #6b2020", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#e07070", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>⚠ Watch For</div>
            {["Asking about challenges before wallowing — they're in solution mode, don't fight it","Checking the box on wallow and rushing forward — stay there, 2-3 follow-ups minimum","Skipping 'can I go back in time' — that permission phrase must be said every time"].map((w,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:i<2?8:0 }}><span style={{ background:C.coral, color:C.white, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0, marginTop:2 }}>!</span><span style={{ fontSize:13, color:"#e07070", lineHeight:1.65 }}>{w}</span></div>
            ))}
          </div>}
          <button onClick={()=>setActiveStage("business-problem")} style={{ ...B, width:"100%", marginTop:18, padding:"16px 22px", background:C.emerald, border:"none", borderRadius:12, fontSize:15, fontWeight:700, color:"#fff", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>Summarize + move to Business Problem</span><span style={{ fontSize:20 }}>→</span>
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
          {coachingVisible && <div style={{ marginTop:16, background:"#1e1010", border:"1.5px solid #6b2020", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#e07070", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>⚠ Watch For</div>
            {["Jumping to process mapping before you have the business driver","Using both T-up versions back to back — pick one","Stopping at the symptom — the first answer is almost never the real problem"].map((w,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:i<2?8:0 }}><span style={{ background:C.coral, color:C.white, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0, marginTop:2 }}>!</span><span style={{ fontSize:13, color:"#e07070", lineHeight:1.65 }}>{w}</span></div>
            ))}
          </div>}
          <button onClick={()=>setActiveStage("business-problem")} style={{ ...B, width:"100%", marginTop:18, padding:"16px 22px", background:C.emerald, border:"none", borderRadius:12, fontSize:15, fontWeight:700, color:"#fff", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>Summarize + move to Business Problem</span><span style={{ fontSize:20 }}>→</span>
          </button>
        </>}

        {buyerPath === "latent" && <>
          <div style={{ fontSize:14, color:C.textSecondary, lineHeight:1.75, marginBottom:16, padding:"12px 16px", background:"#1c1a0e", borderRadius:10, border:"1.5px solid #7a6010" }}>Their pain is dormant. Pushing it to the back of their mind. Questions tap into what's top of mind — and by definition, latent pain is not top of mind. Stories activate it. Your tool is the Discovery Prompter.</div>
          <div style={{ background:"#16122a", border:"1.5px solid #4a3a9a", borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#5a2ab0", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>Why they have latent pain — diagnose first</div>
            {["Ignorance — don't know a solution exists for what you solve","Rationalization — tried to solve it, failed, gave up and decided to live with it","Too many other priorities — it's buried under six other things","No pain — genuinely unqualified. Different from latent."].map((r,i)=>(
              <div key={i} style={{ display:"flex", gap:8, marginBottom:i<3?8:0 }}><span style={{ color:"#7a3ab0", fontSize:13, flexShrink:0, fontWeight:700 }}>{i+1}.</span><span style={{ fontSize:13, color:"#3a2060", lineHeight:1.6 }}>{r}</span></div>
            ))}
          </div>
          {[
            { type:"ask", label:"Set the agenda first — relieve their fatigue", text:'"Here\'s how I\'m thinking about the agenda. How about I spend the first few minutes walking you through the challenges we typically solve so you have some context for the rest of the conversation. And from there I\'ll pass the torch to you. Is that fair?"', note:"Many latent buyers come in expecting 20 bad discovery questions. This relieves them instantly. They hear 'I'll give you something before asking you anything' and relax. Now you've set up the Discovery Prompter." },
            { type:"ask", label:"Discovery Prompter — 6 steps (practice this 5-6 times first)", alts:[
              "1 — PROBLEM: \"Most of our customers before working with us were struggling with [pain statement — e.g. sales teams spending 30-45 minutes building every proposal by hand, copy-pasting from Word, chasing signatures over email].\"",
              "2 — AGITATE: \"They were dealing with [articulate pain better than they can — e.g. no visibility into whether prospects opened what they sent, deals going cold in the last mile, reps burning time on admin instead of selling].\"",
              "3 — FAILED ATTEMPTS: \"Before partnering with us, they had tried [traditional solutions — e.g. better Word templates, DocuSign standalone, spreadsheets to track] but all of them fell short. So they gave up and assumed they'd have to live with it.\"",
              "4 — NEW APPROACH: \"When they met us, they realized we have a unique approach that gets at the source of the problem — [tease it lightly, don't go into feature detail].\"",
              "5 — POSITIVE OUTCOME: \"After rolling this out, most of our customers see [business outcome — e.g. proposals out in under 10 minutes, signatures back same day]. In fact, [short customer story with a metric].\"",
              "6 — PASS THE TORCH: \"Anyway — enough about our customers. Help me understand the challenges you might be having when it comes to [problem area] that you'd like to see resolved.\"",
            ], note:"This is a PAIN story — not a success story. Step 3 (failed attempts) is the step most people skip and it's often the most important one — latent buyers have usually tried to solve this before. When you name it, they identify with it. Practice this 5-6 times before going live. It needs to feel conversational, not recited." },
            { type:"ask", label:"If it doesn't land — diagnose why", text:"If they don't respond with anything useful: either they don't have pain (not qualified), your narrative needs work (not hitting the mark), or you misdiagnosed — they might be in the evaluating path. Don't double down. Pivot to a direct question.", note:"Ask: 'Help me understand what's going on in your world when it comes to [area].' If still nothing — they may not be qualified. Better to know now." },
          ].map((r,i)=><RhythmCard key={i} r={r} idx={i} prefix="latent" />)}
          <div style={{ marginTop:16, background:"#1e1010", border:"1.5px solid #6b2020", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#e07070", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>⚠ Watch For</div>
            {["Telling a success story instead of a pain story — they need to see themselves in the struggle, not the outcome","Skipping Step 3 (failed attempts) — this is the step that makes them say 'that's exactly us'","Using the prompter on a warm buyer — you're overcomplicating it, go direct instead"].map((w,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:i<2?8:0 }}><span style={{ background:C.coral, color:C.white, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0, marginTop:2 }}>!</span><span style={{ fontSize:13, color:"#e07070", lineHeight:1.65 }}>{w}</span></div>
            ))}
          </div>
          <button onClick={()=>setActiveStage("business-problem")} style={{ ...B, width:"100%", marginTop:18, padding:"16px 22px", background:C.emerald, border:"none", borderRadius:12, fontSize:15, fontWeight:700, color:"#fff", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>Summarize + move to Business Problem</span><span style={{ fontSize:20 }}>→</span>
          </button>
        </>}
      </div>
    );
  }

  const STAGE_DATA = {
    "business-problem": {
      bridgeBanner: true,
      rule:"Summarize what you heard. Prioritize. Validate it is a raging fire. Summarize before moving on.",
      rhythm:[
        { type:"summarize", label:"1 — Early summary + prioritize", text:"I heard a few things — [X, Y, Z]. Which one of those feels most top of mind? We will touch on all of them but in your opinion — what is the biggest headache right now?", note:"Do this immediately after their opening answer. Summarize what you heard, give it back organized, make them prioritize. The one they pick is where the real pain lives." },
        { type:"ask", label:"2 — Validate: raging fire or brush fire", text:"Before we go too much further — I just want to make sure we are anchoring our conversation to the right thing. Is this the challenge we should be focused on together, or are there other things that are going to overpower this? Is this something that will be top of mind a week from now, or more of a nice-to-have?", note:"CFO acid test: would a CFO fund this problem statement? If no — keep peeling. Symptoms get ghosted. Problems get funded." },
        { type:"summarize", label:"3 — Summarize before transition (Orlob Script #7)", text:"Let me see if I have this right so far. [Their exact words — not yours.] Did I get that right? ... Ok great. Thanks for confirming that. Now that we have your challenge established — what are the ripple effects this is having across the business?", note:"Summarize in their exact words — never paraphrase. When they say that is right you have true alignment. Then springboard to the next topic." },
        { fallback:true, type:"ask", label:"4 — Domino effect", alts:["A — Orlob: There is a domino effect attached to that — what else does it affect when that breaks down?","D — TJ: There is a domino effect attached to that — why is it important to fix that one specifically?"], note:"Peels past the first answer to find what the operational problem is actually costing the business." },
        { fallback:true, type:"ask", label:"5 — Aside from", alts:["A — Orlob: Aside from [what they just said] — is there something going on behind the scenes driving you to prioritize fixing this?","D — TJ: Aside from the obvious benefit of maybe a rep not giving your product away for free — what else would you stand to gain?"], note:"Ask the same question multiple times without it feeling repetitive." },
        { fallback:true, type:"ask", label:"6 — Cost of inaction", alts:["A — Orlob: What happens if other priorities take over and you simply do not make this decision?","D — TJ: If I could ask an uncomfortable question — what happens if other priorities take over and you simply do not make that decision?"], note:"Makes the invisible cost visible. Soften it first." },
      ],
      tips:["Little problems get little dollars. BIG problems get BIG dollars.","Summarize in their exact words — never paraphrase. Buyers resonate with their words not yours.","No Logo Challenge: could someone identify this company from your description alone?"],
      watch:["Stopping at the first answer — it is almost always a symptom","Moving on before validating priority","Happy ears — getting excited before validating it is a raging fire"],
    },
    "current-process": {
      rule:"Map where they are today. Scope the deal as you go. The metric will surface naturally.",
      rhythm:[
        { type:"ask", label:"1 — Map the process", text:"Thanks for sharing all of that. What I'd love to do now is zoom out and talk about the actual process — from draft to signature. Walk me through that.", note:"Open, neutral. Don't name what you expect to find. Get them talking, then stop." },
        { type:"ask", label:"2 — Time to build", text:"How long does that process take — from the moment someone starts building to when it lands in the prospect's inbox?", note:"Get the number. Everything else builds from here. If they give a range — take the midpoint." },
        { type:"ask", label:"3 — Who's involved + volume", text:"And how many people on your team are doing this? Ballpark — how many documents go out in a typical month?", note:"Team size × volume × time = the real scope. You need all three for the ROI math." },
        { type:"ask", label:"4 — Current tool", text:"What are you using today to create and send them?", note:"Tells you competitive landscape and switching cost. Listen for: Google Docs, Word, DocuSign standalone, or nothing." },
        { type:"ask", label:"5 — Baseline expectation", text:"So [X minutes] today — how does that compare to where you or your leadership team would want it to be?", note:"Get their expectation before you show the delta. The gap is the business case." },
        { type:"ask", label:"6 — ROI math", text:"So if I'm doing the math right — [X] reps, [Y] agreements a month, [Z] minutes each — that's roughly [total hours] a month just in the process itself.\n\nGiven that [metric they named] is what you're really trying to move — what would your team do with that time back?", note:"Do the math out loud. Then tie it directly to the metric they named earlier — not a generic 'more selling time' close. If they said win rate, ask what they'd do with the time toward that. If they said revenue, same. Mirror their language exactly." },
        { type:"summarize", label:"7 — Summarize", text:"Let me see if I've understood you so far. [Problem in their words + the metric + where it stands today + trajectory.] Did I get that right?", note:"Their exact words — never paraphrase. When they say that's right you have alignment." },
        { type:"validate", label:"8 — Validate priority", text:"Is this the problem we should anchor the rest of our conversation to — or is there something more pressing I should know about?", note:"Ask this before you move to Negative Impact. Better to know now than three weeks into a deal that goes dark." },
        { fallback:true, type:"ask", label:"Integrations", text:"What else would you want this to plug into?", note:"CRM is usually first. Dig for HRIS, billing, project management. Each integration = stickiness." },
        { fallback:true, type:"ask", label:"Approval workflow", text:"Does anyone need to approve internally before a document goes out?", note:"Approval workflows = higher tier product need. If yes, this is a feature conversation, not just seat count." },
        { fallback:true, type:"ask", label:"Audience", text:"Are you typically sending to one person or a buying committee?", note:"Committee = more complex signature workflows." },
        { fallback:true, type:"ask", label:"Engagement + metric callback", alts:["Once it's out the door — how do you track engagement and manage follow-ups?","To what extent would it be helpful in improving [metric they shared] — to be able to act the second they've opened it?"], note:"Set up document analytics. Tie it to their stated metric." },
        { fallback:true, type:"ask", label:"Other departments", text:"What other departments do you think would be positively impacted from using a tool like PandaDoc?", note:"Expands scope beyond the obvious team. Sales reps often undercount Legal, Finance, HR, CS." },
        { fallback:true, type:"ask", label:"Templates", text:"How many templates do you think you'd need to start?", note:"High count = longer ramp. Feeds a PS conversation." },
        { fallback:true, type:"ask", label:"Security + compliance", text:"Any compliance, security, or data residency requirements we should know about?", note:"One question covers all three. HIPAA, SOC2, GDPR vary by plan." },
        { fallback:true, type:"ask", label:"Proposals (if sales)", text:"How do you make your proposals stand out from the competition?", note:"Only if they're in sales. Opens content library, brand, and interactive pricing." },
        { fallback:true, type:"ask", label:"Notary (if legal)", text:"Ever need notarization?", note:"Only if legal, real estate, or similar. PandaDoc Notary is a separate SKU." },
        { fallback:true, type:"ask", label:"Find the friction", alts:["Every process has at least one part that's more painful than the rest — where does yours break down?","When things go sideways — what usually causes it?"], note:"Hughes: complaint bait. Only use if friction hasn't surfaced naturally." },
        { fallback:true, type:"ask", label:"Lego technique", alts:["It sounds like a lot of the friction is on the front end — getting the thing built and out the door. [pause] And then separately, once it's out there's not a lot of visibility. [pause]","So there's the creation side, and then there's what happens after. Which one causes more pain day to day?"], note:"Hughes: lay two pieces on the table, never connect them. Their brain connects them." },
        { fallback:true, type:"ask", label:"Trajectory", text:"Has it always been that way — or is it getting better, worse, or staying flat?", note:"Trajectory changes urgency. Getting worse fast = raging fire." },
      ],
      tips:[
        "The metric will surface naturally if you ask the active listening questions well. Don't hunt for it.",
        "Team size × volume × time per doc = the real scope. Get all three before the ROI math.",
        "The baseline expectation (where do you want it to be) is more important than the current state. The gap is the business case.",
      ],
      watch:[
        "Hunting for the metric with a direct question — let it surface through active listening",
        "Moving to Negative Impact without validating priority",
        "Re-asking things they already told you in the word vomit — reference it instead",
      ],
    },
    "cause-analysis": {
      rule: "Mutually identify and challenge the true root cause. Don't accept the first answer.",
      rhythm: [
        { type:"ask", label:"1 — Root cause question", text: "What's your take on why this is happening? In your opinion — what's the actual cause of this?", note: "Orlob: 'What's your opinion on why this is happening?' — three things happen: you signal you value their opinion, you get the real cause, and you find out whether they've thought about this deeply." },
        { type:"ask", label:"2 — Challenge it", text: "That's interesting. Is that a new development, or has it always been that way?", note: "Challenge gently. Has it always been this way = is this structural or situational? Structural has less urgency. Situational (something changed) has more." },
        { type:"ask", label:"3 — Validate it's the real cause", text: "So if we solved [root cause they named] — would that actually fix the problem you described? Or do you think there's something else underneath it?", note: "CFO test for root cause. If yes → you have the real cause. If they hesitate → keep digging." },
        { type:"summarize", label:"4 — Summarize + transition to impact", text: "So the real cause here is [their words] — not just a symptom. Did I get that right? ... Perfect. Based on that — I want to make sure I understand what this is actually costing the business.", note: "Transition into Negative Impact. Root cause summary sets up the impact questions perfectly." },
      ],
      tips: [
        "First answer is almost always a symptom. The real cause is usually 1-2 layers deeper.",
        "Mutual means they discovered it too — not just confirmed your hypothesis.",
        "'Is that a new development?' challenges without confronting.",
      ],
      watch: [
        "Accepting the first answer as the root cause",
        "Moving to impact before you've confirmed the cause",
        "Leading them to your conclusion instead of letting them arrive at it",
      ],
    },
    "negative-impact": {
      rule:"Time savings alone rarely justifies a rollout. Find what it is actually costing the business.",
      rhythm:[
        { type:"ask", label:"1 — Transition + metric question", alts:["So we've talked about the time your team is spending — and that's real. But usually when teams make a change like this, there's something bigger driving it underneath. What metric would improve the most if you solved the challenges you've been sharing with me?","What metric is suffering as a result of what you've been sharing with me?"], note:"Orlob Script #6 exact language. Time savings is the efficiency story. The metric question surfaces the revenue or business story — which is what makes a CFO fund it. Positive or negative framing — pick whichever fits." },
        { type:"ask", label:"2 — Context-led impact (built from what they told you)", alts:["They mentioned losing deals → 'You mentioned losing a couple of deals where the competitor got there faster — what's the average size of those?'","They mentioned board/investors → 'You mentioned the board meeting in six weeks — what does walking in without an answer to this look like?'","They mentioned scaling → 'You mentioned bringing on more reps — what does onboarding them into this process look like if nothing changes?'"], note:"Context-led means you're using something specific they told you — not a generic impact question. It proves you were listening and makes the question feel like a natural continuation of the conversation, not an interrogation." },
        { type:"ask", label:"3 — Ripple effects (Orlob Script #7 springboard)", text:"What are the ripple effects this challenge is having across the business?", note:"Orlob exact language — not 'how does this impact you?' That sounds cheesy. 'Ripple effects across the business' signals business acumen. Same question, completely different reception." },
        { type:"summarize", label:"4 — Confirm + summarize + transition", alts:["So the real cost here isn't just the time — it's [metric] sitting at [X] when leadership wants it at [Y]. Did I get that right?","Let me make sure I have the full picture. [Process pain + metric + gap + business consequence.] Did I get that right?","If you're open to it — I'd love to flip this. If you solved everything you just described, what does good look like 365 days from now?"], note:"Option 3 is the transition into Future State. The contrast between the painful present you just summarized and the future they're about to describe is where the feeling of value lives." },
      ],
      tips:[
        "Time savings is rarely enough to justify a software rollout. Find the revenue story underneath.",
        "Context-led questions feel like listening. Generic impact questions feel like a checklist.",
        "Orlob: ripple effects across the business — not how does this impact you. Same question, 10x more sophisticated.",
        "The metric + gap you surface here becomes the ROI foundation for the business case.",
      ],
      watch:[
        "Leading with time savings and stopping there — it's the efficiency story, not the business story",
        "Asking generic impact questions instead of context-led ones — they'll feel interrogated",
        "More than 3 impact questions — diminishing returns fast",
      ],
    },
    "future-state": {
      rule:"Contrast painful present with compelling future. Then understand the decision before you make a recommendation.",
      rhythm:[
        { type:"ask", label:"1 — The 365-day question", text:"If you're open to it — I'd love to flip this. If we solved everything you just described, what does good look like 365 days from now?", note:"Buyers exhale at this question. They've been in pain for the last 20 minutes and now you're casting their imagination into relief. The emotional contrast between painful present and compelling future is where the feeling of value lives." },
        { type:"ask", label:"2 — Quantify if they didn't", text:"Where would [the metric they shared] have to be for you and everyone involved to feel good about the progress you've made?", note:"Only ask this if they didn't naturally quantify it. Current state number + desired state number = the value delta. That delta is all a business case is." },
        { type:"ask", label:"3 — Personal stake", text:"I want to ask you something a little different. Beyond what this means for the business — what does solving this mean for you personally?", note:"The most powerful question on the call. Ask it after future state is established — it feels earned here. The personal motivation is what keeps deals from going dark when things get complicated internally." },
        { type:"ask", label:"4 — Pressure test alignment", text:"How aligned would everybody else involved be if that was the explicit goal — is that the goal everyone else cares about too?", note:"Prevents them from voicing a random aspiration. Makes sure the future state has organizational alignment. If others don't care about this goal — it won't get funded." },
        { type:"ask", label:"5 — Buying criteria (Script #9)", text:"What do you think you need in a solution to solve these challenges?", note:"Ask this before you show them anything. It surfaces their buying criteria in their own words — and can reveal misalignment between what they think they need and what would actually solve the problem. Never assume your product maps to what they have in mind. This is what separates reps who tailor demos from reps who just pitch." },
        { type:"summarize", label:"6 — Final summary before decision process", text:"Before we talk about what a next step looks like — let me make sure I've captured everything correctly. [Current state in their words + the metric + where it is today + where they want it + the business consequence + what it means personally + timeline.] Did I get that right? Anything you'd add?", note:"This summary becomes the What We Heard slide that opens your next meeting. Do it in their exact words — never paraphrase." },
        { type:"transition", label:"7 — Transition to decision process", text:"This has been really helpful. Before we talk about what a next step looks like, I'd love to understand how decisions like this typically get made on your end — just so I'm not making assumptions. Mind if I ask a few questions around that?", note:"Natural bridge from future state to decision process. Positions the decision questions as practical, not pushy." },
        { fallback:true, type:"ask", label:"8 — Decision process", alts:["Walk me through what the decision process typically looks like for something like this — what steps would you and your team need to go through?","Who else would be involved in those steps — and what does their role look like?","What would drive the timeline for moving through those steps?","What would each person involved need to see or hear to feel good about moving forward?","And if we got to the point of doing business — how do you think something like this would get funded, based on how you've handled similar decisions?"], note:"Ask at least the first two. You need to know who else is involved before you can recommend the right next step. The funding question is last — it feels natural after you've established what the decision looks like." },
      ],
      tips:[
        "The contrast between painful present and compelling future is where the feeling of value lives — don't skip the summary before this.",
        "The personal stake question is the most powerful thing you'll ask all call. Earn it by establishing business pain and future state first.",
        "Ask buying criteria (card 5) before you show them anything — it tells you what to demo and can surface misalignment before it kills the deal.",
        "The decision process questions tell you whether to recommend a solo demo or a multi-threaded one.",
        "The final summary becomes the What We Heard slide — it opens every subsequent meeting.",
      ],
      watch:[
        "Skipping the personal stake question — it's the emotional fuel for urgency",
        "Assuming you know what they need before asking — card 5 prevents this",
        "Not asking who else is involved before recommending a next step — you'll recommend the wrong one",
        "Leaving without a clear picture of how they make decisions and who holds the veto",
      ],
    },
    "next-step": {
      rule:"Call back the ROE first. Then make a specific recommendation — not an open-ended ask.",
      rhythm:[
        { type:"ask", label:"1 — Transition", text:"This has been really helpful — I feel like I have a genuine understanding of where you are and what matters most. Based on everything we've talked about, I have a pretty clear idea of what I'd want to show you. Mind if I share what I'm thinking for a next step?", note:"Ask permission before you make the recommendation. It gives them control and makes the recommendation feel collaborative rather than presumptuous." },
        { type:"ask", label:"2 — Call back the ROE", text:"So at the start of our conversation we agreed we'd both walk away with a decision — does it make sense to keep talking or not. I don't want to speak for you — but from my end I think there's something worth exploring here. How are you feeling about it?", note:"Always call back the ROE before you make the recommendation. This is how you nearly guarantee a next step — you pre-framed the decision at the start of the call." },
        { type:"ask", label:"3 — Recommend: solo or small group demo", text:"Great — based on what you shared today, if it's okay with you, what I'd suggest as a next step is a custom demo built specifically around our conversation. It wouldn't be a grand tour — just focused on what matters to you. Does that sound reasonable?", note:"Specific recommendation — not 'what would you like to do?' Make a call. Use this version if it's just them or a small group you've already identified." },
        { type:"ask", label:"4 — Recommend: decision maker in the room", text:"Great — based on what you've shared, what I'd suggest is a focused demo with you and [name/role]. It'd be helpful to have them there since what we talked about directly affects [their situation]. You know your company better than I do — does that feel like the right call?", note:"Use this version when the decision process questions revealed someone else who needs to be in the room. You're deferring to their judgment while still making a specific recommendation." },
      ],
      tips:[
        "Card 3 or Card 4 — not both. Pick based on what came out of the decision process questions.",
        "A specific recommendation lands better than an open-ended ask every time. Make a call.",
        "The ROE callback is what makes the next step feel like a natural conclusion rather than a sales push.",
        "Book it before you hang up. Not 'I'll follow up with some times.' Get the calendar invite sent.",
      ],
      watch:[
        "Skipping the ROE callback — the next step ask lands cold without it",
        "Asking 'so what would you like to do?' instead of making a recommendation — puts the burden on them",
        "Leaving without a booked meeting — 'I'll send some times' is not a next step",
        "Recommending a demo without knowing who else should be in the room",
      ],
    },
  };

  const sd = STAGE_DATA[activeStage];

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Inter', system-ui, sans-serif", background:C.pageBg, overflow:"hidden" }}>

      {/* SIDEBAR */}
      <div style={{ width:200, background:C.sidebar, display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto" }}>
        <div style={{ padding:"22px 18px 14px" }}>
          <div style={{ fontSize:9, fontWeight:700, color:"#4d6478", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:3 }}>PandaDoc</div>
          <div style={{ fontSize:16, fontWeight:700, color:"#fafafa", letterSpacing:"0.01em" }}>Discovery</div>
        </div>

        <div style={{ flex:1, padding:"4px 8px" }}>
          {/* Setup group */}
          {["setup","framework","close"].map(group => {
            const groupStages = STAGES.filter(s => s.group === group);
            const groupLabel = group === "setup" ? "Setup" : group === "framework" ? "5-Step Framework" : "Close";
            return (
              <div key={group} style={{ marginBottom: group === "close" ? 0 : 16 }}>
                <div style={{ fontSize:9, fontWeight:700, color:"#7d9ab5", letterSpacing:"0.15em", textTransform:"uppercase", padding:"0 8px", marginBottom:6 }}>{groupLabel}</div>
                {groupStages.map(s => {
                  const isActive = s.id === activeStage;
                  const isFramework = s.group === "framework";
                  return (
                    <button key={s.id} onClick={() => setActiveStage(s.id)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", gap:10, padding:"11px 10px", borderRadius:8, background:isActive?"rgba(249,115,22,0.15)":"transparent", border:"none", borderLeft:isActive?"2px solid #f97316":"2px solid transparent", textAlign:"left", marginBottom:2 }}>
                      {isFramework ? (
                        <span style={{ fontSize:11, fontWeight:800, width:22, height:22, borderRadius:6, background:isActive?"#4a9e78":"#1e2d3e", color:isActive?"#fff":"#4d6478", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.icon}</span>
                      ) : (
                        <span style={{ fontSize:14, color:isActive?"#4a9e78":"#4d6478", fontWeight:700, minWidth:22, textAlign:"center" }}>{s.icon}</span>
                      )}
                      <span style={{ fontSize:13, color:isActive?"#fafafa":"#4d6478", fontWeight:isActive?600:400, lineHeight:1.3 }}>{s.short}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {buyerPath && (
          <div style={{ padding:"14px 16px", borderTop:"1px solid #27272a" }}>
            <div style={{ fontSize:9, color:"#7d9ab5", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.1em" }}>Buyer Path</div>
            <div style={{ display:"inline-flex", fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:99, background:buyerPath==="evaluating"?"#1e3a5f":buyerPath==="active-pain"?"#0f2b1e":"#2a1f08", color:buyerPath==="evaluating"?"#6aaae8":buyerPath==="active-pain"?"#4a9e78":"#c08a20" }}>
              {buyerPath==="evaluating"?"⚡ Evaluating":buyerPath==="active-pain"?"⚠ Active Pain":"◎ Latent"}
            </div>
            <button onClick={()=>setBuyerPath(null)} style={{ ...B, display:"block", marginTop:5, fontSize:10, color:"#4d6478", background:"none", border:"1px solid #3f3f46", borderRadius:5, padding:"3px 8px" }}>← change</button>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* TOP BAR */}
        <div style={{ padding:"16px 28px", borderBottom:`1px solid ${C.border}`, background:C.white, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ flex:1 }}>
            {/* Framework progress dots — only show during 5-step stages */}
            {["business-problem","current-process","cause-analysis","negative-impact","future-state"].includes(activeStage) && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                {[
                  { id:"business-problem", label:"Business Problem" },
                  { id:"current-process",  label:"Current State" },
                  { id:"cause-analysis",   label:"Cause Analysis" },
                  { id:"negative-impact",  label:"Negative Impact" },
                  { id:"future-state",     label:"Future State" },
                ].map((step, i) => {
                  const isActive = step.id === activeStage;
                  const isDone = ["business-problem","current-process","cause-analysis","negative-impact","future-state"].indexOf(activeStage) > i;
                  return (
                    <button key={step.id} onClick={() => setActiveStage(step.id)} style={{ ...B, display:"flex", alignItems:"center", gap:5, background:"none", border:"none", padding:"2px 4px", borderRadius:4 }}>
                      <span style={{ width:20, height:20, borderRadius:6, background:isActive?"#4a9e78":isDone?"#163d2a":"#1e2d3e", border:isActive?"2px solid #4a9e78":isDone?"2px solid #2d6a48":"2px solid #263548", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:isActive?"#fff":isDone?"#4a9e78":"#4d6478" }}>{i+1}</span>
                      <span style={{ fontSize:11, fontWeight:isActive?700:400, color:isActive?"#4a9e78":isDone?"#4a9e78":"#4d6478", display:"none" }}>{step.label}</span>
                    </button>
                  );
                })}
                <span style={{ fontSize:11, color:"#4d6478", marginLeft:4, fontWeight:500 }}>
                  {{"business-problem":"Business Problem","current-process":"Current State","cause-analysis":"Cause Analysis","negative-impact":"Negative Impact","future-state":"Future State"}[activeStage]}
                </span>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
              <div style={{ fontSize:20, fontWeight:700, color:"#eef2f7", letterSpacing:"-0.02em", lineHeight:1.2 }}>
                {{"prep":"Pre-Call Prep Brief","open":"Open + ROE","buyer-type":"Meet Buyer Where They Are","current-process":"Current State","business-problem":"Business Problem","cause-analysis":"Cause Analysis","negative-impact":"Negative Impact","future-state":"Future State + Decision","next-step":"Secure the Next Step","outputs":"Outputs"}[activeStage]}
              </div>
              {(briefFields.prospect || briefFields.company) && activeStage !== "prep" && (
                <span style={{ fontSize:13, color:"#9a80e0", fontWeight:500 }}>
                  {[briefFields.prospect, briefFields.company].filter(Boolean).join(" @ ")}
                </span>
              )}
            </div>
            <div style={{ fontSize:13, color:C.textMuted, marginTop:3 }}>
              {{"prep":"Paste your prep brief. Everything downstream personalizes from this.","open":"Rapport. Agenda. ROE. Diagnostic.","buyer-type":"Listen for their language. Meet them where they are.","current-process":"Mutual understanding of where they are today.","business-problem":"Identify and validate THE business problem.","cause-analysis":"Mutually identify the true root cause.","negative-impact":"Explore impact, consequences, and negative ramifications.","future-state":"Desired outcomes, buying process, and the WHY behind it.","next-step":"Call back the ROE. Make the recommendation.","outputs":"Generate your end-of-call outputs."}[activeStage]}
            </div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
            <button onClick={()=>setCoachingVisible(v=>!v)} style={{ ...B, fontSize:11, padding:"6px 12px", border:`1px solid ${C.border}`, borderRadius:6, background:coachingVisible?C.emeraldLight:C.white, color:coachingVisible?C.emerald:C.textMuted, fontWeight:600 }}>{coachingVisible?"Hide notes":"Show notes"}</button>
            {showOutputsShortcut && <button onClick={()=>setActiveStage("outputs")} style={{ ...B, fontSize:12, padding:"8px 16px", border:`2px solid ${C.emerald}`, borderRadius:7, background:"transparent", color:C.emerald, fontWeight:700 }}>✦ Outputs</button>}
            {currentIdx > 0 && <button onClick={()=>setActiveStage(STAGES[currentIdx-1].id)} style={{ ...B, fontSize:22, padding:"6px 14px", border:`1px solid ${C.border}`, borderRadius:7, background:C.white, color:C.textMuted, fontWeight:500, lineHeight:1 }}>←</button>}
            {currentIdx < STAGES.length-1 && <button onClick={()=>setActiveStage(STAGES[currentIdx+1].id)} style={{ ...B, fontSize:22, padding:"6px 16px", border:"none", borderRadius:7, background:C.emerald, color:C.white, fontWeight:700, lineHeight:1 }}>→</button>}
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          <div style={{ flex:1, overflowY:"auto", padding:"32px 36px 0" }}>

            {/* PREP */}
            {activeStage === "prep" && (
              <div style={{ marginBottom:28 }}>
                <div style={{ background:C.emeraldLight, border:`2px solid ${C.emeraldMid}`, borderRadius:14, marginBottom:20, overflow:"hidden" }}>
                  <button onClick={()=>setPrepOpen(o=>!o)} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 26px", background:"none", border:"none", cursor:"pointer" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:C.emerald, letterSpacing:"0.08em", textTransform:"uppercase" }}>★ Discovery Prep Brief</span>
                      {prepBrief && !prepOpen && <span style={{ fontSize:12, color:C.emerald, fontWeight:600 }}>✓ Loaded</span>}
                    </div>
                    <span style={{ fontSize:18, color:C.emerald, transform: prepOpen ? "rotate(180deg)" : "rotate(0deg)", transition:"transform 0.2s" }}>▾</span>
                  </button>
                  {prepOpen && (
                    <div style={{ padding:"0 26px 26px" }}>
                      <div style={{ fontSize:15, color:C.textSecondary, marginBottom:16, lineHeight:1.7 }}>Paste the output from your pre-call research. The coach and all outputs will use this to personalize every response.</div>
                      <textarea value={prepBrief} onChange={e=>setPrepBrief(e.target.value)} placeholder={"CALL BRIEF: [Company] — [Date]\n\nContact: [Name], [Title] | Tenure: X years\nCall Source: Inbound/Outbound\n\nMoney Signals: ...\nTech Stack: ...\nCompelling Trigger: ...\nOpen Gaps: ..."} style={{ width:"100%", minHeight:180, fontSize:14, lineHeight:1.8, padding:"14px 16px", border:`1.5px solid ${C.emeraldMid}`, borderRadius:10, background:"#111c28", color:"#eef2f7", resize:"vertical", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }} />
                      {prepBrief && <div style={{ marginTop:12, fontSize:14, color:C.emerald, fontWeight:600 }}>✓ Brief loaded — coach personalized to this prospect</div>}
                    </div>
                  )}
                </div>
                {/* PRE-CALL INTEL */}
                <div style={{ background:"#16122a", border:"1.5px solid #4a3a9a", borderRadius:12, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#9a80e0", marginBottom:12 }}>Pre-Call Intel</div>
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, color:"#7060b0", fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em" }}>Paste questionnaire answers (brief goes above ↑) → auto-fill fields</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <textarea
                        value={questionnaireText}
                        onChange={e => setQuestionnaireText(e.target.value)}
                        placeholder="Paste questionnaire answers or additional context here..."
                        rows={3}
                        style={{ flex:1, fontSize:12, padding:"8px 12px", border:"1.5px solid #4a3a9a", borderRadius:7, background:"#111c28", color:"#eef2f7", resize:"none", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }}
                      />
                      <button onClick={parseBrief} disabled={briefParsing || (!prepBrief.trim() && !questionnaireText.trim())} style={{ ...B, fontSize:12, padding:"0 16px", borderRadius:7, border:"none", background: briefParsing ? "#163d2a" : (!prepBrief.trim() && !questionnaireText.trim()) ? "#2a2040" : C.emerald, color: (!prepBrief.trim() && !questionnaireText.trim()) ? "#5a4a80" : "#fff", fontWeight:700, whiteSpace:"nowrap", alignSelf:"stretch" }}>
                        {briefParsing ? "Parsing..." : "⚡ Auto-fill"}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:"#5a4a80", marginBottom:16 }}>Or fill in manually below:</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {[
                      { key:"prospect",    label:"Prospect name",       placeholder:"e.g. Kimberly" },
                      { key:"company",     label:"Company",              placeholder:"e.g. Iron Constructor" },
                      { key:"role",        label:"Their role",           placeholder:"e.g. VP of Sales" },
                      { key:"tool",        label:"Current tool",         placeholder:"e.g. Word + DocuSign" },
                      { key:"reps",        label:"Team size (# reps)",   placeholder:"e.g. 12" },
                      { key:"volume",      label:"Docs / month",         placeholder:"e.g. 50" },
                      { key:"timePerDoc",  label:"Min per doc today",    placeholder:"e.g. 45" },
                      { key:"metric",      label:"Their metric / goal",  placeholder:"e.g. win rate, close rate" },
                      { key:"integrations",label:"Integrations needed",  placeholder:"e.g. HubSpot, Salesforce" },
                      { key:"approval",    label:"Approval process",     placeholder:"e.g. manager approves before send" },
                      { key:"pain",        label:"Known pain",           placeholder:"e.g. proposals take too long" },
                    ].map(f => (
                      <div key={f.key} style={f.key === "pain" ? { gridColumn:"1 / -1" } : {}}>
                        <div style={{ fontSize:10, color:"#7060b0", fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.07em" }}>{f.label}</div>
                        <input
                          value={briefFields[f.key]}
                          onChange={e => setBriefFields(s => ({ ...s, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          style={{ width:"100%", fontSize:13, padding:"7px 11px", border:"1.5px solid #4a3a9a", borderRadius:7, background:"#111c28", color:"#eef2f7", outline:"none", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif" }}
                        />
                      </div>
                    ))}
                  </div>
                  {briefParseStatus === "ok" && <div style={{ marginTop:12, padding:"7px 14px", background:"#0f2b1e", borderRadius:8, border:"1px solid #4a9e78", fontSize:12, color:"#4a9e78", fontWeight:600 }}>✓ Fields populated from brief</div>}
                  {briefParseStatus.startsWith("error") && <div style={{ marginTop:12, padding:"7px 14px", background:"#1e1010", borderRadius:8, border:"1px solid #e05c5c", fontSize:11, color:"#e05c5c", fontWeight:500, wordBreak:"break-all" }}>{briefParseStatus}</div>}
                  {Object.values(briefFields).some(v => v) && briefParseStatus !== "ok" && (
                    <div style={{ marginTop:14, padding:"8px 14px", background:"#0f2b1e", borderRadius:8, border:"1px solid #4a9e78", fontSize:12, color:"#4a9e78", fontWeight:600 }}>
                      ✓ Intel loaded — matching cards will show pre-answered during the call
                    </div>
                  )}
                </div>

                <div style={{ background:"#111d30", border:"1.5px solid #1e3a5f", borderRadius:12, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#5b8fd4", marginBottom:14 }}>Pre-call behavioral read — Hughes Six-Minute X-Ray</div>
                  <div style={{ fontSize:13, color:"#7ab0d8", lineHeight:1.7, marginBottom:12 }}>Based on their email, LinkedIn, or context — profile before you dial. You're looking for three things:</div>
                  {[
                    { label:"Primary Social Need", detail:"What makes them feel significant? Approval (they want validation), Power (they want control), Intelligence (they want to be seen as sharp), Acceptance (they want to belong). Tailor your opener to meet that need." },
                    { label:"Decision Style", detail:"Novelty seeker (show them something new), Social conformist (show them who else uses it), Necessity driven (show them the cost of not acting), Investment driven (show them the ROI math)." },
                    { label:"Sensory preference", detail:"Scan their writing. Visual = 'I see,' 'looks like,' 'picture this.' Auditory = 'sounds right,' 'rings true.' Kinesthetic = 'feels like,' 'get a sense.' Mirror their language in the call." },
                  ].map((s,i)=>(
                    <div key={i} style={{ marginBottom:i<2?12:0, paddingBottom:i<2?12:0, borderBottom:i<2?`1px solid #c8e0f8`:"none" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#5b8fd4", marginBottom:4 }}>{s.label}</div>
                      <div style={{ fontSize:13, color:"#7ab0d8", lineHeight:1.65 }}>{s.detail}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#1c1a0e", border:"1.5px solid #7a6010", borderRadius:12, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#d4a03a", marginBottom:14 }}>PCP Model — Hughes. Set this before every call.</div>
                  <div style={{ fontSize:13, color:"#b88a30", lineHeight:1.7, marginBottom:14 }}>Every human decision flows through 3 steps. Control the frame, control the outcome.</div>
                  {[
                    { letter:"P", label:"Perception", desc:"Change how they see the situation before discovery starts. Your opener sets what this meeting means. 'A lot of vendors jump to a demo before understanding anything about you. That's not how I want to spend our time.'" },
                    { letter:"C", label:"Context", desc:"Context dictates what behavior is permissible. The ROE sets the context — mutual discovery, not a pitch. Once the context is set, the prospect knows what's expected of them." },
                    { letter:"P", label:"Permission", desc:"Context gives permission. When you say 'does that feel fair?' — you're granting them permission to engage as a peer. When you summarize and ask 'did I get that right?' — you're giving them permission to correct and go deeper." },
                  ].map((s,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, marginBottom:i<2?12:0, paddingBottom:i<2?12:0, borderBottom:i<2?"1px solid #f0d870":"none" }}>
                      <span style={{ fontSize:18, fontWeight:800, color:"#d4a03a", flexShrink:0, minWidth:22 }}>{s.letter}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#d4a03a", marginBottom:3 }}>{s.label}</div>
                        <div style={{ fontSize:13, color:"#b88a30", lineHeight:1.65 }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:12, padding:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, marginBottom:14 }}>Value selling = 3 things. Only 3.</div>
                  {["Painful, measurable current state","Compelling, measurable future state","Your product as the bridge between the two"].map((t,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, marginBottom:i<2?10:0 }}>
                      <span style={{ background:C.emerald, color:C.white, fontSize:12, fontWeight:700, width:22, height:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</span>
                      <span style={{ fontSize:15, color:C.textSecondary, lineHeight:1.6 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {/* RAPPORT */}
            {activeStage === "open" && (
              <div>
                {/* OPENER — always */}
                <div style={{ marginBottom:20, background:C.emerald, borderRadius:14, padding:26 }}>
                  <div style={{ fontSize:22, color:"#fff", lineHeight:1.85, fontWeight:600, marginBottom:16 }}>"Hey [Name] — I'm glad we could find the time to meet today. How's your week going?"</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ background:"rgba(0,0,0,0.25)", borderRadius:8, padding:"12px 16px", fontSize:14, color:"#fff", lineHeight:1.7 }}>
                      <strong>Rapport →</strong> hang with it, find the natural end → "Mind if we hop into the agenda?"
                    </div>
                    <div style={{ background:"rgba(0,0,0,0.25)", borderRadius:8, padding:"12px 16px", fontSize:14, color:"#fff", lineHeight:1.7 }}>
                      <strong>Business →</strong> "Week's going good, thanks. Look, I know your time is valuable and you reached out for a reason — mind if we talk about the agenda?"
                    </div>
                  </div>
                </div>

                {/* HUGHES SIGNALS */}
                {coachingVisible && <div style={{ marginBottom:16, background:"#111d30", border:"1.5px solid #1e3a5f", borderRadius:10, padding:"14px 18px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#5b8fd4", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Read them in the first 60 seconds — Hughes</div>
                  {[
                    { signal:"Pronouns", read:"I/me/my → individual, personal stakes matter. We/us/our → team focus, consensus matters." },
                    { signal:"Energy", read:"Talkative → stay with it. Business → pivot. Don't force the wrong mode." },
                    { signal:"Complaint", read:"If they volunteer a frustration before you ask — that's the center. Note it." },
                  ].map((s,i)=>(
                    <div key={i} style={{ marginBottom:i<2?8:0, display:"flex", gap:10 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:"#5b8fd4", flexShrink:0, minWidth:80 }}>{s.signal}</span>
                      <span style={{ fontSize:13, color:"#7ab0d8", lineHeight:1.6 }}>{s.read}</span>
                    </div>
                  ))}
                </div>}

                {/* ROE CARDS */}
                <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>ROE — pick one</div>
                {[
                  { label:"A — Orlob", text:"Here's what I'm thinking in terms of an agenda. Let me know if you had something else in mind.\n\nThe objective of this meeting in my mind is simply to determine if we should have a next step. Obviously I don't expect us to do business on this call. So let's just learn enough about each other to determine whether the next logical step even makes sense.\n\nFair?\n\nGreat. Now here's the agenda I'm thinking:\n\nFirst, let's spend most of our time getting clear on the challenges you're facing.\n\nOnce we're clear on that, I can share a bit about what PandaDoc does and by the end of the call based on what we learn about each other, I'd like to put us in a position where we can jointly decide whether a next step makes sense or not. Either is completely fine. In fact, sometimes we're a perfect fit — other times, not so much. And I'll be sure to call that out if I hear something that gives me hesitation. On the other side, I'd invite you to let me know if you feel yourself starting to think this might not work — whether that's on pricing we can't agree on, a missing feature, or even intuition.\n\nDoes that agenda feel fair?" },
                  { label:"B — Hughes", text:"Here's what I'm thinking for today, feel free to let me know if you had something else in mind.\n\nMost calls like this start with feature dumping, jumping into the product prematurely, and taking you on a grand tour of which 90% of it is irrelevant.\n\nWhat I'd rather do is spend most of our time understanding what's actually going on in your world — why you're here, why today. And then I'll share how PandaDoc might help. At the end, I'd like to put us in a position to decide if a next step even makes sense. That next step would be a demo built specifically around our conversation.\n\nDoes that sound fair?" },
                  { label:"C — TJ", text:"Here's what I'm thinking for today — feel free to let me know if you had something else in mind.\n\nI know you want to see the product, and there are a lot of vendors out there who jump straight to a demo before they understand anything about your situation. I'd rather not do that — it wastes both our time and honestly doesn't serve you well.\n\nSo if it's okay with you, I'd love to spend the first part of this call just understanding where you are today — what's going on, why you're here, why now. From there I'll share a bit about how PandaDoc helps teams like yours, and by the end I'd like to put us in a position where we can both make a decision on whether a next step makes sense or not. The next call would be a tight demo built around what I heard today. Sometimes it's 20 minutes, sometimes 45. But specific to you.\n\nDoes that sound fair?" },
                ].map((s,i)=>{
                  const key=`open-${i}`, isOpen=collapsedCards[key]!==undefined ? !collapsedCards[key] : false;
                  return (<div key={i} style={{ marginBottom:8, borderRadius:10, overflow:"hidden", border:`1.5px solid ${isOpen?C.emerald:C.border}`, background:C.white }}>
                    <button onClick={()=>setCollapsedCards(s=>({...s,[key]:s[key]===undefined?true:!s[key]}))} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", background:isOpen?C.emeraldLight:C.white, border:"none", textAlign:"left" }}>
                      <span style={{ fontSize:15, fontWeight:700, color:isOpen?C.emerald:C.textPrimary }}>{s.label}</span>
                      <span style={{ fontSize:13, color:isOpen?C.emerald:C.textMuted, fontWeight:700 }}>{isOpen?"▲":"▼"}</span>
                    </button>
                    {isOpen && <div style={{ padding:"18px 22px", fontSize:15, color:C.textPrimary, lineHeight:1.9, whiteSpace:"pre-wrap", fontWeight:400, background:C.emeraldLight }}>{s.text}</div>}
                  </div>);
                })}


                {coachingVisible && <Collapsible label="⚠ Watch For" isOpen={watchOpen} onToggle={()=>setWatchOpen(v=>!v)} accent={C.coral}>
                  {["Thanking the prospect for their time — immediately positions you lower","Running both ROE versions back to back — pick one and commit"].map((w,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, marginBottom:i<1?12:0 }}><span style={{ background:C.coral, color:C.white, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, flexShrink:0, marginTop:3 }}>!</span><span style={{ fontSize:14, color:"#e07070", lineHeight:1.7 }}>{w}</span></div>
                  ))}
                </Collapsible>}
              </div>
            )}

            {/* BUYER TYPE */}
            {activeStage === "buyer-type" && renderBuyerType()}

                        {/* RHYTHM STAGES */}
            {sd && (
              <div>
                {sd.bridgeBanner && buyerPath && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, padding:"10px 16px", borderRadius:10, background: buyerPath==="evaluating"?"#111d30":buyerPath==="active-pain"?"#0f2b1e":"#1c1a0e", border:`1.5px solid ${buyerPath==="evaluating"?"#1e3a5f":buyerPath==="active-pain"?"#2d4a1e":"#4a3800"}` }}>
                    <span style={{ fontSize:16 }}>{buyerPath==="evaluating"?"⚡":buyerPath==="active-pain"?"⚠":"◎"}</span>
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:12, fontWeight:700, color: buyerPath==="evaluating"?"#5b8fd4":buyerPath==="active-pain"?C.emerald:"#c08a20" }}>
                        {buyerPath==="evaluating"?"Evaluating buyer — they came in solution-mode. You went back in time. Now anchor to the business problem.":buyerPath==="active-pain"?"Active pain buyer — they surfaced a challenge. Now prioritize it and validate it's a raging fire.":"Latent buyer — you ran the Discovery Prompter. Now find what resonated and anchor to it."}
                      </span>
                    </div>
                    <button onClick={()=>setActiveStage("buyer-type")} style={{ ...B, fontSize:10, color:C.textMuted, background:"transparent", border:`1px solid ${C.border}`, borderRadius:5, padding:"3px 8px", flexShrink:0 }}>← back</button>
                  </div>
                )}
                <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, letterSpacing:"0.06em", marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>{sd.rule}</div>
                {sd.rhythm.filter(r=>!r.fallback).map((r,i)=><RhythmCard key={i} r={r} idx={i} prefix={activeStage} />)}
                {sd.rhythm.some(r=>r.fallback) && coachingVisible && (
                  <Collapsible label="+ More techniques" isOpen={moreOpen} onToggle={()=>setMoreOpen(v=>!v)} accent={C.textMuted}>
                    {sd.rhythm.filter(r=>r.fallback).map((r,i)=><RhythmCard key={i} r={r} idx={i+100} prefix={activeStage+"-more"} />)}
                  </Collapsible>
                )}
                {coachingVisible && sd.tips && <Collapsible label="★ Coaching Tips" isOpen={tipsOpen} onToggle={()=>setTipsOpen(v=>!v)} accent={C.textSecondary}>
                  {sd.tips.map((t,i)=>(<div key={i} style={{ display:"flex", gap:12, marginBottom:i<sd.tips.length-1?12:0 }}><span style={{ color:C.textMuted, fontSize:14, flexShrink:0 }}>—</span><span style={{ fontSize:14, color:C.textSecondary, lineHeight:1.7 }}>{t}</span></div>))}
                </Collapsible>}
                {coachingVisible && <Collapsible label="⚠ Watch For" isOpen={watchOpen} onToggle={()=>setWatchOpen(v=>!v)} accent={C.coral}>
                  {sd.watch.map((w,i)=>(<div key={i} style={{ display:"flex", gap:12, marginBottom:i<sd.watch.length-1?14:0 }}><span style={{ background:C.coral, color:C.white, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, flexShrink:0, marginTop:3 }}>!</span><span style={{ fontSize:14, color:"#e07070", lineHeight:1.7 }}>{w}</span></div>))}
                </Collapsible>}
              </div>
            )}


            {/* OUTPUTS */}
            {activeStage === "outputs" && (
              <div>
                <div style={{ background:"#1c1a0e", border:"1.5px solid #7a6010", borderRadius:12, padding:"16px 20px", marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#d4a03a", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>No Logo Challenge — before you generate</div>
                  <div style={{ fontSize:14, color:"#b88a30", lineHeight:1.75 }}>Could someone read your description of this customer's problem and identify the company — without seeing the logo? If it describes every company on the planet, you haven't gone deep enough. That specificity is the acid test of good discovery.</div>
                </div>
                {/* CALL DEBRIEF */}
                <div style={{ background:C.white, border:`2px solid ${C.emerald}`, borderRadius:14, padding:26, marginBottom:18 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:C.textPrimary, marginBottom:4 }}>Post-Call Debrief</div>
                  <div style={{ fontSize:14, color:C.textMuted, marginBottom:18, lineHeight:1.6 }}>Paste your Granola transcript. Get specific coaching on exactly what you missed and what to say differently next time — referenced against the Orlob framework.</div>
                  <textarea
                    value={callTranscript}
                    onChange={e => setCallTranscript(e.target.value)}
                    placeholder="Paste your Granola transcript here... (e.g. 0:00 | Tyler — hey how's it going...)"
                    style={{ width:"100%", minHeight:160, fontSize:14, lineHeight:1.75, padding:"14px 16px", border:`1.5px solid ${C.border}`, borderRadius:10, background:"#111c28", color:"#eef2f7", resize:"vertical", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none", marginBottom:14 }}
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


          {/* NOTES */}
          <div style={{ position:"sticky", bottom:0, background:C.white, borderTop:`1px solid ${C.border}`, padding:"12px 36px", flexShrink:0 }}>
            <textarea
              value={stageNote}
              onChange={e=>setNotes(n=>({...n,[activeStage]:e.target.value}))}
              placeholder="Notes for this stage..."
              rows={2}
              style={{ width:"100%", fontSize:13, lineHeight:1.7, padding:"8px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, background:"#111c28", color:"#eef2f7", resize:"none", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }}
            />
          </div>
          </div>

          {/* RIGHT — SPICED + COACH */}
          <div style={{ width:rightPanelOpen?340:48, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, background:C.white, transition:"width 0.2s ease" }}>

            {/* COLLAPSE TOGGLE */}
            <button onClick={()=>setRightPanelOpen(v=>!v)} style={{ ...B, display:"flex", alignItems:"center", justifyContent:rightPanelOpen?"flex-end":"center", padding:"14px 12px", borderBottom:`1px solid ${C.border}`, background:"transparent", border:"none", color:C.textMuted, flexShrink:0, width:"100%" }} title={rightPanelOpen?"Collapse panel":"Expand panel"}>
              <span style={{ fontSize:16, fontWeight:700 }}>{rightPanelOpen?"→":"←"}</span>
            </button>

            {rightPanelOpen && <>
            {/* RIGHT PANEL TABS */}
            <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
              {[
                { id:"spiced",     label:"Questions" },
                { id:"enterprise", label:"Enterprise" },
                { id:"roi",        label:"ROI" },
              ].map(t => (
                <button key={t.id} onClick={()=>setRightTab(t.id)} style={{ ...B, flex:1, padding:"12px 4px", fontSize:13, fontWeight:800, letterSpacing:"0.03em", textTransform:"uppercase", border:"none", borderBottom: rightTab===t.id ? `2px solid ${C.emerald}` : "2px solid transparent", background: "transparent", color: rightTab===t.id ? C.emerald : "#a1a1aa", marginBottom:-1 }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* QUESTION BANK TAB */}
            {rightTab === "spiced" && (
              <div style={{ overflowY:"auto", flex:1 }}>
                <div style={{ padding:"18px 20px 10px", fontSize:12, fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase" }}>Question Bank</div>
                <div style={{ padding:"0 20px 8px", fontSize:12, color:C.textMuted, lineHeight:1.6 }}>If you're stuck uncovering any SPICED element — open it for questions to ask.</div>
                {SPICED_QUESTIONS.map(s=>{
                  const isOpen = openSpiced === s.key;
                  return (
                    <div key={s.key} style={{ borderTop:`1px solid ${C.border}` }}>
                      <button onClick={()=>setOpenSpiced(isOpen?null:s.key)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", background:isOpen?s.bg:"transparent", border:"none", textAlign:"left" }}>
                        <span style={{ fontSize:13, fontWeight:700, color:isOpen?s.color:C.textPrimary }}>{s.label}</span>
                        <span style={{ fontSize:14, color:isOpen?s.color:C.textMuted, fontWeight:700 }}>{isOpen?"▲":"▼"}</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding:"4px 20px 16px", background:s.bg, borderTop:`1px solid ${s.border}` }}>
                          {s.questions.map((q,i)=>(
                            <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:i<s.questions.length-1?12:0 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:s.color, marginTop:3, flexShrink:0 }}>→</span>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:13, color:"#eef2f7", lineHeight:1.7 }}>{q}</div>
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
            {/* ENTERPRISE TAB */}
            {rightTab === "enterprise" && (
              <div style={{ overflowY:"auto", flex:1 }}>
                <div style={{ padding:"18px 20px 6px", fontSize:12, fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase" }}>Enterprise Features</div>
                <div style={{ padding:"0 20px 12px", fontSize:12, color:C.textMuted, lineHeight:1.6 }}>Ask these mid-discovery. A yes to any red question = Enterprise is a no-brainer.</div>
                {[
                  { feature:"Workspaces", color:"#5b8fd4", bg:"#111d30", border:"#1e3a5f", questions:[
                    { q:"Which teams would realistically be using PandaDoc day-to-day?", hot:false },
                    { q:"Do different teams need their own templates, branding, or approval flows?", hot:false },
                    { q:"Would it ever be a problem if HR could see sales contracts — or vice versa?", hot:true },
                  ]},
                  { feature:"Smart Content", color:"#eef2f7", bg:C.emeraldLight, border:C.emeraldMid, questions:[
                    { q:"How much of your proposals stays the same vs. customized each time?", hot:false },
                    { q:"Do you have content that depends on industry, product, or region?", hot:false },
                    { q:"Do reps ever copy-paste sections from old docs to save time?", hot:true },
                    { q:"How do you make sure reps are using the right version of messaging?", hot:true },
                  ]},
                  { feature:"Approval Workflows", color:"#c08a20", bg:"#1c1a0e", border:"#4a3800", questions:[
                    { q:"At what point does a deal need internal approval today?", hot:false },
                    { q:"What usually triggers that — pricing, discounting, legal terms?", hot:false },
                    { q:"How do you handle approvals now — Slack, email, something else?", hot:false },
                    { q:"Ever had a deal go out that shouldn't have without approval?", hot:true },
                  ]},
                  { feature:"Renewal Notifications", color:"#9a80e0", bg:"#16122a", border:"#4a3a9a", questions:[
                    { q:"Do you manage contracts with renewal dates today?", hot:false },
                    { q:"How do you usually keep track of upcoming renewals?", hot:false },
                    { q:"Ever had something auto-renew or expire without your team noticing?", hot:true },
                  ]},
                  { feature:"Content Locking", color:"#e07070", bg:"#1e1010", border:"#f5a0a0", questions:[
                    { q:"How much flexibility do reps have when editing templates?", hot:false },
                    { q:"Are there parts of the doc that should never be changed?", hot:false },
                    { q:"Have you ever had issues with reps tweaking pricing, terms, or content?", hot:true },
                  ]},
                  { feature:"Redlining", color:"#5b8fd4", bg:"#111d30", border:"#1e3a5f", questions:[
                    { q:"How do contract negotiations usually happen today?", hot:false },
                    { q:"Do you go back and forth in Word or PDF — or directly in the doc?", hot:false },
                    { q:"Who's typically involved in reviewing changes — legal, finance, client?", hot:false },
                  ]},
                  { feature:"Salesforce / HubSpot 2-way Sync", color:"#eef2f7", bg:C.emeraldLight, border:C.emeraldMid, questions:[
                    { q:"How important is it that data flows both ways automatically?", hot:false },
                    { q:"Do reps update your CRM manually after sending docs?", hot:false },
                    { q:"Any errors or mismatches happening after that?", hot:true },
                    { q:"Do you need signed PDFs attached to records so legal or billing can see them?", hot:true },
                  ]},
                  { feature:"Custom Roles", color:"#c08a20", bg:"#1c1a0e", border:"#4a3800", questions:[
                    { q:"Do different people on your team need different levels of access?", hot:false },
                    { q:"Do you need to limit who can see certain templates, pricing, or actions?", hot:false },
                    { q:"Has someone ever accidentally changed or sent something they shouldn't have?", hot:true },
                  ]},
                  { feature:"SSO", color:"#9a80e0", bg:"#16122a", border:"#4a3a9a", questions:[
                    { q:"How does your team usually log into tools — individual logins or centralized?", hot:false },
                    { q:"Does your IT team require or enforce SSO for new tools?", hot:true },
                  ]},
                  { feature:"Whitelabeling", color:"#e07070", bg:"#1e1010", border:"#f5a0a0", questions:[
                    { q:"Do you want clients to feel like everything is coming directly from your domain?", hot:false },
                    { q:"Have you ever had issues with emails landing in spam or looking external?", hot:true },
                  ]},
                  { feature:"HIPAA Compliance", color:"#5b8fd4", bg:"#111d30", border:"#1e3a5f", questions:[
                    { q:"Does your company handle any personal health information (PHI)?", hot:false },
                    { q:"Is HIPAA compliance a requirement for any of the software you use?", hot:true },
                  ]},
                ].map((f, fi) => {
                  const isOpen = openSpiced === `ent-${fi}`;
                  return (
                    <div key={fi} style={{ borderTop:`1px solid ${C.border}` }}>
                      <button onClick={()=>setOpenSpiced(isOpen?null:`ent-${fi}`)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", background:isOpen?f.bg:"transparent", border:"none", textAlign:"left" }}>
                        <span style={{ fontSize:13, fontWeight:700, color:isOpen?f.color:C.textPrimary }}>{f.feature}</span>
                        <span style={{ fontSize:14, color:isOpen?f.color:C.textMuted, fontWeight:700 }}>{isOpen?"▲":"▼"}</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding:"4px 20px 16px", background:f.bg, borderTop:`1px solid ${f.border}` }}>
                          {f.questions.map((q,qi)=>(
                            <div key={qi} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:qi<f.questions.length-1?12:0 }}>
                              <span style={{ fontSize:12, fontWeight:800, color:q.hot?C.coral:f.color, marginTop:2, flexShrink:0 }}>{q.hot?"🔴":"→"}</span>
                              <div style={{ fontSize:13, color:q.hot?"#8b1a00":"#eef2f7", lineHeight:1.7, fontWeight:q.hot?600:400 }}>{q.q}</div>
                            </div>
                          ))}
                          {f.questions.some(q=>q.hot) && (
                            <div style={{ marginTop:12, fontSize:11, color:C.coral, fontWeight:600 }}>🔴 = yes to this → Enterprise is the right plan</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ROI TAB */}
            {rightTab === "roi" && (
              <div style={{ padding:24, overflowY:"auto", flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>ROI Calculator</div>
                <div style={{ fontSize:13, color:C.textMuted, marginBottom:20, lineHeight:1.6 }}>Fill in as they answer. Business case builds itself.</div>
                <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
                  {[
                    { key:"proposalsPerMonth", label:"Proposals / month",          placeholder:"e.g. 80" },
                    { key:"minsPerProposal",   label:"Avg time per proposal (min)", placeholder:"e.g. 120" },
                    { key:"teamSize",          label:"Number of AEs / reps",        placeholder:"e.g. 15" },
                    { key:"hourlyRate",        label:"Avg hourly cost per rep ($)",  placeholder:"e.g. 75" },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize:12, fontWeight:600, color:C.textSecondary, marginBottom:6 }}>{f.label}</div>
                      <input type="number" value={roi[f.key]} onChange={e=>setRoi(r=>({...r,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{ width:"100%", fontSize:15, fontWeight:600, padding:"10px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, background:"#111c28", color:"#eef2f7", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }} />
                    </div>
                  ))}
                </div>
                {(() => {
                  const ppm = parseFloat(roi.proposalsPerMonth);
                  const mpp = parseFloat(roi.minsPerProposal);
                  const ts  = parseFloat(roi.teamSize);
                  const hr  = parseFloat(roi.hourlyRate);
                  const pdm = 15;
                  if (!ppm || !mpp || !ts || !hr) return (
                    <div style={{ fontSize:13, color:C.textMuted, fontStyle:"italic", textAlign:"center", padding:"20px 0" }}>Fill in the fields above to see the business case</div>
                  );
                  const hoursNowYear  = (ppm * mpp / 60) * 12;
                  const costNowYear   = hoursNowYear * hr;
                  const hoursPDYear   = (ppm * pdm / 60) * 12;
                  const costPDYear    = hoursPDYear * hr;
                  const savedHours    = hoursNowYear - hoursPDYear;
                  const savedDollars  = costNowYear - costPDYear;
                  const savePct       = Math.round((1 - pdm / mpp) * 100);
                  const fmt  = n => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Math.round(n)}`;
                  const fmtH = n => n >= 1000 ? `${(n/1000).toFixed(1)}k hrs` : `${Math.round(n)} hrs`;
                  const cfoCopy = `Your team of ${Math.round(ts)} reps is spending ${fmtH(hoursNowYear)} a year — ${fmt(costNowYear)} in labor — just building proposals. With PandaDoc that drops to ${fmtH(hoursPDYear)}. That's ${fmtH(savedHours)} and ${fmt(savedDollars)} back to the business every year.`;
                  return (
                    <div>
                      {[
                        { label:"Current cost / yr",    value:fmt(costNowYear),   sub:`${fmtH(hoursNowYear)} building docs`,        color:C.coral,    bg:"#1e1010",    border:`${C.coral}50` },
                        { label:"With PandaDoc / yr",   value:fmt(costPDYear),    sub:`${fmtH(hoursPDYear)} at 15 min/proposal`,    color:C.emerald,  bg:C.emeraldLight, border:C.emeraldMid },
                        { label:"Annual value delta",   value:fmt(savedDollars),  sub:`${fmtH(savedHours)} reclaimed — ${savePct}% saved`, color:"#5b8fd4", bg:"#111d30", border:"#1e3a5f" },
                      ].map((m,i)=>(
                        <div key={i} style={{ background:m.bg, border:`1.5px solid ${m.border}`, borderRadius:10, padding:"14px 16px", marginBottom:10 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:m.color, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>{m.label}</div>
                          <div style={{ fontSize:26, fontWeight:800, color:m.color, letterSpacing:"-0.02em", marginBottom:3 }}>{m.value}</div>
                          <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>{m.sub}</div>
                        </div>
                      ))}
                      <div style={{ background:C.sand, border:`1.5px solid ${C.border}`, borderRadius:10, padding:"14px 16px", marginTop:4 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:C.textPrimary, marginBottom:8 }}>CFO-worthy framing</div>
                        <div style={{ fontSize:13, color:C.textSecondary, lineHeight:1.75, marginBottom:10 }}>"{cfoCopy}"</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
