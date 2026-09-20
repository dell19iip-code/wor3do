var conversation = [];

var WORKER_URL = "https://lingering-silence-36cd.dell19iip.workers.dev/";

async function sendMessage() {
    var input = document.getElementById("userInput");
    var message = input.value.trim();

    if (message === "") {
        return;
    }

    // Prevent sending another message while waiting
    input.disabled = true;

    // Add user's message to memory
    conversation.push({
        role: "user",
        content: message
    });

    // Show user's message
    addMessage("You", message, "Y");

    // Clear input
    input.value = "";

    // Show thinking indicator
    showTyping();

    try {
        var response = await fetch(WORKER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: conversation
            })
        });

        var data = await response.json();

        hideTyping();

        // Handle HTTP errors
        if (!response.ok) {
            addMessage(
                "Wor3do",
                "Error: " + (data.error || "The AI server returned an error."),
                "W"
            );

            // Remove the user's message if the request failed
            conversation.pop();

            return;
        }

        // Successful AI response
        if (data.output_text) {

            // IMPORTANT:
            // Save Wor3do's response so future messages have memory
            conversation.push({
                role: "assistant",
                content: data.output_text
            });

            addMessage(
                "Wor3do",
                data.output_text,
                "W"
            );

        } else if (data.error) {

            addMessage(
                "Wor3do",
                "Error: " + data.error,
                "W"
            );

            conversation.pop();

        } else {

            addMessage(
                "Wor3do",
                "I received an unexpected response.",
                "W"
            );

            conversation.pop();
        }

    } catch (error) {

        hideTyping();

        addMessage(
            "Wor3do",
            "I couldn't connect to the AI server.",
            "W"
        );

        // Remove failed user message from memory
        conversation.pop();

        console.error("Wor3do connection error:", error);

    } finally {

        // Allow the user to send another message
        input.disabled = false;
        input.focus();
    }
}


function addMessage(name, text, letter) {
    var chatBox = document.getElementById("chatBox");

    if (!chatBox) {
        return;
    }

    var message = document.createElement("div");
    message.className = "message";

    var avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = letter;

    var content = document.createElement("div");
    content.className = "message-content";

    var nameElement = document.createElement("strong");
    nameElement.textContent = name;

    var textElement = document.createElement("p");
    textElement.textContent = text;

    content.appendChild(nameElement);
    content.appendChild(textElement);

    message.appendChild(avatar);
    message.appendChild(content);

    chatBox.appendChild(message);

    // Scroll to newest message
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
}


function showTyping() {
    var chatBox = document.getElementById("chatBox");

    if (!chatBox) {
        return;
    }

    // Don't create duplicates
    if (document.getElementById("typing")) {
        return;
    }

    var typing = document.createElement("div");
    typing.className = "message";
    typing.id = "typing";

    var avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "W";

    var content = document.createElement("div");
    var name = document.createElement("strong");
    name.textContent = "Wor3do";

    var text = document.createElement("p");
    text.textContent = "Wor3do is thinking...";

    content.appendChild(name);
    content.appendChild(text);

    typing.appendChild(avatar);
    typing.appendChild(content);

    chatBox.appendChild(typing);

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
}


function hideTyping() {
    var typing = document.getElementById("typing");

    if (typing) {
        typing.remove();
    }
}


function handleEnter(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}


function imageSelected() {
    var input = document.getElementById("imageInput");

    if (!input || input.files.length === 0) {
        return;
    }

    var file = input.files[0];

    addMessage(
        "You",
        "Uploaded image: " + file.name,
        "Y"
    );
}


function newChat() {
    var chatBox = document.getElementById("chatBox");

    // Clear conversation memory
    conversation = [];

    if (chatBox) {
        chatBox.innerHTML = "";
    }

    // Start fresh conversation
    addMessage(
        "Wor3do",
        "Hi! I'm Wor3do. What would you like to talk about?",
        "W"
    );
}
    content.className = "message-content";
