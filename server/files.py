from flask import Blueprint, request, jsonify, session, send_file, current_app
from werkzeug.utils import secure_filename
from server.database import get_db_connection

import os
import uuid

files_bp = Blueprint('files', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar'}

@files_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        user_id = session['user_id']
        original_name = secure_filename(file.filename)
        ext = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else ''
        unique_filename = f"{uuid.uuid4()}.{ext}"
        
        user_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], f"user_{user_id}")
        os.makedirs(user_folder, exist_ok=True)
        
        file_path = os.path.join(user_folder, unique_filename)
        file.save(file_path)
        file_size = os.path.getsize(file_path)
        
        conn = get_db_connection()
        c = conn.cursor()
        c.execute('''
            INSERT INTO files (user_id, filename, original_name, file_path, file_size, mime_type)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, unique_filename, original_name, file_path, file_size, file.mimetype))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'File uploaded successfully'})

@files_bp.route('/files', methods=['GET'])
def list_files():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT id, original_name, file_size, mime_type, uploaded_at FROM files WHERE user_id = ? ORDER BY uploaded_at DESC', (user_id,))
    files = c.fetchall()
    conn.close()
    
    file_list = []
    for f in files:
        file_list.append({
            'id': f['id'],
            'name': f['original_name'],
            'size': f['file_size'],
            'type': f['mime_type'],
            'uploadedAt': f['uploaded_at']
        })
        
    return jsonify(file_list)

@files_bp.route('/download/<int:file_id>', methods=['GET'])
def download_file(file_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT file_path, original_name FROM files WHERE id = ? AND user_id = ?', (file_id, user_id))
    file = c.fetchone()
    conn.close()
    
    if not file:
        return jsonify({'error': 'File not found'}), 404
        
    return send_file(file['file_path'], as_attachment=True, download_name=file['original_name'])

@files_bp.route('/delete/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT file_path FROM files WHERE id = ? AND user_id = ?', (file_id, user_id))
    file = c.fetchone()
    
    if not file:
        conn.close()
        return jsonify({'error': 'File not found'}), 404
        
    try:
        if os.path.exists(file['file_path']):
            os.remove(file['file_path'])
    except Exception as e:
        print(f"Error deleting file from disk: {e}")
        
    c.execute('DELETE FROM files WHERE id = ?', (file_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'File deleted successfully'})
