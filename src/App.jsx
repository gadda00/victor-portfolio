import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { motion, AnimatePresence } from 'framer-motion'
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
  ChevronDown,
  Star,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Target,
  Globe,
  Briefcase,
  GraduationCap,
  Coffee,
  Heart,
  MessageCircle,
  Share2,
  BookOpen,
  Clock,
  Eye,
  ThumbsUp
} from 'lucide-react'
import victorHeadshot from './assets/victor_headshot.jpg'
import victorAvatar from './assets/victor_avatar.jpg'
import intelliflowMockup from './assets/intelliflow_mockup.jpg'
import dataVisualizationMockup from './assets/data_visualization_mockup.jpg'
import financialDashboardMockup from './assets/financial_dashboard_mockup.jpg'
import salesAnalyticsMockup from './assets/sales_analytics_mockup.jpg'
import heroBackground from './assets/hero_background.jpg'
import avatarSarah from './assets/avatar_sarah.jpg'
import avatarMichael from './assets/avatar_michael.jpg'
import avatarEmily from './assets/avatar_emily.jpg'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [isScrolled, setIsScrolled] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [skillProgress, setSkillProgress] = useState({})
  const [typedText, setTypedText] = useState('')
  const [currentRole, setCurrentRole] = useState(0)

  const roles = [
    "Data Analyst",
    "Technology Professional", 
    "AI Enthusiast",
    "Problem Solver"
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      
      // Update active section based on scroll position
      const sections = ['home', 'about', 'skills', 'projects', 'experience', 'testimonials', 'blog', 'contact']
      const scrollPosition = window.scrollY + 100
      
      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Typing animation effect
  useEffect(() => {
    const currentRoleText = roles[currentRole]
    let index = 0
    setTypedText('')
    
    const typeInterval = setInterval(() => {
      if (index < currentRoleText.length) {
        setTypedText(currentRoleText.slice(0, index + 1))
        index++
      } else {
        clearInterval(typeInterval)
        setTimeout(() => {
          setCurrentRole((prev) => (prev + 1) % roles.length)
        }, 2000)
      }
    }, 100)

    return () => clearInterval(typeInterval)
  }, [currentRole])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
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
      category: "AI/ML Platform",
      featured: true,
      stats: { stars: 45, forks: 12, views: 1200 }
    },
    {
      id: 2,
      title: "Financial Analytics Dashboard",
      description: "Comprehensive financial dashboard featuring real-time KPI tracking, revenue analysis, and expense categorization. Built with modern data visualization techniques to provide actionable business insights.",
      image: financialDashboardMockup,
      technologies: ["Google Looker Studio", "Data Visualization", "SQL", "Business Intelligence"],
      github: "#",
      demo: "#",
      category: "Data Visualization",
      featured: true,
      stats: { stars: 32, forks: 8, views: 890 }
    },
    {
      id: 3,
      title: "Sales Analytics Platform",
      description: "Advanced sales analytics platform with conversion funnel analysis, regional performance tracking, and revenue forecasting. Enables data-driven sales strategy optimization.",
      image: salesAnalyticsMockup,
      technologies: ["Python", "Pandas", "Scikit-learn", "Matplotlib", "Statistical Analysis"],
      github: "#",
      demo: "#",
      category: "Data Science",
      featured: false,
      stats: { stars: 28, forks: 6, views: 650 }
    },
    {
      id: 4,
      title: "Retirement Benefits Dashboard",
      description: "Interactive dashboard using Google Looker Studio to visualize retirement benefits data for NSSF stakeholders, enabling management to track benefit processing efficiency and make data-driven decisions.",
      image: dataVisualizationMockup,
      technologies: ["Google Looker Studio", "Data Visualization", "SQL", "Business Intelligence"],
      github: "#",
      demo: "#",
      category: "Business Intelligence",
      featured: false,
      stats: { stars: 19, forks: 4, views: 420 }
    }
  ]

  const skills = [
    {
      category: "Data Analysis & Business Intelligence",
      icon: <BarChart3 className="w-8 h-8" />,
      level: 95,
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
      level: 90,
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
      level: 85,
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
      level: 92,
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
      ],
      icon: <GraduationCap className="w-6 h-6" />
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
      ],
      icon: <Briefcase className="w-6 h-6" />
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
      ],
      icon: <Shield className="w-6 h-6" />
    }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Senior Data Manager",
      company: "Enwealth Financial Services",
      content: "Victor's analytical skills and attention to detail are exceptional. He transformed our reporting process and delivered insights that directly impacted our business strategy.",
      avatar: avatarSarah,
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "IT Director",
      company: "Retirement Benefits Authority",
      content: "Working with Victor was a pleasure. His ability to translate complex data into actionable insights is remarkable. He's a true professional.",
      avatar: avatarMichael,
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Project Manager",
      company: "NSSF",
      content: "Victor consistently delivered high-quality work and showed great initiative in optimizing our processes. His technical expertise is outstanding.",
      avatar: avatarEmily,
      rating: 5
    }
  ]

  const blogPosts = [
    {
      id: 1,
      title: "The Future of AI in Financial Data Analysis",
      excerpt: "Exploring how artificial intelligence is revolutionizing the way we analyze and interpret financial data in the retirement industry.",
      date: "2024-06-15",
      readTime: "5 min read",
      category: "AI & Technology",
      image: intelliflowMockup,
      views: 1250,
      likes: 89
    },
    {
      id: 2,
      title: "Building Effective Data Visualization Dashboards",
      excerpt: "Best practices for creating compelling and informative dashboards that drive decision-making in financial services.",
      date: "2024-05-28",
      readTime: "7 min read",
      category: "Data Visualization",
      image: financialDashboardMockup,
      views: 980,
      likes: 67
    },
    {
      id: 3,
      title: "Cybersecurity in the Age of Digital Finance",
      excerpt: "Understanding the critical importance of data protection and security measures in modern financial institutions.",
      date: "2024-05-10",
      readTime: "6 min read",
      category: "Cybersecurity",
      image: dataVisualizationMockup,
      views: 756,
      likes: 45
    }
  ]

  const stats = [
    { label: "Projects Completed", value: "50+", icon: <Target className="w-8 h-8" /> },
    { label: "Years Experience", value: "5+", icon: <Calendar className="w-8 h-8" /> },
    { label: "Happy Clients", value: "25+", icon: <Heart className="w-8 h-8" /> },
    { label: "Code Commits", value: "1000+", icon: <Code className="w-8 h-8" /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Custom Cursor */}
      <div 
        className="fixed w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full pointer-events-none z-50 mix-blend-difference transition-transform duration-150 ease-out"
        style={{
          left: mousePosition.x - 8,
          top: mousePosition.y - 8,
          transform: `scale(${isScrolled ? 1.5 : 1})`
        }}
      />

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-40 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-2xl border-b border-white/20' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              Victor Ndunda
            </motion.div>
            <div className="hidden md:flex space-x-8">
              {['home', 'about', 'skills', 'projects', 'experience', 'testimonials', 'blog', 'contact'].map((section) => (
                <motion.button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`capitalize transition-all duration-300 relative ${
                    activeSection === section 
                      ? 'text-blue-600 font-semibold' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {section}
                  {activeSection === section && (
                    <motion.div
                      layoutId="activeSection"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Available for new opportunities</span>
                </motion.div>
                
                <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Hi, I'm Victor
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {typedText}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-blue-600"
                    >
                      |
                    </motion.span>
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Transforming complex financial data into actionable insights with 5+ years of experience 
                  in the retirement industry. Specialized in data analysis, cybersecurity, and AI-driven solutions.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    onClick={() => scrollToSection('projects')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    View Projects
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Download CV
                    <Download className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <motion.div 
                  className="flex items-center space-x-2 text-gray-600"
                  whileHover={{ scale: 1.05 }}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Nairobi, Kenya</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-2 text-gray-600"
                  whileHover={{ scale: 1.05 }}
                >
                  <Award className="w-4 h-4" />
                  <span>BSc Computer Science</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-2 text-gray-600"
                  whileHover={{ scale: 1.05 }}
                >
                  <Coffee className="w-4 h-4" />
                  <span>5+ Years Experience</span>
                </motion.div>
              </div>

              {/* Social Links */}
              <div className="flex space-x-4 pt-4">
                {[
                  { icon: Github, href: "https://github.com/gadda00", label: "GitHub" },
                  { icon: Linkedin, href: "#", label: "LinkedIn" },
                  { icon: Mail, href: "mailto:victor.ndunda@email.com", label: "Email" }
                ].map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative w-full max-w-md mx-auto">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl blur-3xl opacity-30"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.img
                  src={victorAvatar}
                  alt="Victor Ndunda"
                  className="relative w-full rounded-3xl shadow-2xl border-4 border-white/50"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* Floating Elements */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-2xl shadow-xl"
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Zap className="w-6 h-6" />
                </motion.div>
                
                <motion.div
                  className="absolute -bottom-4 -left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-2xl shadow-xl"
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                >
                  <Brain className="w-6 h-6" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="cursor-pointer"
            onClick={() => scrollToSection('about')}
          >
            <ChevronDown className="w-8 h-8 text-gray-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div
                  className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {stat.icon}
                </motion.div>
                <motion.h3 
                  className="text-3xl font-bold text-gray-900 mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring" }}
                  viewport={{ once: true }}
                >
                  {stat.value}
                </motion.h3>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
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
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">About Me</h2>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
            />
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
              
              <motion.div
                className="flex flex-wrap gap-3 pt-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                viewport={{ once: true }}
              >
                {["Data Analysis", "Python", "AI/ML", "Financial Services", "Cybersecurity"].map((skill, index) => (
                  <motion.span
                    key={skill}
                    className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {skill}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              {[
                { icon: TrendingUp, value: "75%", label: "Report Generation Time Reduction", color: "from-blue-500 to-cyan-500" },
                { icon: Users, value: "3+", label: "Major Organizations", color: "from-purple-500 to-pink-500" },
                { icon: Database, value: "10+", label: "Data Science Projects", color: "from-green-500 to-emerald-500" },
                { icon: Brain, value: "AI/ML", label: "Specialized Expertise", color: "from-orange-500 to-red-500" }
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                >
                  <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                    <motion.div 
                      className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mx-auto mb-4 text-white`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <item.icon className="w-6 h-6" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.value}</h3>
                    <p className="text-gray-600 text-sm">{item.label}</p>
                  </Card>
                </motion.div>
              ))}
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
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Skills & Expertise</h2>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {skills.map((skillGroup, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <motion.div 
                          className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          {skillGroup.icon}
                        </motion.div>
                        <div>
                          <CardTitle className="text-xl">{skillGroup.category}</CardTitle>
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                initial={{ width: 0 }}
                                whileInView={{ width: `${skillGroup.level}%` }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                                viewport={{ once: true }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-600">{skillGroup.level}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {skillGroup.skills.map((skill, skillIndex) => (
                        <motion.li 
                          key={skillIndex} 
                          className="flex items-start space-x-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + skillIndex * 0.1 }}
                          viewport={{ once: true }}
                        >
                          <motion.div 
                            className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 flex-shrink-0"
                            whileHover={{ scale: 1.5 }}
                          />
                          <span className="text-gray-600">{skill}</span>
                        </motion.li>
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
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Featured Projects</h2>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 group">
                  <div className="relative h-48 overflow-hidden">
                    <motion.img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Badge variant="secondary" className="bg-white/90 text-gray-700">
                        {project.category}
                      </Badge>
                      {project.featured && (
                        <motion.div
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Project Stats Overlay */}
                    <div className="absolute bottom-4 left-4 flex space-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center space-x-1 text-white text-sm">
                        <Star className="w-4 h-4" />
                        <span>{project.stats.stars}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-white text-sm">
                        <Eye className="w-4 h-4" />
                        <span>{project.stats.views}</span>
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-300">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {project.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, techIndex) => (
                          <motion.span
                            key={techIndex}
                            className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-xs font-medium"
                            whileHover={{ scale: 1.05 }}
                          >
                            {tech}
                          </motion.span>
                        ))}
                      </div>
                      
                      <div className="flex space-x-3">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full border-gray-300 hover:border-blue-500 hover:text-blue-600">
                            <Github className="w-4 h-4 mr-2" />
                            Code
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                          <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Demo
                          </Button>
                        </motion.div>
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
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Professional Experience</h2>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <div className="space-y-8">
            {experience.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center space-x-4">
                        <motion.div 
                          className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          {exp.icon}
                        </motion.div>
                        <div>
                          <CardTitle className="text-xl text-gray-900">{exp.title}</CardTitle>
                          <CardDescription className="text-lg font-semibold text-blue-600">
                            {exp.company}
                          </CardDescription>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                      >
                        <Badge variant="outline" className="mt-2 md:mt-0 border-blue-200 text-blue-700">
                          {exp.period}
                        </Badge>
                      </motion.div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-6">{exp.description}</p>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <Award className="w-4 h-4 mr-2 text-blue-600" />
                        Key Achievements:
                      </h4>
                      <ul className="space-y-2">
                        {exp.achievements.map((achievement, achIndex) => (
                          <motion.li 
                            key={achIndex} 
                            className="flex items-start space-x-3"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + achIndex * 0.1 }}
                            viewport={{ once: true }}
                          >
                            <motion.div 
                              className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2 flex-shrink-0"
                              whileHover={{ scale: 1.5 }}
                            />
                            <span className="text-gray-600">{achievement}</span>
                          </motion.li>
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

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">What People Say</h2>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-8 text-center border-0 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl">
                  <div className="flex justify-center mb-6">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star className="w-6 h-6 text-yellow-400 fill-current" />
                      </motion.div>
                    ))}
                  </div>
                  
                  <blockquote className="text-xl text-gray-700 mb-8 italic leading-relaxed">
                    "{testimonials[currentTestimonial].content}"
                  </blockquote>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <motion.img
                      src={testimonials[currentTestimonial].avatar}
                      alt={testimonials[currentTestimonial].name}
                      className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                      whileHover={{ scale: 1.1 }}
                    />
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-900">
                        {testimonials[currentTestimonial].name}
                      </h4>
                      <p className="text-blue-600 font-medium">
                        {testimonials[currentTestimonial].role}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {testimonials[currentTestimonial].company}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>
            
            {/* Testimonial Navigation */}
            <div className="flex justify-center space-x-2 mt-8">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                      : 'bg-gray-300'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Latest Insights</h2>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-gray-50 overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    <motion.img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        {post.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center space-x-1 text-white text-sm bg-black/50 rounded-full px-2 py-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-white text-sm bg-black/50 rounded-full px-2 py-1">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{post.likes}</span>
                      </div>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Read More
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Get In Touch</h2>
            <motion.div 
              className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto mb-8"
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
            />
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
            className="max-w-4xl mx-auto"
          >
            <Card className="p-8 border-0 bg-gradient-to-br from-blue-50 to-purple-50 shadow-2xl">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                {[
                  { icon: Mail, title: "Email", value: "victor.ndunda@email.com", href: "mailto:victor.ndunda@email.com" },
                  { icon: Linkedin, title: "LinkedIn", value: "linkedin.com/in/victor-ndunda", href: "#" },
                  { icon: Github, title: "GitHub", value: "github.com/gadda00", href: "https://github.com/gadda00" }
                ].map((contact, index) => (
                  <motion.div 
                    key={contact.title}
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto text-white"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <contact.icon className="w-8 h-8" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{contact.title}</h3>
                      <a 
                        href={contact.href}
                        className="text-gray-600 hover:text-blue-600 transition-colors duration-300"
                      >
                        {contact.value}
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-12 text-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <motion.h3 
              className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Victor Ndunda
            </motion.h3>
            <p className="text-gray-400 mt-2">Data Analyst & Technology Professional</p>
          </div>
          
          <div className="flex justify-center space-x-6 mb-8">
            {[
              { icon: Github, href: "https://github.com/gadda00" },
              { icon: Linkedin, href: "#" },
              { icon: Mail, href: "mailto:victor.ndunda@email.com" }
            ].map((social, index) => (
              <motion.a 
                key={index}
                href={social.href} 
                className="text-gray-400 hover:text-white transition-colors duration-300"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <social.icon className="w-6 h-6" />
              </motion.a>
            ))}
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Victor Ndunda. All rights reserved. Built with React, Tailwind CSS, and Framer Motion.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

