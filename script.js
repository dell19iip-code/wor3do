function sendMessage() {
    const input = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");

    const message = input.value.trim();

    if (message === "") {
        return;
    }

    const userMessage = document.createElement("div");
    userMessage.className = "message";

    userMessage.innerHTML = 
        <div class="avatar">Y</div>
        <div class="message-content">
            <strong>You</strong>
            <p>${message}</p>
        </div>
    ;

    chatBox.appendChild(userMessage);

    input.value = "";

    setTimeout(() => {
        const wor3doMessage = document.createElement("div");
        wor3doMessage.className = "message wor3do-message";

        wor3doMessage.innerHTML = 
            <div class="avatar">W</div>
            <div class="message-content">
                <strong>Wor3do</strong>
                <p>I received your message. AI features are coming soon!</p>
            </div>
        ;

        chatBox.appendChild(wor3doMessage);

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth"
        });

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

    if (input.files.length > 0) {
        const fileName = input.files[0].name;

        const chatBox = document.getElementById("chatBox");

        const message = document.createElement("div");
        message.className = "message";

        message.innerHTML = 
            <div class="avatar">Y</div>
            <div class="message-content">
                <strong>You</strong>
                <p>📷 Uploaded: ${fileName}</p>
            </div>
        ;

        chatBox.appendChild(message);
    }
}


function newChat() {
    const chatBox = document.getElementById("chatBox");

    chatBox.innerHTML = 
        <div class="message wor3do-message">
            <div class="avatar">W</div>
            <div class="message-content">
                <strong>Wor3do</strong>
                <p>
                    Hi! I'm Wor3do. Tell me what you want to create.
                </p>
            </div>
        </div>
    ;
}
