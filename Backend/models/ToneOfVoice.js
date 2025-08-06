import { pool as db } from '../config/database.js';

class ToneOfVoice {
    static async create(toneData) {
        try {
            const [result] = await db.execute(
                'INSERT INTO tone_of_voice (brand_id, archetype, key_traits, examples, tips, guidelines) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    toneData.brandId,
                    toneData.archetype,
                    toneData.keyTraits,
                    toneData.examples,
                    toneData.tips,
                    toneData.guidelines
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating tone of voice:', error);
            throw error;
        }
    }

    static async findByBrandId(brandId) {
        try {
            const [rows] = await db.execute('SELECT * FROM tone_of_voice WHERE brand_id = ?', [brandId]);
            return rows[0]; // Return the first (and should be only) tone of voice for a brand
        } catch (error) {
            console.error('Error fetching tone of voice by brand ID:', error);
            throw error;
        }
    }

    static async update(brandId, updateData) {
        try {
            const [result] = await db.execute(
                'UPDATE tone_of_voice SET archetype = ?, key_traits = ?, examples = ?, tips = ?, guidelines = ?, updated_at = CURRENT_TIMESTAMP WHERE brand_id = ?',
                [
                    updateData.archetype,
                    updateData.keyTraits,
                    updateData.examples,
                    updateData.tips,
                    updateData.guidelines,
                    brandId
                ]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating tone of voice:', error);
            throw error;
        }
    }

    static async delete(brandId) {
        try {
            const [result] = await db.execute('DELETE FROM tone_of_voice WHERE brand_id = ?', [brandId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting tone of voice:', error);
            throw error;
        }
    }

    // Get predefined marketing archetypes
    static getMarketingArchetypes() {
        return [
            {
                id: 'the_hero',
                name: 'The Hero',
                description: 'Bold, courageous, and inspiring. Focuses on overcoming challenges and achieving greatness.',
                traits: ['Bold', 'Courageous', 'Inspiring', 'Determined', 'Confident'],
                examples: ['Nike', 'Under Armour', 'Red Bull'],
                tips: 'Use action-oriented language, emphasize transformation and achievement'
            },
            {
                id: 'the_sage',
                name: 'The Sage',
                description: 'Wise, knowledgeable, and trustworthy. Provides expertise and guidance.',
                traits: ['Wise', 'Knowledgeable', 'Trustworthy', 'Analytical', 'Expert'],
                examples: ['Harvard Business Review', 'McKinsey', 'MIT'],
                tips: 'Use data-driven language, emphasize expertise and credibility'
            },
            {
                id: 'the_innocent',
                name: 'The Innocent',
                description: 'Pure, optimistic, and simple. Emphasizes goodness and happiness.',
                traits: ['Pure', 'Optimistic', 'Simple', 'Honest', 'Wholesome'],
                examples: ['Dove', 'Innocent Drinks', 'Toms'],
                tips: 'Use simple, positive language, emphasize goodness and authenticity'
            },
            {
                id: 'the_explorer',
                name: 'The Explorer',
                description: 'Adventurous, ambitious, and independent. Seeks discovery and new experiences.',
                traits: ['Adventurous', 'Ambitious', 'Independent', 'Curious', 'Free-spirited'],
                examples: ['Patagonia', 'GoPro', 'Airbnb'],
                tips: 'Use discovery language, emphasize freedom and new possibilities'
            },
            {
                id: 'the_creator',
                name: 'The Creator',
                description: 'Innovative, artistic, and imaginative. Focuses on creation and self-expression.',
                traits: ['Innovative', 'Artistic', 'Imaginative', 'Expressive', 'Visionary'],
                examples: ['Apple', 'Adobe', 'Pinterest'],
                tips: 'Use creative language, emphasize innovation and self-expression'
            },
            {
                id: 'the_caregiver',
                name: 'The Caregiver',
                description: 'Nurturing, compassionate, and protective. Emphasizes care and support.',
                traits: ['Nurturing', 'Compassionate', 'Protective', 'Supportive', 'Caring'],
                examples: ['Johnson & Johnson', 'UNICEF', 'Hospice'],
                tips: 'Use caring language, emphasize support and protection'
            },
            {
                id: 'the_rebel',
                name: 'The Rebel',
                description: 'Revolutionary, disruptive, and challenging. Questions the status quo.',
                traits: ['Revolutionary', 'Disruptive', 'Challenging', 'Bold', 'Unconventional'],
                examples: ['Virgin', 'Harley-Davidson', 'Diesel'],
                tips: 'Use bold, challenging language, emphasize disruption and change'
            },
            {
                id: 'the_magician',
                name: 'The Magician',
                description: 'Transformative, visionary, and powerful. Creates change and transformation.',
                traits: ['Transformative', 'Visionary', 'Powerful', 'Mysterious', 'Influential'],
                examples: ['Tesla', 'Disney', 'Coca-Cola'],
                tips: 'Use transformative language, emphasize change and possibility'
            },
            {
                id: 'the_regular_guy',
                name: 'The Regular Guy',
                description: 'Relatable, down-to-earth, and authentic. Emphasizes commonality and realism.',
                traits: ['Relatable', 'Down-to-earth', 'Authentic', 'Honest', 'Everyday'],
                examples: ['Dove', 'IKEA', 'Walmart'],
                tips: 'Use everyday language, emphasize relatability and authenticity'
            },
            {
                id: 'the_lover',
                name: 'The Lover',
                description: 'Passionate, intimate, and romantic. Emphasizes connection and desire.',
                traits: ['Passionate', 'Intimate', 'Romantic', 'Sensual', 'Emotional'],
                examples: ['Victoria\'s Secret', 'Godiva', 'Tiffany & Co.'],
                tips: 'Use passionate language, emphasize connection and desire'
            },
            {
                id: 'the_jester',
                name: 'The Jester',
                description: 'Fun, playful, and entertaining. Brings joy and humor.',
                traits: ['Fun', 'Playful', 'Entertaining', 'Humorous', 'Light-hearted'],
                examples: ['Old Spice', 'Skittles', 'Geico'],
                tips: 'Use playful language, emphasize fun and entertainment'
            },
            {
                id: 'the_ruler',
                name: 'The Ruler',
                description: 'Authoritative, prestigious, and commanding. Emphasizes leadership and control.',
                traits: ['Authoritative', 'Prestigious', 'Commanding', 'Confident', 'Powerful'],
                examples: ['Rolex', 'Mercedes-Benz', 'American Express'],
                tips: 'Use authoritative language, emphasize leadership and excellence'
            }
        ];
    }
}

export default ToneOfVoice; 