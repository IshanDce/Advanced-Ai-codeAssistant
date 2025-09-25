// --- DOM Elements ---
const elements = {
    tabs: { solve: document.getElementById('tab-solve'), debug: document.getElementById('tab-debug'), visualize: document.getElementById('tab-visualize') },
    content: { solve: document.getElementById('content-solve'), debug: document.getElementById('content-debug'), visualize: document.getElementById('content-visualize') },
    inputs: {
        solve: document.getElementById('solveInput'),
        debugCode: document.getElementById('debugCodeInput'),
        debugInstruction: document.getElementById('debugInstructionInput'),
        visualize: document.getElementById('visualizeInput'),
    },
    generateBtn: document.getElementById('generateBtn'),
    btnText: document.getElementById('btn-text'),
    loader: document.getElementById('loader'),
    outputContainer: document.getElementById('output-container'),
    placeholder: document.getElementById('placeholder'),
    sourcesContainer: document.getElementById('sources-container'),
    historyContainer: document.getElementById('history-container'),
    messageBox: document.getElementById('messageBox'),
    searchToggle: document.getElementById('searchToggle'),
    sandbox: { container: document.getElementById('sandbox-container'), iframe: document.getElementById('sandbox-iframe') }
};

// --- State Management ---
let state = {
    currentTab: 'solve',
    chatHistory: [],
    isLoading: false,
};

// --- API Configuration ---
// IMPORTANT: Replace "YOUR_API_KEY_HERE" with your actual Google Gemini API key.
const API_KEY = "AIzaSyAbXo5TP9Uuyy1TExSHvdSeVZcMEgjqWF0";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`;
const systemPrompt = "You are an expert code assistant. Provide clear, concise, and accurate solutions. Use Markdown for formatting and specify the language for code blocks. For visualization requests, generate Mermaid.js syntax inside a 'mermaid' code block.";

// --- Event Listeners ---
Object.keys(elements.tabs).forEach(tabName => {
    elements.tabs[tabName].addEventListener('click', () => switchTab(tabName));
});

elements.generateBtn.addEventListener('click', handleGeneration);

document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => handleAction(e.target.dataset.action));
});

// --- Tab Switching Logic ---
function switchTab(tabName) {
    state.currentTab = tabName;
    Object.keys(elements.tabs).forEach(key => {
        elements.tabs[key].classList.toggle('active', key === tabName);
        elements.content[key].classList.toggle('hidden', key !== tabName);
    });
}

// --- Main Generation Logic ---
async function handleGeneration() {
    if (state.isLoading) return;
    
    let userPrompt = '';
    const currentInput = elements.inputs[state.currentTab];

    if (state.currentTab === 'solve' || state.currentTab === 'visualize') {
        userPrompt = currentInput.value.trim();
    } else if (state.currentTab === 'debug') {
        const code = elements.inputs.debugCode.value.trim();
        const instruction = elements.inputs.debugInstruction.value.trim();
        if (!code || !instruction) {
            showMessage('Please provide both code and an instruction for debugging.', 'bg-yellow-500');
            return;
        }
        userPrompt = `Instruction: ${instruction}\n\nCode:\n\`\`\`\n${code}\n\`\`\``;
    }

    if (!userPrompt) {
        showMessage('Please enter a query.', 'bg-yellow-500');
        return;
    }

    setLoading(true);
    elements.placeholder.classList.add('hidden');
    elements.outputContainer.innerHTML = '';
    elements.sourcesContainer.innerHTML = '';
    elements.sandbox.container.classList.add('hidden');
    
    const useSearch = elements.searchToggle.checked;
    
    try {
        const payload = {
            contents: [...state.chatHistory, { role: "user", parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            tools: useSearch ? [{ "google_search": {} }] : [],
        };
        
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        
        const result = await response.json();
        const candidate = result.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            const generatedText = candidate.content.parts[0].text;
            state.chatHistory.push({ role: "user", parts: [{ text: userPrompt }] });
            state.chatHistory.push({ role: "model", parts: [{ text: generatedText }] });
            
            renderOutput(generatedText, candidate.groundingMetadata);
            updateHistory();
        } else {
            throw new Error('Invalid API response structure.');
        }
    } catch (error) {
        console.error('Error:', error);
        elements.outputContainer.innerHTML = `<div class="text-red-400 p-4">Error: ${error.message}</div>`;
        showMessage('Failed to get a response.', 'bg-red-500');
    } finally {
        setLoading(false);
    }
}

// --- Output Rendering ---
function renderOutput(text, groundingMetadata) {
    elements.outputContainer.innerHTML = marked.parse(text);
    elements.outputContainer.classList.add('output-container');
    
    // Highlight code blocks
    elements.outputContainer.querySelectorAll('pre code').forEach(hljs.highlightElement);
    addCodeToolbars();
    
    // Render Mermaid diagrams
    renderMermaidDiagrams();

    // Render sources if available
    if (groundingMetadata?.groundingAttributions?.length > 0) {
         const sourcesHtml = groundingMetadata.groundingAttributions.map(attr => 
            `<a href="${attr.web.uri}" target="_blank" class="inline-block bg-gray-700 text-blue-300 px-3 py-1 rounded-full mr-2 mb-2 hover:bg-gray-600 transition-colors">
                Source: ${attr.web.title}
            </a>`
        ).join('');
        elements.sourcesContainer.innerHTML = `<h3 class="text-lg font-semibold mb-2">Sources</h3>${sourcesHtml}`;
    }
}

function addCodeToolbars() {
    elements.outputContainer.querySelectorAll('pre').forEach(pre => {
        const code = pre.querySelector('code');
        const lang = [...code.classList].find(cls => cls.startsWith('language-'))?.replace('language-', '') || '';

        const toolbar = document.createElement('div');
        toolbar.className = 'code-toolbar';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'toolbar-btn';
        copyBtn.innerText = 'Copy';
        copyBtn.onclick = () => copyCode(code, copyBtn);
        toolbar.appendChild(copyBtn);

        if (['javascript', 'html'].includes(lang)) {
            const runBtn = document.createElement('button');
            runBtn.className = 'toolbar-btn';
            runBtn.innerText = 'Run';
            runBtn.onclick = () => runCode(code.innerText, lang);
            toolbar.appendChild(runBtn);
        }
        pre.appendChild(toolbar);
    });
}

// async function renderMermaidDiagrams() {
//     const mermaidElements = elements.outputContainer.querySelectorAll('code.language-mermaid');
//     if (mermaidElements.length === 0) return;

//     for (const el of mermaidElements) {
//         const code = el.innerText;
//         const container = el.parentElement;
//         container.innerHTML = `<div class="mermaid-diagram flex justify-center p-4">${code}</div>`;
//         try {
//             const { svg } = await window.mermaid.render(`mermaid-${Date.now()}`, code);
//             container.innerHTML = svg;
//         } catch (e) {
//             container.innerHTML = `<div class="text-red-400">Failed to render diagram: ${e.message}</div>`;
//             console.error("Mermaid render error:", e);
//         }
//     }
// }
// --- Output Rendering ---
// --- Output Rendering ---

function renderOutput(text, groundingMetadata) {
    elements.outputContainer.innerHTML = marked.parse(text);
    elements.outputContainer.classList.add('output-container');
    
    // 1. Render Mermaid diagrams FIRST to avoid conflicts with the syntax highlighter.
    renderMermaidDiagrams();

    // 2. Now, highlight all OTHER code blocks that remain.
    elements.outputContainer.querySelectorAll('pre code:not(.language-mermaid)').forEach(hljs.highlightElement);
    
    // 3. Add copy/run toolbars to the code blocks.
    addCodeToolbars();

    // Render sources if available
    if (groundingMetadata?.groundingAttributions?.length > 0) {
        const sourcesHtml = groundingMetadata.groundingAttributions.map(attr => 
            `<a href="${attr.web.uri}" target="_blank" class="inline-block bg-gray-700 text-blue-300 px-3 py-1 rounded-full mr-2 mb-2 hover:bg-gray-600 transition-colors">
                Source: ${attr.web.title}
            </a>`
        ).join('');
        elements.sourcesContainer.innerHTML = `<h3 class="text-lg font-semibold mb-2">Sources</h3>${sourcesHtml}`;
    }
}

// Ensure this function is present in your file
async function renderMermaidDiagrams() {
    const mermaidElements = elements.outputContainer.querySelectorAll('code.language-mermaid');
    if (mermaidElements.length === 0) return;

    for (const el of mermaidElements) {
        const code = el.innerText;
        const container = el.parentElement; // This is the <pre> tag
        
        // Create a temporary div for rendering to avoid breaking the layout
        const mermaidContainer = document.createElement('div');
        mermaidContainer.className = 'mermaid-diagram flex justify-center p-4';
        mermaidContainer.textContent = code;
        
        // Replace the <pre> tag with our new container
        container.parentNode.replaceChild(mermaidContainer, container);

        try {
            // Render the diagram using the unique ID of the container
            const { svg } = await window.mermaid.render(`mermaid-${Date.now()}`, code);
            mermaidContainer.innerHTML = svg;
        } catch (e) {
            mermaidContainer.innerHTML = `<div class="text-red-400">Failed to render diagram: ${e.message}</div>`;
            console.error("Mermaid render error:", e);
        }
    }
}

// --- History Management ---
function updateHistory() {
    if (state.chatHistory.length === 0) {
         elements.historyContainer.innerHTML = `<div class="text-gray-500 text-center p-4">Conversation history is empty.</div>`;
         return;
    }
    elements.historyContainer.innerHTML = state.chatHistory.map((item, index) => {
        const text = item.parts[0].text.substring(0, 100); // Truncate for display
        return `
            <div class="p-2 rounded-lg ${item.role === 'user' ? 'bg-gray-700' : 'bg-gray-600'}">
                <p class="font-bold capitalize">${item.role}</p>
                <p class="text-gray-300">${text}${item.parts[0].text.length > 100 ? '...' : ''}</p>
            </div>`;
    }).join('');
    elements.historyContainer.scrollTop = elements.historyContainer.scrollHeight;
}

// --- Utility Functions ---
function setLoading(isLoading) {
    state.isLoading = isLoading;
    elements.loader.classList.toggle('hidden', !isLoading);
    elements.btnText.textContent = isLoading ? 'Generating...' : 'Generate Solution';
    elements.generateBtn.disabled = isLoading;
    elements.generateBtn.classList.toggle('loading', isLoading);
}

function showMessage(message, bgColor) {
    elements.messageBox.textContent = message;
    elements.messageBox.className = `fixed bottom-5 right-5 text-white py-2 px-4 rounded-lg shadow-lg z-50 ${bgColor}`;
    elements.messageBox.classList.remove('hidden');
    setTimeout(() => elements.messageBox.classList.add('hidden'), 3000);
}

async function fetchWithRetry(url, options, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
        } catch (error) {
            if (i === retries - 1) throw error;
        }
        await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
    }
    throw new Error('API request failed after multiple retries.');
}

function handleAction(action) {
    const input = elements.inputs[state.currentTab === 'debug' ? 'debugCode' : 'solve'];
    if (!input.value.trim()) {
        showMessage('Please enter some code or a query first.', 'bg-yellow-500');
        return;
    }
    let promptPrefix = '';
    if (action === 'explain') promptPrefix = 'Explain the following code:\n';
    if (action === 'comment') promptPrefix = 'Add detailed comments to the following code:\n';
    if (action === 'test') promptPrefix = 'Write unit tests for the following code:\n';
    input.value = promptPrefix + input.value;
    handleGeneration();
}

function copyCode(codeElement, button) {
     navigator.clipboard.writeText(codeElement.innerText).then(() => {
        button.innerText = 'Copied!';
        showMessage('Code copied to clipboard!', 'bg-green-500');
        setTimeout(() => { button.innerText = 'Copy'; }, 2000);
    }, () => {
        showMessage('Failed to copy code.', 'bg-red-500');
    });
}

function runCode(code, lang) {
    elements.sandbox.container.classList.remove('hidden');
    const iframeDoc = elements.sandbox.iframe.contentWindow.document;
    if (lang === 'html') {
        iframeDoc.open();
        iframeDoc.write(code);
        iframeDoc.close();
    } else if (lang === 'javascript') {
        iframeDoc.open();
        iframeDoc.write(`<script>${code}<\/script>`);
        iframeDoc.close();
    }
    showMessage('Code executed in sandbox.', 'bg-blue-500');
}
