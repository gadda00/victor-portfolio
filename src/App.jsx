import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion'
import './App.css'

// Import assets
import heroBackground from './assets/hero_background.jpg'
import victorAvatar from './assets/victor_avatar.jpg'
import victorHeadshot from './assets/victor_headshot.jpg'
import intelliflowMockup from './assets/intelliflow_mockup.jpg'
import financialDashboardMockup from './assets/financial_dashboard_mockup.jpg'
import salesAnalyticsMockup from './assets/sales_analytics_mockup.jpg'
import dataVisualizationMockup from './assets/data_visualization_mockup.jpg'
import avatarSarah from './assets/avatar_sarah.jpg'
import avatarMichael from './assets/avatar_michael.jpg'
import avatarEmily from './assets/avatar_emily.jpg'

function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [isLoading, setIsLoading] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [typewriterText, setTypewriterText] = useState('')
  const [typewriterIndex, setTypewriterIndex] = useState(0)
  
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '200%'])

  const roles = [
    'Data Analyst',
    'Technology Professional', 
    'AI/ML Specialist',
    'Financial Data Expert',
    'Business Intelligence Developer'
  ]

  // Typewriter effect
  useEffect(() => {
    const currentRole = roles[typewriterIndex]
    if (typewriterText.length < currentRole.length) {
      const timeout = setTimeout(() => {
        setTypewriterText(currentRole.slice(0, typewriterText.length + 1))
      }, 100)
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => {
        setTypewriterText('')
        setTypewriterIndex((prev) => (prev + 1) % roles.length)
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [typewriterText, typewriterIndex])

  // Loading effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Scroll spy
  useEffect(() => {
    const handleScroll = () => {
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

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const skills = [
    { name: 'Data Analysis & Business Intelligence', level: 95, icon: '📊', color: 'from-blue-500 to-purple-600' },
    { name: 'Programming & Technical Tools', level: 90, icon: '💻', color: 'from-purple-500 to-pink-600' },
    { name: 'Information Security', level: 85, icon: '🔒', color: 'from-green-500 to-blue-600' },
    { name: 'Data Visualization & Communication', level: 92, icon: '📈', color: 'from-orange-500 to-red-600' }
  ]

  const projects = [
    {
      title: 'IntelliFlow - Multi-Agent Data Analysis Platform',
      description: 'A sophisticated multi-agent data analysis and insights platform built with Python, React, and Google Cloud services.',
      image: intelliflowMockup,
      tags: ['Python', 'React', 'Google Cloud', 'AI/ML', 'Multi-Agent Systems'],
      category: 'AI/ML',
      stats: { stars: 127, forks: 34, commits: 245 }
    },
    {
      title: 'Financial Analytics Dashboard',
      description: 'Comprehensive financial dashboard featuring real-time KPI tracking, revenue analysis, and expense categorization.',
      image: financialDashboardMockup,
      tags: ['Google Looker Studio', 'Data Visualization', 'SQL', 'Business Intelligence'],
      category: 'Business Intelligence',
      stats: { stars: 89, forks: 23, commits: 156 }
    },
    {
      title: 'Sales Analytics Platform',
      description: 'Advanced sales analytics platform with conversion funnel analysis, regional performance tracking, and revenue forecasting.',
      image: salesAnalyticsMockup,
      tags: ['Python', 'Pandas', 'Scikit-learn', 'Matplotlib', 'Statistical Analysis'],
      category: 'Data Science',
      stats: { stars: 203, forks: 67, commits: 389 }
    },
    {
      title: 'Retirement Benefits Dashboard',
      description: 'Interactive dashboard using Google Looker Studio to visualize retirement benefits data for NSSF stakeholders.',
      image: dataVisualizationMockup,
      tags: ['Google Looker Studio', 'Data Visualization', 'SQL', 'Business Intelligence'],
      category: 'Business Intelligence',
      stats: { stars: 156, forks: 45, commits: 278 }
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Senior Data Manager',
      company: 'Enwealth Financial Services',
      content: "Victor's analytical skills and attention to detail are exceptional. He transformed our reporting process and delivered insights that directly impacted our business strategy.",
      avatar: avatarSarah,
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Head of Technology',
      company: 'Retirement Benefits Authority',
      content: "Working with Victor was a game-changer for our data infrastructure. His expertise in financial data analysis and visualization helped us make better policy decisions.",
      avatar: avatarMichael,
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Project Manager',
      company: 'NSSF',
      content: "Victor's ability to translate complex data into actionable insights is remarkable. He consistently delivered high-quality work that exceeded our expectations.",
      avatar: avatarEmily,
      rating: 5
    }
  ]

  const blogPosts = [
    {
      title: 'The Future of AI in Financial Data Analysis',
      excerpt: 'Exploring how artificial intelligence is revolutionizing the way we analyze and interpret financial data in the retirement industry.',
      category: 'AI & Technology',
      readTime: '8 min read',
      views: 2847,
      likes: 156,
      date: 'Dec 15, 2024'
    },
    {
      title: 'Building Effective Data Visualization Dashboards',
      excerpt: 'Best practices for creating compelling and informative dashboards that drive decision-making in financial services.',
      category: 'Data Visualization',
      readTime: '6 min read',
      views: 1923,
      likes: 89,
      date: 'Nov 28, 2024'
    },
    {
      title: 'Cybersecurity in the Age of Digital Finance',
      excerpt: 'Understanding the critical importance of data protection and security measures in modern financial institutions.',
      category: 'Cybersecurity',
      readTime: '10 min read',
      views: 3156,
      likes: 234,
      date: 'Nov 10, 2024'
    }
  ]

  const AnimatedSection = ({ children, className = '' }) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, threshold: 0.1 })
    
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </motion.div>
    )
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="loading-content"
        >
          <div className="loading-spinner"></div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Loading Portfolio...
          </motion.h2>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="App">
      {/* Custom Cursor */}
      <motion.div
        className="custom-cursor"
        animate={{ x: mousePosition.x - 10, y: mousePosition.y - 10 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      />

      {/* Floating Elements */}
      <div className="floating-elements">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`floating-element floating-element-${i + 1}`}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="navbar"
      >
        <div className="nav-container">
          <motion.div
            className="nav-logo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Victor Ndunda
          </motion.div>
          
          <div className="nav-menu">
            {['home', 'about', 'skills', 'projects', 'experience', 'testimonials', 'blog', 'contact'].map((item) => (
              <motion.button
                key={item}
                className={`nav-item ${activeSection === item ? 'active' : ''}`}
                onClick={() => scrollToSection(item)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {item}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <motion.div
          className="hero-background"
          style={{ y: backgroundY }}
        >
          <img src={heroBackground} alt="Background" />
          <div className="hero-overlay"></div>
        </motion.div>
        
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            ✨ Available for new opportunities
          </motion.div>
          
          <motion.h1
            className="hero-title"
            style={{ y: textY }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Hi, I'm Victor
            <br />
            <span className="gradient-text">
              {typewriterText}
              <span className="cursor">|</span>
            </span>
          </motion.h1>
          
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            Transforming complex financial data into actionable insights with 5+ years of experience 
            in the retirement industry. Specialized in data analysis, cybersecurity, and AI-driven solutions.
          </motion.p>
          
          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection('projects')}
            >
              View Projects
              <span className="btn-icon">🚀</span>
            </motion.button>
            
            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              Download CV
              <span className="btn-icon">📄</span>
            </motion.button>
          </motion.div>
          
          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="stat-item">
              <span className="stat-icon">📍</span>
              <span>Nairobi, Kenya</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🎓</span>
              <span>BSc Computer Science</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">💼</span>
              <span>5+ Years Experience</span>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          className="hero-avatar"
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 100 }}
        >
          <div className="avatar-container">
            <img src={victorAvatar} alt="Victor Ndunda" />
            <div className="avatar-ring"></div>
            <div className="avatar-pulse"></div>
          </div>
        </motion.div>
        
        <motion.div
          className="scroll-indicator"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="scroll-arrow">↓</div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <AnimatedSection className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {[
              { number: '50+', label: 'Projects Completed', icon: '🎯' },
              { number: '5+', label: 'Years Experience', icon: '📅' },
              { number: '25+', label: 'Happy Clients', icon: '💝' },
              { number: '1000+', label: 'Code Commits', icon: '💻' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="stat-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <h2 className="section-title">About Me</h2>
              <div className="section-line"></div>
            </div>
          </AnimatedSection>
          
          <div className="about-content">
            <AnimatedSection className="about-text">
              <p>
                I am a Computer Science graduate from the University of Embu with over 5 years of experience 
                in data analysis, cybersecurity, and creative design. My professional journey has been focused 
                on the retirement industry, where I've developed expertise in analyzing complex financial datasets 
                and creating visual representations of findings.
              </p>
              <p>
                With experience at organizations like the National Social Security Fund (NSSF), Retirement Benefits 
                Authority (RBA), and Enwealth Financial Services, I've honed my skills in transforming raw data into 
                actionable insights that drive decision-making.
              </p>
              <p>
                I'm passionate about leveraging technology to create meaningful solutions and am particularly 
                interested in the applications of AI in financial services and data-driven retirement planning.
              </p>
              
              <div className="about-tags">
                {['Data Analysis', 'Python', 'AI/ML', 'Financial Services', 'Cybersecurity'].map((tag, index) => (
                  <motion.span
                    key={index}
                    className="tag"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </AnimatedSection>
            
            <AnimatedSection className="about-image">
              <div className="image-container">
                <img src={victorHeadshot} alt="Victor Ndunda" />
                <div className="image-overlay">
                  <div className="overlay-content">
                    <div className="achievement">
                      <div className="achievement-icon">📈</div>
                      <div className="achievement-text">
                        <div className="achievement-number">75%</div>
                        <div className="achievement-label">Report Generation Time Reduction</div>
                      </div>
                    </div>
                    <div className="achievement">
                      <div className="achievement-icon">🏢</div>
                      <div className="achievement-text">
                        <div className="achievement-number">3+</div>
                        <div className="achievement-label">Major Organizations</div>
                      </div>
                    </div>
                    <div className="achievement">
                      <div className="achievement-icon">📊</div>
                      <div className="achievement-text">
                        <div className="achievement-number">10+</div>
                        <div className="achievement-label">Data Science Projects</div>
                      </div>
                    </div>
                    <div className="achievement">
                      <div className="achievement-icon">🤖</div>
                      <div className="achievement-text">
                        <div className="achievement-number">AI/ML</div>
                        <div className="achievement-label">Specialized Expertise</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="skills-section">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <h2 className="section-title">Skills & Expertise</h2>
              <div className="section-line"></div>
            </div>
          </AnimatedSection>
          
          <div className="skills-grid">
            {skills.map((skill, index) => (
              <AnimatedSection key={index} className="skill-card">
                <motion.div
                  className="skill-content"
                  whileHover={{ scale: 1.02, y: -5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="skill-header">
                    <div className="skill-icon">{skill.icon}</div>
                    <h3 className="skill-title">{skill.name}</h3>
                  </div>
                  
                  <div className="skill-progress">
                    <div className="progress-bar">
                      <motion.div
                        className={`progress-fill bg-gradient-to-r ${skill.color}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                    </div>
                    <span className="progress-text">{skill.level}%</span>
                  </div>
                  
                  <div className="skill-details">
                    {skill.name === 'Data Analysis & Business Intelligence' && (
                      <ul>
                        <li>Financial data modeling and trend analysis</li>
                        <li>Retirement benefits data processing</li>
                        <li>Google Looker Studio dashboard development</li>
                        <li>Advanced Excel (Power Query, DAX formulas)</li>
                        <li>Statistical analysis for policy recommendations</li>
                      </ul>
                    )}
                    {skill.name === 'Programming & Technical Tools' && (
                      <ul>
                        <li>Python for financial data analysis</li>
                        <li>Google Colab for collaborative projects</li>
                        <li>SQL for pension database querying</li>
                        <li>ETL workflow design and implementation</li>
                        <li>Automated reporting systems development</li>
                      </ul>
                    )}
                    {skill.name === 'Information Security' && (
                      <ul>
                        <li>Financial data protection protocols</li>
                        <li>Compliance with retirement industry regulations</li>
                        <li>Sensitive personal information handling</li>
                        <li>Risk assessment for financial systems</li>
                      </ul>
                    )}
                    {skill.name === 'Data Visualization & Communication' && (
                      <ul>
                        <li>Financial data storytelling through infographics</li>
                        <li>Retirement benefits presentation design</li>
                        <li>Complex policy visualization for stakeholders</li>
                        <li>Executive-level reporting and communication</li>
                      </ul>
                    )}
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="projects-section">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <h2 className="section-title">Featured Projects</h2>
              <div className="section-line"></div>
            </div>
          </AnimatedSection>
          
          <div className="projects-grid">
            {projects.map((project, index) => (
              <AnimatedSection key={index} className="project-card">
                <motion.div
                  className="project-content"
                  whileHover={{ y: -10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="project-image">
                    <img src={project.image} alt={project.title} />
                    <div className="project-overlay">
                      <div className="project-stats">
                        <div className="stat">
                          <span className="stat-icon">⭐</span>
                          <span>{project.stats.stars}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-icon">🔀</span>
                          <span>{project.stats.forks}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-icon">📝</span>
                          <span>{project.stats.commits}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="project-info">
                    <div className="project-category">{project.category}</div>
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-description">{project.description}</p>
                    
                    <div className="project-tags">
                      {project.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="project-tag">{tag}</span>
                      ))}
                    </div>
                    
                    <div className="project-actions">
                      <motion.button
                        className="btn-project"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View Project
                      </motion.button>
                      <motion.button
                        className="btn-project-secondary"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Live Demo
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="experience-section">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <h2 className="section-title">Professional Experience</h2>
              <div className="section-line"></div>
            </div>
          </AnimatedSection>
          
          <div className="timeline">
            {[
              {
                title: 'Research Intern',
                company: 'Retirement Benefits Authority (RBA)',
                period: 'April 2024 - May 2024',
                description: 'Conducted comprehensive research on retirement industry trends and regulatory frameworks. Collected, cleaned, and analyzed large datasets to support evidence-based policy recommendations.',
                achievements: [
                  'Analyzed complex regulatory frameworks',
                  'Prepared detailed reports for senior management',
                  'Supported evidence-based policy recommendations'
                ],
                icon: '🔬'
              },
              {
                title: 'Data Analyst Intern',
                company: 'Enwealth Financial Services',
                period: 'February 2022 - June 2022',
                description: 'Performed data extraction, transformation, and loading (ETL) processes for financial datasets. Created interactive dashboards and reports using business intelligence tools.',
                achievements: [
                  'Reduced report generation time by 75%',
                  'Created interactive financial dashboards',
                  'Implemented automated ETL processes'
                ],
                icon: '📊'
              },
              {
                title: 'Benefits Processing Officer',
                company: 'National Social Security Fund (NSSF)',
                period: 'October 2020 - June 2021',
                description: 'Processed and analyzed benefits applications, ensuring compliance with regulatory requirements. Utilized data analysis techniques to identify patterns and optimize workflows.',
                achievements: [
                  'Optimized benefits processing workflows',
                  'Maintained strict data security protocols',
                  'Identified process improvement opportunities'
                ],
                icon: '🏛️'
              }
            ].map((job, index) => (
              <AnimatedSection key={index} className="timeline-item">
                <motion.div
                  className="timeline-content"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="timeline-icon">
                    <span>{job.icon}</span>
                  </div>
                  
                  <div className="timeline-info">
                    <div className="timeline-header">
                      <h3 className="timeline-title">{job.title}</h3>
                      <div className="timeline-company">{job.company}</div>
                      <div className="timeline-period">{job.period}</div>
                    </div>
                    
                    <p className="timeline-description">{job.description}</p>
                    
                    <div className="timeline-achievements">
                      <h4>Key Achievements:</h4>
                      <ul>
                        {job.achievements.map((achievement, achIndex) => (
                          <li key={achIndex}>{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <h2 className="section-title">What People Say</h2>
              <div className="section-line"></div>
            </div>
          </AnimatedSection>
          
          <div className="testimonials-container">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                className="testimonial-card"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                <div className="testimonial-content">
                  <div className="testimonial-quote">
                    <span className="quote-mark">"</span>
                    <p>{testimonials[currentTestimonial].content}</p>
                    <span className="quote-mark">"</span>
                  </div>
                  
                  <div className="testimonial-rating">
                    {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                      <span key={i} className="star">⭐</span>
                    ))}
                  </div>
                  
                  <div className="testimonial-author">
                    <img 
                      src={testimonials[currentTestimonial].avatar} 
                      alt={testimonials[currentTestimonial].name}
                      className="author-avatar"
                    />
                    <div className="author-info">
                      <h4 className="author-name">{testimonials[currentTestimonial].name}</h4>
                      <p className="author-role">{testimonials[currentTestimonial].role}</p>
                      <p className="author-company">{testimonials[currentTestimonial].company}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            <div className="testimonial-indicators">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentTestimonial ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="blog-section">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <h2 className="section-title">Latest Insights</h2>
              <div className="section-line"></div>
            </div>
          </AnimatedSection>
          
          <div className="blog-grid">
            {blogPosts.map((post, index) => (
              <AnimatedSection key={index} className="blog-card">
                <motion.div
                  className="blog-content"
                  whileHover={{ y: -5, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="blog-header">
                    <div className="blog-category">{post.category}</div>
                    <div className="blog-date">{post.date}</div>
                  </div>
                  
                  <h3 className="blog-title">{post.title}</h3>
                  <p className="blog-excerpt">{post.excerpt}</p>
                  
                  <div className="blog-meta">
                    <div className="blog-stats">
                      <span className="stat">
                        <span className="stat-icon">👁️</span>
                        {post.views.toLocaleString()}
                      </span>
                      <span className="stat">
                        <span className="stat-icon">❤️</span>
                        {post.likes}
                      </span>
                      <span className="stat">
                        <span className="stat-icon">⏱️</span>
                        {post.readTime}
                      </span>
                    </div>
                    
                    <motion.button
                      className="read-more-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Read More →
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <AnimatedSection>
            <div className="section-header">
              <h2 className="section-title">Get In Touch</h2>
              <div className="section-line"></div>
              <p className="section-subtitle">
                Ready to transform your data into actionable insights? Let's discuss how I can help 
                your organization make data-driven decisions.
              </p>
            </div>
          </AnimatedSection>
          
          <div className="contact-content">
            <AnimatedSection className="contact-info">
              <div className="contact-cards">
                {[
                  { icon: '📧', title: 'Email', value: 'victor.ndunda@email.com', link: 'mailto:victor.ndunda@email.com' },
                  { icon: '📱', title: 'Phone', value: '+254 700 000 000', link: 'tel:+254700000000' },
                  { icon: '📍', title: 'Location', value: 'Nairobi, Kenya', link: '#' },
                  { icon: '💼', title: 'LinkedIn', value: 'victor-ndunda', link: 'https://linkedin.com/in/victor-ndunda' }
                ].map((contact, index) => (
                  <motion.a
                    key={index}
                    href={contact.link}
                    className="contact-card"
                    whileHover={{ scale: 1.05, y: -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="contact-icon">{contact.icon}</div>
                    <div className="contact-details">
                      <h4>{contact.title}</h4>
                      <p>{contact.value}</p>
                    </div>
                  </motion.a>
                ))}
              </div>
            </AnimatedSection>
            
            <AnimatedSection className="contact-form">
              <motion.form
                className="form"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="form-group">
                  <input type="text" placeholder="Your Name" className="form-input" />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Your Email" className="form-input" />
                </div>
                <div className="form-group">
                  <input type="text" placeholder="Subject" className="form-input" />
                </div>
                <div className="form-group">
                  <textarea placeholder="Your Message" rows="5" className="form-textarea"></textarea>
                </div>
                <motion.button
                  type="submit"
                  className="form-submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Send Message
                  <span className="btn-icon">🚀</span>
                </motion.button>
              </motion.form>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-text">
              <p>&copy; 2024 Victor Ndunda. All rights reserved.</p>
              <p>Built with React, Framer Motion, and lots of ☕</p>
            </div>
            
            <div className="footer-social">
              {[
                { icon: '💼', link: 'https://linkedin.com/in/victor-ndunda' },
                { icon: '🐙', link: 'https://github.com/victor-ndunda' },
                { icon: '🐦', link: 'https://twitter.com/victor_ndunda' },
                { icon: '📧', link: 'mailto:victor.ndunda@email.com' }
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.link}
                  className="social-link"
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

