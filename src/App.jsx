import { useState, useRef, useEffect } from "react";

const C = {
  pageBg: "#f2f7f4", sidebarBg: "#e8f3ec", panelBg: "#ffffff", rightBg: "#f5fbf7",
  border: "#c4deca", borderMid: "#aacfb4", textPrimary: "#1a2e20", textSecondary: "#3a5842",
  textMuted: "#628a6a", textHint: "#96b89e", accentBg: "#d0ead8", accentText: "#185224",
  accentBorder: "#a0ccaa", accentStrong: "#2a7238", activeBg: "#c2e4cc", activeBorder: "#2a7238",
  scriptBg: "#eef8f1", scriptBorder: "#b4dbbe", tipsBg: "#f5fcf7", tipsBorder: "#bcd9c4",
  warnBg: "#fff3e0", warnBorder: "#f5a623", warnText: "#7a3e00", warnStrong: "#d4700a",
  successText: "#185224", coachBg: "#eaf6ee", coachBorder: "#b4dbbe",
  spicedFilled: "#cce8d4", spicedEmpty: "#eaf3ec", btnBg: "#2a7238", btnText: "#ffffff",
  notesBg: "#fffef5", notesBorder: "#d4c87a", doneText: "#2a7238",
};

const STAGES = [
  { id: "prep", label: "Prep Brief", icon: "◎", short: "Prep" },
  { id: "rapport", label: "Rapport", icon: "①", short: "Rapport" },
  { id: "roe", label: "ROE", icon: "②", short: "ROE" },
  { id: "buyer-type", label: "Buyer Type", icon: "③", short: "Buyer" },
  { id: "business-problem", label: "Business Problem", icon: "④", short: "Problem" },
  { id: "root-cause", label: "Root Cause", icon: "⑤", short: "Root Cause" },
  { id: "negative-impact", label: "Negative Impact", icon: "⑥", short: "Impact" },
  { id: "future-state", label: "Future State", icon: "⑦", short: "Future" },
  { id: "next-step", label: "Next Step", icon: "⑧", short: "Next Step" },
  { id: "outputs", label: "Outputs", icon: "✦", short: "Outputs" },
];

const SPICED_FIELDS = [
  { key: "situation", label: "S — Situation", hint: "Company, team size, tools, context" },
  { key: "pain", label: "P — Pain", hint: "Business problem + root cause" },
  { key: "impact", label: "I — Impact", hint: "Metric suffering + cost of inaction" },
  { key: "critical_event", label: "C — Critical Event", hint: "Timeline driver or deadline" },
  { key: "decision", label: "D — Decision", hint: "Steps, people, criteria, funding" },
];

const STAGE_CONTENT = {
  prep: {
    title: "Pre-Call Prep Brief", subtitle: "Paste your discovery prep brief. Everything downstream personalizes from this.",
    alwaysShow: null, scripts: [],
    tips: ["Who am I talking to? Buyer, evaluator, or researcher?","Active or latent? Inbound or outbound?","Tech stack — CRM, e-sign, proposal tool?","Compelling trigger — why now?","Hypothesis: what pain are they likely dealing with?"],
    watchFor: ["No urgency signal — ask 'What's making this a priority right now?'","Authority unclear — find out who else needs to be involved","Competitor unknown — ask what they're using today"],
  },
  rapport: {
    title: "Build Rapport", subtitle: "Read the energy. Their response tells you whether to chat or go straight to business.",
    alwaysShow: { label: "Always open with this", text: '"Hey [Name], glad we could both find the time today. How\'s your week going?"', note: "Their response tells you everything. If they engage → stay with it briefly. If they say 'yeah let\'s get into it' → move to ROE. Never thank them for their time." },
    scripts: [
      { label: "If they want to chat", text: "Stay with it genuinely for 60–90 seconds. Ask about something real — what you noticed on their LinkedIn, a recent company announcement. Then: \"Should we talk about the agenda?\"" },
      { label: "If they want business", text: '"Good, thanks for asking. Look, I know your time is valuable and you reached out for a reason — mind if we dive in?"' },
    ],
    tips: ["\"I'm glad we found the time to meet today\" — not \"thanks for meeting with me\"","Lower status = less influence. Don't give away your power before the call starts.","The read happens after they respond to the opener — you can't script which way it goes."],
    watchFor: ["Jumping straight into ROE without reading the room first","Thanking the prospect for their time — positions you as lower status"],
  },
  roe: {
    title: "Rules of Engagement", subtitle: "Set the frame. Get verbal agreement. Pre-sell the next step.",
    alwaysShow: null,
    scripts: [
      { label: "Transition in", text: '"Do you mind if we talk about the agenda?"' },
      { label: "Full ROE script", text: '"Great. Here\'s what I\'m thinking — let me know if you want to make any modifications.\n\nThe objective of this call is simple: let\'s learn enough about each other to decide if a next step even makes sense. I\'m not here to sell you anything today.\n\nTo get there, here\'s the agenda I have in mind: First, I\'ll spend some time understanding the challenges you\'re running into. Then I\'ll share a bit about what PandaDoc does and how it maps to what you\'re dealing with. And by the end, I\'d love for us to both be in a position to make a decision — either it makes sense to keep talking and we schedule something, or it doesn\'t and we go our separate ways. No pressure either way.\n\nDoes that feel fair?"' },
      { label: "End-of-call callback", text: '"At the beginning we agreed we\'d make a decision — does it make sense to take a next step, or not? The sense I\'m getting is there\'s something worth exploring here. Should we talk about what that looks like?"' },
    ],
    tips: ["Objective → Agenda → Decision. In that order.","\"Does that feel fair?\" closes every ROE — nearly impossible to say no to.","Softening language: 'let me know if you want to modify this' gives them autonomy while you lead.","Pre-framing the decision at the start is how you guarantee a next step at the end."],
    watchFor: ["Skipping ROE entirely — leads to 'just show me the product'","Not getting verbal agreement before starting discovery","Forgetting to call back the decision at end of call"],
  },
  "buyer-type": {
    title: "Meet Buyer Where They Are", subtitle: "Active or latent? Your entire opening changes.",
    alwaysShow: null,
    scripts: [
      { label: "Active — Q1: align with where they are", text: '"Tell me about what motivated you to look into something like PandaDoc."' },
      { label: "Active — Q2: follow up, don\'t check the box", text: '"What are you looking to accomplish with something like this?"' },
      { label: "Active — Q3: go back in time (ask permission)", text: '"Interesting, thanks for sharing that. Do you mind if I go back in time with you for a second? What was the original challenge going on in the business that caused you to prioritize looking into this?"' },
      { label: "Latent — context-led question", text: '"[Name], I did a little homework before jumping on — I noticed [specific signal]. Before I ask a few questions, I\'d love to start there if that\'s okay. What\'s driving that right now?"' },
      { label: "Latent — discovery prompter", text: '"Let me start by telling you a quick story about the kinds of challenges we typically solve — then I\'d love to hear from you.\n\nOne of the customers we worked with was dealing with [pain]. Before working with us, they were struggling with [expand on pain]. In fact, it was such a struggle that [negative impact]. The short story is we helped them [desired outcome].\n\nAnyway — enough about our customers. Tell me about the key challenges you\'re facing — specifically the things that would be really problematic if you hadn\'t solved them six to twelve months from now."' },
      { label: "Buyer already warm — go direct", text: '"Can you help me understand the challenges you\'re facing that would be really problematic if you hadn\'t solved them six to twelve months from now?"' },
    ],
    tips: ["Active = inbound, already comparing solutions → Go Back In Time","Latent = outbound, pain not crystallized → Context-Led or Discovery Prompter","Buyer already warm → skip the techniques, go direct","If they answer Q1 by describing their pain — skip to it, don't force the technique","'Six to twelve months' filter surfaces urgent problems, not wishlist items"],
    watchFor: ["Asking active buyers about pain before meeting them where they are — instant friction","Using discovery prompter on a warm buyer — over-complicates it","Forgetting to ask permission before going back in time"],
  },
  "business-problem": {
    title: "Identify & Validate the Business Problem", subtitle: "Peel back the onion. Find business pain that money follows.",
    alwaysShow: null,
    scripts: [
      { label: "Peel back the onion — power question", text: '"What\'s going on in the business that\'s driving this to be a priority right now?"' },
      { label: "Why variant", text: '"What\'s causing that to be such a focus right now?"' },
      { label: "Dig deeper", text: '"I\'m sure there are a lot of things competing for your attention — what made this one rise to the top?"' },
      { label: "Validate it\'s a raging fire, not a shiny object", text: '"Before we go too much further — I just want to make sure we\'re anchoring on the right thing. Is this the challenge we should be focused on together, or are there other things that are going to overpower this? Is this something that\'s going to be top of mind a week from now, or more of a nice-to-have?"' },
      { label: "Summarize to transition → root cause", text: '"Let me take a step back and summarize what I\'ve heard so far.\n\n[Mirror their words back — use their exact language, not yours]\n\nDid I get that right — or is there anything I missed?\n\nGreat — so now that we\'re aligned on what you\'re trying to solve, what\'s your opinion on why this is happening?"' },
    ],
    tips: ["Stop peeling when you hit a suffering metric the decision maker owns — that's the center.","Solution ≠ problem: 'We need better proposals' is a solution. Keep peeling.","Root cause ≠ problem: 'Our reps build docs manually' is a symptom. Keep peeling.","When the senior exec takes over the conversation → you've crossed the power line.","Little problems get little dollars. Big problems get big dollars."],
    watchFor: ["Stopping at the first answer — it's almost always too surface level","Accepting a desired solution as the business problem","Finding pain but not validating it's actually a priority (happy ears)"],
  },
  "root-cause": {
    title: "Root Cause Analysis", subtitle: "The cause dictates the solution that gets purchased.",
    alwaysShow: null,
    scripts: [
      { label: "Open diagnostic — always ask this first", text: '"What\'s your opinion on why this is happening?"' },
      { label: "Targeted — manual doc creation", text: '"To what extent is it because your team is building proposals from scratch every time — Word, copy-paste, email?"' },
      { label: "Targeted — no CRM integration", text: '"How much of the problem comes down to data living in two places — your CRM and whatever you\'re sending — and your team moving it manually?"' },
      { label: "Targeted — approval bottlenecks", text: '"Is part of what\'s slowing things down the internal back-and-forth before something even gets to the prospect?"' },
      { label: "Targeted — no post-send visibility", text: '"When you send something out, do you have any sense of whether they actually opened it — or does it go into a black hole?"' },
      { label: "Targeted — inconsistent output", text: '"How much variation is there in what different reps are sending out — quality, accuracy, branding?"' },
      { label: "Summarize to transition → negative impact", text: '"Let me summarize what I\'ve heard — you\'re dealing with [business problem], and it sounds like [root cause 1] and [root cause 2] are the main drivers. Did I get that right?\n\nGreat — I want to make sure I understand the full picture. What are the ripple effects you\'re seeing this have on the rest of the business?"' },
    ],
    tips: ["Open question first — always. It unlocks willingness to answer targeted questions.","Skip open → go targeted → buyer feels pushed → resistance.","'What's your opinion on why...' gets long rich answers. People love giving opinions.","Once you know the root cause → align your demo to it, not to the surface problem.","Advanced: guide toward a root cause only PandaDoc uniquely solves."],
    watchFor: ["Going straight to targeted questions without an open question first","Demoing to the wrong root cause — misaligned solution loses deals","Not summarizing before transitioning to negative impact"],
  },
  "negative-impact": {
    title: "Negative Impact", subtitle: "Ripple effects. Quantify the pain. Build urgency that lasts.",
    alwaysShow: null,
    scripts: [
      { label: "Quantify — metric question", text: '"I want to ask you something — and the reason I\'m asking is, if we end up working together, your CFO or leadership is going to want to know this: what metric do you think would improve the most if you solved this?"' },
      { label: "Cost of inaction", text: '"Where is [metric] today? Where should it be — and why? What\'s the financial cost of not closing that gap every month?"' },
      { label: "Open negative impact", text: '"What are the ripple effects you\'re seeing this challenge have on the rest of the business?"' },
      { label: "Open with urgency frame", text: '"In my experience, leaders right now are only funding must-haves, not nice-to-haves. I want to get a sense of where this falls — what are the ripple effects this is having on the rest of the business?"' },
      { label: "Targeted — rep time lost", text: '"To what extent are deals going cold because proposals are being built from scratch before they even get to the prospect?"' },
      { label: "Targeted — morale", text: '"A lot of the teams I talk to say the manual process affects morale — reps feel like they\'re doing admin work, not selling. How much is that showing up on your team?"' },
      { label: "Targeted — post-send black hole", text: '"How much is the lack of visibility after you send something contributing to deals going dark — reps following up blind?"' },
      { label: "Summarize to transition → future state", text: '"Let me make sure I\'ve captured everything. You\'re dealing with [problem], the drivers are [root causes], and the ripple effects include [impact] — costing roughly [metric gap] per month. Did I get that right?\n\nGreat — let\'s flip this around. If you solved this, what does good look like six to twelve months from now?"' },
    ],
    tips: ["Loss aversion: people are 2x as motivated to avoid losing something as to gain the equivalent.","Negative impact is the language of senior executives — how you get to power.","Always: Summarize → Quantify → Open impact → 2-3 Targeted","Monthly cost framing: every month without solving it has a real number attached.","Give a reason before asking: 'The reason I'm asking is your CFO will want to know this'","You only need 2-3 targeted questions that consistently land."],
    watchFor: ["Skipping quantification — it's the foundation of the business case","Asking impact questions without giving a reason — sounds salesy","Asking more than 3 targeted questions — diminishing returns"],
  },
  "future-state": {
    title: "Future State + Buying Process", subtitle: "Build the vision. Surface buying criteria. Understand the process.",
    alwaysShow: null,
    scripts: [
      { label: "Open future state", text: '"Let\'s flip this around. If you solved this — what does good look like six to twelve months from now? What\'s different?"' },
      { label: "Buying criteria", text: '"Based on everything you\'ve shared — what do you think you\'d need in a solution to actually solve this?"' },
      { label: "Targeted — workflow visibility", text: '"A lot of teams also need visibility into what happens after something goes out — not just sending faster, but knowing when it was opened. Is that something that matters to you?"' },
      { label: "Targeted — CRM integration", text: '"How important is it that whatever you use connects directly to your CRM — so your team isn\'t re-entering data in two places?"' },
      { label: "Targeted — approvals", text: '"One thing that comes up a lot is the approval side — getting internal sign-offs before anything goes to the customer. Is that part of what you\'d need?"' },
      { label: "Underlying personal motivation", text: '"I want to ask you something a little different — beyond what this means for the business, what does solving this mean for you personally? What changes for you if this gets fixed?"' },
      { label: "Decision — Steps", text: '"So what steps do you and your company need to take from here to make a decisive go or no-go on this?"' },
      { label: "Decision — People", text: '"Who would be involved in each of those steps? How would they be involved?"' },
      { label: "Decision — Criteria", text: '"What would make each person involved say yes or no at each step?"' },
      { label: "Decision — Timeline", text: '"What would drive your timeline for taking each of those steps?"' },
      { label: "Decision — Funding", text: '"If we get to the point of doing business — how do you think you\'d fund this, based on how you\'ve funded similar projects in the past?"' },
    ],
    tips: ["Value comes from contrast: painful present + compelling future = maximum motivation.","Open buying criteria question first — see what they're already sold on.","If they describe your product → easy demo. If they don't → reshape before the demo.","Underlying motivation question is the powerhouse — gets to the personal stake.","Decision questions lead directly into the next step recommendation."],
    watchFor: ["Skipping buying criteria — going into demo blind","Not uncovering the personal motivation behind the business outcome","Leaving without understanding who else needs to be involved"],
  },
  "next-step": {
    title: "Secure the Next Step", subtitle: "What. Who. Why. Book it before you hang up.",
    alwaysShow: null,
    scripts: [
      { label: "Full What/Who/Why script", text: '"Looks like we\'re coming up on time. Should we talk about next steps?\n\nGreat. You know your company better than I do — so if you have a different idea, let me know.\n\nBut based on what you\'ve shared today, here\'s what I\'d recommend: [specific next step].\n\nIt\'d be helpful to have [name/role] in that conversation too — [why they matter].\n\nDoes that feel fair?"' },
      { label: "Multi-stakeholder demo", text: '"What I\'d recommend is a focused demo with you and [decision maker]. It\'d be helpful to have [their name/role] in the room — since what we talked about today directly affects their [metric]. You know your company better than I do — does that feel like the right next step?"' },
      { label: "Trial + check-in", text: '"What I\'d recommend is getting you into a trial and checking in in 3 days once you\'ve had a chance to look around. I\'ll send a setup link right after this. Does that work?"' },
      { label: "Call back the ROE decision", text: '"At the beginning we agreed we\'d make a decision today — does it make sense to keep going, or not? The sense I\'m getting is there\'s something worth exploring. Should we talk about what that looks like?"' },
    ],
    tips: ["Never leave without a booked next step — 85% of deals without one go dark.","Always lead with a recommendation — never 'what do you think we should do next?'","What/Who/Why: what's the step, who should be there, and why it matters.","Rank by deal health: multi-stakeholder demo > technical call > trial > champion prep.","'You know your company better than I do' — gives autonomy while you lead."],
    watchFor: ["Leaving with 'I'll follow up next week' — that's not a next step","Not recommending who else should be in the room","Forgetting to call back the ROE decision you set at the start"],
  },
};

const PANDADOC_CONTEXT = `You are an AI sales coach embedded in a live PandaDoc SMB discovery call companion app.

PandaDoc is an all-in-one document workflow platform. Key stats: 50% reduction in doc creation time, 87% increase in closed deals per month, 36% increase in close rate, saves 20 min per contract via CRM auto-population.

Key personas: VP Sales, Sales Directors, RevOps Leaders, Sales Ops Managers, Business Owners, Marketing Directors.

Core pains PandaDoc solves: manual proposal creation (30-45 min to 5 min), no CRM integration (double data entry), approval bottlenecks, no post-send visibility, inconsistent doc quality, slow signatures, compliance risk.

Framework: Chris Orlob discovery methodology:
1. Rapport - warm opener, read energy, never thank them for their time
2. ROE - objective/agenda/decision, "does that feel fair?", pre-frame the next step
3. Meet buyer where they are - Active (Go Back In Time) vs Latent (Context-Led or Discovery Prompter)
4. Identify and validate business problem - peel back the onion, find metric that decision maker owns
5. Root cause - open diagnostic first ("what's your opinion on why?"), then targeted
6. Negative impact - summarize then quantify (metric + cost of inaction) then open impact then targeted impact
7. Future state - buying vision then buying criteria then decision process (steps/people/criteria/timeline/funding)
8. Next step - What/Who/Why, always book before hanging up

SUMMARIZE AND TRANSITION: The most powerful tool on any call. After every 3-5 questions say "Let me summarize what I've heard so far... [mirror their exact words back] ...Did I get that right?" Then pivot: "Great - so now that we're aligned on [X], [transition question]." This buys more questions, prevents fatigue, and makes buyers feel understood.

You coach reps in real time. Be specific, brief, and actionable. Give word-for-word scripts when asked. Always tie to PandaDoc context.

When you have a prep brief available, use it to personalize every response — reference the prospect's name, company, trigger, tech stack, and hypothesis.`;

const RECIPES = [
  { label: "Summarize → root cause", prompt: "Give me word-for-word: summarize the business problem and transition into asking about root cause." },
  { label: "Summarize → impact", prompt: "Give me word-for-word: summarize root cause and transition into exploring negative impact and ripple effects." },
  { label: "Summarize → future state", prompt: "Give me word-for-word: summarize negative impact and transition into future state and buying criteria." },
  { label: "Summarize → next step", prompt: "Give me word-for-word: summarize the full call and recommend a next step using What/Who/Why." },
  { label: "What to ask next?", prompt: "Based on the current stage and my notes, what's the single best question I should ask right now?" },
  { label: "They want the product", prompt: "The prospect is pushing to see the product before I've finished discovery. What do I say exactly?" },
  { label: "Get to power", prompt: "I'm talking to an evaluator, not the decision maker. How do I navigate to power?" },
  { label: "Peel the onion", prompt: "The buyer gave a surface-level answer. Give me a specific follow-up question to peel back the onion for PandaDoc." },
];

async function suggestSpicedField(fieldKey, notes, prepBrief) {
  const fieldMap = {
    situation: "S — Situation: company context, team size, tools in use",
    pain: "P — Pain: the core business problem and root cause",
    impact: "I — Impact: the metric suffering and cost of inaction",
    critical_event: "C — Critical Event: timeline driver or deadline creating urgency",
    decision: "D — Decision: steps, people involved, criteria, and funding",
  };
  const prompt = `Based on these call notes, extract a concise 1-2 sentence fill for the SPICED field: ${fieldMap[fieldKey]}.

Prep brief context:
${prepBrief || "None provided"}

Call notes:
${Object.entries(notes).map(([k,v]) => v ? `${k}: ${v}` : "").filter(Boolean).join("\n") || "No notes yet"}

Return ONLY the filled text for that field. Use the prospect's exact words where possible. If there's not enough info yet, return an empty string.`;

  try {
    const res = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 200, system: PANDADOC_CONTEXT, messages: [{ role: "user", content: prompt }] }),
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
  const [spiced, setSpiced] = useState({ situation: "", pain: "", impact: "", critical_event: "", decision: "" });
  const [spicedSuggesting, setSpicedSuggesting] = useState({});
  const [coaching, setCoaching] = useState("");
  const [coachingLoading, setCoachingLoading] = useState(false);
  const [coachInput, setCoachInput] = useState("");
  const [outputs, setOutputs] = useState({ spiced: "", email: "", score: "" });
  const [outputLoading, setOutputLoading] = useState("");
  const [expandedScript, setExpandedScript] = useState(null);
  const [proactiveNudge, setProactiveNudge] = useState("");
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const nudgeTimer = useRef(null);
  const coachRef = useRef(null);

  const stage = STAGE_CONTENT[activeStage];
  const currentIdx = STAGES.findIndex(s => s.id === activeStage);
  const completedStages = STAGES.slice(0, currentIdx).map(s => s.id);
  const stageNote = notes[activeStage] || "";

  useEffect(() => {
    if (activeStage === "prep" || activeStage === "outputs") return;
    if (!stageNote || stageNote.length < 40) return;
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => { fireProactiveNudge(stageNote); }, 2000);
    return () => clearTimeout(nudgeTimer.current);
  }, [stageNote, activeStage]);

  async function fireProactiveNudge(noteText) {
    setNudgeLoading(true);
    setProactiveNudge("");
    const context = buildContext(`Stage: ${stage.title}\nNew note captured: "${noteText}"\n\nBased on this note, give ONE brief proactive coaching insight (1-2 sentences max). Flag a gap, suggest the next question, or affirm they're on track. Be direct. No preamble.`);
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 150, system: PANDADOC_CONTEXT, messages: [{ role: "user", content: context }] }),
      });
      const data = await res.json();
      setProactiveNudge(data.content?.[0]?.text || "");
    } catch { setProactiveNudge(""); }
    setNudgeLoading(false);
  }

  function buildContext(question) {
    return `Prep brief:\n${prepBrief || "None"}\n\nStage: ${stage.title}\nBuyer type: ${buyerType || "unknown"}\nNotes: ${Object.entries(notes).map(([k,v]) => v ? k+": "+v : "").filter(Boolean).join(" | ")}\nSPICED: ${JSON.stringify(spiced)}\n\n${question}`;
  }

  async function askCoach(customPrompt) {
    const q = customPrompt || coachInput;
    if (!q.trim()) return;
    if (!customPrompt) setCoachInput("");
    setCoachingLoading(true);
    setCoaching("");
    try {
      const res = await fetch("/api/claude", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: PANDADOC_CONTEXT, messages: [{ role: "user", content: buildContext(q) }] }),
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
      spiced: `Generate a filled SPICED summary for this PandaDoc discovery call and recommend a next step.\n\nPrep brief:\n${prepBrief || "None"}\n\nNotes:\n${allNotes}\n\nSPICED captured:\n${JSON.stringify(spiced)}\n\nWrite each S/P/I/C/D section using their actual words. Then recommend a specific next step using What/Who/Why.`,
      email: `Write a post-discovery follow-up email for PandaDoc.\n\nPrep brief:\n${prepBrief || "None"}\n\nNotes:\n${allNotes}\n\nSPICED:\n${JSON.stringify(spiced)}\n\nStructure: Line 1 greeting + 4-5 word callback. Line 2 situation in their words. Line 3 bridge to next steps. Max 4 bullet next steps. Sign-off: Excited to tackle this together. Talk soon. No corporate speak, short sentences, their words.`,
      score: `Score this PandaDoc discovery call out of 100.\n\nPrep brief:\n${prepBrief || "None"}\n\nNotes:\n${allNotes}\nSPICED: ${JSON.stringify(spiced)}\nBuyer: ${buyerType || "unknown"}\n\nScore /20 each: ROE set properly, Business problem found and validated, Root cause diagnosed, Negative impact explored, Next step secured. Flag top 3 failure modes. Give 3 specific coaching actions.`,
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
  const B = { fontFamily: "Georgia, serif", cursor: "pointer" };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"Georgia,serif", background:C.pageBg, overflow:"hidden" }}>

      {/* Sidebar — wider, bigger text */}
      <div style={{ width:220, background:C.sidebarBg, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflowY:"auto" }}>
        <div style={{ padding:"22px 22px 16px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, fontWeight:600, color:C.textMuted, letterSpacing:"0.12em", textTransform:"uppercase" }}>PandaDoc</div>
          <div style={{ fontSize:18, fontWeight:600, color:C.textPrimary, marginTop:4 }}>Discovery</div>
        </div>
        <div style={{ flex:1, padding:"8px 0" }}>
          {STAGES.map(s => {
            const isActive = s.id === activeStage;
            const isDone = completedStages.includes(s.id);
            return (
              <button key={s.id} onClick={() => setActiveStage(s.id)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", gap:12, padding:"14px 22px", background:isActive?C.activeBg:"transparent", border:"none", borderLeft:isActive?`4px solid ${C.activeBorder}`:"4px solid transparent", textAlign:"left" }}>
                <span style={{ fontSize:15, color:isDone?C.doneText:isActive?C.accentStrong:C.textHint, fontWeight:600, minWidth:18, flexShrink:0 }}>{isDone?"✓":s.icon}</span>
                <span style={{ fontSize:15, color:isActive?C.textPrimary:isDone?C.textSecondary:C.textMuted, fontWeight:isActive?600:400 }}>{s.short}</span>
              </button>
            );
          })}
        </div>
        {buyerType && (
          <div style={{ padding:"14px 22px", borderTop:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, color:C.textHint, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em" }}>Buyer type</div>
            <div style={{ display:"inline-block", fontSize:13, fontWeight:600, padding:"5px 12px", borderRadius:99, background:buyerType==="active"?"#daeeff":"#fff4de", color:buyerType==="active"?"#1a4878":"#7a4200", border:`1px solid ${buyerType==="active"?"#a8d0f0":"#f0c878"}` }}>{buyerType==="active"?"Active":"Latent"}</div>
            <button onClick={() => setBuyerType(null)} style={{ ...B, display:"block", marginTop:6, fontSize:12, color:C.textHint, background:"none", border:"none", padding:0 }}>change</button>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Top bar */}
        <div style={{ padding:"16px 32px", borderBottom:`1px solid ${C.border}`, background:C.panelBg, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:600, color:C.textPrimary }}>{stage.title}</div>
            <div style={{ fontSize:14, color:C.textMuted, marginTop:4 }}>{stage.subtitle}</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            {showOutputsShortcut && (
              <button onClick={() => setActiveStage("outputs")} style={{ ...B, fontSize:13, padding:"9px 18px", border:`1px solid ${C.accentBorder}`, borderRadius:9, background:C.accentBg, color:C.accentText, fontWeight:600 }}>✦ Outputs</button>
            )}
            {currentIdx > 0 && <button onClick={() => setActiveStage(STAGES[currentIdx-1].id)} style={{ ...B, fontSize:14, padding:"9px 20px", border:`1px solid ${C.border}`, borderRadius:9, background:"transparent", color:C.textSecondary }}>← {STAGES[currentIdx-1].short}</button>}
            {currentIdx < STAGES.length-1 && <button onClick={() => setActiveStage(STAGES[currentIdx+1].id)} style={{ ...B, fontSize:14, padding:"9px 22px", border:`1px solid ${C.accentBorder}`, borderRadius:9, background:C.btnBg, color:C.btnText, fontWeight:600 }}>{STAGES[currentIdx+1].short} →</button>}
          </div>
        </div>

        {/* Pill nav */}
        <div style={{ padding:"10px 32px", borderBottom:`1px solid ${C.border}`, background:C.panelBg, display:"flex", gap:8, overflowX:"auto", flexShrink:0 }}>
          {STAGES.map(s => {
            const isActive = s.id === activeStage;
            const isDone = completedStages.includes(s.id);
            return <button key={s.id} onClick={() => setActiveStage(s.id)} style={{ ...B, fontSize:13, padding:"7px 16px", borderRadius:99, border:`1px solid ${isActive?C.accentBorder:C.border}`, background:isActive?C.accentBg:isDone?C.sidebarBg:"transparent", color:isActive?C.accentText:isDone?C.textSecondary:C.textMuted, fontWeight:isActive?600:400, whiteSpace:"nowrap" }}>{isDone?"✓ ":""}{s.short}</button>;
          })}
        </div>

        {/* Body */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* Left panel */}
          <div style={{ flex:1, overflowY:"auto", padding:"28px 32px" }}>

            {/* PREP BRIEF INPUT */}
            {activeStage === "prep" && (
              <div style={{ marginBottom:28 }}>
                <div style={{ background:C.accentBg, border:`2px solid ${C.accentBorder}`, borderRadius:14, padding:24 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.accentText, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>★  Paste your discovery prep brief</div>
                  <div style={{ fontSize:15, color:C.textSecondary, marginBottom:14, lineHeight:1.7 }}>Paste the output from your pre-call research. The live coach and all outputs will use this to personalize every response to this specific prospect.</div>
                  <textarea
                    value={prepBrief}
                    onChange={e => setPrepBrief(e.target.value)}
                    placeholder={"CALL BRIEF: [Company] — [Date]\n\nContact: [Name], [Title] | Tenure: X years\nCall Source: Inbound/Outbound | Buyer Type: Active/Latent\n\nMoney Signals: ...\nTech Stack: ...\nCompelling Trigger: ...\nHypothesis: ...\nOpen Gaps: ..."}
                    style={{ width:"100%", minHeight:200, fontSize:14, lineHeight:1.75, padding:"14px 16px", border:`1px solid ${C.accentBorder}`, borderRadius:10, background:"#ffffff", color:C.textPrimary, resize:"vertical", boxSizing:"border-box", fontFamily:"Georgia,serif", outline:"none" }}
                  />
                  {prepBrief && (
                    <div style={{ marginTop:12, fontSize:14, color:C.accentStrong, fontWeight:600 }}>✓ Brief loaded — coach is personalized to this prospect</div>
                  )}
                </div>
              </div>
            )}

            {/* CALL NOTES */}
            {activeStage !== "outputs" && activeStage !== "prep" && (
              <div style={{ marginBottom:28, background:C.notesBg, border:`2px solid ${C.notesBorder}`, borderRadius:14, padding:22 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#8a7a20", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>✎  Call notes — {stage.title}</div>
                <textarea value={stageNote} onChange={e => setNotes(n => ({ ...n, [activeStage]: e.target.value }))} placeholder="Capture what's happening — use their exact words..." style={{ width:"100%", minHeight:90, fontSize:15, lineHeight:1.75, padding:"12px 14px", border:`1px solid ${C.notesBorder}`, borderRadius:10, background:"#fffff8", color:C.textPrimary, resize:"vertical", boxSizing:"border-box", fontFamily:"Georgia,serif", outline:"none" }} />
              </div>
            )}

            {/* PROACTIVE NUDGE */}
            {(proactiveNudge || nudgeLoading) && activeStage !== "prep" && activeStage !== "outputs" && (
              <div style={{ marginBottom:28, background:"#f0faf3", border:`1px solid #7ec898`, borderRadius:12, padding:"16px 20px", display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontSize:20, flexShrink:0 }}>⚡</span>
                {nudgeLoading
                  ? <span style={{ fontSize:14, color:C.textHint, fontStyle:"italic" }}>Analyzing notes...</span>
                  : <span style={{ fontSize:15, color:C.textSecondary, lineHeight:1.75 }}>{proactiveNudge}</span>
                }
              </div>
            )}

            {/* WATCH FOR */}
            {stage.watchFor && stage.watchFor.length > 0 && (
              <div style={{ marginBottom:28, background:C.warnBg, border:`2px solid ${C.warnBorder}`, borderRadius:14, padding:22 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.warnStrong, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>⚠  Watch for</div>
                {stage.watchFor.map((w,i) => (
                  <div key={i} style={{ display:"flex", gap:12, marginBottom:i<stage.watchFor.length-1?12:0, alignItems:"flex-start" }}>
                    <span style={{ background:C.warnStrong, color:"#fff", fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:5, flexShrink:0, marginTop:2 }}>!</span>
                    <span style={{ fontSize:15, color:C.warnText, lineHeight:1.7 }}>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Always-show (rapport opener) */}
            {stage.alwaysShow && (
              <div style={{ marginBottom:28, background:C.accentBg, border:`2px solid ${C.accentBorder}`, borderRadius:14, padding:22 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.accentText, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>★  {stage.alwaysShow.label}</div>
                <div style={{ fontSize:16, color:C.textPrimary, lineHeight:1.85, fontStyle:"italic", marginBottom:12 }}>{stage.alwaysShow.text}</div>
                {stage.alwaysShow.note && <div style={{ fontSize:14, color:C.textSecondary, lineHeight:1.7, borderTop:`1px solid ${C.accentBorder}`, paddingTop:12 }}>{stage.alwaysShow.note}</div>}
              </div>
            )}

            {/* Buyer type selector */}
            {activeStage === "buyer-type" && !buyerType && (
              <div style={{ background:C.panelBg, border:`1px solid ${C.border}`, borderRadius:14, padding:24, marginBottom:28 }}>
                <div style={{ fontSize:16, fontWeight:600, color:C.textPrimary, marginBottom:18 }}>What's your read on this buyer?</div>
                <div style={{ display:"flex", gap:16 }}>
                  <button onClick={() => setBuyerType("active")} style={{ ...B, flex:1, padding:"18px 20px", border:"2px solid #a8d0f0", borderRadius:12, background:"#edf5ff", textAlign:"left" }}>
                    <div style={{ fontSize:16, fontWeight:600, color:"#1a4878", marginBottom:6 }}>Active buyer</div>
                    <div style={{ fontSize:14, color:"#3a6898", lineHeight:1.5 }}>Inbound, already exploring, maybe comparing</div>
                  </button>
                  <button onClick={() => setBuyerType("latent")} style={{ ...B, flex:1, padding:"18px 20px", border:"2px solid #f0c878", borderRadius:12, background:"#fffbee", textAlign:"left" }}>
                    <div style={{ fontSize:16, fontWeight:600, color:"#7a4200", marginBottom:6 }}>Latent buyer</div>
                    <div style={{ fontSize:14, color:"#9a6220", lineHeight:1.5 }}>Outbound, pain not crystallized, not shopping yet</div>
                  </button>
                </div>
              </div>
            )}

            {/* Scripts */}
            {filteredScripts.length > 0 && (
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Scripts</div>
                {filteredScripts.map((s,i) => {
                  const key = `${activeStage}-${i}`;
                  const open = expandedScript === key;
                  return (
                    <div key={i} style={{ marginBottom:10, border:`1px solid ${open?C.accentBorder:C.scriptBorder}`, borderRadius:12, background:open?C.panelBg:C.scriptBg, overflow:"hidden" }}>
                      <button onClick={() => setExpandedScript(open?null:key)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", background:"transparent", border:"none", textAlign:"left" }}>
                        <span style={{ fontSize:15, fontWeight:600, color:C.textPrimary }}>{s.label}</span>
                        <span style={{ fontSize:13, color:C.textHint }}>{open?"▲":"▼"}</span>
                      </button>
                      {open && (
                        <div style={{ padding:"0 20px 20px" }}>
                          <div style={{ fontSize:15, color:C.textSecondary, lineHeight:1.85, whiteSpace:"pre-wrap", borderLeft:`4px solid ${C.accentBorder}`, paddingLeft:18, fontStyle:"italic", marginBottom:14 }}>{s.text}</div>
                          <button onClick={() => copyText(s.text)} style={{ ...B, fontSize:13, padding:"6px 16px", border:`1px solid ${C.border}`, borderRadius:7, background:C.panelBg, color:C.textMuted }}>Copy</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tips */}
            {stage.tips && stage.tips.length > 0 && (
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Coaching tips</div>
                <div style={{ background:C.tipsBg, border:`1px solid ${C.tipsBorder}`, borderRadius:14, padding:22 }}>
                  {stage.tips.map((tip,i) => (
                    <div key={i} style={{ display:"flex", gap:12, marginBottom:i<stage.tips.length-1?16:0, alignItems:"flex-start" }}>
                      <span style={{ color:C.accentStrong, fontSize:22, flexShrink:0, lineHeight:1.2, marginTop:-2 }}>·</span>
                      <span style={{ fontSize:15, color:C.textSecondary, lineHeight:1.75 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Outputs */}
            {activeStage === "outputs" && (
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:22 }}>End-of-call outputs</div>
                {[
                  { key:"spiced", label:"SPICED Summary + Next Step", desc:"Filled discovery summary with recommended next step" },
                  { key:"email", label:"Follow-up Email", desc:"Ready to send — their words, no corporate speak" },
                  { key:"score", label:"Call Score + Coaching", desc:"Score out of 100 with gap analysis" },
                ].map(o => (
                  <div key={o.key} style={{ background:C.panelBg, border:`1px solid ${C.border}`, borderRadius:14, padding:24, marginBottom:18 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                      <div>
                        <div style={{ fontSize:17, fontWeight:600, color:C.textPrimary }}>{o.label}</div>
                        <div style={{ fontSize:14, color:C.textMuted, marginTop:4 }}>{o.desc}</div>
                      </div>
                      <button onClick={() => generateOutput(o.key)} disabled={!!outputLoading} style={{ ...B, fontSize:14, padding:"10px 20px", border:`1px solid ${C.accentBorder}`, borderRadius:9, background:outputLoading===o.key?C.accentBg:C.btnBg, color:outputLoading===o.key?C.accentText:C.btnText, fontWeight:600, flexShrink:0 }}>
                        {outputLoading===o.key?"Generating...":"Generate ↗"}
                      </button>
                    </div>
                    {outputs[o.key] && (
                      <div>
                        <div style={{ fontSize:15, color:C.textSecondary, lineHeight:1.85, whiteSpace:"pre-wrap", borderTop:`1px solid ${C.border}`, paddingTop:16, marginTop:12 }}>{outputs[o.key]}</div>
                        <button onClick={() => copyText(outputs[o.key])} style={{ ...B, marginTop:12, fontSize:13, padding:"6px 16px", border:`1px solid ${C.border}`, borderRadius:7, background:"transparent", color:C.textMuted }}>Copy</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel — wider */}
          <div style={{ width:340, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, background:C.rightBg, overflowY:"auto" }}>

            {/* SPICED */}
            <div style={{ padding:22, borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                <div style={{ fontSize:12, fontWeight:600, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase" }}>SPICED tracker</div>
              </div>
              {SPICED_FIELDS.map(f => (
                <div key={f.key} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:spiced[f.key]?C.successText:C.textHint, marginBottom:7, display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
                    <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:15 }}>{spiced[f.key]?"✓":"○"}</span>
                      <span>{f.label}</span>
                    </span>
                    <button
                      onClick={() => autoFillSpiced(f.key)}
                      disabled={spicedSuggesting[f.key]}
                      title="Auto-fill from notes"
                      style={{ ...B, fontSize:11, padding:"3px 9px", border:`1px solid ${C.accentBorder}`, borderRadius:7, background:C.accentBg, color:C.accentText, flexShrink:0, opacity: spicedSuggesting[f.key] ? 0.6 : 1 }}
                    >
                      {spicedSuggesting[f.key] ? "..." : "✦ fill"}
                    </button>
                  </div>
                  <textarea value={spiced[f.key]} onChange={e => setSpiced(s => ({ ...s, [f.key]: e.target.value }))} placeholder={f.hint} style={{ width:"100%", fontSize:13, lineHeight:1.65, padding:"9px 11px", border:`1px solid ${spiced[f.key]?C.accentBorder:C.border}`, borderRadius:9, background:spiced[f.key]?C.spicedFilled:C.spicedEmpty, color:C.textPrimary, resize:"none", minHeight:56, boxSizing:"border-box", fontFamily:"Georgia,serif", outline:"none" }} />
                </div>
              ))}
            </div>

            {/* Live coach */}
            <div style={{ padding:22, flex:1, display:"flex", flexDirection:"column" }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.textMuted, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:16 }}>Live coach</div>

              {coaching && <div style={{ fontSize:14, color:C.textSecondary, lineHeight:1.8, background:C.coachBg, border:`1px solid ${C.coachBorder}`, borderRadius:12, padding:18, marginBottom:16, whiteSpace:"pre-wrap" }}>{coaching}</div>}
              {coachingLoading && <div style={{ fontSize:14, color:C.textHint, marginBottom:16, fontStyle:"italic" }}>Thinking...</div>}

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:C.textHint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:9 }}>Quick recipes</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {RECIPES.map(r => (
                    <button key={r.label} onClick={() => askCoach(r.prompt)} style={{ ...B, fontSize:12, padding:"7px 13px", border:`1px solid ${C.accentBorder}`, borderRadius:99, background:C.accentBg, color:C.accentText, lineHeight:1.4 }}>{r.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display:"flex", gap:8, marginTop:"auto" }}>
                <textarea ref={coachRef} value={coachInput} onChange={e => setCoachInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); askCoach(); } }} placeholder="Ask anything mid-call..." style={{ flex:1, fontSize:14, padding:"11px 13px", border:`1px solid ${C.borderMid}`, borderRadius:10, background:C.panelBg, color:C.textPrimary, resize:"none", minHeight:62, fontFamily:"Georgia,serif", outline:"none" }} />
                <button onClick={() => askCoach()} disabled={coachingLoading} style={{ ...B, alignSelf:"flex-end", padding:"11px 16px", border:`1px solid ${C.accentBorder}`, borderRadius:10, background:C.btnBg, fontSize:16, color:C.btnText }}>↗</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
