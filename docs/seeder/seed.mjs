#!/usr/bin/env node
// Seeds the whole platform with realistic demo data through the public APIs of the running services.
// Only historical appointments (which the booking API correctly refuses to create) are written with SQL.
//   node seed.mjs            seed an empty system
//   node seed.mjs --force    seed even if an admin account already exists
import { SVC, INTERNAL, call, get, post, put, login, sql, q, rng, log, iso, addDays, sleep } from "./lib/api.mjs";
import { avatar, medicinePack, equipmentArt, postArt } from "./lib/art.mjs";
import { ADMINS, DOCTORS, PASSWORD, patientRoster } from "./data/people.mjs";
import { MEDICINES, EQUIPMENT, ACHIEVEMENTS } from "./data/catalog.mjs";
import { CONDITIONS, REVIEW_COMMENTS } from "./data/clinical.mjs";
import { ARTICLES, FIRST_AID, FAQS, STATUSES, FEEDBACKS, COMMENTS, REPLIES } from "./data/community.mjs";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FORCE = process.argv.includes("--force");
const r = rng(20240611);
const today = new Date(); today.setHours(0, 0, 0, 0);
const step = (n, t) => log(`\n[${n}] ${t}`);
const safe = async (label, fn) => { try { return await fn(); } catch (e) { log(`   ! ${label}: ${e.message}`); return null; } };

async function upload(filename, svg) {
  const form = new FormData();
  form.append("file", new Blob([svg], { type: "image/svg+xml" }), filename);
  return (await post(`${SVC.files}/v1/upload`, { form })).data;
}

// ------------------------------------------------------------------------------------------
async function preflight() {
  for (const [name, url] of Object.entries(SVC)) {
    try { await fetch(url, { signal: AbortSignal.timeout(3000) }); } catch { throw new Error(`${name} service (${url}) is not reachable, start the backend first.`); }
  }
  const probe = await post(`${SVC.account}/access/login`, { body: { identity: ADMINS[0].email, password: PASSWORD.admin }, allow: [400, 401, 404, 406, 500] });
  if (probe.status !== 404 && probe.status !== 500 && !FORCE) {
    log("An admin account already exists, the system looks seeded. Re-run with --force or clean up first (docs/runner.sh option 1).");
    process.exit(0);
  }
}

async function main() {
  const started = Date.now();
  await preflight();
  const people = { admins: [], doctors: [], patients: [] };

  // 1. Admins --------------------------------------------------------------------------------
  step(1, "Administrators");
  for (const a of ADMINS) {
    await post(`${SVC.account}/account/create-admin-account`, { token: INTERNAL, body: { ...a, password: PASSWORD.admin }, allow: [409, 400] });
    const s = await login(a.email, PASSWORD.admin);
    people.admins.push({ ...a, ...s, token: s.bearerToken });
    log(`   ✓ ${a.email} (${s.userId})`);
  }
  const admin = people.admins[0], A = admin.token;

  // 2. Doctors -------------------------------------------------------------------------------
  step(2, `Doctors (${DOCTORS.length})`);
  for (const d of DOCTORS) {
    const email = `dr.${d.firstName}.${d.lastName}@healthcare.local`.toLowerCase();
    const photo = await upload(`${d.firstName}-${d.lastName}.svg`.toLowerCase(), avatar(d.firstName + d.lastName, { role: "DOCTOR", gender: d.gender }));
    await post(`${SVC.doctors}/doctors/register`, { body: {
      firstName: d.firstName, lastName: d.lastName, email, password: PASSWORD.doctor, gender: d.gender.toLowerCase(), bio: d.bio, experience: d.experience,
      license: `BMDC-A-${r.int(40000, 99999)}`, nid: String(r.int(1000000000, 9999999999)), phoneNumber: `+88018${r.int(10000000, 99999999)}`,
      residence: d.residence, dateOfBirth: d.dob, specialization: d.specialization, photo,
      qualifications: d.quals.map(([name, institution, year]) => ({ name, institution, year })),
      certifications: d.certs.map(([name, issuingOrganization, year]) => ({ name, issuingOrganization, year })) } });
    await login(email, PASSWORD.doctor); // unlocks the account; doctors then wait for admin approval
    const info = (await get(`${SVC.account}/account/get-user-info/${encodeURIComponent(email)}`, { token: A })).data;
    await put(`${SVC.account}/status/toggle-deactivation/${info.userId}/false`, { token: A });
    const s = await login(email, PASSWORD.doctor);
    people.doctors.push({ ...d, email, userId: s.userId, token: s.bearerToken, photo });
    log(`   ✓ ${s.userId} Dr. ${d.firstName} ${d.lastName} · ${d.specialization}`);
  }

  // 3. Patients ------------------------------------------------------------------------------
  const roster = patientRoster(r);
  step(3, `Patients (${roster.length})`);
  for (const p of roster) {
    await post(`${SVC.patients}/patients/register`, { body: { firstName: p.firstName, lastName: p.lastName, email: p.email, gender: p.gender.toLowerCase(), password: PASSWORD.patient, age: p.age } });
    const s = await login(p.email, PASSWORD.patient);
    const photo = await upload(`${p.firstName}-${p.lastName}.svg`.toLowerCase(), avatar(p.firstName + p.lastName, { role: "PATIENT", gender: p.gender }));
    await put(`${SVC.patients}/patients/update-profile`, { token: s.bearerToken, body: {
      firstName: p.firstName, lastName: p.lastName, gender: p.gender.toLowerCase(), profilePhoto: photo, allergies: p.allergies, age: p.age, height: p.height, weight: p.weight,
      bloodGroup: p.bloodGroup, bloodSugar: p.bloodSugar, bloodPressure: p.bloodPressure, occupation: p.occupation, phoneNo: p.phoneNo, residence: p.residence,
      smoking: p.smoking, drinking: p.drinking, asthma: p.asthma } });
    people.patients.push({ ...p, userId: s.userId, token: s.bearerToken, photo });
  }
  log(`   ✓ ${people.patients.length} patients with profiles and photos`);

  // 4. Pharmacy, equipment, rooms ------------------------------------------------------------
  step(4, `Medicines (${MEDICINES.length}), equipment (${EQUIPMENT.length}), rooms`);
  for (const m of MEDICINES) {
    const photo = await upload(`${m.commercialName.replace(/[^A-Za-z0-9]/g, "-")}.svg`.toLowerCase(), medicinePack(m.commercialName, m.dosageForm, m.color));
    const d = addDays(today, r.int(300, 1100));
    await safe(m.commercialName, () => post(`${SVC.medicines}/medicines`, { token: A, body: { ...m, color: undefined, strengthVolume: m.strengthVolume === "—" ? ({ Tablet: "30 tablets", Capsule: "20 capsules" }[m.dosageForm] || "1 pack") : m.strengthVolume, photo, nationalDrugCode: `NDC-${r.int(10000, 99999)}-${r.int(100, 999)}`, expirationDate: iso(d) } }));
  }
  for (const e of EQUIPMENT) {
    const photoURL = await upload(`${e.name.replace(/[^A-Za-z0-9]/g, "-")}.svg`.toLowerCase(), equipmentArt(e.kind, e.name));
    await safe(e.name, () => post(`${SVC.appointments}/equipments`, { token: A, body: { name: e.name, photoURL, useCases: e.useCases, details: e.details, warning: e.warning, costing: e.costing, availability: e.availability } }));
  }
  people.doctors.forEach((d, i) => { d.room = `${["A", "B", "C"][i % 3]}-${100 + Math.floor(i / 3) * 10 + (i % 3) + 1}`; });
  for (const d of people.doctors) await safe("room", () => post(`${SVC.doctors}/rooms/allocate`, { token: A, body: { doctorId: d.userId, doctorName: `${d.firstName} ${d.lastName}`, room: d.room } }));
  log("   ✓ catalogue, equipment and room allocation done");

  // 5. Schedules (doctor-controlled, next 10 days) --------------------------------------------
  step(5, "Doctor schedules for the next 10 days");
  const scheduleOf = new Map();
  for (const d of people.doctors) {
    for (let i = 0; i < 10; i++) {
      if (r.chance(0.2)) continue; // day off
      const date = iso(addDays(today, i));
      const shifts = [r.pick([1, 1, 2, 0]), r.pick([1, 1, 2, 0]), r.pick([1, 2, 0, 0])];
      if (!shifts.some((s) => s)) shifts[0] = 1;
      const cap = [r.int(6, 14), r.int(6, 14), r.int(5, 10)];
      const body = { date, morning: shifts[0], morningCapacity: cap[0], afterNoon: shifts[1], afterNoonCapacity: cap[1], evening: shifts[2], eveningCapacity: cap[2] };
      if (await safe("schedule", () => post(`${SVC.appointments}/schedule/set`, { token: d.token, body }))) scheduleOf.set(`${d.userId}|${date}`, body);
    }
  }
  log(`   ✓ ${scheduleOf.size} schedule days`);

  // 6. Appointment history (SQL) + upcoming (API) + reviews -----------------------------------
  step(6, "Appointment history and upcoming bookings");
  const SHIFT = ["morning", "afternoon", "evening"], START = [8, 13, 17], TYPE = { 1: "In person", 2: "Telemedicine" };
  const seq = new Map(); // patient|doctor -> counter so ids match what the service would generate
  const nextId = (doc, pat) => { const k = `${doc}-${pat}-`; const n = (seq.get(k) || 0) + 1; seq.set(k, n); return k + n; };
  const rows = [], schedRows = [], past = [];
  for (let back = 75; back >= 1; back--) {
    const date = addDays(today, -back);
    if (date.getDay() === 5 && r.chance(0.5)) continue;
    const working = r.shuffle(people.doctors).slice(0, r.int(3, 6));
    for (const d of working) {
      const shifts = [r.pick([1, 1, 2]), r.pick([1, 1, 0]), r.pick([1, 0, 0])], cap = [r.int(6, 14), r.int(6, 12), r.int(5, 9)];
      schedRows.push(`(${q(d.userId)},${q(iso(date))},${shifts[0]},${cap[0]},${shifts[1]},${cap[1]},${shifts[2]},${cap[2]})`);
      for (let s = 0; s < 3; s++) {
        if (!shifts[s]) continue;
        const booked = Math.min(cap[s], r.int(1, 5));
        const per = Math.floor(240 / cap[s]);
        for (let serial = 1; serial <= booked; serial++) {
          const pat = r.pick(people.patients);
          const id = nextId(d.userId, pat.userId);
          const at = new Date(date); at.setHours(START[s], 0, 0, 0); at.setMinutes((serial - 1) * per);
          const sched = new Date(date); sched.setDate(sched.getDate() - r.int(1, 8)); sched.setHours(r.int(8, 22), r.int(0, 59), 0, 0);
          const cancelled = r.chance(0.07);
          // The JDBC driver stores DATETIME columns in UTC, so convert before writing raw SQL.
          const ts = (x) => x.toISOString().slice(0, 19).replace("T", " ");
          rows.push(`(${q(id)},${q(d.userId)},${q(pat.userId)},${q(iso(date))},${q(SHIFT[s])},${q(TYPE[shifts[s]])},${serial},${q(ts(at))},${q(ts(sched))},${cancelled ? 1 : 0})`);
          if (!cancelled) past.push({ id, pat });
        }
      }
    }
  }
  const cols = "(id,doctor_id,patient_id,date,shift,type,serial_no,appointment_time,scheduling_time,cancelled)";
  for (let i = 0; i < rows.length; i += 200) sql("healthcare_appointments", `INSERT INTO appointment ${cols} VALUES ${rows.slice(i, i + 200).join(",")};`);
  for (let i = 0; i < schedRows.length; i += 200) sql("healthcare_appointments", `INSERT INTO schedule (doctor_id,date,morning_shift,morning_capacity,afternoon_shift,afternoon_capacity,evening_shift,evening_capacity) VALUES ${schedRows.slice(i, i + 200).join(",")};`);
  log(`   ✓ ${rows.length} historical appointments`);

  let upcoming = 0;
  for (const pat of r.shuffle(people.patients).slice(0, 26)) {
    for (let k = 0; k < r.int(1, 2); k++) {
      const d = r.pick(people.doctors), day = r.int(0, 8), date = iso(addDays(today, day));
      const sc = scheduleOf.get(`${d.userId}|${date}`); if (!sc) continue;
      const shiftNo = [sc.morning, sc.afterNoon, sc.evening].findIndex((v) => v > 0) + 1; if (!shiftNo) continue;
      if (await safe("booking", () => post(`${SVC.appointments}/appointments`, { token: pat.token, body: { date, doctorId: d.userId, shift: shiftNo } }))) upcoming++;
    }
  }
  // walk-in patients booked by the admin desk (unregistered users)
  for (let i = 0; i < 6; i++) {
    const d = r.pick(people.doctors), date = iso(addDays(today, r.int(0, 6))), sc = scheduleOf.get(`${d.userId}|${date}`); if (!sc) continue;
    const shiftNo = [sc.morning === 1, sc.afterNoon === 1, sc.evening === 1].findIndex(Boolean) + 1; if (!shiftNo) continue;
    if (await safe("walk-in", () => post(`${SVC.appointments}/appointments`, { token: A, body: { date, doctorId: d.userId, shift: shiftNo } }))) upcoming++;
  }
  log(`   ✓ ${upcoming} upcoming appointments booked through the API`);

  let reviews = 0;
  for (const a of r.shuffle(past).slice(0, 170)) {
    const rating = r.pick([5, 5, 5, 5, 4, 4, 4, 3]);
    if (await safe("review", () => post(`${SVC.appointments}/reviews`, { token: a.pat.token, query: { appointmentId: a.id, rating, comment: r.pick(REVIEW_COMMENTS[rating]) } }))) reviews++;
  }
  log(`   ✓ ${reviews} patient reviews`);
  for (const d of r.shuffle(people.doctors).slice(0, 3)) await safe("delay", () => post(`${SVC.appointments}/delays/update/${r.pick([10, 15, 20, 30])}`, { token: d.token }));

  // 7. Treatments and AI reports ---------------------------------------------------------------
  step(7, "Treatment records and clinical decision support");
  const bySpec = (s) => people.doctors.filter((d) => d.specialization === s);
  let treatments = 0;
  people.patients.forEach((pat, idx) => {
    pat.templates = r.shuffle(CONDITIONS).slice(0, idx < 12 ? r.int(3, 4) : r.int(1, 2));
  });
  for (const pat of people.patients) {
    let months = 14;
    for (const t of pat.templates) {
      const author = r.pick(bySpec(t.spec).length ? bySpec(t.spec) : bySpec("Family Medicine"));
      const issue = addDays(today, -months * 30 + r.int(0, 20)); months = Math.max(1, months - r.int(3, 5));
      const ok = await safe("treatment", () => post(`${SVC.cdss}/treatments`, { token: author.token, body: {
        patientId: pat.userId, condition: t.condition, issueDate: iso(issue), medicines: t.medicines, diagnoses: t.diagnoses,
        progression: r.pick(t.progress), doctorComment: r.pick(t.notes) } }));
      if (ok) treatments++;
    }
  }
  log(`   ✓ ${treatments} treatment records`);
  let reports = 0;
  for (const pat of people.patients.slice(0, 10)) if (await safe("report", () => get(`${SVC.cdss}/cdss/report/generate/${pat.userId}`, { token: pat.token }))) reports++;
  log(`   ✓ ${reports} AI health reports generated locally`);

  // 8. Community --------------------------------------------------------------------------------
  step(8, "Community posts, comments and reactions");
  const posts = [];
  const mk = async (user, type, title, content, art) => {
    const photo = art ? await upload(`post-${posts.length}.svg`, postArt(title || content.slice(0, 30), type)) : undefined;
    await post(`${SVC.community}/posts`, { token: user.token, body: { title, content, type, photo } });
  };
  for (const a of ARTICLES) await safe("article", () => mk(r.pick(bySpec(a.spec).length ? bySpec(a.spec) : people.doctors), "article", a.title, a.content, true));
  for (const a of FIRST_AID) await safe("firstaid", () => mk(r.pick(people.doctors), "firstaid", a.title, a.content, true));
  for (const f of FAQS) await safe("faq", () => mk(admin, "faq", f.title, f.content, false));
  for (const [i, s] of STATUSES.entries()) await safe("status", () => mk(i % 5 === 3 ? r.pick(people.doctors) : i === 2 ? admin : r.pick(people.patients), "status", null, s, r.chance(0.35)));
  for (const f of FEEDBACKS) await safe("feedback", () => mk(r.pick(people.patients), "feedback", null, f, false));
  const everyone = [...people.patients, ...people.doctors];
  for (const type of ["article", "firstaid", "status", "feedback", "faq"]) {
    const list = (await get(`${SVC.community}/posts/list/${type}/0/50/true`, { token: A })).data;
    list.forEach((p) => posts.push({ id: p.postId, type, author: p.authorId }));
  }
  let comments = 0, reactions = 0;
  for (const p of posts) {
    for (let i = 0; i < r.int(0, 4); i++) {
      const who = r.pick(everyone);
      const created = await safe("comment", () => post(`${SVC.community}/comments`, { token: who.token, body: { content: r.pick(COMMENTS), parentPostId: p.id } }));
      if (created) comments++;
    }
    for (let i = 0; i < r.int(1, 9); i++) {
      const who = r.pick(everyone);
      if (await safe("reaction", () => post(`${SVC.community}/posts/react`, { token: who.token, body: { postId: p.id, type: r.pick([1, 1, 1, 3, 3, 4, 5, 2, 6, 7]) } }))) reactions++;
    }
  }
  // doctor replies under comments
  for (const p of r.shuffle(posts).slice(0, 18)) {
    const detail = (await get(`${SVC.community}/posts/${p.id}`, { token: A })).data;
    const c = detail.comments && detail.comments[0]; if (!c) continue;
    await safe("reply", () => post(`${SVC.community}/comments`, { token: r.pick(people.doctors).token, body: { content: r.pick(REPLIES), parentPostId: p.id, parentCommentId: c.id } }));
    comments++;
  }
  log(`   ✓ ${posts.length} posts, ${comments} comments, ${reactions} reactions`);

  // Spread timestamps over the past weeks so feeds, reviews and notifications look lived-in.
  sql("healthcare_community", `UPDATE posts SET time_created = UTC_TIMESTAMP() - INTERVAL FLOOR(RAND() * 60 * 24 * 40) MINUTE;
    UPDATE comments c JOIN posts p ON c.parent_post_id = p.post_id SET c.time_created = LEAST(UTC_TIMESTAMP(), p.time_created + INTERVAL (5 + FLOOR(RAND() * 3000)) MINUTE);`);
  sql("healthcare_appointments", "UPDATE review r JOIN appointment a ON r.id = a.id SET r.date = DATE_FORMAT(DATE_ADD(a.date, INTERVAL 1 DAY), '%d %M %Y');");

  // 9. Wellness challenges -----------------------------------------------------------------------
  step(9, "Wellness challenges and progress");
  const ribbon = await upload("achievement.svg", readFileSync(join(HERE, "../../FrontEnd/public/img/local/ribbon.svg"), "utf8"));
  for (const a of ACHIEVEMENTS) await safe(a.title, () => post(`${SVC.patients}/achievements`, { token: A, body: { ...a, logoURL: ribbon } }));
  const achievements = (await get(`${SVC.patients}/achievements`, { token: A })).data;
  let accepted = 0;
  for (const pat of people.patients.slice(0, 24)) {
    for (const a of r.shuffle(achievements).slice(0, r.int(1, 3))) {
      if (!(await safe("accept", () => put(`${SVC.patients}/progress/accept-challenge/${a.id}`, { token: pat.token })))) continue;
      accepted++;
    }
    const progress = (await get(`${SVC.patients}/progress/${pat.userId}`, { token: pat.token })).data || [];
    for (const pr of progress) {
      const goal = pr.achievement.goalScore, days = r.int(3, 12), per = Math.ceil(goal / (r.chance(0.35) ? days : days * 3));
      for (let k = days; k >= 1; k--) await safe("score", () => post(`${SVC.patients}/progress/add-score/${pr.id}/${per}/${iso(addDays(today, -k))}`, { token: pat.token }));
    }
  }
  log(`   ✓ ${achievements.length} challenges, ${accepted} accepted by patients`);

  // 10. Notifications ------------------------------------------------------------------------------
  step(10, "Site announcements");
  const all = [...people.admins, ...people.doctors, ...people.patients];
  const notices = [
    { title: "Welcome to EA Healthcare", text: "Your account is ready. Explore appointments, the community and your health dashboard.", suffix: "Take a quick tour of the dashboard.", url: "http://localhost:3100/health" },
    { title: "Flu vaccination week", text: "Seasonal flu vaccinations are available at the clinic all week.", suffix: "Book a slot with your family doctor.", url: "http://localhost:3100/health/appointment" },
    { title: "New: AI health report", text: "Generate a personalised overview of your treatment history in one click.", suffix: "Available from your profile.", url: "http://localhost:3100/health" },
  ];
  let sent = 0;
  for (const u of all) for (const n of notices.slice(0, u.userId.startsWith("A") ? 1 : 3)) {
    if (await safe("notice", () => post(`${SVC.notifications}/notifications`, { token: INTERNAL, body: { userId: u.userId, type: "SITE", ...n, prefix: "" } }))) sent++;
  }
  sql("healthcare_notifications", "UPDATE notification SET time_create = UTC_TIMESTAMP() - INTERVAL FLOOR(RAND() * 60 * 24 * 3) MINUTE;");
  log(`   ✓ ${sent} notifications`);

  // 11. Translations (pre-built dictionary, no translator needed) ------------------------------------
  step(11, "Languages and interface translations");
  const dictFile = join(HERE, "data/translations.json");
  if (existsSync(dictFile)) {
    const dict = JSON.parse(readFileSync(dictFile, "utf8"));
    for (const l of dict.languages) await safe("language", () => post(`${SVC.i18n}/v1/languages`, { token: A, body: l, allow: [409] }));
    for (const [id, entry] of Object.entries(dict.resources)) {
      if (id.length < 5) continue; // the i18n service requires ids of at least five characters
      await safe("resource", () => post(`${SVC.i18n}/v1/language/resources`, { token: A, body: { resourceId: id, defaultText: entry.en, createdBy: admin.userId } }));
      for (const l of dict.languages) if (entry[l.languageCode]) await safe("translation", () => post(`${SVC.i18n}/v1/language/translations`, { token: A, body: { languageName: l.languageName, languageCode: l.languageCode, localizedText: entry[l.languageCode], resourceId: id } }));
    }
    log(`   ✓ ${dict.languages.length} languages, ${Object.keys(dict.resources).length} interface strings`);
  } else log("   - docs/seeder/data/translations.json not found, skipped");

  writeFileSync(join(HERE, "last-run.json"), JSON.stringify({
    seededAt: new Date().toISOString(),
    admins: people.admins.map((p) => ({ id: p.userId, email: p.email, password: PASSWORD.admin })),
    doctors: people.doctors.map((p) => ({ id: p.userId, email: p.email, name: `Dr. ${p.firstName} ${p.lastName}`, specialization: p.specialization, password: PASSWORD.doctor })),
    patients: people.patients.map((p) => ({ id: p.userId, email: p.email, name: `${p.firstName} ${p.lastName}`, password: PASSWORD.patient })),
  }, null, 2));
  log(`\nDone in ${Math.round((Date.now() - started) / 1000)}s. Accounts are listed in docs/seeder/last-run.json.`);
  log(`   Admin   ${ADMINS[0].email}  /  ${PASSWORD.admin}`);
  log(`   Doctor  ${"dr." + DOCTORS[0].firstName.toLowerCase() + "." + DOCTORS[0].lastName.toLowerCase() + "@healthcare.local"}  /  ${PASSWORD.doctor}`);
  log(`   Patient ${people.patients[0].email}  /  ${PASSWORD.patient}`);
}

main().catch((e) => { console.error("\nSeeding failed:", e.message); process.exit(1); });
