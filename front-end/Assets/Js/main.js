const btn = document.getElementById("btn");
const inputText = document.getElementById("inputText");
const messagesContent = document.querySelector(".chat__messages");
const charCounter = document.getElementById("charCounter");

let isTranslating = false;

function getTimestamp() {
    return new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function createMessage(text, type = "bot") {
    const msg = document.createElement("div");
    msg.className = `message message--${type}`;
    msg.textContent = text;
    
    // Add dots if it's the loader
    if (text === "Bot: Traduciendo...") {
        msg.innerHTML = "Bot: Traduciendo <span class='dots'><span></span></span>";
    }

    messagesContent.appendChild(msg);
    messagesContent.scrollTop = messagesContent.scrollHeight;
    return msg;
}

const showLoader = () => {
    return createMessage("Bot: Traduciendo...", "bot");
};

const removeLoader = (loaderElement) => {
    if (loaderElement && loaderElement.parentElement) {
        loaderElement.remove();
    }
};

async function handleTranslation() {
    const text = inputText.value.trim();
    const targetLang = document.getElementById("targetLang").value;

    if (!text || isTranslating) return;

    isTranslating = true;
    btn.classList.add("btn--disabled");
    btn.disabled = true;

    createMessage(`${getTimestamp()} — ${text}`, "user");

    const loaderElement = showLoader();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetLang, text }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        removeLoader(loaderElement);

        if (data.translateText) {
            createMessage(`${getTimestamp()} — Bot: ${data.translateText.trim()}`, "bot");
        } else {
            createMessage("Bot: Error al traducir. Intenta de nuevo.", "bot").classList.add("message--error");
        }

    } catch (error) {
        console.error("Error:", error);
        removeLoader(loaderElement);
        
        if (error.name === "AbortError") {
            createMessage("Bot: La traducción tardó demasiado. Intenta de nuevo.", "bot").classList.add("message--error");
        } else {
            createMessage(`Bot: ${error.message || "Sin conexión o error del servidor."}`, "bot").classList.add("message--error");
        }
    } finally {
        inputText.value = "";
        charCounter.textContent = "0 / 500";
        charCounter.classList.remove("char-counter--warning");
        isTranslating = false;
        btn.disabled = false;
        btn.classList.remove("btn--disabled");
    }
}

btn.addEventListener("click", handleTranslation);

inputText.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleTranslation();
});

inputText.addEventListener("input", () => {
    const length = inputText.value.length;
    charCounter.textContent = `${length} / 500`;
    if (length >= 450) {
        charCounter.classList.add("char-counter--warning");
    } else {
        charCounter.classList.remove("char-counter--warning");
    }
});