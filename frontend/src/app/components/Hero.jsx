'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/Hero.module.css';
import { Typewriter } from 'react-simple-typewriter';
import { Signup } from './Signup';
import { Login } from './Login';

const Hero = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // or a loading state
  }

  return (
    <>
      <div className={styles.hero_wrapper} id="hero">
        <section className={styles.hero_section}>
          <div className={`${styles.gradient_orb} ${styles.top_right}`} />
          <div className={`${styles.gradient_orb} ${styles.bottom_left}`} />
          <div className={styles.container}>
            <div className={styles.content}>
              <motion.div
                className={styles.overline}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                AI-Powered Platform
              </motion.div>

              <motion.h1
                className={styles.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Typewriter
                  words={['Transform Your Business Strategy with AI Intelligence']}
                  loop={true}
                  cursor
                  cursorStyle=""
                  typeSpeed={70}
                  deleteSpeed={50}
                  delaySpeed={2000}
                />
              </motion.h1>

              <motion.p
                className={styles.description}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Leverage advanced AI technology to develop comprehensive strategies, 
                gain actionable insights, and make data-driven decisions that drive 
                your business forward.
              </motion.p>
              <motion.div
                className={styles.button_group}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <motion.button
                  className={styles.primary_button}
                  onClick={() => setIsSignupModalOpen(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Free Trial
                </motion.button>
                <motion.a
                  className={styles.secondary_button}
                  href="#learn-more"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Learn More
                </motion.a>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      {/* About Section */}
      <section id="About" className={styles.about_section}>
        <div className={styles.about_container}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={styles.about_content}
          >
            <h2 className={styles.about_title}>About Marklee</h2>
            <p className={styles.about_description}>
              Marklee is an innovative AI-powered platform designed to revolutionize how businesses approach marketing strategy. 
              Our cutting-edge technology combines artificial intelligence with deep marketing insights to help you create 
              compelling content, identify target audiences, and develop data-driven strategies that drive real results.
            </p>
            <div className={styles.about_grid}>
              <div className={styles.about_card}>
                <h3>AI-Powered Insights</h3>
                <p>Advanced algorithms analyze market trends and consumer behavior to provide actionable insights.</p>
              </div>
              <div className={styles.about_card}>
                <h3>Content Generation</h3>
                <p>Create compelling marketing copy, social media posts, and campaign materials with AI assistance.</p>
              </div>
              <div className={styles.about_card}>
                <h3>Audience Targeting</h3>
                <p>Identify and segment your target audience with precision using intelligent data analysis.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={styles.pricing_section}>
        <div className={styles.pricing_container}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={styles.pricing_content}
          >
            <h2 className={styles.pricing_title}>Simple Pricing</h2>
            <p className={styles.pricing_description}>
              Choose the plan that best fits your business needs. Start with our free trial and upgrade as you grow.
            </p>
            <div className={styles.pricing_grid}>
              <div className={styles.pricing_card}>
                <div className={styles.pricing_header}>
                  <h3>Starter</h3>
                  <div className={styles.price}>
                    <span className={styles.currency}>$</span>
                    <span className={styles.amount}>29</span>
                    <span className={styles.period}>/month</span>
                  </div>
                </div>
                <ul className={styles.pricing_features}>
                  <li>Basic content generation</li>
                  <li>Up to 5 projects</li>
                  <li>Standard support</li>
                  <li>Basic analytics</li>
                </ul>
                <motion.button
                  className={styles.pricing_button}
                  onClick={() => setIsSignupModalOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
              </div>

              <div className={`${styles.pricing_card} ${styles.featured}`}>
                <div className={styles.featured_badge}>Most Popular</div>
                <div className={styles.pricing_header}>
                  <h3>Professional</h3>
                  <div className={styles.price}>
                    <span className={styles.currency}>$</span>
                    <span className={styles.amount}>79</span>
                    <span className={styles.period}>/month</span>
                  </div>
                </div>
                <ul className={styles.pricing_features}>
                  <li>Advanced AI features</li>
                  <li>Unlimited projects</li>
                  <li>Priority support</li>
                  <li>Advanced analytics</li>
                  <li>Custom integrations</li>
                </ul>
                <motion.button
                  className={styles.pricing_button}
                  onClick={() => setIsSignupModalOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started
                </motion.button>
              </div>

              <div className={styles.pricing_card}>
                <div className={styles.pricing_header}>
                  <h3>Enterprise</h3>
                  <div className={styles.price}>
                    <span className={styles.currency}>$</span>
                    <span className={styles.amount}>199</span>
                    <span className={styles.period}>/month</span>
                  </div>
                </div>
                <ul className={styles.pricing_features}>
                  <li>All Professional features</li>
                  <li>Custom AI training</li>
                  <li>Dedicated support</li>
                  <li>White-label options</li>
                  <li>API access</li>
                </ul>
                <motion.button
                  className={styles.pricing_button}
                  onClick={() => setIsSignupModalOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Contact Sales
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features_section}>
        <div className={styles.features_container}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={styles.features_content}
          >
            <h2 className={styles.features_title}>Powerful Features</h2>
            <p className={styles.features_description}>
              Discover the advanced capabilities that make Marklee the ultimate AI-powered marketing platform.
            </p>
            <div className={styles.features_grid}>
              <div className={styles.feature_card}>
                <div className={styles.feature_icon}>🚀</div>
                <div className={styles.feature_content}>
                  <h3>Smart Content Creation</h3>
                  <p>Generate engaging marketing content tailored to your brand voice and target audience with AI assistance.</p>
                </div>
              </div>

              <div className={styles.feature_card}>
                <div className={styles.feature_icon}>🎯</div>
                <div className={styles.feature_content}>
                  <h3>Audience Segmentation</h3>
                  <p>Identify and analyze different audience segments for targeted marketing campaigns with precision.</p>
                </div>
              </div>

              <div className={styles.feature_card}>
                <div className={styles.feature_icon}>📊</div>
                <div className={styles.feature_content}>
                  <h3>Performance Analytics</h3>
                  <p>Track and measure the effectiveness of your marketing strategies with detailed analytics and insights.</p>
                </div>
              </div>

              <div className={styles.feature_card}>
                <div className={styles.feature_icon}>⚡</div>
                <div className={styles.feature_content}>
                  <h3>Real-time Optimization</h3>
                  <p>Continuously optimize your campaigns based on real-time data and AI recommendations.</p>
                </div>
              </div>

              <div className={styles.feature_card}>
                <div className={styles.feature_icon}>🤖</div>
                <div className={styles.feature_content}>
                  <h3>AI-Powered Insights</h3>
                  <p>Get intelligent recommendations and insights to improve your marketing performance.</p>
                </div>
              </div>

              <div className={styles.feature_card}>
                <div className={styles.feature_icon}>🔗</div>
                <div className={styles.feature_content}>
                  <h3>Seamless Integrations</h3>
                  <p>Connect with your favorite tools and platforms for a unified marketing experience.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className={styles.faq_section}>
        <div className={styles.faq_container}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className={styles.faq_content}
          >
            <h2 className={styles.faq_title}>Frequently Asked Questions</h2>
            <p className={styles.faq_description}>
              Find answers to common questions about Marklee and how it can transform your marketing strategy.
            </p>
            <div className={styles.faq_list}>
              <div className={styles.faq_item}>
                <div className={styles.faq_question}>
                  <h3>How does the AI content generation work?</h3>
                  <span className={styles.faq_icon}>+</span>
                </div>
                <div className={styles.faq_answer}>
                  <p>Our AI analyzes your brand, target audience, and marketing goals to generate personalized content that resonates with your audience and drives engagement. The system learns from your preferences and improves over time.</p>
                </div>
              </div>

              <div className={styles.faq_item}>
                <div className={styles.faq_question}>
                  <h3>Can I customize the generated content?</h3>
                  <span className={styles.faq_icon}>+</span>
                </div>
                <div className={styles.faq_answer}>
                  <p>Absolutely! All AI-generated content can be fully customized to match your brand voice, style, and specific requirements. You have complete control over the final output.</p>
                </div>
              </div>

              <div className={styles.faq_item}>
                <div className={styles.faq_question}>
                  <h3>What types of content can I create?</h3>
                  <span className={styles.faq_icon}>+</span>
                </div>
                <div className={styles.faq_answer}>
                  <p>You can create social media posts, email campaigns, website copy, ad copy, blog posts, and more. Our platform supports various content formats and adapts to your needs.</p>
                </div>
              </div>

              <div className={styles.faq_item}>
                <div className={styles.faq_question}>
                  <h3>Is there a free trial available?</h3>
                  <span className={styles.faq_icon}>+</span>
                </div>
                <div className={styles.faq_answer}>
                  <p>Yes! We offer a comprehensive free trial so you can explore all features and see how Marklee can transform your marketing strategy before committing to a plan.</p>
                </div>
              </div>

              <div className={styles.faq_item}>
                <div className={styles.faq_question}>
                  <h3>How secure is my data?</h3>
                  <span className={styles.faq_icon}>+</span>
                </div>
                <div className={styles.faq_answer}>
                  <p>We take data security seriously. All your data is encrypted, and we follow industry best practices to ensure your information is protected. Your privacy is our top priority.</p>
                </div>
              </div>

              <div className={styles.faq_item}>
                <div className={styles.faq_question}>
                  <h3>Can I cancel my subscription anytime?</h3>
                  <span className={styles.faq_icon}>+</span>
                </div>
                <div className={styles.faq_answer}>
                  <p>Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. We believe in providing flexibility to our users.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Signup 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)} 
        hideBackButton={true}
        onShowLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <Login 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
};

export default Hero; 