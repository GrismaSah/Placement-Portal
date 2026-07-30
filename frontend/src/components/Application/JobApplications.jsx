import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import ResumeModal from "./ResumeModal";

const JobApplications = () => {
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeImageUrl, setResumeImageUrl] = useState("");

  const { isAuthorized, user } = useContext(Context);
  const navigateTo = useNavigate();

  const { jobId } = useParams();
  console.log(jobId);

  useEffect(() => {
    try {
      axios
        .get(
          "http://localhost:4000/api/v1/application/TNP/getall?jobId=" + jobId,
          {
            withCredentials: true,
          }
        )
        .then((res) => {
          console.log("response", res);

          setApplications(res.data.applications);
        });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  }, [isAuthorized]);

  if (!isAuthorized) {
    navigateTo("/");
  }

  const openModal = (imageUrl) => {
    setResumeImageUrl(imageUrl);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <section className="my_applications page">
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
                openModal={openModal}
              />
            );
          })
        )}
      </div>

      {modalOpen && (
        <ResumeModal imageUrl={resumeImageUrl} onClose={closeModal} />
      )}
    </section>
  );
};

export default JobApplications;

const TNPCard = ({ element, openModal }) => {
  return (
    <>
      <div className="job_seeker_card">
        <div className="detail">
          <p>
            <span>Name:</span> {element.name}
          </p>
          <p>
            <span>Email:</span> {element.email}
          </p>
          <p>
            <span>Phone:</span> {element.phone}
          </p>
          <p>
            <span>Address:</span> {element.address}
          </p>
          <p>
            <span>CoverLetter:</span> {element.coverLetter}
          </p>
        </div>
        <div className="resume">
          <img
            src={element.resume.url}
            alt="resume"
            onClick={() => openModal(element.resume.url)}
          />
        </div>
      </div>
    </>
  );
};