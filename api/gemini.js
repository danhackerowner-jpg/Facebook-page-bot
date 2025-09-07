const axios = require("axios");

module.exports = {
  name: "gemini",
  description: "Ask Gemini Flash 2.0 something (usage: gemini <question>)",
  async execute(ctx) {
    const prompt = ctx.args.slice(1).join(" ");
    if (!prompt) return "💡 Usage: gemini <your question>";

    try {
      // 👉 Put your Gemini API key here since repo is private
      const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

      const response = await axios.post(
        `${url}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            { role: "user", parts: [{ text: prompt }] }
          ]
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ error try again. if still not response report it to admin: Daniel.";
      return `🤖 *GEMINI*
____________________
${text}
____________________
-Daniel edition`;
    } catch (err) {
      console.error("Gemini error:", err.response?.data || err.message);
      return "⚠️ Gemini request failed.";
    }
  }
};
