import {
  faChartLine,
  faDiagnoses,
  faStethoscope,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { FaTags } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  CardHeader,
  CardBody,
  Card,
  Form,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Button,
  CustomInput,
  Label,
} from "reactstrap";
import { getUserId } from "scripts/accountInfo";
import { isPatient } from "scripts/accountInfo";
import AxiosInstance from "scripts/axioInstance";

const WriteCDSS = () => {
  const { equId } = useParams();

  const [edit, setEdit] = useState(false);

  const [existing, setExisting] = useState([]);
  const [id, setId] = useState(-1);

  const [condition, setCondition] = useState("");
  const [patientId, setPatientId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [medicines, setMedicines] = useState("");
  const [diagnoses, setDiagnoses] = useState("");
  const [progression, setProgression] = useState("");
  const [doctorComment, setDoctorComment] = useState("");

  const [alertMessage, setAlertMessage] = useState("");
  const [success, setSuccess] = useState("");

  const textColor = { color: "#555" };

  useEffect(() => {
    const url = `http://localhost:7800/treatments/author/${localStorage.getItem("userId")}`;
    AxiosInstance.get(url)
      .then((result) => {
        console.log(result.data);
        setExisting(result.data);
      })
      .catch((error) => {
        setAlertMessage("Failed to load the equipment, please try again.");
      });
  }, []);

  useEffect(() => {
    console.log(id);
    if (id == -1) {
      setEdit(false);
      setCondition("");
      setPatientId("");
      setIssueDate("");
      setMedicines("");
      setDiagnoses("");
      setProgression("");
      setDoctorComment("");
      return;
    }

    const selectedTreatment = existing[id];

    if (selectedTreatment) {
      setEdit(true);
      setCondition(selectedTreatment.condition || "");
      setPatientId(selectedTreatment.patientId || "");
      setIssueDate(selectedTreatment.issueDate || "");
      setMedicines(selectedTreatment.medicines || "");
      setDiagnoses(selectedTreatment.diagnoses || "");
      setProgression(selectedTreatment.progression || "");
      setDoctorComment(selectedTreatment.doctorComment || "");
    } else setAlertMessage("Failed to load previous treatment data. ");
  }, [id]);

  const handleSave = () => {
    setSuccess("");
    setAlertMessage("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const data = {
      patientId,
      condition,
      issueDate,
      medicines,
      diagnoses,
      progression,
      doctorComment,
    };

    if (edit) {
      const url = `http://localhost:7800/treatments/${existing[id].id}`;
      AxiosInstance.put(url, data)
        .then((result) => {
          console.log(result.data);
          setSuccess(result.data);
          setId(-1);
        })
        .catch((error) => {
          console.log(error.response.data.message);
          setAlertMessage(error.response.data.message);
        });
    } else {
      const url = `http://localhost:7800/treatments`;
      AxiosInstance.post(url, data)
        .then((result) => {
          console.log(result);
          setSuccess(result.data);
          setCondition("");
          setPatientId("");
          setIssueDate("");
          setMedicines("");
          setDiagnoses("");
          setProgression("");
          setDoctorComment("");
          setId(-1);
        })
        .catch((error) => {
          setAlertMessage(error.response.data.message);
        });
    }
  };

  return (
    <>
      <div
        className="header pb-7 pt-5 pt-lg-8 d-flex align-items-center"
        style={{
          backgroundImage:
            "url(" + require("../../assets/img/cover/health1.jpg") + ")",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          width: "100%",
        }}
      >
        <span className="mask bg-gradient-default opacity-6" />
      </div>
      <Container className="mt--7" fluid>
        <Row>
          <Col className="order-xl-1 center" xl="8">
            <Card className="bg-secondary shadow">
              {equId === null ||
                equId === undefined ||
                (equId === ":medId" && (
                  <div style={{ width: "100%", textAlign: "center" }}>
                    <div className="alert alert-danger">
                      <b>No equipment selected!</b> Please select an equipment
                      first that you want to update from the equipments list.{" "}
                    </div>
                  </div>
                ))}
              <CardHeader className="bg-white border-0">
                <Row className="align-items-center">
                  <Col xs="8">
                    <h3 className="mb-0">
                      <b>WRITE A TREAMENT INFO</b>
                    </h3>
                    <h6 className="heading-small text-muted">
                      {edit
                        ? "You are currently in edit mode, unselect the choosen treatment from below to switch back to create mode."
                        : "You are currently in create mode, you can also switch to edit mode by peeking on existing treatment from below to update existing treatments that you wrote."}
                    </h6>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FormGroup>
                      <InputGroup className="input-group-alternative">
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText>
                            <i
                              className="ni ni-badge"
                              style={{ color: "#555" }}
                            />
                          </InputGroupText>
                        </InputGroupAddon>
                        <CustomInput
                          type="select"
                          id="existingItems"
                          value={id}
                          onChange={(e) => setId(e.target.value)}
                          style={{ color: "#555" }}
                        >
                          <option value="-1">
                            {edit
                              ? "Unselect treatment"
                              : "Choose existing treatments to edit"}
                          </option>
                          {existing.map((ex, index) => (
                            <>
                              <option id={index} value={index}>
                                {ex.id.toString() +
                                  ". " +
                                  ex.patientId +
                                  " - " +
                                  ex.condition}
                              </option>
                            </>
                          ))}
                        </CustomInput>
                      </InputGroup>
                    </FormGroup>
                  </Col>
                </Row>
              </CardHeader>
              <CardBody>
                <Form>
                  {alertMessage && (
                    <div className="alert alert-danger" role="alert">
                      {alertMessage}
                    </div>
                  )}
                  {success && (
                    <div className="alert alert-success">{success}</div>
                  )}
                  <FormGroup row>
                    <Label sm={4} for="patientId">
                      Patient ID
                    </Label>
                    <Col sm={8}>
                      <InputGroup>
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText style={textColor}>
                            <i className="fa fa-user" />
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input
                          type="text"
                          id="patientId"
                          value={
                            edit
                              ? patientId
                              : isPatient()
                              ? getUserId()
                              : patientId
                          }
                          disabled={edit || isPatient()}
                          placeholder="ID of the Patient"
                          onChange={(e) => setPatientId(e.target.value)}
                          style={textColor}
                        />
                      </InputGroup>
                    </Col>
                  </FormGroup>

                  <FormGroup row>
                    <Label sm={4} for="condition">
                      Condition name
                    </Label>
                    <Col sm={8}>
                      <InputGroup>
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText style={textColor}>
                            <FontAwesomeIcon icon={faStethoscope} />
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input
                          type="text"
                          id="condition"
                          value={condition}
                          placeholder="Condition or Illness name"
                          onChange={(e) => setCondition(e.target.value)}
                          style={textColor}
                        />
                      </InputGroup>
                    </Col>
                  </FormGroup>

                  <FormGroup row>
                    <Label sm={4} for="issueDate">
                      Issue date
                    </Label>
                    <Col sm={8}>
                      <InputGroup>
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText style={textColor}>
                            <i className="ni ni-calendar-grid-58" />
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input
                          type="date"
                          id="issueDate"
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          style={textColor}
                        />
                      </InputGroup>
                    </Col>
                  </FormGroup>

                  <FormGroup row>
                    <Label sm={4} for="medicines">
                      Medicines
                    </Label>
                    <Col sm={8}>
                      <InputGroup>
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText style={textColor}>
                            <i class="fa-solid fa-suitcase-medical"></i>
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input
                          type="text"
                          id="medicines"
                          value={medicines}
                          placeholder="Write comma-separated medicine names"
                          onChange={(e) => setMedicines(e.target.value)}
                          style={textColor}
                        />
                      </InputGroup>
                    </Col>
                  </FormGroup>

                  <FormGroup row>
                    <Label sm={4} for="diagnoses">
                      Diagnoses
                    </Label>
                    <Col sm={8}>
                      <InputGroup>
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText style={textColor}>
                            <FontAwesomeIcon icon={faDiagnoses} />
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input
                          type="text"
                          id="diagnoses"
                          value={diagnoses}
                          placeholder="Write comma-separated diagnoses names"
                          onChange={(e) => setDiagnoses(e.target.value)}
                          style={textColor}
                        />
                      </InputGroup>
                    </Col>
                  </FormGroup>

                  <FormGroup row>
                    <Label sm={4} for="progression">
                      Progression
                    </Label>
                    <Col sm={8}>
                      <InputGroup>
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText style={textColor}>
                            <FontAwesomeIcon icon={faChartLine} />
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input
                          type="text"
                          id="progression"
                          value={progression}
                          placeholder="Write a progression status"
                          onChange={(e) => setProgression(e.target.value)}
                          style={textColor}
                        />
                      </InputGroup>
                    </Col>
                  </FormGroup>

                  <FormGroup row>
                    <Label sm={4} for="doctorComment">
                      Doctor comment
                    </Label>
                    <Col sm={8}>
                      <InputGroup>
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText style={textColor}>
                            <i className="ni ni-chat-round" />
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input
                          type="text"
                          id="doctorComment"
                          value={doctorComment}
                          placeholder="Comment from doctor"
                          onChange={(e) => setDoctorComment(e.target.value)}
                          style={textColor}
                        />
                      </InputGroup>
                    </Col>
                  </FormGroup>

                  <Button color="primary" onClick={handleSave}>
                    Save treatment
                  </Button>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default WriteCDSS;
