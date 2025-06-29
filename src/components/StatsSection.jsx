import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { TrendingUp, Users, Award, Clock } from 'lucide-react'

const StatsSection = () => {
  const stats = [
    {
      id: 1,
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      number: "75%",
      label: "Efficiency Improvement",
      description: "Average improvement in report generation time across projects"
    },
    {
      id: 2,
      icon: <Users className="w-8 h-8 text-green-600" />,
      number: "50K+",
      label: "Beneficiaries Served",
      description: "Retirement beneficiaries impacted by data solutions"
    },
    {
      id: 3,
      icon: <Award className="w-8 h-8 text-purple-600" />,
      number: "15+",
      label: "Projects Completed",
      description: "Successful data analysis and automation projects"
    },
    {
      id: 4,
      icon: <Clock className="w-8 h-8 text-orange-600" />,
      number: "5+",
      label: "Years Experience",
      description: "Professional experience in data analysis and technology"
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Impact by Numbers
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Measurable results from data-driven solutions and analytical expertise
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="text-center hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    {stat.icon}
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                    viewport={{ once: true }}
                    className="text-4xl font-bold text-gray-900 mb-2"
                  >
                    {stat.number}
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {stat.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection

