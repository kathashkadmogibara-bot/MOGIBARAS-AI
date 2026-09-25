from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def gemini_stage(message):
    """
    Gemini-style idea generation.
    No external API is used.
    """

    return (
        "IDEA STAGE\n"
        f"User request: {message}\n\n"
        "The request has been understood and broken into useful parts."
    )


def claude_stage(message, gemini_result):
    """
    Claude-style analysis.
    No external API is used.
    """

    return (
        "ANALYSIS STAGE\n"
        "The idea from the first stage has been analyzed.\n\n"
        "Focus: clarity, usefulness, structure and practical execution."
    )


def mogibara_stage(message, gemini_result, claude_result):
    """
    MOGIBARA final response.
    """

    return (
        "MOGIBARA AI\n\n"
        f"Your request:\n{message}\n\n"
        "Pipeline processing completed.\n\n"
        "Gemini Stage: Idea generated ✓\n"
        "Claude Stage: Idea analyzed ✓\n"
        "MOGIBARA Stage: Final processing ✓\n\n"
        "Final Result:\n"
        "Your request has been processed successfully by the MOGIBARA pipeline."
    )


@app.route("/")
def home():
    return "MOGIBARA Pipeline Backend Running"


@app.route("/pipeline", methods=["POST"])
def pipeline():

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received"
            }), 400

        message = data.get("message", "").strip()

        if not message:
            return jsonify({
                "error": "Message is empty"
            }), 400

        # Stage 1
        gemini_result = gemini_stage(message)

        # Stage 2
        claude_result = claude_stage(
            message,
            gemini_result
        )

        # Stage 3
        mogibara_result = mogibara_stage(
            message,
            gemini_result,
            claude_result
        )

        return jsonify({
            "success": True,
            "gemini": gemini_result,
            "claude": claude_result,
            "mogibara": mogibara_result,
            "reply": mogibara_result
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
