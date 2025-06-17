import {pool as db} from '../config/database.js';


const BriefQuestion = {
    create: async (data) => {
        const [result] = await db.query('INSERT INTO brief_questions (question, ai_key, input_field_name, placeholder) VALUES (?, ?, ?, ?)', [data.question, data.ai_key, data.input_field_name, data.placeholder]);
        return result.insertId;
    },
    findAll: async () => {
        const [results] = await db.query('SELECT * FROM brief_questions');
        return results;
    },
    delete: async (id) => {
        const [result] = await db.query('DELETE FROM brief_questions WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

export default BriefQuestion;
