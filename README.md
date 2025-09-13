Advanced AI Code Assistant
An intelligent web application that serves as a powerful assistant for developers. This tool leverages the Google Gemini API to solve coding problems, debug and refactor existing code, and generate complex visualizations like flowcharts and diagrams.

✨ Features
This application is more than just a code generator; it's a multi-faceted development partner packed with advanced features:

💻 Multi-Mode Operation:

Solve Mode: Ask any coding-related question and get a complete solution with explanations.

Debug & Refactor Mode: Submit your own code along with an instruction (e.g., "find the bug," "make this more efficient") to get an improved version.

Visualize Mode: Describe a process or structure, and the AI will generate a Mermaid.js diagram to visualize it (e.g., flowcharts, sequence diagrams, database schemas).

🧠 Conversational Memory: The assistant remembers the context of your current session, allowing you to ask follow-up questions and build upon previous answers iteratively.

🚀 Smart Action Buttons: Use "Code Recipes" for common tasks like Explain Code, Add Comments, or Write Unit Tests for your provided code with a single click.

🌐 API Expert Mode (with Google Search): Toggle this mode to enable the AI to ground its responses in real-time information from Google Search, providing up-to-date answers with source links for verification.

⚡ Live Code Sandbox: Instantly execute generated HTML and JavaScript code snippets directly on the page in a secure sandbox to see them in action.

🎨 Modern & Animated UI: A sleek, responsive "glassmorphism" interface with smooth animations and a professional look and feel.

📋 Rich Output Formatting: Responses are rendered from Markdown, including syntax-highlighted code blocks with dedicated "Copy" and "Run" buttons for convenience.

📂 Project Structure
The project is organized in a clean and systematic way with separate files for structure, style, and logic.

/Advanced-AI-Code-Assistant
|-- .gitignore              # Tells Git which files to ignore
|-- index.html              # The main HTML file (structure)
|-- README.md               # Project documentation
|-- /css
|   |-- style.css           # Custom styles and animations
|-- /js
    |-- config.js           # Secure API key storage (ignored by Git)
    |-- script.js           # Application logic and API calls

🛠️ Tech Stack
Frontend: HTML5, Tailwind CSS, Vanilla JavaScript (ES6+)

AI Engine: Google Gemini API (gemini-2.5-flash-preview-05-20)

Libraries (via CDN): marked.js, highlight.js, mermaid.js

🚀 Getting Started
Setting up the project is straightforward and secure.

Prerequisites
A modern web browser (Chrome, Firefox, Edge, Safari).

A Google Gemini API key.

Installation
Download the Project Files: Clone or download the repository and its file structure.

Get a Gemini API Key:

Visit the Google AI Studio.

Sign in and click "Get API key" -> "Create API key in new project".

Copy the generated key.

Create the Configuration File:

In the /js folder, create a new file named config.js.

Add the following content to it, replacing "YOUR_API_KEY_HERE" with the key you just copied:

// js/config.js
const API_KEY = "YOUR_API_KEY_HERE";

Note: The .gitignore file ensures this config.js file will not be uploaded to GitHub.

Run the Application:

Open the index.html file in your web browser. The application is now ready to use.

📖 How to Use
Select a Mode: Choose from the Solve, Debug & Refactor, or Visualize tabs at the top.

Enter Your Query: Type your question or paste your code into the appropriate text area.

Generate: Click the "Generate Solution" button.

Interact with the Output: Use the Copy and Run buttons on code blocks, check sources, and view your conversation in the "History" panel.

📄 License
This project is licensed under the MIT License.