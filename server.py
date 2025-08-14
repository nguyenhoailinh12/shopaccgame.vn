#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import os
import time
import threading
import socket
import base64
import zlib
import json
import urllib.parse
from datetime import datetime, timedelta

# Configuration
PORT = 8000
IP_CHANGE_INTERVAL = 3 * 60 * 60  # 3 hours in seconds

# List of IPs to rotate through
IP_ADDRESSES = [
    "127.0.0.1",      # Localhost
    "0.0.0.0",        # All interfaces
    "192.168.1.100"   # Local network IP (adjust as needed)
]

class ColoredTerminal:
    """Helper class for colored terminal output"""
    GREEN = '\033[92m'
    BRIGHT_GREEN = '\033[1;92m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    
    @classmethod
    def green(cls, text):
        return f"{cls.BRIGHT_GREEN}{cls.BOLD}{text}{cls.ENDC}"
    
    @classmethod
    def info(cls, text):
        return f"{cls.GREEN}{text}{cls.ENDC}"

class CodeEncryption:
    """Helper class for code encryption and obfuscation"""
    
    @staticmethod
    def simple_encrypt(text, key="GameShop2025"):
        """Simple XOR encryption with key"""
        encrypted = []
        key_len = len(key)
        for i, char in enumerate(text):
            encrypted.append(chr(ord(char) ^ ord(key[i % key_len])))
        return ''.join(encrypted)
    
    @staticmethod
    def base64_encode(text):
        """Base64 encoding"""
        return base64.b64encode(text.encode('utf-8')).decode('utf-8')
    
    @staticmethod
    def compress_and_encode(text):
        """Compress and base64 encode"""
        compressed = zlib.compress(text.encode('utf-8'))
        return base64.b64encode(compressed).decode('utf-8')
    
    @staticmethod
    def obfuscate_js(js_code):
        """JavaScript code obfuscation"""
        # Simple variable name obfuscation
        replacements = {
            'function': 'ƒ',
            'var ': 'ν ',
            'let ': 'λ ',
            'const ': 'κ ',
            'document': 'δ',
            'window': 'ω',
            'console': 'ç',
            'addEventListener': 'αε',
            'getElementById': 'γι',
            'querySelector': 'θσ',
            'innerHTML': 'ιη',
            'onclick': 'οκ',
            'onload': 'ολ'
        }
        
        obfuscated = js_code
        for original, replacement in replacements.items():
            obfuscated = obfuscated.replace(original, replacement)
        
        return obfuscated
    
    @staticmethod
    def create_encrypted_wrapper(content, file_type):
        """Create encrypted wrapper for content"""
        if file_type == 'js':
            # Encrypt JavaScript
            encrypted_content = CodeEncryption.compress_and_encode(content)
            wrapper = f"""
            (function(){{
                const encrypted = '{encrypted_content}';
                const decoded = atob(encrypted);
                const decompressed = pako.inflate(new Uint8Array([...decoded].map(c => c.charCodeAt(0))), {{to: 'string'}});
                eval(decompressed);
            }})();
            """
            return wrapper
        elif file_type == 'css':
            # Encrypt CSS
            encrypted_content = CodeEncryption.base64_encode(content)
            wrapper = f"""
            <style id="encrypted-css">
            /* Encrypted CSS - Protected by GameShop Security */
            </style>
            <script>
            (function(){{
                const encrypted = '{encrypted_content}';
                const decoded = atob(encrypted);
                document.getElementById('encrypted-css').innerHTML = decoded;
            }})();
            </script>
            """
            return wrapper
        
        return content

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_POST(self):
        """Handle POST requests for user activity logging"""
        try:
            if self.path == '/api/log-activity':
                # Get content length
                content_length = int(self.headers.get('Content-Length', 0))
                
                # Read POST data
                post_data = self.rfile.read(content_length)
                
                # Parse JSON data
                try:
                    data = json.loads(post_data.decode('utf-8'))
                    self.log_user_activity(data)
                    
                    # Send success response
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    response = json.dumps({'status': 'success', 'message': 'Activity logged'})
                    self.wfile.write(response.encode('utf-8'))
                    
                except json.JSONDecodeError:
                    self.send_error(400, 'Invalid JSON data')
                    
            else:
                self.send_error(404, 'Endpoint not found')
                
        except Exception as e:
            print(ColoredTerminal.green(f"❌ Error handling POST request: {e}"))
            self.send_error(500, 'Internal server error')
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_user_activity(self, data):
        """Log user activity to server console"""
        activity_type = data.get('type', 'unknown')
        username = data.get('username', 'unknown')
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        client_ip = self.client_address[0]
        
        if activity_type == 'register':
            email = data.get('email', 'unknown')
            print(ColoredTerminal.green(f"\n{'='*60}"))
            print(ColoredTerminal.green(f"👤 NEW USER REGISTRATION"))
            print(ColoredTerminal.green(f"{'='*60}"))
            print(ColoredTerminal.info(f"📝 Username: {username}"))
            print(ColoredTerminal.info(f"📧 Email: {email}"))
            print(ColoredTerminal.info(f"🌐 IP Address: {client_ip}"))
            print(ColoredTerminal.info(f"⏰ Time: {timestamp}"))
            print(ColoredTerminal.green(f"{'='*60}\n"))
            
        elif activity_type == 'login':
            is_admin = data.get('isAdmin', False)
            user_type = "ADMIN" if is_admin else "USER"
            icon = "👑" if is_admin else "👤"
            
            print(ColoredTerminal.green(f"\n{'='*60}"))
            print(ColoredTerminal.green(f"{icon} {user_type} LOGIN"))
            print(ColoredTerminal.green(f"{'='*60}"))
            print(ColoredTerminal.info(f"👤 Username: {username}"))
            print(ColoredTerminal.info(f"🔑 Role: {user_type}"))
            print(ColoredTerminal.info(f"🌐 IP Address: {client_ip}"))
            print(ColoredTerminal.info(f"⏰ Time: {timestamp}"))
            print(ColoredTerminal.green(f"{'='*60}\n"))
            
        elif activity_type == 'logout':
            print(ColoredTerminal.green(f"\n{'='*40}"))
            print(ColoredTerminal.green(f"👋 USER LOGOUT"))
            print(ColoredTerminal.green(f"{'='*40}"))
            print(ColoredTerminal.info(f"👤 Username: {username}"))
            print(ColoredTerminal.info(f"🌐 IP Address: {client_ip}"))
            print(ColoredTerminal.info(f"⏰ Time: {timestamp}"))
            print(ColoredTerminal.green(f"{'='*40}\n"))
            
        elif activity_type == 'purchase':
            account_info = data.get('accountInfo', {})
            amount = data.get('amount', 0)
            
            print(ColoredTerminal.green(f"\n{'='*60}"))
            print(ColoredTerminal.green(f"💰 PURCHASE MADE"))
            print(ColoredTerminal.green(f"{'='*60}"))
            print(ColoredTerminal.info(f"👤 Username: {username}"))
            print(ColoredTerminal.info(f"🎮 Game: {account_info.get('game', 'unknown')}"))
            print(ColoredTerminal.info(f"🏆 Rank: {account_info.get('rank', 'unknown')}"))
            print(ColoredTerminal.info(f"💵 Amount: {amount:,} VNĐ"))
            print(ColoredTerminal.info(f"🌐 IP Address: {client_ip}"))
            print(ColoredTerminal.info(f"⏰ Time: {timestamp}"))
            print(ColoredTerminal.green(f"{'='*60}\n"))
            
        elif activity_type == 'donation':
            donation_info = data.get('donationInfo', {})
            amount = data.get('amount', 0)
            method = data.get('method', 'unknown')
            
            print(ColoredTerminal.green(f"\n{'='*60}"))
            print(ColoredTerminal.green(f"❤️ DONATION RECEIVED"))
            print(ColoredTerminal.green(f"{'='*60}"))
            print(ColoredTerminal.info(f"👤 Donor: {username}"))
            print(ColoredTerminal.info(f"💰 Amount: {amount:,} VNĐ"))
            print(ColoredTerminal.info(f"💳 Method: {method}"))
            print(ColoredTerminal.info(f"🌐 IP Address: {client_ip}"))
            print(ColoredTerminal.info(f"⏰ Time: {timestamp}"))
            print(ColoredTerminal.green(f"{'='*60}\n"))
    
    def do_GET(self):
        """Override GET method to serve encrypted content"""
        try:
            # Get the requested file path
            file_path = self.translate_path(self.path)
            
            if os.path.isfile(file_path):
                # Check file extension
                _, ext = os.path.splitext(file_path)
                ext = ext.lower()
                
                # Read file content
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Encrypt based on file type
                if ext == '.js':
                    print(ColoredTerminal.info(f"🔒 Encrypting JavaScript: {os.path.basename(file_path)}"))
                    # Add pako library for decompression
                    encrypted_content = f"""
                    <!-- Pako library for decompression -->
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.4/pako.min.js"></script>
                    <script>
                    {CodeEncryption.create_encrypted_wrapper(content, 'js')}
                    </script>
                    """
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html')
                    self.send_header('Content-Length', len(encrypted_content.encode('utf-8')))
                    self.end_headers()
                    self.wfile.write(encrypted_content.encode('utf-8'))
                    return
                
                elif ext == '.css':
                    print(ColoredTerminal.info(f"🔒 Encrypting CSS: {os.path.basename(file_path)}"))
                    encrypted_content = CodeEncryption.create_encrypted_wrapper(content, 'css')
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html')
                    self.send_header('Content-Length', len(encrypted_content.encode('utf-8')))
                    self.end_headers()
                    self.wfile.write(encrypted_content.encode('utf-8'))
                    return
                
                elif ext == '.html':
                    print(ColoredTerminal.info(f"🔒 Processing HTML: {os.path.basename(file_path)}"))
                    # Add encryption notice to HTML
                    if '<head>' in content:
                        encryption_notice = """
                        <!-- Protected by GameShop Security System -->
                        <meta name="security" content="encrypted">
                        <script>
                        console.log('%c🔒 GameShop Security Active', 'color: #00ff00; font-weight: bold; font-size: 14px;');
                        console.log('%c⚠️ Code is protected and encrypted', 'color: #ffaa00; font-weight: bold;');
                        </script>
                        """
                        content = content.replace('<head>', f'<head>{encryption_notice}')
                    
                    self.send_response(200)
                    self.send_header('Content-Type', 'text/html')
                    self.send_header('Content-Length', len(content.encode('utf-8')))
                    self.end_headers()
                    self.wfile.write(content.encode('utf-8'))
                    return
            
            # Default behavior for other files
            super().do_GET()
            
        except Exception as e:
            print(ColoredTerminal.green(f"❌ Error serving encrypted content: {e}"))
            super().do_GET()
    
    def log_message(self, format, *args):
        # Override to show green colored logs
        message = format % args
        print(ColoredTerminal.info(f"[{datetime.now().strftime('%H:%M:%S')}] {message}"))

class RotatingServer:
    def __init__(self):
        self.current_ip_index = 0
        self.httpd = None
        self.server_thread = None
        self.running = False
        self.start_time = datetime.now()
        
    def get_current_ip(self):
        return IP_ADDRESSES[self.current_ip_index]
    
    def get_next_ip(self):
        self.current_ip_index = (self.current_ip_index + 1) % len(IP_ADDRESSES)
        return self.get_current_ip()
    
    def start_server_on_ip(self, ip):
        """Start server on specified IP"""
        try:
            # Change to the directory containing the HTML files
            web_dir = os.path.dirname(os.path.abspath(__file__))
            os.chdir(web_dir)
            
            # Create server
            server_address = (ip, PORT)
            self.httpd = socketserver.TCPServer(server_address, MyHTTPRequestHandler)
            self.httpd.allow_reuse_address = True
            
            # Print server info with green color
            print(ColoredTerminal.green(f"\n{'='*60}"))
            print(ColoredTerminal.green(f"🚀 GAME ACCOUNT SHOP SERVER STARTED"))
            print(ColoredTerminal.green(f"{'='*60}"))
            print(ColoredTerminal.info(f"📍 Server IP: {ip}"))
            print(ColoredTerminal.info(f"🔌 Port: {PORT}"))
            print(ColoredTerminal.info(f"🌐 URL: http://{ip}:{PORT}/"))
            print(ColoredTerminal.info(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"))
            print(ColoredTerminal.info(f"🔄 Next IP change in: 3 hours"))
            print(ColoredTerminal.info(f"🔒 Code encryption: ENABLED"))
            print(ColoredTerminal.info(f"🛡️ Security level: HIGH"))
            print(ColoredTerminal.green(f"{'='*60}"))
            print(ColoredTerminal.info("Press Ctrl+C to stop the server\n"))
            
            # Try to open browser automatically
            try:
                if ip == "127.0.0.1" or ip == "0.0.0.0":
                    webbrowser.open(f'http://localhost:{PORT}')
                else:
                    webbrowser.open(f'http://{ip}:{PORT}')
            except:
                pass
            
            # Start server
            self.running = True
            self.httpd.serve_forever()
            
        except OSError as e:
            if "Address already in use" in str(e):
                print(ColoredTerminal.green(f"⚠️  Port {PORT} is already in use. Trying next IP..."))
                return False
            else:
                print(ColoredTerminal.green(f"❌ Error starting server on {ip}:{PORT} - {e}"))
                return False
        except Exception as e:
            print(ColoredTerminal.green(f"❌ Unexpected error: {e}"))
            return False
        
        return True
    
    def stop_server(self):
        """Stop the current server"""
        if self.httpd:
            print(ColoredTerminal.info(f"\n🔄 Switching to next IP..."))
            self.running = False
            self.httpd.shutdown()
            self.httpd.server_close()
            self.httpd = None
    
    def ip_rotation_timer(self):
        """Timer function to rotate IP every 3 hours"""
        while self.running:
            time.sleep(IP_CHANGE_INTERVAL)
            if self.running:
                print(ColoredTerminal.green(f"\n⏰ 3 hours passed! Rotating to next IP..."))
                self.stop_server()
                time.sleep(2)  # Wait a bit before starting new server
                next_ip = self.get_next_ip()
                
                # Start new server thread
                self.server_thread = threading.Thread(target=self.start_server_on_ip, args=(next_ip,))
                self.server_thread.daemon = True
                self.server_thread.start()
    
    def start(self):
        """Start the rotating server system"""
        try:
            # Start timer for IP rotation
            timer_thread = threading.Thread(target=self.ip_rotation_timer)
            timer_thread.daemon = True
            timer_thread.start()
            
            # Start with first IP
            current_ip = self.get_current_ip()
            self.start_server_on_ip(current_ip)
            
        except KeyboardInterrupt:
            print(ColoredTerminal.green(f"\n\n🛑 Server stopped by user"))
            self.running = False
            if self.httpd:
                self.httpd.shutdown()
        except Exception as e:
            print(ColoredTerminal.green(f"❌ Server error: {e}"))
        finally:
            print(ColoredTerminal.green(f"👋 Goodbye!"))

def display_server_info():
    """Display server information and IP rotation schedule"""
    print(ColoredTerminal.green(f"\n{'='*60}"))
    print(ColoredTerminal.green(f"🎮 GAME ACCOUNT SHOP - ROTATING SERVER"))
    print(ColoredTerminal.green(f"{'='*60}"))
    print(ColoredTerminal.info(f"📋 Available IPs:"))
    for i, ip in enumerate(IP_ADDRESSES, 1):
        print(ColoredTerminal.info(f"   {i}. {ip}"))
    print(ColoredTerminal.info(f"🔄 Rotation interval: 3 hours"))
    print(ColoredTerminal.info(f"🚀 Starting server..."))
    print(ColoredTerminal.green(f"{'='*60}\n"))

def main():
    # Set terminal title (Windows)
    try:
        os.system('title Game Account Shop Server')
    except:
        pass
    
    # Display server info
    display_server_info()
    
    # Start rotating server
    server = RotatingServer()
    server.start()

if __name__ == "__main__":
    main()
