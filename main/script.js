// Code Review Helper - frontend logic.
// Next step (3): hook up the "Review Code" button to call our backend
// endpoint and render the AI's feedback into #results.

const $ = (selector) => document.querySelector(selector);

// Called when the user clicks the "Review Code" button. It reads the code and language from the input fields, sends them to the backend, and renders the response.
const reviewButton = async () => {
  const code = $('#code-input').value;
  const language = $('#language').value;

  // Validate that the user actually entered some code before sending it to the backend.
  if (!code || !code.trim()) {
    $('#results').textContent = "No code to review.";
    return;
  }

  $('#results').textContent = "Reviewing code...";

  // Call the backend endpoint we created in server.js.
  const response = await fetch('/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });
  const data = await response.json();
  console.log("Received response from backend:", data);
  $('#results').textContent = data.feedback;
}

document.addEventListener('DOMContentLoaded', () => {
  $('#review-btn').addEventListener('click', reviewButton);
});