import { useState, useRef, useEffect } from "react";

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
  yellow: "#fdf6dc",
  yellowBorder: "#efd98f",
  yellowText: "#7d6214",
  coral: "#c44848",
  coralLight: "#fdf2f2",
  coralBorder: "#f3c9c9",
  coralText: "#9b2c2c",
  amber: "#b45309",
  sand: "#f8f9fb",
};

// Strip "Q1 — " / "Say — " / "3 — " prefixes: the card's badge already carries that.
function cleanLabel(label = "") {
  return label.replace(/^(Q\d+|Say|\d+)\s*[—–-]\s*/, "").replace(/^Say$/, "");
}

// Teleprompter text: lines within a paragraph reflow into one sentence; "\n\n" = a pause (new paragraph).
// [Placeholder] tokens are highlighted so they read as "fill this in".
function Script({ text, size = 19, weight = 500, color = C.textPrimary }) {
  const paras = String(text).split(/\n\s*\n/);
  const renderLine = (line, k) => line.split(/(\[[^\]]+\])/g).map((seg, j) =>
    /^\[[^\]]+\]$/.test(seg)
      ? <span key={`${k}-${j}`} style={{ background:"#e8eefc", color:"#1d4ed8", borderRadius:4, padding:"0 3px", fontWeight:600 }}>{seg}</span>
      : <span key={`${k}-${j}`}>{seg}</span>
  );
  return (
    <div style={{ fontSize:size, lineHeight:1.5, fontWeight:weight, color, letterSpacing:"-0.005em" }}>
      {paras.map((p, i) => (
        <div key={i} style={{ marginTop: i ? "0.7em" : 0 }}>
          {renderLine(p.replace(/\s*\n\s*/g, " "), i)}
        </div>
      ))}
    </div>
  );
}

const fmtClock = ms => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const STAGES = [
  { id:"prep",               icon:"◎",  short:"Prep Brief",               group:"setup" },
  { id:"rapport-opener",     icon:"1",  short:"Rapport + Opener",         group:"setup" },
  { id:"rules-engagement",   icon:"2",  short:"Rules of Engagement",      group:"setup" },
  { id:"buyer-journey",      icon:"3",  short:"Buyer Journey",            group:"setup" },
  { id:"need-behind-need",   icon:"4",  short:"Need Behind the Need",     group:"discovery" },
  { id:"baseline-current",   icon:"5",  short:"Baseline Current State",   group:"discovery" },
  { id:"validate-problem",   icon:"6",  short:"Validate the Problem",     group:"discovery" },
  { id:"cause-analysis",     icon:"7",  short:"Cause Analysis",           group:"discovery" },
  { id:"negative-impact",    icon:"8",  short:"Negative Impact",          group:"discovery" },
  { id:"future-state",       icon:"9",  short:"Future State",             group:"discovery" },
  { id:"close-next-steps",   icon:"10", short:"Close + Next Steps",       group:"close" },
  { id:"outputs",            icon:"✦",  short:"Outputs",                  group:"close" },
];

// Phase + timebox per stage (from the designed template)
const STAGE_META = {
  "rapport-opener":   { phase:"OPEN",            timebox:"2 min" },
  "rules-engagement": { phase:"ALIGN",           timebox:"3 min" },
  "buyer-journey":    { phase:"BUSINESS PROBLEM",timebox:"2 min" },
  "need-behind-need": { phase:"BUSINESS PROBLEM",timebox:"3 min" },
  "baseline-current": { phase:"CURRENT STATE",   timebox:"4 min" },
  "validate-problem": { phase:"BUSINESS PROBLEM",timebox:"2 min" },
  "cause-analysis":   { phase:"CAUSE ANALYSIS",  timebox:"4 min" },
  "negative-impact":  { phase:"NEGATIVE IMPACT", timebox:"4 min" },
  "future-state":     { phase:"FUTURE STATE",    timebox:"3 min" },
  "close-next-steps": { phase:"CLOSE",           timebox:"3 min" },
};

const SPICED_QUESTIONS = [
  {
    key:"situation",
    label:"S — Situation",
    color:"#2563eb",
    bg:"#eef3ff",
    border:"#bccdf5",
    questions:[
      "How many people are involved in this process day to day?",
      "What kind of volume are we talking about — monthly or annually?",
      "Which departments or teams would be affected by a change here?",
      "Walk me through the process end to end — what happens first, and what happens last?",
      "What are you using today to handle this, if anything?",
      "What systems would a solution need to work with?",
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
    color:"#a07820",
    bg:"#fdf7e6",
    border:"#c09818",
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
    color:"#2563eb",
    bg:"#eef3ff",
    border:"#7ba3f0",
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
    color:"#2563eb",
    bg:"#eef3ff",
    border:"#7ba3f0",
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




export default function App() {
  const [activeStage, setActiveStage] = useState("prep");
  const [buyerPath, setBuyerPath] = useState(null);
  const [selectedTree, setSelectedTree] = useState(null);
  const [callSource, setCallSource] = useState(null);
  const [notes, setNotes] = useState({});
  const [noteOpen, setNoteOpen] = useState({});
  const [liveMode, setLiveMode] = useState(false);
  const [liveMeetingTitle, setLiveMeetingTitle] = useState("");
  const [liveAnalyzing, setLiveAnalyzing] = useState(false);
  const [liveStatus, setLiveStatus] = useState(""); // status message shown in UI
  const [liveLastPoll, setLiveLastPoll] = useState(null); // timestamp of last successful poll
  const liveLastLength = useRef(0);
  const cardRegistry = useRef({});
  const [prepBrief, setPrepBrief] = useState("");
  const [openSpiced, setOpenSpiced] = useState(null);
  const [prepOpen, setPrepOpen] = useState(false);
  const [outputs, setOutputs] = useState({ spiced:"", email:"", score:"", whatweheard:"", debrief:"", fixplan:"" });
  const [outputLoading, setOutputLoading] = useState("");
  const [fixPlanLoading, setFixPlanLoading] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState({});
  const [briefFields, setBriefFields] = useState({ prospect:"", company:"", role:"", tool:"", reps:"", volume:"", timePerDoc:"", metric:"", pain:"", integrations:"", approval:"" });
  const [coveredCards, setCoveredCards] = useState({});
  const [briefParsing, setBriefParsing] = useState(false);
  const [questionnaireText, setQuestionnaireText] = useState("");
  const [briefParseStatus, setBriefParseStatus] = useState("");
  const [roi, setRoi] = useState({ unitsPerMonth:"", minsPerUnit:"", teamSize:"", hourlyRate:"75", targetTimeMins:"15" });
  const [rightTab, setRightTab] = useState("spiced"); // "spiced" | "enterprise" | "roi"
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
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
  const [callStart, setCallStart] = useState(null);
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

  useEffect(() => { setTipsOpen(false); setWatchOpen(false); }, [activeStage]);

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' && currentIdx < STAGES.length - 1) setActiveStage(STAGES[currentIdx + 1].id);
      if (e.key === 'ArrowLeft' && currentIdx > 0) setActiveStage(STAGES[currentIdx - 1].id);
      // Number keys 1-9: mark question N on this stage as asked (toggle)
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) {
        const key = `${activeStage}-${n}`;
        setCoveredCards(s => ({ ...s, [key]: !s[key] }));
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
    const allNotes = Object.entries(notes).filter(([,v])=>v).map(([k,v])=>k+": "+v).join("\n");
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
- prospect: first name only (explicit)
- company: company name (explicit)
- role: their exact job title (explicit)
- tool: current tools/state explicitly named
- reps: team size — digits only e.g. "40", NOT words like "forty". Use "" if not a specific number
- volume: volume per month — digits only. Use "" if not stated
- timePerDoc: minutes per unit — digits only. Use "" if not stated
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
    if (briefFields.prospect)   t = t.replace(/\[Names?\]/g, briefFields.prospect);
    if (briefFields.metric)    t = t.replace(/\[metric they named\]/g, briefFields.metric);
    if (briefFields.reps)       t = t.replace(/\[X\] reps/g, `${briefFields.reps} reps`);
    if (briefFields.volume)     t = t.replace(/\[Y\] agreements a month/g, `${briefFields.volume} agreements a month`);
    if (briefFields.timePerDoc) t = t.replace(/\[Z\] minutes each/g, `${briefFields.timePerDoc} minutes each`).replace(/\[X minutes\]/g, `${briefFields.timePerDoc} minutes`);
    return t;
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
        No tree selected. <button onClick={() => setActiveStage("need-behind-need")} style={{ ...B, color:C.emerald, background:"none", border:"none", fontWeight:600 }}>← Go back</button>
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
          <button onClick={() => setActiveStage("need-behind-need")} style={{ ...B, fontSize:11, color:C.textMuted, background:"none", border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 12px", fontWeight:600 }}>← change</button>
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
    const rawText = r.text || (r.alts ? r.alts.join("\n\n— or —\n\n") : "");
    const text = fillTemplate(rawText);
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
        <Script text={text} size={20} />
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
          <Script text={text} size={19} />
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
          <button onClick={()=>setActiveStage("need-behind-need")} style={{ ...B, width:"100%", marginTop:14, padding:"14px 20px", background:C.emerald, border:"none", borderRadius:12, fontSize:15, fontWeight:700, color:"#fff", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>Summarize, then find the need behind the need</span><span style={{ fontSize:18 }}>→</span>
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
          <button onClick={()=>setActiveStage("need-behind-need")} style={{ ...B, width:"100%", marginTop:14, padding:"14px 20px", background:C.emerald, border:"none", borderRadius:12, fontSize:15, fontWeight:700, color:"#fff", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>Summarize, then find the need behind the need</span><span style={{ fontSize:18 }}>→</span>
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
              "1 — PROBLEM: \"Most of our customers before working with us were struggling with [pain statement — e.g. sales teams spending 30-45 minutes building every proposal by hand, copy-pasting from Word, chasing signatures over email].\"",
              "2 — AGITATE: \"They were dealing with [articulate pain better than they can — e.g. no visibility into whether prospects opened what they sent, deals going cold in the last mile, reps burning time on admin instead of selling].\"",
              "3 — FAILED ATTEMPTS: \"Before partnering with us, they had tried [traditional solutions — e.g. better Word templates, DocuSign standalone, spreadsheets to track] but all of them fell short. So they gave up and assumed they'd have to live with it.\"",
              "4 — NEW APPROACH: \"When they met us, they realized we have a unique approach that gets at the source of the problem — [tease it lightly, don't go into feature detail].\"",
              "5 — POSITIVE OUTCOME: \"After rolling this out, most of our customers see [business outcome — e.g. proposals out in under 10 minutes, signatures back same day]. In fact, [short customer story with a metric].\"",
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
          <button onClick={()=>setActiveStage("need-behind-need")} style={{ ...B, width:"100%", marginTop:14, padding:"14px 20px", background:C.emerald, border:"none", borderRadius:12, fontSize:15, fontWeight:700, color:"#fff", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>Summarize, then find the need behind the need</span><span style={{ fontSize:18 }}>→</span>
          </button>
        </>}
      </div>
    );
  }

  const STAGE_DATA = {
    "rules-engagement": {
      rule:"Align on the objective, the agenda, and the decision to be made.",
      rhythm:[
        { type:"say", label:"Say \u2014 Rules of Engagement", text:"Here's what I'm thinking\nin terms of an agenda.\n\nLet me know if you had\nsomething else in mind\u2026\n\nThe outcome I recommend we shoot for\nis to learn enough about each other\nto decide whether or not\nit makes sense to have a second meeting.\n\nObviously, I don't expect us\nto do business on this call.\n\nSo let's just learn enough about each other\nto determine if another call makes sense.\n\nIs that fair so far?\n\nPerfect.\n\nNow here's the agenda\nI'm thinking will help us get there.\n\nFirst, I'll share a little about [Company] upfront\nso you have the context\nfor the rest of the call.\n\nI'd love to spend most of our time today\ngetting clear on the different challenges or goals\nyou might have\nas they relate to [their top initiatives].\n\nOnce we're clear on that\u2014\nand if I think we can help\u2014\nI'll explain more about how it works\nso you have an understanding.\n\nThen we can jointly decide\nwhether we set that next step.\n\nAnd I'll save some time\nat the end for that.\n\nDoes that agenda feel reasonable and fair?\n\nGreat.\n\nLet's take a crack at it." },
      ],
      tips:["Align on the objective, the agenda, and the decision to be made.","Pause after each fairness check and let them answer."],
      watch:["Rushing past the fairness checks without pausing","Skipping the agenda after they agree to the objective"],
    },
    "buyer-journey": {
      rule:"Choose one route, not all three. For an active buyer, go back in time. For an outbound buyer, lead with context.",
      rhythm:[
        { type:"say", label:"Say", text:"To start\u2014\n\ntake me back to the beginning." },
        { type:"ask", label:"Q1 \u2014 Origin", text:"What was going on in your business\nthat made you start exploring solutions like ours\nin the first place?" },
        { type:"ask", label:"Q2 \u2014 The moment", text:"Can you walk me back\nto the moment this became a priority?\n\nWhat happened?" },
        { type:"ask", label:"Q3 \u2014 Their world", text:"It seems like [relevant company or market observation].\n\nHow are you seeing that\nshow up in your world?" },
      ],
      tips:["Choose one route, not all three.","For an active buyer, go back in time. For an outbound buyer, lead with context."],
    },
    "need-behind-need": {
      rule:"Find the need behind the need. Don't stop at the symptom.",
      rhythm:[
        { type:"say", label:"Say", text:"I understand why you would want\n[surface need].\n\nBut what's actually going on?" },
        { type:"ask", label:"Q1 \u2014 Priority driver", text:"What's causing that\nto be a priority?" },
        { type:"ask", label:"Q2 \u2014 Energy", text:"What's driving you\nto prioritize that?" },
        { type:"ask", label:"Q3 \u2014 Business driver", text:"What is going on in your business\nthat's driving you\nto put the focus and energy on that?" },
      ],
      tips:["Keep asking only while the answer is still a symptom, capability, or surface-level need."],
      watch:["Stopping at the symptom and moving on","Asking all three back to back like a checklist"],
    },
    "baseline-current": {
      rule:"Map where they are today. Capture their exact words and units.",
      rhythm:[
        { type:"say", label:"Say", text:"I'm asking because\u2014\n\nif we end up doing business together,\nyour CFO is probably going to care about this." },
        { type:"ask", label:"Q1 \u2014 Metric", text:"What metric do you think\nwould improve the most\nif we solved this challenge?" },
        { type:"ask", label:"Q2 \u2014 Current state", text:"What's the current state\nof that metric?" },
        { type:"ask", label:"Q3 \u2014 Target", text:"Where should it be?\n\nAnd why should it be there?" },
      ],
      tips:["Capture their exact words and units.","Do not invent a number if they do not know it yet."],
      watch:["Moving on without a metric","Paraphrasing their numbers instead of using their exact words"],
    },
    "validate-problem": {
      rule:"Get explicit agreement that this is the right problem and that it is worth solving now.",
      rhythm:[
        { type:"say", label:"Say", text:"Before we go too much further\u2014\n\nI want to make sure\nwe're anchoring this conversation\nto the right thing." },
        { type:"ask", label:"Q1 \u2014 Anchor check", text:"Is this the challenge\nwe should be focused on solving together?\n\nOr are there other things\nthat are going to overpower this?" },
        { type:"ask", label:"Q2 \u2014 Priority test", text:"Is this going to make its way\nonto your priorities slide?\n\nOr is this a shiny object?" },
      ],
      tips:["Get explicit agreement that this is the right problem and that it is worth solving now."],
      watch:["Happy ears \u2014 getting excited before validating it is a raging fire","Skipping this because it feels confrontational"],
    },
    "cause-analysis": {
      rule:"Mutually identify the true root cause. Their perceived cause sets the buying criteria.",
      rhythm:[
        { type:"say", label:"Say \u2014 Summarize first", text:"Let me summarize\nwhat I've heard so far.\n\n[business problem and current state]\n\nDid I get that right?" },
        { type:"ask", label:"Q1 \u2014 Open diagnostic", text:"Why do you think\nthis challenge is happening?" },
        { type:"ask", label:"Q2 \u2014 Blocker", text:"What's preventing you\nfrom improving it?" },
        { type:"ask", label:"Q3 \u2014 Suspected cause", text:"To what extent do you think\n[suspected root cause]\nis contributing to the challenge?" },
      ],
      tips:["Ask the open diagnostic first, then one or two targeted questions.","Their perceived cause sets the buying criteria."],
      watch:["Accepting the first answer as the root cause","Leading them to your conclusion instead of letting them arrive at it"],
    },
    "negative-impact": {
      rule:"Explore cost, consequences, and ripple effects. One or two negative ramifications is enough on a first call.",
      rhythm:[
        { type:"say", label:"Say \u2014 Summarize first", text:"All right.\n\nOne more time,\nlet me summarize what I've heard.\n\n[business problem + root causes]\n\nDid I get that right?" },
        { type:"ask", label:"Q1 \u2014 Ripple effects", text:"What ripple effects\nare you seeing this challenge have\non the rest of the business?" },
        { type:"ask", label:"Q2 \u2014 Derailed", text:"What would get derailed\nif you didn't make progress\nin solving these challenges?" },
        { type:"ask", label:"Q3 \u2014 Who else", text:"Who else does this challenge impact\nwithin the business?\n\nAnd how?" },
        { type:"ask", label:"Q4 \u2014 Cost", text:"What's the financial cost\nof not closing that gap\nper month?" },
      ],
      tips:["After they confirm the summary, explore cost, consequences, and ripple effects.","One or two negative ramifications is enough on a first call."],
      watch:["More than 3 impact questions \u2014 diminishing returns fast","Asking about cost before they confirm the summary"],
    },
    "future-state": {
      rule:"Contrast painful present with compelling future. Ask the open question first.",
      rhythm:[
        { type:"say", label:"Say \u2014 Summarize first", text:"Let me summarize\nwhat I've heard about the challenges so far.\n\n[brief summary]\n\nDid I get that right?" },
        { type:"ask", label:"Q1 \u2014 Open", text:"What do you think you need\nto solve this challenge?" },
        { type:"ask", label:"Q2 \u2014 Ideas", text:"Can I try\na few additional ideas on you?" },
        { type:"ask", label:"Q3 \u2014 Capability test", text:"Imagine being able to [capability].\n\nTo what degree would that move the needle\non the problem we're talking about?" },
      ],
      tips:["Ask the open question first.","Only then test targeted capabilities tied to the root causes they named."],
      watch:["Pitching capabilities before asking what they think they need","Skipping the summary \u2014 the contrast is where the feeling of value lives"],
    },
    "close-next-steps": {
      rule:"Call back the ROE. Leave with a concrete decision \u2014 a next step is not real until it has an owner and a date.",
      rhythm:[
        { type:"say", label:"Say \u2014 Honest read", text:"At the beginning of this call,\nwe agreed we'd decide\nwhether it makes sense\nto schedule a next logical step\u2014\n\nor go our separate ways\nso we don't waste each other's time.\n\nThe sense I'm getting is\n[your honest read]." },
        { type:"ask", label:"Q1 \u2014 Fairness check", text:"Does that feel fair\nto you?" },
        { type:"ask", label:"Q2 \u2014 Next step", text:"What should the next logical step look like?\n\nAnd who needs to be there?" },
        { type:"ask", label:"Q3 \u2014 Date", text:"Can we put a specific date\non the calendar now?" },
      ],
      tips:["Leave with a concrete decision.","A next step is not real until it has an owner and a date."],
      watch:["Leaving without a booked meeting \u2014 'I'll send some times' is not a next step","Skipping the ROE callback \u2014 the ask lands cold without it"],
    },
  };

const sd = STAGE_DATA[activeStage];

  const meta = STAGE_META[activeStage] || {};
  const timeboxMs = (parseInt(meta.timebox) || 0) * 60000;
  const stageElapsed = now - stageStart;
  const overTime = timeboxMs && stageElapsed > timeboxMs;
  const nextStage = STAGES[currentIdx + 1];
  const stageTitle = {"prep":"Pre-Call Prep Brief","rapport-opener":"Rapport + Opener","rules-engagement":"Rules of Engagement","buyer-journey":"Buyer Journey Alignment","need-behind-need":"Need Behind the Need","baseline-current":"Baseline the Current State","validate-problem":"Validate the Business Problem","cause-analysis":"Cause Analysis","negative-impact":"Build Negative Impact","future-state":"Future State","close-next-steps":"Close + Next Steps","outputs":"Outputs"}[activeStage];
  const stageSub = {"prep":"Paste your prep brief. Everything downstream personalizes from this.","rapport-opener":"Land the opener. Read the room.","outputs":"Generate your end-of-call outputs."}[activeStage];
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
          {["setup","discovery","close"].map(group => {
            const groupStages = STAGES.filter(s => s.group === group);
            const groupLabel = group === "setup" ? "Setup" : group === "discovery" ? "Discovery" : "Close";
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
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

        {/* TOP BAR */}
        <div style={{ padding:"12px 24px 12px 32px", borderBottom:`1px solid ${C.border}`, background:C.white, display:"flex", alignItems:"center", gap:16, flexShrink:0 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.textMuted, marginBottom:3 }}>
              {isNumbered && <span>Step {STAGES[currentIdx].icon} of 10</span>}
              {meta.phase && <><span style={{ color:C.border }}>•</span><span style={{ color:C.emerald }}>{meta.phase}</span></>}
              {(briefFields.prospect || briefFields.company) && activeStage !== "prep" && (
                <><span style={{ color:C.border }}>•</span><span style={{ color:C.textSecondary, textTransform:"none", letterSpacing:0, fontWeight:600 }}>{[briefFields.prospect, briefFields.company].filter(Boolean).join(" @ ")}</span></>
              )}
            </div>
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
            <button
              onClick={() => { setLiveMode(v => !v); liveLastLength.current = 0; }}
              style={{ ...B, fontSize:12, padding:"8px 12px", border:`1px solid ${liveMode ? "#f3c9c9" : C.border}`, borderRadius:8, background:liveMode ? "#fdf2f2" : C.white, color:liveMode ? C.coral : C.textSecondary, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}
            >
              <span style={{ width:7, height:7, borderRadius:"50%", background:liveMode ? C.coral : C.textMuted, display:"inline-block", animation: liveMode ? "pulse 1.5s infinite" : "none" }} />
              {liveAnalyzing ? "Analyzing…" : liveMode ? `Live${liveMeetingTitle ? ` — ${liveMeetingTitle.slice(0,20)}` : ""}` : "Go live"}
            </button>
            <button onClick={()=>setCoachingVisible(v=>!v)} title="Show coaching notes, tips and watch-outs" style={{ ...B, fontSize:12, padding:"8px 12px", border:`1px solid ${coachingVisible ? C.emeraldMid : C.border}`, borderRadius:8, background:coachingVisible?C.emeraldLight:C.white, color:coachingVisible?"#1d4ed8":C.textSecondary, fontWeight:600 }}>Coaching {coachingVisible ? "on" : "off"}</button>
            {showOutputsShortcut && <button onClick={()=>setActiveStage("outputs")} style={{ ...B, fontSize:12, padding:"8px 12px", border:`1px solid ${C.border}`, borderRadius:8, background:C.white, color:C.textSecondary, fontWeight:600 }}>✦ Outputs</button>}
            <div style={{ width:1, height:28, background:C.border, margin:"0 4px" }} />
            <button disabled={currentIdx === 0} onClick={()=>setActiveStage(STAGES[currentIdx-1].id)} title="Previous (←)" style={{ ...B, fontSize:16, width:38, height:38, border:`1px solid ${C.border}`, borderRadius:8, background:C.white, color:C.textSecondary, fontWeight:600, opacity:currentIdx === 0 ? 0.4 : 1 }}>←</button>
            {nextStage && <button onClick={()=>setActiveStage(nextStage.id)} title="Next (→)" style={{ ...B, height:38, padding:"0 16px", border:"none", borderRadius:8, background:C.emerald, color:C.white, fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }}>
              <span style={{ opacity:0.75, fontWeight:600 }}>Next</span>{nextStage.short}<span style={{ fontSize:16 }}>→</span>
            </button>}
          </div>
        </div>

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
                      <textarea value={prepBrief} onChange={e=>setPrepBrief(e.target.value)} placeholder={"CALL BRIEF: [Company] — [Date]\n\nContact: [Name], [Title] | Tenure: X years\nCall Source: Inbound/Outbound\n\nMoney Signals: ...\nTech Stack: ...\nCompelling Trigger: ...\nOpen Gaps: ..."} style={{ width:"100%", minHeight:180, fontSize:14, lineHeight:1.8, padding:"14px 16px", border:`1.5px solid ${C.emeraldMid}`, borderRadius:10, background:"#f7f8fa", color:C.textPrimary, resize:"vertical", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }} />
                      {prepBrief && <div style={{ marginTop:12, fontSize:14, color:C.emerald, fontWeight:600 }}>✓ Brief loaded — coach personalized to this prospect</div>}
                    </div>
                  )}
                </div>
                {/* PRE-CALL INTEL */}
                <div style={{ background:"#eef3ff", border:"1.5px solid #7ba3f0", borderRadius:12, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#2563eb", marginBottom:12 }}>Pre-Call Intel</div>
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, color:"#2b4fa3", fontWeight:700, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em" }}>Paste questionnaire answers (brief goes above ↑) → auto-fill fields</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <textarea
                        value={questionnaireText}
                        onChange={e => setQuestionnaireText(e.target.value)}
                        placeholder="Paste questionnaire answers or additional context here..."
                        rows={3}
                        style={{ flex:1, fontSize:12, padding:"8px 12px", border:"1.5px solid #7ba3f0", borderRadius:7, background:"#f7f8fa", color:C.textPrimary, resize:"none", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }}
                      />
                      <button onClick={parseBrief} disabled={briefParsing || (!prepBrief.trim() && !questionnaireText.trim())} style={{ ...B, fontSize:12, padding:"0 16px", borderRadius:7, border:"none", background: briefParsing ? "#c0dac8" : (!prepBrief.trim() && !questionnaireText.trim()) ? "#e8edf7" : C.emerald, color: (!prepBrief.trim() && !questionnaireText.trim()) ? "#9080c8" : "#fff", fontWeight:700, whiteSpace:"nowrap", alignSelf:"stretch" }}>
                        {briefParsing ? "Parsing..." : "⚡ Auto-fill"}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:"#9080c8", marginBottom:16 }}>Or fill in manually below:</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {[
                      { key:"prospect",    label:"Prospect name",       placeholder:"e.g. Jane" },
                      { key:"company",     label:"Company",              placeholder:"e.g. Acme Health" },
                      { key:"role",        label:"Their role",           placeholder:"e.g. VP of Operations" },
                      { key:"tool",        label:"Current state / tools", placeholder:"e.g. spreadsheets + email" },
                      { key:"reps",        label:"Team size",            placeholder:"e.g. 40" },
                      { key:"volume",      label:"Volume",               placeholder:"e.g. 200 / month" },
                      { key:"timePerDoc",  label:"Time per unit (min)",  placeholder:"e.g. 45" },
                      { key:"metric",      label:"Their metric / goal",  placeholder:"e.g. retention rate, time to fill" },
                      { key:"integrations",label:"Integrations needed",  placeholder:"e.g. Salesforce, Workday" },
                      { key:"approval",    label:"Approval process",     placeholder:"e.g. CFO signs off over $50k" },
                      { key:"pain",        label:"Known pain",           placeholder:"e.g. losing new hires in year one" },
                    ].map(f => (
                      <div key={f.key} style={f.key === "pain" ? { gridColumn:"1 / -1" } : {}}>
                        <div style={{ fontSize:10, color:"#2b4fa3", fontWeight:700, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.07em" }}>{f.label}</div>
                        <input
                          value={briefFields[f.key]}
                          onChange={e => setBriefFields(s => ({ ...s, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          style={{ width:"100%", fontSize:13, padding:"7px 11px", border:"1.5px solid #7ba3f0", borderRadius:7, background:"#f7f8fa", color:C.textPrimary, outline:"none", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif" }}
                        />
                      </div>
                    ))}
                  </div>
                  {briefParseStatus === "ok" && <div style={{ marginTop:12, padding:"7px 14px", background:"#e9effe", borderRadius:8, border:"1px solid #2563eb", fontSize:12, color:"#2563eb", fontWeight:600 }}>✓ Fields populated from brief</div>}
                  {briefParseStatus.startsWith("error") && <div style={{ marginTop:12, padding:"7px 14px", background:"#fdf2f2", borderRadius:8, border:"1px solid #e05c5c", fontSize:11, color:"#e05c5c", fontWeight:500, wordBreak:"break-all" }}>{briefParseStatus}</div>}
                  {Object.values(briefFields).some(v => v) && briefParseStatus !== "ok" && (
                    <div style={{ marginTop:14, padding:"8px 14px", background:"#e9effe", borderRadius:8, border:"1px solid #2563eb", fontSize:12, color:"#2563eb", fontWeight:600 }}>
                      ✓ Intel loaded — matching cards will show pre-answered during the call
                    </div>
                  )}
                </div>

                <div style={{ background:"#eef3ff", border:"1.5px solid #bccdf5", borderRadius:12, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#2563eb", marginBottom:14 }}>Pre-call behavioral read — Hughes Six-Minute X-Ray</div>
                  <div style={{ fontSize:13, color:"#1d4ed8", lineHeight:1.7, marginBottom:12 }}>Based on their email, LinkedIn, or context — profile before you dial. You're looking for three things:</div>
                  {[
                    { label:"Primary Social Need", detail:"What makes them feel significant? Approval (they want validation), Power (they want control), Intelligence (they want to be seen as sharp), Acceptance (they want to belong). Tailor your opener to meet that need." },
                    { label:"Decision Style", detail:"Novelty seeker (show them something new), Social conformist (show them who else uses it), Necessity driven (show them the cost of not acting), Investment driven (show them the ROI math)." },
                    { label:"Sensory preference", detail:"Scan their writing. Visual = 'I see,' 'looks like,' 'picture this.' Auditory = 'sounds right,' 'rings true.' Kinesthetic = 'feels like,' 'get a sense.' Mirror their language in the call." },
                  ].map((s,i)=>(
                    <div key={i} style={{ marginBottom:i<2?12:0, paddingBottom:i<2?12:0, borderBottom:i<2?`1px solid #d5e2fa`:"none" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#2563eb", marginBottom:4 }}>{s.label}</div>
                      <div style={{ fontSize:13, color:"#1d4ed8", lineHeight:1.65 }}>{s.detail}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#fdf7e6", border:"1.5px solid #c09818", borderRadius:12, padding:20, marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#a07820", marginBottom:14 }}>PCP Model — Hughes. Set this before every call.</div>
                  <div style={{ fontSize:13, color:"#7a5a10", lineHeight:1.7, marginBottom:14 }}>Every human decision flows through 3 steps. Control the frame, control the outcome.</div>
                  {[
                    { letter:"P", label:"Perception", desc:"Change how they see the situation before discovery starts. Your opener sets what this meeting means. 'A lot of vendors jump to a demo before understanding anything about you. That's not how I want to spend our time.'" },
                    { letter:"C", label:"Context", desc:"Context dictates what behavior is permissible. The ROE sets the context — mutual discovery, not a pitch. Once the context is set, the prospect knows what's expected of them." },
                    { letter:"P", label:"Permission", desc:"Context gives permission. When you say 'does that feel fair?' — you're granting them permission to engage as a peer. When you summarize and ask 'did I get that right?' — you're giving them permission to correct and go deeper." },
                  ].map((s,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, marginBottom:i<2?12:0, paddingBottom:i<2?12:0, borderBottom:i<2?"1px solid #f0d870":"none" }}>
                      <span style={{ fontSize:18, fontWeight:800, color:"#a07820", flexShrink:0, minWidth:22 }}>{s.letter}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#a07820", marginBottom:3 }}>{s.label}</div>
                        <div style={{ fontSize:13, color:"#7a5a10", lineHeight:1.65 }}>{s.desc}</div>
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
            {activeStage === "rapport-opener" && (
              <div>
                {/* OPENER — teleprompter */}
                <RhythmCard r={{ type:"say", label:"Opener", text:"Hey [Names]\u2014\nglad we found the time to meet today.\n\nHow's your week been?\n\nWell, cool.\nWe've got a lot to get to today.\n\nMind if we talk about the agenda?" }} idx={0} prefix="rapport-opener" />

                {/* HUGHES SIGNALS */}
                {coachingVisible && <div style={{ marginBottom:16, background:"#eef3ff", border:"1.5px solid #bccdf5", borderRadius:10, padding:"14px 18px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#2563eb", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Read them in the first 60 seconds — Hughes</div>
                  {[
                    { signal:"Pronouns", read:"I/me/my → individual, personal stakes matter. We/us/our → team focus, consensus matters." },
                    { signal:"Energy", read:"Talkative → stay with it. Business → pivot. Don't force the wrong mode." },
                    { signal:"Complaint", read:"If they volunteer a frustration before you ask — that's the center. Note it." },
                  ].map((s,i)=>(
                    <div key={i} style={{ marginBottom:i<2?8:0, display:"flex", gap:10 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:"#2563eb", flexShrink:0, minWidth:80 }}>{s.signal}</span>
                      <span style={{ fontSize:13, color:"#1d4ed8", lineHeight:1.6 }}>{s.read}</span>
                    </div>
                  ))}
                </div>}

                {coachingVisible && <Collapsible label="⚠ Watch For" isOpen={watchOpen} onToggle={()=>setWatchOpen(v=>!v)} accent={C.coral}>
                  {["Thanking the prospect for their time — immediately positions you lower","Running ROE versions back to back — pick one and commit"].map((w,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, marginBottom:i<1?12:0 }}><span style={{ background:C.coral, color:C.white, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, flexShrink:0, marginTop:3 }}>!</span><span style={{ fontSize:14, color:"#9b2c2c", lineHeight:1.7 }}>{w}</span></div>
                  ))}
                </Collapsible>}
              </div>
            )}

            {/* BUYER JOURNEY ALIGNMENT */}
                        {/* RHYTHM STAGES */}
            {sd && (
              <div>
                {sd.bridgeBanner && buyerPath && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, padding:"10px 16px", borderRadius:10, background: buyerPath==="evaluating"?"#eef3ff":buyerPath==="active-pain"?"#e9effe":"#fdf7e6", border:`1.5px solid ${buyerPath==="evaluating"?"#bccdf5":buyerPath==="active-pain"?"#bcd0f7":"#d4a830"}` }}>
                    <span style={{ fontSize:16 }}>{buyerPath==="evaluating"?"⚡":buyerPath==="active-pain"?"⚠":"◎"}</span>
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:12, fontWeight:700, color: buyerPath==="evaluating"?"#2563eb":buyerPath==="active-pain"?C.emerald:"#7a5808" }}>
                        {buyerPath==="evaluating"?"Evaluating buyer — they came in solution-mode. You went back in time. Now anchor to the business problem.":buyerPath==="active-pain"?"Active pain buyer — they surfaced a challenge. Now prioritize it and validate it's a raging fire.":"Latent buyer — you ran the Discovery Prompter. Now find what resonated and anchor to it."}
                      </span>
                    </div>
                    <button onClick={()=>setActiveStage("buyer-journey")} style={{ ...B, fontSize:10, color:C.textMuted, background:"transparent", border:`1px solid ${C.border}`, borderRadius:5, padding:"3px 8px", flexShrink:0 }}>← back</button>
                  </div>
                )}
                <div style={{ display:"flex", gap:10, alignItems:"baseline", marginBottom:16, padding:"0 2px" }}>
                  <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color:C.emerald, flexShrink:0 }}>Goal</span>
                  <span style={{ fontSize:15, fontWeight:500, color:C.textSecondary, lineHeight:1.5 }}>{sd.rule}</span>
                </div>
                {sd.rhythm.filter(r=>!r.fallback).map((r,i)=><RhythmCard key={i} r={r} idx={i} prefix={activeStage} />)}
                {sd.rhythm.some(r=>r.fallback) && coachingVisible && (
                  <Collapsible label="+ More techniques" isOpen={moreOpen} onToggle={()=>setMoreOpen(v=>!v)} accent={C.textMuted}>
                    {sd.rhythm.filter(r=>r.fallback).map((r,i)=><RhythmCard key={i} r={r} idx={i+100} prefix={activeStage+"-more"} />)}
                  </Collapsible>
                )}
                {coachingVisible && sd.tips && <Collapsible label="★ Coaching Tips" isOpen={tipsOpen} onToggle={()=>setTipsOpen(v=>!v)} accent={C.textSecondary}>
                  {sd.tips.map((t,i)=>(<div key={i} style={{ display:"flex", gap:12, marginBottom:i<sd.tips.length-1?12:0 }}><span style={{ color:C.textMuted, fontSize:14, flexShrink:0 }}>—</span><span style={{ fontSize:14, color:C.textSecondary, lineHeight:1.7 }}>{t}</span></div>))}
                </Collapsible>}
                {coachingVisible && sd.watch && <Collapsible label="⚠ Watch For" isOpen={watchOpen} onToggle={()=>setWatchOpen(v=>!v)} accent={C.coral}>
                  {sd.watch.map((w,i)=>(<div key={i} style={{ display:"flex", gap:12, marginBottom:i<sd.watch.length-1?14:0 }}><span style={{ background:C.coral, color:C.white, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, flexShrink:0, marginTop:3 }}>!</span><span style={{ fontSize:14, color:"#9b2c2c", lineHeight:1.7 }}>{w}</span></div>))}
                </Collapsible>}
              </div>
            )}
            {activeStage === "buyer-journey" && renderBuyerType()}


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

          {/* NOTES */}
          <div style={{ background:C.white, borderTop:`1px solid ${C.border}`, padding:"10px 32px", flexShrink:0 }}>
            <div style={{ maxWidth:860, margin:"0 auto", display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:C.textMuted, flexShrink:0 }}>Notes</span>
              <textarea
                value={stageNote}
                onChange={e=>setNotes(n=>({...n,[activeStage]:e.target.value}))}
                placeholder="Their exact words, numbers, names…"
                rows={2}
                style={{ flex:1, fontSize:14, lineHeight:1.5, padding:"8px 12px", border:`1px solid ${C.border}`, borderRadius:8, background:C.sand, color:C.textPrimary, resize:"none", boxSizing:"border-box", fontFamily:"inherit", outline:"none" }}
              />
            </div>
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
                                <div style={{ fontSize:13, color:C.textPrimary, lineHeight:1.7 }}>{q}</div>
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
                <div style={{ padding:"18px 20px 6px", fontSize:12, fontWeight:700, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase" }}>Enterprise Qualification</div>
                <div style={{ padding:"0 20px 12px", fontSize:12, color:C.textMuted, lineHeight:1.6 }}>Buying-committee and qualification questions live here.</div>
                <div style={{ margin:"0 20px", padding:"28px 20px", borderRadius:12, border:`1.5px dashed ${C.border}`, background:C.sand, textAlign:"center" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.textSecondary, marginBottom:8 }}>No qualification questions yet</div>
                  <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.7 }}>Add your enterprise qualification sets in <span style={{ fontFamily:"monospace", background:"#eef0f3", padding:"1px 6px", borderRadius:4 }}>src/App.jsx</span> — same accordion pattern as the Questions tab.</div>
                </div>
              </div>
            )}

            {/* ROI TAB */}
            {rightTab === "roi" && (
              <div style={{ padding:24, overflowY:"auto", flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>ROI Calculator</div>
                <div style={{ fontSize:13, color:C.textMuted, marginBottom:20, lineHeight:1.6 }}>Fill in as they answer. Business case builds itself.</div>
                <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
                  {[
                    { key:"unitsPerMonth", label:"Units / month",             placeholder:"e.g. 200" },
                    { key:"minsPerUnit",   label:"Avg time per unit (min)",   placeholder:"e.g. 45" },
                    { key:"teamSize",      label:"Team size",                 placeholder:"e.g. 40" },
                    { key:"hourlyRate",    label:"Avg hourly cost ($)",       placeholder:"e.g. 75" },
                    { key:"targetTimeMins",label:"Target time per unit (min)",placeholder:"e.g. 15" },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize:12, fontWeight:600, color:C.textSecondary, marginBottom:6 }}>{f.label}</div>
                      <input type="number" value={roi[f.key]} onChange={e=>setRoi(r=>({...r,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{ width:"100%", fontSize:15, fontWeight:600, padding:"10px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, background:"#f7f8fa", color:C.textPrimary, boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }} />
                    </div>
                  ))}
                </div>
                {(() => {
                  const upm = parseFloat(roi.unitsPerMonth);
                  const mpu = parseFloat(roi.minsPerUnit);
                  const ts  = parseFloat(roi.teamSize);
                  const hr  = parseFloat(roi.hourlyRate);
                  const tm  = parseFloat(roi.targetTimeMins) || 15;
                  if (!upm || !mpu || !ts || !hr) return (
                    <div style={{ fontSize:13, color:C.textMuted, fontStyle:"italic", textAlign:"center", padding:"20px 0" }}>Fill in the fields above to see the business case</div>
                  );
                  const hoursNowYear  = (upm * mpu / 60) * 12;
                  const costNowYear   = hoursNowYear * hr;
                  const hoursTgtYear  = (upm * tm / 60) * 12;
                  const costTgtYear   = hoursTgtYear * hr;
                  const savedHours    = hoursNowYear - hoursTgtYear;
                  const savedDollars  = costNowYear - costTgtYear;
                  const savePct       = Math.round((1 - tm / mpu) * 100);
                  const fmt  = n => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Math.round(n)}`;
                  const fmtH = n => n >= 1000 ? `${(n/1000).toFixed(1)}k hrs` : `${Math.round(n)} hrs`;
                  const cfoCopy = `Your team of ${Math.round(ts)} is spending ${fmtH(hoursNowYear)} a year — ${fmt(costNowYear)} in labor — just on this process. With the right solution that drops to ${fmtH(hoursTgtYear)}. That's ${fmtH(savedHours)} and ${fmt(savedDollars)} back to the business every year.`;
                  return (
                    <div>
                      {[
                        { label:"Current cost / yr",    value:fmt(costNowYear),   sub:`${fmtH(hoursNowYear)} on the process today`,        color:C.coral,    bg:"#fdf2f2",    border:`${C.coral}50` },
                        { label:"With solution / yr",   value:fmt(costTgtYear),   sub:`${fmtH(hoursTgtYear)} at ${tm} min/unit`,    color:C.emerald,  bg:C.emeraldLight, border:C.emeraldMid },
                        { label:"Annual value delta",   value:fmt(savedDollars),  sub:`${fmtH(savedHours)} reclaimed — ${savePct}% saved`, color:"#2563eb", bg:"#eef3ff", border:"#bccdf5" },
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
