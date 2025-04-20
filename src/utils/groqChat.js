export const groqChat = async (messages, pdfData = null) => {
  const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  if (!API_KEY) {
    console.error("Missing GROQ API key");
    return "Error: API key not configured. Please add VITE_GROQ_API_KEY to your environment variables.";
  }

  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const payload = {
    model: "meta-llama/llama-4-scout-17b-16e-instruct", // Changed model based on your curl example
    messages: messages.filter(
      (msg) => msg.role !== "system" || msg.content.trim() !== ""
    ),
    temperature: 0.7,
    max_tokens: 1024,
  };

  try {
    console.log("Sending request to GROQ API:", JSON.stringify(payload));

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API error (${res.status}):`, errorText);
      return `Error from chat service (${res.status}). Please check your API key configuration and try again.`;
    }

    const data = await res.json();
    return (
      data.choices?.[0]?.message?.content ||
      "No response received from the service."
    );
  } catch (error) {
    console.error("Network error:", error);
    return "Network error. Please check your connection and try again.";
  }
};
