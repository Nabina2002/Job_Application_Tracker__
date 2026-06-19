import React, { useContext, useEffect, useState } from "react";
import { Context } from "../../main";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import ResumeModal from "./ResumeModal";

const STATUS_OPTIONS = ["Applied", "Interviewing", "Offer", "Rejected"];

/* ---------------- ADD / EDIT FORM (shared) ---------------- */
const ApplicationFormModal = ({ initialData, onClose, onSave, mode }) => {
  const [form, setForm] = useState({
    companyName: initialData?.companyName || "",
    jobTitle: initialData?.jobTitle || "",
    status: initialData?.status || "Applied",
    appliedDate: initialData?.appliedDate
      ? initialData.appliedDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    coverLetter: initialData?.coverLetter || "",
    notes: initialData?.notes || "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.jobTitle.trim()) {
      toast.error("Company name and job title are required");
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal_overlay">
      <div className="modal">
        <h3>{mode === "edit" ? "Edit Application" : "Add Application"}</h3>

        <form onSubmit={handleSubmit}>
          <label>
            Company Name
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              required
            />
          </label>

          <label>
            Job Title
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => handleChange("jobTitle", e.target.value)}
              required
            />
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label>
            Applied Date
            <input
              type="date"
              value={form.appliedDate}
              onChange={(e) => handleChange("appliedDate", e.target.value)}
            />
          </label>

          <label>
            Cover Letter / Notes
            <textarea
              rows={4}
              value={form.coverLetter}
              onChange={(e) => handleChange("coverLetter", e.target.value)}
            />
          </label>

          <div className="modal_actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */
const MyApplications = () => {
  const { user, isAuthenticated } = useContext(Context);
  const navigateTo = useNavigate();

  const [applications, setApplications] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [resumeImageUrl, setResumeImageUrl] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" | "edit"
  const [selectedApp, setSelectedApp] = useState(null);

  const [filter, setFilter] = useState("all");

  /* Redirect unauthenticated users — runs in an effect, not during render */
  useEffect(() => {
    if (!isAuthenticated) {
      navigateTo("/");
    }
  }, [isAuthenticated, navigateTo]);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!isAuthenticated) return;

    const url =
      user && user.role === "Employer"
        ? "http://localhost:4000/api/v1/application/employer/getall"
        : "http://localhost:4000/api/v1/application/jobseeker/getall";

    axios
      .get(url, { withCredentials: true })
      .then((res) => setApplications(res.data.applications))
      .catch((err) =>
        toast.error(err.response?.data?.message || "Error fetching data"),
      );
  }, [isAuthenticated, user]);

  /* ---------------- DELETE (with confirmation) ---------------- */
  const deleteApplication = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application? This cannot be undone.",
    );
    if (!confirmed) return;

    axios
      .delete(`http://localhost:4000/api/v1/application/delete/${id}`, {
        withCredentials: true,
      })
      .then((res) => {
        toast.success(res.data.message);
        setApplications((prev) => prev.filter((app) => app._id !== id));
      })
      .catch((err) => toast.error(err.response?.data?.message));
  };

  /* ---------------- RESUME MODAL ---------------- */
  const openModal = (imageUrl) => {
    setResumeImageUrl(imageUrl);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  /* ---------------- ADD ---------------- */
  const openAddForm = () => {
    setSelectedApp(null);
    setFormMode("add");
    setFormOpen(true);
  };

  const createApplication = (formData) => {
    // NOTE: backend route below is a placeholder.
    // Needs: POST /api/v1/application/manual -> creates an application
    // owned by the logged-in Job Seeker, with companyName/jobTitle/status/
    // appliedDate/coverLetter fields on the Application model.
    axios
      .post("http://localhost:4000/api/v1/application/manual", formData, {
        withCredentials: true,
      })
      .then((res) => {
        toast.success("Application added");
        setApplications((prev) => [...prev, res.data.application]);
        setFormOpen(false);
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "Could not add application"),
      );
  };

  /* ---------------- EDIT ---------------- */
  const openEditForm = (app) => {
    setSelectedApp(app);
    setFormMode("edit");
    setFormOpen(true);
  };

  const updateApplication = (formData) => {
    // NOTE: backend route below is a placeholder.
    // Needs: PUT /api/v1/application/update/:id -> updates the fields
    // sent in formData and returns the updated application.
    axios
      .put(
        `http://localhost:4000/api/v1/application/update/${selectedApp._id}`,
        formData,
        { withCredentials: true },
      )
      .then((res) => {
        toast.success("Application updated");
        setApplications((prev) =>
          prev.map((app) =>
            app._id === selectedApp._id ? res.data.application : app,
          ),
        );
        setFormOpen(false);
        setSelectedApp(null);
      })
      .catch((err) =>
        toast.error(
          err.response?.data?.message || "Could not update application",
        ),
      );
  };

  const handleFormSave = (formData) => {
    if (formMode === "edit") {
      updateApplication(formData);
    } else {
      createApplication(formData);
    }
  };

  /* ---------------- FILTER ---------------- */
  const filteredApplications = applications.filter((app) => {
    if (filter === "all") return true;
    return app.status === filter;
  });

  /* ---------------- UI ---------------- */
  return (
    <section className="my_applications page">
      <div className="applications_header">
        {/* FILTER UI */}
        <div className="filter_bar">
          <label>
            Filter by status:{" "}
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Only Job Seekers manually log applications */}
        {user && user.role === "Job Seeker" && (
          <button className="add_btn" onClick={openAddForm}>
            + Add Application
          </button>
        )}
      </div>

      {/* JOBSEEKER VIEW */}
      {user && user.role === "Job Seeker" ? (
        <div className="container">
          <h1>My Applications</h1>

          {filteredApplications.length <= 0 ? (
            <h4>No Applications Found</h4>
          ) : (
            filteredApplications.map((element) => (
              <JobSeekerCard
                key={element._id}
                element={element}
                deleteApplication={deleteApplication}
                openModal={openModal}
                openEditForm={openEditForm}
              />
            ))
          )}
        </div>
      ) : (
        /* EMPLOYER VIEW */
        <div className="container">
          <h1>Applications From Job Seekers</h1>

          {filteredApplications.length <= 0 ? (
            <h4>No Applications Found</h4>
          ) : (
            filteredApplications.map((element) => (
              <EmployerCard
                key={element._id}
                element={element}
                openModal={openModal}
              />
            ))
          )}
        </div>
      )}

      {/* RESUME MODAL */}
      {modalOpen && (
        <ResumeModal imageUrl={resumeImageUrl} onClose={closeModal} />
      )}

      {/* ADD / EDIT FORM MODAL */}
      {formOpen && (
        <ApplicationFormModal
          mode={formMode}
          initialData={selectedApp}
          onClose={() => {
            setFormOpen(false);
            setSelectedApp(null);
          }}
          onSave={handleFormSave}
        />
      )}
    </section>
  );
};

export default MyApplications;

/* ---------------- JOB SEEKER CARD ---------------- */
const JobSeekerCard = ({
  element,
  deleteApplication,
  openModal,
  openEditForm,
}) => {
  return (
    <div className="job_seeker_card">
      <div className="detail">
        <p>
          <span>Company:</span> {element.companyName || "—"}
        </p>
        <p>
          <span>Job Title:</span> {element.jobTitle || "—"}
        </p>
        <p>
          <span>Status:</span> {element.status || "Applied"}
        </p>
        <p>
          <span>Applied Date:</span>{" "}
          {element.appliedDate
            ? new Date(element.appliedDate).toLocaleDateString()
            : "—"}
        </p>
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

      {element.resume?.url && (
        <div className="resume">
          <img
            src={element.resume.url}
            alt="resume"
            onClick={() => openModal(element.resume.url)}
          />
        </div>
      )}

      <div className="btn_area">
        <button onClick={() => openEditForm(element)}>Edit</button>
        <button onClick={() => deleteApplication(element._id)}>Delete</button>
      </div>
    </div>
  );
};

/* ---------------- EMPLOYER CARD ---------------- */
const EmployerCard = ({ element, openModal }) => {
  return (
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

      {element.resume?.url && (
        <div className="resume">
          <img
            src={element.resume.url}
            alt="resume"
            onClick={() => openModal(element.resume.url)}
          />
        </div>
      )}
    </div>
  );
};
