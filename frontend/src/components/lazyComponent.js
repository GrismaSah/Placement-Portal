import { lazy } from 'react';

const Login = lazy(() => import("./components/Auth/Login"));
const Register = lazy(() => import("./components/Auth/Register"));
const Navbar = lazy(() => import("./components/Layout/Navbar"));
const Footer = lazy(() => import("./components/Layout/Footer"));
const Home = lazy(() => import("./components/Home/Home"));
const Jobs = lazy(() => import("./components/Job/Jobs"));
const JobDetails = lazy(() => import("./components/Job/JobDetails"));
const Application = lazy(() => import("./components/Application/Application"));
const MyApplications = lazy(() => import("./components/Application/MyApplications"));
const PostJob = lazy(() => import("./components/Job/PostJob"));
const NotFound = lazy(() => import("./components/NotFound/NotFound"));
const MyJobs = lazy(() => import("./components/Job/MyJobs"));
const JobApplications = lazy(() => import("./components/Application/JobApplications"));


export {
    Login,
    Register,
    Navbar,
    Footer,
    Home,
    Jobs,
    JobDetails,
    Application,
    MyApplications,
    PostJob,
    NotFound,
    MyJobs,
    JobApplications
}