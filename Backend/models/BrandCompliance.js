import { pool as db } from '../config/database.js';

class BrandCompliance {
    static async create(complianceData) {
        try {
            const [result] = await db.execute(
                'INSERT INTO brand_compliance (brand_id, forbidden_words, required_phrases, disclaimers, compliance_docs_url, do_list, dont_list, enforce_compliance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    complianceData.brandId,
                    complianceData.forbiddenWords,
                    complianceData.requiredPhrases,
                    complianceData.disclaimers,
                    complianceData.complianceDocsUrl || null,
                    complianceData.doList,
                    complianceData.dontList,
                    complianceData.enforceCompliance !== undefined ? complianceData.enforceCompliance : true
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating brand compliance:', error);
            throw error;
        }
    }

    static async findByBrandId(brandId) {
        try {
            const [rows] = await db.execute('SELECT * FROM brand_compliance WHERE brand_id = ?', [brandId]);
            return rows[0]; // Return the first (and should be only) compliance record for a brand
        } catch (error) {
            console.error('Error fetching brand compliance by brand ID:', error);
            throw error;
        }
    }

    static async update(brandId, updateData) {
        try {
            const [result] = await db.execute(
                'UPDATE brand_compliance SET forbidden_words = ?, required_phrases = ?, disclaimers = ?, compliance_docs_url = ?, do_list = ?, dont_list = ?, enforce_compliance = ?, updated_at = CURRENT_TIMESTAMP WHERE brand_id = ?',
                [
                    updateData.forbiddenWords,
                    updateData.requiredPhrases,
                    updateData.disclaimers,
                    updateData.complianceDocsUrl || null,
                    updateData.doList,
                    updateData.dontList,
                    updateData.enforceCompliance !== undefined ? updateData.enforceCompliance : true,
                    brandId
                ]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating brand compliance:', error);
            throw error;
        }
    }

    static async delete(brandId) {
        try {
            const [result] = await db.execute('DELETE FROM brand_compliance WHERE brand_id = ?', [brandId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting brand compliance:', error);
            throw error;
        }
    }

    // Get predefined compliance presets based on industry
    static getCompliancePresets(industry) {
        const presets = {
            'healthcare': {
                name: 'Healthcare Compliance',
                forbiddenWords: ['cure', 'heal', 'treat', 'diagnose', 'medical advice'],
                requiredPhrases: ['Consult your healthcare provider', 'This is not medical advice'],
                disclaimers: 'This information is for educational purposes only and should not replace professional medical advice.',
                doList: [
                    'Use evidence-based language',
                    'Include appropriate disclaimers',
                    'Reference credible sources',
                    'Emphasize consultation with professionals'
                ],
                dontList: [
                    'Make medical claims',
                    'Promise specific outcomes',
                    'Provide diagnostic advice',
                    'Use absolute terms'
                ]
            },
            'finance': {
                name: 'Financial Services Compliance',
                forbiddenWords: ['guarantee', 'promise', 'risk-free', 'always profitable'],
                requiredPhrases: ['Past performance does not guarantee future results', 'Investment involves risk'],
                disclaimers: 'Investment products are subject to market risk. Please read all scheme related documents carefully.',
                doList: [
                    'Include risk disclosures',
                    'Use qualified language',
                    'Reference regulatory requirements',
                    'Emphasize due diligence'
                ],
                dontList: [
                    'Make performance guarantees',
                    'Promise specific returns',
                    'Use absolute terms',
                    'Omit risk warnings'
                ]
            },
            'legal': {
                name: 'Legal Services Compliance',
                forbiddenWords: ['guarantee', 'promise', 'always win', 'certain victory'],
                requiredPhrases: ['Results may vary', 'Each case is unique'],
                disclaimers: 'This information is for general purposes only and does not constitute legal advice.',
                doList: [
                    'Use qualified language',
                    'Include appropriate disclaimers',
                    'Emphasize case-by-case basis',
                    'Reference legal requirements'
                ],
                dontList: [
                    'Guarantee outcomes',
                    'Promise specific results',
                    'Provide legal advice',
                    'Use absolute terms'
                ]
            },
            'education': {
                name: 'Education Compliance',
                forbiddenWords: ['guarantee', 'promise', 'always succeed', '100% pass rate'],
                requiredPhrases: ['Individual results may vary', 'Success depends on effort'],
                disclaimers: 'Educational outcomes depend on individual effort and circumstances.',
                doList: [
                    'Use qualified language',
                    'Emphasize individual effort',
                    'Include realistic expectations',
                    'Reference educational standards'
                ],
                dontList: [
                    'Guarantee specific outcomes',
                    'Promise success rates',
                    'Use absolute terms',
                    'Omit effort requirements'
                ]
            },
            'general': {
                name: 'General Business Compliance',
                forbiddenWords: ['guarantee', 'promise', 'always', 'never', 'best'],
                requiredPhrases: ['Results may vary', 'Individual experiences differ'],
                disclaimers: 'Results may vary based on individual circumstances and effort.',
                doList: [
                    'Use qualified language',
                    'Include appropriate disclaimers',
                    'Emphasize individual factors',
                    'Be honest and transparent'
                ],
                dontList: [
                    'Make absolute claims',
                    'Promise specific outcomes',
                    'Use superlatives without qualification',
                    'Omit important disclaimers'
                ]
            }
        };

        // Return industry-specific preset or general preset
        return presets[industry.toLowerCase()] || presets.general;
    }

    // Validate content against compliance rules
    static validateContent(content, compliance) {
        if (!compliance || !compliance.enforce_compliance) {
            return { isValid: true, violations: [] };
        }

        const violations = [];
        const contentLower = content.toLowerCase();

        // Check forbidden words
        if (compliance.forbidden_words) {
            const forbiddenWords = compliance.forbidden_words.split(',').map(word => word.trim().toLowerCase());
            forbiddenWords.forEach(word => {
                if (contentLower.includes(word)) {
                    violations.push(`Contains forbidden word: "${word}"`);
                }
            });
        }

        // Check required phrases (warning only)
        if (compliance.required_phrases) {
            const requiredPhrases = compliance.required_phrases.split(',').map(phrase => phrase.trim().toLowerCase());
            const missingPhrases = requiredPhrases.filter(phrase => !contentLower.includes(phrase));
            if (missingPhrases.length > 0) {
                violations.push(`Missing required phrases: ${missingPhrases.join(', ')}`);
            }
        }

        return {
            isValid: violations.length === 0,
            violations
        };
    }
}

export default BrandCompliance; 