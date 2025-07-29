#!/usr/bin/env python3
import os
import sys
import mimetypes
import argparse
from flask import Flask, jsonify, send_from_directory

app = Flask(__name__)

@app.route('/test-uploads/<path:filename>')
def test_uploaded_file(filename):
    """Test route for serving files with proper headers"""
    import mimetypes
    
    try:
        # First check if the file actually exists
        file_path = os.path.join('uploads', filename)
        if not os.path.exists(file_path):
            return jsonify({
                'error': 'File not found',
                'path': file_path,
                'requested': filename
            }), 404
            
        # Get file info for better response headers
        file_size = os.path.getsize(file_path)
        mime_type, _ = mimetypes.guess_type(filename)
        
        # Create response with file
        response = send_from_directory('uploads', filename)
        
        # Set CORS headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        
        # Set correct MIME type for video/pdf
        if mime_type:
            response.headers['Content-Type'] = mime_type
            
        # Add content disposition header for proper embedding
        if mime_type and (mime_type.startswith('video/') or mime_type == 'application/pdf'):
            # Use 'inline' to tell browser to display in page, not download
            response.headers['Content-Disposition'] = f'inline; filename="{os.path.basename(filename)}"'
            response.headers['Content-Length'] = str(file_size)
            
        print(f"Serving file: {filename}, MIME: {mime_type}, Size: {file_size} bytes")
        return response
        
    except Exception as e:
        print(f"Error serving {filename}: {str(e)}")
        return jsonify({
            'error': f'Failed to serve file: {str(e)}',
            'path': filename
        }), 500

def create_test_files():
    """Create test files for video and PDF tests"""
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'courses')
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Create a simple test PDF
    pdf_path = os.path.join(uploads_dir, 'sample.pdf')
    with open(pdf_path, 'w') as f:
        f.write("%PDF-1.7\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n188\n%%EOF")
    print(f"Created test PDF at {pdf_path}")
    
    # Create a simple test video
    video_path = os.path.join(uploads_dir, 'sample.mp4')
    with open(video_path, 'wb') as f:
        # Add minimal MP4 header bytes
        f.write(b'\x00\x00\x00\x1cftypisom\x00\x00\x02\x00isomiso2mp41\x00\x00\x00\x08free\x00\x00\x00\x08mdat')
    print(f"Created test video at {video_path}")
    
    return {"pdf": pdf_path, "video": video_path}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Media file server and test utility')
    parser.add_argument('--create-files', action='store_true', help='Create test PDF and video files')
    parser.add_argument('--run-server', action='store_true', help='Run the test server')
    args = parser.parse_args()
    
    if args.create_files:
        files = create_test_files()
        print(f"Created test files: {files}")
    
    if args.run_server:
        port = 5050  # Use a different port from the main app
        print(f"Running test server on http://localhost:{port}")
        app.run(host='0.0.0.0', port=port, debug=True)
    
    if not (args.create_files or args.run_server):
        print("No action specified. Use --create-files or --run-server")
        parser.print_help()
