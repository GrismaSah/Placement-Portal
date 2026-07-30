import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import ResumeModal from "./ResumeModal";

const JobApplications = () => {
  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeResume, setActiveResume] = useState(null);

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

  const openModal = (resume) => {
    setActiveResume(resume);
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

      {modalOpen && activeResume && (
        <ResumeModal
          fileId={activeResume.fileId}
          contentType={activeResume.contentType}
          filename={activeResume.filename}
          onClose={closeModal}
        />
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
        {/* A PDF cannot be rendered as an <img>, and the file endpoint requires
            auth, so show a card that opens the authenticated viewer instead. */}
        <div className="resume">
          {element.resume?.fileId ? (
            <button
              type="button"
              className="resume_open"
              onClick={() => openModal(element.resume)}
            >
              <span className="resume_open_name">
                {element.resume.filename || "Resume"}
              </span>
              <span className="resume_open_cta">View resume</span>
            </button>
          ) : (
            <p>No resume attached</p>
          )}
        </div>
      </div>
    </>
  );
};