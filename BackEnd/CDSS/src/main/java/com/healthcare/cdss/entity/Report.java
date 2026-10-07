package com.healthcare.cdss.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity @Setter @AllArgsConstructor @NoArgsConstructor
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Getter
    private Long id;
    @Getter
    private String patientId;
    @Getter
    @Column(columnDefinition = "TEXT")
    private String content;
    private LocalDateTime generationTime;

    public String getGenerationTime(){
        return generationTime.toString();
    }
}
