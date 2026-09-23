"use strict";

const WORKER_URL = "https://lingering-silence-36cd.dell19iip.workers.dev/";

const STORAGE_KEYS = {
    conversation: "wor3do_conversation_v4",
    courses: "wor3do_courses_v4",
    profile: "wor3do_profile_v4",
    settings: "wor3do_settings_v4",
    posts: "wor3do_posts_v4"
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
        id: "p1",
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
        id: "p2",
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
        id: "p3",
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
        id: "p4",
        name: "Emma",
        avatar: "N",
        time: "1d ago",
        title: "A visual study system that actually works",
        body: "I turned my notes into a simple weekly workflow and creative dashboard.",
        category: "creative",
        likes: 76,
        comments: 9
    },
    {
        id: "p5",
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
        id: "p6",
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
let currentCategory = "all";
let toastTimer = null;

window.addEventListener("DOMContentLoaded", init);

function init() {
    loadState();
    bindNavigation();
    bindComposer();
    bindCourseCreator();
    bindExplore();
    bindSettings();
    bindModals();
    applyTheme();
    updateProfileUI();
    renderConversation();
    renderCourses();
    renderPosts();
}

function bindNavigation() {
    document.querySelectorAll("[data-page]").forEach(element => {
        element.addEventListener("click", event => {
            const page = element.dataset.page;

            if (!page) {
                return;
            }

            if (element.tagName === "A") {
                event.preventDefault();
            }

            showPage(page);
        });
    });

    document.getElementById("newChatButton").addEventListener("click", newChat);

    document.getElementById("mobileNewChatButton").addEventListener("click", newChat);

    document.getElementById("profileShortcut").addEventListener("click", () => {
        showPage("settings");
        setSettingsPanel("profile");
    });

    document.getElementById("openSidebarButton").addEventListener("click", openSidebar);

    document.getElementById("mobileOverlay").addEventListener("click", closeSidebar);
}

function bindComposer() {
    const input = document.getElementById("userInput");
    const imageInput = document.getElementById("imageInput");

    document.getElementById("attachButton").addEventListener("click", () => {
        imageInput.click();
    });

    document.getElementById("sendButton").addEventListener("click", sendMessage);

    input.addEventListener("input", () => {
        resizeTextarea(input);
    });

    input.addEventListener("keydown", event => {
        if (event.key !== "Enter") {
            return;
        }

        if (event.shiftKey) {
            return;
        }

        event.preventDefault();

        if (!isSending) {
            sendMessage();
        }
    });

    imageInput.addEventListener("change", handleImageSelection);
}

function bindCourseCreator() {
    document
        .getElementById("openCourseCreatorButton")
        .addEventListener("click", openCourseCreator);

    document
        .getElementById("closeCourseCreatorButton")
        .addEventListener("click", closeCourseCreator);

    document
        .getElementById("courseForm")
        .addEventListener("submit", event => {
            event.preventDefault();
            createCourse();
        });
}

function bindExplore() {
    document
        .getElementById("exploreTabs")
        .addEventListener("click", event => {
            const tab = event.target.closest("[data-category]");

            if (!tab) {
                return;
            }

            currentCategory = tab.dataset.category;

            document
                .querySelectorAll("#exploreTabs .tab")
                .forEach(button => {
                    button.classList.toggle(
                        "active",
                        button === tab
                    );
                });

            renderPosts();
        });

    document
        .getElementById("createPostButton")
        .addEventListener("click", () => {
            openModal("postModal");
        });

    document
        .getElementById("postForm")
        .addEventListener("submit", event => {
            event.preventDefault();
            publishPost();
        });
}

function bindSettings() {
    document
        .querySelectorAll("[data-settings-panel]")
        .forEach(button => {
            button.addEventListener("click", () => {
                setSettingsPanel(
                    button.dataset.settingsPanel
                );
            });
        });

    document
        .querySelectorAll("[data-toggle-key]")
        .forEach(button => {
            button.addEventListener("click", () => {
                toggleSetting(
                    button.dataset.toggleKey
                );
            });
        });

    document
        .querySelectorAll("[data-theme]")
        .forEach(button => {
            button.addEventListener("click", () => {
                settings.theme = button.dataset.theme;
                saveSettings();
                applyTheme();
                showToast(
                    `${capitalize(settings.theme)} theme enabled.`
                );
            });
        });

    document
        .getElementById("saveProfileButton")
        .addEventListener("click", saveProfile);

    document
        .getElementById("clearLocalDataButton")
        .addEventListener("click", clearLocalData);
}

function bindModals() {
    document
        .querySelectorAll("[data-close-modal]")
        .forEach(button => {
            button.addEventListener("click", () => {
                closeModal(button.dataset.closeModal);
            });
        });

    document
        .querySelectorAll(".modal-backdrop")
        .forEach(backdrop => {
            backdrop.addEventListener("click", event => {
                if (event.target === backdrop) {
                    closeModal(backdrop.id);
                }
            });
        });

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") {
            return;
        }

        closeSidebar();

        document
            .querySelectorAll(".modal-backdrop.visible")
            .forEach(modal => {
                closeModal(modal.id);
            });
    });
}

function showPage(page) {
    document
        .querySelectorAll("[data-page-section]")
        .forEach(section => {
            section.classList.toggle(
                "active",
                section.dataset.pageSection === page
            );
        });

    document
        .querySelectorAll(".nav-item[data-page]")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.page === page
            );
        });

    closeSidebar();

    if (page === "chat") {
        setTimeout(() => {
            document.getElementById("userInput").focus();
        }, 0);
    }
}

function openSidebar() {
    document
        .getElementById("sidebar")
        .classList.add("open");

    document
        .getElementById("mobileOverlay")
        .classList.add("visible");
}

function closeSidebar() {
    document
        .getElementById("sidebar")
        .classList.remove("open");

    document
        .getElementById("mobileOverlay")
        .classList.remove("visible");
}

async function sendMessage() {
    if (isSending) {
        return;
    }

    const input =
        document.getElementById("userInput");

    const text =
        input.value.trim();

    if (!text && !selectedImage) {
        input.focus();
        return;
    }

    isSending = true;

    setComposerLoading(true);

    const userMessage = {
        role: "user",
        content:
            text ||
            "Please analyze this image."
    };

    try {
        if (selectedImage) {
            userMessage.image =
                await prepareImage(selectedImage);
        }

        conversation.push(userMessage);

        trimConversation();
        persistConversation();

        clearComposer();
        renderConversation();
        addTypingIndicator();

        const payload = {
            messages:
                conversation.map(message => ({
                    ...message
                }))
        };

        const response =
            await fetchWithTimeout(
                WORKER_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify(payload)
                },
                60000
            );

        const data =
            await parseResponse(response);

        if (!response.ok) {
            throw new Error(
                data?.error ||
                data?.message ||
                `Request failed with status ${response.status}.`
            );
        }

        const output =
            extractOutput(data);

        if (!output) {
            throw new Error(
                "The AI returned an empty response."
            );
        }

        conversation.push({
            role: "assistant",
            content: output
        });

        trimConversation();
        persistConversation();
        renderConversation();
    } catch (error) {
        removeTypingIndicator();

        const message =
            friendlyError(error);

        conversation.push({
            role: "assistant",
            content:
                `I couldn't complete that request.\n\n${message}`
        });

        trimConversation();
        persistConversation();
        renderConversation();
    } finally {
        isSending = false;

        setComposerLoading(false);

        removeTypingIndicator();

        input.focus();
    }
}

function renderConversation() {
    const chatBox =
        document.getElementById("chatBox");

    if (!conversation.length) {
        chatBox.innerHTML = `
            <div class="welcome-card">
                <span class="welcome-icon">W</span>

                <div class="eyebrow">
                    Your AI workspace
                </div>

                <h2>
                    What can I help you with?
                </h2>

                <p>
                    Ask questions, learn something new,
                    plan a project, write, analyze,
                    or simply talk.
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

        chatBox
            .querySelectorAll("[data-suggestion]")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        const input =
                            document.getElementById(
                                "userInput"
                            );

                        input.value =
                            button.dataset.suggestion;

                        resizeTextarea(input);

                        input.focus();
                    }
                );
            });

        return;
    }

    chatBox.innerHTML = "";

    conversation.forEach(message => {
        const wrapper =
            document.createElement("article");

        wrapper.className =
            `message ${
                message.role === "user"
                    ? "user-message"
                    : "ai-message"
            }`;

        const avatar =
            document.createElement("div");

        avatar.className =
            "message-avatar";

        avatar.textContent =
            message.role === "user"
                ? "U"
                : "W";

        const content =
            document.createElement("div");

        content.className =
            "message-content";

        const meta =
            document.createElement("div");

        meta.className =
            "message-meta";

        meta.innerHTML =
            `<strong>${
                message.role === "user"
                    ? "You"
                    : "Wor3do"
            }</strong><span>${
                message.role === "user"
                    ? "You"
                    : "AI"
            }</span>`;

        const bubble =
            document.createElement("div");

        bubble.className =
            "message-bubble";

        bubble.textContent =
            message.content || "";

        if (message.image) {
            const image =
                document.createElement("img");

            image.className =
                "message-image";

            image.src =
                message.image;

            image.alt =
                "Uploaded image";

            image.loading =
                "lazy";

            bubble.appendChild(image);
        }

        content.appendChild(meta);
        content.appendChild(bubble);

        if (
            message.role ===
            "assistant"
        ) {
            const actions =
                document.createElement("div");

            actions.className =
                "message-actions";

            const copyButton =
                document.createElement("button");

            copyButton.type =
                "button";

            copyButton.textContent =
                "Copy";

            copyButton.addEventListener(
                "click",
                async () => {
                    const copied =
                        await copyText(
                            message.content || ""
                        );

                    copyButton.textContent =
                        copied
                            ? "Copied"
                            : "Copy failed";

                    setTimeout(() => {
                        copyButton.textContent =
                            "Copy";
                    }, 1400);
                }
            );

            actions.appendChild(
                copyButton
            );

            content.appendChild(
                actions
            );
        }

        wrapper.appendChild(avatar);
        wrapper.appendChild(content);

        chatBox.appendChild(wrapper);
    });

    requestAnimationFrame(() => {
        window.scrollTo({
            top:
                document.documentElement
                    .scrollHeight,
            behavior: "smooth"
        });
    });
}

function addTypingIndicator() {
    removeTypingIndicator();

    const chatBox =
        document.getElementById("chatBox");

    const wrapper =
        document.createElement("article");

    wrapper.id =
        "typingIndicator";

    wrapper.className =
        "message ai-message";

    wrapper.innerHTML = `
        <div class="message-avatar">
            W
        </div>

        <div class="message-content">
            <div class="message-meta">
                <strong>Wor3do</strong>
                <span>AI</span>
            </div>

            <div class="message-bubble typing-bubble">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    chatBox.appendChild(wrapper);

    requestAnimationFrame(() => {
        window.scrollTo({
            top:
                document.documentElement
                    .scrollHeight,
            behavior: "smooth"
        });
    });
}

function removeTypingIndicator() {
    document
        .getElementById("typingIndicator")
        ?.remove();
}

function newChat() {
    if (
        conversation.length &&
        !window.confirm(
            "Start a new chat? Your current conversation will be cleared."
        )
    ) {
        return;
    }

    conversation = [];

    clearComposer();
    persistConversation();

    showPage("chat");
    renderConversation();

    showToast(
        "New chat started."
    );
}

function handleImageSelection(event) {
    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    const validTypes = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif"
    ];

    if (!validTypes.includes(file.type)) {
        showToast(
            "Please choose a PNG, JPEG, WEBP, or GIF image."
        );

        event.target.value = "";

        return;
    }

    if (
        file.size >
        10 * 1024 * 1024
    ) {
        showToast(
            "Images must be 10 MB or smaller."
        );

        event.target.value = "";

        return;
    }

    selectedImage = file;

    renderImagePreview(file);
}

function renderImagePreview(file) {
    const container =
        document.getElementById(
            "imagePreviewContainer"
        );

    const url =
        URL.createObjectURL(file);

    container.innerHTML = `
        <div class="image-chip">
            <img
                src="${url}"
                alt="Selected image preview"
            >

            <div>
                <strong>
                    ${escapeHTML(file.name)}
                </strong>

                <small>
                    ${formatBytes(file.size)}
                </small>
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
        .addEventListener(
            "click",
            clearSelectedImage
        );
}

function clearSelectedImage() {
    selectedImage = null;

    document.getElementById(
        "imageInput"
    ).value = "";

    document.getElementById(
        "imagePreviewContainer"
    ).innerHTML = "";
}

function clearComposer() {
    const input =
        document.getElementById(
            "userInput"
        );

    input.value = "";

    input.style.height =
        "48px";

    clearSelectedImage();
}

function resizeTextarea(input) {
    input.style.height =
        "auto";

    input.style.height =
        `${Math.min(
            Math.max(
                input.scrollHeight,
                48
            ),
            180
        )}px`;
}

function setComposerLoading(loading) {
    const button =
        document.getElementById(
            "sendButton"
        );

    const input =
        document.getElementById(
            "userInput"
        );

    const attach =
        document.getElementById(
            "attachButton"
        );

    button.disabled =
        loading;

    attach.disabled =
        loading;

    button.classList.toggle(
        "loading",
        loading
    );

    input.disabled =
        loading;
}

async function prepareImage(file) {
    const dataUrl =
        await fileToDataURL(file);

    if (
        !dataUrl.startsWith(
            "data:image/"
        )
    ) {
        throw new Error(
            "Invalid image data."
        );
    }

    try {
        const image =
            await loadImage(dataUrl);

        const maxDimension =
            1280;

        const scale =
            Math.min(
                1,
                maxDimension /
                    Math.max(
                        image.width,
                        image.height
                    )
            );

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            Math.max(
                1,
                Math.round(
                    image.width *
                        scale
                )
            );

        canvas.height =
            Math.max(
                1,
                Math.round(
                    image.height *
                        scale
                )
            );

        const context =
            canvas.getContext(
                "2d",
                {
                    alpha: false
                }
            );

        context.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return canvas.toDataURL(
            "image/jpeg",
            0.82
        );
    } catch {
        return dataUrl;
    }
}

function loadImage(dataUrl) {
    return new Promise(
        (resolve, reject) => {
            const image =
                new Image();

            image.onload = () =>
                resolve(image);

            image.onerror = () =>
                reject(
                    new Error(
                        "Image could not be loaded."
                    )
                );

            image.src =
                dataUrl;
        }
    );
}

function loadState() {
    settings = {
        ...DEFAULT_SETTINGS,
        ...readStorage(
            STORAGE_KEYS.settings,
            {}
        )
    };

    profile = {
        ...DEFAULT_PROFILE,
        ...readStorage(
            STORAGE_KEYS.profile,
            {}
        )
    };

    const savedConversation =
        readStorage(
            STORAGE_KEYS.conversation,
            []
        );

    const savedCourses =
        readStorage(
            STORAGE_KEYS.courses,
            []
        );

    const savedPosts =
        readStorage(
            STORAGE_KEYS.posts,
            []
        );

    conversation =
        Array.isArray(
            savedConversation
        ) && settings.saveChat
            ? savedConversation
            : [];

    courses =
        Array.isArray(
            savedCourses
        )
            ? savedCourses
            : [];

    posts =
        Array.isArray(
            savedPosts
        ) && savedPosts.length
            ? savedPosts
            : clonePosts();

    normalizeConversation();
    normalizeCourses();
    savePosts();
}

function normalizeConversation() {
    conversation =
        conversation
            .filter(
                item =>
                    item &&
                    (
                        item.role ===
                            "user" ||
                        item.role ===
                            "assistant"
                    )
            )
            .map(item => ({
                role:
                    item.role,

                content:
                    String(
                        item.content ||
                        ""
                    ),

                ...(item.image
                    ? {
                          image:
                              String(
                                  item.image
                              )
                      }
                    : {})
            }))
            .slice(-80);
}

function normalizeCourses() {
    courses =
        courses.filter(
            course =>
                course &&
                course.id &&
                course.content
        );
}

function persistConversation() {
    if (!settings.saveChat) {
        localStorage.removeItem(
            STORAGE_KEYS.conversation
        );

        return;
    }

    try {
        localStorage.setItem(
            STORAGE_KEYS.conversation,
            JSON.stringify(
                conversation.slice(-80)
            )
        );
    } catch {
        const textOnly =
            conversation.map(
                ({ role, content }) => ({
                    role,
                    content
                })
            );

        try {
            localStorage.setItem(
                STORAGE_KEYS.conversation,
                JSON.stringify(textOnly)
            );
        } catch {}
    }
}

function saveCourses() {
    if (!settings.saveCourses) {
        localStorage.removeItem(
            STORAGE_KEYS.courses
        );

        return;
    }

    try {
        localStorage.setItem(
            STORAGE_KEYS.courses,
            JSON.stringify(courses)
        );
    } catch {}
}

function savePosts() {
    try {
        localStorage.setItem(
            STORAGE_KEYS.posts,
            JSON.stringify(posts)
        );
    } catch {}
}

function saveSettings() {
    try {
        localStorage.setItem(
            STORAGE_KEYS.settings,
            JSON.stringify(settings)
        );
    } catch {}
}

function saveProfileState() {
    try {
        localStorage.setItem(
            STORAGE_KEYS.profile,
            JSON.stringify(profile)
        );
    } catch {}
}

function readStorage(
    key,
    fallback
) {
    try {
        const value =
            localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;
    } catch {
        return fallback;
    }
}

function trimConversation() {
    if (
        conversation.length >
        80
    ) {
        conversation =
            conversation.slice(-80);
    }
}

function renderCourses() {
    const list =
        document.getElementById(
            "coursesList"
        );

    const count =
        courses.length;

    document.getElementById(
        "courseCountLabel"
    ).textContent =
        `${count} ${
            count === 1
                ? "course"
                : "courses"
        }`;

    if (!count) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    ▣
                </div>

                <h2>
                    Your courses
                </h2>

                <p>
                    Courses you create will
                    appear here. Start with a
                    topic and let AI build
                    the structure.
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
            .getElementById(
                "emptyCreateCourseButton"
            )
            .addEventListener(
                "click",
                openCourseCreator
            );

        return;
    }

    list.innerHTML = "";

    courses.forEach(course => {
        const card =
            document.createElement(
                "article"
            );

        card.className =
            "course-card";

        const title =
            document.createElement(
                "h3"
            );

        title.textContent =
            course.title ||
            course.topic ||
            "Untitled course";

        const meta =
            document.createElement(
                "div"
            );

        meta.className =
            "course-meta";

        meta.textContent =
            `${
                course.level ||
                "Beginner"
            } · ${formatDate(
                course.createdAt
            )}`;

        const description =
            document.createElement(
                "p"
            );

        description.textContent =
            trimText(
                course.content,
                190
            );

        const footer =
            document.createElement(
                "div"
            );

        footer.className =
            "course-footer";

        const openButton =
            document.createElement(
                "button"
            );

        openButton.className =
            "secondary-button small";

        openButton.type =
            "button";

        openButton.textContent =
            "Open course";

        openButton.addEventListener(
            "click",
            () =>
                openCourseModal(
                    course
                )
        );

        const deleteButton =
            document.createElement(
                "button"
            );

        deleteButton.className =
            "text-button danger-text";

        deleteButton.type =
            "button";

        deleteButton.textContent =
            "Delete";

        deleteButton.addEventListener(
            "click",
            () =>
                deleteCourse(
                    course.id
                )
        );

        footer.append(
            openButton,
            deleteButton
        );

        card.append(
            title,
            meta,
            description,
            footer
        );

        list.appendChild(card);
    });
}

function openCourseCreator() {
    showPage("courses");

    const creator =
        document.getElementById(
            "courseCreator"
        );

    creator.classList.add(
        "open"
    );

    creator.setAttribute(
        "aria-hidden",
        "false"
    );

    document
        .getElementById(
            "courseTopic"
        )
        .focus();
}

function closeCourseCreator() {
    const creator =
        document.getElementById(
            "courseCreator"
        );

    creator.classList.remove(
        "open"
    );

    creator.setAttribute(
        "aria-hidden",
        "true"
    );
}

async function createCourse() {
    const topicInput =
        document.getElementById(
            "courseTopic"
        );

    const levelInput =
        document.getElementById(
            "courseLevel"
        );

    const button =
        document.getElementById(
            "createCourseButton"
        );

    const topic =
        topicInput.value.trim();

    const level =
        levelInput.value;

    if (!topic) {
        showToast(
            "Tell me what you want to learn first."
        );

        topicInput.focus();

        return;
    }

    button.disabled =
        true;

    button.textContent =
        "Creating…";

    try {
        const prompt =
            `Create a complete ${level} course about "${topic}". Give the course a clear title and create 8 to 12 lessons. For every lesson, include a short description and the main topics to learn. Include a practical final project or assessment at the end.`;

        const response =
            await fetchWithTimeout(
                WORKER_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        "Accept":
                            "application/json"
                    },
                    body:
                        JSON.stringify({
                            message:
                                prompt
                        })
                },
                60000
            );

        const data =
            await parseResponse(
                response
            );

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
            id: uid(),
            topic,
            level,
            title:
                extractTitle(
                    content,
                    topic
                ),
            content,
            createdAt:
                Date.now()
        };

        courses.unshift(course);

        saveCourses();
        renderCourses();
        closeCourseCreator();

        topicInput.value = "";

        if (
            settings.courseNotifications
        ) {
            showToast(
                "Course created successfully."
            );
        }
    } catch (error) {
        showToast(
            friendlyError(error)
        );
    } finally {
        button.disabled =
            false;

        button.textContent =
            "Create with AI";
    }
}

function extractTitle(
    content,
    fallback
) {
    const firstLine =
        String(content)
            .split("\n")
            .map(line =>
                line.trim()
            )
            .find(Boolean) ||
        "";

    const cleaned =
        firstLine
            .replace(
                /^#+\s*/,
                ""
            )
            .replace(
                /^title\s*:\s*/i,
                ""
            )
            .trim();

    return cleaned.length >= 4 &&
        cleaned.length <= 120
        ? cleaned
        : fallback;
}

function deleteCourse(id) {
    const course =
        courses.find(
            item =>
                item.id === id
        );

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
            item =>
                item.id !== id
        );

    saveCourses();
    renderCourses();

    showToast(
        "Course deleted."
    );
}

function openCourseModal(course) {
    document.getElementById(
        "courseModalTitle"
    ).textContent =
        course.title ||
        course.topic;

    document.getElementById(
        "courseModalMeta"
    ).textContent =
        `${course.level} · Created ${formatDate(
            course.createdAt
        )}`;

    document.getElementById(
        "courseModalContent"
    ).textContent =
        course.content ||
        "No course content available.";

    openModal(
        "courseModal"
    );
}

function renderPosts() {
    const grid =
        document.getElementById(
            "postGrid"
        );

    const filtered =
        currentCategory === "all"
            ? posts
            : posts.filter(
                  post =>
                      post.category ===
                      currentCategory
              );

    if (!filtered.length) {
        grid.innerHTML = `
            <div class="empty-state compact">
                <h2>
                    No posts here yet
                </h2>

                <p>
                    Nothing is showing in
                    this category right now.
                </p>
            </div>
        `;

        return;
    }

    grid.innerHTML = "";

    filtered.forEach(post => {
        const card =
            document.createElement(
                "article"
            );

        card.className =
            "post-card";

        const user =
            document.createElement(
                "div"
            );

        user.className =
            "post-user";

        const avatar =
            document.createElement(
                "div"
            );

        avatar.className =
            "post-avatar";

        avatar.textContent =
            post.avatar ||
            getInitials(
                post.name
            ) ||
            "U";

        const info =
            document.createElement(
                "div"
            );

        info.innerHTML =
            `<strong>${escapeHTML(
                post.name
            )}</strong><span>${escapeHTML(
                post.time
            )}</span>`;

        user.append(
            avatar,
            info
        );

        const title =
            document.createElement(
                "h3"
            );

        title.textContent =
            post.title;

        const body =
            document.createElement(
                "p"
            );

        body.textContent =
            post.body;

        const footer =
            document.createElement(
                "div"
            );

        footer.className =
            "post-footer";

        const likeButton =
            document.createElement(
                "button"
            );

        likeButton.type =
            "button";

        likeButton.textContent =
            `♡ ${Number(
                post.likes || 0
            )}`;

        likeButton.addEventListener(
            "click",
            () =>
                likePost(
                    post.id,
                    likeButton
                )
        );

        const commentCount =
            document.createElement(
                "span"
            );

        commentCount.textContent =
            `💬 ${Number(
                post.comments || 0
            )}`;

        const shareButton =
            document.createElement(
                "button"
            );

        shareButton.type =
            "button";

        shareButton.textContent =
            "↗ Share";

        shareButton.addEventListener(
            "click",
            () =>
                sharePost(post)
        );

        footer.append(
            likeButton,
            commentCount,
            shareButton
        );

        card.append(
            user,
            title,
            body,
            footer
        );

        grid.appendChild(card);
    });
}

function likePost(
    id,
    button
) {
    const post =
        posts.find(
            item =>
                item.id === id
        );

    if (!post) {
        return;
    }

    post.likes =
        Number(
            post.likes || 0
        ) + 1;

    button.textContent =
        `♥ ${post.likes}`;

    savePosts();
}

async function sharePost(post) {
    const text =
        `${post.title} — ${post.body}`;

    try {
        if (navigator.share) {
            await navigator.share({
                title: post.title,
                text
            });
        } else {
            await copyText(text);

            showToast(
                "Post text copied."
            );
        }
    } catch {}
}

function publishPost() {
    const title =
        document.getElementById(
            "postTitle"
        ).value.trim();

    const body =
        document.getElementById(
            "postBody"
        ).value.trim();

    const category =
        document.getElementById(
            "postCategory"
        ).value;

    if (!title || !body) {
        showToast(
            "Please complete the post before publishing."
        );

        return;
    }

    posts.unshift({
        id: uid(),
        name:
            profile.name.trim() ||
            "You",
        avatar:
            getInitials(
                profile.name
            ) ||
            "U",
        time:
            "Just now",
        title,
        body,
        category,
        likes: 0,
        comments: 0
    });

    savePosts();
    renderPosts();

    document
        .getElementById("postForm")
        .reset();

    closeModal(
        "postModal"
    );

    if (
        settings.communityNotifications
    ) {
        showToast(
            "Post published."
        );
    }
}

function setSettingsPanel(
    panel
) {
    document
        .querySelectorAll(
            "[data-settings-panel]"
        )
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.settingsPanel ===
                    panel
            );
        });

    document
        .querySelectorAll(
            "[data-settings-content]"
        )
        .forEach(content => {
            content.classList.toggle(
                "active",
                content.dataset.settingsContent ===
                    panel
            );
        });
}

function toggleSetting(key) {
    if (!(key in settings)) {
        return;
    }

    settings[key] =
        !settings[key];

    if (
        key === "saveChat" &&
        !settings.saveChat
    ) {
        conversation = [];

        localStorage.removeItem(
            STORAGE_KEYS.conversation
        );

        renderConversation();
    }

    if (
        key === "saveCourses" &&
        !settings.saveCourses
    ) {
        localStorage.removeItem(
            STORAGE_KEYS.courses
        );
    }

    saveSettings();
    saveCourses();
    updateSettingsUI();
}

function updateSettingsUI() {
    document
        .querySelectorAll(
            "[data-toggle-key]"
        )
        .forEach(button => {
            const enabled =
                !!settings[
                    button.dataset
                        .toggleKey
                ];

            button.classList.toggle(
                "active",
                enabled
            );

            button.setAttribute(
                "aria-pressed",
                String(enabled)
            );
        });

    document
        .querySelectorAll(
            "[data-theme]"
        )
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.theme ===
                    settings.theme
            );
        });
}

function applyTheme() {
    document.documentElement.dataset.theme =
        settings.theme === "dark"
            ? "dark"
            : "light";

    updateSettingsUI();
}

function saveProfile() {
    profile = {
        name:
            document
                .getElementById(
                    "displayNameInput"
                )
                .value.trim(),

        about:
            document
                .getElementById(
                    "aboutInput"
                )
                .value.trim()
    };

    saveProfileState();
    updateProfileUI();

    showToast(
        "Profile changes saved."
    );
}

function updateProfileUI() {
    const name =
        profile.name.trim() ||
        "Your profile";

    const initials =
        getInitials(
            profile.name
        ) || "U";

    const about =
        profile.about.trim() ||
        "Add a little information about yourself.";

    document.getElementById(
        "sidebarAvatar"
    ).textContent =
        initials;

    document.getElementById(
        "settingsAvatar"
    ).textContent =
        initials;

    document.getElementById(
        "sidebarProfileName"
    ).textContent =
        name;

    document.getElementById(
        "settingsProfileName"
    ).textContent =
        name;

    document.getElementById(
        "settingsProfileAbout"
    ).textContent =
        about;

    document.getElementById(
        "displayNameInput"
    ).value =
        profile.name;

    document.getElementById(
        "aboutInput"
    ).value =
        profile.about;
}

function clearLocalData() {
    if (
        !window.confirm(
            "Clear local chat history, courses, posts, profile, and settings?"
        )
    ) {
        return;
    }

    Object.values(
        STORAGE_KEYS
    ).forEach(key => {
        localStorage.removeItem(
            key
        );
    });

    conversation = [];
    courses = [];
    posts = clonePosts();

    profile = {
        ...DEFAULT_PROFILE
    };

    settings = {
        ...DEFAULT_SETTINGS
    };

    currentCategory =
        "all";

    savePosts();
    saveSettings();
    saveProfileState();

    renderConversation();
    renderCourses();
    renderPosts();
    updateProfileUI();
    applyTheme();

    showToast(
        "Local data cleared."
    );
}

function openModal(id) {
    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.add(
        "visible"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    const firstField =
        modal.querySelector(
            "input, textarea, select"
        );

    setTimeout(() => {
        firstField?.focus();
    }, 0);
}

function closeModal(id) {
    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "visible"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}

function extractOutput(data) {
    if (
        typeof data ===
        "string"
    ) {
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

async function parseResponse(
    response
) {
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

function fetchWithTimeout(
    url,
    options,
    timeout
) {
    const controller =
        new AbortController();

    const timer =
        window.setTimeout(
            () =>
                controller.abort(),
            timeout
        );

    return fetch(
        url,
        {
            ...options,
            signal:
                controller.signal
        }
    ).finally(() =>
        window.clearTimeout(timer)
    );
}

function fileToDataURL(file) {
    return new Promise(
        (resolve, reject) => {
            const reader =
                new FileReader();

            reader.onload = () =>
                resolve(
                    reader.result
                );

            reader.onerror = () =>
                reject(
                    new Error(
                        "Image reading failed."
                    )
                );

            reader.readAsDataURL(
                file
            );
        }
    );
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(
            text
        );

        return true;
    } catch {
        const area =
            document.createElement(
                "textarea"
            );

        area.value =
            text;

        area.setAttribute(
            "readonly",
            ""
        );

        area.style.position =
            "fixed";

        area.style.opacity =
            "0";

        document.body.appendChild(
            area
        );

        area.select();

        const copied =
            document.execCommand(
                "copy"
            );

        area.remove();

        return copied;
    }
}

function friendlyError(error) {
    if (
        error?.name ===
        "AbortError"
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
        document.getElementById(
            "toast"
        );

    toast.textContent =
        message;

    toast.classList.add(
        "visible"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        window.setTimeout(
            () => {
                toast.classList.remove(
                    "visible"
                );
            },
            2800
        );
}

function getInitials(name) {
    return String(
        name || ""
    )
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
            part =>
                part
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");
}

function formatBytes(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (
        bytes <
        1024 * 1024
    ) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
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

function trimText(
    text,
    length
) {
    const value =
        String(
            text || ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    return value.length >
        length
        ? `${value.slice(
              0,
              length - 1
          )}…`
        : value;
}

function escapeHTML(value) {
    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

function uid() {
    return `w_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;
}

function capitalize(value) {
    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}

function clonePosts() {
    return DEFAULT_POSTS.map(
        post => ({
            ...post
        })
    );
}
