import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './styles/FAQ.css';

const ChevronIcon = () => (
  <svg 
    className="arrow" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M6 9L12 15L18 9" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "What's included in the free trial?",
      answer: "Our 14-day free trial includes full access to all features across all plans. You can test every aspect of our platform with no limitations. No credit card is required to start."
    },
    {
      question: "Can I switch plans later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate your billing accordingly."
    },
    {
      question: "How does the annual discount work?",
      answer: "When you choose annual billing, you get a 20% discount compared to monthly billing. This discount is applied automatically and helps you save while committing to long-term success."
    },
    {
      question: "What kind of support do you offer?",
      answer: "Basic plans include email support with 24-hour response time. Pro plans feature 24/7 priority support. Enterprise plans come with a dedicated support team and custom SLA."
    },
    {
      question: "Is there a limit on team members?",
      answer: "Basic plans include 3 team members. Pro plans offer unlimited team members. Enterprise plans include custom team management solutions."
    },
    {
      question: "How secure is your platform?",
      answer: "We implement enterprise-grade security measures including end-to-end encryption, regular security audits, and compliance with major security standards. Enterprise plans include additional custom security features."
    }
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-section" id='faq'>
      <div className="faq-container">
        <motion.div 
          className="faq-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about our services</p>
        </motion.div>

        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="faq-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button 
                className={`faq-question ${activeIndex === index ? 'active' : ''}`}
                onClick={() => toggleAccordion(index)}
              >
                {faq.question}
                <ChevronIcon />
              </button>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    className="faq-answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ; 