import { pool as db } from '../config/database.js';

class BrandAudience {
    static async create(audienceData) {
        try {
            const [result] = await db.execute(
                'INSERT INTO brand_audiences (brand_id, audience_name, audience_description, audience_type) VALUES (?, ?, ?, ?)',
                [
                    audienceData.brandId,
                    audienceData.audienceName,
                    audienceData.audienceDescription,
                    audienceData.audienceType || null
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating brand audience:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.execute('SELECT * FROM brand_audiences WHERE id = ?', [id]);
            return rows[0];
        } catch (error) {
            console.error('Error fetching brand audience by ID:', error);
            throw error;
        }
    }

    static async findByBrandId(brandId) {
        try {
            const [rows] = await db.execute('SELECT * FROM brand_audiences WHERE brand_id = ? ORDER BY created_at DESC', [brandId]);
            return rows;
        } catch (error) {
            console.error('Error fetching brand audiences by brand ID:', error);
            throw error;
        }
    }

    static async update(id, updateData) {
        try {
            const [result] = await db.execute(
                'UPDATE brand_audiences SET audience_name = ?, audience_description = ?, audience_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [
                    updateData.audienceName,
                    updateData.audienceDescription,
                    updateData.audienceType || null,
                    id
                ]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating brand audience:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const [result] = await db.execute('DELETE FROM brand_audiences WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting brand audience:', error);
            throw error;
        }
    }

    static async deleteByBrandId(brandId) {
        try {
            const [result] = await db.execute('DELETE FROM brand_audiences WHERE brand_id = ?', [brandId]);
            return result.affectedRows;
        } catch (error) {
            console.error('Error deleting brand audiences by brand ID:', error);
            throw error;
        }
    }

    // Get suggested audience types based on industry
    static getSuggestedAudienceTypes(industry) {
        const suggestions = {
            'technology': [
                'Tech Professionals',
                'Early Adopters',
                'Small Business Owners',
                'Enterprise Decision Makers',
                'Digital Nomads',
                'Startup Founders'
            ],
            'healthcare': [
                'Healthcare Professionals',
                'Patients',
                'Caregivers',
                'Healthcare Administrators',
                'Medical Researchers',
                'Health-conscious Consumers'
            ],
            'finance': [
                'Individual Investors',
                'Small Business Owners',
                'Financial Advisors',
                'Retirees',
                'Young Professionals',
                'High Net Worth Individuals'
            ],
            'education': [
                'Students',
                'Parents',
                'Educators',
                'School Administrators',
                'Corporate Trainers',
                'Lifelong Learners'
            ],
            'retail': [
                'Online Shoppers',
                'Brick-and-Mortar Shoppers',
                'Luxury Consumers',
                'Budget-conscious Shoppers',
                'Fashion Enthusiasts',
                'Convenience Seekers'
            ],
            'food': [
                'Food Enthusiasts',
                'Health-conscious Consumers',
                'Busy Professionals',
                'Families',
                'Restaurant Owners',
                'Food Bloggers'
            ],
            'fitness': [
                'Fitness Enthusiasts',
                'Beginners',
                'Athletes',
                'Health-conscious Individuals',
                'Busy Professionals',
                'Seniors'
            ],
            'travel': [
                'Business Travelers',
                'Leisure Travelers',
                'Adventure Seekers',
                'Luxury Travelers',
                'Budget Travelers',
                'Digital Nomads'
            ],
            'real_estate': [
                'First-time Homebuyers',
                'Real Estate Investors',
                'Property Managers',
                'Real Estate Agents',
                'Renters',
                'Commercial Property Owners'
            ],
            'automotive': [
                'Car Enthusiasts',
                'First-time Car Buyers',
                'Luxury Car Buyers',
                'Electric Vehicle Enthusiasts',
                'Fleet Managers',
                'Car Dealers'
            ],
            'general': [
                'General Consumers',
                'Business Professionals',
                'Small Business Owners',
                'Entrepreneurs',
                'Students',
                'Retirees'
            ]
        };

        return suggestions[industry.toLowerCase()] || suggestions.general;
    }

    // Generate AI-suggested audiences based on brand information
    static async generateSuggestedAudiences(brandInfo) {
        // This would typically call an AI service
        // For now, return based on industry
        const industry = brandInfo.industry || 'general';
        const suggestedTypes = this.getSuggestedAudienceTypes(industry);
        
        return suggestedTypes.slice(0, 5).map((type, index) => ({
            id: `suggested_${index}`,
            audienceName: type,
            audienceDescription: `AI-suggested audience type for ${brandInfo.brandName} in the ${industry} industry.`,
            audienceType: 'suggested',
            isSuggested: true
        }));
    }
}

export default BrandAudience; 