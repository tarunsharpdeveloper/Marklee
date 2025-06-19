import {pool as db} from '../config/database.js';


class BriefQuestion {
    create = async (data) => {
        const [result] = await db.query('INSERT INTO brief_questions (title, question, input_field_name, placeholder) VALUES (?, ?, ?, ?)', [data.title, data.question, data.input_field_name, data.placeholder]);
        return result.insertId;
    }
    findAll = async () => {
        const [results] = await db.query('SELECT * FROM brief_questions');
        return results;
    }
    delete = async (id) => {
        const [result] = await db.query('DELETE FROM brief_questions WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

export default new BriefQuestion();
