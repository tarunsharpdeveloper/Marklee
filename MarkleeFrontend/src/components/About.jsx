import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './styles/About.css';

const stats = [
  { number: "1M+", label: "Data Points Analyzed Daily" },
  { number: "94%", label: "Prediction Accuracy" },
  { number: "10K+", label: "Business Decisions Optimized" },
  { number: "24/7", label: "AI-Powered Support" }
];

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C7.58 3 4 6.58 4 11c0 2.65 1.33 4.98 3.35 6.37C7.5 17.5 7.59 17.62 7.73 17.73L8 18c.88.62 1.89 1.08 3 1.32V22h2v-2.68c1.11-.24 2.12-.7 3-1.32l.27-.27c.14-.11.23-.23.38-.36C18.67 15.98 20 13.65 20 11c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
        <path d="M12 8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
    ),
    title: "Advanced AI Engine",
    description: "Our proprietary AI engine processes millions of data points to provide accurate business insights and predictions."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
        <path d="M16 6l2.29-2.29L20.59 6 22 4.59l-2.29-2.29L22 0 20.59 1.41 18.3 3.7 16.89 2.29 18.3 0 16.89 1.41 19.18 3.7"/>
      </svg>
    ),
    title: "Predictive Analytics",
    description: "Leverage machine learning algorithms to forecast market trends and optimize your business strategies."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m5 4v2a5 5 0 0 1-5 5 5 5 0 0 1-5-5V6a7 7 0 0 0-7 7 7 7 0 0 0 7 7h10a7 7 0 0 0 7-7 7 7 0 0 0-7-7M9 17v2h6v-2H9z"/>
      </svg>
    ),
    title: "Intelligent Automation",
    description: "Automate complex business processes with AI-driven workflows and smart decision-making systems."
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
      </svg>
    ),
    title: "Secure Processing",
    description: "Enterprise-grade security with AI-powered threat detection and real-time protection mechanisms."
  }
];

const team = [
  {
    name: "Dr. Sarah Chen",
    role: "AI Research Director",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    description: "Ph.D. in Machine Learning, leading our AI innovation initiatives."
  },
  {
    name: "Michael Rodriguez",
    role: "Chief Technology Officer",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    description: "20+ years experience in AI and enterprise software development."
  },
  {
    name: "Emma Watson",
    role: "Data Science Lead",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    description: "Specialist in predictive modeling and neural networks."
  }
];

const About = () => {
  const [iconsLoaded, setIconsLoaded] = useState(false);

  useEffect(() => {
    // Check if Font Awesome is loaded
    const checkFontAwesome = () => {
      const testIcon = document.createElement('i');
      testIcon.className = 'fas fa-brain';
      document.body.appendChild(testIcon);
      const isLoaded = window.getComputedStyle(testIcon).fontFamily.includes('Font Awesome');
      document.body.removeChild(testIcon);
      return isLoaded;
    };

    const timer = setInterval(() => {
      if (checkFontAwesome()) {
        setIconsLoaded(true);
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="about-container"id='About'>
      <motion.div 
        className="about-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Powering Business Growth with Marklee</h1>
        <p>We combine cutting-edge artificial intelligence with deep business expertise to help companies thrive in the digital age.</p>
      </motion.div>

      <motion.div 
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {stats.map((stat, index) => (
          <motion.div 
            key={index}
            className="stat-card"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <h2>{stat.number}</h2>
            <p>{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        className="features-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2>Our AI Capabilities</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -5 }}
            >
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        className="mission-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="mission-content">
          <h2>Our Mission</h2>
          <p>To democratize artificial intelligence and make advanced business analytics accessible to companies of all sizes. We believe in the power of AI to transform businesses and drive sustainable growth.</p>
          <div className="mission-stats">
            <div className="mission-stat">
              <span className="stat-number">100+</span>
              <span className="stat-label">AI Models</span>
            </div>
            <div className="mission-stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Industries Served</span>
            </div>
            <div className="mission-stat">
              <span className="stat-number">95%</span>
              <span className="stat-label">Client Satisfaction</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="team-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2>Our AI Experts</h2>
        <div className="team-grid">
          {team.map((member, index) => (
            <motion.div
              key={index}
              className="team-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ y: -5 }}
            >
              <div className="member-image">
                <img src={member.image} alt={member.name} />
              </div>
              <h3>{member.name}</h3>
              <span className="member-role">{member.role}</span>
              <p>{member.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        className="cta-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="cta-content">
          <h2>Ready to Transform Your Business with AI?</h2>
          <p>Join thousands of companies using our AI-powered platform to drive growth and innovation.</p>
          <motion.button
            className="cta-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started <i className="fas fa-arrow-right"></i>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default About; 