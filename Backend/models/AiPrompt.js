import {pool as db} from '../config/database.js';

const AiPrompt = {
    create: async (data) => {
        const { prompt_for_id, prompt } = data;
        const query = `INSERT INTO ai_prompts (prompt_for_id, prompt) VALUES ($1, $2)`;
        const result = await db.query(query, [prompt_for_id, prompt]);
        return result.rows[0];
    },
    findAll: async () => {
        const query = `SELECT * FROM ai_prompts`;
        const result = await db.query(query);
        return result.rows;
    },
    delete: async (id) => {
        const query = `DELETE FROM ai_prompts WHERE id = $1`;
        const result = await db.query(query, [id]);
        return result.rows[0];
    },
    getPromptFor: async (prompt_for_id) => {
        const query = `SELECT * FROM ai_prompts WHERE prompt_for_id = $1`;
        const result = await db.query(query, [prompt_for_id]);
        return result.rows[0];
    },
    getAllPromptsType: async () => {
        const query = `SELECT * FROM ai_prompts_type`;
        const result = await db.query(query);
        return result.rows;
    }
}

export default AiPrompt;