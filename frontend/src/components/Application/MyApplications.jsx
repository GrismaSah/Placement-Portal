import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import ResumeModal from "./ResumeModal";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeImageUrl, setResumeImageUrl] = useState("");

  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();

  useEffect(() => {
    try {
      if (user && user.role === "TNP") {
        axios
          .get("http://localhost:4000/api/v1/job/getmyjobs", {
            withCredentials: true,
          })
          .then((res) => {
            setApplications(res.data.myJobs);
          });
      } else if (user && user.role === "Student") {
        axios
          .get("http://localhost:4000/api/v1/application/jobseeker/getall", {
            withCredentials: true,
          })
          .then((res) => {
            setApplications(res.data.applications);
          });
      } else {
        axios
          .get("http://localhost:4000/api/v1/tpo/pending-tnps", {
            withCredentials: true,
          })
          .then((res) => {
            console.log("response", res);
            setApplications(res.data.pendingTNPs);
          });
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }, [isAuthorized]);

  if (!isAuthorized) {
    navigateTo("/");
  }

  const deleteApplication = (id) => {
    try {
      axios
        .delete(`http://localhost:4000/api/v1/application/delete/${id}`, {
          withCredentials: true,
        })
        .then((res) => {
          toast.success(res.data.message);
          setApplications((prevApplication) =>
            prevApplication.filter((application) => application._id !== id)
          );
        });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  const handlePendingTNP = (userId, action) => {
    try {
      axios
        .post(
          "http://localhost:4000/api/v1/tpo/tnp-request",
          { userId, action },
          {
            withCredentials: true,
          }
        )
        .then((res) => {
          toast.success(res.data.message);
          setApplications((prevApplication) =>
            prevApplication.filter((application) => application._id !== userId)
          );
        });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }

  const openModal = (imageUrl) => {
    setResumeImageUrl(imageUrl);
    setModalOpen(true);
  };


  return (
    <section className="my_applications page">
      {(() => {
        if (user && user.role === "Student") {
          return (
            <div className="container">
              <h1>My Applications</h1>
              {applications.length <= 0 ? (
                <>
                  <h4>No Applications Found</h4>
                </>
              ) : (
                applications.map((element) => {
                  return (
                    <JobSeekerCard
                      element={element}
                      key={element._id}
                      deleteApplication={deleteApplication}
                      openModal={openModal}
                    />
                  );
                })
              )}
            </div>
          );
        } else if (user && user.role === "TNP") {
          return (
            <div className="container">
              <h1>Applications From Students</h1>
              {applications.length <= 0 ? (
                <>
                  <h4>No Applications Found</h4>
                </>
              ) : (
                applications.map((element) => {
                  return (
                    <TNPCard
                      element={element}
                      key={element._id}
                    />
                  );
                })
              )}
            </div>
          );
        } else {
          console.log("applications", applications);
          return (
            <div className="container">
              <h1>TNP Applicants</h1>
              {applications.length <= 0 ? (
                <>
                  <h4>All TNP validated</h4>
                </>
              ) : (
                
                applications.map((element) => {
                  console.log("element", element);
                  return (
                    <TPOCard
                      element={element}
                      key={element._id}
                      handlePendingTNP={handlePendingTNP}
                    />
                  );
                })
              )}
            </div>
          );
        }
      })()}
    </section>
  );
};
export default MyApplications;

const JobSeekerCard = ({ element, deleteApplication, openModal }) => {
  console.log(element);
  const formattedDate = new Date(element.jobId.jobPostedOn).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
  
  return (
    <>
      <div className="job_seeker_card">
        <div className="details">
          {" "}
          <p>
            Company: <span>{element?.jobId?.company}</span>
          </p>
          <p>
            Job Title: <span>{element?.jobId?.title}</span>
          </p>
          <p>
            Category:<span> {element?.jobId?.category}</span>
          </p>
          <p>
            Country: <span>{element?.jobId?.country}</span>
          </p>
          <p>
            City: <span>{element?.jobId?.city}</span>
          </p>
          <p>
            Job Posted On: <span>{formattedDate}</span>
          </p>
        </div>{" "}
        <hr />
        <div className="detail">
          <p>
            Name:<span>{element.name}</span>
          </p>
          <p>
            Email:<span>{element.email}</span>
          </p>
          <p>
            Phone:<span>{element.phone}</span>
          </p>
          <p>
            Address:<span>{element.address}</span>
          </p>
          <p>
            CoverLetter:<span> {element.coverLetter}</span>
          </p>
        </div>
        <div className="resume">
          <img
            src={element.resume.url}
            alt="resume"
            onClick={() => openModal(element.resume.url)}
          />
        </div>
        <div className="btn_area">
          <button onClick={() => deleteApplication(element._id)}>
            Delete Application
          </button>
        </div>
      </div>
    </>
  );
};

const TNPCard = ({ element, openModal }) => {
  console.log("element", element);
  const formattedDate = new Date(element.jobPostedOn).toLocaleDateString(
    "en-US",
    {
      // weekday: "long", // e.g., Saturday
      year: "numeric", // e.g., 2024
      month: "long", // e.g., November
      day: "numeric", // e.g., 16
      hour: "2-digit", // e.g., 10 AM
      minute: "2-digit", // e.g., 29
    }
  );

  return (
    <>
      <div className="job_seeker_card">
        <Link to={"/applications/" + element._id}>
          <div className="detail">
            <p>
              Title: <span> {element.title}</span>
            </p>
            <p>
              Category: <span>{element.category}</span>
            </p>
            <p>
              Country: <span>{element.country}</span>
            </p>
            <p>
              City: <span>{element.city}</span>
            </p>
            <p>
              Company: <span>{element.company}</span>
            </p>
            <p>
              Description: <span>{element.description}</span>
            </p>
            <p>
              Job Posted On: <span>{formattedDate}</span>
            </p>
            <p>
              Application Count: <span>{element.applicationCount}</span>
            </p>
          </div>
        </Link>
      </div>
    </>
  );
};

const TPOCard = ({ element, handlePendingTNP }) => {
  console.log("element", element);
  const formattedDate = new Date(element.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <>
      <div className="job_seeker_card">
        <div className="detail">
          <p>
            Name: <span>{element.name}</span>
          </p>
          <p>
            Email: <span>{element.email}</span>
          </p>
          <p>
            Phone: <span>{element.phone}</span>
          </p>
          <p>
            Address: <span>{element.address}</span>
          </p>
          <p>
            Role: <span>{element.role}</span>
          </p>

          <p>
            Created At: <span>{formattedDate}</span>
          </p>
        </div>{" "}
        <p className="status">
          Status:
          <select
            value={element.status}
            onChange={(e) => handlePendingTNP(element._id, e.target.value)}
            className="status_select"
          >
            <option value="Pending" disabled>
              Pending
            </option>
            <option value="Approved">Approved</option>
            <option value="Declined">Declined</option>
          </select>
        </p>
      </div>
    </>
  );
};