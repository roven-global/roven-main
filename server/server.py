#!/usr/bin/env python3
import subprocess
import os
import sys

# Change to the correct directory
os.chdir('/app/server')

# Run the Node.js server
try:
    subprocess.run(['npm', 'start'], check=True)
except KeyboardInterrupt:
    print("Server stopped by user")
    sys.exit(0)
except Exception as e:
    print(f"Error starting server: {e}")
    sys.exit(1)