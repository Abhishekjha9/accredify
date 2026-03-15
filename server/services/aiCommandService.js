const OpenAI = require('openai');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const DEBUG_AI = process.env.DEBUG_AI === '1' || process.env.NODE_ENV === 'development';

const SYSTEM_PROMPT = `You are an AI assistant that controls a web app. The user will tell you what they want to do. You must respond with ONLY a valid JSON array of actions, no other text.

Allowed actions:
- { "type": "navigate", "path": "<path>" } — Navigate to a route. Paths: "/" (dashboard), "/messages", "/freelancers", "/profile", "/projects/<id>".
- { "type": "click", "selector": "<css selector>" } — Click an element. Only use these selectors: [data-ai="create-project"], [data-ai="nav-messages"], [data-ai="nav-freelancers"].
- { "type": "say", "text": "<message>" } — Show a message to the user.

Rules:
- Interpret the user's intent freely (e.g. "take me to chat" -> navigate to /messages, "I want to message someone" -> navigate to /messages).
- Any request about messaging/contacting/saying hi to a freelancer -> navigate to /messages and say "Opening Messages — pick a freelancer and send your message there."
- If the user asks how many projects they have, how many are ongoing, or similar, answer using the provided project counts with a single "say" action (e.g. "You have 3 ongoing projects and 5 total.").
- If the user asks about trust score, scope discipline, or scope creep index, answer using the provided user data with a single "say" action.
- If the user asks to open, view, or go to a specific project by name (e.g. "open project details for graphic design project"), use the provided project list to find the matching project id and return [{"type":"navigate","path":"/projects/<id>"}]. Match by title (partial match is fine). If no project matches, return one "say" action: "No project found matching that name."
- Return 1-3 actions when appropriate (e.g. "create a project" -> navigate to / then click create-project).
- If the request is unclear or not doable, return one "say" action with a short helpful reply.
- Output ONLY the JSON array, no markdown or explanation.`;

/**
 * Fallback: simple rule-based parser when LLM is unavailable.
 * @param {string} message
 * @param {object} context - { user?, projects?: { ongoing, total, completed } }
 */
function parseCommandFallback(message, context = {}) {
    const text = (message || '').toLowerCase().trim();
    const actions = [];
    const user = context.user || {};
    const projects = context.projects || {};

    if (/trust score|my (trust )?score|what'?s my score/.test(text) && typeof user.trustScore === 'number') {
        actions.push({ type: 'say', text: `Your trust score is ${user.trustScore}.` });
        return actions;
    }
    if (/(scope discipline|my discipline)/.test(text) && typeof user.scopeDiscipline === 'number') {
        actions.push({ type: 'say', text: `Your scope discipline score is ${user.scopeDiscipline}.` });
        return actions;
    }
    if (/(scope creep|creep index)/.test(text) && typeof user.scopeCreepIndex === 'number') {
        actions.push({ type: 'say', text: `Your scope creep index is ${user.scopeCreepIndex}.` });
        return actions;
    }

    const ongoing = typeof projects.ongoing === 'number' ? projects.ongoing : null;
    const total = typeof projects.total === 'number' ? projects.total : null;
    if ((/how many .* (ongoing |active )?projects?|(ongoing|active) projects?|number of projects?|projects? (count|total)/.test(text) || /how many (ongoing|active)/.test(text)) && (ongoing !== null || total !== null)) {
        if (total !== null && ongoing !== null) {
            actions.push({ type: 'say', text: `You have ${ongoing} ongoing project${ongoing !== 1 ? 's' : ''} and ${total} total.` });
        } else if (total !== null) {
            actions.push({ type: 'say', text: `You have ${total} project${total !== 1 ? 's' : ''} in total.` });
        } else {
            actions.push({ type: 'say', text: `You have ${ongoing} ongoing project${ongoing !== 1 ? 's' : ''}.` });
        }
        return actions;
    }

    if (/^(open |go to |show |navigate to |take me to )?(messages|chat|message)/.test(text)) {
        actions.push({ type: 'navigate', path: '/messages' });
    } else if (/(send|message|text|say hi|write to|contact|reach out).*?(freelancer|a freelancer)/.test(text) || /(send hi|say hi|message|contact).*(to )?freelancer/.test(text) || /(freelancer|a freelancer).*(send|message|hi|contact)/.test(text)) {
        actions.push({ type: 'navigate', path: '/messages' });
        actions.push({ type: 'say', text: 'Opening Messages — pick a freelancer and send your message there.' });
    } else if (/^(open |go to |show )?(freelancers?|find freelancers?|search freelancers?)/.test(text)) {
        actions.push({ type: 'navigate', path: '/freelancers' });
    } else if (/^(open |go to |show )?(dashboard|home)/.test(text)) {
        actions.push({ type: 'navigate', path: '/' });
    } else if (/^(open |go to |show )?(profile|my profile)/.test(text)) {
        actions.push({ type: 'navigate', path: '/profile' });
    } else if (/project/.test(text) && (/project\s+(?:details?\s+)?for\s+/.test(text) || /(?:open|go to|show|view)\s+.+\s+project\s*$/.test(text))) {
        const list = context.projectList || [];
        let namePart = '';
        const forMatch = text.match(/project\s+(?:details?\s+)?for\s+(.+)/i);
        if (forMatch) {
            namePart = forMatch[1].trim();
        } else {
            const openMatch = text.match(/(?:open|go to|show|view)\s+(.+?)\s+project\s*$/i);
            if (openMatch) {
                namePart = openMatch[1].trim();
            } else {
                namePart = text.replace(/^(?:open|go to|show|view|navigate to)\s*(?:project\s*(?:details?\s*)?(?:for\s*)?)?/i, '').replace(/\s*project\s*$/i, '').trim();
            }
        }
        const search = namePart.toLowerCase().replace(/\s+/g, ' ').replace(/\s*$/, '');
        const found = list.find((p) => (p.title || '').toLowerCase().includes(search) || search.includes((p.title || '').toLowerCase()));
        if (found) {
            actions.push({ type: 'navigate', path: `/projects/${found.id}` });
        } else {
            actions.push({ type: 'say', text: namePart ? `No project found matching "${namePart}".` : 'Which project do you want to open? Say something like "open project details for [project name]".' });
        }
    } else if (/^(create|new|start) (a )?project/.test(text)) {
        actions.push({ type: 'navigate', path: '/' });
        actions.push({ type: 'click', selector: '[data-ai="create-project"]' });
    } else if (/^(open |go to )?create project/.test(text)) {
        actions.push({ type: 'click', selector: '[data-ai="create-project"]' });
    } else {
        actions.push({ type: 'say', text: 'Try: "Open messages", "Send hi to freelancer", "Go to freelancers", "Dashboard", "Create a project", "Open project details for [project name]", "Profile", "What\'s my trust score?", or "How many projects are ongoing?"' });
    }

    return actions;
}

function extractJSON(str) {
    if (!str || typeof str !== 'string') return null;
    let trimmed = str.trim();
    // Strip markdown code blocks (Gemini often wraps JSON in ```json ... ``` or ``` ... ```)
    trimmed = trimmed.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
    const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    let raw = jsonMatch[0];
    try {
        return JSON.parse(raw);
    } catch (_) {
        // Try fixing single-quoted keys/strings (some models output single quotes)
        try {
            const fixed = raw.replace(/'/g, '"');
            return JSON.parse(fixed);
        } catch (__) {
            return null;
        }
    }
}

function validateActions(arr) {
    if (!Array.isArray(arr)) return null;
    return arr.filter((a) => {
        if (!a || typeof a.type !== 'string') return false;
        if (a.type === 'navigate' && typeof a.path === 'string') return true;
        if (a.type === 'click' && typeof a.selector === 'string') return true;
        if (a.type === 'say' && typeof a.text === 'string') return true;
        return false;
    });
}

function buildUserContent(message, context) {
    const route = context.route || '/';
    const u = context.user;
    const proj = context.projects;
    let userInfo = '';
    if (u) {
        const parts = [];
        if (typeof u.trustScore === 'number') parts.push(`trust score: ${u.trustScore}`);
        if (typeof u.scopeDiscipline === 'number') parts.push(`scope discipline: ${u.scopeDiscipline}`);
        if (typeof u.scopeCreepIndex === 'number') parts.push(`scope creep index: ${u.scopeCreepIndex}`);
        if (u.name) parts.push(`name: ${u.name}`);
        if (u.role) parts.push(`role: ${u.role}`);
        if (parts.length) userInfo = ` Current user: ${parts.join(', ')}.`;
    }
    let projectInfo = '';
    if (proj && typeof proj.ongoing === 'number' && typeof proj.total === 'number') {
        projectInfo = ` Projects: ${proj.ongoing} ongoing, ${proj.total} total, ${proj.completed ?? 0} completed.`;
    }
    const projectList = context.projectList || [];
    let listInfo = '';
    if (projectList.length) {
        listInfo = ' User\'s projects (use id for path /projects/<id>): ' + projectList.map((p) => `"${(p.title || '').replace(/"/g, '')}" -> ${p.id}`).join('; ');
    }
    return `Current route: ${route}.${userInfo}${projectInfo}${listInfo} User said: "${message}"`;
}

/**
 * Run AI command: OpenAI if OPENAI_API_KEY, else Gemini if GEMINI_API_KEY, else fallback parser.
 * @param {string} message - User message
 * @param {object} context - { route?: string, user?: { trustScore, scopeDiscipline, scopeCreepIndex, name, role } }
 * @returns {Promise<Array>} actions
 */
async function runCommand(message, context = {}) {
    const userContent = buildUserContent(message, context);

    // Try OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
        try {
            const openai = new OpenAI({ apiKey: openaiKey });
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userContent },
                ],
                temperature: 0.2,
                max_tokens: 500,
            });
            const content = completion.choices?.[0]?.message?.content;
            if (content) {
                const parsed = extractJSON(content);
                const validated = validateActions(parsed);
                if (validated && validated.length > 0) return validated;
            }
        } catch (err) {
            console.warn('AI command OpenAI error:', err.message);
        }
    }

    // Try Google Gemini (free tier available at https://aistudio.google.com/apikey)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
        try {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                ],
                generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
            });
            const fullPrompt = SYSTEM_PROMPT + '\n\n' + userContent;
            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            let content;
            try {
                content = response?.text?.();
            } catch (textErr) {
                if (DEBUG_AI) console.warn('AI Gemini response.text() failed (often safety block):', textErr.message);
                throw textErr;
            }
            if (content) {
                const parsed = extractJSON(content);
                const validated = validateActions(parsed);
                if (validated && validated.length > 0) return validated;
                if (DEBUG_AI) console.warn('AI Gemini returned unparseable or invalid JSON. First 300 chars:', content.slice(0, 300));
            } else if (DEBUG_AI) {
                console.warn('AI Gemini returned empty content.');
            }
        } catch (err) {
            if (DEBUG_AI) console.warn('AI command Gemini error:', err.message);
            else console.warn('AI command Gemini error:', err.message);
        }
    }

    return parseCommandFallback(message, context);
}

module.exports = { runCommand, parseCommandFallback };
