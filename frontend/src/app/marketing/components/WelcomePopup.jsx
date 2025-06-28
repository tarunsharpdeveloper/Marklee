'use client';
import styles from '../styles/WelcomePopup.module.css';

const WelcomePopup = ({ welcomeMessage, onGetStarted }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.popup}>
                <div className={styles.content}>
                    <h2 className={styles.title}>
                        Marketing Strategy Generator
                    </h2>
                    <p className={styles.message}>
                        {welcomeMessage}
                    </p>
                    <button
                        onClick={onGetStarted}
                        className={styles.button}
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomePopup; 