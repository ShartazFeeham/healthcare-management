// Generates the animated architecture and flow diagrams used by the root README.
//   node build.mjs          -> writes *.svg here
//   node render-gifs.mjs    -> renders each SVG to an animated GIF (frame-accurate, via headless Chrome)
import { Diagram, C } from "./lib.mjs";
import { writeFileSync } from "node:fs";

const meta = {};
const out = (name, d) => { writeFileSync(new URL(`./${name}.svg`, import.meta.url), d.svg()); meta[name] = { dur: d.dur, w: d.w, h: d.h }; console.log("wrote", name + ".svg", d.dur + "s"); };
// Ambient loops use durations that divide the 7.2 s loop, so the GIF repeats seamlessly.
const snap = (x) => [1.2, 1.8, 2.4, 3.6].reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a));

// ---------------------------------------------------------------- 1. High-level design
{
  const d = new Diagram({ w: 1200, h: 830, title: "EA Healthcare · High-level design", subtitle: "15 Spring Boot services · database per service · every dependency runs on localhost" });
  d.group("Clients", 20, 80, 520, 170, C.blue);
  d.node("pat", 40, 104, 170, 44, "Patient", "book · track · analyse", "heart", C.pink);
  d.node("doc", 40, 154, 170, 44, "Doctor", "treat · publish", "stetho", C.teal);
  d.node("adm", 40, 204, 170, 40, "Admin", "operate · moderate", "shield", C.amber);
  d.node("spa", 300, 140, 220, 76, "React SPA", ":3100 · 40+ screens", "browser", C.blue);
  d.group("Spring Cloud edge", 560, 80, 620, 170, C.violet);
  d.node("gw", 580, 140, 180, 56, "API Gateway", ":9999 · CORS", "gateway", C.violet);
  d.node("eu", 790, 140, 180, 56, "Eureka", ":8761 · registry", "list", C.violet);
  d.node("cfg", 990, 140, 170, 56, "Config server", ":8888 · local files", "sliders", C.violet);

  d.group("Domain microservices (REST + JWT)", 20, 270, 1160, 300, C.blue);
  const X = [40, 330, 620, 910], Y = [312, 402, 492], W = 250, H = 62;
  const svc = [
    ["acc", 0, 0, "Account", ":5100 · auth, OTP, roles", "shield", C.amber],
    ["pat_s", 1, 0, "Patients", ":7100 · profiles, challenges", "heart", C.pink],
    ["doc_s", 2, 0, "Doctors", ":7200 · profiles, rooms", "stetho", C.teal],
    ["med", 3, 0, "Medicines", ":7300 · pharmacy library", "pill", C.green],
    ["app", 0, 1, "Appointment", ":7400 · slots, equipment, reviews", "calendar", C.blue],
    ["com", 1, 1, "Community", ":7500 · posts, comments", "chat", C.pink],
    ["help", 2, 1, "Help desk", ":7700 · unified search", "search", C.violet],
    ["cdss", 3, 1, "CDSS", ":7800 · treatments, AI report", "spark", C.amber],
    ["not", 0, 2, "Notification", ":7600 · preferences, alerts", "bell", C.teal],
    ["i18n", 1, 2, "I18N", ":5400 · languages, strings", "globe", C.blue],
    ["file", 2, 2, "File storage", ":5200 · uploads on disk", "folder", C.green],
    ["int", 3, 2, "Integration", ":5300 · mail, SMS, AI, translate", "server", C.violet],
  ];
  svc.forEach(([id, c, r, l, s, i, col]) => d.node(id, X[c], Y[r], W, H, l, s, i, col));

  d.group("Data and local infrastructure", 20, 596, 1160, 150, C.green);
  d.node("db", 40, 640, 215, 70, "MySQL 8.4", "9 schemas · Docker", "db", C.green);
  d.node("disk", 270, 640, 190, 70, "Disk storage", "uploaded images", "folder", C.green);
  d.node("ob", 475, 640, 190, 70, "Local outbox", "email · SMS · push", "mail", C.green);
  d.node("ana", 680, 640, 245, 70, "Local clinical analyst", "rule-based · no cloud LLM", "spark", C.amber);
  d.node("ext", 940, 640, 220, 70, "Google Translate", "optional · only online call", "globe", C.red, { dashed: true });

  // clients -> SPA -> gateway and the REST bus to every service column
  d.edge("u1", "pat", "r", "spa", "l", { via: [[255, 126], [255, 178]] }); d.edge("u2", "doc", "r", "spa", "l", { via: [[255, 176], [255, 178]] }); d.edge("u3", "adm", "r", "spa", "l", { via: [[255, 224], [255, 178]] });
  d.edge("sg", "spa", "r", "gw", "l", { color: C.violet, width: 2.5 }); d.edge("ge", "gw", "r", "eu", "l", { color: C.violet }); d.edge("ec", "eu", "r", "cfg", "l", { color: C.violet });
  d.rawEdge("bus", `M410 216 L410 252 L1035 252`, { color: C.blue, width: 3 });
  X.forEach((x, i) => d.rawEdge("stub" + i, `M${x + W / 2} 252 L${x + W / 2} ${Y[0]}`, { color: C.blue, width: 2 }));
  // service-to-service
  d.edge("n_i", "not", "r", "int", "l", { color: C.violet, width: 2.4 });
  d.edge("c_i", "cdss", "b", "int", "t", { color: C.amber, width: 2.4 });
  d.edge("t_i", "i18n", "b", "int", "l", { via: [[X[1] + W / 2, 550], [885, 550], [885, 523]], color: C.blue });
  d.edge("a_n", "app", "b", "not", "t", { color: C.teal, width: 2.4 });
  d.edge("p_a", "pat_s", "l", "acc", "r", { color: C.amber });
  d.edge("i_g", "int", "b", "ext", "t", { via: [[1035, 612], [1050, 612]], color: C.red, dashed: true });
  // data bus: row 3 -> stores
  d.rawEdge("dbus", `M165 554 L165 580 L1000 580`, { color: C.green, width: 2.5 });
  [[165, 554], [455, 554], [745, 554], [960, 554]].forEach(([x, y], i) => d.rawEdge("up" + i, `M${x} ${y} L${x} 580`, { color: C.green, width: 2 }));
  [147, 365, 570, 802].forEach((x, i) => d.rawEdge("dn" + i, `M${x} 580 L${x} 640`, { color: C.green, width: 2 }));
  [["n_i", C.violet, 2.6, 0], ["n_i", C.violet, 2.6, 1.3], ["c_i", C.amber, 2.2, 0.4], ["a_n", C.teal, 2.2, 0.2], ["a_n", C.teal, 2.2, 1.3], ["bus", C.blue, 3.4, 0], ["bus", C.blue, 3.4, 1.7], ["sg", C.violet, 1.8, 0.3],
   ["t_i", C.blue, 3.2, 0.8], ["p_a", C.amber, 2, 0.6], ["i_g", C.red, 3, 0.5], ["dbus", C.green, 3.4, 0.2], ["dn0", C.green, 1.8, 0.2], ["dn1", C.green, 1.8, 0.7], ["dn2", C.green, 1.8, 1.0], ["dn3", C.green, 1.8, 0.4],
   ["u1", C.pink, 1.6, 0], ["u2", C.teal, 1.6, 0.5], ["u3", C.amber, 1.6, 0.9], ["ec", C.violet, 1.8, 0.9], ["ge", C.violet, 1.8, 0.1]]
    .forEach(([e, col, dur, begin]) => d.flow(e, { color: col, dur: snap(dur), begin }));
  d.dur = 7.2;
  d.layers.text.push(`<text x="40" y="778" fill="${C.muted}" font-size="12">Every box above runs on this machine. The only outbound call is the optional translation of user-written text; the whole interface is also pre-translated offline.</text>`,
    `<text x="40" y="802" fill="${C.muted}" font-size="12">Legend:  <tspan fill="${C.blue}">●</tspan> REST + JWT   <tspan fill="${C.violet}">●</tspan> service-to-service   <tspan fill="${C.green}">●</tspan> local data   <tspan fill="${C.red}">●</tspan> optional internet</text>`);
  out("architecture", d);
}

// ---------------------------------------------------------------- shared helper for story flows
const story = (name, title, subtitle, h, nodes, edges, steps) => {
  const d = new Diagram({ w: 1200, h, title, subtitle });
  nodes.forEach((n) => d.node(n[0], n[1], n[2], n[3], n[4], n[5], n[6], n[7], n[8], n[9] || {}));
  edges.forEach(([id, a, as, b, bs, o]) => d.edge(id, a, as, b, bs, o || {}));
  d.story(steps);
  out(name, d);
};

// ---------------------------------------------------------------- 2. Sign-up, OTP unlock, JWT login
story("flow-auth", "Sign-up and secure login", "Accounts start locked; a one-time code delivered to the local mailbox unlocks them", 450,
  [["spa", 40, 150, 210, 70, "React SPA", "register · verify · login", "browser", C.blue],
   ["pat", 330, 150, 210, 70, "Patients service", "POST /patients/register", "heart", C.pink],
   ["acc", 620, 150, 210, 70, "Account service", "BCrypt · JWT · roles", "shield", C.amber],
   ["int", 910, 150, 250, 70, "Integration service", "email channel", "server", C.violet],
   ["db", 620, 300, 210, 70, "MySQL · accounts", "locked until OTP", "db", C.green],
   ["box", 910, 300, 250, 70, "Local mailbox", "OTP shown in the UI", "mail", C.green]],
  [["e1", "spa", "r", "pat", "l"], ["e2", "pat", "r", "acc", "l"], ["e3", "acc", "r", "int", "l"], ["e4", "acc", "b", "db", "t"], ["e5", "int", "b", "box", "t"], ["e6", "box", "l", "spa", "b", { via: [[560, 335], [145, 335]] }]],
  [{ edge: "e1", to: "pat", color: C.blue, caption: "Patient submits the registration form (validated in the browser and again on the server)." },
   { edge: "e2", to: "acc", color: C.pink, caption: "Patients service creates the profile and asks Account to create the login with the same user ID (PER1)." },
   { edge: "e4", to: "db", color: C.amber, caption: "Account stores a BCrypt password hash, marks the account locked and generates a 6-digit OTP." },
   { edge: "e3", to: "int", color: C.amber, caption: "Account asks Integration to email the OTP. In production this is SMTP; locally it is captured." },
   { edge: "e5", to: "box", color: C.violet, caption: "Integration records the message in the local outbox: nothing leaves the machine." },
   { edge: "e6", to: "spa", color: C.green, caption: "The user reads the code in the mailbox page, verifies, and receives a signed JWT (role in the claims)." }]);

// ---------------------------------------------------------------- 3. Appointment booking
story("flow-booking", "Booking an appointment", "Capacity-aware slots, doctor delays, and layered reminders delivered through the notification service", 480,
  [["spa", 40, 160, 200, 70, "Patient app", "pick doctor · date · slot", "browser", C.blue],
   ["app", 330, 160, 220, 70, "Appointment service", "schedule · capacity · delays", "calendar", C.blue],
   ["not", 640, 160, 210, 70, "Notification service", "preferences · filters", "bell", C.teal],
   ["int", 940, 160, 220, 70, "Integration service", "email · SMS · push", "server", C.violet],
   ["db", 330, 320, 220, 70, "MySQL · appointments", "slots, serials, reviews", "db", C.green],
   ["sch", 640, 320, 210, 70, "Reminder schedulers", "24h · 1h · 5 min", "calendar", C.amber],
   ["box", 940, 320, 220, 70, "Local outbox", "visible in the mailbox", "mail", C.green]],
  [["e1", "spa", "r", "app", "l"], ["e2", "app", "b", "db", "t"], ["e3", "app", "r", "not", "l"], ["e4", "not", "r", "int", "l"], ["e5", "int", "b", "box", "t"], ["e6", "sch", "t", "not", "b"], ["e7", "sch", "l", "db", "r"]],
  [{ edge: "e1", to: "app", color: C.blue, caption: "POST /appointments with the JWT: patient, doctor, date and shift." },
   { edge: "e2", to: "db", color: C.green, caption: "Checks the doctor's schedule, the slot capacity and past times, then assigns the next free serial and time." },
   { edge: "e3", to: "not", color: C.teal, caption: "A notification (title, text, deep link) is sent to the patient and the doctor." },
   { edge: "e4", to: "int", color: C.violet, caption: "Notification applies each user's preferences (channels, do-not-disturb, categories) and fans out." },
   { edge: "e5", to: "box", color: C.green, caption: "Email, SMS and push are delivered to the local outbox; the bell badge counts unseen items." },
   { edge: "e7", to: "sch", color: C.amber, caption: "Scheduled jobs scan upcoming appointments (daily, hourly, every five minutes) ..." },
   { edge: "e6", to: "not", color: C.amber, caption: "... and send reminders, adjusted automatically for any delay the doctor has announced." }]);

// ---------------------------------------------------------------- 4. AI health report
story("flow-ai", "AI-assisted health report (clinical decision support)", "Similar-case search plus a local analyst: the patient's data never leaves the server", 480,
  [["spa", 40, 160, 190, 70, "Patient profile", "Generate report", "browser", C.blue],
   ["cd", 310, 160, 220, 70, "CDSS service", "treatments · reports", "spark", C.amber],
   ["int", 610, 160, 220, 70, "Integration service", "POST /v1/ai/chat", "server", C.violet],
   ["ana", 910, 160, 250, 70, "Local clinical analyst", "knowledge base · templates", "spark", C.amber],
   ["db", 310, 320, 220, 70, "MySQL · cdss", "treatments, reports", "db", C.green],
   ["sim", 610, 320, 220, 70, "Similarity search", "keyword overlap · top 2", "search", C.teal],
   ["out", 40, 320, 190, 70, "3-section report", "overview · cohort · outlook", "list", C.green]],
  [["e1", "spa", "r", "cd", "l"], ["e2", "cd", "b", "db", "t"], ["e3", "db", "r", "sim", "l"], ["e4", "cd", "r", "int", "l"], ["e5", "int", "r", "ana", "l"], ["e6", "cd", "l", "out", "t", { via: [[270, 195], [135, 195]] }]],
  [{ edge: "e1", to: "cd", color: C.blue, caption: "The patient (or their doctor) requests a report for patient ID PER1." },
   { edge: "e2", to: "db", color: C.green, caption: "CDSS loads the patient's treatments and every other patient's treatment keywords." },
   { edge: "e3", to: "sim", color: C.teal, caption: "Cases are ranked by keyword overlap; the two closest are anonymised (copied, IDs hidden)." },
   { edge: "e4", to: "int", color: C.violet, caption: "A structured prompt with the patient data and the similar cases goes to the Integration service." },
   { edge: "e5", to: "ana", color: C.amber, caption: "The local analyst writes the analysis from the data plus a clinical knowledge base (specialists, tests, advice)." },
   { edge: "e6", to: "out", color: C.green, caption: "The report is stored, then shown as three sections with the anonymised cases beside it.", reverse: false }]);

// ---------------------------------------------------------------- 5. Telemedicine
story("flow-telemedicine", "Telemedicine without a cloud video service", "Access is verified server-side; media flows peer to peer over WebRTC", 580,
  [["d", 40, 150, 220, 70, "Doctor browser", "camera + microphone", "video", C.teal],
   ["app", 480, 150, 240, 70, "Appointment service", "/tele/verify/{id}", "calendar", C.blue],
   ["p", 940, 150, 220, 70, "Patient browser", "camera + microphone", "video", C.pink],
   ["bc", 480, 330, 240, 70, "BroadcastChannel", "signalling: offer · answer · ICE", "chat", C.amber],
   ["rtc", 480, 440, 240, 56, "WebRTC media", "encrypted P2P · no server", "video", C.green]],
  [["e1", "d", "r", "app", "l"], ["e2", "p", "l", "app", "r"], ["e3", "d", "b", "bc", "l", { via: [[150, 365]] }], ["e4", "bc", "r", "p", "b", { via: [[1050, 365]] }], ["e5", "d", "b", "rtc", "l", { via: [[150, 468]], color: C.green }], ["e6", "rtc", "r", "p", "b", { via: [[1050, 468]], color: C.green }]],
  [{ edge: "e1", to: "app", color: C.teal, caption: "The doctor opens the call link; the service checks the appointment belongs to them and the join window is open." },
   { edge: "e2", to: "app", color: C.pink, caption: "The patient is verified the same way (window: 5 minutes before to 20 minutes after, adjusted for delays).", reverse: true },
   { edge: "e3", to: "bc", color: C.amber, caption: "Both browsers announce themselves; the lower ID creates a WebRTC offer and sends it through the channel." },
   { edge: "e4", to: "bc", color: C.amber, caption: "The answer and ICE candidates come back the same way. No signalling server is needed." },
   { edge: "e5", to: "rtc", color: C.green, caption: "Peers connect directly. Audio and video travel encrypted between the two browsers." },
   { edge: "e6", to: "rtc", color: C.green, caption: "Mute, camera, link-copy and end-call controls act on the local streams." }]);

// ---------------------------------------------------------------- 6. i18n
story("flow-i18n", "Interface translation that works offline", "Pre-translated dictionary first; the translator is an optional extra for user-written text", 450,
  [["spa", 40, 150, 210, 70, "React SPA", "text(tag, default)", "browser", C.blue],
   ["i18n", 360, 150, 220, 70, "I18N service", "resources · translations", "globe", C.blue],
   ["db", 360, 300, 220, 70, "MySQL · i18n", "10 languages × 33 strings", "db", C.green],
   ["int", 700, 150, 220, 70, "Integration service", "translator client", "server", C.violet],
   ["g", 990, 150, 170, 70, "Google Translate", "optional · online", "globe", C.red, { dashed: true }]],
  [["e1", "spa", "r", "i18n", "l"], ["e2", "i18n", "b", "db", "t"], ["e3", "i18n", "r", "int", "l"], ["e4", "int", "r", "g", "l", { dashed: true, color: C.red }]],
  [{ edge: "e1", to: "i18n", color: C.blue, caption: "On load the app fetches the whole dictionary once, then picks the user's language (e.g. Bengali)." },
   { edge: "e2", to: "db", color: C.green, caption: "The seeder pre-loaded every interface string in ten languages, so no internet is required." },
   { edge: "e3", to: "int", color: C.violet, caption: "Only a string that is missing from the dictionary is sent to the translator integration ..." },
   { edge: "e4", to: "g", color: C.red, caption: "... and only when the machine is online. When offline it fails fast and the English text is kept." }]);

// ---------------------------------------------------------------- 7. One-command environment
story("flow-runner", "One command to a working system", "docs/runner.sh · everything local, repeatable from a clean machine", 450,
  [["r", 40, 150, 210, 70, "runner.sh", "menu or ./runner.sh 5", "terminal", C.amber],
   ["dk", 330, 150, 220, 70, "Docker · MySQL", "volume, schemas, user", "docker", C.blue],
   ["be", 630, 150, 250, 70, "15 Spring Boot jars", "start in dependency order", "server", C.violet],
   ["fe", 960, 150, 200, 70, "React build", "static server :3100", "browser", C.teal],
   ["sd", 330, 300, 220, 70, "Seeder", "real APIs + SQL history", "chart", C.green],
   ["ts", 630, 300, 250, 70, "E2E tests", "headless Chrome · 12 checks", "shield", C.pink],
   ["sh", 960, 300, 200, 70, "Screenshot tour", "feeds the showcase site", "browser", C.amber]],
  [["e1", "r", "r", "dk", "l"], ["e2", "dk", "r", "be", "l"], ["e3", "be", "r", "fe", "l"], ["e4", "fe", "b", "sh", "t"], ["e5", "be", "b", "sd", "t", { via: [[755, 270], [440, 270]] }], ["e6", "sd", "r", "ts", "l"], ["e7", "ts", "r", "sh", "l"]],
  [{ edge: "e1", to: "dk", color: C.amber, caption: "Option 5 cleans old containers and volumes, then starts MySQL 8.4 and creates one schema per service." },
   { edge: "e2", to: "be", color: C.blue, caption: "Services start in order (registry, config, then the rest), each waiting until it answers." },
   { edge: "e3", to: "fe", color: C.violet, caption: "The React build is served by a tiny dependency-free static server on port 3100." },
   { edge: "e5", to: "sd", color: C.green, caption: "The seeder fills the system through the real APIs: 54 users, about 2,000 appointments, posts, reports, translations." },
   { edge: "e6", to: "ts", color: C.green, caption: "An end-to-end suite drives the UI in headless Chrome and verifies the effects through the APIs." },
   { edge: "e7", to: "sh", color: C.pink, caption: "A tour captures every screen for the showcase site." }]);

writeFileSync(new URL("./meta.json", import.meta.url), JSON.stringify(meta, null, 1));
