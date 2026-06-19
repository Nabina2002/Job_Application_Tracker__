import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Application } from "../models/applicationSchema.js";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import cloudinary from "cloudinary";

export const postApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employer not allowed to access this resource.", 400)
    );
  }
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Resume File Required!", 400));
  }

  const { resume } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(resume.mimetype)) {
    return next(
      new ErrorHandler("Invalid file type. Please upload a PNG file.", 400)
    );
  }
  const cloudinaryResponse = await cloudinary.uploader.upload(
    resume.tempFilePath
  );

  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary Error:",
      cloudinaryResponse.error || "Unknown Cloudinary error"
    );
    return next(new ErrorHandler("Failed to upload Resume to Cloudinary", 500));
  }
  const { name, email, coverLetter, phone, address, jobId } = req.body;
  const applicantID = {
    user: req.user._id,
    role: "Job Seeker",
  };
  if (!jobId) {
    return next(new ErrorHandler("Job not found!", 404));
  }
  const jobDetails = await Job.findById(jobId);
  if (!jobDetails) {
    return next(new ErrorHandler("Job not found!", 404));
  }

  const employerID = {
    user: jobDetails.postedBy,
    role: "Employer",
  };
  if (
    !name ||
    !email ||
    !coverLetter ||
    !phone ||
    !address ||
    !applicantID ||
    !employerID ||
    !resume
  ) {
    return next(new ErrorHandler("Please fill all fields.", 400));
  }

  // Pull the employer's name to use as the "company" label, since Job
  // itself has no companyName field — only title + postedBy.
  const employerUser = await User.findById(jobDetails.postedBy);

  const application = await Application.create({
    name,
    email,
    coverLetter,
    phone,
    address,
    applicantID,
    employerID,
    jobId: jobDetails._id,
    jobTitle: jobDetails.title,
    companyName: employerUser?.name || "",
    appliedDate: Date.now(),
    resume: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });
  res.status(200).json({
    success: true,
    message: "Application Submitted!",
    application,
  });
});

/* Manually log an application the Job Seeker applied to outside the
   platform (no real Job document behind it). */
export const createManualApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }

    const { companyName, jobTitle, status, appliedDate, coverLetter } =
      req.body;

    if (!companyName || !jobTitle) {
      return next(
        new ErrorHandler("Company name and job title are required.", 400)
      );
    }

    const application = await Application.create({
      // Manual entries reuse the logged-in user's profile info for
      // name/email/phone/address so the schema's required fields are met.
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      address: req.user.address,
      coverLetter: coverLetter || "Manually logged application",
      companyName,
      jobTitle,
      status: status || "Applied",
      appliedDate: appliedDate || Date.now(),
      applicantID: {
        user: req.user._id,
        role: "Job Seeker",
      },
      employerID: {
        // Manual entries have no real employer in the system, so we
        // fall back to the job seeker themself just to satisfy the
        // required employerID.user field. Not used for filtering by
        // employer since these never show up in employerGetAllApplications
        // for a *different* user.
        user: req.user._id,
        role: "Employer",
      },
      resume: req.user.resume || { public_id: "manual", url: "" },
    });

    res.status(200).json({
      success: true,
      message: "Application added!",
      application,
    });
  }
);

/* Edit an existing application's editable fields. */
export const updateApplication = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employer not allowed to access this resource.", 400)
    );
  }

  const { id } = req.params;
  const application = await Application.findById(id);
  if (!application) {
    return next(new ErrorHandler("Application not found!", 404));
  }

  // Only the job seeker who owns this application can edit it.
  if (application.applicantID.user.toString() !== req.user._id.toString()) {
    return next(
      new ErrorHandler("You are not allowed to edit this application.", 403)
    );
  }

  const allowedFields = [
    "companyName",
    "jobTitle",
    "status",
    "appliedDate",
    "coverLetter",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      application[field] = req.body[field];
    }
  });

  await application.save();

  res.status(200).json({
    success: true,
    message: "Application updated!",
    application,
  });
});

export const employerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Job Seeker") {
      return next(
        new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "employerID.user": _id });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerGetAllApplications = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    const { _id } = req.user;
    const applications = await Application.find({ "applicantID.user": _id });
    res.status(200).json({
      success: true,
      applications,
    });
  }
);

export const jobseekerDeleteApplication = catchAsyncErrors(
  async (req, res, next) => {
    const { role } = req.user;
    if (role === "Employer") {
      return next(
        new ErrorHandler("Employer not allowed to access this resource.", 400)
      );
    }
    const { id } = req.params;
    const application = await Application.findById(id);
    if (!application) {
      return next(new ErrorHandler("Application not found!", 404));
    }
    await application.deleteOne();
    res.status(200).json({
      success: true,
      message: "Application Deleted!",
    });
  }
);