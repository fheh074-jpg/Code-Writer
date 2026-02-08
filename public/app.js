const form = document.getElementById("prompt-form");
const iterationsEl = document.getElementById("iterations");
const statusEl = document.getElementById("status");

function setStatus(message) {
  statusEl.textContent = message;
}

function createIterationCard(iteration) {
  const wrapper = document.createElement("article");
  wrapper.className = "iteration";

  const header = document.createElement("h3");
  header.textContent = `Iteration ${iteration.iteration}`;

  const content = document.createElement("pre");
  content.textContent = iteration.content || "(No content returned)";

  wrapper.appendChild(header);
  wrapper.appendChild(content);

  return wrapper;
}

async function submitPrompt(event) {
  event.preventDefault();
  iterationsEl.innerHTML = "";

  const prompt = document.getElementById("prompt").value.trim();
  const language = document.getElementById("language").value.trim() || "Any";
  const timeLimitMinutes = Number(document.getElementById("time-limit").value || 5);
  const baseUrl = document.getElementById("base-url").value.trim();
  const model = document.getElementById("model").value.trim();
  const apiKey = document.getElementById("api-key").value.trim();

  if (!prompt) {
    setStatus("Please enter a prompt.");
    return;
  }

  setStatus("Working...");

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        language,
        timeLimitMinutes,
        baseUrl,
        model,
        apiKey
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    if (!data.iterations || data.iterations.length === 0) {
      iterationsEl.textContent = "No iterations returned.";
    } else {
      data.iterations.forEach((iteration) => {
        iterationsEl.appendChild(createIterationCard(iteration));
      });
    }

    setStatus(`Done in ${data.elapsedSeconds}s.`);
  } catch (error) {
    setStatus(`Error: ${error.message}`);
  }
}

form.addEventListener("submit", submitPrompt);
