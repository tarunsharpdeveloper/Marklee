import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './styles/Pricing.css';

const pricingPlans = [
  {
    name: 'Starter',
    monthlyPrice: '$29',
    yearlyPrice: '$290',
    description: 'Perfect for small businesses starting their AI journey',
    features: [
      'AI-powered business analysis',
      'Basic performance tracking',
      'Up to 3 team members',
      '5 projects',
      'Email support',
      'Basic API access'
    ]
  },
  {
    name: 'Professional',
    monthlyPrice: '$99',
    yearlyPrice: '$990',
    popular: true,
    description: 'Ideal for growing businesses needing advanced features',
    features: [
      'Advanced AI insights',
      'Real-time performance tracking',
      'Up to 10 team members',
      'Unlimited projects',
      'Priority support',
      'Custom reporting',
      'Full API access',
      'Custom integrations'
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

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="pricing" id="pricing">
      <div className="pricing-container">
        <motion.div
          className="pricing-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="pricing-title">Simple, Transparent Pricing</h2>
          <p className="pricing-subtitle">
            Choose the perfect plan for your business needs
          </p>
          
          <div className="pricing-toggle">
            <span className={!isYearly ? 'active' : ''}>Monthly</span>
            <motion.button
              className="toggle-button"
              onClick={() => setIsYearly(!isYearly)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="toggle-thumb"
                animate={{ x: isYearly ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
            <span className={isYearly ? 'active' : ''}>Yearly (Save 20%)</span>
          </div>
        </motion.div>

        <div className="pricing-grid">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              initial={{ opacity: 0, y: 5 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{
                scale: 1.02,
                x: 5,
                boxShadow: "0 28px 36px rgba(0, 0, 0, 0.18)"
              }}
              viewport={{ once: true }}
            
              style={{ cursor: 'default' }}
            >
              {plan.popular && (
                <div className="popular-badge">Most Popular</div>
              )}
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-description">{plan.description}</p>
              <div className="plan-price">
                <span className="price">
                  {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="period">
                  {plan.monthlyPrice === 'Custom' ? '' : `/${isYearly ? 'year' : 'month'}`}
                </span>
              </div>
              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <span className="feature-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <motion.button
                className="plan-cta"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
