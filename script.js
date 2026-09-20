var conversation = [];

var WORKER_URL = "https://lingering-silence-36cd.dell19iip.workers.dev/";


async function sendMessage() {
    var input = document.getElementById("userInput");
    var message = input.value.trim();

    if (message === "") {
        return;
    }

    conversation.push({
        role: "user",
        content: message
    });

    addMessage("You", message, "Y");

    input.value = "";

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
                message: message
            })
        });

        var data = await response.json();

        hideTyping();

        if (data.output_text) {
            addMessage("Wor3do", data.output_text, "W");
        } else if (data.error) {
            addMessage("Wor3do", "Error: " + data.error, "W");
        } else {
            addMessage("Wor3do", "I received an unexpected response.", "W");
        }

    } catch (error) {
        hideTyping();

        addMessage(
            "Wor3do",
            "I couldn't connect to the AI server.",
            "W"
        );

        console.error(error);
    }
}


function addMessage(name, text, letter) {
    var chatBox = document.getElementById("chatBox");

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

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
    });
}


function showTyping() {
    var chatBox = document.getElementById("chatBox");

    var typing = document.createElement("div");
    typing.className = "message";
    typing.id = "typing";

    var avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "W";

    var content = document.createElement("div");
    content.className = "message-content";

    var name = document.createElement("strong");
    name.textContent = "Wor3do";

    var text = document.createElement("p");
    text.textContent = "Wor3do is thinking...";

    content.appendChild(name);
    content.appendChild(text);

    typing.appendChild(avatar);
    typing.appendChild(content);

    chatBox.appendChild(typing);
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

    if (input.files.length === 0) {
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

    chatBox.innerHTML = "";

    conversation = [];

    addMessage(
        "Wor3do",
        "Hi! I'm Wor3do. What would you like to talk about?",
        "W"
    );
}
