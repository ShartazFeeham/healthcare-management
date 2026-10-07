package com.healthcare.integration.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Offline stand-in for the former hosted GPT call. It reads the same prompt the CDSS service builds
 * (target patient's treatments + two most similar treatments) and writes the three-section analysis
 * from the data itself plus a small clinical knowledge base. Nothing leaves the machine.
 */
@Component
public class LocalClinicalAnalyst {
    private static final String PATIENT_MARK = "Here is patient data - ";
    private static final String SIMILAR_MARK = "Here is similar profile patientdata - ";
    private final ObjectMapper mapper = new ObjectMapper();

    public String analyse(String prompt) {
        int p = prompt.indexOf(PATIENT_MARK), s = prompt.indexOf(SIMILAR_MARK);
        if (p < 0 || s < 0) return "The analysis service received an unrecognised request, so no analysis could be produced.";
        List<JsonNode> patient = parse(prompt.substring(p + PATIENT_MARK.length(), s));
        List<JsonNode> similar = parse(prompt.substring(s + SIMILAR_MARK.length()));
        if (patient.isEmpty()) return "There is no treatment history for this patient yet, so there is nothing to analyse.";
        return "1. Overview of the patient's treatment history\n" + overview(patient)
                + "\n\n2. Insights from patients with a similar health track\n" + similarInsights(patient, similar)
                + "\n\n3. Feedback and outlook\n" + feedback(patient, similar);
    }

    private List<JsonNode> parse(String json) {
        try {
            JsonNode node = mapper.readTree(json.trim());
            return node.isArray() ? StreamSupport.stream(node.spliterator(), false).toList() : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }

    private static String text(JsonNode n, String f) { return n.path(f).asText("").trim(); }

    private static String list(Collection<String> items) {
        List<String> l = new ArrayList<>(items);
        if (l.isEmpty()) return "none recorded";
        if (l.size() == 1) return l.get(0);
        return String.join(", ", l.subList(0, l.size() - 1)) + " and " + l.get(l.size() - 1);
    }

    private static Set<String> distinct(List<JsonNode> nodes, String field, boolean splitList) {
        Set<String> out = new LinkedHashSet<>();
        for (JsonNode n : nodes) {
            String v = text(n, field);
            if (v.isEmpty()) continue;
            if (splitList) for (String part : v.split("[,;]")) { if (!part.isBlank()) out.add(part.trim()); }
            else out.add(v);
        }
        return out;
    }

    private String overview(List<JsonNode> patient) {
        List<JsonNode> sorted = new ArrayList<>(patient);
        sorted.sort(Comparator.comparing(n -> text(n, "issueDate")));
        JsonNode first = sorted.get(0), last = sorted.get(sorted.size() - 1);
        StringBuilder sb = new StringBuilder();
        sb.append("The record contains ").append(sorted.size()).append(sorted.size() == 1 ? " treatment entry" : " treatment entries")
          .append(" between ").append(text(first, "issueDate")).append(" and ").append(text(last, "issueDate"))
          .append(". Conditions documented: ").append(list(distinct(sorted, "condition", false))).append(". ");
        sb.append("Medicines prescribed so far include ").append(list(distinct(sorted, "medicines", true))).append(". ");
        Set<String> diagnoses = distinct(sorted, "diagnoses", true);
        if (!diagnoses.isEmpty()) sb.append("Investigations and diagnoses on file: ").append(list(diagnoses)).append(". ");
        sb.append("\n");
        for (JsonNode n : sorted) {
            sb.append("- ").append(text(n, "issueDate")).append(", ").append(text(n, "condition")).append(": ")
              .append(text(n, "progression"));
            String c = text(n, "doctorComment");
            if (!c.isEmpty()) sb.append(" Doctor's note: ").append(c);
            sb.append("\n");
        }
        return sb.toString().trim();
    }

    private String similarInsights(List<JsonNode> patient, List<JsonNode> similar) {
        if (similar.isEmpty())
            return "There are not yet enough comparable cases on the platform to draw cohort-level insights. "
                    + "As more anonymised treatment records are added, this section will compare outcomes of patients with a similar health track.";
        Set<String> own = distinct(patient, "medicines", true).stream().map(String::toLowerCase).collect(Collectors.toSet());
        Set<String> theirMeds = distinct(similar, "medicines", true);
        Set<String> extra = theirMeds.stream().filter(m -> !own.contains(m.toLowerCase())).collect(Collectors.toCollection(LinkedHashSet::new));
        StringBuilder sb = new StringBuilder();
        sb.append("Patients who have a similar health track also dealt with ").append(list(distinct(similar, "condition", false)))
          .append(". Their treatment relied on ").append(list(theirMeds)).append(". ");
        Set<String> diag = distinct(similar, "diagnoses", true);
        if (!diag.isEmpty()) sb.append("Their care pathways commonly included ").append(list(diag)).append(". ");
        for (JsonNode n : similar) {
            String prog = text(n, "progression");
            if (!prog.isEmpty()) sb.append("In one comparable case the course was described as: \"").append(prog).append("\". ");
        }
        if (!extra.isEmpty())
            sb.append("Notably, treatments such as ").append(list(extra))
              .append(" were used in those cases but do not appear in this patient's record, which is worth discussing with the treating doctor. ");
        else sb.append("The medicines used in those cases largely match this patient's own plan, which is reassuring about the current approach. ");
        sb.append("Cases with this profile tend to respond best when follow-up reviews are kept regular and the full course of treatment is completed.");
        return sb.toString();
    }

    private String feedback(List<JsonNode> patient, List<JsonNode> similar) {
        List<JsonNode> sorted = new ArrayList<>(patient);
        sorted.sort(Comparator.comparing(n -> text(n, "issueDate")));
        JsonNode last = sorted.get(sorted.size() - 1);
        String lastCondition = text(last, "condition");
        String blob = patient.stream().map(n -> text(n, "condition") + " " + text(n, "diagnoses")).collect(Collectors.joining(" "));
        ClinicalKnowledge.Guidance g = ClinicalKnowledge.lookup(lastCondition.isEmpty() ? blob : lastCondition);
        if (g == ClinicalKnowledge.GENERAL) g = ClinicalKnowledge.lookup(blob);
        long conditions = distinct(patient, "condition", false).size();
        StringBuilder sb = new StringBuilder();
        sb.append("Based on the most recent entry (").append(lastCondition).append(", ").append(text(last, "issueDate"))
          .append(") and the pattern across the record, the outlook is ")
          .append(conditions > 2 ? "cautiously stable but with several overlapping conditions that deserve a coordinated care plan. "
                                 : "generally favourable provided treatment is followed consistently. ");
        sb.append("What to watch: ").append(g.watchFor()).append(". ");
        sb.append("A ").append(g.specialist()).append(" is the preferred specialist for the next review. ");
        sb.append("Diagnostics that may be needed: ").append(g.diagnostics()).append(". ");
        sb.append("Supportive measures: ").append(g.lifestyle()).append(". ");
        if (!similar.isEmpty()) sb.append("Because comparable patients needed ongoing monitoring, scheduling a follow-up within the next four to six weeks is advisable. ");
        sb.append("This analysis is decision support generated from recorded data and does not replace a clinical examination.");
        return sb.toString();
    }
}
