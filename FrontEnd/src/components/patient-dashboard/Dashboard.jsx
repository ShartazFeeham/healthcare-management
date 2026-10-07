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
import AxiosInstance from "scripts/axioInstance";
import Upcoming from "./Upcoming";
import Completed from "./Completed";
import { isPatient } from "scripts/accountInfo";
import Progress from "./Progress";

const PatientDashboard = () => {
  const navigate = useNavigate();
  if (!isPatient()) navigate("/");

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
            backgroundColor: "#f8f8f8",
            border: "2px solid #ccc",
            borderRadius: "15px",
          }}
        >
          <Progress />
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
      </Container>
    </>
  );
};

export default PatientDashboard;
