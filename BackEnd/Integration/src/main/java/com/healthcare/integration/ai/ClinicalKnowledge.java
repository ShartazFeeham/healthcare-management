package com.healthcare.integration.ai;

import java.util.LinkedHashMap;
import java.util.Map;

/** Small offline clinical knowledge base used by {@link LocalClinicalAnalyst}. Keyword -> guidance. */
final class ClinicalKnowledge {
    record Guidance(String specialist, String watchFor, String diagnostics, String lifestyle) {}

    static final Map<String, Guidance> BY_KEYWORD = new LinkedHashMap<>();

    private static void add(String keywords, String specialist, String watchFor, String diagnostics, String lifestyle) {
        Guidance g = new Guidance(specialist, watchFor, diagnostics, lifestyle);
        for (String k : keywords.split(",")) BY_KEYWORD.put(k.trim(), g);
    }

    static {
        // Most specific entries first: the first matching keyword wins.
        add("gestational,pregnan,antenatal,prenatal", "obstetrician",
                "high blood pressure, reduced fetal movement, bleeding or poor glucose control require same-day review",
                "scheduled ultrasound scans, glucose tolerance testing and routine antenatal bloods",
                "folic acid, a balanced meal plan, light exercise, adequate rest and regular glucose checks");
        add("chronic kidney,ckd,renal failure,nephro", "nephrologist",
                "a falling eGFR, rising protein in the urine or fluid retention signal progression",
                "serum creatinine and eGFR every three months, urine albumin-to-creatinine ratio and a renal ultrasound",
                "tight blood pressure control, a low-salt renal diet, avoiding NSAIDs and staying well hydrated");
        add("child,pediatric,infant,toddler", "pediatrician",
                "fever lasting more than three days, drowsiness, refusal to feed or breathing difficulty need urgent review",
                "a physical examination, growth-chart review and a complete blood count if fever persists",
                "fluids, light meals, rest, age-appropriate dosing and keeping vaccinations up to date");
        add("hypertension,blood pressure", "cardiologist",
                "sustained high pressure can strain the heart, kidneys and eyes over time",
                "a 24-hour ambulatory blood pressure study, ECG, renal function panel and a lipid profile",
                "reducing dietary salt, regular aerobic exercise, weight control and a daily home blood pressure log");
        add("diabetes,glucose,hyperglycemia", "endocrinologist",
                "unstable glucose control raises the risk of neuropathy, retinopathy and kidney damage",
                "HbA1c every three months, fasting and post-meal glucose, urine albumin and a dilated eye exam",
                "a structured low-glycemic diet, daily walking and consistent medication timing");
        add("asthma,wheez", "pulmonologist",
                "recurrent night-time symptoms or reliever overuse suggest the condition is under-controlled",
                "spirometry with reversibility testing, peak-flow monitoring and an allergen panel",
                "trigger avoidance, correct inhaler technique and an written asthma action plan");
        add("copd,bronchitis,emphysema", "pulmonologist",
                "frequent flare-ups accelerate lung function decline",
                "spirometry, chest X-ray and oxygen saturation at rest and on exertion",
                "smoking cessation, pulmonary rehabilitation and annual vaccinations");
        add("migraine,headache", "neurologist",
                "increasing frequency or a change in aura pattern should be reviewed promptly",
                "a headache diary, neurological examination and imaging if red-flag symptoms appear",
                "regular sleep, hydration, identifying food or stress triggers and limiting painkiller overuse");
        add("anemia,anaemia,iron", "hematologist",
                "persistent fatigue or breathlessness may signal worsening iron or B12 deficiency",
                "a complete blood count, ferritin, B12 and folate levels and a reticulocyte count",
                "iron-rich foods paired with vitamin C and follow-up blood counts after treatment");
        add("arthritis,joint,rheumat", "rheumatologist",
                "morning stiffness lasting beyond an hour points to inflammatory activity",
                "ESR, CRP, rheumatoid factor, anti-CCP and joint imaging",
                "low-impact exercise, physiotherapy and weight management to unload the joints");
        add("gastritis,ulcer,reflux,gerd,acidity", "gastroenterologist",
                "persistent pain, black stools or weight loss would warrant an endoscopy",
                "H. pylori testing, upper GI endoscopy and a complete blood count",
                "smaller meals, avoiding late-night eating, reduced NSAID use and limiting spicy food and caffeine");
        add("thyroid,hypothyroid,hyperthyroid", "endocrinologist",
                "dose mismatch shows up as fatigue, weight change or palpitations",
                "TSH, free T4 every 6 to 8 weeks after dose changes and a thyroid ultrasound",
                "taking medication on an empty stomach and keeping iodine intake consistent");
        add("depress,anxiety,panic,stress", "psychiatrist",
                "worsening sleep, withdrawal or any thoughts of self-harm need urgent attention",
                "a PHQ-9 / GAD-7 screening and a review of sleep and substance use",
                "cognitive behavioral therapy, regular physical activity and a stable sleep routine");
        add("back pain,lumbar,spine,sciatica", "orthopedic specialist",
                "leg weakness, numbness or bladder changes are red flags requiring urgent imaging",
                "lumbar MRI if symptoms persist beyond six weeks and a neurological examination",
                "core-strengthening physiotherapy, ergonomic seating and avoiding prolonged bed rest");
        add("fracture,sprain,ligament", "orthopedic specialist",
                "delayed healing or increasing pain after immobilisation suggests a complication",
                "follow-up X-ray at four to six weeks and a bone density assessment where relevant",
                "protected weight bearing, calcium and vitamin D and guided rehabilitation");
        add("urinary,uti,cystitis,kidney", "urologist",
                "recurrent infections or flank pain may indicate a structural cause or stones",
                "urinalysis with culture, renal ultrasound and serum creatinine",
                "generous hydration, completing antibiotic courses and good hygiene habits");
        add("pneumonia,chest infection,cough", "pulmonologist",
                "fever returning after improvement or breathlessness may mean incomplete recovery",
                "a follow-up chest X-ray, inflammatory markers and oxygen saturation",
                "rest, fluids, pneumococcal and influenza vaccination and avoiding smoke exposure");
        add("dengue,fever,viral,malaria,typhoid", "infectious disease specialist",
                "warning signs such as bleeding, persistent vomiting or a sharp platelet drop need hospital review",
                "daily platelet counts, hematocrit and serology during the acute phase",
                "oral rehydration, mosquito protection and strict rest until full recovery");
        add("eczema,dermatitis,psoriasis,rash,acne,skin", "dermatologist",
                "spreading lesions or signs of secondary infection should be assessed early",
                "patch testing, skin examination and a biopsy for unclear or persistent lesions",
                "regular emollient use, identifying irritants and gentle, fragrance-free skincare");
        add("allerg,rhinitis,sinus", "ENT specialist",
                "symptoms lasting more than ten days or recurring each season suggest an allergic driver",
                "skin-prick or specific IgE testing and nasal endoscopy when obstruction persists",
                "allergen avoidance, saline irrigation and keeping living spaces dust-free");
        add("cholesterol,lipid,dyslipidemia", "cardiologist",
                "elevated LDL combined with other risk factors multiplies cardiovascular risk",
                "a fasting lipid profile every three to six months and a cardiovascular risk score",
                "a diet rich in fibre and unsaturated fats and 150 minutes of exercise weekly");
        add("heart,cardiac,angina,arrhythm,palpitation", "cardiologist",
                "chest pain on exertion or fainting needs urgent evaluation",
                "ECG, echocardiogram, a treadmill stress test and cardiac biomarkers",
                "supervised cardiac rehabilitation, salt restriction and avoiding stimulants");
        add("obes,overweight,weight", "nutritionist",
                "weight gain compounds risks for diabetes, hypertension and joint disease",
                "BMI and waist circumference tracking, fasting glucose and a lipid profile",
                "a calorie-aware balanced diet, strength training and realistic weekly goals");
        add("eye,vision,cataract,glaucoma", "ophthalmologist",
                "sudden vision changes or eye pain warrant same-day assessment",
                "visual acuity, tonometry and a dilated fundus examination",
                "screen breaks, UV protection and regular annual eye examinations");
        add("dental,tooth,gum", "dentist",
                "swelling or persistent pain indicates a possible abscess",
                "dental X-ray and periodontal charting",
                "twice-daily brushing, flossing and six-monthly cleanings");
    }

    static final Guidance GENERAL = new Guidance("general physician",
            "any change in the pattern or severity of symptoms should prompt an earlier review",
            "routine blood work, a vital-sign review and targeted tests chosen by the treating doctor",
            "balanced nutrition, regular physical activity, adequate sleep and adherence to prescribed medication");

    private ClinicalKnowledge() {}

    static Guidance lookup(String text) {
        String t = text == null ? "" : text.toLowerCase();
        for (Map.Entry<String, Guidance> e : BY_KEYWORD.entrySet()) if (t.contains(e.getKey())) return e.getValue();
        return GENERAL;
    }
}
