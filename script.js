"use strict";

const WORKER_URL = "https://lingering-silence-36cd.dell19iip.workers.dev/";

const STORAGE = {
    conversation: "wor3do_conversation_v2",
    courses: "wor3do_courses_v2",
    profile: "wor3do_profile_v2",
    settings: "wor3do_settings_v2",
    posts: "wor3do_posts_v2"
};

const DEFAULT_SETTINGS = {
    saveChat: true,
    saveCourses: true,
    courseNotifications: true,
    communityNotifications: true,
    theme: "light"
};

const DEFAULT_PROFILE = {
    name: "",
    about: ""
};

const DEFAULT_POSTS = [
    {
        id: crypto.randomUUID(),
        name: "Alex",
        avatar: "A",
        time: "2h ago",
        title: "How I learned Python with AI",
        body: "I used AI to create a learning plan and practice every day.",
        category: "learning",
        likes: 124,
        comments: 18
    },
    {
        id: crypto.randomUUID(),
        name: "Maria",
        avatar: "M",
        time: "5h ago",
        title: "My complete photography course",
        body: "Built my first course with Wor3do. Starting from the basics.",
        category: "learning",
        likes: 89,
        comments: 12
    },
    {
        id: crypto.randomUUID(),
        name: "James",
        avatar: "J",
        time: "1d ago",
        title: "Understanding the universe",
        body: "A simple explanation of black holes, galaxies, and space.",
        category: "popular",
        likes: 201,
        comments: 31
    },
    {
        id: crypto.randomUUID(),
        name: "Nora",
        avatar: "N",
        time: "1d ago",
        title: "A visual study system that actually works",
        body: "I turned my notes into a simple weekly workflow and creative dashboard.",
        category: "creative",
        likes: 76,
        comments: 9
    },
    {
        id: crypto.randomUUID(),
        name: "Sam",
        avatar: "S",
        time: "2d ago",
        title: "My first AI project",
        body: "Started with one idea, tested it with AI, and shipped a working prototype.",
        category: "popular",
        likes: 153,
        comments: 24
    },
    {
        id: crypto.randomUUID(),
        name: "Lina",
        avatar: "L",
        time: "3d ago",
        title: "30 days of learning design",
        body: "A practical learning path for beginners who want to understand design fundamentals.",
        category: "learning",
        likes: 67,
        comments: 7
    }
];

let conversation = [];
let courses = [];
let posts = [];
let profile = { ...DEFAULT_PROFILE };
let settings = { ...DEFAULT_SETTINGS };
let selectedImage = null;
let isSending = false;
let currentExploreCategory = "all";

document.addEventListener("DOMContentLoaded", init);

function init() {
    loadState();
    bindEvents();
    applyTheme();
    updateProfileUI();
    renderConversation();
    renderCourses();
    renderPosts();
    setupInput();
    setupImageUpload();
}

function bindEvents() {
    document.querySelectorAll("[data-page]").forEach(button => {
        button.addEventListener("click", () => showPage(button.dataset.page));
    });

    document.querySelector("[data-page-link='chat']")?.addEventListener("click", event => {
        event.preventDefault();
        showPage("chat");
    });

    document.getElementById("newChatButton").addEventListener("click", newChat);

    document.getElementById("mobileNewChatButton").addEventListener("click", newChat);

    document.getElementById("profileShortcut").addEventListener("click", () => {
        showPage("settings");
        setSettingsPanel("profile");
    });

    document.getElementById("openSidebarButton").addEventListener("click", toggleSidebar);

    document.getElementById("mobileBackdrop").addEventListener("click", closeSidebar);

    document.getElementById("attachButton").addEventListener("click", () => {
        document.getElementById("imageInput").click();
    });

    document.getElementById("sendButton").addEventListener("click", sendMessage);

    document.getElementById("openCourseCreatorButton").addEventListener("click", openCourseCreator);

    document.getElementById("closeCourseCreatorButton").addEventListener("click", closeCourseCreator);

    document.getElementById("createCourseButton").addEventListener("click", createCourse);

    document.getElementById("exploreTabs").addEventListener("click", event => {
        const tab = event.target.closest("[data-category]");

        if (!tab) {
            return;
        }

        currentExploreCategory = tab.dataset.category;

        document.querySelectorAll("#exploreTabs .tab").forEach(item => {
            item.classList.toggle("active", item === tab);
        });

        renderPosts();
    });

    document.getElementById("createPostButton").addEventListener("click", createPost);

    document.querySelectorAll(".settings-item").forEach(button => {
        button.addEventListener("click", () => {
            setSettingsPanel(button.dataset.settingsPanel);
        });
    });

    document.querySelectorAll("[data-setting-toggle]").forEach(button => {
        button.addEventListener("click", () => {
            const key = button.dataset.settingToggle;

            settings[key] = !settings[key];

            saveSettings();
            updateToggle(button, settings[key]);

            if (key === "saveChat") {
                persistConversation();
            }

            if (key === "saveCourses") {
                saveCourses();
            }
        });
    });

    document.querySelectorAll("[data-theme-choice]").forEach(button => {
        button.addEventListener("click", () => {
            settings.theme = button.dataset.themeChoice;

            saveSettings();
            applyTheme();
        });
    });

    document.getElementById("saveProfileButton").addEventListener("click", saveProfile);

    document.getElementById("clearLocalDataButton").addEventListener("click", clearLocalData);

    document.getElementById("closeCourseDetailButton").addEventListener("click", closeCourseDetail);

    document.getElementById("courseDetailBackdrop").addEventListener("click", event => {
        if (event.target === event.currentTarget) {
            closeCourseDetail();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeSidebar();
            closeCourseCreator();
            closeCourseDetail();
        }
    });
}

function setupInput() {
    const input = document.getElementById("userInput");

    input.addEventListener("input", () => {
        resizeTextarea(input);
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
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif"
        ];

        if (!allowedTypes.includes(file.type)) {
            showToast("Please choose a PNG, JPEG, WEBP, or GIF image.");
            input.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showToast("Images must be 10 MB or smaller.");
            input.value = "";
            return;
        }

        selectedImage = file;
        renderImagePreview(file);
    });
}

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle(
            "active-page",
            section.dataset.pageSection === page
        );
    });

    document.querySelectorAll(".nav-item[data-page]").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.page === page
        );
    });

    closeSidebar();

    if (page === "chat") {
        document.getElementById("userInput").focus();
    }
}

function setSettingsPanel(panel) {
    document.querySelectorAll(".settings-item").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.settingsPanel === panel
        );
    });

    document.querySelectorAll(".settings-content").forEach(content => {
        content.classList.toggle(
            "active",
            content.dataset.settingsContent === panel
        );
    });
}

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("mobile-open");
    document.getElementById("mobileBackdrop").classList.toggle("visible");
}

function closeSidebar() {
    document.getElementById("sidebar").classList.remove("mobile-open");
    document.getElementById("mobileBackdrop").classList.remove("visible");
}

function useSuggestion(text) {
    showPage("chat");

    const input = document.getElementById("userInput");

    input.value = text;

    resizeTextarea(input);

    input.focus();
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

    setSendState(true);

    const userMessage = {
        role: "user",
        content: text || "Please analyze this image."
    };

    if (selectedImage) {
        try {
            userMessage.image = await fileToDataURL(selectedImage);
        } catch {
            isSending = false;
            setSendState(false);
            showToast("The image could not be processed.");
            return;
        }
    }

    conversation.push(userMessage);

    persistConversation();

    clearComposer();

    renderConversation();

    addTypingIndicator();

    try {
        const response = await fetchWithTimeout(
            WORKER_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    messages: conversation.map(message => ({
                        ...message
                    }))
                })
            },
            60000
        );

        const data = await safeJson(response);

        if (!response.ok) {
            throw new Error(
                data?.error ||
                data?.message ||
                `Request failed with status ${response.status}.`
            );
        }

        const output = extractOutput(data);

        if (!output) {
            throw new Error("The AI returned an empty response.");
        }

        conversation.push({
            role: "assistant",
            content: output
        });

        persistConversation();

        renderConversation();
    } catch (error) {
        conversation.push({
            role: "assistant",
            content: `I couldn't complete that request.

${friendlyError(error)}`
        });

        persistConversation();

        renderConversation();
    } finally {
        removeTypingIndicator();

        isSending = false;

        setSendState(false);

        document.getElementById("userInput").focus();
    }
}

function clearComposer() {
    const input = document.getElementById("userInput");
    const fileInput = document.getElementById("imageInput");

    input.value = "";
    input.style.height = "48px";

    selectedImage = null;

    fileInput.value = "";

    document.getElementById("imagePreviewContainer").innerHTML = "";
}

function setSendState(sending) {
    const button = document.getElementById("sendButton");

    button.disabled = sending;

    button.innerHTML = sending
        ? '<span class="spinner"></span>'
        : "<span>↑</span>";
}

function resizeTextarea(input) {
    input.style.height = "auto";

    input.style.height = `${Math.min(
        Math.max(input.scrollHeight, 48),
        180
    )}px`;
}

function renderImagePreview(file) {
    const container = document.getElementById("imagePreviewContainer");

    const url = URL.createObjectURL(file);

    container.innerHTML = `
        <div class="image-chip">
            <img src="${url}" alt="Selected image preview">

            <div>
                <strong>${escapeHTML(file.name)}</strong>
                <small>${formatBytes(file.size)}</small>
            </div>

            <button
                type="button"
                id="removeImageButton"
                aria-label="Remove image"
            >
                ×
            </button>
        </div>
    `;

    document
        .getElementById("removeImageButton")
        .addEventListener("click", clearSelectedImage);
}

function clearSelectedImage() {
    selectedImage = null;

    document.getElementById("imageInput").value = "";

    document.getElementById("imagePreviewContainer").innerHTML = "";
}

function renderConversation() {
    const chatBox = document.getElementById("chatBox");

    if (!conversation.length) {
        chatBox.innerHTML = `
            <div class="welcome-card">
                <div class="welcome-icon">W</div>

                <div class="eyebrow">Your AI workspace</div>

                <h2>What can I help you with?</h2>

                <p>
                    Ask questions, learn something new, plan a project,
                    write, analyze, or simply talk.
                </p>

                <div class="suggestions">
                    <button
                        type="button"
                        data-suggestion="Explain quantum mechanics simply"
                    >
                        Explain something
                    </button>

                    <button
                        type="button"
                        data-suggestion="Help me learn a new skill"
                    >
                        Learn a skill
                    </button>

                    <button
                        type="button"
                        data-suggestion="Give me some creative ideas"
                    >
                        Get ideas
                    </button>

                    <button
                        type="button"
                        data-suggestion="Help me build a complete course"
                    >
                        Build a course
                    </button>
                </div>

                <div class="quick-features">
                    <span>⚡ Fast conversations</span>
                    <span>◈ Image analysis</span>
                    <span>▣ Course creation</span>
                </div>
            </div>
        `;

        chatBox.querySelectorAll("[data-suggestion]").forEach(button => {
            button.addEventListener("click", () => {
                useSuggestion(button.dataset.suggestion);
            });
        });

        return;
    }

    chatBox.innerHTML = "";

    conversation.forEach(message => {
        const wrapper = document.createElement("div");

        wrapper.className =
            `message ${message.role === "user" ? "user-message" : "ai-message"}`;

        const avatar = document.createElement("div");

        avatar.className = "message-avatar";

        avatar.textContent =
            message.role === "user" ? "U" : "W";

        const content = document.createElement("div");

        content.className = "message-content";

        const header = document.createElement("div");

        header.className = "message-meta";

        header.innerHTML = `
            <strong>${message.role === "user" ? "You" : "Wor3do"}</strong>
            <span>${message.role === "user" ? "You" : "AI"}</span>
        `;

        const bubble = document.createElement("div");

        bubble.className = "message-bubble";

        bubble.textContent = message.content || "";

        if (message.image) {
            const image = document.createElement("img");

            image.src = message.image;
            image.className = "message-image";
            image.alt = "Uploaded image";

            bubble.appendChild(image);
        }

        content.appendChild(header);
        content.appendChild(bubble);

        if (message.role === "assistant") {
            const actions = document.createElement("div");

            actions.className = "message-actions";

            const copyButton = document.createElement("button");

            copyButton.type = "button";
            copyButton.textContent = "Copy";

            copyButton.addEventListener("click", async () => {
                await copyText(message.content || "");

                copyButton.textContent = "Copied";

                setTimeout(() => {
                    copyButton.textContent = "Copy";
                }, 1200);
            });

            actions.appendChild(copyButton);

            content.appendChild(actions);
        }

        wrapper.appendChild(avatar);
        wrapper.appendChild(content);

        chatBox.appendChild(wrapper);
    });

    requestAnimationFrame(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function addTypingIndicator() {
    removeTypingIndicator();

    const chatBox = document.getElementById("chatBox");

    const wrapper = document.createElement("div");

    wrapper.id = "typingIndicator";

    wrapper.className = "message ai-message";

    wrapper.innerHTML = `
        <div class="message-avatar">W</div>

        <div class="message-content">
            <div class="message-meta">
                <strong>Wor3do</strong>
                <span>AI</span>
            </div>

            <div class="message-bubble typing-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;

    chatBox.appendChild(wrapper);

    requestAnimationFrame(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

function removeTypingIndicator() {
    document.getElementById("typingIndicator")?.remove();
}

function newChat() {
    if (
        conversation.length &&
        !window.confirm(
            "Start a new chat? Your current conversation will be replaced."
        )
    ) {
        return;
    }

    conversation = [];

    clearSelectedImage();

    persistConversation();

    showPage("chat");

    renderConversation();

    showToast("New chat started.");
}

function loadState() {
    conversation = readStorage(
        STORAGE.conversation,
        []
    );

    courses = readStorage(
        STORAGE.courses,
        []
    );

    posts = readStorage(
        STORAGE.posts,
        []
    );

    profile = {
        ...DEFAULT_PROFILE,
        ...readStorage(STORAGE.profile, {})
    };

    settings = {
        ...DEFAULT_SETTINGS,
        ...readStorage(STORAGE.settings, {})
    };

    if (!Array.isArray(conversation)) {
        conversation = [];
    }

    if (!Array.isArray(courses)) {
        courses = [];
    }

    if (!Array.isArray(posts) || !posts.length) {
        posts = DEFAULT_POSTS;
        savePosts();
    }

    if (!settings.saveChat) {
        conversation = [];
    }
}

function persistConversation() {
    if (!settings.saveChat) {
        localStorage.removeItem(STORAGE.conversation);
        return;
    }

    try {
        localStorage.setItem(
            STORAGE.conversation,
            JSON.stringify(conversation)
        );
    } catch {
        showToast("Chat could not be saved locally.");
    }
}

function saveCourses() {
    if (!settings.saveCourses) {
        localStorage.removeItem(STORAGE.courses);
        return;
    }

    try {
        localStorage.setItem(
            STORAGE.courses,
            JSON.stringify(courses)
        );
    } catch {
        showToast("Course library could not be saved locally.");
    }
}

function savePosts() {
    try {
        localStorage.setItem(
            STORAGE.posts,
            JSON.stringify(posts)
        );
    } catch {}
}

function saveProfileState() {
    try {
        localStorage.setItem(
            STORAGE.profile,
            JSON.stringify(profile)
        );
    } catch {
        showToast("Profile could not be saved locally.");
    }
}

function saveSettings() {
    try {
        localStorage.setItem(
            STORAGE.settings,
            JSON.stringify(settings)
        );
    } catch {
        showToast("Settings could not be saved locally.");
    }
}

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;
    } catch {
        return fallback;
    }
}

function updateProfileUI() {
    const name =
        profile.name.trim() || "Your profile";

    const initials =
        getInitials(profile.name) || "U";

    document.getElementById("sidebarAvatar").textContent = initials;

    document.getElementById("settingsAvatar").textContent = initials;

    document.getElementById("sidebarProfileName").textContent = name;

    document.getElementById("settingsProfileTitle").textContent = name;

    document.getElementById("settingsProfileSubtitle").textContent =
        profile.about.trim() ||
        "Customize your profile below.";

    document.getElementById("displayNameInput").value =
        profile.name;

    document.getElementById("aboutInput").value =
        profile.about;
}

function saveProfile() {
    profile = {
        name: document.getElementById("displayNameInput").value.trim(),
        about: document.getElementById("aboutInput").value.trim()
    };

    saveProfileState();

    updateProfileUI();

    showToast("Profile changes saved.");
}

function applyTheme() {
    document.documentElement.dataset.theme =
        settings.theme === "dark"
            ? "dark"
            : "light";

    document.querySelectorAll("[data-theme-choice]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.themeChoice === settings.theme
        );
    });

    document.querySelectorAll("[data-setting-toggle]").forEach(button => {
        const key = button.dataset.settingToggle;

        updateToggle(
            button,
            !!settings[key]
        );
    });
}

function updateToggle(button, enabled) {
    button.classList.toggle("active", enabled);

    button.setAttribute(
        "aria-pressed",
        String(enabled)
    );
}

function renderCourses() {
    const list = document.getElementById("coursesList");

    const count = courses.length;

    document.getElementById("courseCountLabel").textContent =
        `${count} ${count === 1 ? "course" : "courses"}`;

    if (!count) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">▣</div>

                <h2>Your courses</h2>

                <p>
                    Courses you create will appear here.
                    Start with a topic and let AI build the structure.
                </p>

                <button
                    class="secondary-button"
                    id="emptyCreateCourseButton"
                    type="button"
                >
                    Create your first course
                </button>
            </div>
        `;

        document
            .getElementById("emptyCreateCourseButton")
            .addEventListener("click", openCourseCreator);

        return;
    }

    list.innerHTML = "";

    courses.forEach(course => {
        const card = document.createElement("article");

        card.className = "course-card";

        const title = document.createElement("h3");

        title.textContent =
            course.title || course.topic;

        const meta = document.createElement("div");

        meta.className = "course-card-meta";

        meta.innerHTML = `
            <span>${escapeHTML(course.level)}</span>
            <span>•</span>
            <span>${formatDate(course.createdAt)}</span>
        `;

        const preview = document.createElement("p");

        preview.textContent =
            trimText(
                course.content ||
                "AI-generated course roadmap.",
                180
            );

        const footer = document.createElement("div");

        footer.className = "course-card-footer";

        const openButton = document.createElement("button");

        openButton.className =
            "secondary-button small";

        openButton.type = "button";

        openButton.textContent =
            "Open course";

        openButton.addEventListener("click", () => {
            openCourseDetail(course);
        });

        const deleteButton = document.createElement("button");

        deleteButton.className =
            "text-button danger-text";

        deleteButton.type = "button";

        deleteButton.textContent =
            "Delete";

        deleteButton.addEventListener("click", () => {
            deleteCourse(course.id);
        });

        footer.append(
            openButton,
            deleteButton
        );

        card.append(
            title,
            meta,
            preview,
            footer
        );

        list.appendChild(card);
    });
}

function openCourseCreator() {
    showPage("courses");

    const creator =
        document.getElementById("courseCreator");

    creator.classList.add("open");

    creator.setAttribute(
        "aria-hidden",
        "false"
    );

    document.getElementById("courseTopic").focus();
}

function closeCourseCreator() {
    const creator =
        document.getElementById("courseCreator");

    if (!creator.classList.contains("open")) {
        return;
    }

    creator.classList.remove("open");

    creator.setAttribute(
        "aria-hidden",
        "true"
    );
}

async function createCourse() {
    const topicInput =
        document.getElementById("courseTopic");

    const levelInput =
        document.getElementById("courseLevel");

    const button =
        document.getElementById("createCourseButton");

    const topic =
        topicInput.value.trim();

    const level =
        levelInput.value;

    if (!topic) {
        topicInput.focus();

        showToast(
            "Tell me what you want to learn first."
        );

        return;
    }

    button.disabled = true;

    button.textContent =
        "Creating…";

    try {
        const prompt =
            `Create a complete ${level} course about "${topic}". Give the course a clear title and create 8 to 12 lessons. For every lesson, include a short description and the main topics to learn. End with a practical final project or assessment.`;

        const response = await fetchWithTimeout(
            WORKER_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    message: prompt
                })
            },
            60000
        );

        const data =
            await safeJson(response);

        if (!response.ok) {
            throw new Error(
                data?.error ||
                data?.message ||
                `Course creation failed with status ${response.status}.`
            );
        }

        const content =
            extractOutput(data);

        if (!content) {
            throw new Error(
                "The AI returned an empty course."
            );
        }

        const course = {
            id: crypto.randomUUID(),
            topic,
            level,
            title: extractCourseTitle(
                content,
                topic
            ),
            content,
            createdAt: Date.now()
        };

        courses.unshift(course);

        saveCourses();

        renderCourses();

        closeCourseCreator();

        topicInput.value = "";

        if (settings.courseNotifications) {
            showToast(
                "Course created successfully."
            );
        }
    } catch (error) {
        showToast(
            friendlyError(error)
        );
    } finally {
        button.disabled = false;

        button.textContent =
            "Create with AI";
    }
}

function extractCourseTitle(content, fallback) {
    const firstLine =
        content
            .split("\n")
            .map(line => line.trim())
            .find(Boolean) || "";

    const cleaned =
        firstLine
            .replace(/^#+\s*/, "")
            .replace(/^title\s*:\s*/i, "")
            .trim();

    return cleaned.length > 3 &&
        cleaned.length < 120
        ? cleaned
        : fallback;
}

function deleteCourse(id) {
    const course =
        courses.find(item => item.id === id);

    if (!course) {
        return;
    }

    if (
        !window.confirm(
            `Delete "${course.title || course.topic}"?`
        )
    ) {
        return;
    }

    courses =
        courses.filter(
            item => item.id !== id
        );

    saveCourses();

    renderCourses();

    showToast("Course deleted.");
}

function openCourseDetail(course) {
    document.getElementById(
        "courseDetailTitle"
    ).textContent =
        course.title ||
        course.topic;

    document.getElementById(
        "courseDetailMeta"
    ).textContent =
        `${course.level} · Created ${formatDate(course.createdAt)}`;

    const content =
        document.getElementById(
            "courseDetailContent"
        );

    content.textContent =
        course.content ||
        "No course content available.";

    const backdrop =
        document.getElementById(
            "courseDetailBackdrop"
        );

    backdrop.classList.add("visible");

    backdrop.setAttribute(
        "aria-hidden",
        "false"
    );
}

function closeCourseDetail() {
    const backdrop =
        document.getElementById(
            "courseDetailBackdrop"
        );

    backdrop.classList.remove("visible");

    backdrop.setAttribute(
        "aria-hidden",
        "true"
    );
}

function renderPosts() {
    const grid =
        document.getElementById("postGrid");

    const filtered =
        currentExploreCategory === "all"
            ? posts
            : posts.filter(
                post =>
                    post.category ===
                    currentExploreCategory
            );

    if (!filtered.length) {
        grid.innerHTML = `
            <div class="empty-state compact">
                <h2>No posts yet</h2>
                <p>
                    Nothing is showing in this category right now.
                </p>
            </div>
        `;

        return;
    }

    grid.innerHTML = "";

    filtered.forEach(post => {
        const article =
            document.createElement("article");

        article.className =
            "post-card";

        const header =
            document.createElement("div");

        header.className =
            "post-user";

        const avatar =
            document.createElement("div");

        avatar.className =
            "post-avatar";

        avatar.textContent =
            post.avatar ||
            getInitials(post.name) ||
            "U";

        const identity =
            document.createElement("div");

        identity.innerHTML = `
            <strong>${escapeHTML(post.name)}</strong>
            <span>${escapeHTML(post.time)}</span>
        `;

        header.append(
            avatar,
            identity
        );

        const title =
            document.createElement("h3");

        title.textContent =
            post.title;

        const body =
            document.createElement("p");

        body.textContent =
            post.body;

        const footer =
            document.createElement("div");

        footer.className =
            "post-footer";

        const like =
            document.createElement("button");

        like.type = "button";

        like.innerHTML =
            `♡ ${Number(post.likes || 0)}`;

        like.addEventListener("click", () => {
            toggleLike(
                post.id,
                like
            );
        });

        const comments =
            document.createElement("span");

        comments.textContent =
            `💬 ${Number(post.comments || 0)}`;

        const share =
            document.createElement("button");

        share.type = "button";

        share.textContent =
            "↗ Share";

        share.addEventListener("click", () => {
            sharePost(post);
        });

        footer.append(
            like,
            comments,
            share
        );

        article.append(
            header,
            title,
            body,
            footer
        );

        grid.appendChild(article);
    });
}

function toggleLike(id, button) {
    const post =
        posts.find(item => item.id === id);

    if (!post) {
        return;
    }

    post.likes =
        Number(post.likes || 0) + 1;

    button.innerHTML =
        `♥ ${post.likes}`;

    savePosts();
}

async function sharePost(post) {
    const shareText =
        `${post.title} — ${post.body}`;

    try {
        if (navigator.share) {
            await navigator.share({
                title: post.title,
                text: shareText
            });
        } else {
            await copyText(shareText);
            showToast("Post text copied.");
        }
    } catch {}
}

function createPost() {
    const title =
        window.prompt("Post title");

    if (!title?.trim()) {
        return;
    }

    const body =
        window.prompt("What do you want to share?");

    if (!body?.trim()) {
        return;
    }

    const category =
        window
            .prompt(
                "Category: learning, creative, or popular",
                "creative"
            )
            ?.trim()
            .toLowerCase();

    const safeCategory =
        ["learning", "creative", "popular"].includes(category)
            ? category
            : "creative";

    posts.unshift({
        id: crypto.randomUUID(),
        name:
            profile.name.trim() ||
            "You",
        avatar:
            getInitials(profile.name) ||
            "U",
        time: "Just now",
        title: title.trim(),
        body: body.trim(),
        category: safeCategory,
        likes: 0,
        comments: 0
    });

    savePosts();

    currentExploreCategory =
        "all";

    document
        .querySelectorAll("#exploreTabs .tab")
        .forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.category === "all"
            );
        });

    renderPosts();

    showToast(
        "Post added to Explore."
    );
}

async function clearLocalData() {
    if (
        !window.confirm(
            "Clear local chat history, courses, profile, posts, and settings?"
        )
    ) {
        return;
    }

    Object.values(STORAGE)
        .forEach(key =>
            localStorage.removeItem(key)
        );

    conversation = [];

    courses = [];

    profile = {
        ...DEFAULT_PROFILE
    };

    settings = {
        ...DEFAULT_SETTINGS
    };

    posts = [
        ...DEFAULT_POSTS
    ];

    savePosts();

    renderConversation();

    renderCourses();

    updateProfileUI();

    applyTheme();

    showToast(
        "Local data cleared."
    );
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const area =
            document.createElement("textarea");

        area.value = text;

        area.style.position = "fixed";
        area.style.opacity = "0";

        document.body.appendChild(area);

        area.select();

        const copied =
            document.execCommand("copy");

        area.remove();

        return copied;
    }
}

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader =
            new FileReader();

        reader.onload = () =>
            resolve(reader.result);

        reader.onerror = () =>
            reject(
                new Error(
                    "Image reading failed."
                )
            );

        reader.readAsDataURL(file);
    });
}

async function safeJson(response) {
    const text =
        await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            output: text
        };
    }
}

function extractOutput(data) {
    if (typeof data === "string") {
        return data.trim();
    }

    return String(
        data?.output_text ||
        data?.output ||
        data?.message ||
        data?.content ||
        ""
    ).trim();
}

async function fetchWithTimeout(url, options, timeout) {
    const controller =
        new AbortController();

    const timer =
        setTimeout(
            () => controller.abort(),
            timeout
        );

    try {
        return await fetch(
            url,
            {
                ...options,
                signal: controller.signal
            }
        );
    } finally {
        clearTimeout(timer);
    }
}

function friendlyError(error) {
    if (
        error?.name === "AbortError"
    ) {
        return "The request took too long. Please try again.";
    }

    if (
        error?.message?.includes(
            "Failed to fetch"
        )
    ) {
        return "The AI service could not be reached. Check the worker URL and your internet connection.";
    }

    return (
        error?.message ||
        "Something went wrong. Please try again."
    );
}

function showToast(message) {
    const toast =
        document.getElementById("toast");

    toast.textContent =
        message;

    toast.classList.add("visible");

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(() => {
            toast.classList.remove(
                "visible"
            );
        }, 2800);
}

function getInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
            part =>
                part[0].toUpperCase()
        )
        .join("");
}

function formatBytes(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;
}

function formatDate(timestamp) {
    if (!timestamp) {
        return "Recently";
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    ).format(
        new Date(timestamp)
    );
}

function trimText(text, length) {
    const value =
        String(text || "")
            .replace(/\s+/g, " ")
            .trim();

    return value.length > length
        ? `${value.slice(0, length - 1)}…`
        : value;
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
