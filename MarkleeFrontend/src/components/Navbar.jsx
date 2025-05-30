import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './styles/Navbar.css';
import GetStarted from './GetStarted';

const Navbar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <nav className="nav">
        <div className="container" >
         
           <img className='logo' src="src/assets/MarkleeLogoTP.png" alt="" />
         
          <div className="nav-links">
            <motion.a
              className="nav-link"
              href="#About"
              whileHover={{ scale: 1.05 }}
            >
              About
            </motion.a>
            {/* <motion.a
              className="nav-link"
              href="#solutions"
              whileHover={{ scale: 1.05 }}
            >
              Solutions
            </motion.a> */}
            <motion.a
              className="nav-link"
              href="#pricing"
              whileHover={{ scale: 1.05 }}
            >
              Pricing
            </motion.a>
            <motion.a
              className="nav-link"
              href="#features"
              whileHover={{ scale: 1.05 }}
            >
              features
            </motion.a>
            <motion.a
              className="nav-link"
              href="#faq"
              whileHover={{ scale: 1.05 }}
            >
              FAQ
            </motion.a>
            <motion.button
              className="action-button"
              onClick={() => setIsModalOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login
            </motion.button>
          </div>
        </div>
      </nav>

      <GetStarted 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default Navbar; 