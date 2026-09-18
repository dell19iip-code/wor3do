function sendMessage() {
    var input = document.getElementById("userInput");
    var chatBox = document.getElementById("chatBox");

    if (input.value.trim() === "") {
        return;
    }

    var message = document.createElement("div");
    message.className = "message";

    var avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "Y";

    var content = document.createElement("div");
    content.className = "message-content";

    var name = document.createElement("strong");
    name.textContent = "You";

    var text = document.createElement("p");
    text.textContent = input.value;

    content.appendChild(name);
    content.appendChild(text);

    message.appendChild(avatar);
    message.appendChild(content);

    chatBox.appendChild(message);

    input.value = "";

    setTimeout(function() {
        var reply = document.createElement("div");
        reply.className = "message";

        var replyAvatar = document.createElement("div");
        replyAvatar.className = "avatar";
        replyAvatar.textContent = "W";

        var replyContent = document.createElement("div");
        replyContent.className = "message-content";

        var replyName = document.createElement("strong");
        replyName.textContent = "Wor3do";

        var replyText = document.createElement("p");
        replyText.textContent = "I received your message!";

        replyContent.appendChild(replyName);
        replyContent.appendChild(replyText);

        reply.appendChild(replyAvatar);
        reply.appendChild(replyContent);

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
    var input = document.getElementById("imageInput");

    if (input.files.length === 0) {
        return;
    }

    var chatBox = document.getElementById("chatBox");

    var message = document.createElement("div");
    message.className = "message";

    var avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "Y";

    var content = document.createElement("div");
    content.className = "message-content";

    var name = document.createElement("strong");
    name.textContent = "You";

    var text = document.createElement("p");
    text.textContent = "Image uploaded: " + input.files[0].name;

    content.appendChild(name);
    content.appendChild(text);

    message.appendChild(avatar);
    message.appendChild(content);

    chatBox.appendChild(message);
}


function newChat() {
    var chatBox = document.getElementById("chatBox");

    chatBox.innerHTML = "";

    var message = document.createElement("div");
    message.className = "message";

    var avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "W";

    var content = document.createElement("div");
    content.className = "message-content";

    var name = document.createElement("strong");
    name.textContent = "Wor3do";

    var text = document.createElement("p");
    text.textContent = "Hi! I'm Wor3do. Tell me what you want to create.";

    content.appendChild(name);
    content.appendChild(text);

    message.appendChild(avatar);
    message.appendChild(content);

    chatBox.appendChild(message);
}
