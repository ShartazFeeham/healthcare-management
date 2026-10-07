import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardImg,
  CardTitle,
  Col,
  Container,
  Row,
} from "reactstrap";
import AxiosInstance from "scripts/axioInstance";
import ScheduleRow from "./ScheduleRow";

const Schedules = ({ selectedDoctor, setSelectedDoctor }) => {
  const [tCount, setTCount] = useState(0);
  const [aCount, setACount] = useState(0);
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [schedule, setSchedule] = useState({});

  const [alertMessage, setAlertMessage] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    AxiosInstance.get(
      `http://localhost:7400/appointments/total/${selectedDoctor.userId}`
    )
      .then((response) => {
        setTCount(response.data);
      })
      .catch((error) => {
        console.log("No completed appointments.");
        console.log(error);
      });
    AxiosInstance.get(
      `http://localhost:7400/schedule/dates/${selectedDoctor.userId}`
    )
      .then((response) => {
        setACount(response.data.length);
      })
      .catch((error) => {
        console.log("No completed appointments.");
        console.log(error);
      });
  }, []);

  useEffect(() => {
    AxiosInstance.get(
      `http://localhost:7400/schedule/dates/${selectedDoctor.userId}`
    )
      .then((response) => {
        setUpcomingDates(response.data);
      })
      .catch((error) => {
        console.log("No completed appointments.");
        console.log(error);
      });
  }, []);

  useEffect(() => {
    if (!selectedDate) return; // wait for a date to be picked
    AxiosInstance.get(
      `http://localhost:7400/schedule/get/${selectedDate}/${selectedDoctor.userId}`
    )
      .then((response) => {
        setSchedule(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.log("No completed appointments.");
        console.log(error);
      });
  }, [selectedDate]);

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  return (
    <>
      <Row>
        <Col xs={12} sm={6} md={6} lg={3}>
          <Card
            onClick={() => {
              setSelectedDoctor(selectedDoctor);
            }}
            className="mt-2"
            style={{
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              cursor: setSelectedDoctor ? "pointer" : "default",
            }}
          >
            <b className="m-2">
              <CardTitle className="mb--1">{`Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`}</CardTitle>
            </b>
            <div style={{ textAlign: "center" }}>
              {selectedDoctor.photoURL ? (
                <CardImg
                  style={{ height: "100px", width: "100px" }}
                  top
                  height="270px"
                  src={selectedDoctor.photoURL}
                  alt={`${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                />
              ) : (
                <CardImg
                  style={{ height: "100px", width: "100px" }}
                  height="270px"
                  top
                  src={
                    selectedDoctor.gender.toLowerCase() === "male"
                      ? require("./docmaleavatar.png")
                      : require("./docfemaleavatar.png")
                  }
                  alt={`${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                />
              )}
            </div>
            <CardBody>
              <Row className="align-items-center">
                <div className="col">
                  Available appointment dates
                  <h3 className="mb-0">
                    {upcomingDates && upcomingDates.length > 0
                      ? "Select a date"
                      : "Doctor not available"}
                  </h3>
                </div>
              </Row>
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
        <Col>
          <Card>
            <CardTitle className="m-4 mb--2">
              <b>Schedule details</b> {selectedDate && <>({selectedDate})</>}
            </CardTitle>
            <CardBody style={{ boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
              {alertMessage && (
                <div className="alert alert-danger" role="alert">
                  {alertMessage}
                </div>
              )}
              {success && <div className="alert alert-success">{success}</div>}
              {!selectedDate ? (
                <>Select a date first.</>
              ) : (
                <div>
                  <ScheduleRow
                    shift={1}
                    type={schedule.morning}
                    capacity={schedule?.morningAvailability?.capacity || 0}
                    booked={schedule?.morningAvailability?.booked || 0}
                    delay={schedule?.morningAvailability?.delay || 0}
                    date={selectedDate}
                    docId={selectedDoctor.userId}
                    setAlertMessage={setAlertMessage}
                    setSuccess={setSuccess}
                  />
                  <div>
                    <ScheduleRow
                      shift={2}
                      type={schedule.afterNoon}
                      capacity={schedule?.afternoonAvailability?.capacity || 0}
                      booked={schedule?.afternoonAvailability?.booked || 0}
                      delay={schedule?.afternoonAvailability?.delay || 0}
                      date={selectedDate}
                      docId={selectedDoctor.userId}
                      setAlertMessage={setAlertMessage}
                      setSuccess={setSuccess}
                    />
                  </div>
                  <div>
                    <ScheduleRow
                      shift={3}
                      type={schedule.evening}
                      capacity={schedule?.eveningAvailability?.capacity || 0}
                      booked={schedule?.eveningAvailability?.booked || 0}
                      delay={schedule?.eveningAvailability?.delay || 0}
                      date={selectedDate}
                      docId={selectedDoctor.userId}
                      setAlertMessage={setAlertMessage}
                      setSuccess={setSuccess}
                    />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  );
};
export default Schedules;
