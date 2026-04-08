import { useState, useRef, useEffect } from "react";

const C = {
  pageBg: "#EFEFEF", panelBg: "#ffffff", border: "#E0DCDA",
  textPrimary: "#242424", textSecondary: "#555555", textMuted: "#999999",
  black: "#242424", white: "#ffffff", sidebar: "#4a4a4a",
  emerald: "#248567", emeraldLight: "#E7F0EE", emeraldMid: "#B9CDC7",
  coral: "#FF826C", sand: "#F4F2F0",
};

const STAGES = [
  { id:"prep",             icon:"◎", short:"Prep Brief" },
  { id:"open",             icon:"①", short:"Open" },
  { id:"buyer-type",       icon:"③", short:"Buyer Type" },
  { id:"business-problem", icon:"④", short:"Business Problem" },
  { id:"baseline",         icon:"⑤", short:"Baseline" },
  { id:"root-cause",       icon:"⑥", short:"Root Cause" },
  { id:"negative-impact",  icon:"⑦", short:"Negative Impact" },
  { id:"future-state",     icon:"⑧", short:"Future State" },
  { id:"next-step",        icon:"⑨", short:"Next Step" },
  { id:"outputs",          icon:"✦", short:"Outputs" },
];

const SPICED_QUESTIONS = [
  {
    key:"situation",
    label:"S — Situation",
    color:"#1a4878",
    bg:"#edf5ff",
    border:"#a8d0f0",
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
    color:"#b07020",
    bg:"#FFF4E6",
    border:"#F5C070",
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
    color:"#9a2060",
    bg:"#FFF0F8",
    border:"#E090C0",
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
    color:"#5a3ab0",
    bg:"#F0EDFF",
    border:"#A496FF",
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

DIAGNOSTIC (first 2 min before ROE): Inbound: "What motivated you to reach out and explore this?" Outbound: "We reached out to you, so this might sound odd — what made you agree to take this call?" Listen: latent=vague | active pain=problem language | evaluating=solution language.

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
  const [notes, setNotes] = useState({});
  const [prepBrief, setPrepBrief] = useState("");
  const [openSpiced, setOpenSpiced] = useState(null);
  const [outputs, setOutputs] = useState({ spiced:"", email:"", score:"", whatweheard:"", debrief:"" });
  const [outputLoading, setOutputLoading] = useState("");
  const [tipsOpen, setTipsOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [expandedScript, setExpandedScript] = useState(null);
  const [roi, setRoi] = useState({ proposalsPerMonth:"", minsPerProposal:"", teamSize:"", hourlyRate:"75", pandadocTimeMins:"15" });
  const [rightTab, setRightTab] = useState("spiced"); // "spiced" | "enterprise" | "roi"
  const [callTranscript, setCallTranscript] = useState("");
  const [debriefLoading, setDebriefLoading] = useState(false);

  const currentIdx = STAGES.findIndex(s => s.id === activeStage);
  const stageNote = notes[activeStage] || "";
  const showOutputsShortcut = activeStage !== "outputs";
  const B = { fontFamily:"'Inter', system-ui, sans-serif", cursor:"pointer" };

  useEffect(() => { setTipsOpen(false); setWatchOpen(false); setExpandedScript(null); }, [activeStage]);

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
      spiced:`Filled SPICED + next step for PandaDoc.\nPrep: ${prepBrief||"None"}\nBuyer path: ${buyerPath||"unknown"}\nNotes:\n${allNotes}\nSPICED so far: ${JSON.stringify(spiced)}\nUse their exact words. S=situation, P=need behind the need+root cause, I=metric+cost of inaction, C=timeline+trajectory+dissatisfaction, D=decision process. Recommend next step with What/Who/Why.`,
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
    const tagColors = {
      ask:{ bg:C.emeraldLight, border:`1.5px solid ${C.emeraldMid}`, badge:C.emerald, badgeText:"#fff", tag:"Ask" },
      wallow:{ bg:"#EEF6FF", border:"1.5px solid #90BEF0", badge:"#2a6ab0", badgeText:"#fff", tag:"Wallow" },
      segue:{ bg:"#FFF4E6", border:"1.5px solid #F5C070", badge:"#b07020", badgeText:"#fff", tag:"Segue" },
      summarize:{ bg:"#FFF8E7", border:"1.5px solid #F5C842", badge:"#c89500", badgeText:"#fff", tag:"Summarize" },
      validate:{ bg:"#FFF0F8", border:"1.5px solid #E090C0", badge:"#9a2060", badgeText:"#fff", tag:"Validate" },
      transition:{ bg:"#F0EDFF", border:"1.5px solid #A496FF", badge:"#5a3ab0", badgeText:"#fff", tag:"Transition" },
    };
    const tc = tagColors[r.type] || tagColors.ask;
    const key = `${prefix}-${idx}`;
    const open = expandedScript === key;
    return (
      <div style={{ marginBottom:8, borderRadius:12, overflow:"hidden", border:open?tc.border:`1.5px solid ${C.border}`, background:C.white }}>
        <button onClick={() => setExpandedScript(open?null:key)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", gap:12, padding:"13px 18px", background:open?tc.bg:C.white, border:"none", textAlign:"left" }}>
          <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:99, background:tc.badge, color:tc.badgeText, flexShrink:0, letterSpacing:"0.06em", textTransform:"uppercase" }}>{tc.tag}</span>
          <span style={{ fontSize:17, fontWeight:700, color:C.textPrimary, flex:1, letterSpacing:"-0.01em" }}>{r.label}</span>
          <span style={{ fontSize:14, color:C.textMuted, fontWeight:700 }}>{open?"▲":"▼"}</span>
        </button>
        {open && (
          <div style={{ background:tc.bg, borderTop:`1px solid ${C.border}` }}>
            {r.text && <div style={{ padding:"18px 22px", fontSize:18, color:"#1a1a1a", lineHeight:2.1, whiteSpace:"pre-wrap", fontWeight:500 }}>{r.text}</div>}
            {r.alts && <div style={{ padding:"12px 22px 0" }}>{r.alts.map((a,i)=><div key={i} style={{ fontSize:16, color:"#1a1a1a", lineHeight:2, whiteSpace:"pre-wrap", fontWeight:500, marginBottom:i<r.alts.length-1?16:0, paddingBottom:i<r.alts.length-1?16:0, borderBottom:i<r.alts.length-1?`1px dashed ${C.border}`:"none" }}>{a}</div>)}</div>}
            {r.note && <div style={{ margin:"12px 22px 0", fontSize:14, color:C.textSecondary, lineHeight:1.75, background:C.white, padding:"12px 16px", borderRadius:8, borderLeft:`3px solid ${tc.badge}` }}>{r.note}</div>}

          </div>
        )}
      </div>
    );
  }

  function renderBuyerType() {
    if (!buyerPath) return (
      <div style={{ marginBottom:28 }}>
        <div style={{ background:C.emeraldLight, border:`1.5px solid ${C.emeraldMid}`, borderRadius:12, padding:"16px 20px", marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.emerald, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Ask this in the first 2 minutes — right after rapport</div>
          <div style={{ fontSize:17, fontWeight:600, color:C.textPrimary, lineHeight:2, marginBottom:6 }}>Inbound: "What motivated you to reach out and explore this?"</div>
          <div style={{ fontSize:17, fontWeight:600, color:C.textPrimary, lineHeight:2, marginBottom:12 }}>Outbound: "We reached out to you, so this might sound odd — but what made you agree to take this call?"</div>
          <div style={{ fontSize:13, color:C.textSecondary, lineHeight:1.7 }}>Then listen. Their language tells you which path you're on.</div>
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:C.textPrimary, marginBottom:14 }}>What did their response sound like?</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { path:"evaluating", border:"#a8d0f0", bg:"#edf5ff", titleColor:"#1a4878", bodyColor:"#3a6898", badge:"#d4eaff", badgeText:"#1a4878", icon:"⚡", title:"Solution language", sub:'"We\'re looking for a product that can do X..." — They\'re actively evaluating. Past pain. Comparing solutions.', technique:"→ Go Back In Time" },
            { path:"active-pain", border:C.emeraldMid, bg:C.emeraldLight, titleColor:"#1a4230", bodyColor:"#3a6248", badge:"#c8e8d8", badgeText:C.emerald, icon:"⚠", title:"Problem language", sub:'"We have a challenge with Y... Z is not where we want it..." — Active pain. They feel it but haven\'t defined a solution.', technique:"→ Symptoms → Problems" },
            { path:"latent", border:"#f0c878", bg:"#fffbee", titleColor:"#7a4200", bodyColor:"#9a6220", badge:"#fde8b0", badgeText:"#7a4200", icon:"◎", title:"Vague or can't remember", sub:'"You said something that caught my attention but..." — Latent pain. Dormant. Not top of mind.', technique:"→ Discovery Prompter" },
          ].map(opt=>(
            <button key={opt.path} onClick={()=>setBuyerPath(opt.path)} style={{ ...B, padding:"18px 22px", border:`2px solid ${opt.border}`, borderRadius:12, background:opt.bg, textAlign:"left" }}>
              <div style={{ fontSize:15, fontWeight:700, color:opt.titleColor, marginBottom:6 }}>{opt.icon} {opt.title}</div>
              <div style={{ fontSize:13, color:opt.bodyColor, lineHeight:1.65, marginBottom:8 }}>{opt.sub}</div>
              <div style={{ fontSize:12, fontWeight:600, color:opt.titleColor, background:opt.badge, padding:"3px 10px", borderRadius:6, display:"inline-block" }}>{opt.technique}</div>
            </button>
          ))}
        </div>
      </div>
    );

    const pathLabel = buyerPath==="evaluating"?"⚡ Actively Evaluating":buyerPath==="active-pain"?"⚠ Active Pain":"◎ Latent Pain";
    const pathColor = buyerPath==="evaluating"?"#1a4878":buyerPath==="active-pain"?C.emerald:"#7a4200";

    return (
      <div style={{ marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:pathColor, letterSpacing:"0.06em", textTransform:"uppercase" }}>{pathLabel}</div>
          <button onClick={()=>setBuyerPath(null)} style={{ ...B, fontSize:12, color:C.white, background:C.coral, border:"none", borderRadius:6, padding:"5px 14px", fontWeight:600 }}>← Change</button>
        </div>

        {buyerPath === "evaluating" && <>
          <div style={{ fontSize:14, color:C.textSecondary, lineHeight:1.75, marginBottom:16, padding:"12px 16px", background:"#edf5ff", borderRadius:10, border:"1.5px solid #a8d0f0" }}>They're on the second half of the buyer's journey. Predisposed to talk about solutions. Meet them there first — then earn the right to go back to pain. 4 steps: Align → Wallow → Segue → Go Back.</div>
          <div style={{ background:"#fff8e8", border:"1.5px solid #f5c842", borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#c89500", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:6 }}>Skip it rule</div>
            <div style={{ fontSize:14, color:"#5a3c00", lineHeight:1.7 }}>If they pour their heart out about pain on Step 1 — go with it. The technique served its purpose. Don't keep asking Steps 2-3. Just follow the pain.</div>
          </div>
          {[
            { type:"ask", label:"Step 1 — Align: meet them where they are", text:'"Can you help me understand what you\'re looking for in a product or service like this?"', note:"You will almost never get friction from this question at this stage. They want to talk solutions — so start there." },
            { type:"wallow", label:"Step 2 — Wallow: stay here. Don't check the box.", alts:['"What are you looking to accomplish with a product like this?"','"What else are you looking for it to do?"','"What\'s most important to you in whatever you end up going with?"'], note:"This is where most reps fail — they ask Step 1, get an answer, and rush to Step 3. Don't. Spend real time here. Ask 2-3 genuine follow-ups. Wallowing is what makes Step 3 feel earned instead of jarring." },
            { type:"segue", label:"Step 3 — Segue: bridge from solution to current reality", text:'"How are you handling things today without those capabilities?"', note:"Piggyback off what they described. They've been telling you what they want — now you're asking what it looks like without it. This is the natural bridge back to their current state." },
            { type:"ask", label:"Step 4 — Go back in time (permission first — always)", alts:['"Can I go back in time with you for a second? What was the original trigger event or problem that made you prioritize looking into this?"','"Can I go back in time with you for a second on something? It\'s clear you know what you want more than most people I talk to. I\'m curious — what did that meeting look like, and how did you all define the problem that set this initiative in motion?"'], note:"Option 2 is the killer question. It triggers a concrete mental image — they go back to the room where they defined this with their colleagues. Much richer answer. 'Can I go back in time' is a permission point. Ask it every single time." },
            { type:"summarize", label:"Summarize before moving on", text:'"Ok. Let me see if I have this right so far.\n\n[Their exact words — what they\'re looking for, what they want to accomplish, and the original challenge]\n\nDid I get that right?"', note:"Their words, not yours. Buyers resonate with their own language. When you parrot it back exactly, they exhale. Now springboard into the business problem." },
          ].map((r,i)=><RhythmCard key={i} r={r} idx={i} prefix="eval" />)}
          <div style={{ marginTop:16, background:"#fff3f3", border:"1.5px solid #f5a0a0", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#8b1a1a", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>⚠ Watch For</div>
            {["Asking 'tell me about your key challenges' before aligning — they're past that stage, you'll get friction or 'just show me the product'","Checking the box on Step 1 and rushing to Step 3 — spend real time in Step 2, it's non-negotiable","Skipping the permission phrase on Step 4 — 'can I go back in time' must be said every time"].map((w,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:i<2?8:0 }}><span style={{ background:C.coral, color:C.white, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0, marginTop:2 }}>!</span><span style={{ fontSize:13, color:"#5a1a00", lineHeight:1.65 }}>{w}</span></div>
            ))}
          </div>
        </>}

        {buyerPath === "active-pain" && <>
          <div style={{ fontSize:14, color:C.textSecondary, lineHeight:1.75, marginBottom:16, padding:"12px 16px", background:C.emeraldLight, borderRadius:10, border:`1.5px solid ${C.emeraldMid}` }}>Active pain — they feel it but are expressing symptoms, not the underlying problem. Symptoms get ghosted. Problems get funded. Discipline yourself to slow down and develop what they're sharing into something CFO-worthy.</div>
          <div style={{ background:"#fff8e0", border:"1.5px solid #f0c040", borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#8b6000", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:10 }}>Symptom vs. Problem</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div style={{ background:"#fff3f3", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#8b1a1a", marginBottom:6 }}>SYMPTOM — keep peeling</div>
                <div style={{ fontSize:13, color:"#5a1a00", lineHeight:1.6 }}>Can't be expressed as a business outcome. CFO rejects it. "Reps struggling with discovery." Gets ghosted.</div>
              </div>
              <div style={{ background:"#f0fbf4", borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#1a5c28", marginBottom:6 }}>PROBLEM — you're here</div>
                <div style={{ fontSize:13, color:"#1a3c1e", lineHeight:1.6 }}>Measurable business outcome. CFO listens. "Win rates dropped from 27% to 19%." Gets funded.</div>
              </div>
            </div>
          </div>
          {[
            { type:"ask", label:"When you hear a symptom — slow down and ask these", alts:['"How is this affecting the business in a way that makes it a priority?"','"What underlying issue is this causing that the business would regret not solving six months from now?"','"What\'s going on behind the scenes that makes this a priority?"','"When you think about your priorities, how highly does this rank compared to the others — and why?"'], note:"These are all follow-up questions after a buyer expresses a symptom. Each one asks 'why does this matter enough to fund?' Pick one. Use softening language if you've asked something similar already." },
            { type:"ask", label:"Softening T-up — use before hard follow-up questions", alts:['"This is going to sound a little redundant. You could be focusing on any number of challenges, but I sense energy behind this one specifically. What\'s going on behind the scenes that has you focused on this above the others?"','"If the question I\'m about to ask comes across as overbearing, feel free to kick me in the teeth. With that said — what\'s going on in the business that\'s driving this to make its way to your priority list?"'], note:"The T-up before the question changes everything. Same question — completely different reception. Use this any time you've already asked something similar or the next question feels heavy." },
            { type:"summarize", label:"Summarize + Validate — two distinct jobs", alts:['"Let me see if I\'ve understood you so far... [their exact words back] ...Did I get that right?"','"Before we move on — I want to make sure I\'m aligned to the things you care about most. Is this the challenge we should anchor our conversations to, or did I lead you down a path to something you only mildly care about?"'], note:"Summarize every 3-5 questions (Option 1). Validate once per call before going deeper (Option 2). These are different jobs — don't conflate them. Better to hear 'actually this isn't that important' now than after three weeks of work on a deal that goes dark." },
          ].map((r,i)=><RhythmCard key={i} r={r} idx={i} prefix="active" />)}
          <div style={{ marginTop:16, background:"#fff3f3", border:"1.5px solid #f5a0a0", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#8b1a1a", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>⚠ Watch For</div>
            {["Hearing a symptom and immediately pitching — this is the hammer and nail syndrome and it puts a ceiling on your income","Stopping at the first answer — it's almost always too surface level. The first answer is a symptom 90% of the time.","Not validating priority before going deep — you might spend weeks on a nice-to-solve that goes dark"].map((w,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:i<2?8:0 }}><span style={{ background:C.coral, color:C.white, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0, marginTop:2 }}>!</span><span style={{ fontSize:13, color:"#5a1a00", lineHeight:1.65 }}>{w}</span></div>
            ))}
          </div>
        </>}

        {buyerPath === "latent" && <>
          <div style={{ fontSize:14, color:C.textSecondary, lineHeight:1.75, marginBottom:16, padding:"12px 16px", background:"#fffbee", borderRadius:10, border:"1.5px solid #f0c878" }}>Their pain is dormant. Pushing it to the back of their mind. Questions tap into what's top of mind — and by definition, latent pain is not top of mind. Stories activate it. Your tool is the Discovery Prompter.</div>
          <div style={{ background:"#f5f0ff", border:"1.5px solid #c0a0ff", borderRadius:10, padding:"14px 18px", marginBottom:16 }}>
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
          <div style={{ marginTop:16, background:"#fff3f3", border:"1.5px solid #f5a0a0", borderRadius:10, padding:"14px 18px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#8b1a1a", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>⚠ Watch For</div>
            {["Telling a success story instead of a pain story — they need to see themselves in the struggle, not the outcome","Skipping Step 3 (failed attempts) — this is the step that makes them say 'that's exactly us'","Using the prompter on a warm buyer — you're overcomplicating it, go direct instead"].map((w,i)=>(
              <div key={i} style={{ display:"flex", gap:10, marginBottom:i<2?8:0 }}><span style={{ background:C.coral, color:C.white, fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:4, flexShrink:0, marginTop:2 }}>!</span><span style={{ fontSize:13, color:"#5a1a00", lineHeight:1.65 }}>{w}</span></div>
            ))}
          </div>
        </>}
      </div>
    );
  }

  const STAGE_DATA = {
    "business-problem": {
      rule:"Anytime you transition to a new topic — summarize first. Then transition.",
      rhythm:[
        { type:"ask", label:"The killer question — lead with this", text:'"What is going on in your business that\'s driving this to be a priority?"', note:"Orlob: buyers often chuckle at this question — because it gets them thinking about the underlying trainwreck in their business. That chuckle is the signal you're getting closer to the center of the onion." },
        { type:"ask", label:"Aside from template — ask the same thing twice naturally", alts:['"Aside from [what they just said], is there something going on behind the scenes driving you to prioritize fixing this?"','"Aside from the obvious benefits of solving [X], is there anything else going on behind the scenes that has you focused on this above the other challenges?"'], note:"This is how you ask the same question multiple times without it feeling like you're repeating yourself. Acknowledge what they said. Invite the deeper answer. Same spirit — zero repetition." },
        { type:"ask", label:"Softening T-up — when the next question feels heavy", alts:['"This is going to sound a little redundant. You could be focusing on any number of challenges in your world, but I sense energy behind this one specifically. What\'s going on behind the scenes that has you focused on this above the others?"','"If the question I\'m about to ask comes across as overbearing, feel free to kick me in the teeth. With that said — what\'s going on in the business that\'s driving this to make its way to your priority list?"'], note:"Use this any time you need to ask a hard follow-up or you've already asked something similar. The T-up changes the entire feel of the question." },
        { type:"ask", label:"Validate — raging fire or brush fire?", text:'"Before we go too much further — I just want to make sure we\'re anchoring our conversation to the right thing. Is this the challenge we should be focused on together, or are there other things that are going to overpower this? Is this something that\'ll be top of mind a week from now, or more of a nice-to-have?"', note:"CFO acid test: would a CFO fund this problem statement? If no → symptom, keep peeling. If yes → you're at a problem. Symptoms get ghosted. Problems get funded." },
        { type:"summarize", label:"Summarize + Validate → Transition to Baseline", alts:['"Let me see if I\'ve understood you so far.\n\n[Their exact words back. Mirror their language exactly — not a paraphrase, not your words.]\n\nDid I get that right?"','"Before we move on — I want to make sure I\'m aligned to the things you care about most. Is this the challenge we should anchor our conversations to, or did I lead you down a path to something you only mildly care about?"'], note:"Option 1 = summarize (do every 3-5 questions). Option 2 = validate priority (do once per call). Two different jobs. The validate question might save you weeks on a deal that would have gone dark." },
      ],
      tips:["The first answer your buyer gives is almost always too surface level. Human nature. Guide them deeper.","When power takes over the conversation — you've crossed the power line. You've hit the center.","Little problems → little dollars. BIG problems → BIG dollars.","Don't move on until you can pass the No Logo Challenge: could someone identify this company from your description of their problem alone?"],
      watch:["Stopping at the first answer — 'we need better proposals' is a solution, not a problem","Accepting a desired solution as the business problem — keep peeling","Happy ears — getting excited about pain before validating it's actually a raging fire"],
    },
    "baseline": {
      rule:"Measure the problem. You can't build a business case without a number.",
      rhythm:[
        { type:"ask", label:"Surface the metric — is this CFO worthy?", alts:['"What metric is below expectations as a result of the challenges you\'ve shared with me?"','"What number is suffering as a result of this? How is it measured?"'], note:"If there's no metric — you're still at a symptom. Keep peeling. The metric is what makes the problem fundable. No metric = no business case." },
        { type:"ask", label:"Measure the gap — current vs. expected", alts:['"Where does that number stand today compared to where it should be? How big is the delta?"','"Where is [metric] today, and where does your business expect it to be?"'], note:"The gap between current and expected is where the pain lives. That delta is also the foundation of the business case. Current number minus desired number = the value delta." },
        { type:"ask", label:"Trajectory — is it getting worse?", text:'"How long has this been in its current state? Has it been getting better, worse, or staying flat — and over what time frame?"', note:"A metric dropping fast and recently has more urgency than a slow decline over years. Trajectory matters. Fast drop = more energy behind solving it." },
        { type:"ask", label:"Dissatisfaction — how much energy is behind this?", text:'"How much energy or dissatisfaction is there within the business around the current state of that number?"', note:"This tells you how much of a raging fire this is internally. Low dissatisfaction = brush fire, keep pressure testing. High dissatisfaction = you're at the center." },
        { type:"summarize", label:"Summarize + Validate → Transition to Root Cause", alts:['"Let me see if I\'ve understood you so far.\n\n[Problem in their words + the metric + where it stands today + trajectory]\n\nDid I get that right?"','"Is this the problem we should anchor the rest of our conversation to — or is there something more pressing I should know about?"'], note:"Anytime you transition — summarize first, then transition. Never jump from baselining to root cause without this." },
      ],
      tips:["Three things to baseline: the metric, the trajectory, and the level of dissatisfaction.","Current state number + desired state number = the value delta. That's all a business case is.","Your buyer may have never measured this before. When you ask them to, it crystallizes the problem as a priority.","Brian Robac story: started with a $20k deal, peeled the onion to market share, baselined it → closed $433k in 90 days."],
      watch:["Skipping baseline entirely — no metric = no business case = no urgency","Accepting a vague answer — push for the actual number, not an approximation","Not asking about trajectory — a metric in freefall has different urgency than a gradual decline"],
    },
    "root-cause": {
      rule:"The cause dictates the solution that gets purchased. Open first — always.",
      rhythm:[
        { type:"ask", label:"Open diagnostic — always ask this first", text:'"What\'s your opinion on why this is happening?"', note:"People love giving their opinion. This gets long, rich answers. It also earns you the right to ask targeted questions. Open question unlocks targeted — skip it and go straight to targeted, buyers feel pushed and resist." },
        { type:"ask", label:"Targeted — pick 1-2 max", alts:['"To what extent do you think it\'s because your team is building everything manually — Word docs, copy-paste, email back and forth?"','"To what extent is it because data is living in two places and your team is moving it manually between your CRM and whatever you\'re sending?"','"Is part of what\'s slowing things down the internal back-and-forth before something even gets to the prospect?"','"When you send something out, do you have any sense of whether they actually opened it — or does it go into a black hole?"'], note:"Pick 1-2 max. 'To what extent' framing softens and invites nuance instead of a yes/no. These targeted questions also plant seeds that shape what gets demoed later — if they confirm a root cause, that's what you demo to." },
        { type:"summarize", label:"Summarize → Transition to Negative Impact", alts:['"Ok, let me summarize what I\'ve heard so far.\n\n[Their problem in their words + root causes they\'ve confirmed]\n\nDid I get that right?"','"Ok, great. Thanks for confirming that. Now that we have your challenge established — what are the ripple effects this issue is having across the business?"'], note:"Option 2 is Orlob's exact script — use it verbatim. The summary earns you the right to ask about ripple effects. Never jump to impact without summarizing first." },
      ],
      tips:["Products don't solve business problems — they address root causes of business problems. The cause dictates what gets purchased.","Once you understand root cause → align your demo to it. Not to the surface problem.","Advanced: guide them toward a root cause that only PandaDoc uniquely solves — that's how you shape buying criteria in your favor."],
      watch:["Going straight to targeted questions without the open question — buyers feel manipulated and resist","Demoing to the wrong root cause — this is why deals die after a 'great' demo","Not summarizing before transitioning — you'll wear out your welcome"],
    },
    "negative-impact": {
      rule:"Give a reason before every hard question. Always. 'The reason I'm asking is...'",
      rhythm:[
        { type:"ask", label:"Quantify the pain — metric question", alts:['"What metric would improve the most if you solved the challenges you\'ve been sharing with me?"','"What metric is suffering as a result of the challenges you\'re sharing with me?"'], note:"Positive or negative framing — pick whichever fits the conversation. Either way you're looking for a number. No number = no business case. This starts the quantification process." },
        { type:"ask", label:"Give a reason first — then ask about ripple effects", text:'"Hey, I have a somewhat obvious question for you. The reason I\'m asking this is — if we get far enough down the road where we decide we want to do business together, your CFO is probably going to want an answer to this: what are some of the negative ramifications you\'re seeing [their problem] have on the business?"', note:"Always give a reason before an awkward question. Cialdini: people comply far more when you explain why you're asking. 'The reason I'm asking is...' is the most important six words in this question." },
        { type:"ask", label:"Open impact — use this exact phrasing", text:'"What are the ripple effects this challenge is having across the business?"', note:"NOT 'how does this impact you?' That sounds cheesy and salesy. 'Ripple effects across the business' signals business acumen and sophistication. Same question — completely different reception." },
        { type:"ask", label:"Targeted impact — pick 1-2 max", alts:['"To what extent are deals going cold because proposals get built from scratch or stuck in approval queues before they even reach the prospect?"','"A lot of teams say when the manual process goes on long enough, it starts to affect morale — reps feel like they\'re doing admin, not selling. To what degree are you seeing that show up on your team?"','"How much is the lack of post-send visibility contributing to deals going dark — reps following up blind with no idea if the prospect even opened it?"'], note:"You need 2-3 targeted impact questions that land consistently. Don't ask 10. More than 3 = diminishing returns fast. Test them, refine them, get to your go-to 2-3." },
        { type:"summarize", label:"Summarize → Transition to Future State", alts:['"Let me summarize what I\'ve heard so far.\n\n[Problem + root causes + ripple effects in their exact words]\n\nDid I get that right?"','"If you\'re open to it, I\'d love to flip this — if you solved this, what does good look like 365 days from now?"'], note:"Option 2 is the transition into Future State. The contrast between the painful present you just summarized and the future they're about to describe is where the feeling of value lives." },
      ],
      tips:["Loss aversion: the pain of losing something is twice as intense as the pleasure of gaining the equivalent. Build the cost of inaction.","Negative impact is the language of senior executives. This is how you get to power.","2-3 targeted questions that land consistently is all you need. Test them. Refine them."],
      watch:["Asking 'how does this impact you?' — use 'ripple effects across the business' instead. Same question, 10x more sophisticated.","Skipping quantification — it's the foundation of the business case","More than 3 targeted impact questions — diminishing returns fast"],
    },
    "future-state": {
      rule:"Value comes from contrast — painful present + compelling future = desire to purchase.",
      rhythm:[
        { type:"ask", label:"The 365-day question — ask right off the summary", text:'"Imagine we started working together today to solve these challenges. Put yourself into the future 365 days from now. What would have to be true for you to feel good about the progress we\'ve made?"', note:"Buyers often exhale at this question. They've been sitting in pain for the last few minutes and now you're casting their imagination into relief. The emotional contrast between painful present and compelling future is what creates the feeling of value." },
        { type:"ask", label:"Quantify the desired state — if they didn't", text:'"Where would [the metric they shared] have to be for you and everyone involved to feel good about the progress you\'ve made?"', note:"Only ask this if they didn't naturally quantify it. Current state number + desired state number = the value delta. That delta is all a business case is." },
        { type:"ask", label:"Pressure test — does everyone care about this goal?", text:'"How aligned would everybody else involved be if that was the explicit goal of our partnership — is that the goal everyone else cares about too?"', note:"Prevents them from voicing a random aspiration. Makes sure the future state has organizational alignment. If others don't care about this goal — it won't get funded." },
        { type:"ask", label:"The powerhouse question — personal stake", text:'"I want to ask you something a little different. Beyond what this means for the business — what does solving this mean for you personally?"', note:"The most powerful question you'll ask all call. Don't skip it. The personal motivation is the emotional fuel that drives urgency and keeps deals from going dark when things get complicated." },
        { type:"ask", label:"Decision process — flows into next step", alts:['"So what steps do you and your company need to take from here to make a decisive go or no-go on this?"','"Who would be involved in each of those steps — and how?"','"What would make each person involved say yes or no?"','"What would drive your timeline for moving through those steps?"','"If we get to the point of doing business — how do you think you\'d fund this, based on how you\'ve funded similar projects?"'], note:"Ask at least the first two. These flow directly into your next step recommendation. You can't recommend the right next step without knowing who else is involved." },
        { type:"summarize", label:"Final summary — sets up the What We Heard slide", text:'"Let me make sure I\'ve captured everything before we talk about next steps.\n\n[Current state + metric + root cause + ripple effects + desired state + target metric]\n\nDid I get that right? Anything you\'d add?"', note:"This summary becomes the What We Heard slide that opens your next meeting. It's the through line for the rest of the sales process — demo, multi-threading, POC, business case, negotiation." },
      ],
      tips:["Ask open buying criteria first: 'what do you think you need to solve this?' — see what they're already sold on before you pitch anything.","If they describe your product → easy path to demo. If they describe something off-base → now you know what to reshape.","The personal motivation question is the most powerful thing you'll ask all call.","The What We Heard summary opens every subsequent meeting — it's not just an end-of-call artifact."],
      watch:["Going into demo without asking what they think they need — flying blind","Skipping the personal motivation question — it's the emotional fuel for urgency","Leaving without understanding who else is involved in the decision"],
    },
  };

  const sd = STAGE_DATA[activeStage];

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
            return (
              <button key={s.id} onClick={() => setActiveStage(s.id)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", gap:12, padding:"13px 12px", borderRadius:8, background:isActive?C.emerald:"transparent", border:"none", textAlign:"left", marginBottom:2 }}>
                <span style={{ fontSize:16, color:isActive?C.white:"#aaa", fontWeight:700, minWidth:20, textAlign:"center" }}>{s.icon}</span>
                <span style={{ fontSize:15, color:C.white, fontWeight:isActive?700:500 }}>{s.short}</span>
              </button>
            );
          })}
        </div>
        {buyerPath && (
          <div style={{ padding:"16px 22px", borderTop:"1px solid #666" }}>
            <div style={{ fontSize:10, color:"#aaa", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.1em" }}>Buyer Path</div>
            <div style={{ display:"inline-flex", fontSize:12, fontWeight:600, padding:"4px 12px", borderRadius:99, background:buyerPath==="evaluating"?"#0d2a4a":buyerPath==="active-pain"?"#0a2a1a":"#3a1e00", color:buyerPath==="evaluating"?"#6aaae8":buyerPath==="active-pain"?"#5ad88a":"#e8a84a" }}>
              {buyerPath==="evaluating"?"⚡ Evaluating":buyerPath==="active-pain"?"⚠ Active Pain":"◎ Latent"}
            </div>
            <button onClick={()=>setBuyerPath(null)} style={{ ...B, display:"block", marginTop:6, fontSize:11, color:"#bbb", background:"none", border:"1px solid #666", borderRadius:5, padding:"3px 8px" }}>← change</button>
          </div>
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* TOP BAR */}
        <div style={{ padding:"22px 36px", borderBottom:`1px solid ${C.border}`, background:C.white, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <div style={{ fontSize:26, fontWeight:800, color:"#666", letterSpacing:"-0.03em" }}>
              {{prep:"Pre-Call Prep Brief",open:"Rapport + ROE","buyer-type":"Meet Buyer Where They Are","business-problem":"Business Problem",baseline:"Baseline Current State","root-cause":"Root Cause Analysis","negative-impact":"Negative Impact","future-state":"Future State + Buying Process","next-step":"Secure the Next Step",outputs:"Outputs"}[activeStage]}
            </div>
            <div style={{ fontSize:14, color:C.textMuted, marginTop:4 }}>
              {{prep:"Paste your prep brief. Everything downstream personalizes from this.",open:"Open strong. Set the agenda. Diagnose your buyer.","buyer-type":"Diagnose first. Then match your approach to where they are.","business-problem":"Peel back the onion. Find business pain that money follows.",baseline:"Measure it. Metric + trajectory + dissatisfaction.","root-cause":"The cause dictates the solution that gets purchased.","negative-impact":"Build urgency without being salesy.","future-state":"Value comes from contrast — painful present, compelling future.","next-step":"What. Who. Why. Book it before you hang up.",outputs:"Generate your end-of-call outputs."}[activeStage]}
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            {showOutputsShortcut && <button onClick={()=>setActiveStage("outputs")} style={{ ...B, fontSize:13, padding:"10px 20px", border:`2px solid ${C.emerald}`, borderRadius:8, background:"transparent", color:C.emerald, fontWeight:700 }}>✦ Outputs</button>}
            {currentIdx > 0 && <button onClick={()=>setActiveStage(STAGES[currentIdx-1].id)} style={{ ...B, fontSize:14, padding:"10px 22px", border:`1px solid ${C.border}`, borderRadius:8, background:C.white, color:C.textMuted, fontWeight:500 }}>← Back</button>}
            {currentIdx < STAGES.length-1 && <button onClick={()=>setActiveStage(STAGES[currentIdx+1].id)} style={{ ...B, fontSize:14, padding:"10px 24px", border:"none", borderRadius:8, background:C.emerald, color:C.white, fontWeight:700 }}>Next →</button>}
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          <div style={{ flex:1, overflowY:"auto", padding:"32px 36px" }}>

            {/* PREP */}
            {activeStage === "prep" && (
              <div style={{ marginBottom:28 }}>
                <div style={{ background:C.emeraldLight, border:`2px solid ${C.emeraldMid}`, borderRadius:14, padding:26, marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.emerald, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>★ Paste your discovery prep brief</div>
                  <div style={{ fontSize:15, color:C.textSecondary, marginBottom:16, lineHeight:1.7 }}>Paste the output from your pre-call research. The coach and all outputs will use this to personalize every response.</div>
                  <textarea value={prepBrief} onChange={e=>setPrepBrief(e.target.value)} placeholder={"CALL BRIEF: [Company] — [Date]\n\nContact: [Name], [Title] | Tenure: X years\nCall Source: Inbound/Outbound\n\nMoney Signals: ...\nTech Stack: ...\nCompelling Trigger: ...\nOpen Gaps: ..."} style={{ width:"100%", minHeight:180, fontSize:14, lineHeight:1.8, padding:"14px 16px", border:`1.5px solid ${C.emeraldMid}`, borderRadius:10, background:C.white, color:C.textPrimary, resize:"vertical", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }} />
                  {prepBrief && <div style={{ marginTop:12, fontSize:14, color:C.emerald, fontWeight:600 }}>✓ Brief loaded — coach personalized to this prospect</div>}
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
                <div style={{ marginBottom:28, background:C.emerald, borderRadius:14, padding:26 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>★ Open with this — every time</div>
                  <div style={{ fontSize:22, color:C.white, lineHeight:1.9, marginBottom:14, fontWeight:600 }}>"I'm glad we found the time to meet today."</div>
                  <div style={{ fontSize:15, color:"rgba(255,255,255,0.85)", lineHeight:1.7, borderTop:"1px solid rgba(255,255,255,0.2)", paddingTop:14 }}>Then SHUT UP. See how they respond. Small talk energy → stay with it. Business energy → "Can we talk about the agenda?" Never thank them for their time — positions you lower.</div>
                </div>
                <div style={{ marginBottom:20, background:"#fff8e0", border:"1.5px solid #f5c040", borderRadius:12, padding:"16px 20px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#8b6000", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>🏆 Presidents Club Frame — Larry S.</div>
                  <div style={{ fontSize:14, color:"#5a3c00", lineHeight:1.8, marginBottom:12 }}>Genuinely understand <strong>what's not working</strong>, <strong>why it's not working</strong>, and <strong>do the math to scope the impact</strong>. Soften with reverse psychology.</div>
                  {[
                    { label:"They say it takes 3 hours", q:'"What about that process is taking 3 hours?"' },
                    { label:"They lost a deal", q:'"What's the average deal size?" → "How many times has this happened in the last month?"' },
                    { label:"Soften frequency", q:'"Is this something that happens often — or was that a rare one-off?"' },
                  ].map((f,i)=>(
                    <div key={i} style={{ background:"#fffef5", borderRadius:8, padding:"10px 14px", border:"1px solid #f0d870", marginBottom:i<2?8:0 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#8b6000", marginBottom:4 }}>{f.label}</div>
                      <div style={{ fontSize:14, color:"#3a2a00", lineHeight:1.7, fontStyle:"italic" }}>{f.q}</div>
                    </div>
                  ))}
                </div>

                {[{ label:"They want to chat", text:'Stay with it for 60-90 seconds. Ask something real. Then: "Can we talk about the agenda?"' },{ label:"They mean business", text:'"Good, thanks for asking. Look, I know your time is valuable and you reached out for a reason — mind if we dive in?"' }].map((s,i)=>{
                  const key=`open-${i}`, open=expandedScript===key;
                  return (<div key={i} style={{ marginBottom:8, borderRadius:12, overflow:"hidden", border:`1.5px solid ${open?C.emerald:C.border}`, background:C.white }}>
                    <button onClick={()=>setExpandedScript(open?null:key)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", background:open?C.emerald:C.white, border:"none", textAlign:"left" }}>
                      <span style={{ fontSize:18, fontWeight:700, color:open?C.white:C.textPrimary }}>{s.label}</span>
                      <span style={{ fontSize:14, color:open?C.white:C.textMuted, fontWeight:700 }}>{open?"▲":"▼"}</span>
                    </button>
                    {open && <div><div style={{ padding:"22px 26px", fontSize:18, color:"#1a1a1a", lineHeight:2.1, whiteSpace:"pre-wrap", fontWeight:500 }}>{s.text}</div></div>}
                  </div>);
                })}
                <Collapsible label="⚠ Watch For" isOpen={watchOpen} onToggle={()=>setWatchOpen(v=>!v)} accent={C.coral}>
                  {["Thanking the prospect for their time — immediately positions you lower","Jumping straight to agenda without reading their energy"].map((w,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, marginBottom:i<1?12:0 }}><span style={{ background:C.coral, color:C.white, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, flexShrink:0, marginTop:3 }}>!</span><span style={{ fontSize:16, color:"#5a1a00", lineHeight:1.75 }}>{w}</span></div>
                  ))}
                </Collapsible>
              </div>
            )}

            {/* ROE */}
            {activeStage === "open_roe_removed" && (
              <div>
                {[
                  { label:"Transition from small talk", text:'"Can we talk about the agenda?"' },
                  { label:"Full ROE — Orlob's exact script", text:'"Here\'s what I\'m thinking in terms of an agenda. Let me know if you had something else in mind.\n\nThe objective of this meeting in my mind is simply to determine if we should have a next step. Obviously I don\'t expect us to do business on this call. So let\'s just learn enough about each other to determine whether the next logical step even makes sense.\n\nFair?\n\nGreat. Now here\'s the agenda I\'m thinking:\n\nFirst, let\'s spend most of our time getting clear on the challenges you\'re facing.\n\nOnce we\'re clear on that, I can share a bit about what PandaDoc does so we can jointly decide whether we schedule a next step.\n\nDoes that agenda feel fair?"' },
                  { label:"End-of-call callback", text:'"So at the beginning of this call, one of the things we agreed on is we\'ll make a decision — does it make sense to schedule a next logical step, or does it make sense not to?\n\nThe sense I\'m getting is it feels like this conversation has legs and we should talk about what a next step looks like. Does that feel fair to you?"' },
                ].map((s,i)=>{
                  const key=`open2-${i}`, open=expandedScript===key;
                  return (<div key={i} style={{ marginBottom:8, borderRadius:12, overflow:"hidden", border:`1.5px solid ${open?C.emerald:C.border}`, background:C.white }}>
                    <button onClick={()=>setExpandedScript(open?null:key)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", background:open?C.emerald:C.white, border:"none", textAlign:"left" }}>
                      <span style={{ fontSize:18, fontWeight:700, color:open?C.white:C.textPrimary }}>{s.label}</span>
                      <span style={{ fontSize:14, color:open?C.white:C.textMuted, fontWeight:700 }}>{open?"▲":"▼"}</span>
                    </button>
                    {open && <div><div style={{ padding:"22px 26px", fontSize:18, color:"#1a1a1a", lineHeight:2.1, whiteSpace:"pre-wrap", fontWeight:500 }}>{s.text}</div></div>}
                  </div>);
                })}
                <Collapsible label="Coaching Tips" isOpen={tipsOpen} onToggle={()=>setTipsOpen(v=>!v)} accent={C.textMuted}>
                  {["Objective → Agenda → Decision. In that order. Always.","\"Here's what I'm thinking... let me know if you had something else in mind\" — gives them veto power while you stay in control.","\"Does that feel fair?\" closes every ROE. Very hard to disagree with something positioned as fair.","Pre-framing the decision at the start is how you nearly guarantee a next step at the end."].map((t,i)=>(<div key={i} style={{ display:"flex", gap:14, marginBottom:i<3?14:0 }}><span style={{ fontSize:15, color:C.textMuted, flexShrink:0 }}>—</span><span style={{ fontSize:16, color:C.textSecondary, lineHeight:1.75 }}>{t}</span></div>))}
                </Collapsible>
                <Collapsible label="⚠ Watch For" isOpen={watchOpen} onToggle={()=>setWatchOpen(v=>!v)} accent={C.coral}>
                  {["Skipping ROE — leads directly to 'can you just show me the product?'","Not getting verbal agreement ('fair?') before starting discovery","Forgetting to call back the decision at end of call"].map((w,i)=>(<div key={i} style={{ display:"flex", gap:12, marginBottom:i<2?14:0 }}><span style={{ background:C.coral, color:C.white, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, flexShrink:0, marginTop:3 }}>!</span><span style={{ fontSize:16, color:"#5a1a00", lineHeight:1.75 }}>{w}</span></div>))}
                </Collapsible>
              </div>
            )}

            {/* BUYER TYPE */}
            {activeStage === "buyer-type" && renderBuyerType()}

                        {/* RHYTHM STAGES */}
            {sd && (
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.textMuted, letterSpacing:"0.06em", marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>{sd.rule}</div>
                {sd.rhythm.map((r,i)=><RhythmCard key={i} r={r} idx={i} prefix={activeStage} />)}
                <Collapsible label="Coaching Tips" isOpen={tipsOpen} onToggle={()=>setTipsOpen(v=>!v)} accent={C.textMuted}>
                  {sd.tips.map((t,i)=>(<div key={i} style={{ display:"flex", gap:14, marginBottom:i<sd.tips.length-1?14:0 }}><span style={{ fontSize:15, color:C.textMuted, flexShrink:0 }}>—</span><span style={{ fontSize:16, color:C.textSecondary, lineHeight:1.75 }}>{t}</span></div>))}
                </Collapsible>
                <Collapsible label="⚠ Watch For" isOpen={watchOpen} onToggle={()=>setWatchOpen(v=>!v)} accent={C.coral}>
                  { label:"Trial + check-in", text:'"What I\'d recommend is getting you into a trial and checking in in three days once you\'ve had a chance to look around. I\'ll send you a setup link right after this call. Does that work?"' },
                  { label:"Call back the ROE", text:'"So at the beginning of this call, one of the things we agreed on is we\'d both make a decision — does it make sense to continue in a concrete way, or is this not a priority? Based on what we both learned — should we go our separate ways, or does it make sense to take a next step?"' },

                  {sd.watch.map((w,i)=>(<div key={i} style={{ display:"flex", gap:12, marginBottom:i<sd.watch.length-1?14:0 }}><span style={{ background:C.coral, color:C.white, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, flexShrink:0, marginTop:3 }}>!</span><span style={{ fontSize:16, color:"#5a1a00", lineHeight:1.75 }}>{w}</span></div>))}
                </Collapsible>
              </div>
            )}

            {/* NEXT STEP */}
            {activeStage === "next-step" && (
              <div>
                {[
                  { label:"Full What/Who/Why — Orlob's exact script", text:'"Looks like we\'re coming up on time. Should we talk about next steps?\n\nGreat. You know your company better than me. So if you have a different idea, let me know.\n\nBut based on what you told me today, what I recommend we do next is [specific next step].\n\nIt would be helpful if we could include [name/role] in that meeting too — [why they should be there].\n\nDoes that feel fair?"' },
                  { label:"Multi-stakeholder demo", text:'"Based on what you\'ve shared, I\'d recommend a focused demo with you and [decision maker]. It\'d be helpful to have [name/role] in the room — since what we talked about directly affects [their metric]. You know your company better than I do — does that feel like the right next step?"' },                ].map((s,i)=>{
                  const key=`next-${i}`, open=expandedScript===key;
                  return (<div key={i} style={{ marginBottom:8, borderRadius:12, overflow:"hidden", border:`1.5px solid ${open?C.emerald:C.border}`, background:C.white }}>
                    <button onClick={()=>setExpandedScript(open?null:key)} style={{ ...B, width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 22px", background:open?C.emerald:C.white, border:"none", textAlign:"left" }}>
                      <span style={{ fontSize:18, fontWeight:700, color:open?C.white:C.textPrimary }}>{s.label}</span>
                      <span style={{ fontSize:14, color:open?C.white:C.textMuted, fontWeight:700 }}>{open?"▲":"▼"}</span>
                    </button>
                    {open && <div><div style={{ padding:"22px 26px", fontSize:18, color:"#1a1a1a", lineHeight:2.1, whiteSpace:"pre-wrap", fontWeight:500 }}>{s.text}</div></div>}
                  </div>);
                })}
                <Collapsible label="Coaching Tips" isOpen={tipsOpen} onToggle={()=>setTipsOpen(v=>!v)} accent={C.textMuted}>
                  {["Every rep who overperformed took a leadership posture on next steps. Always have a clear point of view on what to do next.","Any deal without a scheduled next step on the calendar is at risk. 85%+ go dark.","Always lead with a recommendation. Never 'what do you think we should do next?'","Rank by deal health: multi-stakeholder demo > technical call > trial > champion prep."].map((t,i)=>(<div key={i} style={{ display:"flex", gap:14, marginBottom:i<3?14:0 }}><span style={{ fontSize:15, color:C.textMuted, flexShrink:0 }}>—</span><span style={{ fontSize:16, color:C.textSecondary, lineHeight:1.75 }}>{t}</span></div>))}
                </Collapsible>
                <Collapsible label="⚠ Watch For" isOpen={watchOpen} onToggle={()=>setWatchOpen(v=>!v)} accent={C.coral}>
                  {["'I'll follow up next week' — not a next step. Must be booked before you hang up.","Not recommending who else should be in the room — this is how you stay stuck with one contact.","Forgetting to call back the ROE decision you set at the start of the call."].map((w,i)=>(<div key={i} style={{ display:"flex", gap:12, marginBottom:i<2?14:0 }}><span style={{ background:C.coral, color:C.white, fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:4, flexShrink:0, marginTop:3 }}>!</span><span style={{ fontSize:16, color:"#5a1a00", lineHeight:1.75 }}>{w}</span></div>))}
                </Collapsible>
              </div>
            )}

            {/* OUTPUTS */}
            {activeStage === "outputs" && (
              <div>
                <div style={{ background:"#fff8e0", border:"1.5px solid #f5c040", borderRadius:12, padding:"16px 20px", marginBottom:24 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#8b6000", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>No Logo Challenge — before you generate</div>
                  <div style={{ fontSize:14, color:"#5a3c00", lineHeight:1.75 }}>Could someone read your description of this customer's problem and identify the company — without seeing the logo? If it describes every company on the planet, you haven't gone deep enough. That specificity is the acid test of good discovery.</div>
                </div>
                {/* CALL DEBRIEF */}
                <div style={{ background:C.white, border:`2px solid ${C.emerald}`, borderRadius:14, padding:26, marginBottom:18 }}>
                  <div style={{ fontSize:18, fontWeight:700, color:C.textPrimary, marginBottom:4 }}>Post-Call Debrief</div>
                  <div style={{ fontSize:14, color:C.textMuted, marginBottom:18, lineHeight:1.6 }}>Paste your Granola transcript. Get specific coaching on exactly what you missed and what to say differently next time — referenced against the Orlob framework.</div>
                  <textarea
                    value={callTranscript}
                    onChange={e => setCallTranscript(e.target.value)}
                    placeholder="Paste your Granola transcript here... (e.g. 0:00 | Tyler — hey how's it going...)"
                    style={{ width:"100%", minHeight:160, fontSize:14, lineHeight:1.75, padding:"14px 16px", border:`1.5px solid ${C.border}`, borderRadius:10, background:C.sand, color:C.textPrimary, resize:"vertical", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none", marginBottom:14 }}
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


          </div>

          {/* RIGHT — SPICED + COACH */}
          <div style={{ width:340, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, background:C.white }}>

            {/* RIGHT PANEL TABS */}
            <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
              {[
                { id:"spiced",     label:"Questions" },
                { id:"enterprise", label:"Enterprise" },
                { id:"roi",        label:"ROI" },
              ].map(t => (
                <button key={t.id} onClick={()=>setRightTab(t.id)} style={{ ...B, flex:1, padding:"16px 4px", fontSize:14, fontWeight:800, letterSpacing:"0.03em", textTransform:"uppercase", border:"none", borderBottom: rightTab===t.id ? `3px solid ${C.emerald}` : "3px solid transparent", background: rightTab===t.id ? C.emeraldLight : "transparent", color: rightTab===t.id ? C.emerald : C.textMuted, marginBottom:-1 }}>
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
                                <div style={{ fontSize:13, color:"#1a1a1a", lineHeight:1.7 }}>{q}</div>
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
                  { feature:"Workspaces", color:"#1a4878", bg:"#edf5ff", border:"#a8d0f0", questions:[
                    { q:"Which teams would realistically be using PandaDoc day-to-day?", hot:false },
                    { q:"Do different teams need their own templates, branding, or approval flows?", hot:false },
                    { q:"Would it ever be a problem if HR could see sales contracts — or vice versa?", hot:true },
                  ]},
                  { feature:"Smart Content", color:"#1a4230", bg:C.emeraldLight, border:C.emeraldMid, questions:[
                    { q:"How much of your proposals stays the same vs. customized each time?", hot:false },
                    { q:"Do you have content that depends on industry, product, or region?", hot:false },
                    { q:"Do reps ever copy-paste sections from old docs to save time?", hot:true },
                    { q:"How do you make sure reps are using the right version of messaging?", hot:true },
                  ]},
                  { feature:"Approval Workflows", color:"#7a4200", bg:"#fffbee", border:"#f0c878", questions:[
                    { q:"At what point does a deal need internal approval today?", hot:false },
                    { q:"What usually triggers that — pricing, discounting, legal terms?", hot:false },
                    { q:"How do you handle approvals now — Slack, email, something else?", hot:false },
                    { q:"Ever had a deal go out that shouldn't have without approval?", hot:true },
                  ]},
                  { feature:"Renewal Notifications", color:"#5a3ab0", bg:"#F0EDFF", border:"#A496FF", questions:[
                    { q:"Do you manage contracts with renewal dates today?", hot:false },
                    { q:"How do you usually keep track of upcoming renewals?", hot:false },
                    { q:"Ever had something auto-renew or expire without your team noticing?", hot:true },
                  ]},
                  { feature:"Content Locking", color:"#8b1a1a", bg:"#fff3f3", border:"#f5a0a0", questions:[
                    { q:"How much flexibility do reps have when editing templates?", hot:false },
                    { q:"Are there parts of the doc that should never be changed?", hot:false },
                    { q:"Have you ever had issues with reps tweaking pricing, terms, or content?", hot:true },
                  ]},
                  { feature:"Redlining", color:"#1a4878", bg:"#edf5ff", border:"#a8d0f0", questions:[
                    { q:"How do contract negotiations usually happen today?", hot:false },
                    { q:"Do you go back and forth in Word or PDF — or directly in the doc?", hot:false },
                    { q:"Who's typically involved in reviewing changes — legal, finance, client?", hot:false },
                  ]},
                  { feature:"Salesforce / HubSpot 2-way Sync", color:"#1a4230", bg:C.emeraldLight, border:C.emeraldMid, questions:[
                    { q:"How important is it that data flows both ways automatically?", hot:false },
                    { q:"Do reps update your CRM manually after sending docs?", hot:false },
                    { q:"Any errors or mismatches happening after that?", hot:true },
                    { q:"Do you need signed PDFs attached to records so legal or billing can see them?", hot:true },
                  ]},
                  { feature:"Custom Roles", color:"#7a4200", bg:"#fffbee", border:"#f0c878", questions:[
                    { q:"Do different people on your team need different levels of access?", hot:false },
                    { q:"Do you need to limit who can see certain templates, pricing, or actions?", hot:false },
                    { q:"Has someone ever accidentally changed or sent something they shouldn't have?", hot:true },
                  ]},
                  { feature:"SSO", color:"#5a3ab0", bg:"#F0EDFF", border:"#A496FF", questions:[
                    { q:"How does your team usually log into tools — individual logins or centralized?", hot:false },
                    { q:"Does your IT team require or enforce SSO for new tools?", hot:true },
                  ]},
                  { feature:"Whitelabeling", color:"#8b1a1a", bg:"#fff3f3", border:"#f5a0a0", questions:[
                    { q:"Do you want clients to feel like everything is coming directly from your domain?", hot:false },
                    { q:"Have you ever had issues with emails landing in spam or looking external?", hot:true },
                  ]},
                  { feature:"HIPAA Compliance", color:"#1a4878", bg:"#edf5ff", border:"#a8d0f0", questions:[
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
                              <div style={{ fontSize:13, color:q.hot?"#8b1a00":"#1a1a1a", lineHeight:1.7, fontWeight:q.hot?600:400 }}>{q.q}</div>
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
                      <input type="number" value={roi[f.key]} onChange={e=>setRoi(r=>({...r,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{ width:"100%", fontSize:15, fontWeight:600, padding:"10px 12px", border:`1.5px solid ${C.border}`, borderRadius:8, background:C.sand, color:C.textPrimary, boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }} />
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
                        { label:"Current cost / yr",    value:fmt(costNowYear),   sub:`${fmtH(hoursNowYear)} building docs`,        color:C.coral,    bg:"#fff3f3",    border:`${C.coral}50` },
                        { label:"With PandaDoc / yr",   value:fmt(costPDYear),    sub:`${fmtH(hoursPDYear)} at 15 min/proposal`,    color:C.emerald,  bg:C.emeraldLight, border:C.emeraldMid },
                        { label:"Annual value delta",   value:fmt(savedDollars),  sub:`${fmtH(savedHours)} reclaimed — ${savePct}% saved`, color:"#1a4878", bg:"#edf5ff", border:"#a8d0f0" },
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

          </div>
        </div>
      </div>
    </div>
  );
}
