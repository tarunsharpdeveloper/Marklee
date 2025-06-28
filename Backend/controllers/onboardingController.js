import UserMetadata from '../models/UserMetadata.js';
import UserOnboarding from '../models/UserOnboarding.js';

class OnboardingController {
  submitOnboarding = async (req, res) => {
    try {
      const metadata = await UserMetadata.create({
      userId: req.user.id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: metadata
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({
      message: 'Failed to complete onboarding',
      error: error.message
    });
    }
  }

  getOnboardingData = async (req, res) => {
    try {
      const metadata = await UserMetadata.findByUserId(req.user.id);
      
    if (!metadata) {
      return res.status(404).json({
        message: 'Onboarding data not found'
      });
    }

    res.status(200).json({
      data: metadata
    });
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    res.status(500).json({
      message: 'Failed to fetch onboarding data',
      error: error.message
    });
    }
  }

  createOnboardingUser = async (req, res) => {
    try {
      const user = await UserOnboarding.create({
        userId: req.user.id,
        ...req.body
      });
      res.status(201).json({
        success: true,
        message: 'Onboarding user created successfully',
        data: user
      });
    } catch (error) {
      console.error('Error creating onboarding user:', error);  
      res.status(500).json({
        message: 'Failed to create onboarding user',
        error: error.message
      });
    }
  }
}

export default new OnboardingController(); 