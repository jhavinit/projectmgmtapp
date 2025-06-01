/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { env } from "process";

// import { OpenAI } from "openai";

// const openai = new OpenAI({
//   apiKey:
//     "",
// });

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

// 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

export async function summarizeWithHuggingFace(text: string) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      },
    );

    const data = await response.json();
    return data[0].summary_text;
  } catch (error) {
    console.error("Error summarizing with Hugging Face:", error);
    return "";
  }
}
