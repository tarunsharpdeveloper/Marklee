import React from 'react';
import { motion } from 'framer-motion';
import './styles/Testimonials.css';

const testimonialsList = [
  {
    content: "Marklee's AI platform has completely transformed how we approach our business strategy. The insights we've gained are invaluable.",
    author: "Sarah Johnson",
    position: "CEO, TechVision Inc.",
    initials: "SJ"
  },
  {
    content: "The data-driven decisions we can now make have led to a 40% increase in our operational efficiency. This platform is a game-changer.",
    author: "Michael Chen",
    position: "Operations Director, GlobalTech",
    initials: "MC"
  },
  {
    content: "Implementation was smooth, and the results were immediate. Our team now has the insights they need to make better decisions faster.",
    author: "Emily Rodriguez",
    position: "Strategy Lead, InnovateNow",
    initials: "ER"
  }
];

const Testimonials = () => {
  return (
    <section className="testimonials">
      <div className="testimonials-container">
        <motion.div
          className="testimonials-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="testimonials-title">What Our Clients Say</h2>
          <p className="testimonials-subtitle">
            See how businesses are transforming their operations with our AI-powered platform.
          </p>
        </motion.div>
        <div className="testimonials-grid">
          {testimonialsList.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              className="testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <p className="testimonial-content">{testimonial.content}</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  {testimonial.initials}
                </div>
                <div className="author-info">
                  <h4>{testimonial.author}</h4>
                  <p>{testimonial.position}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials; 