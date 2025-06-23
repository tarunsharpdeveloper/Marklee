import { pool as db } from "../config/database.js";

class AiPrompt {
    static async create(data) {
        const { prompt_for_id, prompt } = data;
        const query = `INSERT INTO ai_prompts (prompt_for_id, prompt) VALUES (?, ?)`;
        const [result] = await db.execute(query, [prompt_for_id, prompt]);
        return result;
    }
    static async findAll() {
        const query = `SELECT * FROM ai_prompts`;
        const [result] = await db.execute(query);
        return result;
    }
    static async delete(id) {
        const query = `DELETE FROM ai_prompts WHERE id = ?`;
        const [result] = await db.execute(query, [id]);
        return result;
    }
    static async getPromptFor(prompt_for_id) {
        const query = `SELECT * FROM ai_prompts WHERE prompt_for_id = ?`;
        const [result] = await db.execute(query, [prompt_for_id]);
        return result;
    }
    static async getAllPromptsType() {
        const query = `SELECT * FROM ai_prompts_type`;
        const [result] = await db.execute(query);
        return result;
    }
    static async deleteAll() {
        const query = `DELETE FROM ai_prompts`;
        const [result] = await db.execute(query);
        return result;
    }
}

export default AiPrompt;  
