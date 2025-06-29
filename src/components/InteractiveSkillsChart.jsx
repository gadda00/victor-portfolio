import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'

const InteractiveSkillsChart = () => {
  const [selectedCategory, setSelectedCategory] = useState('technical')

  const skillCategories = {
    technical: {
      title: "Technical Skills",
      color: "blue",
      skills: [
        { name: "Python", level: 95, years: 5 },
        { name: "SQL", level: 90, years: 5 },
        { name: "Google Looker Studio", level: 88, years: 3 },
        { name: "React", level: 85, years: 2 },
        { name: "Machine Learning", level: 80, years: 3 },
        { name: "ETL Processes", level: 92, years: 4 },
        { name: "Data Visualization", level: 90, years: 4 },
        { name: "Statistical Analysis", level: 87, years: 4 }
      ]
    },
    tools: {
      title: "Tools & Platforms",
      color: "green",
      skills: [
        { name: "Google Cloud Platform", level: 85, years: 3 },
        { name: "Pandas", level: 95, years: 5 },
        { name: "Matplotlib/Seaborn", level: 90, years: 4 },
        { name: "Scikit-learn", level: 82, years: 3 },
        { name: "Git/GitHub", level: 88, years: 4 },
        { name: "Docker", level: 75, years: 2 },
        { name: "Jupyter Notebooks", level: 95, years: 5 },
        { name: "Excel/Google Sheets", level: 92, years: 5 }
      ]
    },
    domain: {
      title: "Domain Expertise",
      color: "purple",
      skills: [
        { name: "Financial Analysis", level: 95, years: 5 },
        { name: "Retirement Benefits", level: 98, years: 5 },
        { name: "Risk Assessment", level: 85, years: 4 },
        { name: "Compliance & Regulations", level: 88, years: 4 },
        { name: "Business Intelligence", level: 90, years: 4 },
        { name: "Process Automation", level: 87, years: 3 },
        { name: "Data Governance", level: 83, years: 3 },
        { name: "Cybersecurity", level: 80, years: 3 }
      ]
    }
  }

  const getColorClasses = (color, level) => {
    const colors = {
      blue: `bg-blue-${Math.floor(level/20) * 100 + 100}`,
      green: `bg-green-${Math.floor(level/20) * 100 + 100}`,
      purple: `bg-purple-${Math.floor(level/20) * 100 + 100}`
    }
    return colors[color] || 'bg-gray-200'
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Skills & Expertise
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Interactive overview of technical skills, tools, and domain expertise
          </p>
        </motion.div>

        <div className="flex justify-center mb-8">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            {Object.entries(skillCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-6 py-2 rounded-md transition-all duration-300 ${
                  selectedCategory === key
                    ? 'bg-white shadow-md text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {skillCategories[selectedCategory].title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {skillCategories[selectedCategory].skills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{skill.name}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{skill.years} years</Badge>
                        <span className="text-sm text-gray-600">{skill.level}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                        className={`h-2 rounded-full ${
                          skillCategories[selectedCategory].color === 'blue' ? 'bg-blue-600' :
                          skillCategories[selectedCategory].color === 'green' ? 'bg-green-600' :
                          'bg-purple-600'
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

export default InteractiveSkillsChart

