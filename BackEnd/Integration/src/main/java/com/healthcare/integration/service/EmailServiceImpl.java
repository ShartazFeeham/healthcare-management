package com.healthcare.integration.service;

import com.healthcare.integration.interfaces.EmailService;
import com.healthcare.integration.model.EmailRequest;
import com.healthcare.integration.outbox.Outbox;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final Outbox outbox;

    @Override
    public void sendEmailSMTP(EmailRequest request) {
        outbox.record("email", request.getTo(), request.getSubject(), request.getMessage());
    }

    @Override
    public void sendEmailAzure(EmailRequest request) {
        sendEmailSMTP(request);
    }
}
