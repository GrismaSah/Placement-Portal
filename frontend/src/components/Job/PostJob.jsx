import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { Context } from "../../main";
import { LuLoader2 } from "react-icons/lu";
import { JOB_CATEGORIES } from "../../constants/jobTaxonomy";

const PostJob = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [company, setCompany] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [fixedSalary, setFixedSalary] = useState("");
  const [salaryType, setSalaryType] = useState("default");

  const [open, setOpen] = useState(false);

  const { isAuthorized, user } = useContext(Context);

  const navigateTo = useNavigate();

  const handleJobPost = async (e) => {
    e.preventDefault();
    setOpen(true);
    if (salaryType === "Fixed Salary") {
      setSalaryFrom("");
      setSalaryFrom("");
    } else if (salaryType === "Ranged Salary") {
      setFixedSalary("");
    } else {
      setSalaryFrom("");
      setSalaryTo("");
      setFixedSalary("");
    }
    await axios
      .post(
        "http://localhost:4000/api/v1/job/post",
        fixedSalary.length >= 4
          ? {
              title,
              description,
              category,
              country,
              city,
              company,
              fixedSalary,
            }
          : {
              title,
              description,
              category,
              country,
              city,
              company,
              salaryFrom,
              salaryTo,
            },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        toast.success(res.data.message);
        setTitle("");
        setDescription("");
        setCategory("");
        setCountry("");
        setCity("");
        setCompany("");
        setSalaryFrom("");
        setSalaryTo("");
        setFixedSalary("");
        setSalaryType("default");
      })
      .catch((err) => {
        toast.error(err.response.data.message);
      })
      .finally(() => {
        setOpen(false);
      });
  };

  if (!isAuthorized || (user && user.role !== "TNP")) {
    navigateTo("/");
  }

  if(user.status === "Approved") { return (
    <>
      <div className="job_post page">
        <div className="container">
          <h3>POST NEW JOB</h3>
          <form onSubmit={handleJobPost}>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company"
            />
            <div className="wrapper">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Job Title"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="" disabled>
                  Select Category
                </option>
                {JOB_CATEGORIES.map((c) => (
                  <option value={c.value} key={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="wrapper">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
              />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="salary_wrapper">
              <select
                value={salaryType}
                onChange={(e) => setSalaryType(e.target.value)}
              >
                <option value="default" disabled>
                  Select Salary Type
                </option>
                <option value="Fixed Salary">Fixed Salary</option>
                <option value="Ranged Salary">Ranged Salary</option>
              </select>
              <div>
                {salaryType === "default" ? (
                  <p>Please provide Salary Type *</p>
                ) : salaryType === "Fixed Salary" ? (
                  <input
                    type="number"
                    placeholder="Enter Fixed Salary"
                    value={fixedSalary}
                    onChange={(e) => setFixedSalary(e.target.value)}
                  />
                ) : (
                  <div className="ranged_salary">
                    <input
                      type="number"
                      placeholder="Fixed Salary"
                      value={salaryFrom}
                      onChange={(e) => setSalaryFrom(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="CTC Salary"
                      value={salaryTo}
                      onChange={(e) => setSalaryTo(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
            <textarea
              rows="10"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Job Description"
            />
            <button type="submit">
              {open ? <LuLoader2 className="circular_loader" /> : "Create Job"}
            </button>
          </form>
        </div>
      </div>
    </>
  )} else if (user.status === "Pending")
    return (
      <>
        <div className="job_post page">
          <div className="container">
            <h3>POST NEW JOB</h3>
            <div className="pending">
              <h4>Your account is pending for approval!</h4>
              <p>
                You will be able to post jobs once your account is approved by
                the Admin.
              </p>
            </div>
          </div>
        </div>
      </>
    )
    else return (
      <>
        <div className="job_post page">
          <div className="container">
            <h3>POST NEW JOB</h3>
            <div className="pending">
              <h4>Your account has been declined!</h4>
              <p>
                You will not be able to post jobs as your account has been
                declined by the TPO.
              </p>
            </div>
          </div>
        </div>
      </>
    )
};

export default PostJob;