import React from 'react';
import './styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              Marklee
            </a>
            <p className="footer-description">
              Transform your business with AI-powered insights and data-driven strategies.
              Join thousands of companies already growing with Marklee.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link">in</a>
              <a href="#" className="social-link">𝕏</a>
              <a href="#" className="social-link">f</a>
            </div>
          </div>
          
          <div className="footer-links">
            <h3>Product</h3>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#demo">Request Demo</a></li>
              <li><a href="#customers">Customers</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h3>Company</h3>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#press">Press</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h3>Resources</h3>
            <ul>
              <li><a href="#support">Support</a></li>
              <li><a href="#documentation">Documentation</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Marklee. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 