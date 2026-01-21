# Claude Agents Website

Personal portfolio and Language Lab - browser-based language coaches.

## Local Preview with Docker

```bash
cd docs
docker-compose up
```

Then visit http://localhost:8080

Changes to files will be reflected immediately (volume mount).

To stop: `Ctrl+C` or `docker-compose down`

## Alternative: Python Simple Server

```bash
cd docs
python -m http.server 8080
```

Then visit http://localhost:8080

## Structure

```
docs/
├── index.html          # Portfolio landing page
├── about.html          # About page
├── projects.html       # Projects showcase
├── coach/
│   ├── index.html      # Language Lab landing
│   └── spanish.html    # Spanish Coach (Costa Rica)
├── assets/
│   ├── css/
│   │   ├── main.css    # Global styles
│   │   └── chat.css    # Chat interface styles
│   └── js/
│       ├── config.js   # Configuration
│       ├── chat-core.js        # Core chat functionality
│       ├── data-collector.js   # Session logging
│       └── chat-spanish.js     # Spanish coach init
├── Dockerfile
└── docker-compose.yml
```

## Using the Spanish Coach

1. Navigate to /coach/spanish.html
2. Enter your Anthropic API key (get one at console.anthropic.com)
3. Start chatting with the coach
4. Use "Export Session" to download the transcript for evaluation

## Data Storage

Sessions are stored in localStorage. To export:
1. Click "Export Session" during or after a chat
2. A markdown file will download
3. Place in `Specialists/Spanish Coach (CR)/Agent Files/Interactions/`
