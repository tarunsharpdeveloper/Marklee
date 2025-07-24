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
      console.log('=== ONBOARDING CREATE REQUEST ===');
      console.log('User ID:', req.user.id);
      console.log('Project ID:', projectId);
      console.log('Data received:', data);
      console.log('Data type:', typeof data);
      console.log('Data length:', data ? data.length : 0);
      console.log('Core message:', coreMessage);
      
      // Get existing onboarding data
      let existingData = {};
      const existingOnboarding = await UserOnboarding.findByUserId(req.user.id);
      
      if (existingOnboarding && existingOnboarding.data) {
        try {
          existingData = JSON.parse(existingOnboarding.data);
        } catch (parseError) {
          console.log('Could not parse existing data, starting fresh');
          existingData = {};
        }
      }
      
      // Parse the new data
      const newProjectData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Add/update project-specific data
      if (projectId) {
        existingData[`project_${projectId}`] = newProjectData;
      } else {
        // For backward compatibility, store general data
        existingData.general = newProjectData;
      }
      
      // Stringify the combined data
      const dataToStore = JSON.stringify(existingData);
      console.log('Combined data to store:', dataToStore);
      console.log('Data to store length:', dataToStore.length);
      
      const user = await UserOnboarding.create({
        userId: req.user.id,
        projectId: projectId || null,
        data: dataToStore,
        coreMessage
      });
      
      console.log('User onboarding created successfully:', {
        id: user.id,
        userId: user.userId,
        projectId: projectId,
        dataLength: user.data ? user.data.length : 0
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
      const { coreMessage } = req.body;
      await UserOnboarding.updateCoreMessage(req.user.id, coreMessage);
      res.status(200).json({
        success: true,
        message: 'Core message updated successfully'
      });
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
}

export default new OnboardingController(); 