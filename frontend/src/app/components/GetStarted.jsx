'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../styles/GetStarted.module.css';

const plans = [
  {
    name: 'Starter',
    price: '$29',
    billing: 'per month',
    features: [
      'AI-powered business analysis',
      'Basic performance tracking',
      'Up to 3 team members',
      '5 projects',
      'Email support'
    ]
  },
  {
    name: 'Professional',
    price: '$99',
    billing: 'per month',
    popular: true,
    features: [
      'Advanced AI insights',
      'Real-time performance tracking',
      'Up to 10 team members',
      'Unlimited projects',
      'Priority support',
      'Custom reporting',
      'API access'
    ]
  },
  {
    name: 'Enterprise',
    monthlyPrice: 'Custom',
    yearlyPrice: 'Custom',
    description: 'Tailored solutions for large organizations',
    features: [
      'Full AI capabilities',
      'Advanced analytics',
      'Unlimited team members',
      'Unlimited projects',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'On-premise options',
      'Custom AI model training'
    ]
  }
];

const GetStarted = ({ isOpen, onClose }) => {
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.getstarted_modal_overlay}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            className={styles.getstarted_modal}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={e => e.stopPropagation()}
          >
            <button className={styles.getstarted_modal_close} onClick={onClose}>×</button>
            
            <div className={styles.getstarted_modal_header}>
              <h2 className={styles.getstarted_modal_title}>Choose Your Plan</h2>
            </div>

            <div className={styles.getstarted_plans_container}>
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  className={`${styles.getstarted_plan_card} ${plan.popular ? styles.popular : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={styles.getstarted_plan_header}>
                    <h3 className={styles.getstarted_plan_name}>{plan.name}</h3>
                    <div className={styles.getstarted_plan_price}>
                      {plan.billing ? `${plan.price}/per month` : ''}
                    </div>
                  </div>

                  <ul className={styles.getstarted_plan_features}>
                    {plan.features.map((feature, i) => (
                      <li key={i} className={styles.getstarted_plan_feature}>
                        <span className={styles.getstarted_feature_icon}>✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <motion.a
                    href="#"
                    className={styles.getstarted_plan_cta}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </motion.a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GetStarted; 