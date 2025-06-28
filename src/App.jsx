import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { motion } from 'framer-motion'
import { 
  Github, 
  Linkedin, 
  Mail, 
  Download, 
  ExternalLink, 
  BarChart3, 
  Database, 
  Shield, 
  Palette,
  Code,
  Brain,
  TrendingUp,
  Users,
  Award,
  MapPin,
  Calendar,
  ChevronDown
} from 'lucide-react'
import victorHeadshot from './assets/victor_headshot.jpg'
import intelliflowMockup from './assets/intelliflow_mockup.jpg'
import dataVisualizationMockup from './assets/data_visualization_mockup.jpg'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(sectionId)
    }
  }

  const projects = [
    {
      id: 1,
      title: "IntelliFlow - Multi-Agent Data Analysis Platform",
      description: "A sophisticated multi-agent data analysis and insights platform built with Python, React, and Google Cloud services. Features AI-powered data processing, automated insights generation, and real-time analytics.",
      image: intelliflowMockup,
      technologies: ["Python", "React", "Google Cloud", "AI/ML", "Multi-Agent Systems"],
      github: "https://github.com/gadda00/IntelliFlow",
      demo: "https://gadda00.github.io/IntelliFlow/",
      category: "AI/ML Platform"
    },
    {
      id: 2,
      title: "Retirement Benefits Dashboard",
      description: "Interactive dashboard using Google Looker Studio to visualize retirement benefits data for NSSF stakeholders, enabling management to track benefit processing efficiency and make data-driven decisions.",
      image: dataVisualizationMockup,
      technologies: ["Google Looker Studio", "Data Visualization", "SQL", "Business Intelligence"],
      github: "#",
      demo: "#",
      category: "Data Visualization"
    },
    {
      id: 3,
      title: "Financial Data Analysis Suite",
      description: "Comprehensive analysis of financial datasets including trauma screening analysis, house price prediction, diabetes prediction using machine learning, and time series forecasting.",
      image: dataVisualizationMockup,
      technologies: ["Python", "Pandas", "Scikit-learn", "Matplotlib", "Statistical Analysis"],
      github: "#",
      demo: "#",
      category: "Data Science"
    },
    {
      id: 4,
      title: "Automated Reporting System",
      description: "Python-based system to automate financial report generation for Enwealth Financial Services, streamlining ETL processes and reducing report generation time by 75%.",
      image: dataVisualizationMockup,
      technologies: ["Python", "ETL", "Automation", "Financial Analysis"],
      github: "#",
      demo: "#",
      category: "Automation"
    }
  ]

  const skills = [
    {
      category: "Data Analysis & Business Intelligence",
      icon: <BarChart3 className="w-8 h-8" />,
      skills: [
        "Financial data modeling and trend analysis",
        "Retirement benefits data processing", 
        "Google Looker Studio dashboard development",
        "Advanced Excel (Power Query, DAX formulas)",
        "Statistical analysis for policy recommendations"
      ]
    },
    {
      category: "Programming & Technical Tools",
      icon: <Code className="w-8 h-8" />,
      skills: [
        "Python for financial data analysis",
        "Google Colab for collaborative projects",
        "SQL for pension database querying",
        "ETL workflow design and implementation",
        "Automated reporting systems development"
      ]
    },
    {
      category: "Information Security",
      icon: <Shield className="w-8 h-8" />,
      skills: [
        "Financial data protection protocols",
        "Compliance with retirement industry regulations",
        "Sensitive personal information handling",
        "Risk assessment for financial systems"
      ]
    },
    {
      category: "Data Visualization & Communication",
      icon: <Palette className="w-8 h-8" />,
      skills: [
        "Financial data storytelling through infographics",
        "Retirement benefits presentation design",
        "Complex policy visualization for stakeholders",
        "Executive-level reporting and communication"
      ]
    }
  ]

  const experience = [
    {
      title: "Research Intern",
      company: "Retirement Benefits Authority (RBA)",
      period: "April 2024 - May 2024",
      description: "Conducted comprehensive research on retirement industry trends and regulatory frameworks. Collected, cleaned, and analyzed large datasets to support evidence-based policy recommendations.",
      achievements: [
        "Analyzed complex regulatory frameworks",
        "Prepared detailed reports for senior management",
        "Supported evidence-based policy recommendations"
      ]
    },
    {
      title: "Data Analyst Intern",
      company: "Enwealth Financial Services",
      period: "February 2022 - June 2022",
      description: "Performed data extraction, transformation, and loading (ETL) processes for financial datasets. Created interactive dashboards and reports using business intelligence tools.",
      achievements: [
        "Reduced report generation time by 75%",
        "Created interactive financial dashboards",
        "Implemented automated ETL processes"
      ]
    },
    {
      title: "Benefits Processing Officer",
      company: "National Social Security Fund (NSSF)",
      period: "October 2020 - June 2021",
      description: "Processed and analyzed benefits applications, ensuring compliance with regulatory requirements. Utilized data analysis techniques to identify patterns and optimize workflows.",
      achievements: [
        "Optimized benefits processing workflows",
        "Maintained strict data security protocols",
        "Identified process improvement opportunities"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Victor Ndunda
            </motion.div>
            <div className="hidden md:flex space-x-8">
              {['home', 'about', 'skills', 'projects', 'experience', 'contact'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`capitalize transition-colors duration-200 ${
                    activeSection === section 
                      ? 'text-blue-600 font-semibold' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Data Analyst &
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {" "}Technology Professional
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Transforming complex financial data into actionable insights with 5+ years of experience 
                  in the retirement industry. Specialized in data analysis, cybersecurity, and AI-driven solutions.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  onClick={() => scrollToSection('projects')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  View Projects
                  <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Download CV
                  <Download className="ml-2 w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Nairobi, Kenya</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Award className="w-4 h-4" />
                  <span>BSc Computer Science</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>5+ Years Experience</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <img
                  src={victorHeadshot}
                  alt="Victor Ndunda"
                  className="relative w-full rounded-2xl shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-16"
        >
          <ChevronDown 
            className="w-8 h-8 text-gray-400 mx-auto animate-bounce cursor-pointer"
            onClick={() => scrollToSection('about')}
          />
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">About Me</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"></div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-lg text-gray-600 leading-relaxed">
                I am a Computer Science graduate from the University of Embu with over 5 years of experience 
                in data analysis, cybersecurity, and creative design. My professional journey has been focused 
                on the retirement industry, where I've developed expertise in analyzing complex financial datasets 
                and creating visual representations of findings.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                With experience at organizations like the National Social Security Fund (NSSF), Retirement Benefits 
                Authority (RBA), and Enwealth Financial Services, I've honed my skills in transforming raw data into 
                actionable insights that drive decision-making.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                I'm passionate about leveraging technology to create meaningful solutions and am particularly 
                interested in the applications of AI in financial services and data-driven retirement planning.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">75%</h3>
                <p className="text-gray-600">Report Generation Time Reduction</p>
              </Card>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">3+</h3>
                <p className="text-gray-600">Major Organizations</p>
              </Card>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <Database className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">10+</h3>
                <p className="text-gray-600">Data Science Projects</p>
              </Card>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <Brain className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">AI/ML</h3>
                <p className="text-gray-600">Specialized Expertise</p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Skills & Expertise</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"></div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {skills.map((skillGroup, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white">
                        {skillGroup.icon}
                      </div>
                      <CardTitle className="text-xl">{skillGroup.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {skillGroup.skills.map((skill, skillIndex) => (
                        <li key={skillIndex} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-600">{skill}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Projects</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"></div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary">{project.category}</Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{project.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, techIndex) => (
                          <Badge key={techIndex} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex space-x-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Github className="w-4 h-4 mr-2" />
                          Code
                        </Button>
                        <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Demo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Professional Experience</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"></div>
          </motion.div>

          <div className="space-y-8">
            {experience.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-xl text-gray-900">{exp.title}</CardTitle>
                        <CardDescription className="text-lg font-semibold text-blue-600">
                          {exp.company}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="mt-2 md:mt-0">
                        {exp.period}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{exp.description}</p>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Key Achievements:</h4>
                      <ul className="space-y-1">
                        {exp.achievements.map((achievement, achIndex) => (
                          <li key={achIndex} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-600">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-8"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ready to transform your data into actionable insights? Let's discuss how I can help 
              your organization make data-driven decisions.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">victor.ndunda@email.com</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <Linkedin className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">LinkedIn</h3>
                    <p className="text-gray-600">linkedin.com/in/victor-ndunda</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <Github className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">GitHub</h3>
                    <p className="text-gray-600">github.com/gadda00</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Victor Ndunda
            </h3>
            <p className="text-gray-400 mt-2">Data Analyst & Technology Professional</p>
          </div>
          
          <div className="flex justify-center space-x-6 mb-8">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Github className="w-6 h-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Linkedin className="w-6 h-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Mail className="w-6 h-6" />
            </a>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-400">
              © 2024 Victor Ndunda. All rights reserved. Built with React and Tailwind CSS.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

