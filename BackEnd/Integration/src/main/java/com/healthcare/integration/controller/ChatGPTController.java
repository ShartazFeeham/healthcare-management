package com.healthcare.integration.controller;

import com.healthcare.integration.service.ChatGPTService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ChatGPTController {
    private final ChatGPTService chatGPTService;

    @PostMapping("/v1/ai/chat")
    public ResponseEntity<String> chat(@RequestBody String message) {
        return ResponseEntity.ok(chatGPTService.chat(message));
    }
}
