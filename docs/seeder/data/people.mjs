// Dummy people with realistic profiles. Every email uses the reserved .local domain.
export const PASSWORD = { admin: "Admin@1234", doctor: "Doctor@1234", patient: "Patient@1234" };

export const ADMINS = [
  { firstName: "Nadia", lastName: "Rahman", email: "admin@healthcare.local" },
  { firstName: "Marcus", lastName: "Webb", email: "operations@healthcare.local" },
];

const uni = {
  dhaka: "Dhaka Medical College", sir: "Sir Salimullah Medical College", jhu: "Johns Hopkins University School of Medicine",
  aku: "Aga Khan University", kings: "King's College London", nus: "National University of Singapore (Yong Loo Lin School of Medicine)",
  aiims: "All India Institute of Medical Sciences", mcgill: "McGill University Faculty of Medicine", toronto: "University of Toronto",
  charite: "Charité – Universitätsmedizin Berlin", melb: "University of Melbourne", bsmmu: "Bangabandhu Sheikh Mujib Medical University",
};

// specialization strings must match the platform's specialization list
export const DOCTORS = [
  { firstName: "Farhat", lastName: "Snigdah", gender: "Female", specialization: "Cardiology", experience: 14, residence: "Gulshan, Dhaka", dob: "1983-03-12",
    bio: "Interventional cardiologist focused on preventive cardiology and heart-failure management. I believe in explaining every result in plain language so patients can take part in their own care.",
    quals: [["MBBS", uni.dhaka, "2007"], ["MD Cardiology", uni.bsmmu, "2013"], ["Fellowship, Interventional Cardiology", uni.jhu, "2016"]],
    certs: [["Advanced Cardiac Life Support", "American Heart Association", "2019"], ["Echocardiography Level III", "European Society of Cardiology", "2017"]] },
  { firstName: "Adrian", lastName: "Whitfield", gender: "Male", specialization: "Neurology", experience: 18, residence: "Banani, Dhaka", dob: "1979-09-02",
    bio: "Neurologist with a special interest in epilepsy, migraine and neuro-rehabilitation. Former visiting consultant at King's College Hospital.",
    quals: [["MBBS", uni.kings, "2003"], ["MRCP (UK)", uni.kings, "2007"], ["PhD Neuroscience", uni.kings, "2011"]],
    certs: [["Clinical Neurophysiology", "European Board of Neurology", "2012"]] },
  { firstName: "Priyanka", lastName: "Sen", gender: "Female", specialization: "Pediatrics", experience: 11, residence: "Dhanmondi, Dhaka", dob: "1986-01-25",
    bio: "Pediatrician who loves the first thousand days of life: nutrition, growth, vaccination and early-childhood development. Calm with anxious parents, patient with nervous toddlers.",
    quals: [["MBBS", uni.sir, "2010"], ["DCH", uni.dhaka, "2013"], ["MD Pediatrics", uni.bsmmu, "2017"]],
    certs: [["Pediatric Advanced Life Support", "American Academy of Pediatrics", "2020"]] },
  { firstName: "Tariq", lastName: "Mahmud", gender: "Male", specialization: "Orthopedic Surgery", experience: 16, residence: "Uttara, Dhaka", dob: "1981-06-18",
    bio: "Orthopedic surgeon specialising in sports injuries, arthroscopy and joint replacement. Works closely with physiotherapists to get people moving again quickly.",
    quals: [["MBBS", uni.dhaka, "2005"], ["MS Orthopedics", uni.bsmmu, "2011"], ["Fellowship, Sports Medicine", uni.melb, "2014"]],
    certs: [["Arthroscopic Surgery", "Arthroscopy Association", "2015"]] },
  { firstName: "Elena", lastName: "Vasquez", gender: "Female", specialization: "Dermatology", experience: 9, residence: "Bashundhara, Dhaka", dob: "1988-11-07",
    bio: "Dermatologist treating acne, eczema, psoriasis and pigmentation disorders. Combines evidence-based medicine with a realistic, low-fuss skincare approach.",
    quals: [["MD", uni.toronto, "2012"], ["Dermatology Residency", uni.toronto, "2017"]],
    certs: [["Dermatologic Surgery", "Canadian Dermatology Association", "2018"]] },
  { firstName: "Imran", lastName: "Chowdhury", gender: "Male", specialization: "Gastroenterology", experience: 13, residence: "Mohakhali, Dhaka", dob: "1984-04-30",
    bio: "Gastroenterologist and endoscopist with a focus on liver disease, reflux and inflammatory bowel disease. Passionate about screening and early detection.",
    quals: [["MBBS", uni.dhaka, "2008"], ["MD Gastroenterology", uni.bsmmu, "2014"]],
    certs: [["Therapeutic Endoscopy", "World Gastroenterology Organisation", "2016"]] },
  { firstName: "Hannah", lastName: "Lindqvist", gender: "Female", specialization: "Obstetrics and Gynecology", experience: 15, residence: "Baridhara, Dhaka", dob: "1982-08-14",
    bio: "Obstetrician and gynecologist supporting women through pregnancy, childbirth and menopause. Advocate for informed choice and respectful maternity care.",
    quals: [["MD", uni.charite, "2006"], ["Residency, Obstetrics and Gynecology", uni.charite, "2011"]],
    certs: [["Maternal-Fetal Medicine", "ISUOG", "2014"], ["Basic Life Support", "European Resuscitation Council", "2021"]] },
  { firstName: "Rakib", lastName: "Hossain", gender: "Male", specialization: "Pulmonology", experience: 10, residence: "Mirpur, Dhaka", dob: "1987-02-09",
    bio: "Pulmonologist managing asthma, COPD, sleep apnoea and post-infection lung recovery. Offers spirometry and a written action plan to every patient.",
    quals: [["MBBS", uni.sir, "2011"], ["MD Pulmonology", uni.bsmmu, "2017"]],
    certs: [["Pulmonary Function Testing", "American Thoracic Society", "2018"]] },
  { firstName: "Aisha", lastName: "Karim", gender: "Female", specialization: "Endocrinology", experience: 12, residence: "Lalmatia, Dhaka", dob: "1985-12-03",
    bio: "Endocrinologist caring for diabetes, thyroid disease and metabolic conditions. Uses continuous glucose data and shared decision-making to personalise treatment.",
    quals: [["MBBS", uni.dhaka, "2009"], ["MD Endocrinology", uni.bsmmu, "2015"], ["Diabetes Fellowship", uni.aku, "2017"]],
    certs: [["Certified Diabetes Educator", "IDF", "2018"]] },
  { firstName: "Samuel", lastName: "Okafor", gender: "Male", specialization: "Psychiatry", experience: 17, residence: "Gulshan, Dhaka", dob: "1980-05-21",
    bio: "Psychiatrist providing evidence-based care for anxiety, depression, trauma and sleep disorders. Believes mental health care starts with being listened to.",
    quals: [["MBBS", uni.aku, "2004"], ["MRCPsych", uni.kings, "2010"]],
    certs: [["Cognitive Behavioural Therapy", "Beck Institute", "2013"]] },
  { firstName: "Mei", lastName: "Tanaka", gender: "Female", specialization: "Ophthalmology", experience: 8, residence: "Banani, Dhaka", dob: "1989-07-16",
    bio: "Ophthalmologist focused on cataract surgery, glaucoma screening and pediatric eye care. Strong believer in annual eye examinations after the age of forty.",
    quals: [["MBBS", uni.nus, "2013"], ["MMed Ophthalmology", uni.nus, "2018"]],
    certs: [["Phacoemulsification Surgery", "Asia-Pacific Academy of Ophthalmology", "2019"]] },
  { firstName: "Nasir", lastName: "Uddin", gender: "Male", specialization: "Nephrology", experience: 19, residence: "Dhanmondi, Dhaka", dob: "1977-10-27",
    bio: "Nephrologist experienced in chronic kidney disease, dialysis and transplant follow-up. Works hard to slow progression through early, practical interventions.",
    quals: [["MBBS", uni.dhaka, "2001"], ["MD Nephrology", uni.bsmmu, "2008"], ["Transplant Fellowship", uni.aiims, "2011"]],
    certs: [["Renal Replacement Therapy", "International Society of Nephrology", "2012"]] },
  { firstName: "Olivia", lastName: "Bennett", gender: "Female", specialization: "Family Medicine", experience: 7, residence: "Gulshan, Dhaka", dob: "1990-03-05",
    bio: "Family physician offering whole-family primary care: check-ups, chronic disease management, minor procedures and preventive screening for every age.",
    quals: [["MBBS", uni.melb, "2014"], ["Fellowship, Family Medicine", uni.melb, "2018"]],
    certs: [["Travel Medicine", "ISTM", "2019"]] },
  { firstName: "Karim", lastName: "Al-Farsi", gender: "Male", specialization: "Rheumatology", experience: 12, residence: "Uttara, Dhaka", dob: "1985-01-19",
    bio: "Rheumatologist treating rheumatoid arthritis, lupus, gout and osteoarthritis. Focuses on keeping people active and out of pain with the lightest effective treatment.",
    quals: [["MBBS", uni.aku, "2009"], ["MD Rheumatology", uni.bsmmu, "2015"]],
    certs: [["Musculoskeletal Ultrasound", "EULAR", "2017"]] },
  { firstName: "Sophie", lastName: "Laurent", gender: "Female", specialization: "Infectious Disease", experience: 10, residence: "Banani, Dhaka", dob: "1987-09-23",
    bio: "Infectious disease specialist covering dengue, typhoid, tuberculosis and travel-related illness. Active in antibiotic stewardship and vaccination campaigns.",
    quals: [["MD", uni.mcgill, "2012"], ["Infectious Disease Fellowship", uni.mcgill, "2017"]],
    certs: [["Tropical Medicine Diploma", "London School of Hygiene and Tropical Medicine", "2018"]] },
  { firstName: "Zahid", lastName: "Ferdous", gender: "Male", specialization: "Urology", experience: 11, residence: "Mohammadpur, Dhaka", dob: "1986-06-11",
    bio: "Urologist treating kidney stones, prostate conditions and urinary tract disorders, using minimally invasive techniques wherever possible.",
    quals: [["MBBS", uni.sir, "2010"], ["MS Urology", uni.bsmmu, "2016"]],
    certs: [["Endourology", "Endourological Society", "2018"]] },
];

const FIRST_F = ["Amina", "Sara", "Lamia", "Tasnim", "Meera", "Nusrat", "Julia", "Farzana", "Riya", "Anika", "Mariam", "Sadia", "Tania", "Eva", "Nabila", "Jannat", "Priya", "Laila", "Ishrat", "Zara"];
const FIRST_M = ["Rahim", "Arif", "Sabbir", "Tanvir", "Nafis", "Ayaan", "Rohan", "Shahriar", "Imtiaz", "Daniel", "Kabir", "Faisal", "Jamil", "Omar", "Yusuf", "Ethan", "Rafi", "Mushfiq", "Hasib", "Noman"];
const LAST = ["Ahmed", "Khan", "Islam", "Rahman", "Sarker", "Mondal", "Hasan", "Das", "Bhuiyan", "Siddique", "Akter", "Mitra", "Talukder", "Majumder", "Biswas", "Chowdhury", "Haque", "Ali", "Paul", "Sultana"];
const AREAS = ["Dhanmondi", "Gulshan", "Mirpur", "Uttara", "Mohammadpur", "Banani", "Bashundhara", "Rampura", "Malibagh", "Badda", "Khilgaon", "Motijheel", "Wari", "Tejgaon"];
const JOBS = ["Software Engineer", "Teacher", "Bank Officer", "Graphic Designer", "Shop Owner", "Civil Engineer", "Student", "Nurse", "Accountant", "Driver", "Journalist", "Pharmacist", "Architect", "Retired", "Homemaker", "Marketing Executive", "Electrician", "Freelancer"];
const BLOOD = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB+", "B+", "O+"];
const ALLERGY = ["Penicillin", "Dust", "Peanuts", "Pollen", "Shellfish", "Latex", "Aspirin", "Eggs", "Milk"];

// Deterministic list of 36 patients. Index 0..3 are the 'story' patients used on the showcase.
export function patientRoster(r) {
  const out = [];
  const used = new Set();
  for (let i = 0; i < 36; i++) {
    const female = i % 2 === 0;
    let first, last, key;
    do { first = r.pick(female ? FIRST_F : FIRST_M); last = r.pick(LAST); key = first + last; } while (used.has(key));
    used.add(key);
    const age = r.int(19, 74);
    const height = female ? r.int(150, 172) : r.int(162, 188);
    const bmi = r.int(19, 33);
    out.push({
      firstName: first, lastName: last, gender: female ? "Female" : "Male", age,
      email: `${first}.${last}@mail.healthcare.local`.toLowerCase(),
      height, weight: Math.round((bmi * (height / 100) ** 2)),
      bloodGroup: r.pick(BLOOD), bloodSugar: r.pick(["Normal", "Normal", "Normal", "Borderline", "High"]),
      bloodPressure: r.pick(["120/80", "118/76", "126/82", "132/86", "140/90", "110/70", "124/78"]),
      allergies: r.chance(0.5) ? r.pick(ALLERGY) : "None",
      occupation: r.pick(JOBS), residence: `${r.int(1, 90)} ${r.pick(AREAS)}, Dhaka`,
      phoneNo: `+88017${r.int(10000000, 99999999)}`,
      smoking: age > 30 && r.chance(0.22), drinking: r.chance(0.08), asthma: r.chance(0.14),
    });
  }
  return out;
}

export { uni };
