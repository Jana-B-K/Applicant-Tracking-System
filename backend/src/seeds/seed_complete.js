import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import JobManagement from "../models/job.model.js";
import Candidate from "../models/candidate.model.js";
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
    interviewpanel: true,
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
    email: "superadmin@ats.com",
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
    firstName: "Jana",
    lastName: "Panel",
    email: "jana.panel@ats.local",
    empId: "EMP-IP-002",
    role: "interviewpanel",
    isActive: true,
  },
  {
    firstName: "Nayeem",
    lastName: "Panel",
    email: "nayeem.panel@ats.local",
    empId: "EMP-IP-003",
    role: "interviewpanel",
    isActive: true,
  },
  {
    firstName: "Girih",
    lastName: "Panel",
    email: "girih.panel@ats.local",
    empId: "EMP-IP-004",
    role: "interviewpanel",
    isActive: true,
  },
  {
    firstName: "Nirmal",
    lastName: "Panel",
    email: "nirmal.panel@ats.local",
    empId: "EMP-IP-005",
    role: "interviewpanel",
    isActive: true,
  },
  {
    firstName: "Nishan",
    lastName: "Panel",
    email: "nishan.panel@ats.local",
    empId: "EMP-IP-006",
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
    baseTitle: "Senior Backend Developer",
    description: "We are seeking a Senior Backend Developer to design and develop scalable Node.js APIs for our Applicant Tracking System (ATS) modules using microservices architecture. You will be responsible for building high-performance backend services, implementing RESTful APIs and GraphQL endpoints, managing database operations with MongoDB and PostgreSQL, and deploying applications using Docker and Kubernetes on AWS infrastructure. The role requires expertise in system design, caching with Redis, message queuing with RabbitMQ, and ensuring high availability and scalability. You will collaborate with frontend teams, DevOps engineers, and product managers to deliver robust backend solutions that handle millions of requests daily.",
    skillsRequired: ["Node.js", "Express", "MongoDB", "PostgreSQL", "Docker", "Kubernetes", "AWS", "Redis", "RabbitMQ", "System Design", "REST API", "GraphQL"],
    department: "Engineering",
    location: "Bengaluru",
    salaryRange: "18-28 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
  {
    baseTitle: "Frontend Engineer",
    description: "Join our team as a Frontend Engineer to build responsive and interactive user interfaces for our recruiter dashboard using modern React patterns. You will develop complex UI components using React, TypeScript, and Redux for state management, implement responsive designs with Material-UI and Tailwind CSS, write comprehensive unit tests with Jest and React Testing Library, optimize application performance, ensure accessibility compliance, and work with Webpack for build optimization. The role involves collaborating with UX designers, backend developers, and product teams to create intuitive user experiences that handle large datasets efficiently and provide real-time updates.",
    skillsRequired: ["React", "TypeScript", "Redux", "Material-UI", "Tailwind CSS", "Jest", "React Testing Library", "Webpack", "REST API", "Performance Optimization", "Accessibility", "Git"],
    department: "Engineering",
    location: "Bengaluru",
    salaryRange: "12-18 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Full Stack Developer",
    description: "We are looking for a Full Stack Developer to develop end-to-end features for our ATS platform, handling both backend and frontend components. You will build responsive web applications using React for frontend development, create robust backend services with Node.js and Express, manage databases with MongoDB, implement REST APIs, write clean HTML5/CSS3/JavaScript code, containerize applications with Docker, and deploy on AWS infrastructure. The role requires full-stack expertise to deliver complete features from database design to user interface, ensuring seamless integration between frontend and backend systems while maintaining code quality and following best practices.",
    skillsRequired: ["React", "Node.js", "MongoDB", "Express", "TypeScript", "REST API", "HTML5", "CSS3", "JavaScript", "Git", "Docker", "AWS"],
    department: "Engineering",
    location: "Hyderabad",
    salaryRange: "14-22 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "QA Automation Engineer",
    description: "As a QA Automation Engineer, you will design and execute comprehensive automation test strategies for our ATS workflows and APIs. You will develop automated test suites using Selenium WebDriver, create API testing frameworks with Postman and REST Assured, implement test automation in Java with TestNG and JUnit, build Cypress-based end-to-end tests, perform database testing with SQL, integrate automated testing into CI/CD pipelines, and collaborate with development teams to ensure quality across all platforms. The role involves creating robust test frameworks, maintaining test data, generating detailed test reports, and continuously improving testing processes to catch defects early in the development cycle.",
    skillsRequired: ["Selenium", "Postman", "API Testing", "JUnit", "TestNG", "Cypress", "Java", "Python", "SQL", "CI/CD", "Git", "Jira"],
    department: "Quality",
    location: "Coimbatore",
    salaryRange: "10-15 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "DevOps Engineer",
    description: "We are seeking a DevOps Engineer to manage CI/CD pipelines and cloud infrastructure for our ATS platform. You will design and implement automated deployment pipelines using Jenkins and GitLab CI, manage container orchestration with Docker and Kubernetes, provision and maintain AWS infrastructure, implement infrastructure as code with Terraform and Ansible, monitor system performance with Prometheus and ELK stack, ensure system security and compliance, automate operational tasks with Bash and Python scripting, and collaborate with development and operations teams to ensure reliable and scalable deployments. The role requires expertise in cloud architecture, automation, monitoring, and maintaining high availability systems.",
    skillsRequired: ["Docker", "Kubernetes", "AWS", "Jenkins", "GitLab CI", "Terraform", "Ansible", "Linux", "Prometheus", "ELK Stack", "Bash", "Python"],
    department: "Platform",
    location: "Chennai",
    salaryRange: "16-24 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
  {
    baseTitle: "Database Administrator",
    description: "Join our team as a Database Administrator to manage MongoDB and PostgreSQL databases with a focus on performance optimization. You will design and implement database schemas, optimize query performance and indexing strategies, manage database replication and sharding for high availability, handle backup and recovery procedures, monitor database performance and health, implement security measures and access controls, work with development teams on database design best practices, perform database migrations and upgrades, troubleshoot performance issues, and ensure data integrity and compliance. The role requires deep expertise in both SQL and NoSQL databases, performance tuning, and database administration best practices.",
    skillsRequired: ["MongoDB", "PostgreSQL", "MySQL", "Database Design", "Query Optimization", "Backup & Recovery", "Replication", "Sharding", "SQL", "NoSQL", "Linux", "Performance Tuning"],
    department: "Platform",
    location: "Bengaluru",
    salaryRange: "14-20 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Cloud Architect",
    description: "We are looking for a Cloud Architect to design and implement cloud solutions on AWS with high availability and scalability. You will architect cloud-native solutions using EC2, S3, RDS, and Lambda services, design VPC networks and security groups, implement Infrastructure as Code with CloudFormation and Terraform, optimize cloud costs and performance, implement security best practices and compliance requirements, design disaster recovery and backup strategies, collaborate with development teams on cloud migration projects, monitor and troubleshoot cloud infrastructure, and ensure scalability and reliability of cloud-based applications. The role requires deep AWS expertise and cloud architecture best practices.",
    skillsRequired: ["AWS", "EC2", "S3", "RDS", "Lambda", "CloudFormation", "VPC", "IAM", "Cost Optimization", "Security", "Terraform", "Docker"],
    department: "Platform",
    location: "Bengaluru",
    salaryRange: "22-32 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
  {
    baseTitle: "Python Developer",
    description: "As a Python Developer, you will build data processing pipelines and backend services using Python frameworks. You will develop web applications with Django and Flask, create REST APIs with FastAPI, work with data using Pandas and NumPy libraries, manage databases with SQLAlchemy, implement data processing workflows, containerize applications with Docker, deploy on AWS infrastructure, write unit and integration tests, collaborate with data scientists and analysts, optimize application performance, and maintain code quality standards. The role involves building scalable backend services and data processing systems that handle large volumes of data efficiently.",
    skillsRequired: ["Python", "Django", "Flask", "FastAPI", "Pandas", "NumPy", "SQLAlchemy", "REST API", "PostgreSQL", "MongoDB", "Git", "Docker"],
    department: "Engineering",
    location: "Hyderabad",
    salaryRange: "12-18 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "React Native Developer",
    description: "We are seeking a React Native Developer to build cross-platform mobile applications for our ATS platform. You will develop native mobile apps for iOS and Android using React Native, implement state management with Redux, integrate Firebase for backend services, build custom native modules when required, write comprehensive tests, ensure app performance and responsiveness, implement push notifications and offline functionality, work with native iOS and Android development teams, optimize app bundle size and loading times, maintain code quality with TypeScript, and deploy apps to app stores. The role requires expertise in cross-platform mobile development and native platform integration.",
    skillsRequired: ["React Native", "JavaScript", "TypeScript", "Redux", "Firebase", "Native Modules", "Testing", "Git", "REST API", "iOS", "Android", "Expo"],
    department: "Engineering",
    location: "Pune",
    salaryRange: "13-19 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Security Engineer",
    description: "Join our team as a Security Engineer to implement security best practices and conduct vulnerability assessments for our ATS platform. You will perform security audits and penetration testing, implement OWASP security guidelines, manage encryption and authentication systems, configure SSL/TLS certificates, work with Linux systems and security hardening, implement network security measures and firewalls, conduct security training and awareness programs, monitor security incidents and respond to threats, ensure compliance with security standards, perform vulnerability assessments, and collaborate with development teams on secure coding practices. The role requires expertise in cybersecurity, threat detection, and security best practices.",
    skillsRequired: ["Cybersecurity", "OWASP", "Penetration Testing", "Encryption", "Authentication", "SSL/TLS", "Linux", "Network Security", "Compliance", "Security Audits", "Firewalls", "IDS/IPS"],
    department: "Security",
    location: "Bengaluru",
    salaryRange: "16-24 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
  {
    baseTitle: "Data Engineer",
    description: "As a Data Engineer, you will build ETL pipelines and data warehousing solutions for analytics. You will design and implement data pipelines using Apache Spark and Hadoop, work with Hive for data warehousing, write complex SQL queries for data transformation, build real-time data processing with Kafka, manage data lakes and warehouses on AWS, implement data quality checks and validation, optimize data processing performance, work with data scientists on ML pipelines, ensure data security and compliance, monitor pipeline performance and reliability, and collaborate with analysts on data requirements. The role requires expertise in big data technologies and data engineering best practices.",
    skillsRequired: ["Python", "Apache Spark", "Hadoop", "Hive", "SQL", "Data Warehousing", "ETL", "AWS", "Git", "Scala", "Kafka", "BigData"],
    department: "Data",
    location: "Bengaluru",
    salaryRange: "15-22 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Machine Learning Engineer",
    description: "We are looking for a Machine Learning Engineer to develop ML models for candidate matching and resume parsing. You will build and deploy machine learning models using TensorFlow and PyTorch, implement NLP algorithms for text processing and resume parsing, perform data analysis with Pandas and NumPy, develop recommendation systems for candidate-job matching, optimize model performance and accuracy, deploy models to production with Flask APIs, work with large datasets on AWS infrastructure, implement MLOps practices, collaborate with data scientists and product teams, monitor model performance in production, and continuously improve ML systems based on feedback and new data.",
    skillsRequired: ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "NLP", "Deep Learning", "Data Analysis", "Pandas", "NumPy", "Git", "AWS", "Flask"],
    department: "Data",
    location: "Bengaluru",
    salaryRange: "18-28 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
  {
    baseTitle: "Java Developer",
    description: "Join our team as a Java Developer to develop robust backend services and enterprise applications. You will build scalable applications using Spring Boot and Spring MVC frameworks, implement data persistence with Hibernate ORM, work with MySQL and PostgreSQL databases, develop REST APIs and microservices, write comprehensive unit tests with JUnit and integration tests, manage project builds with Maven, implement design patterns and best practices, ensure application security and performance, collaborate with frontend developers and architects, troubleshoot production issues, and maintain code quality standards. The role requires strong Java fundamentals and enterprise application development experience.",
    skillsRequired: ["Java", "Spring Boot", "Spring MVC", "Hibernate", "MySQL", "PostgreSQL", "REST API", "JUnit", "Maven", "Git", "Microservices", "Docker"],
    department: "Engineering",
    location: "Hyderabad",
    salaryRange: "12-18 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Technical Lead",
    description: "We are seeking a Technical Lead to guide engineering teams and drive technical decisions for our ATS platform development. You will lead development teams and mentor junior developers, conduct code reviews and ensure code quality standards, make architectural decisions and system design choices, collaborate with product managers on technical requirements, drive DevOps practices and deployment strategies, ensure scalability and performance of applications, work with cross-functional teams on project planning, implement best practices and coding standards, evaluate new technologies and tools, resolve technical challenges and blockers, and contribute to technical roadmap planning. The role requires strong leadership, technical expertise, and communication skills.",
    skillsRequired: ["System Design", "Architecture", "Node.js", "React", "Leadership", "Mentoring", "Code Review", "Problem Solving", "Communication", "Agile", "DevOps", "AWS"],
    department: "Engineering",
    location: "Bengaluru",
    salaryRange: "20-30 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
  {
    baseTitle: "Performance Engineer",
    description: "As a Performance Engineer, you will optimize application performance and conduct load testing for our ATS platform. You will design and execute performance test scenarios using JMeter, profile application performance with browser dev tools, monitor system metrics with Grafana and New Relic, identify performance bottlenecks in Node.js and React applications, implement performance optimizations and caching strategies, conduct load testing and stress testing, analyze performance data and generate reports, work with development teams on performance improvements, implement monitoring and alerting systems, optimize database queries and API performance, and ensure applications meet performance SLAs. The role requires expertise in performance testing, monitoring, and optimization techniques.",
    skillsRequired: ["JMeter", "Load Testing", "Performance Profiling", "Node.js", "React", "Browser DevTools", "Network Analysis", "Monitoring", "Grafana", "New Relic", "Prometheus", "DataDog"],
    department: "Quality",
    location: "Pune",
    salaryRange: "13-19 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Golang Backend Developer",
    description: "We are looking for a Golang Backend Developer to build high-performance services using Go language. You will develop backend services with Gin web framework, implement gRPC services for microservices communication, manage data with PostgreSQL and Redis, implement concurrent programming patterns, write comprehensive tests and benchmarks, containerize applications with Docker, deploy on Kubernetes clusters, ensure high performance and low latency, implement security best practices, work with development teams on API design, optimize resource usage and memory management, and maintain code quality standards. The role requires expertise in Go programming and high-performance systems development.",
    skillsRequired: ["Go", "Gin", "REST API", "PostgreSQL", "Redis", "Docker", "Kubernetes", "gRPC", "Concurrency", "Testing", "Performance", "AWS"],
    department: "Engineering",
    location: "Bengaluru",
    salaryRange: "16-24 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
  {
    baseTitle: "Mobile Application Developer",
    description: "Join our team as a Mobile Application Developer to develop iOS and Android applications for our ATS platform. You will build native iOS apps with Swift and Android apps with Kotlin, implement MVVM architecture patterns, develop responsive and intuitive user interfaces, integrate REST APIs for data communication, implement local data storage and offline functionality, write unit and UI tests, ensure app performance and battery optimization, work with Firebase for backend services, implement push notifications and analytics, deploy apps to App Store and Play Store, maintain app compatibility across devices, and collaborate with backend teams on API integration. The role requires expertise in native mobile development for both platforms.",
    skillsRequired: ["Swift", "Kotlin", "iOS Development", "Android Development", "REST API", "Firebase", "Mobile UI", "Testing", "Git", "Xcode", "Android Studio", "MVVM"],
    department: "Engineering",
    location: "Pune",
    salaryRange: "14-20 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Product Manager",
    description: "We are seeking a Product Manager to lead product strategy and roadmap for our ATS platform. You will define product vision and strategy, conduct user research and gather requirements, analyze product metrics and user behavior with SQL queries, collaborate with design and engineering teams, create and maintain product roadmaps, prioritize features using data-driven decisions, work with stakeholders to align on product goals, conduct competitive analysis and market research, define success metrics and KPIs, manage product launches and go-to-live processes, and continuously iterate on product features based on user feedback. The role requires strong analytical skills, communication abilities, and product management expertise.",
    skillsRequired: ["Product Strategy", "Analytics", "SQL", "Data Analysis", "Communication", "Agile", "Roadmapping", "Market Analysis", "Competitive Analysis", "Metrics", "Stakeholder Management", "User Research"],
    department: "Product",
    location: "Bengaluru",
    salaryRange: "18-28 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
  {
    baseTitle: "Solutions Architect",
    description: "As a Solutions Architect, you will design scalable solutions for enterprise ATS implementations. You will architect enterprise-grade solutions using modern technologies, design system integrations and API strategies, ensure scalability and high availability, implement security best practices and compliance requirements, work with cloud platforms and containerization, collaborate with enterprise clients on technical requirements, create technical specifications and architecture diagrams, evaluate technology choices and make recommendations, ensure solutions meet performance and reliability standards, provide technical leadership to implementation teams, and support post-implementation optimization. The role requires deep technical expertise and enterprise solution design experience.",
    skillsRequired: ["System Architecture", "Enterprise Solutions", "AWS", "Docker", "Kubernetes", "Database Design", "Security", "Best Practices", "Communication", "Consulting", "Enterprise Java", "Integration"],
    department: "Solutions",
    location: "Bengaluru",
    salaryRange: "20-30 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
  {
    baseTitle: "Blockchain Developer",
    description: "We are looking for a Blockchain Developer to develop blockchain-based solutions for credential verification. You will develop smart contracts using Solidity on Ethereum, implement Web3.js integrations for frontend applications, work with blockchain protocols and consensus mechanisms, implement cryptographic algorithms and security measures, develop DeFi applications and token systems, write comprehensive tests for smart contracts, ensure gas optimization and cost efficiency, implement secure wallet integrations, work with blockchain APIs and oracles, deploy contracts to test and main networks, monitor blockchain transactions and events, and collaborate with security teams on audit requirements. The role requires expertise in blockchain development and cryptocurrency technologies.",
    skillsRequired: ["Solidity", "Ethereum", "Smart Contracts", "Web3.js", "Blockchain", "Cryptography", "DeFi", "JavaScript", "Git", "Testing", "Security", "Consensus"],
    department: "Engineering",
    location: "Bengaluru",
    salaryRange: "18-26 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Senior",
  },
  {
    baseTitle: "API Developer",
    description: "Join our team as an API Developer to design and develop RESTful APIs for third-party integrations. You will design and implement REST APIs with proper versioning and documentation, develop GraphQL APIs for flexible data querying, implement authentication and authorization mechanisms, design rate limiting and throttling strategies, ensure API security and data validation, work with MongoDB and PostgreSQL databases, create comprehensive API documentation with Swagger, implement error handling and logging, optimize API performance and response times, conduct API testing and validation, work with third-party integration teams, and maintain API backward compatibility. The role requires expertise in API design, documentation, and integration best practices.",
    skillsRequired: ["REST API", "Node.js", "Express", "API Documentation", "GraphQL", "Authentication", "Rate Limiting", "Versioning", "MongoDB", "PostgreSQL", "Postman", "Git"],
    department: "Engineering",
    location: "Hyderabad",
    salaryRange: "13-19 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "UI/UX Developer",
    description: "We are seeking a UI/UX Developer to create beautiful and intuitive user interfaces for our ATS platform. You will design and develop responsive web interfaces using React, implement modern CSS with Tailwind CSS and CSS animations, ensure accessibility compliance and WCAG standards, create interactive prototypes with Figma, optimize user experience and performance, implement design systems and component libraries, work closely with UX designers on implementation, ensure cross-browser compatibility, implement responsive design patterns, optimize loading times and user interactions, conduct user testing and gather feedback, and maintain design consistency across applications. The role requires strong design skills combined with development expertise.",
    skillsRequired: ["React", "Figma", "HTML5", "CSS3", "JavaScript", "Responsive Design", "Accessibility", "CSS Animations", "Design Systems", "Performance", "Git", "Animation"],
    department: "Design",
    location: "Pune",
    salaryRange: "12-17 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "System Administrator",
    description: "As a System Administrator, you will manage infrastructure, servers, and network for our ATS platform. You will administer Windows and Linux servers, manage network infrastructure and security, implement backup and disaster recovery procedures, monitor system performance and availability, manage Active Directory and user access controls, implement security policies and compliance measures, automate administrative tasks with PowerShell and Bash, work with cloud infrastructure and virtualization, troubleshoot system and network issues, ensure high availability and uptime, collaborate with development teams on infrastructure requirements, and maintain system documentation and procedures. The role requires expertise in system administration and infrastructure management.",
    skillsRequired: ["Linux", "Windows Server", "Networking", "Security", "Backup & Recovery", "System Monitoring", "Cloud", "AWS", "Virtual Machines", "Automation", "Bash", "PowerShell"],
    department: "Operations",
    location: "Coimbatore",
    salaryRange: "11-16 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Integration Engineer",
    description: "We are looking for an Integration Engineer to integrate third-party services and build connectors for our ATS platform. You will design and implement API integrations with third-party services, work with webhooks and real-time data synchronization, develop custom connectors and middleware, implement data mapping and transformation logic, ensure secure authentication and data transmission, handle error handling and retry mechanisms, write comprehensive integration tests, document integration processes and APIs, work with Zapier and other integration platforms, monitor integration performance and reliability, troubleshoot integration issues, and collaborate with external vendors on API specifications. The role requires expertise in API integration and data synchronization.",
    skillsRequired: ["API Integration", "Webhook", "Node.js", "REST API", "Authentication", "Data Mapping", "Error Handling", "Testing", "Documentation", "Git", "Postman", "Zapier"],
    department: "Engineering",
    location: "Hyderabad",
    salaryRange: "13-19 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Release Engineer",
    description: "Join our team as a Release Engineer to manage release cycles and deployment processes. You will design and maintain CI/CD pipelines with Jenkins and GitLab, manage application deployments with Docker and Kubernetes, implement release management and versioning strategies, automate build and deployment processes, ensure release quality and rollback capabilities, work with development teams on branching strategies, implement automated testing in pipelines, monitor deployment success and performance, troubleshoot deployment issues and failures, maintain release documentation and procedures, coordinate releases across multiple environments, and ensure compliance with release standards. The role requires expertise in DevOps practices and release management.",
    skillsRequired: ["CI/CD", "Jenkins", "GitLab", "Docker", "Kubernetes", "Release Management", "Scripting", "Bash", "Git", "Deployment", "Monitoring", "Troubleshooting"],
    department: "Platform",
    location: "Chennai",
    salaryRange: "12-18 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Documentation Specialist",
    description: "We are seeking a Documentation Specialist to create comprehensive technical and user documentation for our ATS platform. You will write detailed API documentation and user guides, create video tutorials and training materials, maintain documentation using Markdown and Confluence, work with Swagger for API documentation, ensure documentation accuracy and completeness, collaborate with development and product teams, create onboarding materials for new users, maintain version control for documentation, gather feedback and improve documentation quality, ensure documentation accessibility and usability, work with Figma for UI documentation, and maintain documentation standards and templates. The role requires strong writing skills and technical communication expertise.",
    skillsRequired: ["Technical Writing", "Markdown", "API Documentation", "User Guides", "Video Creation", "Figma", "Git", "Tools", "Communication", "Attention to Detail", "Confluence", "Swagger"],
    department: "Technical Writing",
    location: "Bengaluru",
    salaryRange: "10-15 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Junior",
  },
  {
    baseTitle: "IT Support Specialist",
    description: "As an IT Support Specialist, you will provide technical support and troubleshooting for ATS users. You will provide first-line technical support for hardware and software issues, troubleshoot Windows, Mac, and Linux systems, manage user accounts and access permissions in Active Directory, resolve network connectivity and configuration problems, assist with software installation and configuration, maintain ticketing system and support documentation, provide remote and on-site technical assistance, ensure data security and compliance during support activities, collaborate with development teams on user-reported issues, create knowledge base articles and solutions, monitor system health and user satisfaction, and maintain support equipment and tools. The role requires strong troubleshooting skills and customer service orientation.",
    skillsRequired: ["Customer Support", "Troubleshooting", "Windows", "Mac", "Linux", "Active Directory", "Ticketing System", "Communication", "Hardware", "Software", "Problem Solving", "Network Support"],
    department: "Support",
    location: "Coimbatore",
    salaryRange: "8-12 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Junior",
  },
  {
    baseTitle: "Business Analyst",
    description: "We are looking for a Business Analyst to analyze requirements and document business processes for our ATS platform. You will gather and document business requirements from stakeholders, analyze business processes and identify improvement opportunities, create process maps and workflow diagrams with Visio, write SQL queries for data analysis and reporting, collaborate with development teams on requirement clarification, conduct user interviews and workshops, create functional specifications and user stories, validate requirements with stakeholders, perform data analysis to support business decisions, work in Agile environments with development teams, maintain requirement traceability, and ensure requirements meet business objectives. The role requires strong analytical skills and business process expertise.",
    skillsRequired: ["Business Analysis", "Requirements Gathering", "Process Mapping", "SQL", "Data Analysis", "Communication", "Excel", "Visio", "Agile", "Documentation", "Stakeholder Management", "Testing"],
    department: "Business",
    location: "Bengaluru",
    salaryRange: "11-16 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "IT Security Analyst",
    description: "Join our team as an IT Security Analyst to monitor and respond to security incidents. You will monitor security events using SIEM tools and log analysis, respond to security incidents and conduct investigations, implement threat detection and prevention measures, ensure network security and firewall management, monitor IDS/IPS systems and security protocols, conduct security assessments and vulnerability scans, work with Linux and Windows security hardening, analyze security logs and identify patterns, create security incident reports and recommendations, collaborate with IT teams on security implementations, maintain security documentation and procedures, and stay updated with latest security threats and mitigation strategies. The role requires expertise in cybersecurity monitoring and incident response.",
    skillsRequired: ["SIEM Tools", "Log Analysis", "Incident Response", "Threat Detection", "Cybersecurity", "Networking", "Linux", "Windows", "Firewalls", "IDS/IPS", "Security Protocols", "Analysis"],
    department: "Security",
    location: "Bengaluru",
    salaryRange: "14-20 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
  {
    baseTitle: "Compliance Officer",
    description: "We are seeking a Compliance Officer to ensure compliance with regulations and standards for our ATS platform. You will ensure compliance with GDPR, ISO standards, and other regulatory requirements, conduct compliance audits and assessments, implement data privacy and protection measures, manage risk assessments and mitigation strategies, maintain compliance documentation and evidence, work with legal teams on regulatory matters, implement HIPAA and SOC 2 compliance frameworks, monitor regulatory changes and updates, conduct compliance training for employees, manage data retention and disposal policies, ensure secure data handling practices, collaborate with security teams on compliance requirements, and prepare for external audits and certifications. The role requires expertise in regulatory compliance and risk management.",
    skillsRequired: ["Compliance", "GDPR", "ISO Standards", "Auditing", "Risk Management", "Documentation", "Legal", "Reporting", "HIPAA", "SOC 2", "Data Privacy", "Regulatory"],
    department: "Compliance",
    location: "Bengaluru",
    salaryRange: "13-19 LPA",
    emplyementType: "Full-time",
    experienceLevel: "Mid-level",
  },
];

const jobSeed = Array.from({ length: 30 }, (_, index) => {
  const template = jobTemplates[index % jobTemplates.length];
  const openingCount = (index % 3) + 1;
  const closureDate = new Date();
  closureDate.setDate(closureDate.getDate() + 20 + index * 2);

  return {
    jobTitle: `${template.baseTitle}`,
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
  const hmUser = userByEmail.get("manager@ats.local");
  const panelUsers = [
    userByEmail.get("panel@ats.local"),
    userByEmail.get("jana.panel@ats.local"),
    userByEmail.get("nayeem.panel@ats.local"),
    userByEmail.get("girih.panel@ats.local"),
    userByEmail.get("nirmal.panel@ats.local"),
    userByEmail.get("nishan.panel@ats.local"),
  ];
  if (!hrUser || !hmUser || panelUsers.some(p => !p)) {
    throw new Error("HR/Manager/Panel users not found after user seed");
  }

  const realNames = [
    "Rajesh Kumar", "Priya Sharma", "Amit Patel", "Neha Singh", "Vikram Reddy",
    "Ananya Gupta", "Arjun Verma", "Deepika Nair", "Rohan Chopra", "Shruti Desai",
    "Nikhil Joshi", "Pooja Rao", "Sanjay Malhotra", "Divya Menon", "Aditya Bhat",
    "Kajal Kapoor", "Praveen Kumar", "Ritika Sinha", "Siddharth Jain", "Meera Iyer",
    "Varun Deshmukh", "Anjali Pandey", "Harsh Prabhakar", "Simran Kapil", "Rohit Singh",
    "Isha Mukherjee", "Karan Mishra", "Sakshi Verma", "Abhishek Srivastava", "Neelam Yadav"
  ];

  const feedbackData = [
    "Strong technical foundation with excellent problem-solving skills. Demonstrated deep knowledge of system design patterns and scalability. Great communication skills. Would be valuable addition to senior team.",
    "Good understanding of React and component architecture. Code quality is solid with proper error handling. Needs improvement in performance optimization and CSS expertise.",
    "Exceptional API design knowledge. Strong grasp of REST principles and authentication mechanisms. Well-versed in database optimization. Minor gaps in containerization.",
    "Outstanding full-stack capabilities. Proficient in both frontend and backend. Excellent debugging skills and attention to detail. Leadership potential evident.",
    "Solid foundation in DevOps practices. Well-versed in CI/CD pipelines and infrastructure as code. Kubernetes expertise is commendable. Recommended for immediate onboarding.",
    "Very strong in Python and data processing. Excellent SQL optimization skills. Good understanding of data warehousing concepts. Needs more exposure to real-time processing.",
    "Impressive React knowledge with deep understanding of hooks and state management. Performance optimization skills are excellent. Minor gaps in mobile responsiveness.",
    "Strong backend fundamentals with good understanding of microservices architecture. Database design knowledge is solid. Recommended for Mid-level role.",
    "Excellent testing mindset and QA automation expertise. Postman proficiency is outstanding. Good knowledge of API testing best practices. Recommended for automation engineer role.",
    "Well-versed in cloud infrastructure and deployment practices. Terraform expertise is impressive. Good understanding of security best practices. Recommended for DevOps role.",
    "Outstanding communication and problem-solving abilities. Strong in Node.js and Express. Good architectural thinking. Recommended for team lead role.",
    "Solid understanding of mobile development patterns. React Native expertise is good. Performance optimization skills are adequate. Needs more real-world project experience.",
    "Excellent security knowledge with strong cryptography background. OWASP principles well understood. Recommended for security specialist role.",
    "Strong data engineering fundamentals. Good understanding of ETL processes. Spark knowledge is solid. Recommended for data engineer position.",
    "Impressive machine learning capabilities. Good understanding of model optimization and deployment. TensorFlow proficiency is excellent. Recommended for AI team.",
    "Very good in JavaScript and TypeScript. Strong understanding of async programming. Good performance optimization skills. Recommended for frontend role.",
    "Excellent database administration skills. Strong in query optimization and replication. PostgreSQL expertise outstanding. Recommended for DBA role.",
    "Strong architecture and system design thinking. Good understanding of scalability patterns. Excellent leadership qualities. Recommended for architect role.",
    "Good understanding of Java and Spring framework. Solid OOP knowledge. Needs improvement in micro-services architecture. Recommended for mid-level Java developer.",
    "Excellent in Golang and concurrent programming. Strong understanding of gRPC and async patterns. High performance is evident. Recommended for backend role.",
    "Strong product thinking and analytical skills. Good understanding of user research and metrics. Recommended for product management track.",
    "Excellent Blockchain knowledge. Solidity expertise is impressive. DeFi understanding is solid. Recommended for blockchain engineer role.",
    "Very good in UI/UX with strong design sense. Figma proficiency outstanding. Accessibility knowledge is commendable. Recommended for design engineer role.",
    "Strong system administration background. Linux expertise is excellent. Good understanding of security hardening. Recommended for DevOps/Infrastructure role.",
    "Excellent compliance knowledge and attention to detail. GDPR and regulatory understanding strong. Good documentation skills. Recommended for compliance role.",
    "Strong business analysis skills with good SQL knowledge. Process mapping expertise evident. Recommended for analyst role.",
    "Outstanding incident response capabilities. SIEM tools expertise excellent. Good threat intelligence understanding. Recommended for security operations.",
    "Strong integration skills and good API knowledge. Webhook expertise solid. Well-structured code. Recommended for integration engineer role.",
    "Excellent release management experience. Good understanding of deployment strategies. CI/CD pipeline knowledge strong. Recommended for release engineer role.",
    "Strong technical writing skills with clear communication. Good documentation structure. Attention to detail commendable. Recommended for technical writer role."
  ];

  const skillSets = [
    ["Node.js", "Express", "MongoDB", "REST API", "Docker", "AWS", "Redis", "System Design", "PostgreSQL", "Kubernetes", "GraphQL", "Microservices"],
    ["React", "TypeScript", "Redux", "Tailwind CSS", "Jest", "React Testing Library", "Performance Optimization", "Accessibility", "Webpack", "Material-UI", "Responsive Design", "CSS Animations"],
    ["Java", "Spring Boot", "Hibernate", "MySQL", "PostgreSQL", "REST API", "JUnit", "Maven", "Microservices", "Docker", "Design Patterns", "OOP"],
    ["Python", "Django", "Flask", "FastAPI", "Pandas", "NumPy", "SQLAlchemy", "PostgreSQL", "MongoDB", "Data Processing", "API Development", "Testing"],
    ["Docker", "Kubernetes", "AWS", "Jenkins", "GitLab CI", "Terraform", "Ansible", "Linux", "CI/CD", "Infrastructure", "Monitoring", "Shell Scripting"],
    ["React Native", "JavaScript", "TypeScript", "Redux", "Firebase", "iOS", "Android", "REST API", "Testing", "Git", "Performance", "Mobile UI"],
    ["Selenium", "Postman", "API Testing", "TestNG", "Java", "Cypress", "Test Automation", "SQL", "CI/CD", "Jira", "Performance Testing", "BDD"],
    ["MongoDB", "PostgreSQL", "MySQL", "Database Design", "Query Optimization", "Replication", "Backup & Recovery", "Indexing", "Linux", "SQL", "Performance Tuning", "Sharding"],
    ["React", "Node.js", "MongoDB", "Express", "TypeScript", "REST API", "HTML5", "CSS3", "Git", "Docker", "AWS", "Responsive Design"],
    ["Golang", "REST API", "gRPC", "PostgreSQL", "Docker", "Kubernetes", "Concurrency", "Testing", "Performance", "AWS", "Microservices", "System Design"],
    ["Solidity", "Ethereum", "Smart Contracts", "Web3.js", "Blockchain", "Cryptography", "DeFi", "JavaScript", "Testing", "Security", "Consensus Mechanisms", "Token Development"],
    ["React", "Figma", "HTML5", "CSS3", "JavaScript", "Responsive Design", "Accessibility", "CSS Animations", "Design Systems", "Performance", "Animation", "User Experience"],
    ["AWS", "EC2", "S3", "RDS", "Lambda", "CloudFormation", "VPC", "IAM", "Terraform", "Docker", "Security", "Cost Optimization"],
    ["Cybersecurity", "OWASP", "Penetration Testing", "Encryption", "SSL/TLS", "Authentication", "Linux", "Network Security", "Security Audits", "Firewalls", "Vulnerability Assessment", "Compliance"],
    ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "NLP", "Deep Learning", "Data Analysis", "Pandas", "NumPy", "Flask", "AWS", "Model Deployment"],
    ["Apache Spark", "Hadoop", "Python", "Hive", "SQL", "ETL", "AWS", "Data Warehousing", "Scala", "Kafka", "Data Architecture", "Performance Tuning"],
    ["System Design", "Architecture", "Node.js", "React", "Leadership", "Mentoring", "Problem Solving", "Communication", "Agile", "DevOps", "AWS", "Code Review"],
    ["JMeter", "Load Testing", "Performance Profiling", "Node.js", "React", "Browser DevTools", "Monitoring", "Grafana", "New Relic", "Prometheus", "DataDog", "Analysis"],
    ["CI/CD", "Jenkins", "GitLab", "Docker", "Kubernetes", "Release Management", "Bash", "Git", "Deployment", "Monitoring", "Troubleshooting", "Scripting"],
    ["REST API", "Node.js", "Express", "API Documentation", "GraphQL", "Authentication", "Rate Limiting", "MongoDB", "PostgreSQL", "Postman", "Versioning", "Testing"],
    ["Product Strategy", "Analytics", "SQL", "Data Analysis", "Communication", "Agile", "Roadmapping", "Market Analysis", "Metrics", "Stakeholder Management", "User Research", "Competitive Analysis"],
    ["Linux", "Windows Server", "Networking", "Security", "Backup & Recovery", "System Monitoring", "Cloud", "AWS", "Virtual Machines", "Automation", "Bash", "PowerShell"],
    ["API Integration", "Webhook", "Node.js", "REST API", "Authentication", "Data Mapping", "Error Handling", "Testing", "Documentation", "Postman", "Zapier", "Third-party Integration"],
    ["Technical Writing", "Markdown", "API Documentation", "User Guides", "Figma", "Git", "Confluence", "Swagger", "Video Creation", "Communication", "Attention to Detail", "Tools"],
    ["Business Analysis", "Requirements Gathering", "SQL", "Data Analysis", "Process Mapping", "Communication", "Excel", "Agile", "Documentation", "Stakeholder Management", "Visio", "Testing"],
    ["SIEM Tools", "Log Analysis", "Incident Response", "Threat Detection", "Cybersecurity", "Networking", "Linux", "Windows", "IDS/IPS", "Security Protocols", "Firewalls", "Analysis"],
    ["Compliance", "GDPR", "ISO Standards", "Auditing", "Risk Management", "Documentation", "Legal", "Reporting", "HIPAA", "SOC 2", "Data Privacy", "Regulatory"],
    ["Customer Support", "Troubleshooting", "Windows", "Mac", "Linux", "Active Directory", "Ticketing System", "Communication", "Hardware", "Software", "Network Support", "Problem Solving"],
    ["Solidity", "Web3", "Smart Contracts", "Ethereum", "Blockchain", "DeFi", "JavaScript", "Security Audit", "Gas Optimization", "Testing", "Deployment", "Cryptography"],
    ["Flutter", "Dart", "iOS", "Android", "REST API", "Firebase", "State Management", "Performance", "Testing", "Git", "Mobile UI", "Cross-platform Development"],
  ];

  const locations = [
    "Bengaluru", "Hyderabad", "Pune", "Chennai", "Coimbatore", "Mumbai",
    "Delhi", "Noida", "Gurgaon", "Kochi", "Visakhapatnam", "Nashik"
  ];

  const educations = [
    "B.E. Computer Science", "B.Tech Information Technology", "B.Sc Computer Science",
    "M.Tech Computer Science", "M.E. Software Engineering", "M.Sc Data Science",
    "MBA Information Systems", "B.E. Electronics", "BCA", "B.Sc Physics"
  ];

  const interviewFeedbackData = [
    "Exceptional technical skills demonstrated during coding round. Strong grasp of algorithms and data structures. Very good communication. Recommended for immediate onboarding.",
    "Good understanding of fundamentals. Problem-solving approach is systematic. Minor gaps in advanced concepts. Needs mentoring for optimization techniques.",
    "Outstanding performance in technical assessment. Excellent knowledge of design patterns. Would be great fit for senior role.",
    "Strong fundamentals with good practical experience. Clear explanation of concepts. Some gaps in performance optimization.",
    "Excellent architectural thinking evident. Deep understanding of system design. Recommended for lead engineer position.",
    "Very good in current tech stack. Eager to learn new technologies. Cultural fit seems excellent. Recommend hiring.",
    "Strong problem-solving skills with good communication. Technical depth is impressive. Ready for immediate assignment.",
    "Good foundational knowledge with practical experience. Some areas need strengthening but trainable. Positive attitude evident.",
    "Outstanding all-around performance. Exceeds expectations in multiple areas. Strong candidate for senior positions.",
    "Solid performance with good technical understanding. Few gaps in implementation experience but conceptually strong.",
    "Excellent communication and problem-solving abilities. Technical skills are robust. Team fit is excellent.",
    "Very good in practical implementation. Strong understanding of best practices. Recommend for mid-level role.",
    "Impressive knowledge of latest technologies and frameworks. Strong documentation skills. Great cultural fit.",
    "Outstanding debugging skills and code quality. Good understanding of performance optimization. Highly recommended.",
    "Strong in core concepts with good real-world experience. Excellent attitude and learning capability evident.",
    "Exceptional technical depth with clear communication. Would be excellent addition to any team.",
    "Good balance of theoretical knowledge and practical skills. Strong in teamwork and collaboration.",
    "Outstanding performance across all evaluation criteria. Recommend for immediate onboarding.",
    "Strong fundamentals with good growth potential. Positive attitude and willingness to learn impressive.",
    "Excellent technical assessment with good presentation skills. Strong candidate for team lead role.",
    "Very good understanding of system architecture. Strong in multiple technologies. Cultural fit excellent.",
    "Outstanding problem-solving with good communication. Technical depth is impressive for experience level.",
    "Strong performance with great attitude. Ready for challenging assignments. Recommend hiring.",
    "Excellent technical skills with strong interpersonal abilities. Would be valuable team member.",
    "Outstanding assessment performance. Shows leadership potential. Recommend for senior role.",
    "Good technical foundation with strong learning capability. Positive attitude and enthusiasm evident.",
    "Exceptional skills across multiple domains. Strong candidate for leadership position.",
    "Outstanding technical interview performance. Deep knowledge in domain expertise evident.",
    "Strong fundamentals with excellent problem-solving approach. Team dynamics excellent.",
    "Exceptional all-around performer. Highly recommended for immediate onboarding.",
  ];

  const candidateSeed = Array.from({ length: 30 }, (_, index) => {
    const linkedJob = jobSeed[index % jobSeed.length];
    const candidateLocation = locations[index % locations.length];
    const interviewCount = (index % 3) + 1;
    
    // Offer status: first 3 candidates get offers, rest are good
    const offerStatuses = [
      "Offered", "Offer Accepted", "Offer Declined",
      "Selected", "Selected", "Selected",
      "HR Interview", "HR Interview", "HR Interview",
      "Technical Interview 2", "Technical Interview 2", "Technical Interview 2",
      "Technical Interview 1", "Technical Interview 1", "Technical Interview 1",
      "Shortlisted", "Shortlisted", "Shortlisted",
      "Applied", "Applied", "Applied",
      "Applied", "Applied", "Applied",
      "Applied", "Applied", "Applied",
      "Applied", "Applied", "Applied",
    ];
    const status = offerStatuses[index];

    // Create interviews array
    const interviews = [];
    
    // Technical Interview 1 - assigned to interview panel
    const ti1PanelMemberIndex = index % panelUsers.length;
    const ti1Panel = panelUsers[ti1PanelMemberIndex];
    const ti1CompletedAt = index < 5 ? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) : null;
    
    interviews.push({
      stage: "Technical Interview 1",
      interviewer: {
        id: ti1Panel._id,
        name: `${ti1Panel.firstName} ${ti1Panel.lastName}`,
        email: ti1Panel.email,
        role: ti1Panel.role,
      },
      coInterviewers: [],
      scheduledAt: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000),
      duration: 60,
      meetingLink: `https://meet.google.com/interview-${index}-1`,
      location: candidateLocation,
      completedAt: ti1CompletedAt,
      actualDuration: ti1CompletedAt ? 55 : null,
      result: ti1CompletedAt ? "Passed" : "Pending",
      feedback: ti1CompletedAt ? interviewFeedbackData[index] : null,
    });

    // Technical Interview 2 - assigned to interview panel (if interviewCount > 1)
    if (interviewCount > 1) {
      const ti2PanelMemberIndex = (index + 1) % panelUsers.length;
      const ti2Panel = panelUsers[ti2PanelMemberIndex];
      const ti2CompletedAt = index < 10 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : null;
      
      interviews.push({
        stage: "Technical Interview 2",
        interviewer: {
          id: ti2Panel._id,
          name: `${ti2Panel.firstName} ${ti2Panel.lastName}`,
          email: ti2Panel.email,
          role: ti2Panel.role,
        },
        coInterviewers: [],
        scheduledAt: new Date(Date.now() + (index + 8) * 24 * 60 * 60 * 1000),
        duration: 60,
        meetingLink: `https://meet.google.com/interview-${index}-2`,
        location: candidateLocation,
        completedAt: ti2CompletedAt,
        actualDuration: ti2CompletedAt ? 58 : null,
        result: ti2CompletedAt ? "Passed" : "Pending",
        feedback: ti2CompletedAt ? interviewFeedbackData[(index + 1) % interviewFeedbackData.length] : null,
      });
    }

    // HR Interview - assigned to HR Manager or HR Recruiter (if interviewCount > 2)
    if (interviewCount > 2) {
      const hrInterviewer = index % 2 === 0 ? hmUser : hrUser;
      const hrCompletedAt = index < 15 ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null;
      
      interviews.push({
        stage: "HR Interview",
        interviewer: {
          id: hrInterviewer._id,
          name: `${hrInterviewer.firstName} ${hrInterviewer.lastName}`,
          email: hrInterviewer.email,
          role: hrInterviewer.role,
        },
        coInterviewers: [],
        scheduledAt: new Date(Date.now() + (index + 15) * 24 * 60 * 60 * 1000),
        duration: 45,
        meetingLink: `https://meet.google.com/interview-${index}-3`,
        location: candidateLocation,
        completedAt: hrCompletedAt,
        actualDuration: hrCompletedAt ? 42 : null,
        result: hrCompletedAt ? (index < 3 ? "Passed" : (index < 5 ? "Passed" : "Passed")) : "Pending",
        feedback: hrCompletedAt ? interviewFeedbackData[(index + 2) % interviewFeedbackData.length] : null,
      });
    }

    return {
      name: realNames[index],
      email: `${realNames[index].toLowerCase().replace(/\s+/g, ".")}.${index}@candidate.local`,
      jobTitle: linkedJob.jobTitle,
      contactDetails: `+91-${9000 + index}-${Math.floor(Math.random() * 900000) + 100000}`,
      location: candidateLocation,
      skills: skillSets[index],
      experience: 1 + (index % 12),
      education: educations[index % educations.length],
      noticePeriod: [15, 30, 45, 60][index % 4],
      status,
      interviews,
      feedback: feedbackData[index],
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
          feedback: candidate.feedback,
          applicationMetrics: {
            totalInterviewsScheduled: candidate.interviews.length,
            totalInterviewsCompleted: candidate.interviews.filter(i => i.completedAt).length,
            totalInterviewsPassed: candidate.interviews.filter(i => i.result === "Passed").length,
            currentRound: candidate.interviews[candidate.interviews.length - 1]?.stage || null,
            daysInPipeline: Math.floor((Date.now() - new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime()) / (1000 * 60 * 60 * 24)),
          },
          statusHistory: [
            {
              status: candidate.status,
              comment: "Seeded candidate with interview data",
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

  const [userCount, jobCount, candidateCount, policyCount] = await Promise.all([
    User.countDocuments(),
    JobManagement.countDocuments(),
    Candidate.countDocuments(),
    RbacPolicy.countDocuments(),
  ]);

  console.log("Seed completed successfully");
  console.log({
    users: userCount,
    jobs: jobCount,
    candidates: candidateCount,
    rbacPolicies: policyCount,
    defaultPassword: "Password@1234",
    offeredCandidates: 3,
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
