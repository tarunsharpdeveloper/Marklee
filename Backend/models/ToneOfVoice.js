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

    // Deprecated: static marketing archetypes removed in favor of AI-generated
}

export default ToneOfVoice; 