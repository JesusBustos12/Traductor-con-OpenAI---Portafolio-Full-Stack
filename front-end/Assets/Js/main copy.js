const btn = document.getElementById("btn");

btn.addEventListener("click", async() => {

    const inputText = document.getElementById("inputText");

    const text = inputText.value.trim();
    const targetLang = document.getElementById("targetLang").value;

    if(!text) return false;

    const messagesUser = document.createElement("div");
    messagesUser.className = "message message--user";
    messagesUser.textContent = text;

    const messagesContent = document.querySelector(".chat__messages");
    messagesContent.appendChild(messagesUser);
    messagesContent.scrollTop = messagesContent.scrollHeight;

    try{

        const response = await fetch("/api/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                targetLang,
                text
            })
        });

        const data = await response.json();

        const messagesBot = document.createElement("div");
        messagesBot.className = "message message--bot";
        messagesBot.textContent = "Bot: " + data.translateText;

        messagesContent.appendChild(messagesBot);
        messagesContent.scrollTop = messagesContent.scrollHeight;

    }catch(exception){
        console.log("Error", exception);
    }

    inputText.value = "";

});