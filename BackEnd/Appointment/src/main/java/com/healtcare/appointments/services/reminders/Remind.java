package com.healtcare.appointments.services.reminders;

import com.healtcare.appointments.entities.Appointment;
import com.healtcare.appointments.network.NotificationRequest;
import com.healtcare.appointments.network.NotificationSender;
import com.healtcare.appointments.repositories.AppointmentRepository;
import com.healtcare.appointments.utilities.TimeFormatter;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component @AllArgsConstructor
public class Remind {
    private final TimeFormatter timeFormatter;
    private final AppointmentRepository appointmentRepository;
    private final NotificationSender notificationSender;

    public void sendNotifications(Integer remainingTimeInMinutes){
        LocalDateTime startTime = LocalDateTime.now();
        LocalDateTime endTime = LocalDateTime.now().plusMinutes(remainingTimeInMinutes);

        List<Appointment> appointments = appointmentRepository.findByAppointmentTimeBetween(startTime, endTime);
        notifyUpcomingPatients(appointments);
    }

    private void notifyUpcomingPatients(List<Appointment> appointments) {
        for (Appointment appointment : appointments) {
            if(appointment.isCancelled()) continue;
            String userId = appointment.getPatientId();
            String appointmentOriginalTime = timeFormatter
                    .formatTo12HourFormat(appointment.getAppointmentTime().toLocalTime());
            String timeRemaining = timeFormatter.format(appointment.getAppointmentTime());
            String url = "http://localhost:3100/health/patient";

            NotificationRequest notification = NotificationRequest.builder()
                    .userId(userId)
                    .title("Appointment remainder!")
                    .prefix("You have an appointment " + timeRemaining)
                    .type("APPOINTMENT")
                    .url(url)
                    .text("Your appointment " + appointment.getId() + " is at " + appointmentOriginalTime + " join in time and don't miss!")
                    .suffix("Visit your user home page to see details")
                    .build();

            notificationSender.send(notification);
        }
    }
}
