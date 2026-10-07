package com.healthcare.cdss.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.healthcare.cdss.exceptions.AccessDeniedException;
import com.healthcare.cdss.exceptions.CustomException;
import com.healthcare.cdss.exceptions.InvalidRequestException;
import com.healthcare.cdss.repository.ReportRepository;
import com.healthcare.cdss.entity.Report;
import com.healthcare.cdss.entity.Treatment;
import com.healthcare.cdss.network.GPTRequester;
import com.healthcare.cdss.repository.TreatmentRepository;
import com.healthcare.cdss.utilities.token.IDExtractor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CDSSServiceImpl implements CDSSService {

    private final TreatmentRepository treatmentRepository;
    private final TreatmentService treatmentService;
    private final ReportRepository reportRepository;
    private final GPTRequester gptRequester;

    // Method to get similar treatments for a given patient
    @Override
    public List<Treatment> getSimilar(String patientId) throws InvalidRequestException {
        int batchSize = 10, page = 0;
        List<Treatment> targetTreatments = treatmentRepository.findByPatientId(patientId);
        if (targetTreatments.isEmpty()) {
            throw new InvalidRequestException("Not enough data to run CDSS. Patient must have at least one illness/treatment data to analyze");
        }

        Map<Long, Integer> similarityMap = new HashMap<>();
        while (true) {
            List<Treatment> batch = treatmentRepository.findAll(PageRequest.of(page, batchSize)).stream().toList();
            if (batch.isEmpty()) break;
            for (Treatment treatment : batch) {
                // If it's own data then skip
                if(treatment.getPatientId().equals(patientId)) continue;
                int similarity = targetTreatments.stream()
                        .mapToInt(targetTreatment -> targetTreatment.getSimilarityValue(treatment))
                        .max()
                        .orElse(0);
                similarityMap.put(treatment.getId(), similarity);
            }
            page++;
        }

        // Sort the map by similarity value in descending order
        List<Map.Entry<Long, Integer>> sortedList = similarityMap.entrySet()
                .stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .toList();

        // Retrieve the top 2 treatments with the highest similarity
        return sortedList.stream()
                .limit(2)
                .map(entry -> {
                    Treatment source = treatmentRepository.findById(entry.getKey()).get();
                    // Anonymise a detached copy: mutating the managed entity would make Hibernate try to
                    // write the hidden identifiers back to the database.
                    return new Treatment(-1L, source.getCondition(), LocalDate.parse(source.getIssueDate()), source.getMedicines(),
                            source.getDiagnoses(), source.getProgression(), source.getDoctorComment(), "HIDDEN", "HIDDEN", source.getKeywords());
                })
                .collect(Collectors.toList());
    }

    // Method to generate a report for a given patient
    @Override
    public String getReport(String patientId) throws CustomException {
        List<Treatment> similar = getSimilar(patientId);
        List<Treatment> patientData = treatmentRepository.findByPatientId(patientId);
        String similarPatientString;
        String patientString;
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            similarPatientString = objectMapper.writeValueAsString(similar);
            patientString = objectMapper.writeValueAsString(patientData);
        } catch (Exception e) {
            throw new RuntimeException("Error converting object to JSON string", e);
        }
        String message = "This is a tough request, listen very carefully. I'm giving you a patient's treatment/illness " +
                "data then I'll give you two other most matching patients' data. You'll have to do some analysis on these. " +
                "The analysis will be of 3 steps, each steps with proper detailed description. 1. Analysis on target patient's " +
                "treatment info, kind of an overview. 2. Analysis on those two similar patients' data, do not mention similar " +
                "patients data directly, rather say like: patients who have similar health tract also suffered... like this, " +
                "this section must be a bit larger (at least 150 words). 3. The last section is feedback for the patient, what may " +
                "happen in the future based on your perception and the data analysis too, what treatments he/she may need, what " +
                "specialized doctor is preferred, what kind of diagnoses may need. The 3rd section also should be around 200 words. " +
                "That's it, also note that you should not write anything additional like: Certainly here is the... or Understood here is..." +
                "Just straight to the point and detailed analysis. Here is patient data - " + patientString + "Here is similar profile patient" +
                "data - " + similarPatientString;

        try {
            String result = gptRequester.send(message);
            if (IDExtractor.getUserID().equals(patientId)) {
                Report report = new Report();
                report.setContent(result);
                report.setPatientId(patientId);
                report.setGenerationTime(LocalDateTime.now());

                reportRepository.save(report);
            }
            return result;
        } catch (Exception e) {
            log.error("AI analysis failed for patient {}", patientId, e);
            throw new CustomException("InternalCallException", "Internal call to AI analysis failed.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Method to get all reports for a given patient
    @Override
    public List<Report> getReports(String patientId) throws AccessDeniedException {
        if (IDExtractor.getUserID().startsWith("D") || IDExtractor.getUserID().equals(patientId)) {
            return reportRepository.findByPatientId(patientId);
        }
        throw new AccessDeniedException("You cannot see others' personal data analysis!");
    }
}
