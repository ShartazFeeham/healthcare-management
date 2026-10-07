import AxiosInstance from "scripts/axioInstance";
import React, { useState, useEffect } from "react";
import {
  Row,
  Container,
  FormGroup,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  CustomInput,
} from "reactstrap";
import Schedules from "./Schedules";
import DocCard from "./DocCard";

const CreateAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [specList, setSpecList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState();
  const [spec, setSpec] = useState("");

  useEffect(() => {
    AxiosInstance.get(`http://localhost:7200/specializations`)
      .then((response) => {
        console.log(response.data);
        setSpecList(response.data);
      })
      .catch((error) => {
        console.log("Parsing spec error", error);
      });
    setSpec("All");
  }, []);

  useEffect(() => {
    if (!spec) return; // initial render, before the default filter is applied
    AxiosInstance.get(`http://localhost:7200/specializations/${spec}`)
      .then((response) => {
        setDoctors(response.data);
      })
      .catch((error) => {
        console.log("No completed appointments.");
        console.log(error);
      });
  }, [spec]);

  return (
    <>
      <div
        className="header pb-5 pt-5 pt-lg-8 d-flex align-items-center"
        style={{
          height: "100px",
          backgroundImage:
            "url(" + require("../../assets/img/cover/q1.jpg") + ")",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <span className="mask bg-gradient-default opacity-6" />
        <Container className="d-flex align-items-center" fluid>
          <Row>
            <h1 className="display-2 opacity-7" style={{ color: "white" }}>
              Take Appointment
            </h1>
          </Row>
        </Container>
      </div>
      <Container className="">
        <Container className="m-3">
          {!selectedDoctor ? (
            <>
              <div style={{ fontWeight: "bold" }}>Select a specialization</div>
              <FormGroup>
                <InputGroup className="input-group-alternative">
                  <InputGroupAddon addonType="prepend">
                    <InputGroupText>
                      <i className="ni ni-badge" style={{ color: "#555" }} />
                    </InputGroupText>
                  </InputGroupAddon>
                  <CustomInput
                    type="select"
                    id="existingItems"
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    style={{ color: "#555" }}
                  >
                    <option value="All">All</option>
                    {specList.map((sp, index) => (
                      <>
                        <option id={index} value={sp}>
                          {sp}
                        </option>
                      </>
                    ))}
                  </CustomInput>
                </InputGroup>
              </FormGroup>
            </>
          ) : (
            <div
              style={{
                fontWeight: "bold",
                cursor: "pointer",
                color: "#3333aa",
              }}
              onClick={() => setSelectedDoctor(null)}
            >
              <i class="fas fa-chevron-left"></i>
              <i class="fas fa-chevron-left"></i>Back to doctors list
            </div>
          )}
        </Container>
        {selectedDoctor ? (
          <Schedules
            selectedDoctor={selectedDoctor}
            setSelectedDoctor={setSelectedDoctor}
          />
        ) : (
          <Row>
            {doctors.map((doctor, index) => (
              <DocCard
                doctor={doctor}
                index={index}
                setSelectedDoctor={setSelectedDoctor}
              />
            ))}
          </Row>
        )}
      </Container>
    </>
  );
};

export default CreateAppointment;
