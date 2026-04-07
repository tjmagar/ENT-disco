import { useState, useRef, useEffect } from "react";

const C = {
  pageBg: "#EFEFEF",
  panelBg: "#ffffff",
  border: "#E0DCDA",
  textPrimary: "#242424",
  textSecondary: "#555555",
  textMuted: "#999999",
  black: "#242424",
  white: "#ffffff",
  sidebar: "#4a4a4a",
  emerald: "#248567",
  emeraldLight: "#E7F0EE",
  emeraldMid: "#B9CDC7",
  coral: "#FF826C",
  sand: "#F4F2F0",
};

const STAGES = [
  { id: "prep",             icon: "◎", short: "Prep Brief" },
  { id: "rapport",          icon: "①", short: "Rapport" },
  { id: "roe",              icon: "②", short: "ROE" },
  { id: "buyer-type",       icon: "③", short: "Buyer Type" },
  { id: "business-problem", icon: "④", short: "Business Problem" },
  { id: "root-cause",       icon: "⑤", short: "Root Cause" },
  { id: "negative-impact",  icon: "⑥", short: "Negative Impact" },
  { id: "future-state",     icon: "⑦", short: "Future State" },
  { id: "next-step",        icon: "⑧", short: "Next Step" },
  { id: "outputs",          icon: "✦", short: "Outputs" },
];

const SPICED_FIELDS = [
  { key: "situation",      label: "S — Situation",      hint: "Company, team size, tools, context" },
  { key: "pain",           label: "P — Pain",           hint: "Business problem + root cause" },
  { key: "impact",         label: "I — Impact",         hint: "Metric suffering + cost of inaction" },
  { key: "critical_event", label: "C — Critical Event", hint: "Timeline driver or deadline" },
  { key: "decision",       label: "D — Decision",       hint: "Steps, people, criteria, funding" },
];

const STAGE_CONTENT = {
  prep: {
    title: "Pre-Call Prep Brief",
    subtitle: "Paste your prep brief. Everything downstream personalizes from this.",
    scripts: [],
    tips: ["Who am I talking to? Buyer, evaluator, or researcher?","Active or latent? Inbound or outbound?","Tech stack — CRM, e-sign, proposal tool?","Compelling trigger — why now?","Hypothesis: what pain are they likely dealing with?"],
    watchFor: ["No urgency signal — ask 'What's making this a priority right now?'","Authority unclear — find out who else needs to be involved","Competitor unknown — ask what they're using today"],
  },
  rapport: {
    title: "Build Rapport",
    subtitle: "Read the energy first. Don't script the opening.",
    alwaysShow: { label: "Open with this — every time", text: '"Hey [Name], glad we could both find the time today. How\'s your week going?"', note: "If they engage → stay with it. If they say 'let's get into it' → move to ROE. Never thank them for their time." },
    scripts: [
      { label: "They want to chat", text: "Stay genuine for 60–90 seconds. Ask about something real — LinkedIn, a recent announcement. Then: \"Should we talk about the agenda?\"" },
      { label: "They want business", text: '"Good, thanks for asking. Look, I know your time is valuable — mind if we dive in?"' },
    ],
    tips: ["\"I'm glad we found the time\" — not \"thanks for meeting with me\"","Lower status = less influence. Don't give away your power.","You can't script which way it goes — the read happens after they respond."],
    watchFor: ["Jumping straight into ROE without reading the room","Thanking the prospect for their time — positions you lower"],
  },
  roe: {
    title: "Rules of Engagement",
    subtitle: "Set the frame. Get verbal agreement. Pre-sell the next step.",
    scripts: [
      { label: "Transition in", text: '"Do you mind if we talk about the agenda?"' },
      { label: "Full ROE script", text: '"Great. Here\'s what I\'m thinking — let me know if you want to modify anything.\n\nObjective: let\'s learn enough about each other to decide if a next step makes sense. I\'m not here to sell you anything today.\n\nAgenda: I\'ll understand the challenges you\'re running into, share what PandaDoc does and how it maps to what you\'re dealing with. By the end, let\'s both make a decision — keep talking or go our separate ways. No pressure.\n\nDoes that feel fair?"' },
      { label: "End-of-call callback", text: '"At the beginning we agreed we\'d make a decision — does a next step make sense? The sense I\'m getting is there\'s something worth exploring. Should we talk about what that looks like?"' },
    ],
    tips: ["Objective → Agenda → Decision. In that order.","\"Does that feel fair?\" closes every ROE.","Pre-framing the decision at the start is how you guarantee a next step at the end."],
    watchFor: ["Skipping ROE — leads to 'just show me the product'","Not getting verbal agreement before discovery","Forgetting to call back the decision at end of call"],
  },
  "buyer-type": {
    title: "Meet Buyer Where They Are",
    subtitle: "Active or latent? Your entire opening changes.",
    scripts: [
      { label: "Active — Q1", text: '"Tell me about what motivated you to look into something like PandaDoc."' },
      { label: "Active — Q2", text: '"What are you looking to accomplish with something like this?"' },
      { label: "Active — Q3: go back in time", text: '"Do you mind if I go back in time for a second? What was the original challenge going on in the business that caused you to prioritize this?"' },
      { label: "Latent — context-led", text: '"[Name], I did a little homework — I noticed [specific signal]. What\'s driving that right now?"' },
      { label: "Latent — discovery prompter", text: '"Let me tell you a quick story about the challenges we typically solve.\n\nOne customer was dealing with [pain]. Before us, they struggled with [expand]. The short story is we helped them [outcome].\n\nTell me about the challenges you\'re facing — specifically things that would be really problematic if you hadn\'t solved them six to twelve months from now."' },
      { label: "Warm buyer — go direct", text: '"Can you help me understand the challenges you\'re facing that would be really problematic if you hadn\'t solved them six to twelve months from now?"' },
    ],
    tips: ["Active = inbound → Go Back In Time","Latent = outbound → Context-Led or Discovery Prompter","Warm buyer → skip the techniques, go direct","'Six to twelve months' surfaces urgent problems, not wishlist items"],
    watchFor: ["Asking active buyers about pain before meeting them where they are","Using discovery prompter on a warm buyer","Forgetting to ask permission before going back in time"],
  },
  "business-problem": {
    title: "Identify the Business Problem",
    subtitle: "Peel back the onion. Find pain that money follows.",
    scripts: [
      { label: "Power question", text: '"What\'s going on in the business that\'s driving this to be a priority right now?"' },
      { label: "Why variant", text: '"What\'s causing that to be such a focus right now?"' },
      { label: "Dig deeper", text: '"A lot of things compete for your attention — what made this one rise to the top?"' },
      { label: "Validate — fire or shiny object?", text: '"Is this the challenge we should be focused on, or will other things overpower it? Is this top of mind a week from now, or more of a nice-to-have?"' },
      { label: "Summarize → root cause", text: '"Let me summarize what I\'ve heard.\n\n[Mirror their exact words back]\n\nDid I get that right?\n\nGreat — what\'s your opinion on why this is happening?"' },
    ],
    tips: ["Stop peeling when you hit a metric the decision maker owns.","Solution ≠ problem. 'We need better proposals' is a solution. Keep peeling.","Little problems get little dollars. Big problems get big dollars."],
    watchFor: ["Stopping at the first answer — almost always too surface level","Accepting a solution as the business problem","Finding pain but not validating it's a priority (happy ears)"],
  },
  "root-cause": {
    title: "Root Cause Analysis",
    subtitle: "The cause dictates the solution that gets purchased.",
    scripts: [
      { label: "Open diagnostic — always first", text: '"What\'s your opinion on why this is happening?"' },
      { label: "Targeted — manual doc creation", text: '"To what extent is it because your team builds proposals from scratch every time — Word, copy-paste, email?"' },
      { label: "Targeted — no CRM integration", text: '"How much comes down to data living in two places and your team moving it manually?"' },
      { label: "Targeted — approval bottlenecks", text: '"Is part of what\'s slowing things down the internal back-and-forth before something gets to the prospect?"' },
      { label: "Targeted — no post-send visibility", text: '"When you send something out, do you have any sense of whether they opened it — or does it go into a black hole?"' },
      { label: "Targeted — inconsistent output", text: '"How much variation is there in what different reps send — quality, accuracy, branding?"' },
      { label: "Summarize → negative impact", text: '"You\'re dealing with [problem], and [root cause 1] and [root cause 2] are the main drivers. Did I get that right?\n\nWhat are the ripple effects you\'re seeing on the rest of the business?"' },
    ],
    tips: ["Open question first — always. It unlocks the targeted questions.","'What's your opinion on why...' gets long rich answers.","Align your demo to the root cause, not the surface problem."],
    watchFor: ["Going straight to targeted without an open question first","Demoing to the wrong root cause — misaligned solution loses deals","Not summarizing before transitioning"],
  },
  "negative-impact": {
    title: "Negative Impact",
    subtitle: "Quantify the pain. Build urgency that lasts.",
    scripts: [
      { label: "Quantify — metric question", text: '"I want to ask something — and the reason I\'m asking is, if we work together, your CFO will want to know this: what metric would improve most if you solved this?"' },
      { label: "Cost of inaction", text: '"Where is [metric] today? Where should it be? What\'s the financial cost of not closing that gap every month?"' },
      { label: "Open negative impact", text: '"What are the ripple effects this challenge is having on the rest of the business?"' },
      { label: "Open with urgency frame", text: '"Leaders right now are only funding must-haves. What are the ripple effects this is having on the rest of the business?"' },
      { label: "Targeted — rep time lost", text: '"To what extent are deals going cold because proposals get built from scratch before they even reach the prospect?"' },
      { label: "Targeted — morale", text: '"A lot of teams say the manual process affects morale — reps feel like they\'re doing admin, not selling. How much is that showing up?"' },
      { label: "Targeted — post-send black hole", text: '"How much is the lack of visibility contributing to deals going dark — reps following up blind?"' },
      { label: "Summarize → future state", text: '"You\'re dealing with [problem], driven by [root causes], ripple effects include [impact] — costing roughly [metric gap] per month. Did I get that right?\n\nIf you solved this, what does good look like six to twelve months from now?"' },
    ],
    tips: ["Loss aversion: people are 2x as motivated to avoid losing as to gain.","Always: Summarize → Quantify → Open → 2-3 Targeted","Give a reason before asking — 'your CFO will want to know this'"],
    watchFor: ["Skipping quantification — it's the foundation of the business case","Asking impact questions without a reason — sounds salesy","More than 3 targeted questions — diminishing returns"],
  },
  "future-state": {
    title: "Future State + Buying Process",
    subtitle: "Build the vision. Surface buying criteria. Understand the process.",
    scripts: [
      { label: "Open future state", text: '"If you solved this — what does good look like six to twelve months from now?"' },
      { label: "Buying criteria", text: '"Based on everything you\'ve shared — what would you need in a solution to actually solve this?"' },
      { label: "Targeted — CRM integration", text: '"How important is it that whatever you use connects directly to your CRM?"' },
      { label: "Targeted — approvals", text: '"Is getting internal sign-offs before anything goes to the customer part of what you\'d need?"' },
      { label: "Underlying personal motivation", text: '"Beyond what this means for the business — what does solving this mean for you personally?"' },
      { label: "Decision — Steps", text: '"What steps do you need to take from here to make a go or no-go?"' },
      { label: "Decision — People", text: '"Who would be involved in each of those steps?"' },
      { label: "Decision — Criteria", text: '"What would make each person say yes or no?"' },
      { label: "Decision — Timeline", text: '"What drives your timeline?"' },
      { label: "Decision — Funding", text: '"How do you think you\'d fund this, based on how you\'ve funded similar projects?"' },
    ],
    tips: ["Value = painful present + compelling future.","Open buying criteria first — see what they're already sold on.","Underlying motivation question is the powerhouse — personal stake."],
    watchFor: ["Skipping buying criteria — going into demo blind","Not uncovering personal motivation","Leaving without understanding who else is involved"],
  },
  "next-step": {
    title: "Secure the Next Step",
    subtitle: "What. Who. Why. Book it before you hang up.",
    scripts: [
      { label: "Full What/Who/Why", text: '"Looks like we\'re coming up on time. Should we talk about next steps?\n\nYou know your company better than I do — so if you have a different idea, let me know.\n\nBased on what you\'ve shared, here\'s what I\'d recommend: [specific next step].\n\nIt\'d be helpful to have [name/role] in that conversation too — [why they matter].\n\nDoes that feel fair?"' },
      { label: "Multi-stakeholder demo", text: '"I\'d recommend a focused demo with you and [decision maker] — since what we talked about directly affects their [metric]. Does that feel right?"' },
      { label: "Trial + check-in", text: '"I\'d recommend getting you into a trial and checking in in 3 days. I\'ll send a setup link right after. Does that work?"' },
      { label: "Call back the ROE", text: '"At the beginning we agreed we\'d make a decision — does it make sense to keep going? The sense I\'m getting is there\'s something worth exploring here."' },
    ],
    tips: ["85% of deals without a booked next step go dark.","Always lead with a recommendation — never 'what do you think we should do?'","What/Who/Why: the step, who should be there, and why it matters."],
    watchFor: ["Leaving with 'I'll follow up' — that's not a next step","Not recommending who else should be in the room","Forgetting to call back the ROE decision"],
  },
};

const PANDADOC_CONTEXT = `You are an AI sales coach embedded in a live PandaDoc SMB discovery call companion app.
PandaDoc is an all-in-one document workflow platform. Key stats: 50% reduction in doc creation time, 87% increase in closed deals per month, 36% increase in close rate, saves 20 min per contract via CRM auto-population.
Key personas: VP Sales, Sales Directors, RevOps Leaders, Sales Ops Managers, Business Owners, Marketing Directors.
Core pains: manual proposal creation (30-45 min to 5 min), no CRM integration, approval bottlenecks, no post-send visibility, inconsistent doc quality, slow signatures.
Framework: Chris Orlob discovery — Rapport, ROE, Meet buyer where they are, Business problem, Root cause, Negative impact, Future state, Next step.
Coach reps in real time. Be specific, brief, actionable. Give word-for-word scripts when asked. Use prep brief to personalize every response.`;

const RECIPES = [
  { label: "Summarize → root cause", prompt: "Word-for-word: summarize the business problem and transition into root cause." },
  { label: "Summarize → impact", prompt: "Word-for-word: summarize root cause and transition into negative impact." },
  { label: "Summarize → future state", prompt: "Word-for-word: summarize negative impact and transition into future state." },
  { label: "Summarize → next step", prompt: "Word-for-word: summarize the full call and recommend a next step using What/Who/Why." },
  { label: "What to ask next?", prompt: "What's the single best question I should ask right now?" },
  { label: "They want the product", prompt: "The prospect wants to see the product before discovery is done. What do I say exactly?" },
  { label: "Get to power", prompt: "I'm talking to an evaluator. How do I navigate to the decision maker?" },
  { label: "Peel the onion", prompt: "The buyer gave a surface answer. Give me a specific follow-up to go deeper." },
];

async function suggestSpicedField(fieldKey, notes, prepBrief) {
  const fieldMap = {
    situation: "S — Situation: company context, team size, tools",
    pain: "P — Pain: core business problem and root cause",
    impact: "I — Impact: metric suffering and cost of inaction",
    critical_event: "C — Critical Event: timeline driver or deadline",
    decision: "D — Decision: steps, people, criteria, funding",
  };
  try {
    const res = await fetch("/api/claude", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 150, system: PANDADOC_CONTEXT, messages: [{ role: "user", content: `Extract a 1-2 sentence fill for: ${fieldMap[fieldKey]}.\nPrep brief: ${prepBrief || "None"}\nNotes: ${Object.entries(notes).map(([k,v]) => v ? `${k}: ${v}` : "").filter(Boolean).join(" | ") || "None"}\nReturn ONLY the filled text. Use prospect's exact words. If not enough info, return empty string.` }] }),
    });
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || "";
  } catch { return ""; }
}

export default function App() {
  const [activeStage, setActiveStage] = useState("prep");
  const [buyerType, setBuyerType] = useState(null);
  const [notes, setNotes] = useState({});
  const [prepBrief, setPrepBrief] = useState("");
  const [spiced, setSpiced] = useState({ situation:"", pain:"", impact:"", critical_event:"", decision:"" });
  const [spicedSuggesting, setSpicedSuggesting] = useState({});
  const [coaching, setCoaching] = useState("");
  const [coachingLoading, setCoachingLoading] = useState(false);
  const [coachInput, setCoachInput] = useState("");
  const [outputs, setOutputs] = useState({ spiced:"", email:"", score:"" });
  const [outputLoading, setOutputLoading] = useState("");
  const [proactiveNudge, setProactiveNudge] = useState("");
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const nudgeTimer = useRef(null);
  const coachRef = useRef(null);

  const stage = STAGE_CONTENT[activeStage];
  const currentIdx = STAGES.findIndex(s => s.id === activeStage);
  const completedStages = STAGES.slice(0, currentIdx).map(s => s.id);
  const stageNote = notes[activeStage] || "";

  useEffect(() => { setTipsOpen(false); setWatchOpen(false); setProactiveNudge(""); }, [activeStage]);

  useEffect(() => {
    if (activeStage === "prep" || activeStage === "outputs") return;
    if (!stageNote || stageNote.length < 40) return;
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => fireProactiveNudge(stageNote), 2000);
    return () => clearTimeout(nudgeTimer.current);
  }, [stageNote, activeStage]);

  async function fireProactiveNudge(noteText) {
    setNudgeLoading(true); setProactiveNudge("");
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 120, system: PANDADOC_CONTEXT, messages: [{ role: "user", content: `Prep brief: ${prepBrief || "None"}\nStage: ${stage.title}\nNote: "${noteText}"\nOne coaching insight, 1-2 sentences max. Direct. No preamble.` }] }),
      });
      const data = await res.json();
      setProactiveNudge(data.content?.[0]?.text || "");
    } catch { setProactiveNudge(""); }
    setNudgeLoading(false);
  }

  function buildContext(q) {
    return `Prep brief:\n${prepBrief || "None"}\nStage: ${stage.title}\nBuyer: ${buyerType || "unknown"}\nNotes: ${Object.entries(notes).map(([k,v]) => v ? k+": "+v : "").filter(Boolean).join(" | ")}\nSPICED: ${JSON.stringify(spiced)}\n\n${q}`;
  }

  async function askCoach(customPrompt) {
    const q = customPrompt || coachInput;
    if (!q.trim()) return;
    if (!customPrompt) setCoachInput("");
    setCoachingLoading(true); setCoaching("");
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 800, system: PANDADOC_CONTEXT, messages: [{ role: "user", content: buildContext(q) }] }),
      });
      const data = await res.json();
      setCoaching(data.content?.[0]?.text || "No response.");
    } catch { setCoaching("Coach unavailable."); }
    setCoachingLoading(false);
  }

  async function generateOutput(type) {
    setOutputLoading(type);
    const allNotes = Object.entries(notes).map(([k,v]) => k+": "+v).join("\n");
    const prompts = {
      spiced: `Filled SPICED summary + next step.\nPrep: ${prepBrief || "None"}\nNotes:\n${allNotes}\nSPICED: ${JSON.stringify(spiced)}\nUse their actual words. Recommend next step with What/Who/Why.`,
      email: `Post-discovery follow-up email for PandaDoc.\nPrep: ${prepBrief || "None"}\nNotes:\n${allNotes}\nSPICED: ${JSON.stringify(spiced)}\nGreeting + 4-5 word callback. Situation in their words. Bridge to next steps. Max 4 bullet next steps. Sign off: Excited to tackle this together. No corporate speak.`,
      score: `Score this call out of 100.\nPrep: ${prepBrief || "None"}\nNotes:\n${allNotes}\nSPICED: ${JSON.stringify(spiced)}\nBuyer: ${buyerType || "unknown"}\nScore /20 each: ROE set, Problem found, Root cause diagnosed, Impact explored, Next step secured. Top 3 failure modes. 3 coaching actions.`,
    };
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: PANDADOC_CONTEXT, messages: [{ role: "user", content: prompts[type] }] }),
      });
      const data = await res.json();
      setOutputs(o => ({ ...o, [type]: data.content?.[0]?.text || "Failed." }));
    } catch { setOutputs(o => ({ ...o, [type]: "Generation failed." })); }
    setOutputLoading("");
  }

  async function autoFillSpiced(fieldKey) {
    setSpicedSuggesting(s => ({ ...s, [fieldKey]: true }));
    const suggestion = await suggestSpicedField(fieldKey, notes, prepBrief);
    if (suggestion) setSpiced(s => ({ ...s, [fieldKey]: suggestion }));
    setSpicedSuggesting(s => ({ ...s, [fieldKey]: false }));
  }

  function copyText(t) { navigator.clipboard.writeText(t); }

  const filteredScripts = (stage.scripts || []).filter(s => {
    if (activeStage !== "buyer-type" || !buyerType) return true;
    const l = s.label.toLowerCase();
    if (buyerType === "active") return l.includes("active") || l.includes("warm") || l.includes("direct");
    return l.includes("latent") || l.includes("warm") || l.includes("direct");
  });

  const showOutputsShortcut = currentIdx >= STAGES.findIndex(s => s.id === "next-step") && activeStage !== "outputs";
  const B = { fontFamily: "'Inter', system-ui, sans-serif", cursor: "pointer" };

  const Collapsible = ({ label, isOpen, onToggle, accent, children }) => (
    <div style={{ marginBottom:20, borderRadius:12, border:`1.5px solid ${accent}30`, overflow:"hidden" }}>
      <button onClick={onToggle} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", background:`${accent}12`, border:"none", textAlign:"left" }}>
        <span style={{ fontSize:13, fontWeight:700, color:accent, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontSize:18, color:accent, fontWeight:700, lineHeight:1 }}>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <div style={{ padding:"18px 20px 20px", background:C.white }}>{children}</div>}
    </div>
  );

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Inter', system-ui, sans-serif", background:C.pageBg, overflow:"hidden" }}>

      {/* SIDEBAR */}
      <div style={{ width:220, background:C.sidebar, display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto" }}>
        <div style={{ padding:"28px 22px 18px" }}>
          <div style={{ fontSize:11, fontWeight:600, color:"#aaa", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4 }}>PandaDoc</div>
          <div style={{ fontSize:20, fontWeight:700, color:C.white, letterSpacing:"-0.02em" }}>Discovery</div>
        </div>
        <div style={{ flex:1, padding:"6px 10px" }}>
          {STAGES.map(s => {
            const isActive = s.id === activeStage;
            const isDone = completedStages.includes(s.id);
            return (
              <button key={s.id} onClick={() => setActiveStage(s.id)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", gap:12, padding:"13px 12px", borderRadius:8, background: isActive ? C.emerald : "transparent", border:"none", textAlign:"left", marginBottom:2 }}>
                <span style={{ fontSize:16, color: isActive ? C.white : isDone ? C.emerald : "#aaa", fontWeight:700, minWidth:20, textAlign:"center" }}>{isDone ? "✓" : s.icon}</span>
                <span style={{ fontSize:16, color: isActive ? C.white : C.white, fontWeight: isActive ? 700 : 600 }}>{s.short}</span>
              </button>
            );
          })}
        </div>
        {buyerType && (
          <div style={{ padding:"16px 22px", borderTop:"1px solid #666" }}>
            <div style={{ fontSize:10, color:"#aaa", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Buyer</div>
            <div style={{ display:"inline-flex", fontSize:13, fontWeight:600, padding:"5px 12px", borderRadius:99, background: buyerType==="active" ? "#0d2a4a" : "#3a1e00", color: buyerType==="active" ? "#6aaae8" : "#e8a84a" }}>
              {buyerType === "active" ? "⚡ Active" : "◎ Latent"}
            </div>
            <button onClick={() => setBuyerType(null)} style={{ ...B, display:"block", marginTop:5, fontSize:11, color:"#bbb", background:"none", border:"none", padding:0 }}>change</button>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Top bar */}
        <div style={{ padding:"22px 36px", borderBottom:`1px solid ${C.border}`, background:C.white, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:28, fontWeight:800, color:"#666", letterSpacing:"-0.03em" }}>{stage.title}</div>
            <div style={{ fontSize:14, color:C.textMuted, marginTop:5 }}>{stage.subtitle}</div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            {showOutputsShortcut && (
              <button onClick={() => setActiveStage("outputs")} style={{ ...B, fontSize:13, padding:"10px 20px", border:`2px solid ${C.emerald}`, borderRadius:8, background:"transparent", color:C.emerald, fontWeight:700 }}>✦ Outputs</button>
            )}
            {currentIdx > 0 && (
              <button onClick={() => setActiveStage(STAGES[currentIdx-1].id)} style={{ ...B, fontSize:14, padding:"10px 22px", border:`1px solid ${C.border}`, borderRadius:8, background:C.white, color:C.textMuted, fontWeight:500 }}>← Back</button>
            )}
            {currentIdx < STAGES.length-1 && (
              <button onClick={() => setActiveStage(STAGES[currentIdx+1].id)} style={{ ...B, fontSize:14, padding:"10px 24px", border:"none", borderRadius:8, background:C.emerald, color:C.white, fontWeight:700 }}>Next →</button>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* LEFT */}
          <div style={{ flex:1, overflowY:"auto", padding:"32px 36px" }}>

            {/* PREP BRIEF */}
            {activeStage === "prep" && (
              <div style={{ marginBottom:28, background:C.emeraldLight, border:`2px solid ${C.emeraldMid}`, borderRadius:14, padding:26 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.emerald, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>★ Paste your discovery prep brief</div>
                <div style={{ fontSize:15, color:C.textSecondary, marginBottom:16, lineHeight:1.7 }}>Paste the output from your pre-call research. The live coach and all outputs will use this to personalize every response.</div>
                <textarea
                  value={prepBrief}
                  onChange={e => setPrepBrief(e.target.value)}
                  placeholder={"CALL BRIEF: [Company] — [Date]\n\nContact: [Name], [Title] | Tenure: X years\nCall Source: Inbound/Outbound | Buyer Type: Active/Latent\n\nMoney Signals: ...\nTech Stack: ...\nCompelling Trigger: ...\nHypothesis: ...\nOpen Gaps: ..."}
                  style={{ width:"100%", minHeight:190, fontSize:14, lineHeight:1.8, padding:"14px 16px", border:`1.5px solid ${C.emeraldMid}`, borderRadius:10, background:C.white, color:C.textPrimary, resize:"vertical", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }}
                />
                {prepBrief && <div style={{ marginTop:12, fontSize:14, color:C.emerald, fontWeight:600 }}>✓ Brief loaded — coach personalized to this prospect</div>}
              </div>
            )}

            {/* PROACTIVE NUDGE */}
            {(proactiveNudge || nudgeLoading) && activeStage !== "prep" && activeStage !== "outputs" && (
              <div style={{ marginBottom:28, background:"#F0EDFF", border:`2px solid #A496FF`, borderRadius:12, padding:"16px 20px", display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontSize:20 }}>⚡</span>
                {nudgeLoading
                  ? <span style={{ fontSize:14, color:C.textMuted, fontStyle:"italic" }}>Reading your notes...</span>
                  : <span style={{ fontSize:15, color:"#3a2a7a", lineHeight:1.75, fontWeight:500 }}>{proactiveNudge}</span>
                }
              </div>
            )}

            {/* ALWAYS SHOW — rapport opener */}
            {stage.alwaysShow && (
              <div style={{ marginBottom:28, background:C.emerald, borderRadius:14, padding:26 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>★ {stage.alwaysShow.label}</div>
                <div style={{ fontSize:18, color:C.white, lineHeight:1.9, marginBottom:14, fontWeight:600 }}>{stage.alwaysShow.text}</div>
                {stage.alwaysShow.note && <div style={{ fontSize:15, color:"rgba(255,255,255,0.82)", lineHeight:1.7, borderTop:"1px solid rgba(255,255,255,0.2)", paddingTop:14 }}>{stage.alwaysShow.note}</div>}
                <button onClick={() => copyText(stage.alwaysShow.text)} style={{ ...B, marginTop:14, fontSize:13, padding:"7px 18px", border:"1.5px solid rgba(255,255,255,0.4)", borderRadius:7, background:"transparent", color:C.white, fontWeight:600 }}>Copy</button>
              </div>
            )}

            {/* BUYER TYPE */}
            {activeStage === "buyer-type" && !buyerType && (
              <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:26, marginBottom:28 }}>
                <div style={{ fontSize:18, fontWeight:700, color:C.textPrimary, marginBottom:20 }}>What's your read on this buyer?</div>
                <div style={{ display:"flex", gap:14 }}>
                  <button onClick={() => setBuyerType("active")} style={{ ...B, flex:1, padding:"20px 22px", border:"2px solid #a8d0f0", borderRadius:12, background:"#edf5ff", textAlign:"left" }}>
                    <div style={{ fontSize:16, fontWeight:700, color:"#1a4878", marginBottom:7 }}>⚡ Active buyer</div>
                    <div style={{ fontSize:14, color:"#3a6898", lineHeight:1.6 }}>Inbound, already exploring, maybe comparing</div>
                  </button>
                  <button onClick={() => setBuyerType("latent")} style={{ ...B, flex:1, padding:"20px 22px", border:"2px solid #f0c878", borderRadius:12, background:"#fffbee", textAlign:"left" }}>
                    <div style={{ fontSize:16, fontWeight:700, color:"#7a4200", marginBottom:7 }}>◎ Latent buyer</div>
                    <div style={{ fontSize:14, color:"#9a6220", lineHeight:1.6 }}>Outbound, pain not crystallized, not shopping yet</div>
                  </button>
                </div>
              </div>
            )}

            {/* SCRIPTS */}
            {filteredScripts.length > 0 && (
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:16, paddingBottom:10, borderBottom:`2px solid ${C.black}` }}>Scripts</div>
                {filteredScripts.map((s, i) => (
                  <div key={i} style={{ marginBottom:20, borderRadius:14, overflow:"hidden", border:`1.5px solid ${C.border}`, background:C.white }}>
                    {/* Label row — bigger, colored bg */}
                    <div style={{ padding:"16px 22px", background:C.emerald, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ fontSize:22, fontWeight:800, color:C.white, letterSpacing:"-0.01em" }}>{s.label}</div>
                      <button onClick={() => copyText(s.text)} style={{ ...B, fontSize:12, padding:"5px 14px", border:"1.5px solid rgba(255,255,255,0.4)", borderRadius:6, background:"transparent", color:C.white, fontWeight:600, flexShrink:0 }}>Copy</button>
                    </div>
                    {/* Script body — white bg, near-black text, large and readable */}
                    <div style={{ padding:"22px 26px", fontSize:18, color:"#1a1a1a", lineHeight:2.1, whiteSpace:"pre-wrap", fontWeight:500, background:C.white }}>{s.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* WATCH FOR — collapsible coral */}
            {stage.watchFor && stage.watchFor.length > 0 && (
              <Collapsible label="⚠ Watch For" isOpen={watchOpen} onToggle={() => setWatchOpen(v => !v)} accent={C.coral}>
                {stage.watchFor.map((w, i) => (
                  <div key={i} style={{ display:"flex", gap:12, marginBottom: i < stage.watchFor.length-1 ? 14 : 0, alignItems:"flex-start" }}>
                    <span style={{ background:C.coral, color:C.white, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, flexShrink:0, marginTop:3 }}>!</span>
                    <span style={{ fontSize:16, color:"#5a1a00", lineHeight:1.75 }}>{w}</span>
                  </div>
                ))}
              </Collapsible>
            )}

            {/* COACHING TIPS — collapsible gray */}
            {stage.tips && stage.tips.length > 0 && (
              <Collapsible label="Coaching Tips" isOpen={tipsOpen} onToggle={() => setTipsOpen(v => !v)} accent={C.textMuted}>
                {stage.tips.map((tip, i) => (
                  <div key={i} style={{ display:"flex", gap:14, marginBottom: i < stage.tips.length-1 ? 14 : 0, alignItems:"flex-start" }}>
                    <span style={{ fontSize:15, color:C.textMuted, flexShrink:0 }}>—</span>
                    <span style={{ fontSize:16, color:C.textSecondary, lineHeight:1.75 }}>{tip}</span>
                  </div>
                ))}
              </Collapsible>
            )}

            {/* OUTPUTS */}
            {activeStage === "outputs" && (
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:24, paddingBottom:10, borderBottom:`2px solid ${C.black}` }}>End-of-Call Outputs</div>
                {[
                  { key:"spiced", label:"SPICED Summary + Next Step", desc:"Filled discovery summary using their words, with a recommended next step" },
                  { key:"email", label:"Follow-up Email", desc:"Ready to send — their words, no corporate speak" },
                  { key:"score", label:"Call Score + Coaching", desc:"Score out of 100 with gap analysis and 3 coaching actions" },
                ].map(o => (
                  <div key={o.key} style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:14, padding:26, marginBottom:18 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:18, fontWeight:700, color:C.textPrimary }}>{o.label}</div>
                        <div style={{ fontSize:14, color:C.textMuted, marginTop:4 }}>{o.desc}</div>
                      </div>
                      <button onClick={() => generateOutput(o.key)} disabled={!!outputLoading} style={{ ...B, fontSize:14, padding:"10px 22px", border:"none", borderRadius:8, background: outputLoading===o.key ? C.emeraldLight : C.emerald, color: outputLoading===o.key ? C.emerald : C.white, fontWeight:700, flexShrink:0 }}>
                        {outputLoading===o.key ? "Generating..." : "Generate ↗"}
                      </button>
                    </div>
                    {outputs[o.key] && (
                      <div>
                        <div style={{ fontSize:15, color:C.textSecondary, lineHeight:1.85, whiteSpace:"pre-wrap", borderTop:`1px solid ${C.border}`, paddingTop:16, marginTop:4 }}>{outputs[o.key]}</div>
                        <button onClick={() => copyText(outputs[o.key])} style={{ ...B, marginTop:12, fontSize:13, padding:"7px 18px", border:`1px solid ${C.border}`, borderRadius:7, background:C.sand, color:C.textMuted }}>Copy</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — SPICED + Coach */}
          <div style={{ width:340, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, background:C.white, overflowY:"auto" }}>

            {/* SPICED */}
            <div style={{ padding:24, borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:20 }}>SPICED Tracker</div>
              {SPICED_FIELDS.map(f => (
                <div key={f.key} style={{ marginBottom:18 }}>
                  <div style={{ fontSize:13, fontWeight:600, color: spiced[f.key] ? C.emerald : C.textMuted, marginBottom:7, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span>{spiced[f.key] ? "✓ " : ""}{f.label}</span>
                    <button onClick={() => autoFillSpiced(f.key)} disabled={spicedSuggesting[f.key]} style={{ ...B, fontSize:11, padding:"3px 10px", border:`1.5px solid ${C.emerald}`, borderRadius:6, background:"transparent", color:C.emerald, fontWeight:600, flexShrink:0, opacity: spicedSuggesting[f.key] ? 0.5 : 1 }}>
                      {spicedSuggesting[f.key] ? "..." : "✦ fill"}
                    </button>
                  </div>
                  <textarea value={spiced[f.key]} onChange={e => setSpiced(s => ({ ...s, [f.key]: e.target.value }))} placeholder={f.hint} style={{ width:"100%", fontSize:13, lineHeight:1.65, padding:"10px 12px", border:`1.5px solid ${spiced[f.key] ? C.emeraldMid : C.border}`, borderRadius:9, background: spiced[f.key] ? C.emeraldLight : C.sand, color:C.textPrimary, resize:"none", minHeight:56, boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }} />
                </div>
              ))}
            </div>

            {/* LIVE COACH */}
            <div style={{ padding:24, flex:1, display:"flex", flexDirection:"column" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.textPrimary, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:18 }}>Live Coach</div>
              {coaching && <div style={{ fontSize:14, color:C.textSecondary, lineHeight:1.85, background:C.emeraldLight, border:`1.5px solid ${C.emeraldMid}`, borderRadius:12, padding:16, marginBottom:16, whiteSpace:"pre-wrap" }}>{coaching}</div>}
              {coachingLoading && <div style={{ fontSize:14, color:C.textMuted, marginBottom:16, fontStyle:"italic" }}>Thinking...</div>}
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Quick Recipes</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {RECIPES.map(r => (
                    <button key={r.label} onClick={() => askCoach(r.prompt)} style={{ ...B, fontSize:12, padding:"6px 12px", border:`1.5px solid ${C.emeraldMid}`, borderRadius:99, background:C.emeraldLight, color:C.emerald, fontWeight:600, lineHeight:1.4 }}>{r.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:"auto" }}>
                <textarea ref={coachRef} value={coachInput} onChange={e => setCoachInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); askCoach(); } }} placeholder="Ask anything mid-call..." style={{ flex:1, fontSize:14, padding:"12px 14px", border:`1.5px solid ${C.border}`, borderRadius:10, background:C.sand, color:C.textPrimary, resize:"none", minHeight:62, fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }} />
                <button onClick={() => askCoach()} disabled={coachingLoading} style={{ ...B, alignSelf:"flex-end", padding:"12px 18px", border:"none", borderRadius:10, background:C.emerald, fontSize:16, color:C.white, fontWeight:700 }}>↗</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
