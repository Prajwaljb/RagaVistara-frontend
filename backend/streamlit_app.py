import streamlit as st
import requests
import time

st.title("Karaoke Converter with Demucs")

st.write("Upload an audio file to extract the instrumental for karaoke.")

uploaded_file = st.file_uploader("Choose an audio file", type=['wav', 'mp3', 'flac', 'm4a'])

if uploaded_file is not None:
    st.audio(uploaded_file, format='audio/wav')

    if st.button("Extract Instrumental"):
        # Send file to backend
        files = {'file': uploaded_file.getvalue()}
        data = {'options': '{"separation": true}'}
        try:
            response = requests.post('http://localhost:8000/analyze', files={'file': uploaded_file}, data=data)
            if response.status_code == 200:
                job_id = response.json()['jobId']
                st.success(f"Processing started. Job ID: {job_id}")

                # Progress bar
                progress_bar = st.progress(0)
                status_text = st.empty()

                while True:
                    job_response = requests.get(f'http://localhost:8000/jobs/{job_id}')
                    if job_response.status_code == 200:
                        job = job_response.json()
                        status = job['status']
                        progress = job['progress']
                        progress_bar.progress(progress)
                        status_text.text(f"Status: {status}")

                        if status == 'done':
                            st.success("Processing complete!")
                            if 'result' in job and 'stems' in job['result']:
                                for stem in job['result']['stems']:
                                    if stem['name'] == 'instrumental':
                                        download_url = f"http://localhost:8000{stem['url']}"
                                        st.markdown(f"[Download Instrumental]({download_url})", unsafe_allow_html=True)
                            break
                        elif status == 'failed':
                            st.error("Processing failed.")
                            break
                    else:
                        st.error("Failed to check job status.")
                        break
                    time.sleep(2)
            else:
                st.error(f"Failed to start processing: {response.text}")
        except Exception as e:
            st.error(f"Error: {str(e)}")
