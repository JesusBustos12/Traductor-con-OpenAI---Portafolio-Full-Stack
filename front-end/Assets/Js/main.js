const btn = document.getElementById("btn");
const inputText = document.getElementById("inputText");
const messagesContent = document.querySelector(".chat__messages");
const charCounter = document.getElementById("charCounter");
const limitCount = document.getElementById("limitCount");

let isTranslating = false;

async function fetchLimit() {
    try {
        const response = await fetch("/api/limit");
        const data = await response.json();
        if (data.success && data.remaining !== undefined) {
            limitCount.textContent = data.remaining;
            if (data.remaining <= 0) {
                btn.disabled = true;
                btn.classList.add("btn--disabled");
                inputText.disabled = true;
                inputText.placeholder = "Límite de traducciones alcanzado.";
            }
        }
    } catch (error) {
        console.error("Error al obtener el límite:", error);
    }
}

// Cargar límite al inicio
fetchLimit();

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

// Mostrar mensaje de bienvenida
createMessage(`${getTimestamp()} — Bot: ¡Hola! Soy un asistente de traducción impulsado por OpenAI. Escribe un texto y selecciona el idioma al que deseas traducirlo para comenzar.`, "bot");

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

        if (data.remaining !== undefined) {
            limitCount.textContent = data.remaining;
            if (data.remaining <= 0) {
                inputText.disabled = true;
                inputText.placeholder = "Límite de traducciones alcanzado.";
            }
        }

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
        
        // Mantener deshabilitado si ya no hay traducciones
        if (parseInt(limitCount.textContent) > 0) {
            btn.disabled = false;
            btn.classList.remove("btn--disabled");
        }
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