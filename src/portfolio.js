/* Change this file to get your personal Portfolio */

// To change portfolio colors globally go to the  _globalColor.scss file

import emoji from "react-easy-emoji";
import splashAnimation from "./assets/lottie/splashAnimation"; // Rename to your file name for custom animation
import {
  SiAmazonaws,
  SiDocker,
  SiJavascript,
  SiMongodb,
  SiMysql,
  SiPython,
  SiTypescript,
  SiReacttable
} from "react-icons/si";

// Splash Screen

const splashScreen = {
  enabled: true, // set false to disable splash screen
  animation: splashAnimation,
  duration: 2000 // Set animation duration as per your animation
};

// Summary And Greeting Section

const illustration = {
  animated: true // Set to false to use static SVG
};

const greeting = {
  username: "Camila Pozas",
  title: "Hi all, I'm Camila",
  subTitle: emoji(
    "An enthusiastic Software Engineer 👩🏽‍💻 with experience in backend development and continuous improvement, in NodeJS/TypeScript 🚀 + Docker 🐳 + Cloud ☁️"
  ),
  resumeLink:
    "https://d3j0xmrk71qrvn.cloudfront.net/public/English_CV%20CAMILA%20POZAS%20GARCIA.pdf", // Set to empty to hide the button
  displayGreeting: true // Set false to hide this section, defaults to true
};

// Social Media Links

const socialMediaLinks = {
  github: "https://github.com/camipozas",
  linkedin: "https://www.linkedin.com/in/camila-pozas-garcia/",
  gmail: "camila@camipg.com",
  medium: "https://medium.com/@camipg",
  // Instagram, Twitter and Kaggle are also supported in the links!
  // To customize icons and social links, tweak src/components/SocialMedia
  display: true // Set true to display this section, defaults to false
};

// Skills Section

const skillsSection = {
  title: "What I do",
  subTitle: "TRYING TO IMPROVE THE WORLD WITH TECHNOLOGY",
  skills: [
    emoji("⚡ Tools in different languages that help reduce manual processes"),
    emoji("⚡ Integration of tools to automate processes"),
    emoji("⚡ Solve problems with technology"),
    emoji("⚡ Backend development using NodeJS and TypeScript")
  ],

  /* Make Sure to include correct Font Awesome Classname to view your icon
https://fontawesome.com/icons?d=gallery */

  softwareSkills: [
    {
      skillName: "TypeScript",
      Icon: SiTypescript
    },
    {
      skillName: "JavaScript",
      Icon: SiJavascript
    },
    {
      skillName: "React JS",
      Icon: SiReacttable
    },
    {
      skillName: "mongo-database",
      Icon: SiMongodb
    },
    {
      skillName: "sql-database",
      Icon: SiMysql
    },
    {
      skillName: "aws",
      Icon: SiAmazonaws
    },

    {
      skillName: "python",
      Icon: SiPython
    },
    {
      skillName: "docker",
      Icon: SiDocker
    }
  ],
  display: true // Set false to hide this section, defaults to true
};

// Education Section

const educationInfo = {
  display: true, // Set false to hide this section, defaults to true
  schools: [
    {
      schoolName: "Universidad Santiago de Chile",
      logo: "https://d3j0xmrk71qrvn.cloudfront.net/images/usach_logo.png",
      subHeader: "Diploma in Cloud Architecture and Security",
      duration: "September 2022 - February 2023",
      desc: "Specialization in Amazon Web Services",
      descBullets: [
        "Certification: AWS Certified Cloud Practitioner",
        "Principal topics: Role of the Cloud Architect, Cloud Technology Fundamentals, SaaS application architecture, Scalable monolithic architectures, Microservice Architecture, Serverless architectures."
      ]
    },
    {
      schoolName: "Universidad Adolfo Ibáñez",
      logo: "https://d3j0xmrk71qrvn.cloudfront.net/images/uaiLogo.jpeg",
      subHeader: "Industrial Engineering",
      duration: "March 2017 - January 2022",
      desc: "Minor in IT",
      descBullets: [
        "Capstone Project: Reengineering of glued sales notes, logics incorporated in ERP for correct release in the distribution center (Dimerc S.A.).",
        "Assistant Professor: Operations Management, Optimization, Programming, Databases, inter alia."
      ]
    }
  ]
};

// Your top 3 proficient stacks/tech experience

const techStack = {
  viewSkillBars: true, //Set it to true to show Proficiency Section
  experience: [
    {
      Stack: "Python", //Insert stack or technology you have experience in
      progressPercentage: "80%" //Insert relative proficiency in percentage
    },
    {
      Stack: "Docker",
      progressPercentage: "70%"
    },
    {
      Stack: "JavaScript",
      progressPercentage: "70%"
    },
    {
      Stack: "TypeScript",
      progressPercentage: "70%"
    }
  ],
  displayCodersrank: false // Set true to display codersrank badges section need to changes your username in src/containers/skillProgress/skillProgress.js:17:62, defaults to false
};

// Work experience section

const workExperiences = {
  display: true, //Set it to true to show workExperiences Section
  experience: [
    {
      role: "Software Engineer",
      company: "MACH",
      companylogo: "https://d3j0xmrk71qrvn.cloudfront.net/images/logo-mach.png",
      date: "November 2022 – Present",
      descBullets: ["Backend development using NodeJS and TypeScript."]
    },
    {
      role: "Technology Operations Analyst",
      company: "Buk SpA",
      companylogo: "https://d3j0xmrk71qrvn.cloudfront.net/images/bukLogo.jpeg",
      date: "December 2021 – November 2022",
      desc: "Responsible for supporting the evaluation and implementation of technological initiatives within Buk.",
      descBullets: [
        "Survey of continuous improvement and development of robots, APIs, Machine Learning projects, etc."
      ]
    },
    {
      role: "Process Engineer",
      company: "Empresas Dimerc SpA",
      companylogo:
        "https://d3j0xmrk71qrvn.cloudfront.net/images/dimercLogo.jpeg",
      date: "April 2021 – December 2021",
      desc: "Review of the current processes of the company and, where they are evaluated which can be automated and/or streamlined.",
      descBullets: ["Leading project of interns who perform RPA, ML, etc."]
    }
  ]
};

/* Your Open Source Section to View Your Github Pinned Projects
To know how to get github key look at readme.md */

const openSource = {
  showGithubProfile: "true", // Set true or false to show Contact profile using Github, defaults to true
  display: true // Set false to hide this section, defaults to true
};

// Some big projects you have worked on

const bigProjects = {
  title: "Big Projects",
  subtitle: "SOME STARTUPS AND COMPANIES THAT I HELPED TO CREATE THEIR TECH",
  projects: [
    {
      image: require("./assets/images/saayaHealthLogo.webp"),
      projectName: "Saayahealth",
      projectDesc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
      footerLink: [
        {
          name: "Visit Website",
          url: "http://saayahealth.com/"
        }
        //  you can add extra buttons here.
      ]
    },
    {
      image: require("./assets/images/nextuLogo.webp"),
      projectName: "Nextu",
      projectDesc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
      footerLink: [
        {
          name: "Visit Website",
          url: "http://nextu.se/"
        }
      ]
    }
  ],
  display: false // Set false to hide this section, defaults to true
};

// Achievement Section
// Include certificates, talks etc

const achievementSection = {
  title: emoji("Achievements And Certifications 🏆 "),
  subtitle:
    "Achievements, Certifications, Award Letters and Some Cool Stuff that I have done !",

  achievementsCards: [
    {
      title: "AWS Academy Cloud Foundations",
      subtitle:
        "Successfully completed the AWS Academy Cloud Foundations course from AWS Educate",
      image:
        "https://images.credly.com/size/680x680/images/73e4a58b-a8ef-41a3-a7db-9183dd269882/image.png",
      footerLink: [
        {
          name: "Certification",
          url: "https://www.credly.com/badges/3888ee5a-2307-488b-a6b9-81927e50d6a2/public_url"
        }
      ]
    },
    {
      title: "AWS Certified Cloud Practitioner",
      subtitle:
        "Successfully completed the AWS Certified Cloud Practitioner exam",
      image:
        "https://images.credly.com/size/340x340/images/00634f82-b07f-4bbd-a6bb-53de397fc3a6/image.png",
      footerLink: [
        {
          name: "Certification",
          url: "https://www.credly.com/badges/1cafefef-d9d7-4463-badf-6ad5e8230e77/public_url"
        }
      ]
    }
  ],
  display: true // Set false to hide this section, defaults to true
};

// Blogs Section

const blogSection = {
  title: "Blogs",
  subtitle:
    "Sometimes I like to write and share some things that I've learned.",
  displayMediumBlogs: "true", // Set true to display fetched medium blogs instead of hardcoded ones
  blogs: [
    {
      url: "https://docker-gh-actions.cam1pozas.xyz/",
      title: "Docker & GitHub Actions",
      description:
        "How to use Docker and show with GitHub Actions, in effect, you don't need a complex architecture"
    }
  ],
  display: true // Set false to hide this section, defaults to true
};

// Talks Sections

const talkSection = {
  title: "TALKS",
  subtitle: emoji(
    "I LOVE TO SHARE MY LIMITED KNOWLEDGE AND GET A SPEAKER BADGE 😅"
  ),

  talks: [
    {
      title: "Build Actions For Google Assistant",
      subtitle: "Codelab at GDG DevFest Karachi 2019",
      slides_url: "https://bit.ly/saadpasta-slides",
      event_url: "https://www.facebook.com/events/2339906106275053/"
    }
  ],
  display: false // Set false to hide this section, defaults to true
};

// Podcast Section

const podcastSection = {
  title: emoji("Podcast 🎙️"),
  subtitle: "I LOVE TO TALK ABOUT MYSELF AND TECHNOLOGY",

  // Please Provide with Your Podcast embeded Link
  podcast: [
    "https://anchor.fm/codevcast/embed/episodes/DevStory---Saad-Pasta-from-Karachi--Pakistan-e9givv/a-a15itvo"
  ],
  display: false // Set false to hide this section, defaults to true
};

const contactInfo = {
  title: emoji("Contact Me ☎️"),
  subtitle: "Discuss a project or just want to say hi? Contact me 👋🏼",
  number: "+56962357752",
  email_address: "camila@camipg.com"
};

// Twitter Section

const twitterDetails = {
  userName: "twitter", //Replace "twitter" with your twitter username without @
  display: false // Set true to display this section, defaults to false
};

const isHireable = false; // Set false if you are not looking for a job. Also isHireable will be display as Open for opportunities: Yes/No in the GitHub footer

export {
  illustration,
  greeting,
  socialMediaLinks,
  splashScreen,
  skillsSection,
  educationInfo,
  techStack,
  workExperiences,
  openSource,
  bigProjects,
  achievementSection,
  blogSection,
  talkSection,
  podcastSection,
  contactInfo,
  twitterDetails,
  isHireable
};
