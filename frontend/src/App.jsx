import { useContext, useEffect, Suspense, lazy } from "react";
import "./App.css";

import { Context } from "./main";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import LoaderPage from "./components/Loader/LoaderPage.jsx";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
const ForgotPassword = lazy(() => import("./components/Forgot/ForgotPassword.jsx"));

const Login = lazy(() => import("./components/Auth/Login"));
const Register = lazy(() => import("./components/Auth/Register"));
const Home = lazy(() => import("./components/Home/Home"));
const Jobs = lazy(() => import("./components/Job/Jobs"));
const JobDetails = lazy(() => import("./components/Job/JobDetails"));
const Application = lazy(() => import("./components/Application/Application"));
const MyApplications = lazy(() =>
  import("./components/Application/MyApplications")
);
const PostJob = lazy(() => import("./components/Job/PostJob"));
const NotFound = lazy(() => import("./components/NotFound/NotFound"));
const MyJobs = lazy(() => import("./components/Job/MyJobs"));
const JobApplications = lazy(() =>
  import("./components/Application/JobApplications")
);
const TPOLogin = lazy(() => import("./components/TPO/Login"));
const TPORegister = lazy(() => import("./components/TPO/Register"));


axios.defaults.baseURL = "http://localhost:4000";

const App = () => {
  const { isAuthorized, setIsAuthorized, setUser, user } = useContext(Context);
  


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          "/api/v1/user/getuser",
          {
            withCredentials: true,
          }
        );

        const user = response.data.user;
        setUser(user);
        // console.log('user', response.data);
        if(user === null){
          const response = await axios.get("/api/v1/tpo/me", {
            withCredentials: true,
          });
          setUser(response.data.user);
        }
        
        setIsAuthorized(true);
      } catch (error) {
        setIsAuthorized(false);
      }
    };
    fetchUser();
    console.log(user);
    
  }, [isAuthorized]);

  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Suspense fallback={<LoaderPage />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Home />} />
            <Route path="/job/getall" element={<Jobs />} />
            <Route path="/job/:id" element={<JobDetails />} />
            <Route path="/application/:id" element={<Application />} />
            <Route path="/applications/me" element={<MyApplications />} />
            <Route path="/applications/:jobId" element={<JobApplications />} />
            <Route path="/job/post" element={<PostJob />} />
            <Route path="/job/me" element={<MyJobs />} />
            <Route path="/tpo/login" element={<TPOLogin />} />
            <Route path="/tpo/register" element={<TPORegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Suspense>
        <Footer />
      </BrowserRouter>
    </>
  );
};

export default App;