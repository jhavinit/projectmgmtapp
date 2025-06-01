/**
 * Utility functions for generating project summaries using AI services.
 * Supports both OpenAI (commented out) and Hugging Face APIs.
 */

import { env } from "process";

/*
// Uncomment and configure OpenAI if needed.
// import { OpenAI } from "openai";

// const openai = new OpenAI({
//   apiKey: env.OPENAI_API_KEY || "",
// });

/**
 * Generates a concise summary of project details using OpenAI.
 * @param details - The project details to summarize.
 * @returns The summary string.
 */
// export async function getProjectSummary(details: string): Promise<string> {
//   const prompt = `
//   Summarize the following project details concisely:

//   ${details}

//   Summary:
//   `;

//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content:
//             "You are a helpful assistant that summarizes project details.",
//         },
//         { role: "user", content: prompt },
//       ],
//       max_tokens: 150,
//       temperature: 0.5,
//     });

//     if (!response.choices[0]?.message?.content) {
//       return "";
//     }

//     return response.choices[0].message.content.trim();
//   } catch (error) {
//     console.error("OpenAI API error:", error);
//     return "";
//   }
// }


/**
 * Generates a summary of the provided text using Hugging Face's BART model.
 * @param text - The text to summarize.
 * @returns The summary string, or an empty string on error.
 */
export async function summarizeWithHuggingFace(text: string): Promise<string> {
  try {
    const response = await fetch(
      env.HUGGING_FACE_API_URL ?? "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      },
    );

    const data = (await response.json()) as { summary_text: string }[];
    return Array.isArray(data) && data[0]?.summary_text ? data[0].summary_text : "";
  } catch (error) {
    console.error("Error summarizing with Hugging Face:", error);
    return "";
  }
}
