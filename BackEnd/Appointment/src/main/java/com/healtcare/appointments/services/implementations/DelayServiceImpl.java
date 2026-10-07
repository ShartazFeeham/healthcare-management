package com.healtcare.appointments.services.implementations;

import com.healtcare.appointments.exception.ItemNotFoundException;
import com.healtcare.appointments.repositories.AppointmentRepository;
import com.healtcare.appointments.repositories.DelayRepository;
import com.healtcare.appointments.entities.Appointment;
import com.healtcare.appointments.entities.Delay;
import com.healtcare.appointments.network.NotificationRequest;
import com.healtcare.appointments.network.NotificationSender;
import com.healtcare.appointments.services.interfaces.DelayService;
import com.healtcare.appointments.utilities.TimeFormatter;
import com.healtcare.appointments.utilities.constants.AppointmentConstants;
import com.healtcare.appointments.utilities.token.IDExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service @RequiredArgsConstructor
public class DelayServiceImpl implements DelayService {

    private final DelayRepository delayRepository;
    private final AppointmentRepository appointmentRepository;
    private final TimeFormatter timeFormatter;
    private final NotificationSender notificationSender;

    /**
     * Updates the delay for the currently logged-in doctor and notifies upcoming patients about the delay.
     *      Flows:
     *      Step 1: Create a new Delay object with the current doctor's ID, delay minutes, and entry time.
     *      Step 2: Save the delay information to the database.
     *      Step 3: Notify upcoming patients about the delay.
     * @param minutes The number of minutes to delay the appointments.
     */
    @Override
    public void updateDelay(Integer minutes) {
        Delay delay = Delay.builder().doctorId(IDExtractor.getUserID())
                .delayMinutes(minutes).entryTime(LocalDateTime.now()).build();
        delayRepository.save(delay);
        notifyUpcomingPatients();
    }

    /**
     * Retrieves the delay in minutes for a given doctor, shift, and appointment time.
     * If no delay is recorded or the appointment is outside the specified shift, returns 0.
     * Flows:
     *      Step 1: Retrieve the delay information for the doctor from the database.
     *      Step 2: If no delay is recorded, return 0.
     *      Step 3: Get the delay object.
     *      Step 4: Check if the appointment is on the same date as the delay.
     *              - If not, delete the delay and return 0.
     *      Step 5: Determine the shift start and end times based on the specified shift.
     *      Step 6: Check if the entry time is within the specified shift.
     *              - If not, delete the delay and return 0.
     *      Step 7: Return the delay in minutes.
     * @param doctorId        The ID of the doctor.
     * @param shift           The shift for the appointment (morning, afternoon, evening).
     * @param appointmentTime The scheduled time of the appointment.
     * @return The delay in minutes for the specified parameters.
     */

    @Override
    public Integer getDelayInMinutes(String doctorId, String shift, LocalDateTime appointmentTime) {
        // Retrieve the delay information for the doctor.
        Optional<Delay> delayOp = delayRepository.findById(doctorId);
        if (delayOp.isEmpty()) return 0;

        // Get the delay object.
        Delay delay = delayOp.get();
        LocalDateTime entryTime = delay.getEntryTime();
        shift = shift.toLowerCase();

        // If the appointment is not on the same date as the delay, delete the delay and return 0.
        if (!appointmentTime.toLocalDate().isEqual(entryTime.toLocalDate())) return 0;

        // Determine the shift start and end times based on the specified shift.
        LocalTime shiftStartTime;
        LocalTime shiftEndTime;

        if ("morning".equalsIgnoreCase(shift)) {
            shiftStartTime = AppointmentConstants.MORNING_START_TIME;
            shiftEndTime = AppointmentConstants.MORNING_END_TIME;
        } else if ("afternoon".equalsIgnoreCase(shift)) {
            shiftStartTime = AppointmentConstants.AFTERNOON_START_TIME;
            shiftEndTime = AppointmentConstants.AFTERNOON_END_TIME;
        } else if ("evening".equalsIgnoreCase(shift)) {
            shiftStartTime = AppointmentConstants.EVENING_START_TIME;
            shiftEndTime = AppointmentConstants.EVENING_END_TIME;
        } else throw new ItemNotFoundException("shift ", shift);

        // If the entry time is not within the specified shift, return 0.
        if (entryTime.toLocalTime().isBefore(shiftStartTime) || entryTime.toLocalTime().isAfter(shiftEndTime)) return 0;
        // Return the delay in minutes.
        return delay.getDelayMinutes();
    }

    @Override
    public Integer getCurrentDelayInMinutes(String doctorId) {
        String shift = getShift();
        if(shift.equals("unknown")) return 0;
        return getDelayInMinutes(doctorId, shift, LocalDateTime.now());
    }

    private String getShift() {
        LocalDateTime time = LocalDateTime.now();
        if (isBetween(AppointmentConstants.MORNING_START_TIME, AppointmentConstants.MORNING_END_TIME)) {
            return AppointmentConstants.SHIFT1;
        } else if (isBetween(AppointmentConstants.AFTERNOON_START_TIME, AppointmentConstants.AFTERNOON_END_TIME)) {
            return AppointmentConstants.SHIFT2;
        } else if (isBetween(AppointmentConstants.EVENING_START_TIME, AppointmentConstants.EVENING_END_TIME)) {
            return AppointmentConstants.SHIFT3;
        } else {
            return "unknown";
        }
    }

    private boolean isBetween(LocalTime startTime, LocalTime endTime) {
        LocalTime time = LocalTime.now();
        return !time.isBefore(startTime) && !time.isAfter(endTime);
    }

    /**
     * Notifies upcoming patients about any delays in their scheduled appointments.
     * Sends a notification to each patient with updated appointment details.
     *  Step 1: Retrieve the delay information for the doctor from the database.
     *      Step 2: If no delay is recorded, return.
     *      Step 3: Get the delay object.
     *      Step 4: Get the entry date and time from the delay object.
     *      Step 5: Determine the shift based on the entry time.
     *      Step 6: Retrieve upcoming appointments for the specified doctor, date, and shift.
     *      Step 7: Notify each patient about the updated appointment time.
     *              - Create a notification for each appointment.
     *              - Send the notification to the patient.
     */
    private void notifyUpcomingPatients() {
        // Retrieve the delay information for the doctor.
        String doctorId = IDExtractor.getUserID();
        Optional<Delay> delayOp = delayRepository.findById(doctorId);
        if (delayOp.isEmpty()) return;

        // Get the delay object.
        Delay delay = delayOp.get();
        LocalDate entryDate = delay.getEntryTime().toLocalDate();
        LocalDateTime entryTime = delay.getEntryTime();
        String shift;
        LocalTime entryLocalTime = entryTime.toLocalTime();

        // Determine the shift based on the entry time.
        if (entryLocalTime.isAfter(AppointmentConstants.MORNING_START_TIME)
                && entryLocalTime.isBefore(AppointmentConstants.MORNING_END_TIME)) {
            shift = "morning";
        } else if (entryLocalTime.isAfter(AppointmentConstants.AFTERNOON_START_TIME)
                && entryLocalTime.isBefore(AppointmentConstants.AFTERNOON_END_TIME)) {
            shift = "afternoon";
        } else if (entryLocalTime.isAfter(AppointmentConstants.EVENING_START_TIME)
                && entryLocalTime.isBefore(AppointmentConstants.EVENING_END_TIME)) {
            shift = "evening";
        } else {
            return;
        }

        // Retrieve upcoming appointments for the specified doctor, date, and shift.
        List<Appointment> appointments = appointmentRepository.findByDoctorIdAndDateAndShift(doctorId, entryDate, shift);

        // Notify each patient about the updated appointment time.
        for (Appointment appointment : appointments) {
            if(appointment.isCancelled()) continue;
            String userId = appointment.getPatientId();
            String appointmentOriginalTime = timeFormatter
                    .formatTo12HourFormat(appointment.getAppointmentTime().toLocalTime());
            String shiftedTime = timeFormatter
                    .formatTo12HourFormat((appointment.getAppointmentTime()
                            .plusMinutes(delay.getDelayMinutes())).toLocalTime());
            String url = "http://localhost:3100/health/patient";

            NotificationRequest notification = NotificationRequest.builder()
                    .userId(userId)
                    .title("Appointment time updated")
                    .type("APPOINTMENT")
                    .url(url)
                    .text("Your appointment " + appointment.getId()
                            + " at " + appointmentOriginalTime
                            + " has been updated by " + delay.getDelayMinutes()
                            + " minutes and set to " + shiftedTime)
                    .suffix("Visit your user home page to see details")
                    .build();

            // Send the notification to the patient.
            notificationSender.send(notification);
        }
    }
}