# AWS Migration Guide

Plan and execution guide for migrating Claude Agents to AWS cloud infrastructure.

**Target Completion:** Wednesday, 2025-01-22

---

## Overview

### Current State
- GitHub Pages static hosting
- localStorage for session data (user-side only)
- No centralized data collection
- No server-side processing

### Target State
- AWS EC2 Linux server
- Centralized session data storage
- Server-side API proxy (secure API key handling)
- Terminal-based Claude Code interaction
- Full evaluation system implementation

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   EC2        │     │   S3         │     │  CloudWatch  │    │
│  │   (Linux)    │     │   (Storage)  │     │  (Logs)      │    │
│  │              │     │              │     │              │    │
│  │ - Nginx      │     │ - Sessions   │     │ - Metrics    │    │
│  │ - Node.js    │     │ - Transcripts│     │ - Alerts     │    │
│  │ - Claude CLI │     │ - Exports    │     │              │    │
│  └──────┬───────┘     └──────────────┘     └──────────────┘    │
│         │                                                        │
│         │ API Proxy                                              │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Anthropic    │                                               │
│  │ API          │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│   Users         │
│   (Browser)     │
└─────────────────┘
```

---

## Phase 1: AWS Account & EC2 Setup (Day 1 - Monday)

### 1.1 AWS Account
- [ ] Create AWS account (if not existing)
- [ ] Set up IAM user with appropriate permissions
- [ ] Enable MFA for root account
- [ ] Set up billing alerts

### 1.2 Launch EC2 Instance

**Recommended specs:**
- **AMI:** Amazon Linux 2023 or Ubuntu 22.04 LTS
- **Instance type:** t3.small (2 vCPU, 2GB RAM) - can scale up later
- **Storage:** 20GB gp3 SSD
- **Security group:**
  - SSH (22) - your IP only
  - HTTP (80) - anywhere
  - HTTPS (443) - anywhere

**Launch commands:**
```bash
# Via AWS CLI (alternative to console)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-groups claude-agents-sg \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=claude-agents}]'
```

### 1.3 Connect to Instance
```bash
# Download key pair (.pem file) from AWS console
chmod 400 your-key-pair.pem
ssh -i your-key-pair.pem ec2-user@<public-ip>
```

### 1.4 Initial Server Setup
```bash
# Update system
sudo yum update -y  # Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # Ubuntu

# Install essentials
sudo yum install -y git nginx nodejs npm  # Amazon Linux
# OR
sudo apt install -y git nginx nodejs npm  # Ubuntu

# Install Rust (for Claude Code CLI)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Clone repository
git clone https://github.com/charrisonpro/Claude-Agents.git
cd Claude-Agents
```

---

## Phase 2: Web Server Setup (Day 1-2)

### 2.1 Configure Nginx

```bash
sudo nano /etc/nginx/conf.d/claude-agents.conf
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or public IP initially

    # Serve static files
    location / {
        root /home/ec2-user/Claude-Agents/docs;
        index index.html;
        try_files $uri $uri/ =404;
    }

    # API proxy (Phase 3)
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and start Nginx
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.2 Verify Static Site
- Visit `http://<public-ip>` in browser
- Should see the portfolio landing page

---

## Phase 3: API Proxy Server (Day 2)

### 3.1 Create Node.js API Proxy

This eliminates the need for users to provide their own API keys.

```bash
mkdir -p ~/Claude-Agents/server
cd ~/Claude-Agents/server
npm init -y
npm install express cors dotenv
```

**Create `server/index.js`:**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Proxy to Anthropic API
app.post('/chat', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    // Log session data for evaluation (Phase 4)
    logSession(req.body, data);

    res.json(data);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'API request failed' });
  }
});

// Session logging placeholder
function logSession(request, response) {
  // Will implement in Phase 4
  console.log('Session logged:', new Date().toISOString());
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API proxy running on port ${PORT}`);
});
```

**Create `server/.env`:**
```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
PORT=3000
```

### 3.2 Run API Server

```bash
# Install PM2 for process management
sudo npm install -g pm2

# Start server
pm2 start index.js --name claude-api
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

### 3.3 Update Frontend to Use Proxy

Modify `docs/assets/js/config.js`:
```javascript
const CONFIG = {
  api: {
    baseUrl: '/api/chat',  // Changed from Anthropic direct
    // ... rest of config
  },
  // ...
};
```

Modify `docs/assets/js/chat-core.js` to use the proxy endpoint instead of direct Anthropic calls.

---

## Phase 4: Data Collection & Storage (Day 2-3)

### 4.1 Set Up S3 Bucket

```bash
# Via AWS CLI
aws s3 mb s3://claude-agents-sessions --region us-east-1

# Set bucket policy for server access
```

### 4.2 Implement Session Logging

Update `server/index.js` to save sessions:

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

async function logSession(sessionId, request, response) {
  const sessionData = {
    sessionId,
    timestamp: new Date().toISOString(),
    request,
    response,
    coachType: request.coachType || 'unknown'
  };

  await s3.putObject({
    Bucket: 'claude-agents-sessions',
    Key: `sessions/${sessionId}.json`,
    Body: JSON.stringify(sessionData, null, 2),
    ContentType: 'application/json'
  }).promise();
}
```

### 4.3 Session Export for Evaluation

Create script to export sessions as markdown for evaluation:

```bash
# scripts/export-sessions.js
node scripts/export-sessions.js --coach spanish_cr --since 2025-01-20
```

---

## Phase 5: SSL/HTTPS (Day 3)

### 5.1 Install Certbot

```bash
# Amazon Linux
sudo yum install -y certbot python3-certbot-nginx

# Ubuntu
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Obtain Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

### 5.3 Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job
```

---

## Phase 6: Claude Code Terminal Setup (Day 3)

### 6.1 Install Claude Code CLI

```bash
# Ensure Rust is installed
cargo --version

# Build from source or install via npm
npm install -g @anthropic-ai/claude-code
```

### 6.2 Configure Claude Code

```bash
# Set API key
export ANTHROPIC_API_KEY="sk-ant-api03-your-key"

# Or create config file
mkdir -p ~/.claude
echo "api_key = \"sk-ant-api03-your-key\"" > ~/.claude/config.toml
```

### 6.3 Test Connection

```bash
cd ~/Claude-Agents
claude-code

# Should start interactive session
```

---

## Phase 7: Monitoring & Alerts (Optional but Recommended)

### 7.1 CloudWatch Setup

```bash
# Install CloudWatch agent
sudo yum install -y amazon-cloudwatch-agent

# Configure
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### 7.2 Set Up Alerts
- CPU utilization > 80%
- Memory utilization > 80%
- API error rate > 5%
- Disk space < 20%

---

## Execution Checklist

### Monday (Day 1)
- [ ] Create/configure AWS account
- [ ] Launch EC2 instance
- [ ] SSH into server
- [ ] Install dependencies (git, nginx, node, rust)
- [ ] Clone repository
- [ ] Configure and start Nginx
- [ ] Verify static site accessible

### Tuesday (Day 2)
- [ ] Create API proxy server
- [ ] Configure environment variables
- [ ] Start API server with PM2
- [ ] Update frontend to use proxy
- [ ] Test end-to-end chat flow
- [ ] Set up S3 bucket for sessions
- [ ] Implement session logging

### Wednesday (Day 3)
- [ ] Set up SSL with Certbot
- [ ] Install Claude Code CLI
- [ ] Configure terminal access
- [ ] Test full workflow
- [ ] Set up basic monitoring
- [ ] Document any issues/learnings

---

## Cost Estimates

| Service | Monthly Cost (Estimate) |
|---------|------------------------|
| EC2 t3.small | ~$15 |
| S3 (minimal) | ~$1 |
| Data transfer | ~$5 |
| **Total** | **~$21/month** |

*Costs will vary based on usage. Consider Reserved Instances for long-term savings.*

---

## Rollback Plan

If issues arise:
1. GitHub Pages site remains available as fallback
2. Can revert frontend to direct API calls (user-provided keys)
3. EC2 instance can be terminated without data loss (S3 persists)

---

## Security Checklist

- [ ] API key stored in environment variable, not code
- [ ] SSH key pair secured (chmod 400)
- [ ] Security group restricts SSH to your IP
- [ ] HTTPS enabled for all traffic
- [ ] Regular system updates scheduled
- [ ] CloudWatch alerts configured
- [ ] IAM roles follow least-privilege principle
