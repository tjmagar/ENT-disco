// The call track: every stage, what you say, what you capture.
// Edit wording here; the app renders whatever is in this file.
//
// Markup inside script text:
//   **bold**        the words to land
//   [placeholder]   filled from the prep page or the capture pane (see resolveToken in App.jsx)
//   "\n\n"          in a question, splits the main ask from its follow-ups

export const STAGES = [
  { id:"prep",               icon:"◎",  short:"Prep Brief",               group:"setup" },
  { id:"rapport-opener",     icon:"1",  short:"Opening + Intros",         group:"setup" },
  { id:"rules-engagement",   icon:"2",  short:"Objective + Agenda",       group:"setup" },
  { id:"context",            icon:"3",  short:"Clasp Context",            group:"setup" },
  { id:"orient",             icon:"4",  short:"Orient to Buyer Focus",    group:"orient" },
  { id:"value-drop",         icon:"5",  short:"Value Drop",               group:"value" },
  { id:"summary-buyin",      icon:"6",  short:"Summary + Buy-in",         group:"value" },
  { id:"business-problem",   icon:"7",  short:"Business Problem",         group:"discovery" },
  { id:"baseline-current",   icon:"8",  short:"Current State",            group:"discovery" },
  { id:"cause-analysis",     icon:"9",  short:"Cause Analysis",           group:"discovery" },
  { id:"negative-impact",    icon:"10", short:"Negative Impact",          group:"discovery" },
  { id:"future-state",       icon:"11", short:"Future State",             group:"discovery" },
  { id:"close-next-steps",   icon:"12", short:"Close + Next Steps",       group:"close" },
];

// Timeboxes add up to a 30-minute call.
export const STAGE_META = {
  "rapport-opener":   { phase:"OPEN",             timebox:"2 min" },
  "rules-engagement": { phase:"ALIGN",            timebox:"1 min" },
  "context":          { phase:"CONTEXT",          timebox:"1 min" },
  "orient":           { phase:"ORIENT",           timebox:"2 min" },
  "value-drop":       { phase:"VALUE",            timebox:"8 min" },
  "summary-buyin":    { phase:"BUY-IN",           timebox:"1 min" },
  "business-problem": { phase:"BUSINESS PROBLEM", timebox:"3 min" },
  "baseline-current": { phase:"CURRENT STATE",    timebox:"3 min" },
  "cause-analysis":   { phase:"CAUSE ANALYSIS",   timebox:"2 min" },
  "negative-impact":  { phase:"NEGATIVE IMPACT",  timebox:"2 min" },
  "future-state":     { phase:"FUTURE STATE",     timebox:"2 min" },
  "close-next-steps": { phase:"CLOSE",            timebox:"3 min" },
};

// What to jot down at each stage — kept to what you can type live.
// Several of these fill [placeholders] in later scripts.
export const CAPTURE = {
  "rapport-opener":   [{ key:"win", label:"What would make today a win", hint:"Each person's answer" }],
  "orient":           [{ key:"startArea", label:"Where they want to start", type:"choice", options:["Pipeline","Labor cost","Retention","All three"] },
                       { key:"startWhy", label:"What they said", hint:"Their words. Fills \"You mentioned…\" and \"It sounds like…\"" }],
  "value-drop":       [{ key:"reactions", label:"What landed", hint:"Reactions, questions, objections" }],
  "summary-buyin":    [{ key:"buyIn", label:"Buy-in score (1–10)", hint:"And what would make it a 10" }],
  "business-problem": [{ key:"surfaceNeed", label:"Surface need", hint:"What they say they want" },
                       { key:"businessDriver", label:"Need behind the need", hint:"The business problem. Would a CFO fund it?" },
                       { key:"whoCares", label:"Who cares most", hint:"Names and titles" }],
  "baseline-current": [{ key:"metric", label:"Metric", hint:"e.g. first-year turnover" },
                       { key:"current", label:"Today", hint:"Their number and unit" },
                       { key:"target", label:"Target", hint:"Where it should be, and why" }],
  "cause-analysis":   [{ key:"rootCause", label:"Root cause", hint:"Their words" },
                       { key:"suspected", label:"Your suspected cause", hint:"Fills the last question" }],
  "negative-impact":  [{ key:"ripple", label:"Ripple effects" },
                       { key:"cost", label:"Cost", hint:"Their rough estimate" }],
  "future-state":     [{ key:"theirSolution", label:"What they think they need" },
                       { key:"capability", label:"Capability to test", hint:"Fills the last question" }],
  "close-next-steps": [{ key:"nextStep", label:"Recommended next step", hint:"Fills your recommendation" },
                       { key:"who", label:"Who should join", hint:"Fills \"It'd be helpful to include…\"" },
                       { key:"date", label:"Date" }],
};

// Script items per stage.
//   say:  spoken beats. cue = what the beat does. check = pause for their answer.
//         then = what you say once they answer. list = numbered points (optional tag).
//         title / group / proof on the item itself.
//   ask:  a question card. group = only shown for that area.
export const STAGE_DATA = {
  "rapport-opener": {
    script:[
      { kind:"say", beats:[
        { cue:"Greet, then pause", check:"answer", text:"Hi [Names], I'm **glad we found the time** today." },
        { cue:"If they're chatty", text:"How's your **week** been?" },
        { cue:"Ask permission", text:"Great, well mind if we talk about the **agenda**?\n\nPerfect. Quick intros before we dive in." },
        { cue:"Your intro", text:"My name is **TJ Magar**, I'm a Director of Healthcare Partnerships here at Clasp." },
        { cue:"Why you care", text:"I'm super passionate about this work because **I'm an agitated borrower myself** — I know how it feels to have that barrier to education. And I love that we're **breaking it down** for the most important workforce there is: **healthcare**." },
        { cue:"Hand off", check:"answer", text:"I've brought my colleague **Altara** as well — and then I'd love to hear from you both, maybe just **what would make today a win**. Altara, mind sharing a quick intro first?" },
      ]},
    ],
  },

  "rules-engagement": {
    script:[
      { kind:"say", beats:[
        { cue:"Propose", text:"Perfect, that leads into what I had in mind for today. Here's what I'm thinking in terms of **how we spend our time** — let me know if you had something else in mind…" },
        { cue:"Objective", check:true, text:"The outcome I'd suggest is to **learn enough about each other** to decide whether a **second meeting** makes sense. Obviously I don't expect us to do business today. **Fair?**", then:"Great." },
        { cue:"Agenda", text:"Here's the agenda I'm thinking will get us there:", list:[
          "I'll share **a little about Clasp** so you have context.",
          "Then I'd love to spend **most of our time** on what's important to [their company] — your goals around **recruiting, developing and retaining** clinical talent.",
          "If it looks like we can help, I'll **explain how it works**.",
          "And I'll save a few minutes at the end so we can **jointly decide** on a next step.",
        ]},
        { cue:"Check", check:true, text:"Does that agenda **feel fair**?", then:"Great — let's take a crack at it." },
      ]},
    ],
  },

  "context": {
    script:[
      { kind:"say", title:"Who we are", beats:[
        { cue:"Set up", text:"So like I said, to give you some context, I've got **a few short slides**. Feel free to **interrupt me** anytime." },
        { cue:"Who we are", text:"At Clasp, we work **exclusively in healthcare**. Within that, we help HR and talent acquisition teams **attract and retain hard-to-fill clinical talent**." },
        { cue:"Who we work with", text:"Partners range from major systems like **Novant Health, Northwestern Medicine and Boston Children's**, to smaller systems like **Saint Alphonsus**, to outpatient groups like **Confluent Health**." },
      ]},
    ],
  },

  "orient": {
    script:[
      { kind:"say", title:"Three outcomes", beats:[
        { cue:"Who we talk to", text:"We talk to a lot of HR leaders — talent acquisition, L&D, workforce development, ops. And the **three areas where we tend to drive the most value** are here on your screen:", list:[
          { tag:"Pipeline", text:"Some partners use this to build a **bigger, stronger pipeline** of soon-to-graduate RNs, imaging techs, rehab therapists and other clinical roles — **before they hit the open market**." },
          { tag:"Labor cost", text:"Others are **bleeding money** on sign-on bonuses, contract labor and recruitment costs just to keep roles filled." },
          { tag:"Retention", text:"And some are **losing good people** to competitors — so they use it to offer **career pathways**, like MAs into RNs or PTAs into PTs, instead of watching them walk out the door." },
        ]},
        { cue:"Hand it to them", check:"answer", text:"I have a hunch where you might fit, given [what you spotted] and the industry norm on **first-year nurse retention**. But given your situation, **where would be the most relevant place for us to start?**" },
      ]},
    ],
  },

  "value-drop": {
    script:[
      { kind:"say", beats:[
        { cue:"Start", text:"Okay — let's start with how we help partners [the area they chose]. **Stop me anytime** if something doesn't apply to you." },
      ]},

      // ── Pipeline ───────────────────────────────────────────
      { kind:"say", group:"Pipeline", title:"The outcome", proof:["Channels: schools, social + influencers, associations + conferences, campus ambassadors, virtual career fairs"], beats:[
        { cue:"The outcome", text:"The biggest outcome we drive is a **bigger pipeline of soon-to-graduate talent**. We do it three ways:", list:[
          { tag:"Educate", text:"**Educate students** on what a program like this makes possible." },
          { tag:"Awareness", text:"Make it **a reason to join your system** after graduation." },
          { tag:"Convert", text:"**Turn them into applicants** — so they raise their hand and say, \"When I graduate, I want to work for you.\"" },
        ]},
        { cue:"Check in", check:"answer", text:"Before I go further — **how are you building that early pipeline today?**" },
      ]},
      { kind:"say", group:"Pipeline", title:"Get the word out", proof:["Curated influencer network reaches 4.6M+ engaged followers"], beats:[
        { cue:"Influencers", text:"First, we get the word out. We work with a curated network of **TikTok creators who are clinicians and techs**. I know that can sound a little funny — but for this generation, **it works**." },
        { cue:"Ask to show", check:"answer", text:"**Mind if I show you something quick?**" },
        { cue:"Show the search", text:"This is a simple search for nursing, PT and rad tech student loan debt. **Video after video** of students asking each other how they'll pay it off. **It's on their minds.**" },
        { cue:"Show a video", text:"So our creative team builds content like this with those creators — and compliance keeps it **buttoned up, not boring**. You can see the **engagement**." },
        { cue:"Check in", check:"answer", text:"**Is that the kind of reach you're getting with students today, or pretty different?**" },
      ]},
      { kind:"say", group:"Pipeline", title:"Schools + campus", proof:["Active school partnerships: 70+ nursing, 90+ imaging, 70+ rehab therapy, 110+ RT","Virtual career fair: 187 PT, OT and SLP students from 88 schools"], beats:[
        { cue:"Schools", text:"Then we go to campus. We have **partnerships with hundreds of programs**. When we tell program directors that systems like yours will help their students repay loans, it lands in a way **a sign-on bonus doesn't** — so they share it with their students." },
        { cue:"Ambassadors", text:"We also have **campus ambassadors** — students and recent grads talking up your program **peer to peer**." },
        { cue:"Wider reach", text:"And because it's national, it can **widen your pool** beyond the schools you already know." },
        { cue:"Check in", check:"answer", text:"**Are there programs you'd love to recruit from but don't have a real way in?**" },
      ]},
      { kind:"say", group:"Pipeline", title:"Convert", proof:["One system hit >200% of its rad tech applicant goal, with applicants from 6 states","Northwestern Medicine: \"we did not ever have 32 RT applicants at a time prior to Clasp\""], beats:[
        { cue:"Support TA", text:"None of this replaces your TA team — it **supports** them. We build landing pages in **your brand and your message**, so recruiters can convert candidates they're already talking to **before the competition does**." },
        { cue:"Check in", check:"answer", text:"**How do you think that would land with your recruiters?**" },
      ]},

      // ── Labor cost ─────────────────────────────────────────
      { kind:"say", group:"Labor cost", title:"Open", beats:[
        { cue:"Open", check:"answer", text:"A loan repayment program can also help you **spend less on sign-ons and contract labor**. Do you spend much on either for **nursing, imaging or rehab** today?" },
      ]},
      { kind:"say", group:"Labor cost", title:"If they spend on sign-ons", proof:["Every $10k in sign-ons creates about $2,800 of value: −72% ROI (Laudio)"], beats:[
        { cue:"The arms race", check:"answer", text:"What partners tell us is that sign-ons feel like **an arms race** — everyone offers one, and they keep going up every year. **What have you seen?**" },
        { cue:"The story", text:"A TA leader told me healthcare is **the only place** you can take a sign-on, quit six months later, walk across the street — and **get another one the next day**." },
        { cue:"Why they fail", text:"A sign-on appeals to a **'right now' mentality** — it gets spent. And when 10, 15, 20% of new hires leave in year one, you **pay it again** to backfill, and chase clawbacks." },
        { cue:"The contrast", text:"Loan repayment attracts people **thinking about the future**. And it's **paid monthly while they're employed** — no clawbacks, nothing paid upfront for someone who leaves. You only spend to **get and keep them**." },
        { cue:"Check in", check:"answer", text:"**How does that compare to how you're thinking about sign-ons today?**" },
      ]},
      { kind:"say", group:"Labor cost", title:"If they spend on contract labor", proof:["Travelers cost ~2.2x. Weekly: RN $2,190 · Rad Tech $2,291 · PT $2,231 · RT $2,015"], beats:[
        { cue:"Ask", check:"answer", text:"**Where are you leaning on contract labor the most** — locations, specialties, shifts?" },
        { cue:"Reframe", text:"Those are tough to fill. What partners find is that loan repayment gets the attention of candidates **willing to take the location, specialty or shift you need** — so you need **fewer travelers**, and that can be **thousands a week**." },
        { cue:"Check in", check:"answer", text:"**Is that a gap you're feeling right now, or is contract labor pretty well under control?**" },
      ]},

      // ── Retention ──────────────────────────────────────────
      { kind:"say", group:"Retention", title:"Built to keep them", proof:["Partners' year-1 turnover is ~5% vs an industry average above 20%"], beats:[
        { cue:"Bridge", text:"For a lot of partners, the area that ends up mattering most is **keeping and growing the people you already have**." },
        { cue:"How it works", text:"Payments are **spread over three to five years** and paid while they're employed — it works a lot like a **401K match**. Our partners see **year-one turnover around 5%** for people in the program." },
        { cue:"Check in", check:"answer", text:"**How does that compare to your first-year turnover?**" },
      ]},
      { kind:"say", group:"Retention", title:"Keep it top of mind", beats:[
        { cue:"Nudges", text:"Sign-ons get spent and forgotten. So we keep your support **top of mind** — we capture **testimonials**, and every month we send a **statement**: 'Here's what you would have owed. **Ten years of payments is becoming three** — because you work here.'" },
        { cue:"Check in", check:"answer", text:"**How do you keep that value top of mind once someone's hired today — or is that tough?**" },
      ]},
      { kind:"say", group:"Retention", title:"Career pathways", proof:["Pathways: MAs and LPNs → RNs · PTAs → PTs · ICU nurses → CRNAs"], beats:[
        { cue:"Pathways", text:"It's not just for new hires. Partners use it for **career pathways** — telling their people, '**Go get the next degree and come back.** We have a place for you, and we'll help you pay for it.'" },
        { cue:"Check in", check:"answer", text:"**Are career pathways something you're investing in right now, or not so much?**" },
      ]},
    ],
  },

  "summary-buyin": {
    script:[
      { kind:"say", beats:[
        { cue:"Wrap", text:"So that's a quick look at how we work with systems like yours — **pipeline, spend, and retention**, all through a student loan repayment program." },
        { cue:"Tie it to them", check:"answer", text:"You mentioned [what they said]. My read is **[the area they chose]** is where this could matter most for you — **but correct me if I'm off.**" },
        { cue:"Buy-in check", check:"answer", text:"I'd love your **honest read, not the polite one**. On a scale of 1 to 10, with 10 being a heck yes — **where are you at?**" },
        { cue:"Read the number", text:"", list:[
          { tag:"Hesitant", text:"\"That's fair — I appreciate the honesty. **What's giving you pause?**\"" },
          { tag:"Positive, with questions", text:"Answer them. Then: \"**What would need to be true for that to be a 10?**\"" },
          { tag:"Positive, no questions", text:"\"**Mind if I ask a few questions about how things work today?** I don't want to assume anything.\"" },
        ]},
      ]},
    ],
  },

  "business-problem": {
    script:[
      { kind:"say", beats:[
        { cue:"Reflect", check:"answer", text:"It sounds like [what they said]. **Can we dig into that some more?**" },
      ]},
      { kind:"ask", label:"Go back in time", text:"Can you walk me back to **the moment this became a priority**?\n\nWhat happened?" },
      { kind:"say", beats:[
        { cue:"Acknowledge, then dig", text:"I understand why you'd want [surface need]. **But what's actually going on?**" },
      ]},
      { kind:"ask", label:"Need behind the need", text:"What's going on **in your business** that's driving this to be a priority?\n\nAside from that — is there **something going on behind the scenes**?" },
      { kind:"ask", group:"Retention", label:"Who cares", text:"How often have you **spoken internally** about reducing first-year turnover?\n\nWho **cares the most** about that number?" },
      { kind:"ask", group:"Labor cost", label:"Who cares", text:"How often have you **spoken internally** about cutting sign-on or contract labor spend?\n\nWho **cares the most** about it?" },
      { kind:"ask", label:"Validate", text:"Before we go further — **is this the challenge we should zero in on**, or are there others that matter even more right now?" },
    ],
  },

  "baseline-current": {
    script:[
      { kind:"ask", group:"Pipeline", label:"Roles", text:"What **clinical and allied health roles** do you hire new grads into the most?\n\nWhich **department heads** do you work with most on those?" },
      { kind:"ask", group:"Pipeline", label:"Schools", text:"What relationships do you have with **local programs** to funnel students your way?\n\nWho works on those?" },
      { kind:"ask", group:"Pipeline", label:"Loan debt", text:"How often do these students **ask about help with their student loans**?" },
      { kind:"ask", group:"Retention", label:"Turnover", text:"How many **replacement hires** do you make in these departments?\n\nWhat's the **first-year turnover** there?" },
      { kind:"ask", group:"Labor cost", label:"Spend", text:"What **sign-on bonuses** are you offering for these roles?\n\nAnd how much **contract labor** fills the gaps?" },
      { kind:"say", beats:[
        { cue:"Give a reason", text:"I'm asking this next one because — if we end up working together, **your CFO is probably going to care**." },
      ]},
      { kind:"ask", label:"Metric", text:"What **metric** is suffering most because of this?" },
      { kind:"ask", label:"Today vs target", text:"Where's that number **today**?\n\nAnd where should it be — and **why** there?" },
    ],
  },

  "cause-analysis": {
    script:[
      { kind:"say", beats:[
        { cue:"Summarize", check:true, text:"Let me summarize what I've heard so far — [business problem and current state]. **Did I get that right?**" },
      ]},
      { kind:"ask", label:"Their opinion", text:"What's your **opinion on why** this is happening?" },
      { kind:"ask", label:"Blocker", text:"What's **getting in the way** of improving it?" },
      { kind:"ask", group:"Pipeline", label:"School fit", text:"**How well** are those school relationships meeting your needs?" },
      { kind:"ask", group:"Labor cost", label:"Sign-on reliance", text:"How important are sign-ons in **getting a commitment** today?" },
      { kind:"ask", label:"Test your hunch", text:"To what extent do you think [suspected root cause] is **contributing to this**?" },
    ],
  },

  "negative-impact": {
    script:[
      { kind:"say", beats:[
        { cue:"Summarize", check:true, text:"One more time — [business problem + root causes]. **Did I get that right?**" },
      ]},
      { kind:"ask", label:"Ripple effects", text:"What are the **ripple effects** this is having across the business?" },
      { kind:"ask", label:"Who else", text:"**Who else** is feeling it — and how?" },
      { kind:"say", beats:[
        { cue:"Give a reason", text:"Somewhat obvious question — the reason I ask is, if we get far enough down the road, **your CFO is going to want this answer**." },
      ]},
      { kind:"ask", label:"Cost", text:"What's your **rough estimate of what this is costing** the business?" },
    ],
  },

  "future-state": {
    script:[
      { kind:"say", beats:[
        { cue:"Summarize", check:true, text:"Let me make sure I've got the full picture — [brief summary]. **Did I get that right?**" },
      ]},
      { kind:"ask", label:"Their view", text:"What do **you** think you need in a solution to solve this?" },
      { kind:"ask", label:"Test a capability", text:"Can I try an idea on you? Imagine being able to [capability].\n\nTo what degree would that **move the needle** on what we've talked about?" },
    ],
  },

  "close-next-steps": {
    script:[
      { kind:"say", beats:[
        { cue:"Transition", check:true, text:"Looks like we're coming up on time. **Should we talk about next steps?**" },
        { cue:"Call back the agenda", text:"At the start we said we'd decide whether a next step **even makes sense**." },
        { cue:"Recommend", text:"You know [their company] better than me, so if you have a different idea, let me know. But based on what you told me today, **what I recommend we do next is** [recommended next step]." },
        { cue:"Who", text:"It'd be helpful to include **[who should join]** to get their perspective." },
        { cue:"Check", check:true, text:"**Does that feel fair?**" },
      ]},
      { kind:"ask", label:"Lock it in", text:"Great — can we **get it on the calendar** now?" },
    ],
  },
};

// Backup questions for the Bank tab — Orlob-style, adapted for Clasp.
export const QUESTION_BANK = [
  { key:"pain", label:"Business pain", questions:[
    "What challenges would sting the most if they're still unsolved six months from now?",
    "Where does this sit on your priority list — top 3? Top 10?",
    "When you say [their word], what exactly do you mean? Can you give me an example?",
    "How long has this been happening? Constant, or more occasional?",
    "What have you already tried? What worked, what didn't?",
  ]},
  { key:"impact", label:"Negative impact", questions:[
    "Walk me through the ripple effects this is having across the business.",
    "Who else is feeling the impact — teams, roles, people — and how?",
    "What's your rough estimate of what this has cost so far?",
    "Why solve this now, versus pushing it down the road?",
    "And what does that ultimately lead to?",
  ]},
  { key:"vision", label:"Future state", questions:[
    "What do you think it will take to solve this?",
    "How important is solving this compared to everything else on your plate?",
    "What outcome would matter most — and what would that be worth?",
    "Can I ask a blunt one — why does this matter to you personally?",
  ]},
  { key:"checkins", label:"Check-ins while presenting", questions:[
    "How does this compare to how you're doing it today?",
    "How useful do you see this being in your situation?",
    "To what extent does this solve what you mentioned earlier?",
    "That seemed to land — what in your world makes it hit home?",
    "This doesn't seem to be resonating — where am I missing the mark?",
  ]},
  { key:"process", label:"Decision + next steps", questions:[
    "Can you walk me through the steps your team takes to reach a confident yes or no?",
    "Who else is part of those steps, and what matters most to each of them?",
    "How would something like this typically get funded?",
    "What could stall or derail this?",
  ]},
];
