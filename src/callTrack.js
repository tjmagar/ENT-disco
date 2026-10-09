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
  "rules-engagement": { phase:"ALIGN",            timebox:"2 min" },
  "context":          { phase:"CONTEXT",          timebox:"1 min" },
  "orient":           { phase:"ORIENT",           timebox:"2 min" },
  "value-drop":       { phase:"VALUE",            timebox:"7 min" },
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
  "rapport-opener":   [{ key:"win", label:"What would make today a win", hint:"Each person's answer" },
                       { key:"vibe", label:"Read on them", hint:"Pronouns, energy, anything they volunteered" }],
  "rules-engagement": [{ key:"agendaAdds", label:"Added to the agenda", hint:"Anything they want covered" }],
  "orient":           [{ key:"startArea", label:"Where they want to start", type:"choice", options:["Pipeline","Labor cost","Retention","All three"] },
                       { key:"startWhy", label:"What they said", hint:"Fills \"It sounds like…\" in Business Problem" }],
  "value-drop":       [{ key:"signOnView", label:"What they've seen with sign-ons" },
                       { key:"contractAreas", label:"Where they use contract labor most" },
                       { key:"reactions", label:"What landed", hint:"Reactions, questions, objections" }],
  "summary-buyin":    [{ key:"buyIn", label:"Buy-in score (1–10)" },
                       { key:"toTen", label:"What would make it a 10" }],
  "business-problem": [{ key:"surfaceNeed", label:"Surface need", hint:"What they say they want" },
                       { key:"businessDriver", label:"Need behind the need", hint:"The business problem. Would a CFO fund it?" },
                       { key:"trigger", label:"Trigger event", hint:"What set this in motion, in their words" },
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
                       { key:"whoCares", label:"Who cares most", hint:"Names and titles" },
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
//   say:  spoken beats. cue = what the beat does. check = pause for their answer.
//         then = what you say once they answer. list = numbered points (optional tag).
//         title / group / proof on the item itself.
//   ask:  a question card. group = only shown for that area.
export const STAGE_DATA = {
  "rapport-opener": {
    rule:"Land the opener, get permission for the agenda, then intros — yours, your colleague's, then theirs.",
    script:[
      { kind:"say", beats:[
        { cue:"Greet", text:"Hi [Names], I'm **glad we found the time** today. How's your **week** been?" },
        { cue:"Ask permission", text:"Great, well mind if we talk about the **agenda**?\n\nPerfect. Quick intros before we dive in." },
        { cue:"Your intro", text:"My name is **TJ Magar**, I'm a Director of Healthcare Partnerships here at Clasp." },
        { cue:"Why you care", text:"I'm super passionate about this work because **I'm an agitated borrower myself** — I know how it feels to have that barrier to education. And I love that we're **breaking it down** for the most important workforce there is: **healthcare**." },
        { cue:"Hand off", when:"hasColleague", check:"answer", text:"I've brought my colleague [colleague name] as well — and then I'd love to hear from you, maybe just **what would make today a win**. But [colleague name], want to go next?" },
        { cue:"Hand off", when:"noColleague", check:"answer", text:"And I'd love to hear from you — maybe just **what would make today a win**?" },
      ]},
    ],
    tips:["Pronouns: I/me/my means personal stakes matter. We/us/our means team focus and consensus matter.","Energy: talkative, stay with it. Business, pivot. Don't force the wrong mode.","Write down what would make today a win for each person. It sets up the agenda."],
    watch:["Thanking the prospect for their time — immediately positions you lower","Letting intros run long — keep yours to two sentences"],
  },
  "rules-engagement": {
    rule:"Align on the objective, the agenda, and the decision to be made.",
    script:[
      { kind:"say", beats:[
        { cue:"Propose the agenda", text:"Perfect, that leads into what I had in mind for today. Here's what I'm thinking in terms of **how we spend our time** — let me know if you had something else in mind…" },
        { cue:"Set the outcome", text:"The outcome I recommend we shoot for is to **learn enough about each other** to decide whether or not it makes sense to have a **second meeting**." },
        { cue:"Lower the stakes", text:"Obviously, I **don't expect us to do business** on this call. So let's just learn enough about each other to determine if another call makes sense." },
        { cue:"Check", check:true, text:"Is that **fair so far**?", then:"Perfect." },
        { cue:"Walk the agenda", text:"And here's the agenda I'm thinking will help us get there:", list:[
          "First, I'll share **a little about Clasp** upfront so you have the context for the rest of the call.",
          "But I'd love to spend **most of our time** today getting clear on **what's important to [their company]** — maybe the different challenges or goals you might have as they relate to **workforce recruitment, development, or retention**.",
          "If it looks like we can help, I'll **explain how it works**.",
          "Then we can **jointly decide** whether we set that next step. And I'll save some time at the end for that.",
        ]},
        { cue:"Check", check:true, text:"Does that agenda feel **reasonable enough**?", then:"Great — let's take a crack at it." },
      ]},
    ],
    tips:["Align on the objective, the agenda, and the decision to be made.","Pause after each fairness check and let them answer."],
    watch:["Rushing past the fairness checks without pausing","Skipping the agenda after they agree to the objective"],
  },
  "context": {
    rule:"Brief context on who we are and what we do. Earn the right to ask questions, don't pitch.",
    script:[
      { kind:"say", title:"Who we are", beats:[
        { cue:"Set up the slides", text:"So like I said, to give you some context, I've prepared **a few short slides**. Feel free to **interrupt me** anytime." },
        { cue:"Who we are", text:"At Clasp, we work **exclusively in healthcare**. Within that, we help HR and talent acquisition teams achieve **three distinct outcomes** through an **innovative student loan repayment and recruitment program**, which I'll share briefly." },
        { cue:"Who we work with", text:"Our partners range from major systems like **Novant Health, Northwestern Medicine and Boston Children's**, to smaller systems like **Saint Alphonsus**, to outpatient groups like **Confluent Health**." },
      ]},
    ],
    tips:["Keep it short. The point is to earn the right to ask questions, not to pitch."],
    watch:["Turning the context into a full pitch"],
  },
  "orient": {
    rule:"Lay out the three outcomes, then let them choose where to focus. Their pick steers discovery.",
    script:[
      { kind:"say", title:"Three outcomes", beats:[
        { cue:"Next slide", text:"And through speaking with HR and TA leaders, **the three areas where we tend to drive the most value**, and where a partnership often makes sense, are here on your screen:" },
        { cue:"Three outcomes", text:"", list:[
          { tag:"Pipeline", text:"Some partners tell us they need a **bigger, stronger pipeline** of soon-to-graduate RNs, Imaging Techs, Rehabilitation Therapists, and other clinical and allied health roles — **before they ever hit the open market**." },
          { tag:"Labor cost", text:"Others tell us they're **spending too much** — on sign-on bonuses that aren't showing ROI, on contract labor that's eating their budget, and on recruiting just to keep roles filled." },
          { tag:"Retention", text:"And some tell us they're **losing good people** to competitors for more money — so they use the program to reward not only **joining, but staying**. And they build out **career pathways**, like MAs into RNs and PTAs into PTs, instead of watching them walk out the door." },
        ]},
        { cue:"Hand it to them", check:"answer", text:"I have a hunch where you might fit, considering [what you spotted]. But given your situation, **where would be the most relevant place for us to start?**" },
      ]},
    ],
    tips:["Mark the area they pick in the capture pane. Discovery and the Value Drop follow it."],
    watch:["Picking the area for them — let them choose"],
  },
  "value-drop": {
    rule:"Follow their interest. Focus the conversation on the area they chose. All three: pipeline, then spend, then retention.",
    screen:"Sharing the slides and examples for each talk track",
    script:[
      { kind:"say", beats:[
        { cue:"Acknowledge + start", text:"Okay, let's start with how we help our partners [the area they chose]. And feel free to **stop me if any of this doesn't feel relevant**." },
      ]},
      { kind:"say", group:"Pipeline", title:"The outcome", proof:["Channels: school penetration, social + influencers, associations + conferences, campus ambassadors + virtual career fairs"], beats:[
        { cue:"The outcome", text:"So this is an area where we **really excel** and produce great outcomes for our partners." },
        { cue:"Three ways", text:"And the way we build a **bigger, more sustainable pipeline** of talent is really three main ways:", list:[
          { tag:"Educate", text:"We tap into channels in unique and innovative ways to actually **educate the students** on the possibilities and benefits of this type of program." },
          { tag:"Awareness", text:"By having built out programs, partnerships and relationships within these **four channels**, we're able to **generate awareness** of this type of program as a reason to join your system instead of another once they graduate." },
          { tag:"Convert", text:"And third — this presence helps us **convert them into applicants**, getting them to raise their hand and say, \"When I graduate, I want to come work for you!\"" },
        ]},
        { cue:"Check in", check:"answer", text:"Before I go further — I'm curious, **how are you building that early pipeline today?**" },
      ]},
      { kind:"say", group:"Pipeline", title:"Get the word out: TikTok", proof:["Curated influencer network reaches 4.6M+ engaged followers"], beats:[
        { cue:"Get the word out", text:"First we have to get the word out — if you're becoming a Nurse, an Imaging Tech, a Rehab Therapist, there are healthcare systems that will **help repay part of your student loans** so that you'll want to work with them." },
        { cue:"Influencers", text:"One of the most effective ways we've found to do this is through **social media influencers**. We have a whole curated network of **TikTok influencers who are clinicians and techs**. We've **really cracked the code** on this. I know it may sound funny, but it really works — and it's **so important for this generation**." },
        { cue:"Where they talk", text:"From what we're seeing, this is where they go to talk to each other — and **their student loan debt is a lot of what they're talking about**." },
        { cue:"Ask to show", check:"answer", text:"Matter of fact, **mind if I show you something?**" },
        { cue:"Show the search", text:"I did a simple search for TikTok videos about nursing student loan debt / PT debt / Rad Tech debt, and look at the results. **Video after video** of nurses and nursing students talking about their debt — how they'll pay it off, whether they regret taking on that much. **This seems to be on their minds**, and they go to TikTok to ask each other about it." },
        { cue:"Creative + compliance", text:"That's why we have a **creative team** working with influencers who are clinicians and techs to make content that lets these students know about these programs. And a **compliance team** that makes sure it's buttoned up — not boring, but buttoned up." },
        { cue:"Show a video", text:"Videos like this one. You can see the **level of engagement** — the views, the comments, the reshares. It tends to get these students **thinking about what's possible**." },
        { cue:"Check in", check:"answer", text:"I'm curious — **is that the kind of reach you're getting with students today, or is that pretty different?**" },
      ]},
      { kind:"say", group:"Pipeline", title:"Schools + campus", proof:["Active school partnerships: 70+ nursing, 90+ imaging, 70+ rehab therapy, 110+ RT","Ambassadors: we recruit, onboard, track referrals and pay out. Low lift for your team","Virtual career fair: 187 PT, OT and SLP students from 88 schools"], beats:[
        { cue:"School network", text:"Social only gets you so far, though. To really engage with the students, we've built out a **nationwide network of school relationships** that drive applicants into the top of your funnel. We talk with **Program Directors and Career Services** to spread the word that there are healthcare systems, like yourself, that will help their students pay part of their loans when they come to work for you." },
        { cue:"Why schools care", text:"From what program directors tell us, this message resonates with them in a way **a sign-on bonus usually doesn't**. It motivates them to share it with their students, and gets us **access to their students** in a way that many employers don't have." },
        { cue:"Campus ambassadors", text:"We also have a network of **campus ambassadors**, boots on the ground, to engage the students on campus. They're talking to soon-to-graduate nurses, imaging techs, and rehab therapists about our partners who are offering these programs." },
        { cue:"Wider reach", text:"These channels are what we use to **fill the top of your funnel** with applicants. And since we have relationships with schools across the country, this can **widen your talent pool** — pulling in students from beyond your immediate area, and campuses you might not have a relationship with right now." },
        { cue:"Check in", check:"answer", text:"How does that compare to your school relationships today — **are there programs you'd love to recruit from but don't have a real way in?**" },
      ]},
      { kind:"say", group:"Pipeline", title:"Convert: your recruiters", proof:["One system hit >200% of its rad tech applicant goal, with applicants from 6 states","Northwestern Medicine: \"we did not ever have 32 RT applicants at a time prior to Clasp\"","Partners see applicants from 10+ states on average"], beats:[
        { cue:"Support your TA", text:"And this isn't meant to replace what your TA team is already doing — **it's meant to support it**, with the local programs and residency programs. We have a team dedicated to **enabling your recruiters**. The landing pages and other materials we create help them **convert candidates they're already talking to** before the competition does." },
        { cue:"Show landing pages", text:"Landing pages like these. We tailor it to **your message, your employer brand and value prop**. The goal is to send the message to students: 'We understand what you're looking for, and **we're the right fit for you**.'" },
        { cue:"Check in", check:"answer", text:"**How do you think something like that would land with your recruiters?**" },
      ]},
      { kind:"say", group:"Labor cost", title:"Open", beats:[
        { cue:"Bridge", text:"So this is a great way we help our partners **avoid cost** and get more of their **budget back** to take on other projects." },
        { cue:"Ask", check:"answer", text:"By offering a Student Loan Repayment program, it does more than just build pipeline. It can help you **spend less on sign-on bonuses and contract labor**. Do you currently spend money on either of these for **Nursing, Imaging Techs, or Rehab Therapists**?" },
      ]},
      { kind:"picker", group:"Labor cost", key:"spendType", label:"What do they spend on?", options:[
        { value:"Sign-ons", sub:"Sign-on bonuses" },
        { value:"Contract labor", sub:"Travelers + agency" },
        { value:"Both", sub:"Sign-ons, then contract labor" },
      ]},
      { kind:"say", group:"Labor cost", subKey:"spendType", sub:"Sign-ons", title:"If they spend on sign-ons", proof:["Every $10k in sign-ons creates about $2,800 of value: −72% ROI (Laudio)","Upfront cash hit, nearly impossible to claw back, re-paid with every backfill"], beats:[
        { cue:"The arms race", check:"answer", text:"Let me ask you a question — and feel free to push back if this doesn't match what you're seeing. What our partners tell us is that sign-on bonuses feel a bit like **an arms race**. You have to offer one because everyone else is, and they keep escalating every year. **What have you seen in that regard?**" },
        { cue:"Acknowledge, then the story", text:"It's funny, I was talking to a TA leader at a hospital and she said that healthcare is **the only place where you can get a job with a sign-on**, work there 6 months, quit, walk across the street, and **get another sign-on bonus the next day**." },
        { cue:"Why sign-ons fail", text:"In our experience, the sign-on tends to appeal to a **'right now' mentality**. Very often it goes towards other expenses, and the loans just accumulate interest. It's a big part of why they're often **not that effective at keeping people around**." },
        { cue:"The cost", text:"And it's why systems end up spending so much on sign-ons — they **keep refilling the role** after the first year when 10, 15, 20% of new hires leave. I don't know what that number looks like for you. But when new hires leave anyway, you're often in a **clawback situation**." },
        { cue:"The contrast", text:"It tends to be a real contrast to the person who's looking for help with their student loans. **They're thinking about the future.** They're looking for a place where they can stay and grow. So when you put that money toward Student Loan Repayment instead of a sign-on, you can **end up spending less** — because you're not refilling the role as often, or paying out another sign-on." },
        { cue:"Paid over time", text:"The payment is also made **over time, monthly**, while they're employed with you. So **no costly clawbacks**, and no paying in advance for someone who leaves after year 1. Spreading the payments out — sometimes with a **ladder payment** approach — means **you're only spending to get and keep them**." },
        { cue:"Check in", check:"answer", text:"**How does that compare to how you're thinking about sign-ons today?**" },
      ]},
      { kind:"say", group:"Labor cost", subKey:"spendType", sub:"Contract labor", title:"If they spend on contract labor", proof:["Travelers cost ~2.2x","Weekly averages: RN $2,190 · Rad Tech $2,291 · PT $2,231 · RT $2,015 (about $8–9k a month each)"], beats:[
        { cue:"Ask", check:"answer", text:"We can also help **reduce spend on contract labor**, especially in the locations, specialties, and shifts that are hard to fill with a full-time employee. I'm curious — **where do you find you're using contract labor the most?**" },
        { cue:"Acknowledge + reframe", text:"That makes sense — areas like that are often tough to fill. Many of our partners use travelers to fill the gaps too. What they're finding is that this type of program gets the attention of candidates who want help with their student loans, and who are **willing to work at the location, in the specialty, or on the shift where you need it most**." },
        { cue:"The payoff", text:"They're motivated by the Student Loan Repayment to come work for you, and you can **need fewer travelers**. Depending on your mix, that can mean **thousands of dollars a week** recouped." },
        { cue:"Check in", check:"answer", text:"**Is that a gap you're feeling right now, or is contract labor pretty well under control?**" },
      ]},
      { kind:"say", group:"Retention", title:"Built to keep them", proof:["Partners' year-1 turnover is ~5% vs an industry average above 20%","Paid monthly once they're an employee; payments can step up in year 2"], beats:[
        { cue:"Bridge", text:"Building pipeline and saving on spend are important — but there's another area where we tend to have an impact, and for a lot of partners it ends up mattering most. We're also helping them **retain and grow their employees**." },
        { cue:"Built to stay", text:"The way your Student Loan Repayment program is structured **encourages people to stay 3, 4, or 5 years**. The amount is spread out monthly over that period and paid while they're employed. **It works a lot like a 401K match** — an incentive to stay to get the full amount." },
        { cue:"Proof", text:"It's a big part of why our partners tend to see **single-digit turnover, sometimes as low as 5%**, with the clinicians and techs in the program." },
        { cue:"Check in", check:"answer", text:"I'm curious — **how does that compare to what you're seeing with first-year turnover?**" },
      ]},
      { kind:"say", group:"Retention", title:"Nudges", proof:["Early affinity, testimonials, psychological nudges: \"Your employer had your back this month\""], beats:[
        { cue:"Gamification", text:"We've also built in some **gamification, some psychological nudges**." },
        { cue:"Sign-ons fade", text:"When someone gets a sign-on, they usually spend it faster than they planned — and then **it's gone from their mind**. Now they're looking for the next thing. So **we remind them** of the help you're giving them with their student loan debt." },
        { cue:"Testimonials", text:"When they first join you, we have them **record a video** about how excited they are to work somewhere that has their back like this. And every year they're in the program, we collect these testimonials." },
        { cue:"Monthly statement", text:"Every month we send them **a statement** — a reminder of 'Hey, look what you would have owed if your employer hadn't helped with this payment. **What would have been 10 years of payments is becoming 3.** All because you work here.' It really tends to bond them to you." },
        { cue:"Financial wellness", text:"And they get access to **financial wellness and budgeting tools** that reinforce they have more in their budget **because of you**." },
        { cue:"Check in", check:"answer", text:"**What are you doing today to keep that value top of mind once someone's hired — or is that tough to do?**" },
      ]},
      { kind:"say", group:"Retention", title:"Beyond new hires", proof:["Pathways: MAs and LPNs → RNs · PTAs → PTs · ICU nurses → CRNAs"], beats:[
        { cue:"Existing staff", text:"And this doesn't have to be just for new hires — it can be part of your **retention strategy**. So many clinicians and techs carry student loan debt for years. When they see you extend this to them, it tends to deepen the relationship and reassure them they've found **their long-term home**." },
        { cue:"Career pathing", text:"Some partners also use it for **career pathing** — motivating **Medical Assistants and LPNs into RNs, PTAs into PTs, ICU nurses into CRNAs** while they work for you." },
        { cue:"The message", text:"You're telling them, 'Go get the next-level degree and come back here. We have a place for you, and **we'll help you pay** for the loans you take out to upskill.' Now you're filling these roles with people who already **fit your culture and your mission**. It builds a **stronger, more stable workforce**." },
        { cue:"Check in", check:"answer", text:"**Are career pathways something you're investing in right now, or not so much?**" },
      ]},
    ],
    tips:["Hedge, don't declare: 'tends to', 'from what we're seeing', 'not sure this applies to you'.","End every section with a check-in tied to their world — never 'Does that make sense?' or 'What questions do you have?'","Give them room to say no: 'or is that pretty different?', 'or not so much?'","If they said all three, run pipeline, then spend, then retention."],
    watch:["Monologuing — stop at every check-in and let them talk","Running a cost track they told you doesn't apply","Stacking guarantees and 'no risk' language — a little goes a long way"],
  },
  "summary-buyin": {
    rule:"Reframe the outcomes we drive and get them to buy into the value.",
    screen:"Video on, no content shared",
    script:[
      { kind:"say", beats:[
        { cue:"Thank them", text:"I really appreciate you letting me share a bit about how we work with healthcare systems on an **innovative Student Loan Repayment and recruitment program**." },
        { cue:"Recap the value", text:"So just to **recap what we covered** — we talked about:", list:[
          { tag:"Pipeline", text:"How our partners use this program to build a **bigger, stronger pipeline** of soon-to-graduate Nurses, Imaging Techs, Rehabilitation Therapists using our **recruitment marketing and campus recruitment machine**." },
          { tag:"Labor cost", text:"How they're **saving money** not having to pay out sign-ons again and again, and filling roles with **full-time employees** that would have been worked by contract labor." },
          { tag:"Retention", text:"And how they're **retaining their employees** and motivating them down career pathways, creating a **stronger, more stable workforce**." },
        ]},
        { cue:"Land it", text:"**All through the power of their Student Loan Repayment program.**" },
        { cue:"Step back", text:"At this point, I'd love to take a step back and **understand where your head is at**. The reason I ask is I'd rather not keep going if this isn't a fit for you — so I want your **honest read, not the polite one**." },
        { cue:"Buy-in check", check:"answer", text:"So — quick gut check. On a **scale of 1 to 10**, with 10 being '**this is exactly what we need**' — **where would you put this right now?**" },
      ]},
      { kind:"picker", key:"reaction", label:"How did they react?", options:[
        { value:"Hesitant", sub:"Low number, or pushback" },
        { value:"Positive", sub:"High number, or leaning in" },
      ]},
      { kind:"say", subKey:"reaction", sub:"Hesitant", title:"If they're hesitant", beats:[
        { cue:"Acknowledge", text:"That's totally fair — and I **appreciate the honesty**." },
        { cue:"Get curious", check:"answer", text:"I'm curious — **what's keeping it from being higher?**" },
        { cue:"Dig in", check:"answer", text:"Tell me more about that. **What would need to be true** for this to be worth a closer look?" },
      ]},
      { kind:"say", subKey:"reaction", sub:"Positive", title:"If they're positive", beats:[
        { cue:"If they have questions", text:"**Answer their questions first.** Keep it short." },
        { cue:"Close the gap", check:"answer", text:"Glad it's resonating. I'm curious — **what would it take to make that a 10?**" },
      ]},
    ],
    tips:["Give a reason before the hard question ('The reason I ask is…').","Below a 10, get curious about the gap. Don't defend.","Save 'fair' for the agenda and the close."],
    watch:["Skipping the 1–10 — it's your read on whether to keep going","Answering an objection before you understand it","Recapping all three areas at the same weight when they only care about one"],
  },
  "business-problem": {
    rule:"Identify the business problem behind what they asked for, then validate it's the one to anchor on.",
    script:[
      { kind:"say", beats:[
        { cue:"Bridge", text:"So hopefully you have a good idea, and it seems there's **still alignment so far**. But to understand **where we need to get to**, I'd love to understand more about **where you are**." },
        { cue:"Go back in time", check:"answer", text:"**Mind if we go back in time for a moment?**" },
      ]},
      { kind:"ask", label:"The moment", text:"Can you walk me back to **the moment this became a priority**?\n\nWhat was happening?" },
      { kind:"ask", label:"Origin", text:"What was going on in your business that made you **start exploring solutions** like ours in the first place?" },
      { kind:"say", beats:[
        { cue:"Acknowledge", text:"I understand why you would want [surface need]." },
        { cue:"Dig", text:"**But what's actually going on?**" },
      ]},
      { kind:"ask", label:"Priority driver", text:"What's causing that to be **a priority**?" },
      { kind:"ask", label:"Energy", text:"What's driving you to **prioritize that**?" },
      { kind:"ask", label:"Business driver", text:"What is going on **in your business** that's driving you to put the focus and energy on that?" },
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
      { kind:"ask", group:"Pipeline", label:"Loan debt", text:"How often have you had these students **ask about help with their student loan debt**?" },
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
      { kind:"ask", group:"Retention", label:"Priority", text:"How often have you **spoken internally** about reducing that turnover number?\n\nWho **cares the most** about the turnover number?" },
      { kind:"ask", group:"Labor cost", label:"Sign-on priority", text:"How often have you **spoken internally** about reducing the amount you spend on sign-ons?\n\nWho **cares the most** about how much you spend on sign-ons?" },
      { kind:"ask", group:"Labor cost", label:"Contract priority", text:"How often have you **spoken internally** about reducing the amount of contract labor you use in these departments?\n\nWho **cares the most** about what you spend on contract labor?" },
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
