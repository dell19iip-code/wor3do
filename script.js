"use strict";

const WORKER_URL = "https://lingering-silence-36cd.dell19iip.workers.dev/";
const STORAGE_KEY = "wor3do_conversation_v3";
const COURSES_KEY = "wor3do_courses_v1";
const MAX_HISTORY = 100;
const MAX_MESSAGE_LENGTH = 10000;
const REQUEST_TIMEOUT = 120000;

let conversation = [];
let courses = [];
let isSending = false;
let currentController = null;
let lastFailedMessage = null;
let selectedImage = null;

document.addEventListener("DOMContentLoaded", () => {
    loadConversation();
    loadCourses();
    setupInput();
    setupImageInput();
    renderCourses();

    if (conversation.length === 0) {
        addMessage(
            "Wor3do",
            "Hi! I'm Wor3do. What would you like to create?",
            "W"
        );
    } else {
        renderConversation();
    }

    updateCharacterCount();
});

function setupInput() {
    const input = document.getElementById("userInput");

    if (!input) {
        return;
    }

    input.addEventListener("keydown", handleEnter);

    input.addEventListener("input", () => {
        updateCharacterCount();
        autoResizeInput();
    });

    input.focus();
}

function setupImageInput() {
    const input = document.getElementById("imageInput");

    if (!input) {
        return;
    }

    input.addEventListener("change", imageSelected);
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
        showTemporaryError("Your message is too long.");
        return;
    }

    isSending = true;
    lastFailedMessage = null;
    setInputState(true);

    const imageToSend = selectedImage;
    const displayText = message || "Image attached";

    conversation.push({
        role: "user",
        content: message || "[Image attached]",
        timestamp: Date.now()
    });

    saveConversation();

    addMessage(
        "You",
        displayText,
        "Y",
        { image: imageToSend }
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

        const apiMessages = conversation
            .map(item => ({
                role: item.role,
                content: item.content
            }))
            .slice(-30);

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

        conversation.pop();
        saveConversation();

        if (error.name === "AbortError") {
            addErrorMessage("The response was stopped.");
        } else {
            lastFailedMessage = {
                message,
                image: imageToSend
            };

            addErrorMessage(
                getFriendlyError(error)
            );
        }

    } finally {
        currentController = null;
        isSending = false;
        setInputState(false);
        input.focus();
    }
}

async function parseResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch {
            throw new Error(
                "The AI server returned invalid JSON."
            );
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

    return "";
}

function addMessage(name, text, letter, options = {}) {
    const chatBox = document.getElementById("chatBox");

    if (!chatBox) {
        return;
    }

    const isUser = name === "You";

    const message = document.createElement("div");
    message.className = isUser
        ? "message user-message"
        : "message assistant-message";

    const avatar = document.createElement("div");
    avatar.className = isUser
        ? "avatar user-avatar"
        : "avatar wor3do-avatar";

    avatar.textContent = letter;

    const content = document.createElement("div");
    content.className = "message-content";

    const nameElement = document.createElement("strong");
    nameElement.textContent = name;

    content.appendChild(nameElement);

    if (options.image?.data) {
        const image = document.createElement("img");

        image.src = options.image.data;
        image.alt = options.image.name || "Uploaded image";

        image.style.maxWidth = "280px";
        image.style.borderRadius = "12px";
        image.style.display = "block";
        image.style.marginBottom = "10px";

        content.appendChild(image);
    }

    const textElement = document.createElement("div");
    textElement.className = "message-text";

    if (isUser) {
        textElement.textContent = text;
    } else {
        renderText(textElement, text);
    }

    content.appendChild(textElement);
    message.appendChild(avatar);
    message.appendChild(content);
    chatBox.appendChild(message);

    scrollToBottom();
}

function renderText(element, text) {
    const escaped = escapeHTML(text);

    element.innerHTML = escaped
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}

function showTyping() {
    const chatBox = document.getElementById("chatBox");

    if (!chatBox || document.getElementById("typing")) {
        return;
    }

    const typing = document.createElement("div");

    typing.id = "typing";
    typing.className = "message assistant-message";

    typing.innerHTML = `
        <div class="avatar wor3do-avatar">W</div>
        <div class="message-content">
            <strong>Wor3do</strong>
            <div class="typing-dots">● ● ●</div>
        </div>
    `;

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
        showImageSelected();
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
        showTemporaryError("Please select an image.");
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

        showImageSelected();
    };

    reader.readAsDataURL(file);
}

function showImageSelected() {
    const preview =
        document.getElementById("imagePreview");

    if (!preview || !selectedImage) {
        return;
    }

    preview.innerHTML = `
        <div class="selected-image">
            <img src="${selectedImage.data}" alt="Selected image">
            <button type="button" onclick="clearSelectedImage()">×</button>
        </div>
    `;
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
        "Hi! I'm Wor3do. What would you like to create?",
        "W"
    );

    const input =
        document.getElementById("userInput");

    if (input) {
        input.value = "";
        input.focus();
    }

    updateCharacterCount();
}

function saveConversation() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                conversation.slice(-MAX_HISTORY)
            )
        );
    } catch (error) {
        console.warn(
            "Could not save conversation.",
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

        conversation = parsed.slice(-MAX_HISTORY);

    } catch {
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

    conversation.forEach(message => {
        if (message.role === "user") {
            addMessage(
                "You",
                message.content,
                "Y"
            );
        } else {
            addMessage(
                "Wor3do",
                message.content,
                "W"
            );
        }
    });
}

function trimConversation() {
    if (conversation.length > MAX_HISTORY) {
        conversation =
            conversation.slice(-MAX_HISTORY);
    }
}

function loadCourses() {
    try {
        const saved =
            localStorage.getItem(COURSES_KEY);

        courses =
            saved ? JSON.parse(saved) : [];

        if (!Array.isArray(courses)) {
            courses = [];
        }
    } catch {
        courses = [];
    }
}

function saveCourses() {
    localStorage.setItem(
        COURSES_KEY,
        JSON.stringify(courses)
    );
}

function renderCourses() {
    const container =
        document.getElementById(
            "coursesContainer"
        );

    const count =
        document.getElementById(
            "courseCount"
        );

    if (!container) {
        return;
    }

    if (count) {
        count.textContent = courses.length;
    }

    if (courses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h2>No courses yet</h2>
                <p>Ask Wor3do to create a complete course.</p>
                <button class="primary-button" onclick="createCourse()">
                    Create my first course
                </button>
            </div>
        `;

        return;
    }

    container.innerHTML =
        courses.map(course => `
            <div class="course-card">
                <h3>${escapeHTML(course.name)}</h3>
                <p>${escapeHTML(course.description)}</p>
                <button
                    class="primary-button"
                    onclick="openCourse('${course.id}')"
                >
                    Open Course
                </button>
            </div>
        `).join("");
}

function createCourse() {
    const name =
        prompt("What should your course be called?");

    if (!name || !name.trim()) {
        return;
    }

    const description =
        prompt("What should the course teach?");

    const course = {
        id: Date.now().toString(),
        name: name.trim(),
        description:
            description?.trim() ||
            "AI-generated course",
        created: Date.now()
    };

    courses.push(course);

    saveCourses();
    renderCourses();
    showPage("courses");
}

function openCourse(id) {
    const course =
        courses.find(item => item.id === id);

    if (!course) {
        return;
    }

    alert(
        `Course: ${course.name}\n\nThe full AI course builder will be connected next.`
    );
}

function showPage(page) {
    document
        .querySelectorAll(".page")
        .forEach(section => {
            section.classList.remove("active-page");
        });

    const target =
        document.getElementById(`page-${page}`);

    if (target) {
        target.classList.add("active-page");
    }

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {
            button.classList.remove("active");

            if (button.dataset.page === page) {
                button.classList.add("active");
            }
        });

    closeSidebar();
}

function showMemory() {
    showPage("memory");
}

function showSettings() {
    showPage("settings");
}

function toggleSidebar() {
    const sidebar =
        document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.classList.toggle("open");
    }
}

function closeSidebar() {
    const sidebar =
        document.querySelector(".sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }
}

function quickPrompt(text) {
    const input =
        document.getElementById("userInput");

    if (!input) {
        return;
    }

    input.value = text;
    input.focus();

    updateCharacterCount();
    autoResizeInput();
}

function googleLogin() {
    alert(
        "Google Sign-in will be connected in the next development step."
    );
}

function clearAllData() {
    const confirmed =
        confirm(
            "Delete your locally stored Wor3do data?"
        );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(COURSES_KEY);

    conversation = [];
    courses = [];

    renderCourses();
    newChat();
}

function setInputState(disabled) {
    const input =
        document.getElementById("userInput");

    const send =
        document.getElementById("sendButton");

    const stop =
        document.getElementById("stopButton");

    if (input) {
        input.disabled = disabled;
    }

    if (send) {
        send.disabled = disabled;
    }

    if (stop) {
        stop.hidden = !disabled;
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

    if (!input) {
        return;
    }

    input.style.height = "auto";

    input.style.height =
        Math.min(input.scrollHeight, 180) + "px";
}

function scrollToBottom() {
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
}

function addErrorMessage(text) {
    const chatBox =
        document.getElementById("chatBox");

    if (!chatBox) {
        return;
    }

    const message =
        document.createElement("div");

    message.className =
        "message assistant-message";

    message.innerHTML = `
        <div class="avatar wor3do-avatar">W</div>
        <div class="message-content">
            <strong>Wor3do</strong>
            <div class="message-text">
                ${escapeHTML(text)}
            </div>
            <br>
            <button
                onclick="retryLastMessage()"
                class="primary-button"
            >
                Retry
            </button>
        </div>
    `;

    chatBox.appendChild(message);

    scrollToBottom();
}

function showTemporaryError(text) {
    alert(text);
}

function getFriendlyError(error) {
    if (!error) {
        return "Something went wrong.";
    }

    const message =
        String(error.message || error);

    if (message.includes("Failed to fetch")) {
        return "I couldn't connect to the AI server.";
    }

    if (message.includes("HTTP 429")) {
        return "Too many requests. Please wait a moment.";
    }

    return message;
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

window.sendMessage = sendMessage;
window.newChat = newChat;
window.stopGeneration = stopGeneration;
window.handleEnter = handleEnter;
window.imageSelected = imageSelected;
window.clearSelectedImage = clearSelectedImage;
window.retryLastMessage = retryLastMessage;
window.showPage = showPage;
window.showMemory = showMemory;
window.showSettings = showSettings;
window.toggleSidebar = toggleSidebar;
window.quickPrompt = quickPrompt;
window.googleLogin = googleLogin;
window.createCourse = createCourse;
window.openCourse = openCourse;
window.clearAllData = clearAllData;
