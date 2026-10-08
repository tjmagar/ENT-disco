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

const STAGES = [
  { id:"prep",               icon:"◎",  short:"Prep Brief",               group:"setup" },
  { id:"rapport-opener",     icon:"1",  short:"Opening + Intros",         group:"setup" },
  { id:"rules-engagement",   icon:"2",  short:"Objective + Agenda",       group:"setup" },
  { id:"context",            icon:"3",  short:"Clasp Context",            group:"setup" },
  { id:"value-drop",         icon:"4",  short:"Value Drop",               group:"value" },
  { id:"summary-buyin",      icon:"5",  short:"Summary + Buy-in",         group:"value" },
  { id:"business-problem",   icon:"6",  short:"Business Problem",         group:"discovery" },
  { id:"baseline-current",   icon:"7",  short:"Current State",            group:"discovery" },
  { id:"cause-analysis",     icon:"8",  short:"Cause Analysis",           group:"discovery" },
  { id:"negative-impact",    icon:"9",  short:"Negative Impact",          group:"discovery" },
  { id:"future-state",       icon:"10", short:"Future State",             group:"discovery" },
  { id:"close-next-steps",   icon:"11", short:"Close + Next Steps",       group:"close" },
  { id:"outputs",            icon:"✦",  short:"Outputs",                  group:"close" },
];

// Phase + timebox per stage (from the designed template)
const STAGE_META = {
  "rapport-opener":   { phase:"OPEN",            timebox:"3 min" },
  "rules-engagement": { phase:"ALIGN",           timebox:"2 min" },
  "context":          { phase:"CONTEXT",         timebox:"4 min" },
  "value-drop":       { phase:"VALUE",           timebox:"12 min" },
  "summary-buyin":    { phase:"BUY-IN",          timebox:"1 min" },
  "business-problem": { phase:"BUSINESS PROBLEM",timebox:"5 min" },
  "baseline-current": { phase:"CURRENT STATE",   timebox:"4 min" },
  "cause-analysis":   { phase:"CAUSE ANALYSIS",  timebox:"4 min" },
  "negative-impact":  { phase:"NEGATIVE IMPACT", timebox:"4 min" },
  "future-state":     { phase:"FUTURE STATE",    timebox:"3 min" },
  "close-next-steps": { phase:"CLOSE",           timebox:"3 min" },
};

// What to write down at each stage. These feed the [placeholders] in later summaries.
const CAPTURE = {
  "rapport-opener":   [{ key:"win", label:"What would make today a win", hint:"Each person's answer" },
                       { key:"vibe", label:"Read on them", hint:"Pronouns, energy, anything they volunteered" }],
  "rules-engagement": [{ key:"agendaAdds", label:"Added to the agenda", hint:"Anything they want covered" }],
  "context":          [{ key:"startArea", label:"Where they want to start", type:"choice", options:["Pipeline","Labor cost","Retention","All three"] },
                       { key:"startWhy", label:"What they said", hint:"Fills \"It sounds like…\" in Business Problem" }],
  "value-drop":       [{ key:"signOnView", label:"What they've seen with sign-ons" },
                       { key:"contractAreas", label:"Where they use contract labor most" },
                       { key:"reactions", label:"What landed", hint:"Reactions, questions, objections" }],
  "summary-buyin":    [{ key:"buyIn", label:"Buy-in score (1–10)" },
                       { key:"toTen", label:"What would make it a 10" }],
  "business-problem": [{ key:"surfaceNeed", label:"Surface need", hint:"What they say they want" },
                       { key:"businessDriver", label:"Need behind the need", hint:"The business problem. Would a CFO fund it?" },
                       { key:"trigger", label:"Trigger event", hint:"What set this in motion, in their words" },
                       { key:"whoCares", label:"Who cares most", hint:"Names and titles" },
                       { key:"validated", label:"Confirmed as the anchor?", type:"choice", options:["Yes","Partly","No"] },
                       { key:"competing", label:"Competing priorities" }],
  "baseline-current": [{ key:"metric", label:"Metric", hint:"e.g. first-year turnover" },
                       { key:"current", label:"Current", hint:"Their number and unit" },
                       { key:"target", label:"Target", hint:"Where it should be" },
                       { key:"why", label:"Why that target" },
                       { key:"roles", label:"Roles they hire new grads in" },
                       { key:"schools", label:"School relationships", hint:"Which programs, who owns them" },
                       { key:"turnover", label:"First-year turnover", hint:"Number + department" },
                       { key:"signOns", label:"Sign-on bonuses", hint:"Type and amount" },
                       { key:"contract", label:"Contract labor", hint:"How much, where" }],
  "cause-analysis":   [{ key:"rootCause", label:"Root cause", hint:"Their words" },
                       { key:"suspected", label:"Your suspected root cause", hint:"Fills Q3" },
                       { key:"blocker", label:"What's blocking them" }],
  "negative-impact":  [{ key:"ripple", label:"Ripple effects" },
                       { key:"whoElse", label:"Who else is affected" },
                       { key:"cost", label:"Cost per month" }],
  "future-state":     [{ key:"theirSolution", label:"What they think they need" },
                       { key:"capability", label:"Capability to test", hint:"Fills Q3" },
                       { key:"needle", label:"How much it moves the needle" }],
  "close-next-steps": [{ key:"read", label:"Your honest read", hint:"Fills the close script" },
                       { key:"nextStep", label:"Next step" },
                       { key:"who", label:"Who attends" },
                       { key:"date", label:"Date" }],
};

// Script items per stage.
//   say: spoken beats. cue = what the beat does; check = stop and wait for a yes; then = what you say after the yes; list = numbered points.
//   ask: a question. "\n\n" splits it into the main ask and follow-ups.
//   **bold** marks the words to land; [placeholders] fill from the prep brief and the capture pane.
const STAGE_DATA = {
  "rapport-opener": {
    rule:"Land the opener, get permission for the agenda, then intros — yours, your colleague's, then theirs.",
    script:[
      { kind:"say", beats:[
        { cue:"Greet", text:"Hi [Names], I'm **glad we found the time** today. How's your **week** been?" },
        { cue:"Ask permission", text:"Great, well mind if we talk about the **agenda**?\n\nPerfect. Quick intros before we dive in." },
        { cue:"Your intro", text:"My name is **TJ Magar**, I'm a Director of Healthcare Partnerships here at Clasp." },
        { cue:"Why you care", text:"I'm super passionate about the work we do here because **I'm an agitated borrower myself**, so I know how it feels to have that barrier to education. And I love that we are **breaking that down**, especially for the most important workforce and industry: **healthcare**." },
        { cue:"Hand off", check:"answer", text:"I've brought my colleague **Altara** here as well — and then would love to hear about you both, maybe just **what would make today a win**. But Altara — mind sharing a quick intro first?" },
      ]},
    ],
    tips:["Pronouns: I/me/my means personal stakes matter. We/us/our means team focus and consensus matter.","Energy: talkative, stay with it. Business, pivot. Don't force the wrong mode.","Write down what would make today a win for each person. It sets up the agenda."],
    watch:["Thanking the prospect for their time — immediately positions you lower","Letting intros run long — keep yours to two sentences"],
  },
  "rules-engagement": {
    rule:"Align on the objective, the agenda, and the decision to be made.",
    script:[
      { kind:"say", beats:[
        { cue:"Bridge from intros", text:"Perfect, that leads into what I had in mind for today." },
        { cue:"Propose the agenda", text:"Here's what I'm thinking in terms of **how we spend our time**. Let me know if you had something else in mind…" },
        { cue:"Set the outcome", text:"But the outcome I recommend we shoot for is to **learn enough about each other** to decide whether or not it makes sense to have a **second meeting**." },
        { cue:"Lower the stakes", text:"Obviously, I **don't expect us to do business** on this call. So let's just learn enough about each other to determine if another call makes sense." },
        { cue:"Check", check:true, text:"Is that **fair so far**?", then:"Perfect." },
        { cue:"Walk the agenda", text:"Now here's the agenda I'm thinking will help us get there.", list:[
          "First, I'll share **a little about Clasp** upfront so you have the context for the rest of the call.",
          "But I'd love to spend **most of our time** today getting clear on **what's important to [their company]** — maybe the different challenges or goals you might have as they relate to **workforce recruitment, development, or retention**.",
          "Once we're clear on that — and if I think we can help — I'll **explain more about how it works** so you have an understanding.",
          "Then we can **jointly decide** whether we set that next step. And I'll save some time at the end for that.",
        ]},
        { cue:"Check", check:true, text:"Does that all feel **reasonable and fair**?", then:"Great. Let's take a crack at it." },
      ]},
    ],
    tips:["Align on the objective, the agenda, and the decision to be made.","Pause after each fairness check and let them answer."],
    watch:["Rushing past the fairness checks without pausing","Skipping the agenda after they agree to the objective"],
  },
  "context": {
    rule:"Share context first to earn the right to ask questions. Then let them pick where to start.",
    script:[
      { kind:"say", title:"Who we are", beats:[
        { cue:"Set up the slides", text:"So like I said, to share a bit of context for the rest of today, I've prepared **a few short slides**. Please feel free to **interrupt me** as I share a bit about us." },
        { cue:"Who we are", text:"So at Clasp, we work **exclusively in healthcare** (full stop)… and within that, we exist to support HR and talent acquisition teams **attract and retain hard-to-fill clinical talent**." },
        { cue:"Proof", text:"Our partners include major systems such as **Novant Health, Northwestern Medicine and Boston Children's**, as well as smaller systems like **Saint Alphonsus**. And even outpatient clinics like **Confluent Health**, specialty clinics, the whole gamut." },
      ]},
      { kind:"say", title:"Three outcomes", beats:[
        { cue:"Who we talk to", text:"So we talk to a lot of HR leaders across the country — talent acquisition, L&D, workforce development, ops and business leaders — **a lot of smart folks**. And we talk to them about a lot of things, but **the three areas where we're able to drive the most value**, and where it often makes sense to work together, are here on your screen." },
        { cue:"Three areas", text:"", list:[
          { tag:"Pipeline", text:"Our partners use this program to build a **bigger, stronger pipeline** of soon-to-graduate RNs, Imaging Techs, Rehabilitation Therapists, and other clinical and allied health roles — **before they ever hit the open market**." },
          { tag:"Labor cost", text:"Others are **bleeding money** on sign-on bonuses and contract labor, and recruitment costs just to fill and keep roles filled." },
          { tag:"Retention", text:"And some are **losing good people** they already have to a competitor for more money — so they're motivating them to stay by offering **career pathways** and internal development opportunities — MAs into RNs, PTAs into PTs — instead of watching them walk out the door." },
        ]},
        { cue:"Hand it to them", check:"answer", text:"I have an idea where you might fit in given [what you spotted], and in general, the industry norm of **first-year nurse retention**. But given your current situation, **where would be the most relevant place for us to start** our conversation?", then:"Okay great, that makes sense." },
      ]},
    ],
    tips:["Keep it to a few slides. The point is to earn the right to ask questions, not to pitch.","Mark the area they pick in the capture pane. Value Drop and discovery follow it."],
    watch:["Turning the context into a full pitch","Picking the area for them — let them choose"],
  },
  "value-drop": {
    rule:"Follow their interest. Focus the conversation on the area they chose. All three: pipeline, then spend, then retention.",
    screen:"Sharing the slides and examples for each talk track",
    script:[
      { kind:"say", beats:[
        { cue:"Acknowledge + start", text:"Okay, let's start with how we help our partners [the area they chose]." },
      ]},
      { kind:"say", group:"Pipeline", title:"The outcome", proof:["Channels: school penetration, social + influencers, associations + conferences, campus ambassadors + virtual career fairs"], beats:[
        { cue:"The outcome", text:"The biggest outcome we drive for our partners is building them a **bigger pipeline of soon-to-graduate talent**. We do this through a number of channels.", list:[
          { tag:"Educate", text:"Channels that **educate the students** on the possibilities and benefits of this type of program." },
          { tag:"Awareness", text:"Channels that **generate awareness** of this type of program as a reason to join your system after graduation." },
          { tag:"Convert", text:"And channels to **convert them into applicants** — to get them to raise their hand and say, \"When I graduate, I want to come work for you!\"" },
        ]},
      ]},
      { kind:"say", group:"Pipeline", title:"Get the word out: TikTok", proof:["Curated influencer network reaches 4.6M+ engaged followers"], beats:[
        { cue:"Get the word out", text:"First we have to get the word out — if you're becoming a Nurse, an Imaging Tech, a Rehab Therapist, there are healthcare systems that will **help repay part of your student loans** so that you'll want to work with them." },
        { cue:"Influencers", text:"One of the most effective ways we've found to do this is through **social media influencers**. We have a whole curated network of **TikTok influencers who are clinicians and techs**. We've really cracked the code on this. I know it may sound funny, but it really works and it's so important for this generation." },
        { cue:"Where they talk", text:"This is where they go to talk to each other, and **their student loan debt is what they're talking about**. Matter of fact, let me show you something." },
        { cue:"Show the search", text:"I did a simple search for TikTok videos talking about nursing student loan debt / PT debt / Rad Tech debt, and look at the results. **Video after video** of nurses and nursing school students talking about their debt — how they will pay it off, do they regret getting into that much debt. **This is on their minds**, and they go to TikTok to ask each other about it." },
        { cue:"Creative + compliance", text:"That's why we have a **creative team** working with influencers who are clinicians and techs to make content that lets these students know about these programs. We have a **compliance team** that makes sure it's buttoned up — not boring, but buttoned up." },
        { cue:"Show a video", text:"Videos like this one. We can see the **level of engagement** — the views, the comments, the reshares. It gets these students **thinking about what's possible**." },
      ]},
      { kind:"say", group:"Pipeline", title:"Schools + campus", proof:["Active school partnerships: 70+ nursing, 90+ imaging, 70+ rehab therapy, 110+ RT","Ambassadors: we recruit, onboard, track referrals and pay out. Low lift for your team","Virtual career fair: 187 PT, OT and SLP students from 88 schools"], beats:[
        { cue:"School network", text:"To really engage with the students, we've built out a **nationwide network of school relationships** that drive applicants into the top of your funnel. We talk with **Program Directors and Career Services** to spread the word that there are healthcare systems, like yourself, that will help their students pay part of their loans when they come to work for you." },
        { cue:"Why schools care", text:"This is an appealing message to these leaders, one that resonates with them in a way **offering a sign-on bonus doesn't**. It motivates them to share this information with their students, and gets us **access to their students** in a way that many employers don't have." },
        { cue:"Campus ambassadors", text:"We also have a network of **campus ambassadors**, boots on the ground, to engage the students on campus. They're talking to soon-to-graduate nurses, imaging techs, and rehab therapists about our partners who are offering these programs." },
        { cue:"Wider reach", text:"These channels are what we use to **fill the top of your funnel** with applicants. And since we have relationships with schools across the country, this **widens your talent pool**. It allows you to pull in students from beyond your immediate area. Gives you reach into campuses that you might not have a relationship with right now." },
      ]},
      { kind:"say", group:"Pipeline", title:"Convert: your recruiters", proof:["One system hit >200% of its rad tech applicant goal, with applicants from 6 states","Northwestern Medicine: \"we did not ever have 32 RT applicants at a time prior to Clasp\"","Partners see applicants from 10+ states on average"], beats:[
        { cue:"Support your TA", text:"And we **support the work your TA is doing** with the local programs and residency programs. We have a team dedicated to **enabling your recruiters**. The landing pages and other marketing materials we create will help them **convert candidates they're already talking to** before the competition does." },
        { cue:"Show landing pages", text:"Landing pages like these. We tailor it to **your message, your employer brand and value prop**. It sends the message loud and clear to the students: 'We understand what you're looking for, and **we're the right fit for you**.'" },
      ]},
      { kind:"say", group:"Labor cost", title:"Open", beats:[
        { cue:"Bridge", text:"Offering a Student Loan Repayment program does more than just build pipeline. It can help you **spend less on sign-on bonuses and contract labor**." },
        { cue:"Ask", check:"answer", text:"Do you currently spend money on either of these for **Nursing, Imaging Techs, or Rehab Therapists**?" },
      ]},
      { kind:"say", group:"Labor cost", title:"If they spend on sign-ons", proof:["Every $10k in sign-ons creates about $2,800 of value: −72% ROI (Laudio)","Upfront cash hit, nearly impossible to claw back, re-paid with every backfill"], beats:[
        { cue:"The arms race", check:"answer", text:"Let me ask you a question, because what our partners tell us is that sign-on bonuses feel a bit like **an arms race**. That you have to offer one because everyone else is, and they keep escalating every year. **What have you seen in that regard?**" },
        { cue:"Acknowledge, then the story", text:"It's funny, I was talking to a TA leader at a hospital and she said that healthcare is **the only place where you can get a job with a sign-on**, work there 6 months, quit, walk across the street, and **get another sign-on bonus the next day**." },
        { cue:"Why sign-ons fail", text:"The sign-on really appeals to a **'right now' mentality**. Very often, it goes towards other expenses, and the loans just accumulate interest. It's why they're really **not effective in keeping people around**." },
        { cue:"The cost", text:"And why you end up spending so much on sign-ons — because you have to **keep refilling the role** after the first year when 10%, 15%, 20% of the new hires leave. They really are **expensive and ineffective**. New hires leave anyway, and now you're in a **clawback situation**." },
        { cue:"The contrast", text:"It's a real contrast to the type of person who is looking for help with their student loans. **They're thinking of the future.** They're looking for a place where they can stay and grow. So when you use that money for Student Loan Repayment instead of a sign-on, **you end up spending less**, because you don't have to refill the role as frequently, don't have to pay out another sign-on bonus." },
        { cue:"Paid over time", text:"The payment is also made to them **over time, monthly**, as they're employed with you. So **no need for costly clawbacks**, and no paying in advance for someone who is going to leave after year 1. Spreading the payments out, and in some cases using a **ladder payment** approach, means **you're only spending to get and keep them**." },
      ]},
      { kind:"say", group:"Labor cost", title:"If they spend on contract labor", proof:["Travelers cost ~2.2x","Weekly averages: RN $2,190 · Rad Tech $2,291 · PT $2,231 · RT $2,015 (about $8–9k a month each)"], beats:[
        { cue:"Ask", check:"answer", text:"We help **reduce spend on contract labor**, especially in locations, specialties, and shifts that you're finding hard to fill with a full-time employee. **What areas do you find you're using contract labor the most?**" },
        { cue:"Acknowledge + reframe", text:"Areas like these can often be difficult to fill. Many of our partners use travelers to fill the gaps, like you're doing. But they're finding that this type of program gets the attention of candidates who are looking for help with their student loans, and are **willing to work at the location, in the specialty, or on the shift where you need it most**." },
        { cue:"The payoff", text:"They're motivated by the Student Loan Repayment to come work for you, and now **you need fewer travelers**. And that means **thousands of dollars a week** that can be recouped." },
      ]},
      { kind:"say", group:"Retention", title:"Built to keep them", proof:["Partners' year-1 turnover is ~5% vs an industry average above 20%","Paid monthly once they're an employee; payments can step up in year 2"], beats:[
        { cue:"Bridge", text:"Helping you build a bigger pipeline and saving on spend are important benefits our partners see with us. But there is another area where we have a positive effect. We're also helping them **retain and grow their employees**." },
        { cue:"Built to stay", text:"First of all, the way your Student Loan Repayment program is structured **encourages them to stay 3, 4, or 5 years**. That's because the amount is spread out monthly over that period. It's paid to them while they're employed. **It's like your 401K contribution** — an incentive to stay to get that full amount." },
        { cue:"Proof", text:"It's why our partners see **single-digit turnover, sometimes as low as 5%**, with the clinicians and techs who are in the program." },
      ]},
      { kind:"say", group:"Retention", title:"Nudges", proof:["Early affinity, testimonials, psychological nudges: \"Your employer had your back this month\""], beats:[
        { cue:"Gamification", text:"But we've also built in some **gamification, some psychological nudges**." },
        { cue:"Sign-ons fade", text:"See, when you give someone a sign-on, they probably spend it quicker than they planned. And then **it's gone from their mind**. Now they're looking for the next thing you're going to offer them. But **we remind them** of the incredible help you're giving them with their student loan debt." },
        { cue:"Testimonials", text:"When they first join you, we have them **record a video** that captures how excited they are to work at a place that has their back like this. Every year they're part of the program, we collect these testimonials from them." },
        { cue:"Monthly statement", text:"Then every month we send them **a statement**. A way to remind them, 'Hey, look what you would have owed if your employer hadn't helped you out with this payment. **What would have been 10 years of payments is becoming 3.** All because you work here.' Really bonds them to you." },
        { cue:"Financial wellness", text:"And we give them access to **financial wellness and budgeting tools** that reinforce that they have even more in their budget **because of you**!" },
      ]},
      { kind:"say", group:"Retention", title:"Beyond new hires", proof:["Pathways: MAs and LPNs → RNs · PTAs → PTs · ICU nurses → CRNAs"], beats:[
        { cue:"Existing staff", text:"This isn't just for new hires. This can be part of your **retention strategy**. Because so many clinicians and techs will have student loan debt for years. So they see you extend this to them, and it deepens the relationship. Reassures them that they've found **their long-term home**." },
        { cue:"Career pathing", text:"A Student Loan Repayment program is also used by our partners as part of **career pathing**. It motivates **Medical Assistants and LPNs into RNs, PTAs into PTs, ICU nurses into CRNAs** while they work for you." },
        { cue:"The message", text:"You're telling them, 'Go get the next level degree and come back here. Because we have a place for you, and **we're going to help you pay** for any loan you take out to upskill like this.' Now you're filling these roles with people you know already **fit your culture, fit your mission**. It builds a **stronger, more stable workforce**." },
      ]},
    ],
    tips:["If they said all three, run pipeline, then spend, then retention.","Acknowledge their answer before you continue after every question.","Only run the sign-on or contract labor track if they spend on it."],
    watch:["Reading the whole thing as a monologue — pause after each section for reactions","Running a cost track they told you doesn't apply"],
  },
  "summary-buyin": {
    rule:"Reframe the outcomes we drive and get them to buy into the value.",
    screen:"Video on, no content shared",
    script:[
      { kind:"say", beats:[
        { cue:"Thank them", text:"I appreciate you letting me share with you how we work with healthcare systems to benefit from an **innovative Student Loan Repayment and recruitment program**." },
        { cue:"Recap the value", text:"", list:[
          { tag:"Pipeline", text:"How our partners use this program to build a **bigger, stronger pipeline** of soon-to-graduate Nurses, Imaging Techs, Rehabilitation Therapists using our **recruitment marketing and campus recruitment** machine." },
          { tag:"Labor cost", text:"How they're **saving money** not having to pay out sign-ons again and again, and filling roles with **full-time employees** that would have been worked by contract labor." },
          { tag:"Retention", text:"And how they're **retaining their employees** and motivating them down career pathways, creating a **stronger, more stable workforce**. All through the power of their Student Loan Repayment program." },
        ]},
        { cue:"Step back", text:"At this point, it's important to take a step back and **understand where your head is at**." },
        { cue:"Buy-in check", check:"answer", text:"How is this all feeling? On a **scale of 1 to 10**, with 10 being a heck yes — **where would you say you're at?**" },
        { cue:"Read the reaction", text:"", list:[
          { tag:"Negative", text:"Do discovery on why: \"That's fair. **What's giving you pause?**\"" },
          { tag:"Positive, with questions", text:"**Answer their questions.** Then: \"What would need to be true for that to be a 10?\"" },
          { tag:"Positive, no questions", text:"**Move into discovery** — next stage, Business Problem." },
        ]},
      ]},
    ],
    tips:["Keep it to a minute. This is a reframe, not a second pitch.","Below a 10, get curious about the gap. Don't defend."],
    watch:["Skipping the 1–10 — it's your read on whether to keep going","Answering an objection before you understand it"],
  },
  "business-problem": {
    rule:"Identify the business problem behind what they asked for, find out who cares, then validate it's the one to anchor on.",
    script:[
      { kind:"say", beats:[
        { cue:"Reflect + permission", check:"answer", text:"It sounds like [what they said]. **Can we dig into that some more?**" },
      ]},
      { kind:"ask", label:"Origin", text:"What was going on in your business that made you **start exploring solutions** like ours in the first place?" },
      { kind:"ask", label:"The moment", text:"Can you walk me back to **the moment this became a priority**?\n\nWhat happened?" },
      { kind:"say", beats:[
        { cue:"Acknowledge", text:"I understand why you would want [surface need]." },
        { cue:"Dig", text:"**But what's actually going on?**" },
      ]},
      { kind:"ask", label:"Priority driver", text:"What's causing that to be **a priority**?" },
      { kind:"ask", label:"Energy", text:"What's driving you to **prioritize that**?" },
      { kind:"ask", label:"Business driver", text:"What is going on **in your business** that's driving you to put the focus and energy on that?" },
      { kind:"ask", group:"Retention", label:"Priority", text:"How often have you **spoken internally** about reducing that turnover number?\n\nWho **cares the most** about the turnover number?" },
      { kind:"ask", group:"Labor cost", label:"Sign-on priority", text:"How often have you **spoken internally** about reducing the amount you spend on sign-ons?\n\nWho **cares the most** about how much you spend on sign-ons?" },
      { kind:"ask", group:"Labor cost", label:"Contract priority", text:"How often have you **spoken internally** about reducing the amount of contract labor you use in these departments?\n\nWho **cares the most** about what you spend on contract labor?" },
      { kind:"say", beats:[{ cue:"Pause the flow", text:"Before we go too much further — I want to make sure we're **anchoring this conversation to the right thing**." }] },
      { kind:"ask", label:"Anchor check", text:"Is this **the challenge we should be focused on** solving together?\n\nOr are there other things that are going to overpower this?" },
      { kind:"ask", label:"Priority test", text:"Is this going to make its way onto your **priorities slide**?\n\nOr is this a **shiny object**?" },
    ],
    tips:["Keep peeling only while the answer is still a symptom. Stop when a CFO would fund it.","\"Who cares the most\" is your multithreading list.","Get explicit agreement that this is the problem worth solving now."],
    watch:["Stopping at the symptom and moving on","Happy ears — getting excited before validating it is a raging fire","Skipping the anchor check because it feels confrontational"],
  },
  "baseline-current": {
    rule:"Map where they are today. Capture their exact words, numbers and units.",
    script:[
      { kind:"say", beats:[{ cue:"Frame why you ask", text:"I'm asking because — if we end up doing business together, **your CFO is probably going to care** about this." }] },
      { kind:"ask", label:"Metric", text:"What **metric** do you think would improve the most if we solved this challenge?" },
      { kind:"ask", label:"Current state", text:"What's the **current state** of that metric?" },
      { kind:"ask", label:"Target", text:"Where **should it be**?\n\nAnd **why** should it be there?" },
      { kind:"ask", group:"Pipeline", label:"Roles", text:"What **clinical and allied health roles** do you hire new grads in the most?" },
      { kind:"ask", group:"Pipeline", label:"Department heads", text:"Which **department heads** do you work with the most to fill their new grad needs?" },
      { kind:"ask", group:"Pipeline", label:"School relationships", text:"What existing relationships do you have with the **local college programs** to funnel students in these fields your way?\n\nWho works on those relationships?" },
      { kind:"ask", group:"Pipeline", label:"Loan debt", text:"How often have you had these students **ask about help with their student loan debt**?" },
      { kind:"ask", group:"Retention", label:"Replacement hires", text:"How many **replacement hires** do you make in these departments?" },
      { kind:"ask", group:"Retention", label:"First-year turnover", text:"What is the **first-year turnover** there?" },
      { kind:"ask", group:"Labor cost", label:"Sign-ons", text:"What type of **sign-on bonuses** are you offering for these roles?" },
      { kind:"ask", group:"Labor cost", label:"Contract labor", text:"How much **contract labor** do you use to fill the gaps for these roles?" },
    ],
    tips:["Capture their exact words and units.","Do not invent a number if they do not know it yet."],
    watch:["Moving on without a number for turnover, sign-ons or contract labor","Paraphrasing their numbers instead of using their exact words"],
  },
  "cause-analysis": {
    rule:"Mutually identify the true root cause. Their perceived cause sets the buying criteria.",
    script:[
      { kind:"say", beats:[
        { cue:"Summarize", text:"Let me summarize what I've heard so far." },
        { cue:"Play it back", text:"[business problem and current state]" },
        { cue:"Confirm", check:true, text:"**Did I get that right?**" },
      ]},
      { kind:"ask", label:"Open diagnostic", text:"**Why** do you think this challenge is happening?" },
      { kind:"ask", label:"Blocker", text:"What's **preventing you** from improving it?" },
      { kind:"ask", group:"Pipeline", label:"School fit", text:"**How well** are those school relationships meeting your needs?" },
      { kind:"ask", group:"Labor cost", label:"Sign-on reliance", text:"How important do you find sign-ons to be in **getting a commitment**?" },
      { kind:"ask", label:"Suspected cause", text:"To what extent do you think [suspected root cause] is **contributing to the challenge**?" },
    ],
    tips:["Ask the open diagnostic first, then one or two targeted questions.","Their perceived cause sets the buying criteria."],
    watch:["Accepting the first answer as the root cause","Leading them to your conclusion instead of letting them arrive at it"],
  },
  "negative-impact": {
    rule:"Explore cost, consequences, and ripple effects. One or two negative ramifications is enough on a first call.",
    script:[
      { kind:"say", beats:[
        { cue:"Summarize", text:"All right. One more time, let me summarize what I've heard." },
        { cue:"Play it back", text:"[business problem + root causes]" },
        { cue:"Confirm", check:true, text:"**Did I get that right?**" },
      ]},
      { kind:"ask", label:"Ripple effects", text:"What **ripple effects** are you seeing this challenge have on the rest of the business?" },
      { kind:"ask", label:"Derailed", text:"What would **get derailed** if you didn't make progress in solving these challenges?" },
      { kind:"ask", label:"Who else", text:"**Who else** does this challenge impact within the business?\n\nAnd how?" },
      { kind:"ask", label:"Cost", text:"What's the **financial cost** of not closing that gap **per month**?" },
    ],
    tips:["After they confirm the summary, explore cost, consequences, and ripple effects.","One or two negative ramifications is enough on a first call."],
    watch:["More than 3 impact questions — diminishing returns fast","Asking about cost before they confirm the summary"],
  },
  "future-state": {
    rule:"Contrast painful present with compelling future. Ask the open question first.",
    script:[
      { kind:"say", beats:[
        { cue:"Summarize", text:"Let me summarize what I've heard about the challenges so far." },
        { cue:"Play it back", text:"[brief summary]" },
        { cue:"Confirm", check:true, text:"**Did I get that right?**" },
      ]},
      { kind:"ask", label:"Open", text:"What do **you** think you need to solve this challenge?" },
      { kind:"ask", label:"Ideas", text:"Can I try **a few additional ideas** on you?" },
      { kind:"ask", label:"Capability test", text:"Imagine being able to [capability].\n\nTo what degree would that **move the needle** on the problem we're talking about?" },
    ],
    tips:["Ask the open question first.","Only then test targeted capabilities tied to the root causes they named."],
    watch:["Pitching capabilities before asking what they think they need","Skipping the summary — the contrast is where the feeling of value lives"],
  },
  "close-next-steps": {
    rule:"Call back the ROE. Leave with a concrete decision — a next step is not real until it has an owner and a date.",
    script:[
      { kind:"say", beats:[
        { cue:"Call back the agenda", text:"At the beginning of this call, we agreed we'd decide whether it makes sense to schedule a **next logical step** — or go our separate ways so we don't waste each other's time." },
        { cue:"Give your read", text:"The sense I'm getting is [your honest read]." },
      ]},
      { kind:"ask", label:"Fairness check", text:"Does that **feel fair** to you?" },
      { kind:"ask", label:"Next step", text:"What should the **next logical step** look like?\n\nAnd **who needs to be there**?" },
      { kind:"ask", label:"Date", text:"Can we put **a specific date** on the calendar now?" },
    ],
    tips:["Leave with a concrete decision.","A next step is not real until it has an owner and a date."],
    watch:["Leaving without a booked meeting — 'I'll send some times' is not a next step","Skipping the ROE callback — the ask lands cold without it"],
  },
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
    else out.push({ kind:"ask", item:i, q:++q });
  });
  return out;
}

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




const SESSION_KEY = "discovery-session-v1";
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "{}") || {}; } catch { return {}; }
}
const EMPTY_BRIEF = { prospect:"", company:"", signals:"", role:"", systemSize:"", roles:"", turnover:"", signOns:"", contract:"", benefits:"", schools:"", decision:"", pain:"" };

export default function App() {
  const saved = useRef(loadSession()).current;
  const [activeStage, setActiveStage] = useState(saved.activeStage || "prep");
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
    const current = v(c.metric) && (v(c.current) || v(c.target))
      ? `${v(c.metric)} is at ${v(c.current) || "?"}${v(c.target) ? `, and you want it at ${v(c.target)}` : ""}` : "";
    const cause = v(c.rootCause) && `and it sounds like the root cause is ${v(c.rootCause)}`;
    switch (name.toLowerCase()) {
      case "names": case "name": return v(b.prospect);
      case "their company": return v(b.company);
      case "the area they chose": return { "Pipeline":"build a bigger pipeline of soon-to-graduate talent", "Labor cost":"spend less on sign-ons and contract labor", "Retention":"retain and grow their people", "All three":"build a bigger pipeline of soon-to-graduate talent" }[c.startArea] || "";
      case "what you spotted": return v(b.signals);

      case "surface need": return v(c.surfaceNeed);
      case "what they said": return v(c.startWhy) || v(c.surfaceNeed);
      case "suspected root cause": return v(c.suspected);
      case "capability": return v(c.capability);
      case "your honest read": return v(c.read);
      case "metric they named": return v(c.metric);
      case "business problem and current state": return join([c.businessDriver, current]);
      case "business problem + root causes": return join([c.businessDriver, cause]);
      case "brief summary": return join([c.businessDriver, current, cause, v(c.ripple) && `it's causing ${v(c.ripple)}`, v(c.cost) && `and it's costing about ${v(c.cost)} a month`]);
      default: return "";
    }
  }

  // Teleprompter cursor: one highlighted line per stage. Index == length means the stage is done.
  const [showAllAreas, setShowAllAreas] = useState(false);
  const script = visibleScript(activeStage, captures.startArea, showAllAreas);
  const flat = flattenScript(script);
  const focusIdx = Math.min(focus[activeStage] ?? 0, flat.length);
  const setFocusIdx = i => setFocus(f => ({ ...f, [activeStage]: Math.max(0, Math.min(i, flat.length)) }));
  useEffect(() => {
    if (!flat.length) return;
    const el = document.querySelector(`[data-line="${activeStage}-${focusIdx}"]`);
    if (el) el.scrollIntoView({ block:"center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [focusIdx, activeStage]);

  useEffect(() => { setTipsOpen(false); setWatchOpen(false); }, [activeStage]);

  useEffect(() => {
    function handleKey(e) {
      const tag = e.target.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight' && currentIdx < STAGES.length - 1) setActiveStage(STAGES[currentIdx + 1].id);
      if (e.key === 'ArrowLeft' && currentIdx > 0) setActiveStage(STAGES[currentIdx - 1].id);
      if (!flat.length) return;
      if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        if (focusIdx >= flat.length && currentIdx < STAGES.length - 1) setActiveStage(STAGES[currentIdx + 1].id);
        else setFocusIdx(focusIdx + 1);
      }
      if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); setFocusIdx(focusIdx - 1); }
      // 1-9 jumps to that question
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) {
        const i = flat.findIndex(x => x.q === n);
        if (i >= 0) setFocusIdx(i);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

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
    const hasGroups = script.some(it => it.group);
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
        {hasGroups && (
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:14 }}>
            <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:C.textMuted }}>Area</span>
            {["Pipeline","Labor cost","Retention","All three"].map(a => {
              const on = captures.startArea === a;
              return <button key={a} onClick={() => { setCapture("startArea", on ? "" : a); setShowAllAreas(false); }} style={{ ...B, fontSize:12, fontWeight:600, padding:"5px 12px", borderRadius:99, border:`1px solid ${on ? C.emerald : C.border}`, background:on ? C.emerald : C.white, color:on ? "#fff" : C.textSecondary }}>{a}</button>;
            })}
            {captures.startArea && captures.startArea !== "All three" && <button onClick={() => setShowAllAreas(v => !v)} style={{ ...B, fontSize:12, color:C.textMuted, background:"none", border:"none", textDecoration:"underline" }}>{showAllAreas ? "Only their pick" : "Show all areas"}</button>}
          </div>
        )}
        {script.map((item, i) => {
          if (item.kind === "say") return (
            <div key={i}>
            {groupHeader(item)}
            <div style={{ background:C.yellow, border:`1px solid ${C.yellowBorder}`, borderRadius:14, overflow:"hidden", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px 8px", flexWrap:"wrap" }}>
                <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.14em", color:C.yellowText }}>SAY</span>
                {item.title && <span style={{ fontSize:13, fontWeight:700, color:C.yellowText }}>{item.title}</span>}
                {!item.title && item.beats.length > 1 && <span style={{ fontSize:11, color:C.yellowText, opacity:0.7, fontWeight:600 }}>{item.beats.length} beats</span>}
                <div style={{ flex:1 }} />
              </div>
              {item.proof && (
                <div style={{ margin:"0 18px 10px", padding:"8px 12px", borderRadius:8, background:"rgba(255,255,255,0.65)", display:"flex", flexDirection:"column", gap:4 }}>
                  {item.proof.map((pf, k) => (
                    <div key={k} style={{ display:"flex", gap:8, fontSize:13, lineHeight:1.45, color:C.textSecondary }}>
                      {k === 0 ? <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.1em", color:C.emerald, flexShrink:0, paddingTop:2, width:42 }}>PROOF</span> : <span style={{ width:42, flexShrink:0 }} />}
                      <span>{pf}</span>
                    </div>
                  ))}
                </div>
              )}
              {item.beats.map((beat, b) => {
                line++;
                const idx = line, st = lineState(idx);
                return (
                  <div key={b} data-line={`${stageId}-${idx}`} onClick={() => setFocusIdx(idx)}
                    style={{ cursor:"pointer", display:"grid", gridTemplateColumns:"124px minmax(0,1fr)", gap:18, padding:"14px 20px 14px 18px", borderTop:`1px solid ${C.yellowRule}`,
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
                {done ? "Stage done · Space to continue" : "Up next"} · {next.short}
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
  const stageTitle = {"prep":"Pre-Call Prep Brief","rapport-opener":"Opening + Intros","rules-engagement":"Objective → Agenda → Decision","context":"Earn the Right: Clasp Context","value-drop":"Value Drop: Talk Tracks","summary-buyin":"Summary + Buy-in","business-problem":"Identify + Validate the Business Problem","baseline-current":"Current State","cause-analysis":"Cause Analysis","negative-impact":"Build Negative Impact","future-state":"Future State","close-next-steps":"Close + Next Steps","outputs":"Outputs"}[activeStage];
  const stageSub = {"prep":"Paste your prep brief. Everything downstream personalizes from this.","outputs":"Generate your end-of-call outputs."}[activeStage];
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
          {["setup","value","discovery","close"].map(group => {
            const groupStages = STAGES.filter(s => s.group === group);
            const groupLabel = { setup:"Setup", value:"Value", discovery:"Discovery", close:"Close" }[group];
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
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:C.textMuted, marginBottom:3 }}>
              {isNumbered && <span>Step {STAGES[currentIdx].icon} of {STAGES.filter(st => /^\d+$/.test(st.icon)).length}</span>}
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
              <span style={{ opacity:0.75, fontWeight:600 }}>Next</span><span className="hide-narrow">{nextStage.short}</span><span style={{ fontSize:16 }}>→</span>
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
                      <textarea value={prepBrief} onChange={e=>setPrepBrief(e.target.value)} placeholder={"CALL BRIEF: [Organization] — [Date]\n\nContacts: [Names], [Titles] | Tenure\nCall source: Inbound / Outbound\n\nSystem: hospitals, clinics, size, new sites coming online\nHard-to-fill roles: ...\nSign-ons on careers page: ...\nTurnover / contract labor signals: ...\nTuition or loan benefits today: ...\nSchool partnerships: ...\nOpen questions: ..."} style={{ width:"100%", minHeight:180, fontSize:14, lineHeight:1.8, padding:"14px 16px", border:`1.5px solid ${C.emeraldMid}`, borderRadius:10, background:"#f7f8fa", color:C.textPrimary, resize:"vertical", boxSizing:"border-box", fontFamily:"'Inter', system-ui, sans-serif", outline:"none" }} />
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
                      { key:"prospect",    label:"Prospect name(s)",     placeholder:"Fills [Names], e.g. Jane, Sam" },
                      { key:"company",     label:"Their organization",   placeholder:"Fills [their company]" },
                      { key:"signals",     label:"What you spotted",     placeholder:"Fills [what you spotted], e.g. a new site opening, sign-ons on their careers page" },
                      { key:"role",        label:"Their roles",          placeholder:"e.g. VP Talent Acquisition, Dir. of Nursing" },
                      { key:"systemSize",  label:"System size",          placeholder:"e.g. 6 hospitals, 12k employees" },
                      { key:"roles",       label:"Hard-to-fill roles",   placeholder:"e.g. new-grad RNs, imaging techs, PT/OT" },
                      { key:"turnover",    label:"First-year turnover",  placeholder:"e.g. ~25% for new-grad RNs" },
                      { key:"signOns",     label:"Sign-on bonuses",      placeholder:"e.g. $15k RN sign-on on careers page" },
                      { key:"contract",    label:"Contract labor",       placeholder:"e.g. heavy traveler use in ICU nights" },
                      { key:"benefits",    label:"Tuition / loan benefits today", placeholder:"e.g. tuition reimbursement, no loan repayment" },
                      { key:"schools",     label:"School partnerships",  placeholder:"e.g. clinical rotations with local BSN program" },
                      { key:"decision",    label:"Decision process",     placeholder:"e.g. CHRO and CFO sign off" },
                      { key:"pain",        label:"Known pain",           placeholder:"e.g. losing new-grad nurses in year one" },
                    ].map(f => (
                      <div key={f.key} style={f.key === "pain" || f.key === "signals" ? { gridColumn:"1 / -1" } : {}}>
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
                      ✓ Intel saved — names, organization and what you spotted fill the script
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



            {/* LIVE SCRIPT */}
            {sd && (
              <div>
                <div style={{ display:"flex", gap:10, alignItems:"baseline", marginBottom:16, padding:"0 2px" }}>
                  <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color:C.emerald, flexShrink:0 }}>Goal</span>
                  <span style={{ fontSize:15, fontWeight:500, color:C.textSecondary, lineHeight:1.5 }}>{sd.rule}</span>
                </div>
                {sd.screen && (
                  <div style={{ display:"flex", gap:10, alignItems:"baseline", margin:"-8px 0 16px", padding:"0 2px" }}>
                    <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color:C.textMuted, flexShrink:0 }}>Screen</span>
                    <span style={{ fontSize:14, color:C.textMuted }}>{sd.screen}</span>
                  </div>
                )}
                {renderStageScript(activeStage, activeStage !== "business-problem")}
              </div>
            )}
            {activeStage === "business-problem" && <>
              <Collapsible label="Buyer path playbook — inbound / outbound, evaluating / active / latent" isOpen={moreOpen} onToggle={()=>setMoreOpen(v=>!v)} accent={C.textSecondary}>
                {renderBuyerType()}
              </Collapsible>
              {renderHandoff(activeStage)}
            </>}


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

          {/* KEYBOARD HINTS */}
          {flat.length > 0 && (
            <div style={{ background:C.white, borderTop:`1px solid ${C.border}`, padding:"8px 32px", flexShrink:0, display:"flex", justifyContent:"center", gap:18, flexWrap:"wrap", fontSize:12, color:C.textMuted }}>
              {[["Space","next line"],["↑","back"],["1–9","jump to question"],["← →","stage"]].map(([k,l]) => (
                <span key={k} style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                  <kbd style={{ fontFamily:"inherit", fontSize:11, fontWeight:700, color:C.textSecondary, background:C.sand, border:`1px solid ${C.border}`, borderBottomWidth:2, borderRadius:5, padding:"1px 7px" }}>{k}</kbd>{l}
                </span>
              ))}
            </div>
          )}
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
                { id:"spiced",     label:"Bank" },
                { id:"roi",        label:"ROI" },
                { id:"enterprise", label:"Qualify" },
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
