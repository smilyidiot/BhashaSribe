"""Text-to-speech service.

Not implemented yet. The plan is to add an open-source TTS model (e.g.
Coqui TTS or Piper) so history rows can be played back as speech, mirroring
the self-hosted/open-source approach used for STT in stt_service.py.
"""


def synthesize(text: str, lang: str | None = None) -> bytes:
    raise NotImplementedError("TTS not yet implemented — see README TODO")
