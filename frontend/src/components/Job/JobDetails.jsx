import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Context } from "../../main";
const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState({});
  const navigateTo = useNavigate();

  const { isAuthorized, user } = useContext(Context);

  useEffect(() => {
    const fetch = () => {
      axios
        .get(`http://localhost:4000/api/v1/job/${id}`, {
          withCredentials: true,
        })
        .then((res) => {
          setJob(res.data.job);
        })
        .catch((error) => {
          navigateTo("/notfound");
        });
    };
    fetch();
  }, []);

  // console.log("job", job);

  if (!isAuthorized) {
    navigateTo("/login");
  }

  const postedDate = new Date(job.jobPostedOn).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    
  });

  return (
    <section className="jobDetail page">
      <div className="container">
        <h3>Job Details</h3>
        <div className="banner">
          <p>
            Company: <span>{job.company}</span>
          </p>
          <p>
            Title: <span> {job.title}</span>
          </p>
          <p>
            Category: <span>{job.category}</span>
          </p>
          <p>
            Country: <span>{job.country}</span>
          </p>
          <p>
            City: <span>{job.city}</span>
          </p>

          <p>
            Description: <span>{job.description}</span>
          </p>
          <p>
            Job Posted On: <span>{postedDate}</span>
          </p>
          <p>
            Salary:{" "}
            {job.fixedSalary ? (
              <span>{job.fixedSalary}</span>
            ) : (
              <span>
                {job.salaryFrom} - {job.salaryTo}
              </span>
            )}
          </p>
          <p>
            Posted By:{" "}
            <span>
              {job?.postedBy?.name} <br /> {job?.postedBy?.email} <br />{" "}
              {job?.postedBy?.phone}
            </span>
          </p>
          {user && user.role === "Student" ? (
            <Link to={`/application/${job._id}`}>Apply Now</Link>
          ) : (
            <></>
          )}
        </div>
      </div>
    </section>
  );
};

export default JobDetails;