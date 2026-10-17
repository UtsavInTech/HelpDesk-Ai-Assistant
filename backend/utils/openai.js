import "dotenv/config";

const SYSTEM_PROMPT = "You are SigmaGPT, a helpful, professional AI assistant. Answer clearly and use markdown when it helps.";

//how many past messages of the thread we send back for context
const HISTORY_LIMIT = 20;

//turn the thread's attached PDFs into one extra system message
const buildDocumentPrompt = (documents) => {
    if(!documents?.length) return null;

    const body = documents
        .map(doc => `--- START OF "${doc.name}" ---\n${doc.text}\n--- END OF "${doc.name}" ---`)
        .join("\n\n");

    return {
        role: "system",
        content:
            "The user has attached the following document(s) to this conversation. " +
            "Answer questions about them using only what they contain, and say so plainly " +
            "when the answer is not in the text.\n\n" + body
    };
};

/**
 * history   - the messages already stored on the thread, oldest first.
 * documents - PDFs attached to the thread, already extracted to text.
 * Both are replayed so the conversation remembers itself and its attachments.
 */
const getOpenAIAPIResponse = async (message, history = [], documents = []) => {
    const context = history
        .slice(-HISTORY_LIMIT)
        .map(({role, content}) => ({role, content}));

    const documentPrompt = buildDocumentPrompt(documents);

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                {role: "system", content: SYSTEM_PROMPT},
                ...(documentPrompt ? [documentPrompt] : []),
                ...context,
                {role: "user", content: message}
            ]
        })
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", options);
    const data = await response.json();

    if(!response.ok) {
        //surface the real reason (bad key, no credit, rate limit) instead of a silent undefined
        throw new Error(data?.error?.message || `OpenAI request failed with status ${response.status}`);
    }

    const reply = data?.choices?.[0]?.message?.content;

    if(!reply) {
        throw new Error("OpenAI returned an empty response");
    }

    return reply;
}

export default getOpenAIAPIResponse;
