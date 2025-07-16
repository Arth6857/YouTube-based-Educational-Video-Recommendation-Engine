# pip install git+https://github.com/openai/whisper.git -q
# pip install yt-dlp -q
# pip install ffmpeg-python -q
# sudo apt-get install ffmpeg -y -qq
def download_audio(youtube_url, output_audio="audio_full.wav"):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'audio.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'quiet': False,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([youtube_url])
    os.rename("audio.wav", output_audio)
    print("✅ Downloaded and converted to WAV.")


def trim_audio(input_file, output_file="audio_trimmed.wav", start=300, duration=180):
    ffmpeg.input(input_file, ss=start, t=duration).output(output_file).run(overwrite_output=True)
    print(f"✂️ Trimmed to first {duration} seconds.")
    return output_file

model = whisper.load_model("base")  # Or "base", "small" for better accuracy

def detect_language(audio_path):
    print("🔍 Detecting language...")
    audio = whisper.load_audio(audio_path)
    audio = whisper.pad_or_trim(audio)
    mel = whisper.log_mel_spectrogram(audio).to(model.device)
    _, probs = model.detect_language(mel)
    lang = max(probs, key=probs.get)
    print(f"✅ Detected Language: {lang}")
    return lang

if __name__ == "__main__":
    youtube_url = input("🎥 Enter YouTube video URL (or leave blank to upload local file): ").strip()

    if youtube_url:
        full_audio = "audio_full.wav"
        trimmed_audio = "audio_trimmed.wav"
        download_audio(youtube_url, full_audio)
        trim_audio(full_audio, trimmed_audio)
        detect_language(trimmed_audio)
    else:
        try:
            from google.colab import files
            uploaded = files.upload()
            input_file = list(uploaded.keys())[0]
            trimmed_audio = "audio_trimmed.wav"
            trim_audio(input_file, trimmed_audio)
            detect_language(trimmed_audio)
        except:
            print("⚠️ Upload failed. Please use Colab for file upload.")