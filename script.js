"use strict";

const WORKER_URL = "https://lingering-silence-36cd.dell19iip.workers.dev/";

const STORAGE = {
    conversation: "wor3do_conversation_v5",
    courses: "wor3do_courses_v5",
    profile: "wor3do_profile_v5",
    settings: "wor3do_settings_v5",
    posts: "wor3do_posts_v5",
    interests: "wor3do_explore_interests_v2"
};

const DEFAULT_SETTINGS = {
    saveChat: true,
    saveCourses: true,
    courseNotifications: true,
    communityNotifications: true,
    theme: "light"
};

const DEFAULT_PROFILE = {
    name: "Wor3do User",
    about: ""
};

const REELS = [
    {
        id: "ai-1",
        category: "technology",
        title: "Interesting things you didn't know about AI",
        description: "Discover interesting ideas, tools, and developments in artificial intelligence.",
        creator: "AI Daily",
        creatorInitial: "A",
        tag: "AI • Technology",
        style: "one"
    },
    {
        id: "ai-2",
        category: "business",
        title: "How people are building businesses with AI",
        description: "Ideas and strategies for building products and businesses with artificial intelligence.",
        creator: "Build With AI",
        creatorInitial: "B",
        tag: "Business • AI",
        style: "two"
    },
    {
        id: "ai-3",
        category: "learning",
        title: "Learn something useful in 60 seconds",
        description: "Short educational content selected according to the topics you interact with.",
        creator: "Learn Fast",
        creatorInitial: "L",
        tag: "Learning • Science",
        style: "three"
    },
    {
        id: "ai-4",
        category: "creative",
        title: "How AI is changing creative work",
        description: "Explore new ways artificial intelligence is being used for design, writing, and creative work.",
        creator: "Creative AI",
        creatorInitial: "C",
        tag: "Creative • AI",
        style: "four"
    },
    {
        id: "ai-5",
        category: "technology",
        title: "The future of AI assistants",
        description: "A quick look at how personal AI assistants are evolving.",
        creator: "Future Lab",
        creatorInitial: "F",
        tag: "Technology • Future",
        style: "two"
    },
    {
        id: "ai-6",
        category: "business",
        title: "Small ideas that can become useful products",
        description: "Think about real problems people have and turn them into valuable solutions.",
        creator: "Build Better",
        creatorInitial: "B",
        tag: "Business • Startups",
        style: "three"
    }
];

const DEFAULT_POSTS = [
    {
        id: "post-1",
        name: "Alex",
        avatar: "A",
        time: "2h ago",
        text: "I used AI to create a learning plan and practice every day.",
        likes: 124
    },
    {
        id: "post-2",
        name: "Maria",
        avatar: "M",
        time: "5h ago",
        text: "Built my first complete course with Wor3do. Starting from the basics.",
        likes: 89
    },
    {
        id: "post-3",
        name: "James",
        avatar: "J",
        time: "1d ago",
        text: "A simple explanation of black holes, galaxies, and space can make difficult topics feel much easier.",
        likes: 201
    }
];

let conversation = [];
let courses = [];
let posts = [];
let profile = { ...DEFAULT_PROFILE };
let settings = { ...DEFAULT_SETTINGS };
let interests = "";
let selectedImage = null;
let currentCategory = "for-you";
let isSending = false;
let activeModal = null;
let toastTimer = null;

const $ = selector => document.querySelector(selector);

const $$ = selector => [
    ...document.querySelectorAll(selector)
];

document.addEventListener("DOMContentLoaded", init);

function init() {
    loadState();

    bindNavigation();
    bindChat();
    bindExplore();
    bindCourses();
    bindSettings();
    bindModals();

    applyTheme();
    updateProfile();
    renderConversation();
    renderExplore();
    renderCourses();
}

function bindNavigation() {
    $$(".nav-item").forEach(button => {
        button.addEventListener("click", () => {
            switchPage(button.dataset.page);
        });
    });

    $$("[data-page]").forEach(element => {
        if (element.classList.contains("nav-item")) {
            return;
        }

        element.addEventListener("click", event => {
            event.preventDefault();
            switchPage(element.dataset.page);
        });
    });

    $("#newChatButton")?.addEventListener(
        "click",
        newChat
    );

    $("#mobileNewChatButton")?.addEventListener(
        "click",
        newChat
    );

    $("#profileShortcut")?.addEventListener(
        "click",
        () => {
            switchPage("settings");
            setSettingsTab("profile");
        }
    );

    $("#mobileMenuButton")?.addEventListener(
        "click",
        toggleMobileSidebar
    );

    $("#mobileOverlay")?.addEventListener(
        "click",
        closeMobileSidebar
    );
}

function switchPage(page) {
    if (!page) {
        return;
    }

    $$(".page").forEach(section => {
        section.classList.toggle(
            "active",
            section.dataset.pageSection === page
        );
    });

    $$(".nav-item").forEach(button => {
        const active =
            button.dataset.page === page;

        button.classList.toggle(
            "active",
            active
        );

        if (active) {
            button.setAttribute(
                "aria-current",
                "page"
            );
        } else {
            button.removeAttribute(
                "aria-current"
            );
        }
    });

    closeMobileSidebar();

    if (page === "chat") {
        setTimeout(() => {
            $("#userInput")?.focus();
        }, 0);
    }
}

function toggleMobileSidebar() {
    const sidebar = $("#sidebar");
    const overlay = $("#mobileOverlay");
    const button = $("#mobileMenuButton");

    sidebar?.classList.toggle("open");
    overlay?.classList.toggle("open");

    const open =
        sidebar?.classList.contains("open") || false;

    button?.setAttribute(
        "aria-expanded",
        String(open)
    );
}

function closeMobileSidebar() {
    $("#sidebar")?.classList.remove("open");
    $("#mobileOverlay")?.classList.remove("open");

    $("#mobileMenuButton")?.setAttribute(
        "aria-expanded",
        "false"
    );
}

function bindChat() {
    $("#chatComposer")?.addEventListener(
        "submit",
        event => {
            event.preventDefault();

            if (!isSending) {
                sendMessage();
            }
        }
    );

    $("#userInput")?.addEventListener(
        "input",
        resizeInput
    );

    $("#userInput")?.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {
                event.preventDefault();

                if (!isSending) {
                    $("#chatComposer")?.requestSubmit();
                }
            }
        }
    );

    $("#attachButton")?.addEventListener(
        "click",
        () => {
            $("#imageInput")?.click();
        }
    );

    $("#imageInput")?.addEventListener(
        "change",
        handleImageUpload
    );
}

async function sendMessage() {
    const input = $("#userInput");

    if (!input || isSending) {
        return;
    }

    const text = input.value.trim();

    if (!text && !selectedImage) {
        input.focus();
        return;
    }

    isSending = true;
    setChatLoading(true);

    const userMessage = {
        role: "user",
        content:
            text ||
            "Please analyze this image."
    };

    try {
        if (selectedImage) {
            userMessage.image = selectedImage;
        }

        conversation.push(userMessage);

        trimConversation();
        saveConversation();

        clearComposer();
        renderConversation();

        const loadingId =
            addLoadingMessage();

        const messages =
            conversation
                .slice(-30)
                .map(message => ({
                    role: message.role,
                    content: message.content,
                    ...(message.image
                        ? {
                              image:
                                  message.image
                          }
                        : {})
                }));

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
                    body: JSON.stringify({
                        messages
                    })
                },
                60000
            );

        const data =
            await parseResponse(response);

        removeLoadingMessage(
            loadingId
        );

        if (!response.ok) {
            throw new Error(
                data?.error ||
                data?.message ||
                `AI request failed with status ${response.status}.`
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
        saveConversation();

        renderConversation();
    } catch (error) {
        removeAllLoadingMessages();

        conversation.push({
            role: "assistant",
            content:
                `I couldn't complete that request.\n\n${friendlyError(error)}`
        });

        trimConversation();
        saveConversation();

        renderConversation();
    } finally {
        isSending = false;
        setChatLoading(false);

        setTimeout(() => {
            $("#userInput")?.focus();
        }, 0);
    }
}

function setChatLoading(loading) {
    const sendButton =
        $("#sendButton");

    const attachButton =
        $("#attachButton");

    const input =
        $("#userInput");

    sendButton?.classList.toggle(
        "loading",
        loading
    );

    sendButton &&
        (sendButton.disabled = loading);

    attachButton &&
        (attachButton.disabled = loading);

    input &&
        (input.disabled = loading);
}

function renderConversation() {
    const box =
        $("#chatBox");

    if (!box) {
        return;
    }

    box.innerHTML = "";

    if (!conversation.length) {
        const welcome =
            document.createElement(
                "div"
            );

        welcome.className =
            "welcome-card";

        welcome.innerHTML = `
            <div class="welcome-icon">W</div>

            <div class="page-eyebrow">
                AI WORKSPACE
            </div>

            <h2>
                What can I help you with?
            </h2>

            <p>
                Ask Wor3do to explain something,
                write, plan, brainstorm, analyze,
                or help you learn.
            </p>

            <div class="welcome-suggestions">
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
                    data-suggestion="Help me create a complete course"
                >
                    Build a course
                </button>
            </div>
        `;

        box.appendChild(welcome);

        $$(".welcome-suggestions [data-suggestion]")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        const input =
                            $("#userInput");

                        if (!input) {
                            return;
                        }

                        input.value =
                            button.dataset.suggestion;

                        resizeInput({
                            target: input
                        });

                        input.focus();
                    }
                );
            });

        return;
    }

    conversation.forEach(message => {
        box.appendChild(
            createMessageElement(
                message
            )
        );
    });

    scrollChatToBottom();
}

function createMessageElement(message) {
    const wrapper =
        document.createElement(
            "article"
        );

    wrapper.className =
        `message ${message.role}`;

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        message.role === "user"
            ? getInitials(
                  profile.name
              ) || "U"
            : "W";

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    const meta =
        document.createElement(
            "div"
        );

    meta.className =
        "message-meta";

    meta.innerHTML =
        `<strong>${
            message.role === "user"
                ? "You"
                : "Wor3do"
        }</strong>`;

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";

    if (message.image) {
        const image =
            document.createElement(
                "img"
            );

        image.className =
            "message-image";

        image.src =
            message.image;

        image.alt =
            "Attached image";

        image.loading =
            "lazy";

        bubble.appendChild(
            image
        );
    }

    const text =
        document.createElement(
            "div"
        );

    text.textContent =
        message.content || "";

    bubble.appendChild(
        text
    );

    content.appendChild(
        meta
    );

    content.appendChild(
        bubble
    );

    if (
        message.role ===
        "assistant"
    ) {
        const actions =
            document.createElement(
                "div"
            );

        actions.className =
            "message-actions";

        const copy =
            document.createElement(
                "button"
            );

        copy.type = "button";
        copy.textContent = "Copy";

        copy.addEventListener(
            "click",
            async () => {
                const success =
                    await copyText(
                        message.content ||
                            ""
                    );

                copy.textContent =
                    success
                        ? "Copied"
                        : "Failed";

                setTimeout(() => {
                    copy.textContent =
                        "Copy";
                }, 1200);
            }
        );

        actions.appendChild(
            copy
        );

        content.appendChild(
            actions
        );
    }

    wrapper.appendChild(
        avatar
    );

    wrapper.appendChild(
        content
    );

    return wrapper;
}

function addLoadingMessage() {
    const box =
        $("#chatBox");

    if (!box) {
        return "";
    }

    const id =
        `loading-${Date.now()}`;

    const wrapper =
        document.createElement(
            "article"
        );

    wrapper.className =
        "message assistant";

    wrapper.id =
        id;

    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "message-avatar";

    avatar.textContent =
        "W";

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "message-content";

    const meta =
        document.createElement(
            "div"
        );

    meta.className =
        "message-meta";

    meta.innerHTML =
        "<strong>Wor3do</strong>";

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble typing-bubble";

    bubble.innerHTML =
        "<span></span><span></span><span></span>";

    content.append(
        meta,
        bubble
    );

    wrapper.append(
        avatar,
        content
    );

    box.appendChild(
        wrapper
    );

    scrollChatToBottom();

    return id;
}

function removeLoadingMessage(id) {
    if (!id) {
        return;
    }

    document
        .getElementById(id)
        ?.remove();
}

function removeAllLoadingMessages() {
    document
        .querySelectorAll(
            '[id^="loading-"]'
        )
        .forEach(element =>
            element.remove()
        );
}

function scrollChatToBottom() {
    requestAnimationFrame(() => {
        window.scrollTo({
            top:
                document.documentElement
                    .scrollHeight,
            behavior: "smooth"
        });
    });
}

function resizeInput(event) {
    const input =
        event.target;

    input.style.height =
        "auto";

    input.style.height =
        `${Math.min(
            Math.max(
                input.scrollHeight,
                44
            ),
            160
        )}px`;
}

async function handleImageUpload(event) {
    const file =
        event.target.files?.[0];

    event.target.value = "";

    if (!file) {
        return;
    }

    try {
        selectedImage =
            await prepareImage(file);

        renderImagePreview();

        showToast(
            "Image attached."
        );
    } catch (error) {
        selectedImage =
            null;

        renderImagePreview();

        showToast(
            error.message ||
                "Could not attach image."
        );
    }
}

async function prepareImage(file) {
    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/gif"
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {
        throw new Error(
            "Please use PNG, JPEG, WEBP, or GIF."
        );
    }

    if (
        file.size >
        10 * 1024 * 1024
    ) {
        throw new Error(
            "The image must be smaller than 10 MB."
        );
    }

    return resizeImage(
        file,
        1280
    );
}

function resizeImage(
    file,
    maxDimension
) {
    return new Promise(
        (resolve, reject) => {
            const reader =
                new FileReader();

            reader.onerror =
                () =>
                    reject(
                        new Error(
                            "Could not read image."
                        )
                    );

            reader.onload = () => {
                const image =
                    new Image();

                image.onerror =
                    () =>
                        reject(
                            new Error(
                                "Could not process image."
                            )
                        );

                image.onload =
                    () => {
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
                                "2d"
                            );

                        if (!context) {
                            reject(
                                new Error(
                                    "Image processing is unavailable."
                                )
                            );

                            return;
                        }

                        context.drawImage(
                            image,
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        );

                        resolve(
                            canvas.toDataURL(
                                "image/jpeg",
                                0.85
                            )
                        );
                    };

                image.src =
                    reader.result;
            };

            reader.readAsDataURL(
                file
            );
        }
    );
}

function renderImagePreview() {
    const container =
        $("#imagePreview");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!selectedImage) {
        return;
    }

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "image-preview-item";

    const image =
        document.createElement(
            "img"
        );

    image.src =
        selectedImage;

    image.alt =
        "Selected image";

    const label =
        document.createElement(
            "span"
        );

    label.textContent =
        "Image attached";

    const remove =
        document.createElement(
            "button"
        );

    remove.type = "button";

    remove.className =
        "image-preview-remove";

    remove.textContent =
        "×";

    remove.setAttribute(
        "aria-label",
        "Remove attached image"
    );

    remove.addEventListener(
        "click",
        clearSelectedImage
    );

    wrapper.append(
        image,
        label,
        remove
    );

    container.appendChild(
        wrapper
    );
}

function clearSelectedImage() {
    selectedImage =
        null;

    renderImagePreview();
}

function clearComposer() {
    const input =
        $("#userInput");

    if (input) {
        input.value = "";
        input.style.height = "44px";
    }

    clearSelectedImage();
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

    saveConversation();

    clearComposer();

    switchPage("chat");

    renderConversation();

    showToast(
        "New chat started."
    );
}

function loadState() {
    conversation =
        readStorage(
            STORAGE.conversation,
            []
        );

    courses =
        readStorage(
            STORAGE.courses,
            []
        );

    posts =
        readStorage(
            STORAGE.posts,
            null
        );

    profile = {
        ...DEFAULT_PROFILE,
        ...readStorage(
            STORAGE.profile,
            {}
        )
    };

    settings = {
        ...DEFAULT_SETTINGS,
        ...readStorage(
            STORAGE.settings,
            {}
        )
    };

    interests =
        readStorage(
            STORAGE.interests,
            ""
        );

    if (!Array.isArray(conversation)) {
        conversation = [];
    }

    if (!Array.isArray(courses)) {
        courses = [];
    }

    if (
        !Array.isArray(posts)
    ) {
        posts =
            cloneDefaultPosts();

        savePosts();
    }
}

function saveConversation() {
    if (!settings.saveChat) {
        localStorage.removeItem(
            STORAGE.conversation
        );

        return;
    }

    try {
        localStorage.setItem(
            STORAGE.conversation,
            JSON.stringify(
                conversation.slice(-60)
            )
        );
    } catch {
        try {
            localStorage.setItem(
                STORAGE.conversation,
                JSON.stringify(
                    conversation.map(
                        message => ({
                            role:
                                message.role,
                            content:
                                message.content
                        })
                    )
                )
            );
        } catch {}
    }
}

function saveCourses() {
    if (!settings.saveCourses) {
        localStorage.removeItem(
            STORAGE.courses
        );

        return;
    }

    writeStorage(
        STORAGE.courses,
        courses
    );
}

function savePosts() {
    writeStorage(
        STORAGE.posts,
        posts
    );
}

function saveProfile() {
    writeStorage(
        STORAGE.profile,
        profile
    );
}

function saveSettings() {
    writeStorage(
        STORAGE.settings,
        settings
    );
}

function bindExplore() {
    $("#exploreRefresh")?.addEventListener(
        "click",
        () => {
            renderExplore(true);
            showToast("Feed refreshed.");
        }
    );

    $("#exploreCustomizeButton")?.addEventListener(
        "click",
        () => {
            const input =
                $("#exploreInterestsInput");

            if (input) {
                input.value =
                    interests;
            }

            openModal(
                "exploreCustomizeModal"
            );
        }
    );

    $("#exploreCustomizeForm")?.addEventListener(
        "submit",
        event => {
            event.preventDefault();

            interests =
                $("#exploreInterestsInput")
                    ?.value.trim() ||
                "";

            writeStorage(
                STORAGE.interests,
                interests
            );

            closeModal(
                "exploreCustomizeModal"
            );

            renderExplore();

            showToast(
                "Feed preferences saved."
            );
        }
    );

    $$(".explore-tab").forEach(
        button => {
            button.addEventListener(
                "click",
                () => {
                    currentCategory =
                        button.dataset.category;

                    $$(".explore-tab")
                        .forEach(
                            tab => {
                                const active =
                                    tab ===
                                    button;

                                tab.classList.toggle(
                                    "active",
                                    active
                                );
                            }
                        );

                    renderExplore();
                }
            );
        }
    );

    $("#createPostButton")?.addEventListener(
        "click",
        () =>
            openModal(
                "createPostModal"
            )
    );
}

function renderExplore(
    shuffle = false
) {
    const feed =
        $("#reelsFeed");

    const empty =
        $("#exploreEmpty");

    if (!feed) {
        return;
    }

    let reels = [
        ...REELS
    ];

    if (
        currentCategory !==
        "for-you"
    ) {
        reels =
            reels.filter(
                reel =>
                    reel.category ===
                    currentCategory
            );
    }

    if (
        currentCategory ===
            "for-you" &&
        interests
    ) {
        const words =
            interests
                .toLowerCase()
                .split(
                    /[,\s]+/
                )
                .filter(Boolean);

        reels.sort(
            (a, b) =>
                scoreReel(
                    b,
                    words
                ) -
                scoreReel(
                    a,
                    words
                )
        );
    }

    if (shuffle) {
        reels.sort(
            () =>
                Math.random() -
                0.5
        );
    }

    feed.innerHTML = "";

    reels.forEach(
        reel =>
            feed.appendChild(
                createReelElement(
                    reel
                )
            )
    );

    if (empty) {
        empty.hidden =
            reels.length > 0;
    }

    renderPosts();
    updateInterestText();
}

function scoreReel(
    reel,
    words
) {
    const text = [
        reel.title,
        reel.description,
        reel.creator,
        reel.tag,
        reel.category
    ]
        .join(" ")
        .toLowerCase();

    return words.reduce(
        (score, word) =>
            score +
            (text.includes(
                word
            )
                ? 1
                : 0),
        0
    );
}

function createReelElement(
    reel
) {
    const article =
        document.createElement(
            "article"
        );

    article.className =
        "reel-card";

    const media =
        document.createElement(
            "div"
        );

    media.className =
        `reel-media reel-placeholder-${escapeClass(
            reel.style
        )}`;

    const mediaContent =
        document.createElement(
            "div"
        );

    mediaContent.className =
        "reel-placeholder-content";

    mediaContent.innerHTML =
        `<span class="reel-ai-badge">AI PICK</span>`;

    const title =
        document.createElement(
            "h2"
        );

    title.textContent =
        reel.title;

    const subtitle =
        document.createElement(
            "p"
        );

    subtitle.textContent =
        interests
            ? "Personalized for your interests"
            : "Selected for your interests";

    mediaContent.append(
        title,
        subtitle
    );

    media.appendChild(
        mediaContent
    );

    const info =
        document.createElement(
            "div"
        );

    info.className =
        "reel-info";

    const creator =
        document.createElement(
            "div"
        );

    creator.className =
        "reel-creator";

    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "reel-avatar";

    avatar.textContent =
        reel.creatorInitial;

    const creatorText =
        document.createElement(
            "div"
        );

    const creatorName =
        document.createElement(
            "strong"
        );

    creatorName.textContent =
        reel.creator;

    const creatorTag =
        document.createElement(
            "span"
        );

    creatorTag.textContent =
        reel.tag;

    creatorText.append(
        creatorName,
        creatorTag
    );

    creator.append(
        avatar,
        creatorText
    );

    const description =
        document.createElement(
            "p"
        );

    description.className =
        "reel-description";

    description.textContent =
        reel.description;

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "reel-actions";

    const like =
        createActionButton(
            "♡",
            "Like"
        );

    const comment =
        createActionButton(
            "◌",
            "Comment"
        );

    const share =
        createActionButton(
            "↗",
            "Share"
        );

    const save =
        createActionButton(
            "⌑",
            ""
        );

    save.classList.add(
        "reel-save"
    );

    like.addEventListener(
        "click",
        () => {
            like.classList.toggle(
                "active"
            );

            like.firstChild.textContent =
                like.classList.contains(
                    "active"
                )
                    ? "♥ "
                    : "♡ ";
        }
    );

    comment.addEventListener(
        "click",
        () => {
            showToast(
                "Comments are coming soon."
            );
        }
    );

    share.addEventListener(
        "click",
        async () => {
            const text =
                `${reel.title} — ${reel.description}`;

            const shared =
                await shareText(
                    text
                );

            showToast(
                shared
                    ? "Reel shared."
                    : "Could not share."
            );
        }
    );

    save.addEventListener(
        "click",
        () => {
            save.classList.toggle(
                "active"
            );

            save.firstChild.textContent =
                save.classList.contains(
                    "active"
                )
                    ? "▣ "
                    : "⌑ ";
        }
    );

    actions.append(
        like,
        comment,
        share,
        save
    );

    info.append(
        creator,
        description,
        actions
    );

    article.append(
        media,
        info
    );

    return article;
}

function createActionButton(
    icon,
    label
) {
    const button =
        document.createElement(
            "button"
        );

    button.type = "button";

    button.appendChild(
        document.createTextNode(
            `${icon} `
        )
    );

    if (label) {
        const span =
            document.createElement(
                "span"
            );

        span.textContent =
            label;

        button.appendChild(
            span
        );
    }

    return button;
}

function renderPosts() {
    const grid =
        $("#postGrid");

    if (!grid) {
        return;
    }

    grid.innerHTML = "";

    if (!posts.length) {
        grid.hidden = true;
        return;
    }

    const filtered =
        currentCategory ===
        "for-you"
            ? posts
            : posts.filter(
                  post =>
                      post.category ===
                          currentCategory ||
                      currentCategory ===
                          "learning"
                          ? post.category ===
                            "learning"
                          : currentCategory ===
                                "for-you"
                              ? true
                              : false
              );

    if (!filtered.length) {
        grid.hidden = true;
        return;
    }

    filtered.forEach(
        post =>
            grid.appendChild(
                createPostCard(post)
            )
    );

    grid.hidden = false;
}

function createPostCard(post) {
    const article =
        document.createElement(
            "article"
        );

    article.className =
        "post-card";

    const header =
        document.createElement(
            "div"
        );

    header.className =
        "post-card-header";

    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "post-card-avatar";

    avatar.textContent =
        post.avatar;

    const user =
        document.createElement(
            "div"
        );

    user.className =
        "post-card-user";

    const name =
        document.createElement(
            "strong"
        );

    name.textContent =
        post.name;

    const time =
        document.createElement(
            "span"
        );

    time.textContent =
        post.time;

    user.append(
        name,
        time
    );

    header.append(
        avatar,
        user
    );

    const title =
        document.createElement(
            "h3"
        );

    title.textContent =
        post.title ||
        "Community post";

    const body =
        document.createElement(
            "p"
        );

    body.textContent =
        post.text;

    const footer =
        document.createElement(
            "div"
        );

    footer.className =
        "post-card-footer";

    const like =
        document.createElement(
            "button"
        );

    like.type = "button";

    like.textContent =
        `♡ ${post.likes || 0}`;

    like.addEventListener(
        "click",
        () => {
            post.likes =
                Number(
                    post.likes || 0
                ) + 1;

            savePosts();

            like.textContent =
                `♥ ${post.likes}`;
        }
    );

    const share =
        document.createElement(
            "button"
        );

    share.type = "button";
    share.textContent =
        "↗ Share";

    share.addEventListener(
        "click",
        async () => {
            await shareText(
                `${post.title || "Wor3do post"} — ${post.text}`
            );

            showToast(
                "Post copied."
            );
        }
    );

    footer.append(
        like,
        share
    );

    article.append(
        header,
        title,
        body,
        footer
    );

    return article;
}

function updateInterestText() {
    const text =
        $("#exploreInterestText");

    if (!text) {
        return;
    }

    text.textContent =
        interests
            ? `Personalized around: ${interests}`
            : "Wor3do learns what interests you and personalizes your feed.";
}

function bindCourses() {
    $("#createCourseButton")?.addEventListener(
        "click",
        createCourse
    );

    $("#courseTopic")?.addEventListener(
        "keydown",
        event => {
            if (
                event.key ===
                    "Enter" &&
                (
                    event.ctrlKey ||
                    event.metaKey
                )
            ) {
                event.preventDefault();
                createCourse();
            }
        }
    );
}

async function createCourse() {
    const topicInput =
        $("#courseTopic");

    const button =
        $("#createCourseButton");

    const level =
        $("#courseLevel")?.value ||
        "beginner";

    const topic =
        topicInput?.value.trim();

    if (!topic) {
        showToast(
            "Enter a course topic first."
        );

        topicInput?.focus();

        return;
    }

    button.disabled =
        true;

    button.textContent =
        "Creating...";

    try {
        const prompt =
            `Create a complete structured ${level} course about "${topic}". Provide a clear course title, a short introduction, learning objectives, 8 to 10 lessons, a useful description for every lesson, key concepts to study, and a final practical project or assessment. Keep the course organized and useful.`;

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
                            messages: [
                                {
                                    role:
                                        "user",
                                    content:
                                        prompt
                                }
                            ],
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

        const output =
            extractOutput(data);

        if (!output) {
            throw new Error(
                "The AI returned no course."
            );
        }

        const course = {
            id:
                createId(),
            title:
                extractCourseTitle(
                    output,
                    topic
                ),
            topic,
            level,
            content:
                output,
            createdAt:
                Date.now()
        };

        courses.unshift(
            course
        );

        saveCourses();
        renderCourses();

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
            friendlyError(
                error
            )
        );
    } finally {
        button.disabled =
            false;

        button.textContent =
            "Create course";
    }
}

function renderCourses() {
    const list =
        $("#coursesList");

    const count =
        $("#courseCount");

    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (count) {
        count.textContent =
            String(
                courses.length
            );
    }

    if (!courses.length) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    ▣
                </div>

                <h3>
                    No courses yet
                </h3>

                <p>
                    Create your first AI-powered course to build your learning library.
                </p>
            </div>
        `;

        return;
    }

    courses.forEach(
        course => {
            const item =
                document.createElement(
                    "article"
                );

            item.className =
                "course-item";

            const header =
                document.createElement(
                    "div"
                );

            header.className =
                "course-item-header";

            const title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                course.title;

            const meta =
                document.createElement(
                    "p"
                );

            meta.textContent =
                `${capitalize(
                    course.level
                )} · ${formatDate(
                    course.createdAt
                )}`;

            header.append(
                title
            );

            const headerWrap =
                document.createElement(
                    "div"
                );

            headerWrap.append(
                header
            );

            const description =
                document.createElement(
                    "div"
                );

            description.className =
                "course-item-description";

            description.textContent =
                trimText(
                    course.content,
                    180
                );

            const actions =
                document.createElement(
                    "div"
                );

            actions.className =
                "course-item-actions";

            const open =
                document.createElement(
                    "button"
                );

            open.type = "button";

            open.textContent =
                "Open course";

            open.addEventListener(
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

            deleteButton.type =
                "button";

            deleteButton.className =
                "delete-course";

            deleteButton.textContent =
                "Delete";

            deleteButton.addEventListener(
                "click",
                () =>
                    deleteCourse(
                        course.id
                    )
            );

            actions.append(
                open,
                deleteButton
            );

            item.append(
                headerWrap,
                meta,
                description,
                actions
            );

            list.appendChild(
                item
            );
        }
    );
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
            `Delete "${course.title}"?`
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

function openCourseModal(
    course
) {
    $("#courseModalTitle").textContent =
        course.title;

    $("#courseModalMeta").textContent =
        `${capitalize(
            course.level
        )} · ${formatDate(
            course.createdAt
        )}`;

    $("#courseModalContent").textContent =
        course.content;

    openModal(
        "courseModal"
    );
}

function extractCourseTitle(
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

    const clean =
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

    if (
        clean.length >= 4 &&
        clean.length <= 120
    ) {
        return clean;
    }

    return fallback;
}

function bindSettings() {
    $$(".settings-nav-item")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    setSettingsTab(
                        button.dataset
                            .settingsTab
                    );
                }
            );
        });

    $$("[data-setting]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    toggleSetting(
                        button.dataset
                            .setting
                    );
                }
            );
        });

    $$("[data-theme-choice]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    settings.theme =
                        button.dataset
                            .themeChoice;

                    saveSettings();
                    applyTheme();

                    showToast(
                        `${capitalize(
                            settings.theme
                        )} theme enabled.`
                    );
                }
            );
        });

    $("#saveProfileButton")?.addEventListener(
        "click",
        saveProfileFromForm
    );

    $("#clearDataButton")?.addEventListener(
        "click",
        clearLocalData
    );
}

function setSettingsTab(
    tab
) {
    $$(".settings-nav-item")
        .forEach(button => {
            const active =
                button.dataset
                    .settingsTab ===
                tab;

            button.classList.toggle(
                "active",
                active
            );

            if (active) {
                button.setAttribute(
                    "aria-current",
                    "page"
                );
            } else {
                button.removeAttribute(
                    "aria-current"
                );
            }
        });

    $$(".settings-section")
        .forEach(section => {
            const active =
                section.dataset
                    .settingsSection ===
                tab;

            section.classList.toggle(
                "active",
                active
            );

            section.hidden =
                !active;
        });
}

function toggleSetting(
    key
) {
    if (
        !Object.prototype.hasOwnProperty.call(
            settings,
            key
        )
    ) {
        return;
    }

    settings[key] =
        !settings[key];

    if (
        key === "saveChat" &&
        !settings.saveChat
    ) {
        localStorage.removeItem(
            STORAGE.conversation
        );

        conversation = [];
        renderConversation();
    }

    if (
        key === "saveCourses" &&
        !settings.saveCourses
    ) {
        localStorage.removeItem(
            STORAGE.courses
        );
    }

    saveSettings();
    saveCourses();
    updateSettingsUI();
}

function updateSettingsUI() {
    $$("[data-setting]")
        .forEach(button => {
            const enabled =
                Boolean(
                    settings[
                        button.dataset
                            .setting
                    ]
                );

            button.classList.toggle(
                "active",
                enabled
            );

            button.setAttribute(
                "aria-pressed",
                String(enabled)
            );
        });

    $$("[data-theme-choice]")
        .forEach(button => {
            const active =
                button.dataset
                    .themeChoice ===
                settings.theme;

            button.classList.toggle(
                "active",
                active
            );

            button.setAttribute(
                "aria-pressed",
                String(active)
            );
        });
}

function applyTheme() {
    document.documentElement.dataset.theme =
        settings.theme ===
        "dark"
            ? "dark"
            : "light";

    updateSettingsUI();
}

function saveProfileFromForm() {
    profile = {
        name:
            $("#displayNameInput")
                ?.value.trim() ||
            "Wor3do User",

        about:
            $("#aboutInput")
                ?.value.trim() ||
            ""
    };

    saveProfile();
    updateProfile();

    renderConversation();

    showToast(
        "Profile saved."
    );
}

function updateProfile() {
    const name =
        profile.name ||
        "Wor3do User";

    const initials =
        getInitials(name) ||
        "W";

    $("#sidebarAvatar").textContent =
        initials;

    $("#settingsAvatar").textContent =
        initials;

    $("#sidebarProfileName").textContent =
        name;

    $("#settingsProfileName").textContent =
        name;

    $("#displayNameInput").value =
        profile.name;

    $("#aboutInput").value =
        profile.about;
}

function clearLocalData() {
    if (
        !window.confirm(
            "Clear your local chat history, courses, posts, profile, preferences, and feed interests?"
        )
    ) {
        return;
    }

    Object.values(
        STORAGE
    ).forEach(key =>
        localStorage.removeItem(
            key
        )
    );

    conversation = [];
    courses = [];
    posts =
        cloneDefaultPosts();

    profile = {
        ...DEFAULT_PROFILE
    };

    settings = {
        ...DEFAULT_SETTINGS
    };

    interests = "";

    savePosts();
    saveProfile();
    saveSettings();

    renderConversation();
    renderCourses();
    renderExplore();

    updateProfile();
    applyTheme();

    showToast(
        "Local data cleared."
    );
}

function bindModals() {
    $("#createPostForm")
        ?.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                publishPost();
            }
        );

    $$(".modal-close")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const modal =
                        button.closest(
                            ".modal"
                        );

                    if (modal) {
                        closeModal(
                            modal.id
                        );
                    }
                }
            );
        });

    $$("[data-modal-close]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    closeModal(
                        button.dataset
                            .modalClose
                    );
                }
            );
        });

    $$(".modal-backdrop")
        .forEach(backdrop => {
            backdrop.addEventListener(
                "click",
                () => {
                    const modal =
                        backdrop.closest(
                            ".modal"
                        );

                    if (modal) {
                        closeModal(
                            modal.id
                        );
                    }
                }
            );
        });

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key ===
                "Escape"
            ) {
                if (activeModal) {
                    closeModal(
                        activeModal
                    );
                }

                closeMobileSidebar();
            }
        }
    );
}

function publishPost() {
    const text =
        $("#postText")
            ?.value.trim();

    if (!text) {
        showToast(
            "Write something first."
        );

        return;
    }

    const post = {
        id:
            createId(),
        name:
            profile.name ||
            "Wor3do User",
        avatar:
            getInitials(
                profile.name
            ) || "W",
        time:
            "Just now",
        title:
            "Community post",
        text,
        category:
            "for-you",
        likes: 0
    };

    posts.unshift(
        post
    );

    savePosts();

    $("#postText").value =
        "";

    closeModal(
        "createPostModal"
    );

    renderPosts();

    if (
        settings.communityNotifications
    ) {
        showToast(
            "Post published."
        );
    }
}

function openModal(id) {
    const modal =
        document.getElementById(
            id
        );

    if (!modal) {
        return;
    }

    if (
        activeModal &&
        activeModal !== id
    ) {
        closeModal(
            activeModal
        );
    }

    modal.classList.add(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

    activeModal =
        id;

    setTimeout(() => {
        modal
            .querySelector(
                "textarea, input, select"
            )
            ?.focus();
    }, 30);
}

function closeModal(id) {
    const modal =
        document.getElementById(
            id
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (
        activeModal === id
    ) {
        activeModal = null;
    }

    if (
        !document.querySelector(
            ".modal.open"
        )
    ) {
        document.body.classList.remove(
            "modal-open"
        );
    }
}

async function shareText(
    text
) {
    try {
        if (
            navigator.share
        ) {
            await navigator.share({
                title:
                    "Wor3do",
                text
            });

            return true;
        }

        return await copyText(
            text
        );
    } catch {
        return false;
    }
}

async function copyText(
    text
) {
    try {
        await navigator.clipboard.writeText(
            text
        );

        return true;
    } catch {
        const textarea =
            document.createElement(
                "textarea"
            );

        textarea.value =
            text;

        textarea.setAttribute(
            "readonly",
            ""
        );

        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";

        document.body.appendChild(
            textarea
        );

        textarea.select();

        let copied =
            false;

        try {
            copied =
                document.execCommand(
                    "copy"
                );
        } catch {}

        textarea.remove();

        return copied;
    }
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
        return JSON.parse(
            text
        );
    } catch {
        return {
            output:
                text
        };
    }
}

function extractOutput(
    data
) {
    if (
        typeof data ===
        "string"
    ) {
        return data.trim();
    }

    if (
        Array.isArray(
            data?.choices
        )
    ) {
        const choice =
            data.choices[0];

        const content =
            choice?.message
                ?.content;

        if (
            typeof content ===
            "string"
        ) {
            return content.trim();
        }
    }

    return String(
        data?.output_text ||
        data?.output ||
        data?.response ||
        data?.message ||
        data?.content ||
        ""
    ).trim();
}

function fetchWithTimeout(
    url,
    options,
    timeout
) {
    const controller =
        new AbortController();

    const timer =
        setTimeout(
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
    ).finally(
        () =>
            clearTimeout(
                timer
            )
    );
}

function friendlyError(
    error
) {
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
        return "The AI service could not be reached. Check your worker URL and internet connection.";
    }

    return (
        error?.message ||
        "Something went wrong. Please try again."
    );
}

function readStorage(
    key,
    fallback
) {
    try {
        const value =
            localStorage.getItem(
                key
            );

        return value !== null
            ? JSON.parse(value)
            : fallback;
    } catch {
        return fallback;
    }
}

function writeStorage(
    key,
    value
) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(
                value
            )
        );

        return true;
    } catch {
        return false;
    }
}

function getInitials(
    name
) {
    return String(
        name || ""
    )
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part =>
            part
                .charAt(0)
                .toUpperCase()
        )
        .join("");
}

function formatDate(
    value
) {
    if (!value) {
        return "Recently";
    }

    try {
        return new Intl.DateTimeFormat(
            undefined,
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        ).format(
            new Date(
                value
            )
        );
    } catch {
        return "Recently";
    }
}

function trimText(
    value,
    length
) {
    const text =
        String(
            value || ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    return text.length >
        length
        ? `${text.slice(
              0,
              length - 1
          )}…`
        : text;
}

function capitalize(
    value
) {
    const text =
        String(
            value || ""
        );

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}

function createId() {
    return `w_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;
}

function cloneDefaultPosts() {
    return DEFAULT_POSTS.map(
        post => ({
            ...post
        })
    );
}

function escapeClass(
    value
) {
    return String(
        value || ""
    ).replace(
        /[^a-zA-Z0-9_-]/g,
        ""
    );
}

function showToast(
    message
) {
    const toast =
        $("#toast");

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(
            () => {
                toast.classList.remove(
                    "show"
                );
            },
            2800
        );
}
