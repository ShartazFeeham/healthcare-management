package com.healthcare.integration.service;

import com.healthcare.integration.interfaces.FCMService;
import com.healthcare.integration.model.FCMRequest;
import com.healthcare.integration.outbox.Outbox;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FCMServiceImpl implements FCMService {
    private final Outbox outbox;

    @Override
    public void sendFCMNotification(FCMRequest request) {
        var n = request.getNotification();
        outbox.record("push", request.getTo(), n == null ? null : n.getTitle(), n == null ? null : n.getBody());
    }
}
