import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Star, Quote } from 'lucide-react'
import avatarSarah from '../assets/avatar_sarah.jpg'
import avatarMichael from '../assets/avatar_michael.jpg'
import avatarEmily from '../assets/avatar_emily.jpg'

const TestimonialSection = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Senior Data Manager",
      company: "NSSF",
      content: "Victor's analytical skills and attention to detail have been instrumental in improving our retirement benefits processing efficiency. His dashboard solutions have transformed how we make data-driven decisions.",
      rating: 5,
      avatar: avatarSarah
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "CTO",
      company: "Enwealth Financial Services",
      content: "The automated reporting system Victor developed reduced our report generation time by 75%. His expertise in Python and ETL processes is exceptional.",
      rating: 5,
      avatar: avatarMichael
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      role: "Research Director",
      company: "FinTech Innovations",
      content: "Victor's multi-agent AI platform showcases his forward-thinking approach to data analysis. His combination of technical skills and business acumen is rare in the industry.",
      rating: 5,
      avatar: avatarEmily
    }
  ]

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Colleagues Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Testimonials from industry professionals who have worked with Victor
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Quote className="w-8 h-8 text-blue-600 mb-4" />
                  </div>
                  
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <p className="text-sm text-blue-600">{testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialSection

