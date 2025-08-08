import Brand from '../models/Brand.js';
import ToneOfVoice from '../models/ToneOfVoice.js';
import BrandCompliance from '../models/BrandCompliance.js';
import BrandAudience from '../models/BrandAudience.js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { StateGraph, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';

// Check if OpenAI API key is set
console.log('=== ENVIRONMENT CHECK ===');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Available env vars with OPENAI:', Object.keys(process.env).filter(key => key.includes('OPENAI')));

if (!process.env.OPENAI_API_KEY) {
    console.error('WARNING: OPENAI_API_KEY is not set in environment variables');
    console.error('This will cause AI features to use fallback responses');
}

const chatModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY
});

// In-memory workflow state management
class WorkflowStateManager {
    constructor() {
        this.workflows = new Map();
    }

    initializeWorkflow(workflowId, initialState) {
        this.workflows.set(workflowId, {
            ...initialState,
            createdAt: Date.now(),
            lastUpdated: Date.now()
        });
    }

    getWorkflowState(workflowId) {
        const state = this.workflows.get(workflowId);
        console.log(`Getting workflow state for ${workflowId}:`, !!state);
        if (!state) {
            console.log('Available workflow IDs:', Array.from(this.workflows.keys()));
        }
        return state;
    }

    updateWorkflowState(workflowId, updates) {
        const currentState = this.workflows.get(workflowId);
        if (currentState) {
            this.workflows.set(workflowId, {
                ...currentState,
                ...updates,
                lastUpdated: Date.now()
            });
        }
    }

    deleteWorkflowState(workflowId) {
        this.workflows.delete(workflowId);
    }

    cleanupOldWorkflows() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [workflowId, state] of this.workflows.entries()) {
            if (state.lastUpdated < oneHourAgo) {
                this.workflows.delete(workflowId);
            }
        }
    }
}

const workflowStateManager = new WorkflowStateManager();

// Cleanup old workflows every hour
setInterval(() => {
    workflowStateManager.cleanupOldWorkflows();
}, 60 * 60 * 1000);

// LangGraph State Schema
const brandCreationState = {
    brandData: null,
    discoveryAnswers: [],
    currentDiscoveryStep: 0,
    discoveryComplete: false,
    toneAnalysis: null,
    audienceSegments: [],
    complianceGuidelines: [],
    workflowPhase: 'discovery', // discovery, tone, audience, compliance, complete
    progress: 0
};

// Brand Creation Agents
class BrandCreationAgents {
    // Discovery Agent - Handles brand personality identification
    static async discoveryAgent(state) {
        console.log('=== DISCOVERY AGENT CALLED ===');
        const { brandData, discoveryAnswers, currentDiscoveryStep } = state;
        
        console.log('Discovery agent called with state:', {
            discoveryAnswersLength: discoveryAnswers.length,
            currentDiscoveryStep,
            brandData: brandData.brandName
        });
        
        // Initialize the chat model
        const chatModel = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY
        });
        
        // Initialize questionData variable at function level
        let questionData;
        
        // If no discovery answers yet, generate initial question
        if (discoveryAnswers.length === 0) {
            // Check if we have the API key
            if (!process.env.OPENAI_API_KEY) {
                console.log('No OpenAI API key found, using fallback question');
                const questionData = {
                    question: "How would you describe your brand's personality in 3-5 words?",
                    suggestions: [
                        "Friendly and approachable",
                        "Professional and trustworthy", 
                        "Innovative and bold",
                        "Reliable and consistent"
                    ]
                };
                
                // Update workflow state with fallback data
                const fallbackState = {
                    ...state,
                    currentDiscoveryStep: 1,
                    nextQuestion: questionData.question,
                    suggestions: questionData.suggestions,
                    isComplete: false,
                    workflowPhase: 'discovery'
                };
                
                console.log('Returning fallback state:', fallbackState);
                return fallbackState;
            }

            // Generate initial question using the traditional controller's better prompt
            const initialQuestionPrompt = `Based on the following brand information, generate a thoughtful question to help identify the brand's personality and tone of voice. The question should be designed to uncover the brand's core personality traits.

Brand Information:
- Name: ${brandData.brandName}
- Industry: ${brandData.industry}
- Description: ${brandData.shortDescription}

Generate a question along with 3-4 suggested answer options that users can choose from. The question should be conversational and encourage detailed responses. 

Format your response as JSON with this structure:
{
    "question": "Your question here?",
    "suggestions": [
        "Suggestion 1",
        "Suggestion 2", 
        "Suggestion 3",
        "Suggestion 4"
    ]
}



Make sure the suggestions are relevant to the brand's industry and help guide the user toward understanding their brand personality.`;

            console.log('Calling AI model with prompt:', initialQuestionPrompt);
            console.log('Chat model configuration:', {
                modelName: chatModel.modelName,
                temperature: chatModel.temperature,
                hasApiKey: !!process.env.OPENAI_API_KEY
            });
            
            try {
                console.log('Invoking AI model...');
                const response = await chatModel.invoke(initialQuestionPrompt);
                console.log('AI model response received:', response.content.substring(0, 200) + '...');
                
                try {
                    let cleanContent = response.content.trim();
                    if (cleanContent.startsWith('```json')) {
                        cleanContent = cleanContent.replace(/^```json\s*/, '');
                    }
                    if (cleanContent.startsWith('```')) {
                        cleanContent = cleanContent.replace(/^```\s*/, '');
                    }
                    if (cleanContent.endsWith('```')) {
                        cleanContent = cleanContent.replace(/\s*```$/, '');
                    }
                    
                    questionData = JSON.parse(cleanContent);
                    console.log('Successfully parsed AI response:', questionData);
                } catch (parseError) {
                    console.error('Error parsing AI response:', parseError);
                    console.error('Raw AI response:', response.content);
                    
                    // Fallback to a default question if parsing fails
                    questionData = {
                        question: "How would you describe your brand's personality in 3-5 words?",
                        suggestions: [
                            "Friendly and approachable",
                            "Professional and trustworthy", 
                            "Innovative and bold",
                            "Reliable and consistent"
                        ]
                    };
                }
            } catch (aiError) {
                console.error('Error calling AI model:', aiError);
                console.error('AI Error details:', {
                    message: aiError.message,
                    name: aiError.name,
                    stack: aiError.stack
                });
                
                // Fallback to a default question if AI fails
                questionData = {
                    question: "How would you describe your brand's personality in 3-5 words?",
                    suggestions: [
                        "Friendly and approachable",
                        "Professional and trustworthy", 
                        "Innovative and bold",
                        "Reliable and consistent"
                    ]
                };
            }
            
            console.log('Final questionData before return:', questionData);

            return {
                ...state,
                currentDiscoveryStep: 1,
                nextQuestion: questionData.question,
                suggestions: questionData.suggestions || [],
                isComplete: false,
                workflowPhase: 'discovery'
            };
        } else {
            // Process user answer and generate next question
            const lastAnswer = discoveryAnswers[discoveryAnswers.length - 1];
            
            // Check if we have enough answers (4 questions as per user request)
            if (discoveryAnswers.length >= 4) {
                console.log('Discovery phase completed after 4 questions, moving to tone analysis');
                console.log('Discovery answers count:', discoveryAnswers.length);
                console.log('Discovery answers:', discoveryAnswers);
                const completionState = {
                    ...state,
                    discoveryComplete: true,
                    workflowPhase: 'tone',
                    isComplete: true,
                    nextQuestion: null
                };
                console.log('Returning completion state:', completionState);
                return completionState;
            }
            
            // Check if we have the API key for contextual questions
            if (!process.env.OPENAI_API_KEY) {
                console.log('No OpenAI API key found, using fallback contextual question');
                const questionData = {
                    question: "What tone do you use when addressing customer concerns?",
                    suggestions: [
                        "Empathetic and understanding",
                        "Professional and solution-focused",
                        "Friendly and reassuring",
                        "Direct and efficient"
                    ]
                };
                
                // Update workflow state with fallback data
                const fallbackState = {
                    ...state,
                    currentDiscoveryStep: currentDiscoveryStep + 1,
                    nextQuestion: questionData.question,
                    suggestions: questionData.suggestions,
                    isComplete: false,
                    workflowPhase: 'discovery'
                };
                
                console.log('Returning fallback contextual state:', fallbackState);
                return fallbackState;
            }
            
            // Generate contextual question using the traditional controller's better prompt
            const contextualQuestionPrompt = `Based on the following brand information and previous answers, generate the next question to help identify the brand's personality and tone of voice.
               
Brand Information:
- Name: ${brandData.brandName}
- Industry: ${brandData.industry}
- Description: ${brandData.shortDescription}

Previous Questions and Answers:
${discoveryAnswers.map((qa, index) => `Q${index + 1}: ${qa.question} | A${index + 1}: ${qa.answer}`).join('\n')}

PREVIOUS QUESTIONS ASKED (DO NOT repeat any of these):
${discoveryAnswers.map((qa, index) => `${index + 1}. ${qa.question}`).join('\n')}

Current Step: ${currentDiscoveryStep + 1} of 4

Generate a thoughtful, contextual question that builds upon the previous answers and helps uncover different aspects of the brand's personality. 

CRITICAL REQUIREMENTS:
1. DO NOT repeat any of the already asked questions listed above
2. The new question must be completely different from all previously asked questions
3. The question should be:
   - Relevant to the brand's industry and previous responses
   - Designed to uncover personality traits not yet explored
   - Conversational and encouraging detailed responses
   - Focused on understanding the brand's communication style, values, or emotional impact
   - Completely unique and different from the already asked questions

Also provide 3-4 suggested answer options that users can choose from, based on the context of previous answers and the brand's industry.

Format your response as JSON with this structure:
{
    "question": "Your contextual question here?",
    "suggestions": [
        "Suggestion 1",
        "Suggestion 2", 
        "Suggestion 3",
        "Suggestion 4"
    ]
}

Examples of contextual questions with suggestions:
- Question: "How does your brand want to be perceived by competitors?"
  Suggestions: ["As an industry leader", "As an innovative challenger", "As a trusted expert", "As a reliable partner"]

- Question: "What tone do you use when addressing customer concerns?"
  Suggestions: ["Empathetic and understanding", "Professional and solution-focused", "Friendly and reassuring", "Direct and efficient"]

Make sure the suggestions are contextual to the previous answers and help guide the user toward a comprehensive understanding of their brand personality.`;

            console.log('Generating contextual question for step:', currentDiscoveryStep + 1);
            console.log('Previous Q&A pairs:', discoveryAnswers);
            try {
                const response = await chatModel.invoke(contextualQuestionPrompt);
                console.log('AI response for contextual question:', response.content);
                
                // Use the same questionData variable declared at function level
                try {
                    let cleanContent = response.content.trim();
                    if (cleanContent.startsWith('```json')) {
                        cleanContent = cleanContent.replace(/^```json\s*/, '');
                    }
                    if (cleanContent.startsWith('```')) {
                        cleanContent = cleanContent.replace(/^```\s*/, '');
                    }
                    if (cleanContent.endsWith('```')) {
                        cleanContent = cleanContent.replace(/\s*```$/, '');
                    }
                    
                    questionData = JSON.parse(cleanContent);
                    console.log('Parsed contextual question data:', questionData);
                    
                    // Check if the generated question is already in previous questions
                    const previousQuestions = discoveryAnswers.map(qa => qa.question);
                    if (previousQuestions.includes(questionData.question)) {
                        console.log('AI generated a repeated question:', questionData.question);
                        console.log('Previous questions so far:', previousQuestions);
                        console.log('Using fallback question');
                        
                        // List of fallback questions to choose from (4 questions)
                        const fallbackQuestions = [
                            "What tone do you use when addressing customer concerns?",
                            "How does your brand want to be perceived by competitors?",
                            "What emotions do you want your brand to evoke in your customers?",
                            "How would you describe your brand's communication style?"
                        ];
                        
                        // Find a question that hasn't been asked yet
                        const availableQuestion = fallbackQuestions.find(q => !previousQuestions.includes(q));
                        
                        questionData = {
                            question: availableQuestion || "What tone do you use when addressing customer concerns?",
                            suggestions: [
                                "Empathetic and understanding",
                                "Professional and solution-focused",
                                "Friendly and reassuring",
                                "Direct and efficient"
                            ]
                        };
                    }
                } catch (parseError) {
                    console.error('Error parsing contextual question response:', parseError);
                    console.error('Raw contextual question response:', response.content);
                    
                    // Fallback to a default contextual question if parsing fails
                    questionData = {
                        question: "What tone do you use when addressing customer concerns?",
                        suggestions: [
                            "Empathetic and understanding",
                            "Professional and solution-focused",
                            "Friendly and reassuring",
                            "Direct and efficient"
                        ]
                    };
                }
            } catch (aiError) {
                console.error('Error calling AI model for contextual question:', aiError);
                console.error('AI Error details for contextual question:', {
                    message: aiError.message,
                    name: aiError.name,
                    stack: aiError.stack
                });
                
                // Fallback to a default contextual question if AI fails
                questionData = {
                    question: "What tone do you use when addressing customer concerns?",
                    suggestions: [
                        "Empathetic and understanding",
                        "Professional and solution-focused",
                        "Friendly and reassuring",
                        "Direct and efficient"
                    ]
                };
            }
            
            console.log('Final contextual questionData before return:', questionData);

            return {
                ...state,
                currentDiscoveryStep: currentDiscoveryStep + 1,
                nextQuestion: questionData.question,
                suggestions: questionData.suggestions || [],
                isComplete: false,
                workflowPhase: 'discovery'
            };
        }
    }

    // Tone Agent - Generates comprehensive tone of voice profile using traditional controller's better prompt
    static async toneAgent(state) {
        const { brandData, discoveryAnswers } = state;
        
        // Initialize the chat model
        const chatModel = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY
        });
        
        const toneAnalysisPrompt = `BRAND - Create archetype - STEPS
Help the user identify ${brandData.brandName}’s tone of voice by asking the user a series of questions that will help identify the brand’s personality from the 12 brand archetypes. Inform the user what you’re doing. Give them a few prompts (one at a time) that they can answer for you to get a clearer picture of what ${brandData.brandName}’s personality is. Once you have all the information you need about the Brand’s personality, help identify one or more (up to 3) brand archetypes that align with that personality. Base your suggestions on the user’s responses. Suggest the most fitting brand tone of voice from the 12 brand archetypes of marketing. Explain why this tone matches.
Help the user lock in their brand archetypes. Once they’ve done so, create a brand tone of voice from that or those archetypes for them.
Notes: Once chosen, tone guides voice and phrasing across all content.

Additional context to use (already collected from the chat):
- Brand Name: ${brandData.brandName}
- Industry: ${brandData.industry}
- Description: ${brandData.shortDescription}
- Discovery Answers (chronological):
${discoveryAnswers.map((qa, index) => {
    if (typeof qa === 'object' && qa.answer) {
        return `Q${index + 1}: ${qa.question || '(question)'} | A${index + 1}: ${qa.answer}`;
    } else {
        return `A${index + 1}: ${qa}`;
    }
}).join('\n')}

Constraints for names:
- Each archetype name must be exactly TWO WORDS, user‑friendly, and plain English
- Do NOT start with "The"
- Do NOT use these canonical archetype words: hero, caregiver, explorer, sage, innocent, outlaw, magician, ruler, lover, jester, creator, everyman


Return JSON ONLY in this structure (decide purely from the context above):
{
  "archetypes": ["Name 1", "Name 2", "Name 3"],
  "explanation": "1–2 sentences explaining why these archetypes match the answers",
  "toneOfVoice": {
    "communicationStyle": "string: how the brand sounds"
  }
}`;

        console.log('Generating tone of voice for brand:', brandData.brandName);
        console.log('Discovery answers for tone analysis:', discoveryAnswers);
        
        // Initialize response variable outside try block
        let response;
        
        try {
            response = await chatModel.invoke(toneAnalysisPrompt);
            console.log('AI response for tone generation:', response.content);
        } catch (aiError) {
            console.error('Error calling AI model for tone analysis:', aiError);
            console.error('AI Error details for tone analysis:', {
                message: aiError.message,
                name: aiError.name,
                stack: aiError.stack
            });
            throw aiError;
        }
        
        let toneData;
        try {
            let cleanContent = response.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/^```json\s*/, '');
            }
            if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/^```\s*/, '');
            }
            if (cleanContent.endsWith('```')) {
                cleanContent = cleanContent.replace(/\s*```$/, '');
            }
            
            toneData = JSON.parse(cleanContent);
            console.log('Parsed tone data:', toneData);
            console.log('Archetypes in parsed data:', toneData.archetypes);
            console.log('ToneOfVoice in parsed data:', toneData.toneOfVoice);
            
            // Validate and ensure all toneOfVoice fields are strings
            if (toneData.toneOfVoice) {
                const requiredFields = ['keyTraits', 'communicationStyle', 'examples', 'guidelines'];
                requiredFields.forEach(field => {
                    if (toneData.toneOfVoice[field] && typeof toneData.toneOfVoice[field] !== 'string') {
                        console.log(`Converting ${field} from ${typeof toneData.toneOfVoice[field]} to string`);
                        toneData.toneOfVoice[field] = JSON.stringify(toneData.toneOfVoice[field]);
                    }
                });
            }
            // Ensure explanation is a non-empty string
            if (!toneData.explanation || typeof toneData.explanation !== 'string') {
                const joined = Array.isArray(toneData.archetypes) ? toneData.archetypes.join(', ') : 'the chosen archetypes';
                toneData.explanation = `Selected based on your answers; ${joined} best reflect the personality cues you provided.`;
            }

            // Normalize archetype labels to exactly two words for UI clarity
            if (Array.isArray(toneData.archetypes)) {
                const toTitleCase = (s) => s.replace(/\s+/g, ' ').trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                const canonicalToDescriptive = {
                    'hero': 'Bold Achiever',
                    'the hero': 'Bold Achiever',
                    'caregiver': 'Caring Partner',
                    'the caregiver': 'Caring Partner',
                    'explorer': 'Curious Pathfinder',
                    'the explorer': 'Curious Pathfinder',
                    'sage': 'Trusted Guide',
                    'the sage': 'Trusted Guide',
                    'innocent': 'Honest Optimist',
                    'the innocent': 'Honest Optimist',
                    'outlaw': 'Bold Rebel',
                    'the outlaw': 'Bold Rebel',
                    'magician': 'Visionary Transformer',
                    'the magician': 'Visionary Transformer',
                    'ruler': 'Confident Leader',
                    'the ruler': 'Confident Leader',
                    'lover': 'Passionate Connector',
                    'the lover': 'Passionate Connector',
                    'jester': 'Playful Entertainer',
                    'the jester': 'Playful Entertainer',
                    'creator': 'Imaginative Maker',
                    'the creator': 'Imaginative Maker',
                    'everyman': 'Everyday Friend',
                    'the everyman': 'Everyday Friend'
                };
                const normalize = (label) => {
                    if (!label) return label;
                    let s = String(label).replace(/[\/_-]+/g, ' ').replace(/\s+/g, ' ').trim();
                    // Drop leading 'The'
                    s = s.replace(/^the\s+/i, '').trim();
                    // Map canonical names to descriptive two-word labels
                    const lower = s.toLowerCase();
                    if (canonicalToDescriptive[lower]) return canonicalToDescriptive[lower];
                    const parts = s.split(' ');
                    // If longer than 2 words, keep the first two as a clean title
                    if (parts.length > 2) {
                        return toTitleCase(`${parts[0]} ${parts[1]}`);
                    }
                    // If exactly two words, just title case
                    if (parts.length === 2) {
                        return toTitleCase(`${parts[0]} ${parts[1]}`);
                    }
                    // If only one word and not canonical, attempt to create a descriptive two-word phrase by adding a neutral second word
                    if (parts.length === 1) {
                        return toTitleCase(`${parts[0]} Voice`);
                    }
                    return toTitleCase(s);
                };
                toneData.archetypes = toneData.archetypes
                    .filter(a => !!a)
                    .map(normalize)
                    .slice(0, 3);
            }

            // Sanitize toneOfVoice to only include communicationStyle
            const communication = (toneData && toneData.toneOfVoice && typeof toneData.toneOfVoice.communicationStyle === 'string' && toneData.toneOfVoice.communicationStyle.trim())
                ? toneData.toneOfVoice.communicationStyle.trim()
                : 'Clear and direct';
            toneData.toneOfVoice = { communicationStyle: communication };
        } catch (parseError) {
            console.error('Error parsing tone response:', parseError);
            console.error('Raw tone response:', response.content);
            
            // Fallback to default tone data if parsing fails
            toneData = {
                archetypes: ["The Innocent", "The Sage"],
                toneOfVoice: {
                    keyTraits: "Professional and trustworthy",
                    communicationStyle: "Clear and direct",
                    examples: "We deliver reliable solutions",
                    guidelines: "Maintain a professional tone while being approachable"
                },
                explanation: "Selected for emphasis on trust, clarity, and supportive communication."
            };
            console.log('Using fallback tone data:', toneData);
            
            // Ensure all fields are strings in fallback data too
            if (toneData.toneOfVoice) {
                const requiredFields = ['keyTraits', 'communicationStyle', 'examples', 'guidelines'];
                requiredFields.forEach(field => {
                    if (toneData.toneOfVoice[field] && typeof toneData.toneOfVoice[field] !== 'string') {
                        console.log(`Converting fallback ${field} from ${typeof toneData.toneOfVoice[field]} to string`);
                        toneData.toneOfVoice[field] = JSON.stringify(toneData.toneOfVoice[field]);
                    }
                });
            }
        }

        console.log('Sending complete response with archetypes:', toneData.archetypes);
        console.log('Sending complete response with toneOfVoice:', toneData.toneOfVoice);
        console.log('Archetypes type:', typeof toneData.archetypes);
        console.log('Archetypes is array:', Array.isArray(toneData.archetypes));

        return {
            ...state,
            archetypes: toneData.archetypes,
            toneOfVoice: toneData.toneOfVoice,
            explanation: toneData.explanation,
            workflowPhase: 'tone',
            isComplete: true
        };
    }

    // Audience Agent - Generates target audience segments using traditional controller's better prompt
    static async audienceAgent(state) {
        const { brandData, toneAnalysis } = state;
        
        const audiencePrompt = `Based on the following brand information, suggest 3-5 target audience segments:

Brand Name: ${brandData.brandName}
Industry: ${brandData.industry}
Description: ${brandData.shortDescription}

Tone Analysis:
${JSON.stringify(toneAnalysis, null, 2)}

For each audience segment, provide:
1. Audience name
2. Description
3. Key characteristics
4. Why they would be interested in this brand

Format as JSON array with fields: name, description, characteristics, interest`;

        const response = await chatModel.invoke(audiencePrompt);
        let audienceData;
        
        try {
            let cleanContent = response.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/^```json\s*/, '');
            }
            if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/^```\s*/, '');
            }
            if (cleanContent.endsWith('```')) {
                cleanContent = cleanContent.replace(/\s*```$/, '');
            }
            
            audienceData = JSON.parse(cleanContent);
        } catch (parseError) {
            audienceData = [
                {
                    name: "Primary Target",
                    description: "Core audience segment",
                    characteristics: "Career-focused professionals",
                    interest: "Quality and reliability"
                }
            ];
        }

        return {
            ...state,
            audienceSegments: audienceData,
            workflowPhase: 'compliance',
            isComplete: false
        };
    }

    // Target Audience Generation Agent - Generates broad audience categories
    static async targetAudienceAgent(state) {
        const { brandData } = state;
        
        // Initialize the chat model
        const chatModel = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY
        });
        
        const targetAudiencePrompt = `Based on the following brand details, suggest 3–6 broad audience categories this brand might serve. 
The suggestions should be general (e.g. 'parents of toddlers', 'entry-level investors', 'mid-sized company HR teams'). 
The suggestions should apply to Brand Industry: ${brandData.industry}

Brand Information:
- Name: ${brandData.brandName}
- Industry: ${brandData.industry}
- Description: ${brandData.shortDescription}

IMPORTANT: Respond ONLY with a valid JSON array. Do not include any explanatory text before or after the JSON.

Generate 3-6 audience categories as a JSON array of strings. Each string should be a clear, specific audience category.

Example format:
[
  "parents of toddlers",
  "entry-level investors", 
  "mid-sized company HR teams",
  "small business owners",
  "freelance professionals"
]

Respond with ONLY the JSON array, no other text.`;

        let targetAudienceData;
        
        try {
            const response = await chatModel.invoke(targetAudiencePrompt);
            let cleanContent = response.content.trim();
            console.log('Raw target audience response:', cleanContent);

            // Try to extract JSON from various formats
            let jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                cleanContent = jsonMatch[0];
            }

            // Remove markdown code blocks
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/^```json\s*/, '');
            }
            if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/^```\s*/, '');
            }
            if (cleanContent.endsWith('```')) {
                cleanContent = cleanContent.replace(/\s*```$/, '');
            }

            // Try to fix common JSON issues
            cleanContent = cleanContent.replace(/,\s*]/g, ']'); // Remove trailing commas

            console.log('Cleaned content for parsing:', cleanContent);

            targetAudienceData = JSON.parse(cleanContent);
            console.log('Successfully parsed target audience data:', targetAudienceData);
        } catch (parseError) {
            console.error('Error parsing target audience response:', parseError);
            console.error('Raw target audience response:', response?.content);

            // Fallback to default target audience data if parsing fails
            targetAudienceData = [
                "small business owners",
                "freelance professionals", 
                "startup founders",
                "mid-level managers",
                "entrepreneurs"
            ];
            console.log('Using fallback target audience data due to parsing error:', targetAudienceData);
        }

        return {
            ...state,
            targetAudienceCategories: targetAudienceData,
            isComplete: true
        };
    }

    // Compliance Agent - Generates compliance requirements using improved prompt
    static async complianceAgent(state) {
        const { brandData, toneAnalysis } = state;
        
        // Initialize the chat model
        const chatModel = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0.7,
            openAIApiKey: process.env.OPENAI_API_KEY
        });
        
        const compliancePrompt = `Generate industry-specific compliance rules for ${brandData.industry} industry.

Brand Information:
- Name: ${brandData.brandName}
- Industry: ${brandData.industry}
- Description: ${brandData.shortDescription}

Tone Analysis:
${JSON.stringify(toneAnalysis, null, 2)}

IMPORTANT: Respond ONLY with a valid JSON array. Do not include any explanatory text before or after the JSON.

Generate 3-5 compliance rules based on the brand's industry and characteristics. Each rule should be an object with these exact fields:
- "type": one of "forbidden", "required", "disclaimer", "style"
- "rule": a clear, specific compliance rule
- "enforce": one of "yes", "warn", "no"
- "applies_to": where this rule applies (e.g., "all copy", "marketing materials", "product descriptions")

Example format:
[
  {
    "type": "forbidden",
    "rule": "Do not say 'guaranteed results'",
    "enforce": "yes",
    "applies_to": "all copy"
  },
  {
    "type": "disclaimer",
    "rule": "Include 'trading involves risk'",
    "enforce": "yes",
    "applies_to": "marketing banners, landing pages"
  },
  {
    "type": "style",
    "rule": "Avoid overly salesy tone",
    "enforce": "warn",
    "applies_to": "all copy"
  }
]

Respond with ONLY the JSON array, no other text.`;

        console.log('Generating compliance rules for brand:', brandData.brandName);
        console.log('Brand industry:', brandData.industry);
        
        // Initialize response variable outside try block
        let response;
        
        try {
            response = await chatModel.invoke(compliancePrompt);
            console.log('AI response for compliance generation:', response.content);
        } catch (aiError) {
            console.error('Error calling AI model for compliance:', aiError);
            console.error('AI Error details for compliance:', {
                message: aiError.message,
                name: aiError.name,
                stack: aiError.stack
            });
            
            // Fallback to default compliance data if AI fails
            const fallbackComplianceData = [
                {
                    "type": "forbidden",
                    "rule": "Do not make unsubstantiated claims",
                    "enforce": "yes",
                    "applies_to": "all copy"
                },
                {
                    "type": "disclaimer",
                    "rule": "Include appropriate legal disclaimers",
                    "enforce": "yes",
                    "applies_to": "marketing materials"
                },
                {
                    "type": "style",
                    "rule": "Maintain professional tone",
                    "enforce": "warn",
                    "applies_to": "all copy"
                }
            ];
            
            console.log('Using fallback compliance data due to AI error:', fallbackComplianceData);
            return {
                ...state,
                complianceGuidelines: fallbackComplianceData,
                workflowPhase: 'complete',
                isComplete: true
            };
        }
        
        let complianceData;
        
        try {
            let cleanContent = response.content.trim();
            console.log('Raw AI response:', cleanContent);
            
            // Try to extract JSON from various formats
            let jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                cleanContent = jsonMatch[0];
            }
            
            // Remove markdown code blocks
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/^```json\s*/, '');
            }
            if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/^```\s*/, '');
            }
            if (cleanContent.endsWith('```')) {
                cleanContent = cleanContent.replace(/\s*```$/, '');
            }
            
            // Try to fix common JSON issues
            cleanContent = cleanContent.replace(/,\s*]/g, ']'); // Remove trailing commas
            cleanContent = cleanContent.replace(/,\s*}/g, '}'); // Remove trailing commas in objects
            
            console.log('Cleaned content for parsing:', cleanContent);
            
            complianceData = JSON.parse(cleanContent);
            console.log('Successfully parsed compliance data:', complianceData);
        } catch (parseError) {
            console.error('Error parsing compliance response:', parseError);
            console.error('Raw compliance response:', response.content);
            
            // Try to extract any valid JSON structure from the response
            try {
                // Look for array-like structures in the text
                const arrayMatch = response.content.match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (arrayMatch) {
                    const extractedJson = arrayMatch[0].replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
                    complianceData = JSON.parse(extractedJson);
                    console.log('Successfully extracted and parsed JSON from response:', complianceData);
                } else {
                    throw new Error('No valid JSON array found in response');
                }
            } catch (extractError) {
                console.error('Failed to extract JSON from response:', extractError);
                
                // Fallback to default compliance data if parsing fails
                complianceData = [
                    {
                        "type": "forbidden",
                        "rule": "Do not make unsubstantiated claims",
                        "enforce": "yes",
                        "applies_to": "all copy"
                    },
                    {
                        "type": "disclaimer",
                        "rule": "Include appropriate legal disclaimers",
                        "enforce": "yes",
                        "applies_to": "marketing materials"
                    },
                    {
                        "type": "style",
                        "rule": "Maintain professional tone",
                        "enforce": "warn",
                        "applies_to": "all copy"
                    }
                ];
                console.log('Using fallback compliance data due to parsing error:', complianceData);
            }
        }

        console.log('Final compliance data before return:', complianceData);

        return {
            ...state,
            complianceGuidelines: complianceData,
            workflowPhase: 'complete',
            isComplete: true
        };
    }
}

// Router function to determine next step
function routeWorkflow(state) {
    const { workflowPhase, isComplete } = state;
    
    if (isComplete) {
        return END;
    }
    
    switch (workflowPhase) {
        case 'discovery':
            return "discovery";
        case 'tone':
            return "tone";
        case 'audience':
            return "audience";
        case 'compliance':
            return "compliance";
        default:
            return END;
    }
}

// Create the LangGraph workflow
const createBrandWorkflow = () => {
    try {
        const workflow = new StateGraph({
            channels: brandCreationState
        });

        // Add nodes (agents)
        workflow.addNode("discovery", BrandCreationAgents.discoveryAgent);
        workflow.addNode("tone", BrandCreationAgents.toneAgent);
        workflow.addNode("audience", BrandCreationAgents.audienceAgent);
        workflow.addNode("compliance", BrandCreationAgents.complianceAgent);

        // Add conditional edges
        workflow.addConditionalEdges("discovery", routeWorkflow);
        workflow.addConditionalEdges("tone", routeWorkflow);
        workflow.addConditionalEdges("audience", routeWorkflow);
        workflow.addConditionalEdges("compliance", routeWorkflow);

        return workflow.compile();
    } catch (error) {
        console.error('Error creating brand workflow:', error);
        throw error;
    }
};

// Initialize the workflow lazily
let brandWorkflow = null;
const getBrandWorkflow = () => {
    if (!brandWorkflow) {
        brandWorkflow = createBrandWorkflow();
    }
    return brandWorkflow;
};

class BrandController {
    // Create a new brand
    async createBrand(req, res) {
        try {
            const { brandName, industry, shortDescription, websiteLink } = req.body;
            
            // Validate required fields
            if (!brandName || !industry || !shortDescription) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand name, industry, and short description are required'
                });
            }

            // Check if brand name already exists for this user
            const existingBrand = await Brand.findByName(brandName, req.user.id);
            if (existingBrand) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand name already exists'
                });
            }

            const brandId = await Brand.create({
                userId: req.user.id,
                brandName,
                industry,
                shortDescription,
                websiteLink
            });

            const brand = await Brand.findById(brandId);

            res.status(201).json({
                success: true,
                message: 'Brand created successfully',
                data: brand
            });
        } catch (error) {
            console.error('Error creating brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create brand',
                error: error.message
            });
        }
    }

    // Get all brands for a user with their projects
    async getBrandsWithProjects(req, res) {
        try {
            const brands = await Brand.findWithProjects(req.user.id);
            
            res.status(200).json({
                success: true,
                data: brands
            });
        } catch (error) {
            console.error('Error fetching brands with projects:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brands',
                error: error.message
            });
        }
    }

    // Get a specific brand by ID
    async getBrandById(req, res) {
        try {
            const { id } = req.params;
            const brand = await Brand.findById(id);
            
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            // Check if brand belongs to user
            if (brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            res.status(200).json({
                success: true,
                data: brand
            });
        } catch (error) {
            console.error('Error fetching brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brand',
                error: error.message
            });
        }
    }

    // Update a brand
    async updateBrand(req, res) {
        try {
            const { id } = req.params;
            const { brandName, industry, shortDescription, websiteLink } = req.body;

            const brand = await Brand.findById(id);
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            // Check if brand belongs to user
            if (brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Check if new brand name conflicts with existing brand
            if (brandName && brandName !== brand.brand_name) {
                const existingBrand = await Brand.findByName(brandName, req.user.id);
                if (existingBrand && existingBrand.id !== parseInt(id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Brand name already exists'
                    });
                }
            }

            await Brand.update(id, {
                brandName,
                industry,
                shortDescription,
                websiteLink
            });

                const updatedBrand = await Brand.findById(id);

                res.status(200).json({
                    success: true,
                    message: 'Brand updated successfully',
                    data: updatedBrand
                });
        } catch (error) {
            console.error('Error updating brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update brand',
                error: error.message
            });
        }
    }

    // Delete a brand
    async deleteBrand(req, res) {
        try {
            const { id } = req.params;
            
            const brand = await Brand.findById(id);
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand not found'
                });
            }

            // Check if brand belongs to user
            if (brand.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            await Brand.delete(id);
            
                res.status(200).json({
                    success: true,
                    message: 'Brand deleted successfully'
                });
        } catch (error) {
            console.error('Error deleting brand:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete brand',
                error: error.message
            });
        }
    }

    // Get marketing archetypes
    // Deprecated static archetypes endpoint (kept for backward compatibility but now returns empty array)
    async getMarketingArchetypes(req, res) {
        return res.status(200).json({ success: true, data: [] });
    }

    // LangGraph Workflow Methods

    // Initialize brand workflow
    async initializeBrandWorkflow(req, res) {
        try {
            console.log('=== INITIALIZE BRAND WORKFLOW STARTED ===');
            console.log('Environment check - OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
            console.log('Environment check - OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
            
            const { brandData } = req.body;
            console.log('Received brand data:', brandData);
            
            if (!brandData || !brandData.brandName || !brandData.industry || !brandData.shortDescription) {
                console.log('Missing required brand data');
                return res.status(400).json({
                    success: false,
                    message: 'Brand data is required'
                });
            }

            const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Initialize workflow state
            const initialState = {
                brandData,
                discoveryAnswers: [],
                currentDiscoveryStep: 0,
                discoveryComplete: false,
                toneAnalysis: null,
                audienceSegments: [],
                complianceGuidelines: [],
                workflowPhase: 'discovery',
                progress: 0
            };

            workflowStateManager.initializeWorkflow(workflowId, initialState);

            console.log('Initializing workflow for brand:', brandData.brandName);
            console.log('Initial state:', initialState);
            
            // Directly call the discovery agent for the initial question
            console.log('Calling discovery agent directly for initial question');
            let result;
            try {
                result = await BrandCreationAgents.discoveryAgent({
                    ...initialState,
                    workflowId
                });

                console.log('Initialization result:', result);

                // Update workflow state
                workflowStateManager.updateWorkflowState(workflowId, result);
            } catch (error) {
                console.error('Error calling discovery agent:', error);
                throw new Error(`Failed to initialize discovery agent: ${error.message}`);
            }

            // Ensure we have a question and suggestions
            const nextQuestion = result.nextQuestion || "How would you describe your brand's personality in 3-5 words?";
            const suggestions = result.suggestions || [
                "Friendly and approachable",
                "Professional and trustworthy", 
                "Innovative and bold",
                "Reliable and consistent"
            ];

            console.log('Sending response with workflowId:', workflowId);
            console.log('Sending response with nextQuestion:', nextQuestion);
            console.log('Sending response with suggestions:', suggestions);

            res.status(200).json({
                success: true,
                data: {
                    workflowId,
                    nextQuestion: nextQuestion,
                    suggestions: suggestions,
                    isComplete: result.isComplete || false
                }
            });
        } catch (error) {
            console.error('Error initializing brand workflow:', error);
            console.error('Error stack:', error.stack);
            
            // Send a fallback response if everything fails
            res.status(200).json({
                success: true,
                data: {
                    workflowId: `fallback_${Date.now()}`,
                    nextQuestion: "How would you describe your brand's personality in 3-5 words?",
                    suggestions: [
                        "Friendly and approachable",
                        "Professional and trustworthy", 
                        "Innovative and bold",
                        "Reliable and consistent"
                    ],
                    isComplete: false
                }
            });
        }
    }



    // Process discovery step
    async processDiscoveryStep(req, res) {
        try {
            console.log('=== PROCESS DISCOVERY STEP STARTED ===');
            const { workflowId, userAnswer, currentQuestion } = req.body;
            console.log('Received workflowId:', workflowId);
            console.log('Received userAnswer:', userAnswer);
            console.log('Received currentQuestion:', currentQuestion);
            
            if (!workflowId || !userAnswer) {
                console.log('Missing required parameters');
                return res.status(400).json({
                    success: false,
                    message: 'Workflow ID and user answer are required'
                });
            }

            // Check if this is a fallback workflow or if workflow state is not found
            if (workflowId.startsWith('fallback_') || !workflowStateManager.getWorkflowState(workflowId)) {
                console.log('Processing fallback workflow or missing state:', workflowId);
                
                // Create a simple fallback response (4 questions)
                const fallbackQuestions = [
                    "How would you describe your brand's personality in 3-5 words?",
                    "What tone do you use when addressing customer concerns?",
                    "How does your brand want to be perceived by competitors?",
                    "What emotions do you want your brand to evoke in your customers?"
                ];
                
                const fallbackSuggestions = [
                    ["Friendly and approachable", "Professional and trustworthy", "Innovative and bold", "Reliable and consistent"],
                    ["Empathetic and understanding", "Professional and solution-focused", "Friendly and reassuring", "Direct and efficient"],
                    ["As an industry leader", "As an innovative challenger", "As a trusted expert", "As a reliable partner"],
                    ["Trust and confidence", "Excitement and energy", "Comfort and security", "Inspiration and motivation"]
                ];
                
                // Determine the next question based on the current question
                let nextQuestionIndex = 0;
                for (let i = 0; i < fallbackQuestions.length; i++) {
                    if (fallbackQuestions[i] === currentQuestion) {
                        nextQuestionIndex = i + 1;
                        break;
                    }
                }
                
                // If we've asked all questions (4 questions), complete the discovery
                if (nextQuestionIndex >= 4) {
                    console.log('Fallback discovery completed after 4 questions');
                    return res.status(200).json({
                        success: true,
                        data: {
                            isComplete: true,
                            nextQuestion: null,
                            suggestions: []
                        }
                    });
                }
                
                const nextQuestion = fallbackQuestions[nextQuestionIndex];
                const suggestions = fallbackSuggestions[nextQuestionIndex];
                
                console.log('Sending fallback response with nextQuestion:', nextQuestion);
                console.log('Sending fallback response with suggestions:', suggestions);
                
                return res.status(200).json({
                    success: true,
                    data: {
                        isComplete: false,
                        nextQuestion: nextQuestion,
                        suggestions: suggestions
                    }
                });
            }

            const currentState = workflowStateManager.getWorkflowState(workflowId);
            console.log('Current state found:', !!currentState);

            // Add the answer to discovery answers
            const updatedState = {
                ...currentState,
                discoveryAnswers: [
                    ...currentState.discoveryAnswers,
                    { question: currentQuestion, answer: userAnswer }
                ]
            };

            console.log('Processing discovery step for workflow:', workflowId);
            console.log('Updated state discovery answers length:', updatedState.discoveryAnswers.length);
            console.log('Updated state discovery answers:', updatedState.discoveryAnswers);
            
            // Directly call the discovery agent
            console.log('Calling discovery agent directly for next question');
            const result = await BrandCreationAgents.discoveryAgent({
                ...updatedState,
                workflowId
            });

            console.log('Discovery agent result:', result);

            // Update workflow state
            workflowStateManager.updateWorkflowState(workflowId, result);

            // Ensure we have a question and suggestions
            const nextQuestion = result.nextQuestion || "What emotions do you want your brand to evoke in your customers?";
            const suggestions = result.suggestions || [
                "Trust and confidence",
                "Excitement and energy",
                "Comfort and security",
                "Inspiration and motivation"
            ];
            
            console.log('Sending response with nextQuestion:', nextQuestion);
            console.log('Sending response with suggestions:', suggestions);
            console.log('Sending response with isComplete:', result.isComplete);
            console.log('Sending response with workflowPhase:', result.workflowPhase);
            
            res.status(200).json({
                success: true,
                data: {
                    nextQuestion: nextQuestion,
                    suggestions: suggestions,
                    isComplete: result.isComplete || false,
                    workflowPhase: result.workflowPhase || 'discovery'
                }
            });
        } catch (error) {
            console.error('Error processing discovery step:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Failed to process discovery step',
                error: error.message
            });
        }
    }



    // Process tone analysis
    async processToneAnalysis(req, res) {
        try {
            console.log('=== PROCESS TONE ANALYSIS STARTED ===');
            const { workflowId } = req.body;
            console.log('Received workflowId for tone analysis:', workflowId);
            
            if (!workflowId) {
                return res.status(400).json({
                    success: false,
                    message: 'Workflow ID is required'
                });
            }

            // Check if this is a fallback workflow or if workflow state is not found
            if (workflowId.startsWith('fallback_') || !workflowStateManager.getWorkflowState(workflowId)) {
                console.log('Missing state for tone analysis:', workflowId);
                return res.status(400).json({ success: false, message: 'Tone analysis state not found. Please restart tone discovery.' });
            }

            const currentState = workflowStateManager.getWorkflowState(workflowId);
            console.log('Current state found for tone analysis:', !!currentState);

            // Run the tone agent directly instead of using workflow
            console.log('Calling tone agent directly');
            const result = await BrandCreationAgents.toneAgent({
                ...currentState,
                workflowId
            });

            console.log('Tone agent result:', result);

            // Update workflow state
            workflowStateManager.updateWorkflowState(workflowId, result);

            res.status(200).json({
                success: true,
                data: {
                    archetypes: result.archetypes,
                    toneOfVoice: result.toneOfVoice,
                    explanation: result.explanation,
                    workflowPhase: result.workflowPhase
                }
            });
        } catch (error) {
            console.error('Error processing tone analysis:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process tone analysis',
                error: error.message
            });
        }
    }

    // Process audience generation
    async processAudienceGeneration(req, res) {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return res.status(400).json({
                    success: false,
                    message: 'Workflow ID is required'
                });
            }

            const currentState = workflowStateManager.getWorkflowState(workflowId);
            if (!currentState) {
                return res.status(404).json({
                    success: false,
                    message: 'Workflow not found'
                });
            }

            // Run the audience agent
            const result = await getBrandWorkflow().invoke({
                ...currentState,
                workflowId
            });

            // Update workflow state
            workflowStateManager.updateWorkflowState(workflowId, result);
            
            res.status(200).json({
                success: true,
                data: {
                    audiences: result.audienceSegments,
                    workflowPhase: result.workflowPhase
                }
            });
        } catch (error) {
            console.error('Error processing audience generation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process audience generation',
                error: error.message
            });
        }
    }

    // Process compliance generation
    async processComplianceGeneration(req, res) {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return res.status(400).json({
                    success: false,
                    message: 'Workflow ID is required'
                });
            }

            const currentState = workflowStateManager.getWorkflowState(workflowId);
            if (!currentState) {
                return res.status(404).json({
                    success: false,
                    message: 'Workflow not found'
                });
            }

            // Run the compliance agent directly instead of using workflow
            console.log('Calling compliance agent directly');
            const result = await BrandCreationAgents.complianceAgent({
                ...currentState,
                workflowId
            });

            console.log('Compliance agent result:', result);

            // Update workflow state
            workflowStateManager.updateWorkflowState(workflowId, result);
            
            res.status(200).json({
                success: true,
                data: {
                    compliance: result.complianceGuidelines,
                    workflowPhase: result.workflowPhase,
                    isComplete: result.isComplete
                }
            });
        } catch (error) {
            console.error('Error processing compliance generation:', error);
            console.error('Error stack:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Failed to process compliance generation',
                error: error.message
            });
        }
    }

    // Process target audience generation
    async processTargetAudienceGeneration(req, res) {
        try {
            const { workflowId } = req.body;
            
            if (!workflowId) {
                return res.status(400).json({
                    success: false,
                    message: 'Workflow ID is required'
                });
            }

            const currentState = workflowStateManager.getWorkflowState(workflowId);
            if (!currentState) {
                return res.status(404).json({
                    success: false,
                    message: 'Workflow not found'
                });
            }

            // Run the target audience agent directly
            console.log('Calling target audience agent directly');
            const result = await BrandCreationAgents.targetAudienceAgent({
                ...currentState,
                workflowId
            });

            console.log('Target audience agent result:', result);

            // Update workflow state
            workflowStateManager.updateWorkflowState(workflowId, result);

            res.status(200).json({
                success: true,
                data: {
                    targetAudienceCategories: result.targetAudienceCategories,
                    isComplete: result.isComplete
                }
            });
        } catch (error) {
            console.error('Error processing target audience generation:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process target audience generation',
                error: error.message
            });
        }
    }

    // Get workflow status
    async getWorkflowStatus(req, res) {
        try {
            const { workflowId } = req.params;
            
            const state = workflowStateManager.getWorkflowState(workflowId);
            if (!state) {
                return res.status(404).json({
                    success: false,
                    message: 'Workflow not found'
                });
            }

            const progress = this.calculateProgress(state);
            
            res.status(200).json({
                success: true,
                data: {
                    workflowPhase: state.workflowPhase,
                    progress,
                    discoveryAnswers: state.discoveryAnswers,
                    toneAnalysis: state.toneAnalysis,
                    audienceSegments: state.audienceSegments,
                    complianceGuidelines: state.complianceGuidelines,
                    isComplete: state.isComplete
                }
            });
        } catch (error) {
            console.error('Error getting workflow status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get workflow status',
                error: error.message
            });
        }
    }

    // Calculate workflow progress
    calculateProgress(state) {
        const { workflowPhase, discoveryAnswers } = state;
        
        switch (workflowPhase) {
            case 'discovery':
                return Math.min((discoveryAnswers.length / 4) * 25, 25);
            case 'tone':
                return 25 + 25;
            case 'audience':
                return 50 + 25;
            case 'compliance':
                return 75 + 25;
            case 'complete':
                return 100;
            default:
                return 0;
        }
    }

    // Legacy methods for backward compatibility
    async createToneOfVoice(req, res) {
        try {
            const { brandId, archetypes, guidelines, characteristics, communicationStyle } = req.body;
            
            if (!brandId || !archetypes || !guidelines) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand ID, archetypes, and guidelines are required'
                });
            }

            const toneId = await ToneOfVoice.create({
                brandId,
                archetypes: JSON.stringify(archetypes),
                guidelines,
                characteristics: JSON.stringify(characteristics),
                communicationStyle
            });

            const tone = await ToneOfVoice.findById(toneId);

            res.status(201).json({
                success: true,
                message: 'Tone of voice created successfully',
                data: tone
            });
        } catch (error) {
            console.error('Error creating tone of voice:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create tone of voice',
                error: error.message
            });
        }
    }

    async getToneOfVoice(req, res) {
        try {
            const { brandId } = req.params;
            const tone = await ToneOfVoice.findByBrandId(brandId);
            
            if (!tone) {
                return res.status(404).json({
                    success: false,
                    message: 'Tone of voice not found'
                });
            }

            res.status(200).json({
                success: true,
                data: tone
            });
        } catch (error) {
            console.error('Error fetching tone of voice:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tone of voice',
                error: error.message
            });
        }
    }

    async createBrandCompliance(req, res) {
        try {
            const { brandId, legalRequirements, industryStandards, bestPractices, riskConsiderations } = req.body;
            
            if (!brandId) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand ID is required'
                });
            }

            const complianceId = await BrandCompliance.create({
                brandId,
                legalRequirements: JSON.stringify(legalRequirements),
                industryStandards: JSON.stringify(industryStandards),
                bestPractices: JSON.stringify(bestPractices),
                riskConsiderations: JSON.stringify(riskConsiderations)
            });

            const compliance = await BrandCompliance.findById(complianceId);

            res.status(201).json({
                success: true,
                message: 'Brand compliance created successfully',
                data: compliance
            });
        } catch (error) {
            console.error('Error creating brand compliance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create brand compliance',
                error: error.message
            });
        }
    }

    async getBrandCompliance(req, res) {
        try {
            const { brandId } = req.params;
            const compliance = await BrandCompliance.findByBrandId(brandId);
            
            if (!compliance) {
                return res.status(404).json({
                    success: false,
                    message: 'Brand compliance not found'
                });
            }

            res.status(200).json({
                success: true,
                data: compliance
            });
        } catch (error) {
            console.error('Error fetching brand compliance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brand compliance',
                error: error.message
            });
        }
    }

    async getCompliancePresets(req, res) {
        try {
            const presets = [
                {
                    name: "Healthcare",
                    requirements: ["HIPAA compliance", "Patient data protection", "Medical device regulations"]
                },
                {
                    name: "Finance",
                    requirements: ["PCI DSS", "SOX compliance", "Data encryption standards"]
                },
                {
                    name: "Education",
                    requirements: ["FERPA compliance", "Student data protection", "Accessibility standards"]
                }
            ];

            res.status(200).json({
                success: true,
                data: presets
            });
        } catch (error) {
            console.error('Error fetching compliance presets:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch compliance presets',
                error: error.message
            });
        }
    }

    async getSuggestedAudiences(req, res) {
        try {
            const { brandId } = req.params;
            const audiences = await BrandAudience.findByBrandId(brandId);
            
            res.status(200).json({
                success: true,
                data: audiences
            });
        } catch (error) {
            console.error('Error fetching suggested audiences:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch suggested audiences',
                error: error.message
            });
        }
    }

    async createBrandAudience(req, res) {
        try {
            const { brandId, name, demographics, psychographics, painPoints, motivations, channels } = req.body;
            
            if (!brandId || !name) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand ID and audience name are required'
                });
            }

            const audienceId = await BrandAudience.create({
                brandId,
                name,
                demographics,
                psychographics: JSON.stringify(psychographics),
                painPoints: JSON.stringify(painPoints),
                motivations: JSON.stringify(motivations),
                channels: JSON.stringify(channels)
            });

            const audience = await BrandAudience.findById(audienceId);

            res.status(201).json({
                success: true,
                message: 'Brand audience created successfully',
                data: audience
            });
        } catch (error) {
            console.error('Error creating brand audience:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create brand audience',
                error: error.message
            });
        }
    }

    async getBrandAudiences(req, res) {
        try {
            const { brandId } = req.params;
            const audiences = await BrandAudience.findByBrandId(brandId);
            
            res.status(200).json({
                success: true,
                data: audiences
            });
        } catch (error) {
            console.error('Error fetching brand audiences:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch brand audiences',
                error: error.message
            });
        }
    }

    // Generate a brand Core Message based on brand data, tone, and audience
    async generateCoreMessage(req, res) {
        try {
            const { brandData, toneOfVoice, targetAudience, positioningStatement, extraInputs } = req.body || {};

            if (!brandData || !brandData.brandName || !brandData.industry || !brandData.shortDescription) {
                return res.status(400).json({
                    success: false,
                    message: 'brandData with brandName, industry, shortDescription is required'
                });
            }

            const name = brandData.brandName;
            const description = brandData.shortDescription;
            const industry = brandData.industry;

            const toneGuidelines = toneOfVoice?.guidelines || toneOfVoice?.communicationStyle || '';
            const audienceText = Array.isArray(targetAudience)
                ? targetAudience.join(', ')
                : (typeof targetAudience === 'string' ? targetAudience : '');
            const positioning = positioningStatement || '';
            const other = extraInputs || '';

            const systemPrompt = `You are an expert in marketing and communications strategy.

Use the insights gleaned in the Discovery Questionnaire to research ${name}'s industry and target market.
Take note of who ${name}'s target market is, their aspirations and pain points.
Take note of ${name}'s target market tone of voice and language (casual, formal, conversational, professional, friendly, etc.).

Write a compelling Core Message that describes ${name} and what it does, in a way that appeals to its audience, and in the audience's tone of voice.

STRICT REQUIREMENTS:
- One sentence, ideally 10–20 words, max 25 words
- Clear, not clever; free from jargon; understood in 5 seconds
- Speaks directly to the target market’s needs or identity
- Emotional or aspirational, not dry
- Includes the unique value or promise ${name} offers
- Avoids hyperbole or exaggerated claims`;

            const userPrompt = `Context
- Brand: ${name}
- Industry: ${industry}
- Description: ${description}
- Target audience: ${audienceText || 'N/A'}
- Tone of voice guidance: ${toneGuidelines || 'N/A'}
- Positioning: ${positioning || 'N/A'}
- Other inputs: ${typeof other === 'string' ? other : JSON.stringify(other || {})}

Task
1) Produce ONE Core Message sentence meeting the STRICT REQUIREMENTS.
2) Also propose 3 alternate phrasing suggestions that meet the same constraints.

Return JSON ONLY in this exact structure:
{
  "coreMessage": "...one sentence...",
  "suggestions": ["alt 1", "alt 2", "alt 3"],
  "intro": "Thank the user for their inputs and explain how the Core Message helps (20-40 words). End with a short CTA like 'Ready to get started?'"
}`;

            const response = await chatModel.invoke([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);

            let clean = response.content.trim()
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '');

            let parsed;
            try {
                parsed = JSON.parse(clean);
            } catch (_) {
                // Fallback minimal structure
                parsed = {
                    coreMessage: `${name} empowers its audience with clear, practical value to reach their goals with confidence.`,
                    suggestions: [
                        `Elevate ${name}'s audience with simple, effective solutions that drive meaningful progress.`,
                        `Helping ${name}'s audience achieve more with focused, dependable support that truly matters.`,
                        `${name} helps its audience move forward confidently with clear, results-driven value.`
                    ],
                    intro: `Thanks for sharing your details. Next, we’ll craft a Core Message that guides content and aligns teams. Ready to get started?`
                };
            }

            return res.json({ success: true, data: parsed });
        } catch (error) {
            console.error('Error generating core message:', error);
            return res.status(500).json({ success: false, message: 'Failed to generate core message' });
        }
    }

    // Ask one contextual question to refine the Core Message
    async getCoreMessageContextualQuestion(req, res) {
        try {
            const { brandData, currentMessage, previousQA = [] } = req.body || {};

            if (!brandData || !brandData.brandName) {
                return res.status(400).json({ success: false, message: 'brandData.brandName is required' });
            }

            const name = brandData.brandName;
            const previousQuestions = previousQA.map((qa) => qa.question).join('\n');

            const system = `You help refine a single-sentence Core Message. Ask ONE short, specific question each time.
Rules:
- Do not repeat any previous question
- Keep under 20 words
- Focus on clarity, audience, value, tone, or Call To Action
- No preamble, return only the question text`;

            const user = `Brand: ${name}
Current message: ${currentMessage || '(none provided)'}
PREVIOUS QUESTIONS (do not repeat):\n${previousQuestions || '(none)'}
Respond with ONLY the question.`;

            const response = await chatModel.invoke([
                { role: 'system', content: system },
                { role: 'user', content: user }
            ]);

            const question = response.content.trim();
            return res.json({ success: true, data: { question } });
        } catch (error) {
            console.error('Error getting core message question:', error);
            return res.status(500).json({ success: false, message: 'Failed to get question' });
        }
    }

    // Update/refine the Core Message using collected answers
    async updateCoreMessageWithAnswers(req, res) {
        try {
            const { brandData, currentMessage, userAnswers = [] } = req.body || {};

            if (!brandData || !brandData.brandName) {
                return res.status(400).json({ success: false, message: 'brandData.brandName is required' });
            }

            const name = brandData.brandName;
            const system = `You are an expert copywriter. Refine the Core Message to meet all constraints:
- One sentence, 10–20 words (max 25)
- Clear, jargon-free, understood in 5 seconds
- Emotional/aspirational; speaks to target needs/identity
- States unique value/promise; no hype`;

            const user = `Brand: ${name}
Current message: ${currentMessage || '(none)'}
User answers (context): ${JSON.stringify(userAnswers, null, 2)}

Return ONLY the refined single sentence.`;

            const response = await chatModel.invoke([
                { role: 'system', content: system },
                { role: 'user', content: user }
            ]);

            const refined = response.content.trim().replace(/^"|"$/g, '');
            return res.json({ success: true, data: { coreMessage: refined } });
        } catch (error) {
            console.error('Error updating core message:', error);
            return res.status(500).json({ success: false, message: 'Failed to update core message' });
        }
    }

    // Generate AI suggestions for brand
    async generateAISuggestions(req, res) {
        try {
            const { brandData } = req.body;
            
            if (!brandData || !brandData.brandName || !brandData.industry || !brandData.shortDescription) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand data is required'
                });
            }

            const aiPrompt = `Based on the following brand information, generate AI suggestions for tone of voice, target audience, and compliance guidelines.

Brand Information:
- Name: ${brandData.brandName}
- Industry: ${brandData.industry}
- Description: ${brandData.shortDescription}

Generate comprehensive suggestions in the following JSON format:
{
    "tone": {
        "archetypes": ["Archetype 1", "Archetype 2"],
        "guidelines": "Detailed tone guidelines",
        "characteristics": ["Characteristic 1", "Characteristic 2"]
    },
    "audiences": [
        {
            "name": "Primary Target",
            "demographics": "Age, gender, location",
            "psychographics": "Values, interests, lifestyle",
            "painPoints": ["Pain point 1", "Pain point 2"],
            "motivations": ["Motivation 1", "Motivation 2"]
        }
    ],
    "compliance": {
        "legalRequirements": ["Requirement 1", "Requirement 2"],
        "industryStandards": ["Standard 1", "Standard 2"],
        "bestPractices": ["Practice 1", "Practice 2"]
    }
}`;

            const response = await chatModel.invoke(aiPrompt);
            let aiData;
            
            try {
                let cleanContent = response.content.trim();
                        if (cleanContent.startsWith('```json')) {
                            cleanContent = cleanContent.replace(/^```json\s*/, '');
                        }
                        if (cleanContent.startsWith('```')) {
                            cleanContent = cleanContent.replace(/^```\s*/, '');
                        }
                        if (cleanContent.endsWith('```')) {
                            cleanContent = cleanContent.replace(/\s*```$/, '');
                        }
                        
                aiData = JSON.parse(cleanContent);
                    } catch (parseError) {
                aiData = {
                    tone: {
                        archetypes: ["The Innocent", "The Sage"],
                        guidelines: "Maintain a professional yet approachable tone",
                        characteristics: ["Clear", "Professional", "Trustworthy"]
                    },
                    audiences: [
                        {
                            name: "Primary Target",
                            demographics: "25-45, urban professionals",
                            psychographics: "Career-focused, value quality",
                            painPoints: ["Time constraints", "Quality expectations"],
                            motivations: ["Professional growth", "Quality assurance"]
                        }
                    ],
                    compliance: {
                        legalRequirements: ["Data protection compliance", "Industry-specific regulations"],
                        industryStandards: ["Quality standards", "Professional guidelines"],
                        bestPractices: ["Transparent communication", "Regular audits"]
                    }
                };
            }

            res.status(200).json({
                        success: true,
                data: aiData
            });
        } catch (error) {
            console.error('Error generating AI suggestions:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate AI suggestions',
                error: error.message
                    });
                }
            }

    // Legacy tone of voice chat method for backward compatibility
    async toneOfVoiceChat(req, res) {
        try {
            const { brandData, currentStep, userAnswer, previousAnswers = [] } = req.body;
            
            if (!brandData || !brandData.brandName || !brandData.industry || !brandData.shortDescription) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand data is required'
                });
            }

            // For backward compatibility, create a temporary workflow
            const workflowId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const initialState = {
                brandData,
                discoveryAnswers: previousAnswers,
                currentDiscoveryStep: currentStep,
                discoveryComplete: false,
                toneAnalysis: null,
                audienceSegments: [],
                complianceGuidelines: [],
                workflowPhase: 'discovery',
                progress: 0
            };

            workflowStateManager.initializeWorkflow(workflowId, initialState);

            // If this is the first step, generate initial question
            if (currentStep === 0) {
                const result = await getBrandWorkflow().invoke({
                    ...initialState,
                    workflowId
                });

                workflowStateManager.updateWorkflowState(workflowId, result);

                    return res.status(200).json({
                        success: true,
                        data: {
                        isComplete: false,
                        nextQuestion: result.nextQuestion,
                        suggestions: result.suggestions
                    }
                });
            } else {
                // Process user answer
                const updatedState = {
                    ...initialState,
                    discoveryAnswers: [
                        ...previousAnswers,
                        { question: "Previous question", answer: userAnswer }
                    ]
                };

                const result = await getBrandWorkflow().invoke({
                    ...updatedState,
                    workflowId
                });

                workflowStateManager.updateWorkflowState(workflowId, result);

                // Clean up temporary workflow
                workflowStateManager.deleteWorkflowState(workflowId);

                return res.status(200).json({
                    success: true,
                    data: {
                        isComplete: result.isComplete,
                        nextQuestion: result.nextQuestion,
                        suggestions: result.suggestions,
                        archetypes: result.toneAnalysis?.archetypes,
                        toneOfVoice: result.toneAnalysis?.toneOfVoice
                    }
                });
            }
        } catch (error) {
            console.error('Error in tone of voice chat:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to process tone of voice chat',
                error: error.message
            });
        }
    }
}

export default new BrandController(); 