#!/bin/bash

# Script to add SSH key to server (if you have password access)

SERVER_IP="137.184.225.187"
PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAimb07TcJ2WY0OU0QAitldkhUrHwjkLo6yxUofstYno rayn.winter@gmail.com"

echo "🔑 Adding SSH key to server..."
echo "You will be prompted for the root password"

ssh root@$SERVER_IP "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'SSH key added successfully!'"

if [ $? -eq 0 ]; then
    echo "✅ SSH key added! You can now run ./quick-deploy.sh"
else
    echo "❌ Failed to add SSH key. Please add it manually:"
    echo "   1. SSH to server with password"
    echo "   2. Run: mkdir -p ~/.ssh && chmod 700 ~/.ssh"
    echo "   3. Run: echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys"
    echo "   4. Run: chmod 600 ~/.ssh/authorized_keys"
fi

