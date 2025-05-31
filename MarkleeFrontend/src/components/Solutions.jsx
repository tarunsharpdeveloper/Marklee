import React from 'react';
import { motion } from 'framer-motion';
import './styles/Solutions.css';

const solutionsList = [
  {
    title: 'Predictive Analytics',
    icon: '📊',
    description: 'Harness the power of AI to forecast market trends, customer behavior, and business outcomes.',
    benefits: [
      'Market trend forecasting',
      'Customer behavior prediction',
      'Revenue projections',
      'Risk assessment'
    ]
  },
  {
    title: 'Process Automation',
    icon: '⚡',
    description: 'Streamline your operations with intelligent automation powered by machine learning.',
    benefits: [
      'Workflow optimization',
      'Resource allocation',
      'Task prioritization',
      'Error reduction'
    ]
  },
  {
    title: 'Customer Intelligence',
    icon: '🎯',
    description: 'Understand your customers better with AI-driven insights and personalization.',
    benefits: [
      'Sentiment analysis',
      'Behavior tracking',
      'Preference prediction',
      'Personalized engagement'
    ]
  }
];

const Solutions = () => {
  return (
    <section className="solutions" id="solutions">
      <div className="solutions-container">
        <motion.div
          className="solutions-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="solutions-title">AI-Powered Solutions</h2>
          <p className="solutions-subtitle">
            Transform your business with our cutting-edge AI solutions tailored to your industry needs
          </p>
        </motion.div>

        <div className="solutions-grid">
          {solutionsList.map((solution, index) => (
            <motion.div
              key={`${solution.title}-${index}`}
              className="solution-card"
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.05 ,
                x: 5,
                boxShadow: "0 28px 36px rgba(0, 0, 0, 0.18)"
              }}
              viewport={{ once: true }}
              style={{ cursor: 'default' }}
            >
              <div className="solution-icon">{solution.icon}</div>
              <h3 className="solution-title">{solution.title}</h3>
              <p className="solution-description">{solution.description}</p>
              <ul className="solution-benefits">
                {solution.benefits.map((benefit, i) => (
                  <li key={i}>
                    <span className="benefit-icon">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <button className="solution-cta">Learn More</button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Solutions;
