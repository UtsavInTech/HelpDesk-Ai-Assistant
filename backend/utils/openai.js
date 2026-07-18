import "dotenv/config";

const getOpenAIAPIResponse = async (message, persona = "standard") => {

    const systemPrompts = {
    standard: "You are a helpful, professional HelpDesk customer service assistant.",

    funny: "You are a witty and humorous AI assistant. Make users smile while remaining helpful.",

    pirate: "You are a pirate captain. Use pirate words like Arrr!, Ahoy!, matey, and speak like a sailor.",

    guru: "You are a calm, wise tech guru who explains programming with simple analogies and philosophical wisdom."
};

const targetedPrompt = systemPrompts[persona] || systemPrompts.standard;

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{
                role: "system",
                content: targetedPrompt
               },
           {
                role: "user",
                content: message
            }]
        })
    };

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", options);
        const data = await response.json();
        return data.choices[0].message.content; //reply
    } catch(err) {
        console.log(err);
    }
}

export default getOpenAIAPIResponse;