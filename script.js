"use strict";

const WORKER_URL = "https://lingering-silence-36cd.dell19iip.workers.dev/";
const STORAGE_KEY = "wor3do_conversation";

let conversation = [];
let selectedImage = null;
let isSending = false;

document.addEventListener("DOMContentLoaded", () => {
    loadConversation();
    setupInput();
    setupImageUpload();
    renderConversation();
});

function setupInput() {
    const input = document.getElementById("userInput");

    input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 160) + "px";
    });

    input.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
}

function setupImageUpload() {
    const input = document.getElementById("imageInput");

    input.addEventListener("change", event => {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        selectedImage = file;

        const container = document.getElementById("imagePreviewContainer");

        const reader = new FileReader();

        reader.onload = event => {
            container.innerHTML = `
                <img class="image-preview" src="${event.target.result}" alt="Selected image">
            `;
        };

        reader.readAsDataURL(file);
    });
}

function showPage(page) {
    document.querySelectorAll(".page").forEach(element => {
        element.classList.remove("active-page");
    });

    document.querySelectorAll(".nav-item").forEach(element => {
        element.classList.remove("active");
    });

    const target = document.getElementById("page-" + page);

    if (target) {
        target.classList.add("active-page");
    }

    const nav = document.querySelector(`.nav-item[data-page="${page}"]`);

    if (nav) {
        nav.classList.add("active");
    }
}

function useSuggestion(text) {
    showPage("chat");

    const input = document.getElementById("userInput");

    input.value = text;
    input.focus();

    input.dispatchEvent(new Event("input"));
}

async function sendMessage() {
    if (isSending) {
        return;
    }

    const input = document.getElementById("userInput");
    const text = input.value.trim();

    if (!text && !selectedImage) {
        return;
    }

    isSending = true;

    const sendButton = document.getElementById("sendButton");
    sendButton.disabled = true;

    const userMessage = {
        role: "user",
        content: text || "Please analyze this image."
    };

    if (selectedImage) {
        userMessage.image = await fileToDataURL(selectedImage);
    }

    conversation.push(userMessage);

    saveConversation();
    renderConversation();

    input.value = "";
    input.style.height = "40px";

    selectedImage = null;

    document.getElementById("imageInput").value = "";
    document.getElementById("imagePreviewContainer").innerHTML = "";

    addTypingIndicator();

    try {
        const messages = conversation.map(message => ({
            role: message.role,
            content: message.content
        }));

        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: messages
            })
        });

        const data = await response.json();

        removeTypingIndicator();

        if (!response.ok) {
            throw new Error(data.error || "The AI request failed.");
        }

        const output = data.output_text || data.output || data.message;

        if (!output) {
            throw new Error("The AI returned an empty response.");
        }

        conversation.push({
            role: "assistant",
            content: output
        });

        saveConversation();
        renderConversation();

    } catch (error) {
        removeTypingIndicator();

        conversation.push({
            role: "assistant",
            content: "Sorry, I couldn't complete that request.\n\n" + error.message
        });

        saveConversation();
        renderConversation();

    } finally {
        isSending = false;
        sendButton.disabled = false;
        input.focus();
    }
}

function renderConversation() {
    const chatBox = document.getElementById("chatBox");

    if (!chatBox) {
        return;
    }

    if (conversation.length === 0) {
        chatBox.innerHTML = `
            <div class="welcome-card">

                <div class="welcome-icon">W</div>

                <h2>What can I help you with?</h2>

                <p>
                    Ask questions, learn something new, create ideas,
                    write, analyze, or simply talk.
                </p>

                <div class="suggestions">
                    <button onclick="useSuggestion('Explain quantum mechanics simply')">
                        Explain something
                    </button>

                    <button onclick="useSuggestion('Help me learn a new skill')">
                        Learn a skill
                    </button>

                    <button onclick="useSuggestion('Give me some creative ideas')">
                        Get ideas
                    </button>
                </div>

            </div>
        `;

        return;
    }

    chatBox.innerHTML = "";

    conversation.forEach(message => {
        const wrapper = document.createElement("div");

        wrapper.className =
            message.role === "user"
                ? "message user"
                : "message ai";

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent =
            message.role === "user" ? "U" : "W";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        bubble.textContent = message.content;

        if (message.image) {
            const image = document.createElement("img");

            image.src = message.image;
            image.className = "image-preview";
            image.alt = "Uploaded image";

            bubble.appendChild(document.createElement("br"));
            bubble.appendChild(image);
        }

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);

        chatBox.appendChild(wrapper);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
}

function addTypingIndicator() {
    const chatBox = document.getElementById("chatBox");

    const wrapper = document.createElement("div");

    wrapper.className = "message ai";
    wrapper.id = "typingIndicator";

    wrapper.innerHTML = `
        <div class="message-avatar">W</div>

        <div class="message-bubble">
            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    chatBox.appendChild(wrapper);

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
}

function removeTypingIndicator() {
    const indicator = document.getElementById("typingIndicator");

    if (indicator) {
        indicator.remove();
    }
}

function newChat() {
    conversation = [];
    selectedImage = null;

    saveConversation();

    document.getElementById("userInput").value = "";
    document.getElementById("imagePreviewContainer").innerHTML = "";
    document.getElementById("imageInput").value = "";

    showPage("chat");
    renderConversation();
}

function loadConversation() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            conversation = JSON.parse(saved);

            if (!Array.isArray(conversation)) {
                conversation = [];
            }
        }
    } catch {
        conversation = [];
    }
}

function saveConversation() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(conversation)
    );
}

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

function openCourseCreator() {
    document.getElementById("courseCreator").classList.add("open");
}

function closeCourseCreator() {
    document.getElementById("courseCreator").classList.remove("open");
}

async function createCourse() {
    const topic = document.getElementById("courseTopic").value.trim();
    const level = document.getElementById("courseLevel").value;

    if (!topic) {
        return;
    }

    const button = document.querySelector(
        ".creator-options .primary-button"
    );

    button.disabled = true;
    button.textContent = "Creating...";

    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message:
                    `Create a complete ${level} course about "${topic}". ` +
                    `Give the course a title and create 8 to 12 lessons. ` +
                    `For every lesson, give a short description and the main topics to learn.`
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Course creation failed.");
        }

        const courseText =
            data.output_text ||
            data.output ||
            data.message;

        addCourse(topic, level, courseText);

        document.getElementById("courseTopic").value = "";
        closeCourseCreator();

    } catch (error) {
        alert(error.message);
    } finally {
        button.disabled = false;
        button.textContent = "Create with AI";
    }
}

function addCourse(topic, level, content) {
    const list = document.getElementById("coursesList");

    const empty = list.querySelector(".empty-courses");

    if (empty) {
        empty.remove();
    }

    const card = document.createElement("article");

    card.className = "course-card";

    card.innerHTML = `
        <h3>${escapeHTML(topic)}</h3>
        <p>${escapeHTML(level)} level</p>
        <div class="course-lessons">${escapeHTML(content)}</div>
    `;

    list.prepend(card);
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
