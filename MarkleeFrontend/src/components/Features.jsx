import React from 'react';
import { motion } from 'framer-motion';
import './styles/Features.css';

const featuresList = [
  {
    icon: '🎯',
    title: 'Strategic Planning',
    description: 'AI-powered analysis to develop comprehensive business strategies tailored to your goals.'
  },
  {
    icon: '📊',
    title: 'Data Analytics',
    description: 'Transform raw data into actionable insights with our advanced analytics tools.'
  },
  {
    icon: '🤖',
    title: 'Automation',
    description: 'Streamline your operations with intelligent automation solutions.'
  },
  {
    icon: '📈',
    title: 'Performance Tracking',
    description: 'Monitor and optimize your business performance in real-time.'
  },
  {
    icon: '🔄',
    title: 'Adaptive Learning',
    description: 'Our AI continuously learns and adapts to improve your business outcomes.'
  },
  {
    icon: '🛡️',
    title: 'Risk Management',
    description: 'Identify and mitigate potential risks before they impact your business.'
  }
];

const Features = () => {
  return (
    <section className="features" id="features">
      <div className="features-container">
        <motion.div
          className="features-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="features-title">Powerful Features for Your Business</h2>
          <p className="features-subtitle">
            Leverage cutting-edge AI technology to transform your business strategy
            and drive sustainable growth.
          </p>
        </motion.div>
        <div className="features-grid">
          {featuresList.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="feature-card"
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.05,
                x: 5,
                boxShadow: "0 28px 36px rgba(0, 0, 0, 0.18)"
              }}
              viewport={{ once: true }}
              
              style={{ cursor: 'default' }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
