package com.healthcare.integration.controller;

import com.healthcare.integration.outbox.Outbox;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/v1/outbox")
@RequiredArgsConstructor
public class OutboxController {
    private final Outbox outbox;

    @GetMapping
    public List<Outbox.Entry> list(@RequestParam(required = false) String channel) {
        return outbox.list(channel);
    }

    @DeleteMapping
    public String clear() {
        outbox.clear();
        return "Outbox cleared.";
    }
}
