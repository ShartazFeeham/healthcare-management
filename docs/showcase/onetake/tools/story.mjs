// The script of the film. Step durations are FILM time (what the viewer sees), not wall-clock time.
// Both the desktop and the phone recording follow exactly these steps, so the two films have identical timelines.
const S = 1.15; // global pacing: slightly slower than the recorder so captions are readable
const d = (ms) => Math.round(ms * S);
const clickDate = (n) => `([...document.querySelectorAll('li,a,div,span')].filter(e=>e.children.length===0 && /^\\d{4}-\\d{2}-\\d{2}$/.test((e.innerText||'').trim()))[${n}])`;
const byText = (sel, text) => `([...document.querySelectorAll(${JSON.stringify(sel)})].filter(e=>e.offsetParent && (e.innerText||'').trim().toLowerCase().startsWith(${JSON.stringify(text.toLowerCase())})).sort((a,b)=>a.getBoundingClientRect().width*a.getBoundingClientRect().height-b.getBoundingClientRect().width*b.getBoundingClientRect().height)[0])`;

export const CHAPTERS = [
  { id: "signin", n: 1, role: "Patient", title: "Sign in",
    cues: [[400, 9000, "A one-time code, delivered to a mailbox that lives on this machine. No SMS provider, no keys, no network."], [9400, 15000, "The interface speaks ten languages from an offline dictionary."], [15200, 24500, "Then the sign-in itself."]],
    steps: [
      { t: "goto", url: "/public/login", dur: d(2200), alt: "Sign-in screen" },
      { t: "lang", value: "Bengali", dur: d(2000), alt: "Sign-in screen in Bengali" },
      { t: "lang", value: "English", dur: d(1500), alt: "Sign-in screen in English" },
      { t: "goto", url: "/public/forgotten-password", dur: d(1600), alt: "Password recovery screen" },
      { t: "type", sel: "input[placeholder='Email']", text: "{patient1}", chunks: 3, dur: d(3000), alt: "Typing an email address" },
      { t: "click", find: byText("button", "Send OTP"), dur: d(2200), alt: "One-time code requested" },
      { t: "goto", url: "/common/mailbox", dur: d(3600), frames: 2, alt: "Local mailbox showing the one-time code" },
      { t: "goto", url: "/public/login", dur: d(1200), alt: "Sign-in screen" },
      { t: "type", sel: "input[type=email]", text: "{patient0}", chunks: 3, dur: d(2400), alt: "Typing the email" },
      { t: "type", sel: "input[type=password]", text: "{patientPw}", chunks: 2, dur: d(1600), alt: "Typing the password" },
      { t: "click", find: byText("button", "Login"), dur: d(2800), frames: 2, alt: "Patient dashboard after sign-in" },
    ] },
  { id: "book", n: 2, role: "Patient", title: "Book",
    cues: [[300, 6000, "Search, choose a doctor, choose a slot."], [6200, 13000, "Capacity is checked on the server, not in the browser."]],
    steps: [
      { t: "goto", url: "/health/appointment", dur: d(2000), alt: "Doctors list" },
      { t: "click", find: `([...document.querySelectorAll('.card.mt-2')].find(e=>e.innerText.includes('Imran Chowdhury')))`, dur: d(2600), frames: 2, alt: "Dr. Imran Chowdhury's available days" },
      { t: "click", find: clickDate(1), dur: d(2400), frames: 2, alt: "Slots for the chosen day" },
      { t: "scroll", find: byText("div,span,h1,h2,h3,h4", "Schedule details"), dur: d(1800), alt: "Slot table with capacity, booked and delay" },
      { t: "click", find: `(document.querySelectorAll('button.btn-success, .btn-success')[0] || ${byText("button", "Apply")})`, dur: d(4200), frames: 3, alt: "Appointment created" },
    ] },
  { id: "doctor", n: 3, role: "Doctor", title: "The other side", profile: "doctor",
    cues: [[300, 5200, "The booking is already on the doctor's day."], [5400, 12000, "A delay applies to the shift it is announced in, and booked patients are told."]],
    steps: [
      { t: "goto", url: "/health/doctor", dur: d(3000), frames: 2, alt: "Doctor's day with upcoming appointments" },
      { t: "scroll", find: byText("div,h1,h2,h3,span", "Delay management"), dur: d(1800), alt: "Delay management panel" },
      { t: "click", find: "(document.querySelector(\"input[placeholder='Update delay']\"))", dur: d(1000), alt: "Delay input focused" },
      { t: "type", sel: "input[placeholder='Update delay']", text: "20", chunks: 2, dur: d(1600), alt: "Typing a 20 minute delay" },
      { t: "key", key: "Enter", dur: d(3200), frames: 2, alt: "Delay saved" },
    ] },
  { id: "message", n: 4, role: "Patient", title: "The message",
    cues: [[300, 5200, "Preferences decide the channel."], [5400, 9500, "Here, the channel is a local mailbox."]],
    steps: [
      { t: "goto", url: "/health/notifications", dur: d(3200), frames: 2, alt: "Notifications list" },
      { t: "goto", url: "/health/settings", dur: d(2600), alt: "Notification preferences" },
      { t: "goto", url: "/common/mailbox", dur: d(2800), alt: "Local mailbox" },
    ] },
  { id: "call", n: 5, role: "Patient", title: "The consultation", drawer: "P4",
    cues: [[300, 4800, "Two appointments: one too early, one on time."], [5000, 10500, "Too early: refused. On time: connected."], [10700, 16500, "The join window was once inverted. It is fixed, and tested."]],
    steps: [
      { t: "goto", url: "/tele/call/{callEarly}", dur: d(4800), frames: 2, alt: "Join refused: too early" },
      { t: "goto", url: "/tele/call/{callNow}", dur: d(3400), alt: "Waiting for the other participant" },
      { t: "wait", dur: d(4800), frames: 3, alt: "Both participants connected", pre: "doctorJoins" },
    ] },
  { id: "report", n: 6, role: "Patient", title: "The report",
    cues: [[300, 6500, "Two similar, anonymised cases are retrieved."], [6700, 14000, "A local, rule-based analyst writes three parts. No cloud model sees anything."]],
    steps: [
      { t: "goto", url: "/health/patients/{patientId}", dur: d(2400), alt: "Patient profile with treatments" },
      { t: "scroll", find: byText("div,span,h6", "AI health analysis"), dur: d(1800), alt: "AI health analysis panel" },
      { t: "click", find: byText("button", "Generate"), dur: d(5200), frames: 3, alt: "Report being generated" },
      { t: "scroll", find: byText("h6", "Most similar anonymised"), dur: d(3000), frames: 2, alt: "Similar anonymised cases" },
    ] },
  { id: "admin", n: 7, role: "Admin", title: "The whole picture", profile: "admin",
    cues: [[300, 6500, "Eighty days of appointments by shift and consultation type."], [6700, 12500, "54 users and about 2,000 appointments, seeded by one command."]],
    steps: [
      { t: "goto", url: "/health/admin", dur: d(2400), alt: "Admin dashboard" },
      { t: "click", find: byText("button,a,div", "Statistics"), dur: d(4000), frames: 2, alt: "Statistics charts" },
      { t: "scroll", find: byText("div,h1,h2,h3,span", "Appointment shift stats"), dur: d(2800), frames: 2, alt: "Shift and consultation mix" },
      { t: "click", find: byText("button,a,div", "Manage doctors"), dur: d(2800), alt: "Doctor management" },
    ] },
];
export const END = { dur: 21000 };
