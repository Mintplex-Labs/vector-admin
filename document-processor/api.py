import os
from flask import Flask, json, request
from scripts.extract_text import extract_text
from scripts.filetypes import ACCEPTED_MIMES
api = Flask(__name__)

WATCH_DIRECTORY = "hotdir"
@api.route('/process', methods=['POST'])
def prepare_for_embed():
  content = request.json
  target_filename = os.path.normpath(content.get('filename')).lstrip(os.pardir + os.sep)
  print(f"Processing {target_filename}")
  success, reason, metadata = extract_text(WATCH_DIRECTORY, target_filename)
  return json.dumps({'filename': target_filename, 'success': success, 'reason': reason, 'metadata': metadata})

@api.route('/accepts', methods=['GET'])
def get_accepted_filetypes():
  return json.dumps(ACCEPTED_MIMES)

@api.route('/', methods=['GET'])
def root():
  return "<p>Use POST /process with filename key in JSON body in order to process a file. File by that name must exist in hotdir already.</p>"