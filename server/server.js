// server.js
// This is the entry point for our backend.

require("dotenv").config(); // Load environment variables from .env file

const express = require("express"); // Express is a popular Node.js web framework that makes it easy to build APIs and serve static files.

const app = express(); // Create an Express application instance. This is the main object that will handle incoming HTTP requests and send responses.
const PORT = process.env.PORT || 3000;// Define the port number on which the server will listen. It first checks if there's a PORT environment variable (useful for deployment), and defaults to 3000 if not.

// Lets our server understand JSON request bodies (the frontend will send
// { code, language } as JSON).
app.use(express.json());

// Serve the frontend files directly from this server, so you can open
// http://localhost:3000 and see the app - no separate server needed for
// the client during development.
app.use(express.static("../main"));

// Placeholder route. For now it just echoes back what it received,
// wrapped in a fake "review", so we can confirm the frontend <-> backend
// connection works before wiring up real AI logic.
app.post("/api/review", async (req, res) => {
  const { code, language } = req.body;

  // Second validation that the user actually sent some code before trying to review it.
  if (!code || !code.trim()) {
    return res.status(400).json({ error: "No code was provided." });
  }

  // Construct the URL for the Azure OpenAI API endpoint using the environment variable.
  const url = `${process.env.AZURE_OPENAI_ENDPOINT}/chat/completions`;

  try { // Call the Azure OpenAI API to get code review feedback.
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.AZURE_OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages: [
        { role: "system", content: "You are a helpful code review assistant that scans code, sends back feedback containing suggestions for improvement, errors and fixes. dont show code i input unless theres changes or improvements needeed on that section of code but anything that doesnt need to be changed should not be shown. you should be able to Highlights potential bugs or bad practice, Suggests readability/style improvements as i should be able to Paste in a code snippet and get instant feedback" },
        { role: "user", content: `${code} (${language})` }
      ],
      max_completion_tokens: 500,
    })
  });

  if (!response.ok) { // If the response from Azure OpenAI is not OK (e.g., 4xx or 5xx status), log the error and return a 500 response to the frontend.
    const errorText = await response.text();
    console.error("Error from Azure OpenAI:", errorText);
    return res.status(response.status).json({ error: "Failed to get AI response." });
  }

  const data = await response.json();
  const feedback = data.choices?.[0]?.message?.content ?? "No feedback received from AI."; // Extract the feedback from the AI's response. If the expected structure is not present, provide a default message.
  res.json({ feedback }); // Send the feedback back to the frontend as JSON.
  } catch (error) { // Catch any unexpected errors during the fetch call and log them, returning a 500 response to the frontend.
    console.error("Error while calling Azure OpenAI:", error);
    res.status(500).json({ error: "Internal server error." });
  }

});

app.listen(PORT, () => {
  console.log(`Code Review Helper server running at http://localhost:${PORT}`);
});