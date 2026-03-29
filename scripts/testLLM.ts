import axios from "axios";
import dotenv from "dotenv";
import path from "path";

// load env from blog/.env
dotenv.config({
  path: path.join(process.cwd(), "blog/.env"),
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL =
  process.env.OPENAI_API_URL ||
  "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function main() {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  console.log("🚀 Sending test request...\n");

  console.log(OPENAI_URL);
  console.log(OPENAI_MODEL);
  console.log(OPENAI_API_KEY);
  
  const response = await axios.post(
    OPENAI_URL,
    {
      model: OPENAI_MODEL,
      messages: [
        {
          role: "user",
          content: "how are you, what model are you?"
        }
      ],
      temperature: 0.7
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const reply = response.data?.choices?.[0]?.message?.content;

  console.log("✅ Response from LLM:\n");
  console.log(reply);
}

main().catch((err) => {
  console.error("❌ Error calling LLM:\n", err?.response?.data || err.message);
});
