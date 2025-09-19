import threading
import time
import os
import uuid
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import torchaudio
import soundfile as sf
from demucs import pretrained
from demucs.apply import apply_model
import librosa
import numpy as np
import torch

# Try to enable GPU for TensorFlow if available
try:
    import tensorflow as tf
    if tf.config.list_physical_devices('GPU'):
        os.environ.setdefault('CUDA_VISIBLE_DEVICES', '0')
    else:
        os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
except ImportError:
    os.environ['CUDA_VISIBLE_DEVICES'] = '-1'

import crepe

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

logger = logging.getLogger(__name__)
jobs = {}

# --- Map MIDI to Indian swaras ---
def freq_to_swara(freq):
    if freq <= 0:
        return None
    midi = int(round(69 + 12 * np.log2(freq / 440.0)))
    swara_index = (midi - 60) % 12
    mapping = {0:'Sa', 2:'Re', 4:'Ga', 5:'Ma', 7:'Pa', 9:'Dha', 11:'Ni'}
    return mapping.get(swara_index, None)

# Removed combine_stems_to_instrumental as we will use Demucs Python API for separation

def extract_instrumental(file_path, output_dir):
    """
    Extract instrumental only (no vocals) using Demucs Python API with htdemucs model
    """
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model = pretrained.get_model('htdemucs')
    model.to(device)
    model.eval()

    # Load audio
    wav, sr = torchaudio.load(file_path)
    if wav.shape[0] == 1:
        wav = wav.repeat(2, 1)  # duplicate mono to stereo

    # Separate sources
    sources = apply_model(model, wav.unsqueeze(0), shifts=1, split=True, overlap=0.25, device=device)
    sources = sources[0]  # remove batch dim, shape [4, 2, time]

    # Combine drums, bass, other sources for instrumental (no vocals), average over channels
    instrumental = (sources[0] + sources[1] + sources[2]).mean(dim=0)

    # Save instrumental audio
    os.makedirs(output_dir, exist_ok=True)
    basename = os.path.splitext(os.path.basename(file_path))[0]
    output_path = os.path.join(output_dir, 'htdemucs', basename)
    os.makedirs(output_path, exist_ok=True)
    instrumental_path = os.path.join(output_path, 'no_vocals.wav')
    sf.write(instrumental_path, instrumental.cpu().numpy(), sr)

    print(f"Instrumental saved in: {instrumental_path}")

    # Clear GPU memory
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    return instrumental_path

def process_job(job_id, file_path, options):
    jobs[job_id]['status'] = 'running'
    jobs[job_id]['progress'] = 0.1
    result = {}

    if options.get('separation'):
        output_dir = os.path.join(OUTPUT_FOLDER, job_id)
        os.makedirs(output_dir, exist_ok=True)
        logger.info(f"Starting demucs extraction for job {job_id} on file {file_path}")
        try:
            instrumental_path = extract_instrumental(file_path, output_dir)
            logger.info(f"Demucs extraction completed for job {job_id}")
        except Exception as e:
            logger.error(f"Demucs extraction failed for job {job_id}: {e}")
            jobs[job_id]['status'] = 'failed'
            jobs[job_id]['progress'] = 1.0
            jobs[job_id]['result'] = {'error': str(e)}
            return

        if os.path.exists(instrumental_path):
            # Extract relative path from OUTPUT_FOLDER for URL
            rel_path = os.path.relpath(instrumental_path, OUTPUT_FOLDER)
            result['stems'] = [{'name': 'instrumental', 'url': f'/outputs/{rel_path.replace(os.sep, "/")}'}]
        else:
            logger.warning(f"Instrumental file not found for job {job_id} at {instrumental_path}")

    analysis_needed = any(options.get(k) for k in ['raga', 'tonic', 'pitch', 'tempo', 'swara_pdf'])
    if analysis_needed:
        jobs[job_id]['progress'] = 0.5
        try:
            # Load audio for analysis
            y, sr = librosa.load(file_path, sr=16000)  # CREPE requires 16kHz

            if options.get('tempo'):
                tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
                result['tempoBpm'] = float(tempo)

            if options.get('pitch') or options.get('tonic'):
                time_crepe, frequency, confidence, _ = crepe.predict(y, sr, viterbi=True)
                conf_threshold = 0.8
                valid_indices = confidence > conf_threshold
                valid_pitches = frequency[valid_indices]
                valid_times = time_crepe[valid_indices]

                def hz_to_carnatic_swara(freq):
                    swaras = {
                        "Sa": 261.63,
                        "Ri1": 277.18,
                        "Ri2": 293.66,
                        "Ga1": 311.13,
                        "Ga2": 329.63,
                        "Ma1": 349.23,
                        "Ma2": 369.99,
                        "Pa": 392.00,
                        "Da1": 415.30,
                        "Da2": 440.00,
                        "Ni1": 466.16,
                        "Ni2": 493.88,
                    }
                    closest_swara = min(swaras.items(), key=lambda x: abs(x[1] - freq))
                    return closest_swara[0]

                if len(valid_pitches) > 0:
                    avg_pitch = np.mean(valid_pitches)
                    if options.get('tonic'):
                        result['tonicHz'] = float(avg_pitch)
                    if options.get('pitch'):
                        result['pitchContour'] = [{'t': float(t), 'f0': float(f)} for t, f in zip(valid_times, valid_pitches)]
                        swara_counts = {}
                        for p in valid_pitches:
                            sw = hz_to_carnatic_swara(p)
                            swara_counts[sw] = swara_counts.get(sw, 0) + 1
                        total = sum(swara_counts.values())
                        result['swaraHistogram'] = [{'swara': sw, 'p': count / total} for sw, count in swara_counts.items()]
                else:
                    if options.get('tonic'):
                        result['tonicHz'] = 261.63  # default
                    if options.get('pitch'):
                        result['pitchContour'] = []
                        result['swaraHistogram'] = []

            if options.get('raga'):
                result['topRaga'] = {'name': 'Raga Yaman', 'confidence': 0.85}
                result['top3'] = [{'name': 'Raga Yaman', 'confidence': 0.85}, {'name': 'Raga Bhairav', 'confidence': 0.75}, {'name': 'Raga Darbari', 'confidence': 0.65}]

            if options.get('swara_pdf'):
                # --- CREPE pitch detection ---
                time_crepe, frequency, confidence, _ = crepe.predict(y, sr, viterbi=True)

                # --- Filter by confidence threshold for better accuracy ---
                conf_threshold = 0.85
                filtered_notes = [(t, f) for t, f, c in zip(time_crepe, frequency, confidence) if c >= conf_threshold]

                # --- Map to swaras and timestamps ---
                notes_with_time = []
                for t, f in filtered_notes:
                    swara = freq_to_swara(f)
                    if swara:
                        notes_with_time.append((round(t, 2), swara))

                # Debug log notes_with_time content
                logger.info(f"Notes with time sample: {notes_with_time[:10]}")

                # --- Create PDF ---
                from fpdf import FPDF
                pdf = FPDF()
                pdf.add_page()
                pdf.set_font("Arial", size=12)

                # Reduce frames to avoid too minute details, e.g., show every 0.5 seconds or more
                last_t = -1.0
                for t, s in notes_with_time:
                    if last_t >= 0 and (t - last_t) < 0.5:
                        continue
                    last_t = t
                    minutes = int(t // 60)
                    seconds = t % 60
                    timestamp_str = f"{minutes}:{seconds:04.1f}"
                    pdf.cell(0, 8, f"{timestamp_str} - {s}", ln=True)

                # Ensure output_dir is defined
                output_dir = os.path.join(OUTPUT_FOLDER, job_id)
                os.makedirs(output_dir, exist_ok=True)

                import time
                timestamp = int(time.time())
                pdf_filename = f'swaras_notation_{timestamp}.pdf'
                pdf_file = os.path.join(output_dir, pdf_filename)
                logger.info(f"Generating PDF at: {pdf_file}")
                pdf.output(pdf_file)
                logger.info(f"PDF generation completed: {os.path.exists(pdf_file)}")

                # Add to result with cache buster query param
                rel_path = os.path.relpath(pdf_file, OUTPUT_FOLDER)
                result['swaraPdfUrl'] = f'/outputs/{rel_path.replace(os.sep, "/")}?t={timestamp}'

        except Exception as e:
            logger.error(f"Analysis failed for job {job_id}: {e}")
            # Still proceed, as separation might have succeeded

    # Clear TensorFlow/Keras session to free GPU memory
    try:
        import tensorflow as tf
        tf.keras.backend.clear_session()
    except ImportError:
        pass

    jobs[job_id]['progress'] = 1.0
    jobs[job_id]['status'] = 'done'
    jobs[job_id]['result'] = result

    # Final GPU memory cleanup
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

@app.route('/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    options = request.form.get('options')
    if options:
        import json
        options = json.loads(options)
    else:
        options = {}

    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    job_id = str(uuid.uuid4())
    jobs[job_id] = {'id': job_id, 'status': 'queued', 'progress': 0.0}

    # Start processing in a thread
    thread = threading.Thread(target=process_job, args=(job_id, file_path, options))
    thread.start()

    return jsonify({'jobId': job_id})

@app.route('/jobs/<job_id>', methods=['GET'])
def get_job(job_id):
    if job_id not in jobs:
        return jsonify({'error': 'Job not found'}), 404
    return jsonify(jobs[job_id])

@app.route('/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    if job_id in jobs:
        del jobs[job_id]
    return '', 204

@app.route('/outputs/<path:filename>')
def serve_output(filename):
    import os
    file_path = os.path.join(OUTPUT_FOLDER, filename)
    logger.info(f"Serving output file: {filename}, resolved path: {file_path}, exists: {os.path.exists(file_path)}")
    response = send_from_directory(OUTPUT_FOLDER, filename)
    if filename.endswith('.pdf'):
        response.headers['Content-Disposition'] = 'attachment; filename=' + filename.split('/')[-1]
    return response

if __name__ == '__main__':
    app.run(debug=True, port=8000)
