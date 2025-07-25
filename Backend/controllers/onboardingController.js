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
      const { projectId } = req.query;
      console.log('getOnboardingData - projectId:', projectId);
      
      const metadata = await UserOnboarding.findByUserIdAndProject(req.user.id, projectId);
      
      console.log('getOnboardingData - metadata:', metadata);
      
      if (!metadata || !metadata.data) {
        return res.status(404).json({
          message: 'Onboarding data not found'
        });
      }

      // Parse the stored data
      let allData;
      try {
        allData = JSON.parse(metadata.data);
      } catch (parseError) {
        console.error('Error parsing onboarding data:', parseError);
        return res.status(500).json({
          message: 'Error parsing onboarding data'
        });
      }

      // Return project-specific data if projectId is provided
      if (projectId && allData[`project_${projectId}`]) {
        console.log(`Found project-specific data for project_${projectId}:`, allData[`project_${projectId}`]);
        return res.status(200).json({
          data: {
            ...metadata,
            data: JSON.stringify(allData[`project_${projectId}`])
          }
        });
      } else if (projectId) {
        console.log(`No project-specific data found for project_${projectId}`);
        console.log('Available keys in allData:', Object.keys(allData));
      }

      // Return general data if no projectId or project not found
      if (allData.general) {
        return res.status(200).json({
          data: {
            ...metadata,
            data: JSON.stringify(allData.general)
          }
        });
      }

      // Return all data if no specific project requested
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
      const { data, coreMessage, projectId } = req.body;
      console.log('=== ONBOARDING CREATE/UPDATE REQUEST ===');
      console.log('User ID:', req.user.id);
      console.log('Project ID:', projectId);
      console.log('Data received:', data);
      console.log('Core message:', coreMessage);
      
      // Check if we already have data for this user and project
      let existingOnboarding = null;
      if (projectId) {
        existingOnboarding = await UserOnboarding.findByUserIdAndProject(req.user.id, projectId);
        console.log('Existing onboarding for project:', existingOnboarding ? 'Found' : 'Not found');
      }
      
      // If project-specific data exists, merge with existing data
      let dataToStore = data;
      if (existingOnboarding && existingOnboarding.data && projectId) {
        try {
          const existingData = JSON.parse(existingOnboarding.data);
          const newData = typeof data === 'string' ? JSON.parse(data) : data;
          
          console.log('🔍 Existing data:', existingData);
          console.log('🔍 New data:', newData);
          console.log('🔍 Existing form answers:', existingData.formAnswers);
          console.log('🔍 New form answers:', newData.formAnswers);
          
          // For now, let's just use the new data directly instead of merging
          // This ensures the latest form answers are always used
          dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
          console.log('🔍 Using new data directly (no merge) for project:', projectId);
          
        } catch (parseError) {
          console.log('Could not parse existing data, using new data only');
          dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
        }
      } else {
        // No existing data, use new data as is
        dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
      }
      
      console.log('Final data to store length:', dataToStore.length);
      
      // Use the new updateProjectData method for better control
      const user = await UserOnboarding.updateProjectData(
        req.user.id,
        projectId || null,
        dataToStore,
        coreMessage
      );
      
      console.log('User onboarding created/updated successfully:', {
        id: user.id,
        userId: user.userId,
        projectId: projectId,
        dataLength: user.data ? user.data.length : 0
      });
      
      res.status(201).json({
        success: true,
        message: existingOnboarding ? 'Onboarding data updated successfully' : 'Onboarding user created successfully',
        data: user
      });
    } catch (error) {
      console.error('Error creating/updating onboarding user:', error);  
      res.status(500).json({
        message: 'Failed to create/update onboarding user',
        error: error.message
      });
    }
  }

  updateOnboardingData = async (req, res) => {
    try {
      const { data } = req.body;
      console.log('Updating onboarding data for user:', req.user.id);
      console.log('Data to update:', data);
      console.log('Data type:', typeof data);
      console.log('Data stringified:', JSON.stringify(data));
      
      // Check if data is already a string or needs to be stringified
      const dataToStore = typeof data === 'string' ? data : JSON.stringify(data);
      
      const user = await UserOnboarding.create({
        userId: req.user.id,
        data: dataToStore,
        coreMessage: null // Keep existing core message
      });
      
      res.status(200).json({
        success: true,
        message: 'Onboarding data updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Error updating onboarding data:', error);  
      res.status(500).json({
        message: 'Failed to update onboarding data',
        error: error.message
      });
    }
  }

  updateCoreMessage = async (req, res) => {
    try {
      const { coreMessage, projectId } = req.body;
      
      if (projectId) {
        // Update core message for specific project
        const success = await UserOnboarding.updateProjectCoreMessage(req.user.id, projectId, coreMessage);
        if (success) {
          res.status(200).json({
            success: true,
            message: 'Project core message updated successfully'
          });
        } else {
          res.status(404).json({
            success: false,
            message: 'Project not found'
          });
        }
      } else {
        // Update general core message (backward compatibility)
        await UserOnboarding.updateCoreMessage(req.user.id, coreMessage);
        res.status(200).json({
          success: true,
          message: 'Core message updated successfully'
        });
      }
    } catch (error) {
      console.error('Error updating core message:', error);
      res.status(500).json({
        message: 'Failed to update core message',
        error: error.message
      });
    }
  }

  markCoreMessageSeen = async (req, res) => {
    try {
      await UserOnboarding.markCoreMessageSeen(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Core message marked as seen'
      });
    } catch (error) {
      console.error('Error marking core message as seen:', error);
      res.status(500).json({
        message: 'Failed to mark core message as seen',
        error: error.message
      });
    }
  }

  getCurrentFormStep = async (req, res) => {
    try {
      const { projectId } = req.query;
      console.log('getCurrentFormStep - projectId:', projectId);
      
      if (!projectId) {
        return res.status(400).json({
          message: 'Project ID is required'
        });
      }

      const currentStep = await UserOnboarding.getCurrentFormStep(req.user.id, projectId);
      
      console.log('getCurrentFormStep - currentStep:', currentStep);
      
      res.status(200).json({
        success: true,
        data: {
          currentStep
        }
      });
    } catch (error) {
      console.error('Error getting current form step:', error);
      res.status(500).json({
        message: 'Failed to get current form step',
        error: error.message
      });
    }
  }

  updateCurrentFormStep = async (req, res) => {
    try {
      const { projectId, currentStep } = req.body;
      console.log('updateCurrentFormStep - projectId:', projectId);
      console.log('updateCurrentFormStep - currentStep:', currentStep);
      
      if (!projectId || !currentStep) {
        return res.status(400).json({
          message: 'Project ID and current step are required'
        });
      }

      const success = await UserOnboarding.updateCurrentFormStep(req.user.id, projectId, currentStep);
      
      console.log('updateCurrentFormStep - success:', success);
      
      res.status(200).json({
        success: true,
        message: 'Current form step updated successfully',
        data: {
          currentStep
        }
      });
    } catch (error) {
      console.error('Error updating current form step:', error);
      res.status(500).json({
        message: 'Failed to update current form step',
        error: error.message
      });
    }
  }
}

export default new OnboardingController(); 