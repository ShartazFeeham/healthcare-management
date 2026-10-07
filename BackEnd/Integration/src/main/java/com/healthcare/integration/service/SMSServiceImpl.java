package com.healthcare.integration.service;

import com.healthcare.integration.interfaces.SMSService;
import com.healthcare.integration.model.SMSRequest;
import com.healthcare.integration.outbox.Outbox;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SMSServiceImpl implements SMSService {
    private final Outbox outbox;

    @Override
    public String sendSms(SMSRequest request) {
        outbox.record("sms", request.getReceiverNumber(), null, request.getMessageBody());
        return "delivered";
    }
}
