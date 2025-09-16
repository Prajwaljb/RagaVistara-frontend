from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename
from demucs.separate import main as demucs_main
import sys
import threading
import time

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

jobs = {}

def extract_instrumental(input_file, output_dir):
    """
    Extract instrumental only (no vocals) using Demucs command-line interface
    """
    sys.argv = [
        "demucs",                # placeholder, ignored
        "--two-stems=no_vocals", # extracts everything except vocals
        "-o", output_dir,        # output folder
        input_file               # input audio file
    ]
    demucs_main()
    print(f"Instrumental saved in folder: {output_dir}")
    return output_dir

def process_job(job_id, file_path, options):
    jobs[job_id]['status'] = 'running'
    jobs[job_id]['progress'] = 0.1

    # Simulate analysis for other options, but for separation, do the extraction
    result = {}

    if options.get('separation'):
        output_dir = os.path.join(OUTPUT_FOLDER, job_id)
        os.makedirs(output_dir, exist_ok=True)
        extract_instrumental(file_path, output_dir)
        # Assume the instrumental is saved as mdx_extra/no_vocals.wav or similar
        instrumental_path = os.path.join(output_dir, 'mdx_extra', 'no_vocals.wav')
        if os.path.exists(instrumental_path):
            result['stems'] = [{'name': 'instrumental', 'url': f'/outputs/{job_id}/mdx_extra/no_vocals.wav'}]

    # Mock other results
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
