package com.healthcare.integration.outbox;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Local delivery sink. Email, SMS and push messages are never sent to a third party:
 * they are recorded here and can be inspected through GET /v1/outbox.
 */
@Component
public class Outbox {
    public record Entry(long id, String channel, String to, String title, String body, LocalDateTime sentAt) {}

    private static final int CAPACITY = 500;
    private final Deque<Entry> entries = new ArrayDeque<>();
    private final AtomicLong sequence = new AtomicLong();

    public synchronized Entry record(String channel, String to, String title, String body) {
        Entry entry = new Entry(sequence.incrementAndGet(), channel, to, title, body, LocalDateTime.now());
        entries.addFirst(entry);
        if (entries.size() > CAPACITY) entries.removeLast();
        return entry;
    }

    public synchronized List<Entry> list(String channel) {
        return entries.stream().filter(e -> channel == null || channel.equalsIgnoreCase(e.channel())).toList();
    }

    public synchronized void clear() {
        entries.clear();
    }
}
