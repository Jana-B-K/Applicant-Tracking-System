import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import JobManagement from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";
import Application from "../models/application.model.js";
import RbacPolicy from "../models/rbacPolicy.model.js";

const DEFAULT_POLICY_NAME = "default";

const DEFAULT_PERMISSION_MATRIX = {
  viewDashboard: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: true,
    interviewpanel: true,
    management: true,
  },
  viewJobs: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  createJobs: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  editJobs: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  deleteJobs: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  viewCandidates: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: true,
    interviewpanel: true,
    management: false,
  },
  addCandidates: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  editCandidates: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  manageCandidateStages: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
  manageUsers: {
    superadmin: true,
    hrrecruiter: true,
    hiringmanager: false,
    interviewpanel: false,
    management: false,
  },
};

const userSeed = [
  {
    firstName: "Super",
    lastName: "Admin",
    email: "superadmin@ats.local",
    empId: "EMP-SUP-001",
    role: "superadmin",
    isActive: true,
  },
  {
    firstName: "Harini",
    lastName: "Recruiter",
    email: "hr@ats.local",
    empId: "EMP-HR-001",
    role: "hrrecruiter",
    isActive: true,
  },
  {
    firstName: "Karthik",
    lastName: "Manager",
    email: "manager@ats.local",
    empId: "EMP-HM-001",
    role: "hiringmanager",
    isActive: true,
  },
  {
    firstName: "Nisha",
    lastName: "Panel",
    email: "panel@ats.local",
    empId: "EMP-IP-001",
    role: "interviewpanel",
    isActive: true,
  },
  {
    firstName: "Madhan",
    lastName: "Ops",
    email: "mgmt@ats.local",
    empId: "EMP-MG-001",
    role: "management",
    isActive: true,
  },
];

const jobTemplates = [
  {
    baseTitle: "Backend Developer",
    description: "Build and maintain Node.js APIs for ATS modules.",
    skillsRequired: ["Node.js", "Express", "MongoDB"],
    department: "Engineering",
    location: "Chennai",
    salaryRange: "8-12 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Frontend Developer",
    description: "Develop recruiter and dashboard UI features.",
    skillsRequired: ["React", "TypeScript", "REST API"],
    department: "Engineering",
    location: "Bengaluru",
    salaryRange: "7-11 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "QA Engineer",
    description: "Own automation and release quality for ATS workflows.",
    skillsRequired: ["Selenium", "Postman", "API Testing"],
    department: "Quality",
    location: "Coimbatore",
    salaryRange: "6-10 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Junior",
  },
  {
    baseTitle: "DevOps Engineer",
    description: "Manage CI/CD pipelines and cloud infrastructure.",
    skillsRequired: ["Docker", "AWS", "CI/CD"],
    department: "Platform",
    location: "Hyderabad",
    salaryRange: "10-16 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
];

const jobSeed = Array.from({ length: 20 }, (_, index) => {
  const template = jobTemplates[index % jobTemplates.length];
  const openingCount = (index % 3) + 1;
  const closureDate = new Date();
  closureDate.setDate(closureDate.getDate() + 20 + index * 2);

  return {
    jobTitle: `${template.baseTitle} ${index + 1}`,
    description: template.description,
    skillsRequired: template.skillsRequired,
    department: template.department,
    location: template.location,
    salaryRange: template.salaryRange,
    emplyementType: template.emplyementType,
    experienceLevel: template.experienceLevel,
    numberOfOpenings: openingCount,
    targetClosureDate: closureDate,
    jobStatus: "Open",
  };
});

const run = async () => {
  const shouldReset = process.argv.includes("--reset");

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in environment");
  }

  await mongoose.connect(process.env.MONGO_URI);

  if (shouldReset) {
    await Application.deleteMany({});
    await Candidate.deleteMany({});
    await JobManagement.deleteMany({});
    await User.deleteMany({});
    await RbacPolicy.deleteMany({});
    console.log("Seed reset: cleared existing data");
  }

  await RbacPolicy.findOneAndUpdate(
    { name: DEFAULT_POLICY_NAME },
    { $set: { permissions: DEFAULT_PERMISSION_MATRIX } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  const defaultPasswordHash = await bcrypt.hash("Password@1234", 10);
  for (const user of userSeed) {
    const existingUser = await User.findOne({
      $or: [{ email: user.email }, { empId: user.empId }],
    }).select("_id");

    if (existingUser) {
      await User.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            ...user,
            password: defaultPasswordHash,
          },
        }
      );
      continue;
    }

    await User.create({
      ...user,
      password: defaultPasswordHash,
    });
  }

  const users = await User.find({
    email: { $in: userSeed.map((u) => u.email) },
  });
  const userByEmail = new Map(users.map((u) => [u.email, u]));

  const hiringManager = userByEmail.get("manager@ats.local");
  if (!hiringManager) {
    throw new Error("Hiring manager user not found after user seed");
  }

  for (const job of jobSeed) {
    await JobManagement.findOneAndUpdate(
      { jobTitle: job.jobTitle, department: job.department, location: job.location },
      {
        $set: {
          ...job,
          hiringManager: `${hiringManager.firstName} ${hiringManager.lastName}`,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  const jobs = await JobManagement.find({
    jobTitle: { $in: jobSeed.map((j) => j.jobTitle) },
  });
  const jobByTitle = new Map(jobs.map((j) => [j.jobTitle, j]));

  const hrUser = userByEmail.get("hr@ats.local");
  const panelUser = userByEmail.get("panel@ats.local");
  if (!hrUser || !panelUser) {
    throw new Error("HR/Panel users not found after user seed");
  }

  const candidateSeed = Array.from({ length: 20 }, (_, index) => {
    const linkedJob = jobSeed[index % jobSeed.length];
    const hasInterview = index % 2 === 0;
    const status = hasInterview ? "Technical Interview 1" : "Screened";

    return {
      name: `Candidate ${index + 1}`,
      email: `candidate${index + 1}@candidate.local`,
      jobTitle: linkedJob.jobTitle,
      contactDetails: `+91-90000000${String(index + 1).padStart(2, "0")}`,
      location: linkedJob.location,
      skills: linkedJob.skillsRequired,
      experience: 2 + (index % 7),
      education: "B.E. Computer Science",
      noticePeriod: 15 + (index % 4) * 15,
      status,
      interviews: hasInterview
        ? [
            {
              stage: "Technical Interview 1",
              interviewer: {
                id: panelUser._id,
                name: `${panelUser.firstName} ${panelUser.lastName}`,
                email: panelUser.email,
                role: panelUser.role,
              },
              scheduledAt: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
              duration: 60,
              result: "Pending",
            },
          ]
        : [],
    };
  });

  for (const candidate of candidateSeed) {
    const job = jobByTitle.get(candidate.jobTitle);
    if (!job) {
      throw new Error(`Job not found for candidate seed: ${candidate.jobTitle}`);
    }

    await Candidate.findOneAndUpdate(
      { email: candidate.email },
      {
        $set: {
          name: candidate.name,
          email: candidate.email,
          jobID: job._id,
          contactDetails: candidate.contactDetails,
          location: candidate.location,
          skills: candidate.skills,
          experience: candidate.experience,
          education: candidate.education,
          noticePeriod: candidate.noticePeriod,
          role: job.jobTitle,
          status: candidate.status,
          interviews: candidate.interviews,
          statusHistory: [
            {
              status: candidate.status,
              comment: "Seeded candidate status",
              updatedAt: new Date(),
              updatedBy: hrUser._id,
              updatedByName: `${hrUser.firstName} ${hrUser.lastName}`,
              updatedByEmail: hrUser.email,
              updatedByRole: hrUser.role,
            },
          ],
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  const candidates = await Candidate.find({
    email: { $in: candidateSeed.map((c) => c.email) },
  });

  for (const candidate of candidates) {
    await Application.findOneAndUpdate(
      { candidate: candidate._id, job: candidate.jobID },
      {
        $set: {
          stage: "screening",
          movedAt: new Date(),
          notes: "Seeded application for dashboard testing.",
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  const [userCount, jobCount, candidateCount, applicationCount, policyCount] = await Promise.all([
    User.countDocuments(),
    JobManagement.countDocuments(),
    Candidate.countDocuments(),
    Application.countDocuments(),
    RbacPolicy.countDocuments(),
  ]);

  console.log("Seed completed successfully");
  console.log({
    users: userCount,
    jobs: jobCount,
    candidates: candidateCount,
    applications: applicationCount,
    rbacPolicies: policyCount,
    defaultPassword: "Password@1234",
  });
};

run()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
