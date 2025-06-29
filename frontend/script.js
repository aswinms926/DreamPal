const BACKEND_URL = "https://dreampal-backend.onrender.com";

const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const modeSelect = document.getElementById("mode-select");
const micBtn = document.getElementById("mic-btn");
const chatContainer = document.getElementById("chat-container");
const personalizeBox = document.getElementById("personalize-box");
const personalizeForm = document.getElementById("personalize-form");
const splineContainer = document.getElementById("spline-container");

let selectedMode = "younger";
let userPersona = {
  pastKeywords: "",
  futureKeywords: ""
};

const voiceIds = {
  younger: "vGQNBgLaiM3EdZtxIiuY",    
  future: "DMyrgzQFny3JI1Y1paM5"      
};

window.addEventListener("DOMContentLoaded", () => {
  const splineScript = document.createElement("script");
  splineScript.type = "module";
  splineScript.src = "https://unpkg.com/@splinetool/viewer@0.9.502/build/spline-viewer.js";
  document.body.appendChild(splineScript);

  splineScript.onload = () => {
    const splineViewer = document.createElement("spline-viewer");
    splineViewer.setAttribute("url", "https://prod.spline.design/eBOVqs0KOls032xn/scene.splinecode");
    splineViewer.className = "spline-bg";
    splineContainer.appendChild(splineViewer);

    splineContainer.style.display = "block";
    personalizeBox.style.display = "block";
  };
});

modeSelect.addEventListener("change", () => {
  selectedMode = modeSelect.value;
});

personalizeForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const past = document.getElementById("past-keywords").value.trim();
  const future = document.getElementById("future-keywords").value.trim();

  userPersona.pastKeywords = past || "";
  userPersona.futureKeywords = future || "";

  personalizeBox.style.display = "none";
  chatContainer.style.display = "block";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage(userMessage, "user");
  input.value = "";
  appendMessage("DreamPal is thinking... 🤔", "bot");

  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        mode: selectedMode,
        past: userPersona.pastKeywords,
        future: userPersona.futureKeywords
      })
    });

    const data = await res.json();
    removeLastBotMessage();

    const cleanedReply = data.reply.replace(/\*/g, "").trim();
    appendMessage(cleanedReply, "bot");

    speakWithVoice(cleanedReply, voiceIds[selectedMode]);
  } catch (err) {
    removeLastBotMessage();
    appendMessage("DreamPal is offline right now 🚧", "bot");
    console.error(err);
  }
});

function appendMessage(message, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = message;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLastBotMessage() {
  const botMessages = document.querySelectorAll(".message.bot");
  if (botMessages.length > 0) {
    botMessages[botMessages.length - 1].remove();
  }
}

async function speakWithVoice(text, voiceId) {
  try {
    const res = await fetch(`${BACKEND_URL}/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId })
    });

    const arrayBuffer = await res.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  } catch (err) {
    console.error("🛑 TTS error:", err);
  }
}

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.interimResults = false;

micBtn.addEventListener("click", () => {
  recognition.start();
});

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  input.value = transcript;
};
