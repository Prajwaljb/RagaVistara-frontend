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

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

logger = logging.getLogger(__name__)
jobs = {}

# Removed combine_stems_to_instrumental as we will use Demucs Python API for separation

def extract_instrumental(file_path, output_dir):
    """
    Extract instrumental only (no vocals) using Demucs Python API with htdemucs model
    """
    model = pretrained.get_model('htdemucs')
    model.cpu()
    model.eval()

    # Load audio
    wav, sr = torchaudio.load(file_path)
    if wav.shape[0] == 1:
        wav = wav.repeat(2, 1)  # duplicate mono to stereo

    # Separate sources
    sources = apply_model(model, wav.unsqueeze(0), shifts=1, split=True, overlap=0.25, device='cpu')
    sources = sources[0]  # remove batch dim, shape [4, 2, time]

    # Combine drums, bass, other sources for instrumental (no vocals), average over channels
    instrumental = (sources[0] + sources[2] + sources[3]).mean(dim=0)

    # Save instrumental audio
    os.makedirs(output_dir, exist_ok=True)
    basename = os.path.splitext(os.path.basename(file_path))[0]
    output_path = os.path.join(output_dir, 'htdemucs', basename)
    os.makedirs(output_path, exist_ok=True)
    instrumental_path = os.path.join(output_path, 'no_vocals.wav')
    sf.write(instrumental_path, instrumental.numpy(), sr)

    print(f"Instrumental saved in: {instrumental_path}")
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

    if options.get('raga'):
        result['topRaga'] = {'name': 'Raga Yaman', 'confidence': 0.85}
        result['top3'] = [{'name': 'Raga Yaman', 'confidence': 0.85}, {'name': 'Raga Bhairav', 'confidence': 0.75}, {'name': 'Raga Darbari', 'confidence': 0.65}]

    if options.get('tonic'):
        result['tonicHz'] = 261.63  # C4

    if options.get('tempo'):
        result['tempoBpm'] = 120

    if options.get('pitch'):
        result['pitchContour'] = [{'t': 0, 'f0': 261.63}, {'t': 1, 'f0': 293.66}]
        result['swaraHistogram'] = [{'swara': 'Sa', 'p': 0.3}, {'swara': 'Re', 'p': 0.2}]

    jobs[job_id]['progress'] = 1.0
    jobs[job_id]['status'] = 'done'
    jobs[job_id]['result'] = result

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
    return send_from_directory(OUTPUT_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=8000)
