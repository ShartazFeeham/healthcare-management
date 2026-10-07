import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Button,
} from "reactstrap";
import { isDoctor } from "scripts/accountInfo";
import AxiosInstance from "scripts/axioInstance";
import Upcoming from "./Upcoming";
import Completed from "./Completed";
import Delay from "./Delay";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  if (!isDoctor()) navigate("/");

  const [upcomingDates, setUpcomingDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const doctorId = localStorage.getItem("userId");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [scheduleData, setScheduleData] = useState({
    date: "",
    morning: 0,
    morningCapacity: 10,
    afterNoon: 0,
    afterNoonCapacity: 10,
    evening: 0,
    eveningCapacity: 10,
  });

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleSaveSchedule = () => {
    setSuccessMessage("");
    setErrorMessage("");
    AxiosInstance.post(`http://localhost:7400/schedule/set`, scheduleData)
      .then((response) => {
        console.log(response);
        setSuccessMessage(response.data);
      })
      .catch((error) => {
        console.log("No previous data exist.");
        setErrorMessage(error.response.data.message);
        console.log(error.response.data.message);
      });
  };

  useEffect(() => {
    setSuccessMessage("");
    setErrorMessage("");
    if (!selectedDate) return; // no date picked yet
    AxiosInstance.get(
      `http://localhost:7400/schedule/get/${selectedDate}/${doctorId}`
    )
      .then((response) => {
        const data = response.data;
        const newData = {
          date: selectedDate,
          morning: data.morning,
          morningCapacity: data.morningAvailability.capacity,
          afterNoon: data.afterNoon,
          afterNoonCapacity: data.afternoonAvailability.capacity,
          evening: data.evening,
          eveningCapacity: data.eveningAvailability.capacity,
        };
        console.log("existing data: ", newData);
        setScheduleData(newData);
      })
      .catch((error) => {
        console.log("No previous data exist.");
        console.log(error);
        const data = {
          date: selectedDate,
          morning: 0,
          morningCapacity: 10,
          afterNoon: 0,
          afterNoonCapacity: 10,
          evening: 0,
          eveningCapacity: 10,
        };
        setScheduleData(data);
      });
  }, [selectedDate]);

  useEffect(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const dates = Array.from({ length: 10 }, (_, index) => {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() + index);
      return currentDate.toISOString().split("T")[0];
    });
    setUpcomingDates(dates);
  }, []);

  return (
    <>
      <div
        className="header pb-0 pt-5 pt-lg-8 d-flex align-items-center"
        style={{
          minHeight: "50px",
          backgroundImage:
            "url(" + require("../../assets/img/cover/health5.jpg") + ")",
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <span className="mask bg-gradient-default opacity-6" />
      </div>
      <Container className="mt--5" fluid>
        <Row
          className="mb-4 m-1"
          style={{
            backgroundColor: "#eee",
            border: "2px solid #ccc",
            borderRadius: "15px",
          }}
        >
          <Upcoming />
        </Row>
        <Row
          className="mb-4 m-1"
          style={{
            backgroundColor: "#eee",
            border: "2px solid #ccc",
            borderRadius: "15px",
          }}
        >
          <Completed />
        </Row>
        <Row>
          <Col
            style={{
              backgroundColor: "#111155",
              borderRadius: "14px",
              margin: "10px",
            }}
          >
            <h2 className="m-4 text-white">Manage your schedules</h2>
          </Col>
        </Row>
        <Row>
          <Col xl="4">
            <Card className="shadow">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <div className="col">
                    Upcoming dates
                    <h2 className="mb-0">Select a date</h2>
                  </div>
                </Row>
              </CardHeader>
              <CardBody>
                {upcomingDates.map((date) => (
                  <div
                    key={date}
                    style={{
                      cursor: "pointer",
                      margin: "5px",
                      padding: "5px",
                      borderBottom: "1px solid #eee",
                    }}
                    onClick={() => handleDateClick(date)}
                  >
                    {date}
                  </div>
                ))}
              </CardBody>
            </Card>
          </Col>
          <Col className="mb-5 mb-xl-0" xl="8">
            <Card className="bg-gradient-default shadow">
              <CardHeader className="bg-transparent">
                <Row className="align-items-center">
                  <div className="col">
                    <h6 className="text-uppercase text-light ls-1 mb-1">
                      Schedule
                    </h6>
                    <h2 className="text-white mb-0">
                      Set schedules {selectedDate && <>for {selectedDate}</>}
                    </h2>
                  </div>
                </Row>
              </CardHeader>
              <CardBody>
                {selectedDate ? (
                  <>
                    <div
                      className="m-2 p-2"
                      style={{ border: "1px solid #558" }}
                    >
                      <FormGroup check className="m-3">
                        <h2>
                          <Label check className="text-white">
                            <Input
                              type="checkbox"
                              checked={
                                scheduleData.morning === 1 ||
                                scheduleData.morning === 2
                              }
                              onChange={() =>
                                setScheduleData((prevData) => ({
                                  ...prevData,
                                  morning: prevData.morning > 0 ? 0 : 1,
                                }))
                              }
                            />
                            Morning (9am - 1pm)
                          </Label>
                        </h2>
                      </FormGroup>
                      <Row>
                        <Col>
                          <FormGroup check className="m-3">
                            <Label check>
                              <Input
                                type="radio"
                                checked={scheduleData.morning === 2}
                                onChange={() =>
                                  setScheduleData((prevData) => ({
                                    ...prevData,
                                    morning: 2,
                                  }))
                                }
                              />
                              <div className="text-white">Telemedicine</div>
                            </Label>
                          </FormGroup>
                          <FormGroup check className="m-3">
                            <Label check>
                              <Input
                                type="radio"
                                checked={scheduleData.morning === 1}
                                onChange={() =>
                                  setScheduleData((prevData) => ({
                                    ...prevData,
                                    morning: 1,
                                  }))
                                }
                              />
                              <div className="text-white">In person</div>
                            </Label>
                          </FormGroup>
                        </Col>
                        <Col>
                          <FormGroup>
                            <Label for="morningCapacity">
                              <div className="text-white">Capacity</div>
                            </Label>
                            <Input
                              type="number"
                              id="morningCapacity"
                              value={scheduleData.morningCapacity}
                              onChange={(e) =>
                                setScheduleData((prevData) => ({
                                  ...prevData,
                                  morningCapacity: parseInt(e.target.value),
                                }))
                              }
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    </div>

                    <div
                      className="m-2 p-2"
                      style={{ border: "1px solid #558" }}
                    >
                      <FormGroup check className="m-3">
                        <h2>
                          <Label check className="text-white">
                            <Input
                              type="checkbox"
                              checked={
                                scheduleData.afterNoon === 1 ||
                                scheduleData.afterNoon === 2
                              }
                              onChange={() =>
                                setScheduleData((prevData) => ({
                                  ...prevData,
                                  afterNoon: prevData.afterNoon > 0 ? 0 : 1,
                                }))
                              }
                            />
                            Afternoon (1pm - 5pm)
                          </Label>
                        </h2>
                      </FormGroup>
                      <Row>
                        <Col>
                          <FormGroup check className="m-3">
                            <Label check>
                              <Input
                                type="radio"
                                checked={scheduleData.afterNoon === 2}
                                onChange={() =>
                                  setScheduleData((prevData) => ({
                                    ...prevData,
                                    afterNoon: 2,
                                  }))
                                }
                              />
                              <div className="text-white">Telemedicine</div>
                            </Label>
                          </FormGroup>
                          <FormGroup check className="m-3">
                            <Label check>
                              <Input
                                type="radio"
                                checked={scheduleData.afterNoon === 1}
                                onChange={() =>
                                  setScheduleData((prevData) => ({
                                    ...prevData,
                                    afterNoon: 1,
                                  }))
                                }
                              />
                              <div className="text-white">In person</div>
                            </Label>
                          </FormGroup>
                        </Col>
                        <Col>
                          <FormGroup>
                            <Label for="morningCapacity">
                              <div className="text-white">Capacity</div>
                            </Label>
                            <Input
                              type="number"
                              id="morningCapacity"
                              value={scheduleData.afterNoonCapacity}
                              onChange={(e) =>
                                setScheduleData((prevData) => ({
                                  ...prevData,
                                  afterNoonCapacity: parseInt(e.target.value),
                                }))
                              }
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    </div>

                    <div
                      className="m-2 p-2"
                      style={{ border: "1px solid #558" }}
                    >
                      <FormGroup check className="m-3">
                        <h2>
                          <Label check className="text-white">
                            <Input
                              type="checkbox"
                              checked={
                                scheduleData.evening === 1 ||
                                scheduleData.evening === 2
                              }
                              onChange={() =>
                                setScheduleData((prevData) => ({
                                  ...prevData,
                                  evening: prevData.evening > 0 ? 0 : 1,
                                }))
                              }
                            />
                            Evening (5pm - 9pm)
                          </Label>
                        </h2>
                      </FormGroup>
                      <Row>
                        <Col>
                          <FormGroup check className="m-3">
                            <Label check>
                              <Input
                                type="radio"
                                checked={scheduleData.evening === 2}
                                onChange={() =>
                                  setScheduleData((prevData) => ({
                                    ...prevData,
                                    evening: 2,
                                  }))
                                }
                              />
                              <div className="text-white">Telemedicine</div>
                            </Label>
                          </FormGroup>
                          <FormGroup check className="m-3">
                            <Label check>
                              <Input
                                type="radio"
                                checked={scheduleData.evening === 1}
                                onChange={() =>
                                  setScheduleData((prevData) => ({
                                    ...prevData,
                                    evening: 1,
                                  }))
                                }
                              />
                              <div className="text-white">In person</div>
                            </Label>
                          </FormGroup>
                        </Col>
                        <Col>
                          <FormGroup>
                            <Label for="morningCapacity">
                              <div className="text-white">Capacity</div>
                            </Label>
                            <Input
                              type="number"
                              id="morningCapacity"
                              value={scheduleData.eveningCapacity}
                              onChange={(e) =>
                                setScheduleData((prevData) => ({
                                  ...prevData,
                                  eveningCapacity: parseInt(e.target.value),
                                }))
                              }
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    </div>

                    <div
                      className="bg-danger text-white m-3"
                      style={{ borderRadius: "10px", textAlign: "center" }}
                    >
                      {errorMessage}
                    </div>
                    <div
                      className="bg-success text-white m-3"
                      style={{ borderRadius: "10px", textAlign: "center" }}
                    >
                      {successMessage}
                    </div>

                    <Button color="primary" onClick={handleSaveSchedule}>
                      Save Schedule
                    </Button>
                  </>
                ) : (
                  <h3 className="text-white mb-0">
                    Select a date from the left
                  </h3>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row
          className="mb-4 m-1"
          style={{
            backgroundColor: "#eee",
            border: "2px solid #ccc",
            borderRadius: "15px",
          }}
        >
          <Delay />
        </Row>
      </Container>
    </>
  );
};

export default DoctorDashboard;
