import requests
import time
from app.config import get_settings


def transcribe_audio(audio_url: str) -> str:
    settings = get_settings()

    headers = {
        "authorization": settings.assemblyai_api_key,
    }

    data = {
        "audio_url": audio_url,
        "language_detection": True,
        "speech_models": ["universal-3-pro", "universal-2"],
    }

    response = requests.post(
        "https://api.assemblyai.com/v2/transcript",
        json=data,
        headers=headers,
    )

    response.raise_for_status()

    transcript_id = response.json()["id"]

    polling_endpoint = (
        f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
    )

    while True:
        transcription_result = requests.get(
            polling_endpoint,
            headers=headers,
        )

        transcription_result.raise_for_status()

        result = transcription_result.json()
        status = result["status"]

        if status == "completed":
            return result["text"]

        if status == "error":
            raise RuntimeError(
                f"Transcription failed: {result['error']}"
            )

        time.sleep(3)