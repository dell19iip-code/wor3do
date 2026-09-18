function sendMessage() {
    const input = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");

    const message = input.value.trim();

    if (!message) return;

    const userMessage = document.createElement("div");
    userMessage.className = "message";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "Y";

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("strong");
    name.textContent = "You";

    const text = document.createElement("p");
    text.textContent = message;

    content.appendChild(name);
    content.appendChild(text);

    userMessage.appendChild(avatar);
    userMessage.appendChild(content);

    chatBox.appendChild(userMessage);

    input.value = "";

    setTimeout(function () {
        const reply = document.createElement("div");
        reply.className = "message wor3do-message";

        reply.innerHTML = 
            <div class="avatar">W</div>
            <div class="message-content">
                <strong>Wor3do</strong>
                <p>I received your message! 🚀</p>
            </div>
        ;

        chatBox.appendChild(reply);
    }, 500);
}


function handleEnter(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}


function imageSelected() {
    const input = document.getElementById("imageInput");

    if (input.files.length === 0) return;

    const chatBox = document.getElementById("chatBox");

    const message = document.createElement("div");
    message.className = "message";

    message.innerHTML = 
        <div class="avatar">Y</div>
        <div class="message-content">
            <strong>You</strong>
            <p>📷 Image uploaded: ${input.files[0].name}</p>
        </div>
    ;

    chatBox.appendChild(message);
}


function newChat() {
    const chatBox = document.getElementById("chatBox");

    chatBox.innerHTML = 
        <div class="message wor3do-message">
            <div class="avatar">W</div>
            <div class="message-content">
                <strong>Wor3do</strong>
                <p>Hi! I'm Wor3do. Tell me what you want to create.</p>
            </div>
        </div>
    ;
}
