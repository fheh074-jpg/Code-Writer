const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

const DEFAULT_BASE_URL = "http://localhost:1234/v1";
const DEFAULT_MODEL = "deepseek-coder-v2-instruct";
const MAX_ITERATIONS = 6;

function buildSystemPrompt() {
  return [
    "You are a senior coding agent.",
    "Your job is to write code centered on the user's prompt, then propose tests, then improve and bug-fix repeatedly.",
    "Return a concise response with these sections:",
    "- Code (include files or snippets)",
    "- Tests (what to run or verify)",
    "- Improvements/Bug Fixes (what you changed and why)",
    "Keep output focused and actionable."
  ].join(" ");
}

function buildUserPrompt({ prompt, language, iteration, previousOutput }) {
  const base = [
    `User prompt: ${prompt}`,
    `Language preference: ${language}`,
    `Iteration: ${iteration}`
  ];

  if (previousOutput) {
    base.push("Previous output:");
    base.push(previousOutput);
    base.push("Please improve and fix any issues based on the previous output.");
  } else {
    base.push("Start by producing the initial code and tests.");
  }

  return base.join("\n\n");
}

async function callLmStudio({ baseUrl, model, apiKey, messages }) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LM Studio error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

app.post("/api/generate", async (req, res) => {
  const {
    prompt,
    language = "Any",
    timeLimitMinutes = 5,
    baseUrl = DEFAULT_BASE_URL,
    model = DEFAULT_MODEL,
    apiKey = ""
  } = req.body || {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required." });
  }

  const startTime = Date.now();
  const timeLimitMs = Math.max(Number(timeLimitMinutes) || 1, 1) * 60 * 1000;
  const deadline = startTime + timeLimitMs;
  const iterations = [];

  let previousOutput = "";
  let iteration = 1;

  try {
    while (Date.now() < deadline && iteration <= MAX_ITERATIONS) {
      const messages = [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: buildUserPrompt({
            prompt,
            language,
            iteration,
            previousOutput
          })
        }
      ];

      const content = await callLmStudio({ baseUrl, model, apiKey, messages });

      iterations.push({
        iteration,
        content
      });

      previousOutput = content;
      iteration += 1;

      if (Date.now() + 5000 > deadline) {
        break;
      }
    }

    return res.json({
      prompt,
      language,
      model,
      baseUrl,
      iterations,
      elapsedSeconds: Math.round((Date.now() - startTime) / 1000)
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to generate response from LM Studio.",
      iterations
    });
  }
});

app.listen(PORT, () => {
  console.log(`Code Writer app listening on http://localhost:${PORT}`);
});
