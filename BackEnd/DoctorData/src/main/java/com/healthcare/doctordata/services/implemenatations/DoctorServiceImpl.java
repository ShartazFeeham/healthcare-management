package com.healthcare.doctordata.services.implemenatations;

import com.healthcare.doctordata.entity.Certification;
import com.healthcare.doctordata.entity.Doctor;
import com.healthcare.doctordata.entity.Qualification;
import com.healthcare.doctordata.exceptions.AccessMismatchException;
import com.healthcare.doctordata.exceptions.ItemNotFoundException;
import com.healthcare.doctordata.models.*;
import com.healthcare.doctordata.network.AccountCreateDTO;
import com.healthcare.doctordata.repository.DoctorRepository;
import com.healthcare.doctordata.utilities.token.IDExtractor;
import com.healthcare.doctordata.network.AccountCreateRequester;
import com.healthcare.doctordata.network.PhoneNoUpdateRequester;
import com.healthcare.doctordata.services.interfaces.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service @RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final AccountCreateRequester accountCreateRequester;
    private final PhoneNoUpdateRequester phoneNoUpdateRequester;

    @Override
    public void register(CreateDoctorAccountDTO createDoctorAccountDTO) {

        Doctor doctor = new Doctor();
        String id = getId(createDoctorAccountDTO.getFirstName(), createDoctorAccountDTO.getLastName());
        doctor.setUserId(id);

        // Mapping fields from DTO to Doctor entity
        doctor.setFirstName(createDoctorAccountDTO.getFirstName());
        doctor.setLastName(createDoctorAccountDTO.getLastName());
        doctor.setEmail(createDoctorAccountDTO.getEmail());
        doctor.setGender(createDoctorAccountDTO.getGender());
        doctor.setProfilePhoto(createDoctorAccountDTO.getPhoto());
        doctor.setBio(createDoctorAccountDTO.getBio());
        doctor.setExperience(createDoctorAccountDTO.getExperience());
        doctor.setLicense(createDoctorAccountDTO.getLicense());
        doctor.setSpecializations(createDoctorAccountDTO.getSpecialization());
        doctor.setPhoneNumber(createDoctorAccountDTO.getPhoneNumber());
        doctor.setResidence(createDoctorAccountDTO.getResidence());
        doctor.setDateOfBirth(createDoctorAccountDTO.getDateOfBirth());
        doctor.setNidNo(createDoctorAccountDTO.getNid());

        List<Qualification> qualifications = createDoctorAccountDTO.getQualifications();
        List<Certification> certifications = createDoctorAccountDTO.getCertifications();

        doctor.setQualifications(qualifications);
        doctor.setCertifications(certifications);

        doctorRepository.save(doctor);

        AccountCreateDTO account = new AccountCreateDTO();
        account.setUserId(id);
        account.setEmail(createDoctorAccountDTO.getEmail());
        account.setPassword(createDoctorAccountDTO.getPassword());

        try{
            String result = accountCreateRequester.send(account);
        }
        catch (Exception e){
            doctorRepository.deleteById(id);
            throw e;
        }

        phoneNoUpdateRequester.send(doctor.getUserId(), doctor.getPhoneNumber());
    }

    private String getId(String firstName, String lastName) {
        // Generate the initial ID pattern using the first letters of the first and last name
        String idPattern = "D" + firstName.toUpperCase().charAt(0) + lastName.toUpperCase().charAt(0);
        long count = doctorRepository.countByUserIdStartingWith(idPattern) + 1;
        return  idPattern + count;
    }


    @Override
    public ReadDoctorPersonalInfoDTO readPersonalInfo(String userId) throws ItemNotFoundException {
        Doctor doctor = doctorRepository.findById(userId)
                .orElseThrow(() -> new ItemNotFoundException("Doctor", userId));

        ReadDoctorPersonalInfoDTO personalInfoDTO = new ReadDoctorPersonalInfoDTO();

        // Mapping fields from Doctor entity to ReadDoctorPersonalInfoDTO
        personalInfoDTO.setPhone(doctor.getPhoneNumber());
        personalInfoDTO.setDateOfBirth(doctor.getDateOfBirth());
        personalInfoDTO.setNidNo(doctor.getNidNo());
        personalInfoDTO.setResidence(doctor.getResidence());

        return personalInfoDTO;
    }

    @Override
    public ReadDoctorProfileDTO readDoctorProfileInfo(String userId) throws ItemNotFoundException {
        Doctor doctor = doctorRepository.findById(userId)
                .orElseThrow(() -> new ItemNotFoundException("Doctor", userId));

        ReadDoctorProfileDTO profileDTO = new ReadDoctorProfileDTO();

        // Mapping fields from Doctor entity to ReadDoctorProfileDTO
        profileDTO.setDoctorId(doctor.getUserId());
        profileDTO.setFirstName(doctor.getFirstName());
        profileDTO.setLastName(doctor.getLastName());
        profileDTO.setEmail(doctor.getEmail());
        profileDTO.setGender(doctor.getGender());
        profileDTO.setProfilePhoto(doctor.getProfilePhoto());
        profileDTO.setBio(doctor.getBio());
        profileDTO.setExperience(doctor.getExperience());
        profileDTO.setLicense(doctor.getLicense());
        profileDTO.setRoom(doctor.getRoom());
        profileDTO.setSpecializations(doctor.getSpecializations());
        profileDTO.setQualifications(doctor.getQualifications());
        profileDTO.setCertifications(doctor.getCertifications());

        return profileDTO;
    }


    @Override
    public void update(String userId, UpdateDoctorProfileDTO updateDoctorProfileDTO) throws AccessMismatchException, ItemNotFoundException {
        Doctor doctor = doctorRepository.findById(userId)
                .orElseThrow(() -> new ItemNotFoundException("Doctor", userId));

        if(!userId.equals(IDExtractor.getUserID())) throw new AccessMismatchException("You don't have permission to edit others' profile info.");

        // Update doctor fields based on the DTO
        doctor.setFirstName(updateDoctorProfileDTO.getFirstName());
        doctor.setLastName(updateDoctorProfileDTO.getLastName());
        doctor.setPhoneNumber(updateDoctorProfileDTO.getPhoneNumber());
        doctor.setSpecializations(updateDoctorProfileDTO.getSpecialization());
        doctor.setResidence(updateDoctorProfileDTO.getResidence());
        doctor.setBio(updateDoctorProfileDTO.getBio());
        doctor.setExperience(updateDoctorProfileDTO.getExperience());
        doctor.setProfilePhoto(updateDoctorProfileDTO.getPhoto());
        doctor.getQualifications().clear();
        doctor.getCertifications().clear();
        doctor.getQualifications().addAll(updateDoctorProfileDTO.getQualifications());
        doctor.getCertifications().addAll(updateDoctorProfileDTO.getCertifications());

        doctorRepository.save(doctor);
        phoneNoUpdateRequester.send(doctor.getUserId(), doctor.getPhoneNumber());
    }

    @Override
    public void delete(String userId) throws ItemNotFoundException {
        Doctor doctor = doctorRepository.findById(userId)
                .orElseThrow(() -> new ItemNotFoundException("Doctor", userId));
        doctorRepository.deleteById(userId);
    }

    @Override
    public UserMinimalInfoDTO getUserMinimalInfo(String userId) throws ItemNotFoundException {
        Doctor patient = doctorRepository.findById(userId)
                .orElseThrow(() -> new ItemNotFoundException("doctor", userId));
        return UserMinimalInfoDTO.builder().photoURL(patient.getProfilePhoto())
                .firstName(patient.getFirstName()).lastName(patient.getLastName())
                .build();
    }

    @Override
    public DoctorEditExistingDTO editExisting() throws ItemNotFoundException {
        String userId = IDExtractor.getUserID();
        Doctor doctor = doctorRepository.findById(userId)
                .orElseThrow(() -> new ItemNotFoundException("Doctor", userId));

        DoctorEditExistingDTO profileDTO = new DoctorEditExistingDTO();

        // Mapping fields from Doctor entity to ReadDoctorProfileDTO
        profileDTO.setDoctorId(doctor.getUserId());
        profileDTO.setFirstName(doctor.getFirstName());
        profileDTO.setLastName(doctor.getLastName());
        profileDTO.setEmail(doctor.getEmail());
        profileDTO.setGender(doctor.getGender());
        profileDTO.setBio(doctor.getBio());
        profileDTO.setExperience(doctor.getExperience());
        profileDTO.setLicense(doctor.getLicense());
        profileDTO.setSpecializations(doctor.getSpecializations());
        profileDTO.setQualifications(doctor.getQualifications());
        profileDTO.setCertifications(doctor.getCertifications());
        profileDTO.setPhoneNumber(doctor.getPhoneNumber());
        profileDTO.setResidence(doctor.getResidence());
        profileDTO.setPhoto(doctor.getProfilePhoto());

        return profileDTO;
    }

    @Override
    public Long getTotalCount() {
        return doctorRepository.count();
    }
}
