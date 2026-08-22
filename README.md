## Healthcare Management System

This is a multi-aspect focused healthcare platform which offers both doctor and patient oriented services and functionalities including appointment scheduling, patient profile, progress, community, smart analyze systems, admin dashboard, robust help/search and more.

### Contributor: Shartaz Yeasar Feeham

### Get all the API details @ https://documenter.getpostman.com/view/29428687/2s9YeA8toL#56cc6090-488e-4992-9223-1062938e092f

## Services ports

- Major services in 7000
- Optional services in 6000
- Extra services in 5000

### Major services

- 1. Patient service port: 7100
- 3. Doctor service port: 7200
- 3. Pharma service port: 7300
- 4. Appointment service port: 7400
- 5. Community service port: 7500
- 6. Notification service port: 7600
- 7. Help service port: 7700
- 8. CDSS service port: 7800

### Optional services

- 9. Research service port: 6100
- 10. Telemedicine service port: 6200

### Extra services

- 11. Account service port: 5100
- 12. File service port: 5200
- 13. Integration service port: 5300
- 14. Internationalization service port: 5400

## ID formats

- Patient: **PSF2** (Patient Shartaz Feeham 2) **P** + <First letter of **first name>**<First letter of **last name**><Serial no>
- Doctor: **DFS1** (Doctor Farhat Snigdah 1) **D** + <First letter of **first name**><First letter of **last name**><Serial no>
- Appointment: **DFS1-PSF2-1** DoctorID-PatientID-SerialNO
- Appointment (unregistered): **DFS1-ExP1** DoctorID-Ex(extartanl)P<Serial-NO>
- Medicine: **MED1** (MED + SerialNo + Random 2-digit number)
- Equipment: **EQU1** (EQU + SerialNo + Random 2-digit number)
- CDSS: **C-PSF1-1** (C-PatientID-SerialID)

<!-- sync-marker-1 -->
