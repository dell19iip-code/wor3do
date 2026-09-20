"use strict";

const WORKER_URL = "https://lingering-silence-36cd.dell19iip.workers.dev/";
const STORAGE_KEY = "wor3do_conversation_v2";
const MAX_HISTORY = 100;
const MAX_MESSAGE_LENGTH = 10000;
const REQUEST_TIMEOUT = 120000;

let conversation = [];
let isSending = false;
let currentController = null;
let lastFailedMessage = null;
let selectedImage = null;

document.addEventListener("DOMContentLoaded", () => {
    loadConversation();
    setupInputListeners();
    setupImageInput();
    setupGlobalEvents();

    const input = document.getElementById("userInput");

    if (input) {
        input.focus();
    }

    if (conversation.length === 0) {
        addMessage(
            "Wor3do",
            "Hi! I'm Wor3do. What would you like to talk about?",
            "W"
        );
    } else {
        renderConversation();
    }

    updateCharacterCount();
});

function setupInputListeners() {
    const input = document.getElementById("userInput");

    if (!input) {
        return;
    }

    input.addEventListener("keydown", handleEnter);

    input.addEventListener("input", () => {
        updateCharacterCount();
        autoResizeInput();
    });
}

function setupImageInput() {
    const input = document.getElementById("imageInput");

    if (!input) {
        return;
    }

    input.addEventListener("change", imageSelected);
}

function setupGlobalEvents() {
    document.addEventListener("click", event => {
        const button = event.target.closest("[data-copy-code]");

        if (!button) {
            return;
        }

        const code = button.getAttribute("data-copy-code");

        if (!code) {
            return;
        }

        copyToClipboard(decodeURIComponent(code), button);
    });
}

async function sendMessage() {
    if (isSending) {
        return;
    }

    const input = document.getElementById("userInput");

    if (!input) {
        return;
    }

    const message = input.value.trim();

    if (!message && !selectedImage) {
        return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        showTemporaryError(
            `Your message is too long. Maximum length is ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.`
        );
        return;
    }

    isSending = true;
    lastFailedMessage = null;

    setInputState(true);

    const imageToSend = selectedImage;

    const userMessage = {
        role: "user",
        content: message || "[Image attached]",
        timestamp: Date.now()
    };

    conversation.push(userMessage);

    saveConversation();

    addMessage(
        "You",
        message || "Image attached",
        "Y",
        {
            image: imageToSend
        }
    );

    input.value = "";
    updateCharacterCount();
    autoResizeInput();

    clearSelectedImage();
    showTyping();

    try {
        currentController = new AbortController();

        const timeoutId = setTimeout(() => {
            if (currentController) {
                currentController.abort();
            }
        }, REQUEST_TIMEOUT);

        const apiMessages = conversation.map(item => ({
            role: item.role,
            content: item.content
        }));

        if (imageToSend) {
            const lastMessage = apiMessages[apiMessages.length - 1];

            lastMessage.content = [];

            if (message) {
                lastMessage.content.push({
                    type: "text",
                    text: message
                });
            }

            lastMessage.content.push({
                type: "image_url",
                image_url: {
                    url: imageToSend.data
                }
            });
        }

        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                messages: apiMessages
            }),
            signal: currentController.signal
        });

        clearTimeout(timeoutId);

        const data = await parseResponse(response);

        hideTyping();

        if (!response.ok) {
            throw new Error(
                data?.error ||
                data?.message ||
                `AI server returned HTTP ${response.status}.`
            );
        }

        const output = extractAIResponse(data);

        if (!output) {
            throw new Error(
                "The AI server returned an empty response."
            );
        }

        conversation.push({
            role: "assistant",
            content: output,
            timestamp: Date.now()
        });

        trimConversation();
        saveConversation();

        addMessage(
            "Wor3do",
            output,
            "W"
        );

    } catch (error) {
        hideTyping();

        if (error.name === "AbortError") {
            addMessage(
                "Wor3do",
                "The response was stopped.",
                "W"
            );

            conversation.pop();
            saveConversation();

        } else {
            console.error("Wor3do request error:", error);

            lastFailedMessage = {
                message,
                image: imageToSend
            };

            addErrorMessage(
                getFriendlyError(error)
            );

            conversation.pop();
            saveConversation();
        }

    } finally {
        currentController = null;
        isSending = false;

        setInputState(false);

        if (input) {
            input.focus();
        }
    }
}

async function parseResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch {
            throw new Error("The AI server returned invalid JSON.");
        }
    }

    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            output_text: text
        };
    }
}

function extractAIResponse(data) {
    if (!data) {
        return "";
    }

    if (typeof data.output_text === "string") {
        return data.output_text.trim();
    }

    if (typeof data.output === "string") {
        return data.output.trim();
    }

    if (typeof data.response === "string") {
        return data.response.trim();
    }

    if (typeof data.message === "string") {
        return data.message.trim();
    }

    if (
        data.choices &&
        Array.isArray(data.choices) &&
        data.choices.length > 0
    ) {
        const choice = data.choices[0];

        if (choice.message?.content) {
            if (typeof choice.message.content === "string") {
                return choice.message.content.trim();
            }

            if (Array.isArray(choice.message.content)) {
                return choice.message.content
                    .map(part => part.text || "")
                    .join("")
                    .trim();
            }
        }

        if (typeof choice.text === "string") {
            return choice.text.trim();
        }
    }

    return "";
}

function addMessage(name, text, letter, options = {}) {
    const chatBox = document.getElementById("chatBox");

    if (!chatBox) {
        return null;
    }

    const message = document.createElement("div");
    message.className = "message";
    message.dataset.role =
        name === "You" ? "user" : "assistant";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = letter || "?";

    const content = document.createElement("div");
    content.className = "message-content";

    const nameElement = document.createElement("strong");
    nameElement.textContent = name;

    content.appendChild(nameElement);

    if (options.image?.data) {
        const image = document.createElement("img");

        image.className = "message-image";
        image.src = options.image.data;
        image.alt = options.image.name || "Uploaded image";
        image.loading = "lazy";

        content.appendChild(image);
    }

    const textElement = document.createElement("div");
    textElement.className = "message-text";

    if (name === "Wor3do") {
        renderMarkdown(textElement, text);
    } else {
        textElement.textContent = text;
    }

    content.appendChild(textElement);

    message.appendChild(avatar);
    message.appendChild(content);

    chatBox.appendChild(message);

    scrollToBottom();

    return message;
}

function addErrorMessage(errorText) {
    const chatBox = document.getElementById("chatBox");

    if (!chatBox) {
        return;
    }

    const message = document.createElement("div");
    message.className = "message error-message";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "W";

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("strong");
    name.textContent = "Wor3do";

    const text = document.createElement("div");
    text.className = "message-text";
    text.textContent = errorText;

    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "retry-button";
    retry.textContent = "Retry";

    retry.addEventListener("click", retryLastMessage);

    content.appendChild(name);
    content.appendChild(text);
    content.appendChild(retry);

    message.appendChild(avatar);
    message.appendChild(content);

    chatBox.appendChild(message);

    scrollToBottom();
}

function renderMarkdown(element, markdown) {
    let text = escapeHTML(String(markdown || ""));
    const codeBlocks = [];

    text = text.replace(
        /```([\w+-]*)\n?([\s\S]*?)```/g,
        (_, language, code) => {
            const index = codeBlocks.length;

            codeBlocks.push({
                language: language || "",
                code: code.trim()
            });

            return `@@CODE_BLOCK_${index}@@`;
        }
    );

    text = text.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    text = text.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    text = text.replace(
        /(?<!\*)\*([^*]+)\*(?!\*)/g,
        "<em>$1</em>"
    );

    text = text.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    text = text.replace(
        /^### (.*)$/gm,
        "<h4>$1</h4>"
    );

    text = text.replace(
        /^## (.*)$/gm,
        "<h3>$1</h3>"
    );

    text = text.replace(
        /^# (.*)$/gm,
        "<h2>$1</h2>"
    );

    text = text.replace(
        /^(?:[-*] .*(?:\n|$))+/gm,
        block => {
            const items = block
                .trim()
                .split("\n")
                .map(line =>
                    line.replace(/^[-*]\s+/, "")
                )
                .map(item => `<li>${item}</li>`)
                .join("");

            return `<ul>${items}</ul>`;
        }
    );

    text = text.replace(
        /^(?:\d+\.\s+.*(?:\n|$))+/gm,
        block => {
            const items = block
                .trim()
                .split("\n")
                .map(line =>
                    line.replace(/^\d+\.\s+/, "")
                )
                .map(item => `<li>${item}</li>`)
                .join("");

            return `<ol>${items}</ol>`;
        }
    );

    text = text.replace(/\n{2,}/g, "</p><p>");
    text = text.replace(/\n/g, "<br>");

    codeBlocks.forEach((block, index) => {
        const encodedCode =
            encodeURIComponent(block.code);

        const language =
            block.language
                ? `<span class="code-language">${escapeHTML(block.language)}</span>`
                : "";

        const codeHTML = `
            <div class="code-block">
                <div class="code-header">
                    ${language}
                    <button
                        type="button"
                        class="copy-code-button"
                        data-copy-code="${encodedCode}"
                    >
                        Copy
                    </button>
                </div>
                <pre><code>${escapeHTML(block.code)}</code></pre>
            </div>
        `;

        text = text.replace(
            `@@CODE_BLOCK_${index}@@`,
            codeHTML
        );
    });

    element.innerHTML = `<p>${text}</p>`;
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showTyping() {
    const chatBox = document.getElementById("chatBox");

    if (!chatBox) {
        return;
    }

    if (document.getElementById("typing")) {
        return;
    }

    const typing = document.createElement("div");
    typing.className = "message typing-message";
    typing.id = "typing";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "W";

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("strong");
    name.textContent = "Wor3do";

    const text = document.createElement("div");
    text.className = "typing-dots";

    text.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    content.appendChild(name);
    content.appendChild(text);

    typing.appendChild(avatar);
    typing.appendChild(content);

    chatBox.appendChild(typing);

    scrollToBottom();
}

function hideTyping() {
    const typing = document.getElementById("typing");

    if (typing) {
        typing.remove();
    }
}

function stopGeneration() {
    if (currentController) {
        currentController.abort();
    }
}

function retryLastMessage() {
    if (!lastFailedMessage || isSending) {
        return;
    }

    const input = document.getElementById("userInput");

    if (!input) {
        return;
    }

    input.value = lastFailedMessage.message || "";

    if (lastFailedMessage.image) {
        selectedImage = lastFailedMessage.image;
    }

    lastFailedMessage = null;

    updateCharacterCount();
    autoResizeInput();

    sendMessage();
}

function handleEnter(event) {
    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
    ) {
        event.preventDefault();

        if (!isSending) {
            sendMessage();
        }
    }
}

function imageSelected(event) {
    const input =
        event?.target ||
        document.getElementById("imageInput");

    if (
        !input ||
        !input.files ||
        input.files.length === 0
    ) {
        return;
    }

    const file = input.files[0];

    if (!file.type.startsWith("image/")) {
        showTemporaryError(
            "Please select an image file."
        );

        input.value = "";
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showTemporaryError(
            "Image is too large. Maximum size is 10 MB."
        );

        input.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        selectedImage = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result
        };

        showImageSelected(file);
    };

    reader.onerror = () => {
        showTemporaryError(
            "I couldn't read that image."
        );
    };

    reader.readAsDataURL(file);
}

function showImageSelected(file) {
    const preview =
        document.getElementById("imagePreview");

    if (!preview || !selectedImage) {
        return;
    }

    preview.innerHTML = "";

    const wrapper =
        document.createElement("div");

    wrapper.className = "selected-image";

    const image =
        document.createElement("img");

    image.src = selectedImage.data;
    image.alt = file.name;

    const remove =
        document.createElement("button");

    remove.type = "button";
    remove.textContent = "×";
    remove.title = "Remove image";

    remove.addEventListener(
        "click",
        clearSelectedImage
    );

    wrapper.appendChild(image);
    wrapper.appendChild(remove);

    preview.appendChild(wrapper);
}

function clearSelectedImage() {
    selectedImage = null;

    const input =
        document.getElementById("imageInput");

    if (input) {
        input.value = "";
    }

    const preview =
        document.getElementById("imagePreview");

    if (preview) {
        preview.innerHTML = "";
    }
}

function newChat() {
    if (isSending) {
        stopGeneration();
    }

    conversation = [];
    lastFailedMessage = null;

    clearSelectedImage();

    localStorage.removeItem(STORAGE_KEY);

    const chatBox =
        document.getElementById("chatBox");

    if (chatBox) {
        chatBox.innerHTML = "";
    }

    addMessage(
        "Wor3do",
        "Hi! I'm Wor3do. What would you like to talk about?",
        "W"
    );

    const input =
        document.getElementById("userInput");

    if (input) {
        input.value = "";
        input.focus();
    }

    updateCharacterCount();
    autoResizeInput();
}

function saveConversation() {
    try {
        const cleanConversation =
            conversation.map(message => ({
                role: message.role,
                content:
                    typeof message.content === "string"
                        ? message.content
                        : "[Image attached]",
                timestamp: message.timestamp
            }));

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(cleanConversation)
        );

    } catch (error) {
        console.warn(
            "Wor3do: Could not save conversation.",
            error
        );
    }
}

function loadConversation() {
    try {
        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            conversation = [];
            return;
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
            conversation = [];
            return;
        }

        conversation = parsed
            .filter(message =>
                message &&
                typeof message.role === "string" &&
                typeof message.content === "string"
            )
            .slice(-MAX_HISTORY);

    } catch (error) {
        console.warn(
            "Wor3do: Could not load saved conversation.",
            error
        );

        conversation = [];
    }
}

function renderConversation() {
    const chatBox =
        document.getElementById("chatBox");

    if (!chatBox) {
        return;
    }

    chatBox.innerHTML = "";

    for (const message of conversation) {
        if (message.role === "user") {
            addMessage(
                "You",
                message.content,
                "Y"
            );
        } else if (message.role === "assistant") {
            addMessage(
                "Wor3do",
                message.content,
                "W"
            );
        }
    }
}

function trimConversation() {
    if (conversation.length > MAX_HISTORY) {
        conversation =
            conversation.slice(-MAX_HISTORY);
    }
}

function setInputState(disabled) {
    const input =
        document.getElementById("userInput");

    const sendButton =
        document.getElementById("sendButton");

    const stopButton =
        document.getElementById("stopButton");

    if (input) {
        input.disabled = disabled;
    }

    if (sendButton) {
        sendButton.disabled = disabled;
    }

    if (stopButton) {
        stopButton.disabled = !disabled;
        stopButton.hidden = !disabled;
    }
}

function updateCharacterCount() {
    const input =
        document.getElementById("userInput");

    const counter =
        document.getElementById("charCount");

    if (!input || !counter) {
        return;
    }

    counter.textContent =
        `${input.value.length.toLocaleString()} / ${MAX_MESSAGE_LENGTH.toLocaleString()}`;
}

function autoResizeInput() {
    const input =
        document.getElementById("userInput");

    if (!input || input.tagName !== "TEXTAREA") {
        return;
    }

    input.style.height = "auto";

    input.style.height =
        Math.min(input.scrollHeight, 220) + "px";
}

function scrollToBottom() {
    const chatBox =
        document.getElementById("chatBox");

    if (!chatBox) {
        return;
    }

    if (
        chatBox.scrollHeight >
        chatBox.clientHeight
    ) {
        chatBox.scrollTo({
            top: chatBox.scrollHeight,
            behavior: "smooth"
        });

        return;
    }

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
}

async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);

        const original =
            button.textContent;

        button.textContent = "Copied!";

        setTimeout(() => {
            button.textContent = original;
        }, 1500);

    } catch (error) {
        console.error(
            "Wor3do: Copy failed.",
            error
        );
    }
}

function getFriendlyError(error) {
    if (!error) {
        return "Something went wrong.";
    }

    const message =
        String(error.message || error);

    if (
        message.includes("Failed to fetch") ||
        message.includes("NetworkError")
    ) {
        return "I couldn't connect to the AI server. Check your internet connection or make sure the Worker is online.";
    }

    if (message.includes("HTTP 429")) {
        return "Too many requests. Please wait a moment and try again.";
    }

    if (message.includes("HTTP 401")) {
        return "The AI server rejected the request.";
    }

    if (message.includes("HTTP 403")) {
        return "The AI server denied access to this request.";
    }

    if (message.includes("HTTP 500")) {
        return "The AI server encountered an internal error.";
    }

    return message;
}

function showTemporaryError(message) {
    const chatBox =
        document.getElementById("chatBox");

    if (!chatBox) {
        alert(message);
        return;
    }

    const error =
        document.createElement("div");

    error.className =
        "temporary-error";

    error.textContent = message;

    chatBox.appendChild(error);

    scrollToBottom();

    setTimeout(() => {
        error.remove();
    }, 4000);
}

window.sendMessage = sendMessage;
window.newChat = newChat;
window.stopGeneration = stopGeneration;
window.handleEnter = handleEnter;
window.imageSelected = imageSelected;
window.retryLastMessage = retryLastMessage;
window.clearSelectedImage = clearSelectedImage;
