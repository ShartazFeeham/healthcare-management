package com.healtcare.appointments.services.implementations;

import com.healtcare.appointments.exception.AccessDeniedException;
import com.healtcare.appointments.entities.Appointment;
import com.healtcare.appointments.services.interfaces.AppointmentService;
import com.healtcare.appointments.services.interfaces.DelayService;
import com.healtcare.appointments.services.interfaces.TeleSecurityService;
import com.healtcare.appointments.utilities.token.IDExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TeleSecurityImpl implements TeleSecurityService {

    private final AppointmentService appointmentService;
    private final DelayService delayService;

    // Method to verify if a user has the right to join a telehealth appointment
    @Override
    public void verify(String appointmentId) {
        // Get appointment details
        Appointment appointment = appointmentService.getAppointment(appointmentId);
        LocalDateTime now = LocalDateTime.now();

        // Calculate the delay in minutes for the appointment
        Integer delayInMinutes = delayService.getDelayInMinutes(appointment.getDoctorId(), appointment.getShift(), appointment.getAppointmentTime());
        LocalDateTime appointmentTime = appointment.getAppointmentTime().plusMinutes(delayInMinutes);

        // Check whether the user has the right to join the appointment or not.
        if (!appointmentId.contains(IDExtractor.getUserID())) {
            throw new AccessDeniedException("You can not join someone else's appointment!");
        }

        // Joining is allowed from 5 minutes before the (delay-adjusted) start until 20 minutes after it.
        if (now.isBefore(appointmentTime.minusMinutes(5)) || now.isAfter(appointmentTime.plusMinutes(20))) {
            throw new AccessDeniedException("You can only join from 5 minutes before until 20 minutes after the appointment time starts.");
        }
    }
}
