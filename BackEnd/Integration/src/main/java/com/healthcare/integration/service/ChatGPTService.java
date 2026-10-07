package com.healthcare.integration.service;

import com.healthcare.integration.ai.LocalClinicalAnalyst;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatGPTService {
    private final LocalClinicalAnalyst analyst;

    public String chat(String prompt) {
        return analyst.analyse(prompt);
    }
}
