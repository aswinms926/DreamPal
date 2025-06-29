import json
import requests
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import os
import io

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("API_KEY")

ELEVENLABS_API_KEY = "sk_3cf7d03240be890a90a164406ddf64146d80b1de451d94bf"

MODEL = "deepseek/deepseek-r1-0528:free"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:5500",
    "X-Title": "DreamPal"
}

personality_data = {
    "younger": "",
    "future": ""
}

@app.route("/personalize", methods=["POST"])
def personalize():
    data = request.get_json()
    personality_data["younger"] = data.get("youngerDesc", "")
    personality_data["future"] = data.get("futureDesc", "")
    return jsonify({"status": "success"})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")
    mode = data.get("mode", "dreampal")

    base_prompts = {
        "younger": (
            "You are the user's 8-year-old self — a curious, bubbly, and slightly silly version of them. "
            "You speak in simple, cheerful language like a child. Use lots of emojis, exclamation marks, and ask playful questions."
        ),
        "future": (
            "You are the user's 30-year-old self — wise, calm, and reassuring. You speak with maturity, offering thoughtful insights."
        ),
        "dreampal": "You are DreamPal, a magical, comforting imaginary friend."
    }

    if mode in personality_data:
        extra = personality_data[mode]
        if extra:
            base_prompts[mode] += f"\nHere are some things about your personality: {extra}"

    system_prompt = base_prompts.get(mode, "You are a helpful assistant.")

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ]
    }

    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=HEADERS,
            json=payload,
            timeout=15
        )
        res.raise_for_status()
        reply = res.json()["choices"][0]["message"]["content"]
        return jsonify({"reply": reply})
    except Exception as e:
        print("🔴 OpenRouter error:", e)
        return jsonify({"reply": "DreamPal is offline 🚧"}), 500

@app.route("/speak", methods=["POST"])
def speak():
    data = request.get_json()
    text = data["text"]
    voice_id = data["voiceId"]

    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.7
        }
    }

    try:
        res = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream",
            headers={
                "xi-api-key": ELEVENLABS_API_KEY,
                "Content-Type": "application/json"
            },
            json=payload
        )
        res.raise_for_status()
        return send_file(io.BytesIO(res.content), mimetype="audio/mpeg")
    except Exception as e:
        print("🔴 ElevenLabs error:", e)
        return jsonify({"error": "TTS failed"}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
