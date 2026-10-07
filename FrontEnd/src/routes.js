import Index from "components/examples/Index";
import Login from "components/accounts/Login";
import ForgottenPassword from "components/accounts/ForgottenPassword";
import VerifyAccount from "components/accounts/VerifyAccount";
import RegisterAdmin from "components/accounts/RegisterAdmin";
import RegisterPatient from "components/accounts/RegisterPatient";
import RegisterDoctor from "components/accounts/RegisterDoctor";
import PatientProfile from "components/profiles/PatientProfile";
import DoctorProfile from "components/profiles/DoctorProfile";
import EditDoctorProfile from "components/profiles/EditDoctorProfile";
import EditPatientProfile from "components/profiles/EditPatientProfile";
import CreateMedicine from "components/pharma/CreateMedicine";
import UpdateMedicine from "components/pharma/UpdateMedicine";
import MedicineList from "components/pharma/MedicineList";
import MedicineDetails from "components/pharma/MedicineDetails";
import Community from "components/community/Community";
import DoctorsList from "components/accounts/DoctorList";
import PatientsList from "components/accounts/PatientsList";
import Logout from "components/accounts/Logout";
import DoctorDashboard from "components/doctor-dashboard/Dashboard";
import CreateCall from "components/telemedicine/CreateCall";
import PostDisplay from "components/community/PostDisplay";
import RoomAllocation from "components/accounts/RoomAllocation";
import CreateEquipment from "components/equipments/Create";
import EquipmentUpdate from "components/equipments/Update";
import EquipmentList from "components/equipments/List";
import EquipmentDetails from "components/equipments/Details";
import WriteCDSS from "components/cdss/WriteCDSS";
import PatientDashboard from "components/patient-dashboard/Dashboard";
import CreateAppointment from "components/appointment/CreateAppointment";
import Notifications from "components/notification/Notifications";
import SettingsPage from "components/notification/SettingsPage";
import Search from "components/search/Search";
import AdminDashboard from "components/admin-dashboard/Dashboard";
import Mailbox from "components/mailbox/Mailbox";

var routes = [
  {
    path: "/index",
    name: "Home",
    icon: "fa fa-home text-info",
    component: <Index />,
    layout: "/common",
    role: "",
  },
  {
    path: "/mailbox",
    name: "Local mailbox",
    icon: "fa fa-envelope text-info",
    component: <Mailbox />,
    layout: "/common",
    role: "",
  },
  {
    path: "/doctor",
    name: "Home",
    icon: "fa fa-home text-info",
    component: <DoctorDashboard />,
    layout: "/health",
    role: "DOCTOR",
  },
  {
    path: "/patient",
    name: "Home",
    icon: "fa fa-home text-info",
    component: <PatientDashboard />,
    layout: "/health",
    role: "PATIENT",
  },
  {
    path: "/admin",
    name: "Home",
    icon: "fa fa-home text-info",
    component: <AdminDashboard />,
    layout: "/health",
    role: "ADMIN",
  },
  {
    path: "/appointment",
    name: "Appointment",
    icon: "fa-solid fa-clock text-primary",
    component: <CreateAppointment />,
    layout: "/health",
    role: "ADMIN PATIENT",
  },

  {
    path: "/login",
    name: "Login",
    icon: "ni ni-key-25 text-info",
    component: <Login />,
    layout: "/public",
    role: "PUBLIC",
  },
  {
    path: "/register-patient",
    name: "Register",
    icon: "ni ni-circle-08 text-pink",
    component: <RegisterPatient />,
    layout: "/public",
    role: "PUBLIC",
  },
  {
    path: "/forgotten-password",
    name: "Forgotten password",
    icon: "ni ni-circle-08 text-pink",
    component: <ForgottenPassword />,
    layout: "/public",
    role: "PUBLIC",
  },
  {
    path: "/notifications",
    name: "Notifications",
    icon: "ni ni-circle-08 text-pink",
    component: <Notifications />,
    layout: "/health",
    role: "",
  },
  {
    path: "/verify-email",
    name: "Verify account",
    icon: "ni ni-circle-08 text-pink",
    component: <VerifyAccount />,
    layout: "/public",
    role: "PUBLIC",
  },
  {
    path: "/register-admin",
    name: "Create admin",
    icon: "ni ni-circle-08 text-pink",
    component: <RegisterAdmin />,
    layout: "/health",
    role: "ADMIN",
  },
  {
    path: "/register-doctor",
    name: "Join as doctor",
    icon: "ni ni-circle-08 text-pink",
    component: <RegisterDoctor />,
    layout: "/public",
    role: "PUBLIC",
  },
  {
    path: "/patients/:patientId",
    name: "Profile",
    icon: "ni ni-single-02 text-pink",
    component: <PatientProfile />,
    layout: "/health",
    role: "PATIENT",
  },
  {
    path: "/doctors/:doctorId",
    name: "Profile",
    icon: "ni ni-single-02 text-gray",
    component: <DoctorProfile />,
    layout: "/health",
    role: "DOCTOR",
  },
  {
    path: "/doctors/edit-profile",
    name: "Edit Profile",
    icon: "fas fa-user-edit text-info",
    component: <EditDoctorProfile />,
    layout: "/health",
    role: "DOCTOR",
  },
  {
    path: "/patients/edit-profile",
    name: "Edit Profile",
    icon: "fas fa-user-edit text-pink",
    component: <EditPatientProfile />,
    layout: "/health",
    role: "PATIENT",
  },
  {
    path: "/medicines/create",
    name: "Create new medicine",
    icon: "fa-solid fa-capsules text-info",
    component: <CreateMedicine />,
    layout: "/health",
    role: "ADMIN DOCTOR",
  },
  {
    path: "/medicines/update/:medId",
    name: "Update a medicine",
    icon: "fa-solid fa-pills text-info",
    component: <UpdateMedicine />,
    layout: "/health",
    role: "",
  },
  {
    path: "/medicines",
    name: "Medicines list",
    icon: "fa-solid fa-tablets text-info",
    component: <MedicineList />,
    layout: "/common",
    role: "ADMIN PATIENT DOCTOR PUBLIC",
  },
  {
    path: "/medicines/:medId",
    name: "Medicine details",
    icon: "fa-solid fa-file-prescription text-pink",
    component: <MedicineDetails />,
    layout: "/common",
    role: "",
  },
  {
    path: "/create-equipments",
    name: "Create new equipment",
    icon: "fa-solid fa-capsules text-pink",
    component: <CreateEquipment />,
    layout: "/health",
    role: "ADMIN",
  },
  {
    path: "/equipments/update/:equId",
    name: "Update an equipment",
    icon: "fa-solid fa-pills text-pink",
    component: <EquipmentUpdate />,
    layout: "/health",
    role: "",
  },
  {
    path: "/equipments",
    name: "Equipments list",
    icon: "fa-solid fa-tablets text-pink",
    component: <EquipmentList />,
    layout: "/common",
    role: "ADMIN PATIENT DOCTOR PUBLIC",
  },
  {
    path: "/equipments/:equId",
    name: "Equipment details",
    icon: "fa-solid fa-file-prescription text-info",
    component: <EquipmentDetails />,
    layout: "/common",
    role: "",
  },
  {
    path: "/community",
    name: "Community",
    icon: "fa-solid fa-users text-success",
    component: <Community />,
    layout: "/health",
    role: "ADMIN PATIENT DOCTOR",
  },
  {
    path: "/doctors",
    name: "Doctors List",
    icon: "fa-solid fa-users-line text-skyblue",
    component: <DoctorsList />,
    layout: "/health",
    role: "",
  },
  {
    path: "/patients",
    name: "Patients List",
    icon: "fa-solid fa-users-rays text-gray",
    component: <PatientsList />,
    layout: "/health",
    role: "",
  },
  {
    path: "/rooms",
    name: "Room allocation",
    icon: "fa-solid fa-hotel text-warning",
    component: <RoomAllocation />,
    layout: "/health",
    role: "",
  },

  {
    path: "/write-treatment",
    name: "Write Treatment",
    icon: "fa-solid fa-hotel text-warning",
    component: <WriteCDSS />,
    layout: "/health",
    role: "ADMIN PATIENT DOCTOR",
  },
  {
    path: "/settings",
    name: "Settings",
    icon: "fa fa-cog text-primary",
    component: <SettingsPage />,
    layout: "/health",
    role: "ADMIN PATIENT DOCTOR",
  },
  {
    path: "/logout",
    name: "Sign out",
    icon: "fa fa-sign-out text-black",
    component: <Logout />,
    layout: "/health",
    role: "ADMIN PATIENT DOCTOR",
  },
  {
    path: "/call/:roomId",
    name: "Call",
    icon: "fa fa-sign-out text-black",
    component: <CreateCall />,
    layout: "/tele",
    role: "",
  },
  {
    path: "/posts/:postId",
    name: "Post",
    icon: "fa fa-sign-out text-black",
    component: <PostDisplay />,
    layout: "/health",
    role: "",
  },
  {
    path: "/search",
    name: "Search",
    icon: "fa fa-search text-info",
    component: <Search />,
    layout: "/common",
    role: "",
  },
];
export default routes;
