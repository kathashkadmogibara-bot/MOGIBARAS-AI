/* =========================================
   MOGIBARA AI PIPELINE
   No Gemini API
   No Claude API
   ========================================= */

const MOGIBARA_PIPELINE_URL =
    "http://127.0.0.1:5000/pipeline";


async function sendPipelineMessage(message) {

    if (!message || !message.trim()) {
        return;
    }

    const input = message.trim();

    showPipelineUserMessage(input);

    showPipelineLoading();

    try {

        const response = await fetch(
            MOGIBARA_PIPELINE_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: input
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                "Pipeline server error: " +
                response.status
            );
        }

        const data = await response.json();

        removePipelineLoading();

        if (!data.success) {

            showPipelineBotMessage(
                "Pipeline Error: " +
                (data.error || "Unknown error")
            );

            return;
        }

        showPipelineResult(data);

    } catch (error) {

        removePipelineLoading();

        showPipelineBotMessage(
            "MOGIBARA Pipeline connect nahi ho pa raha.\n\n" +
            "Check karo ki app.py running hai."
        );

        console.error(
            "MOGIBARA Pipeline:",
            error
        );
    }
}


/* =========================================
   USER MESSAGE
   ========================================= */

function showPipelineUserMessage(message) {

    const messages =
        document.getElementById("messages");

    if (!messages) return;

    const div =
        document.createElement("div");

    div.className = "message user";

    div.textContent = message;

    messages.appendChild(div);

    messages.scrollTop =
        messages.scrollHeight;
}


/* =========================================
   LOADING
   ========================================= */

function showPipelineLoading() {

    const messages =
        document.getElementById("messages");

    if (!messages) return;

    const div =
        document.createElement("div");

    div.id = "pipeline-loading";

    div.className = "message bot";

    div.textContent =
        "⚙️ MOGIBARA Pipeline processing...";

    messages.appendChild(div);

    messages.scrollTop =
        messages.scrollHeight;
}


function removePipelineLoading() {

    const loading =
        document.getElementById(
            "pipeline-loading"
        );

    if (loading) {
        loading.remove();
    }
}


/* =========================================
   FINAL PIPELINE RESULT
   ========================================= */

function showPipelineResult(data) {

    const messages =
        document.getElementById("messages");

    if (!messages) return;

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "message bot pipeline-result";

    wrapper.innerHTML = `
        <div>
            <strong>🧠 AI PIPELINE</strong>
        </div>

        <br>

        <div>
            <strong>💡 Gemini Stage</strong>
            <p>${escapePipelineHTML(data.gemini)}</p>
        </div>

        <hr>

        <div>
            <strong>🧠 Claude Stage</strong>
            <p>${escapePipelineHTML(data.claude)}</p>
        </div>

        <hr>

        <div>
            <strong>🤖 MOGIBARA Stage</strong>
            <p>${escapePipelineHTML(data.mogibara)}</p>
        </div>
    `;

    messages.appendChild(wrapper);

    messages.scrollTop =
        messages.scrollHeight;
}


/* =========================================
   SIMPLE BOT MESSAGE
   ========================================= */

function showPipelineBotMessage(message) {

    const messages =
        document.getElementById("messages");

    if (!messages) return;

    const div =
        document.createElement("div");

    div.className =
        "message bot";

    div.textContent =
        message;

    messages.appendChild(div);

    messages.scrollTop =
        messages.scrollHeight;
}


/* =========================================
   HTML SAFETY
   ========================================= */

function escapePipelineHTML(text) {

    if (text === undefined || text === null) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br>");
}


/* =========================================
   PIPELINE BUTTON
   ========================================= */

function startMogibaraPipeline() {

    const input =
        document.getElementById("messageInput");

    if (!input) {
        console.error(
            "messageInput not found"
        );
        return;
    }

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    input.value = "";

    sendPipelineMessage(message);
}
