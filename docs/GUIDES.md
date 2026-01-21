# Language Lab Guides

Operational guides for maintaining and using the Language Lab coaches.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Updating Coach Instructions](#updating-coach-instructions)
3. [Adding a New Coach](#adding-a-new-coach)
4. [Data Collection & Retrieval](#data-collection--retrieval)
5. [Tester Instructions](#tester-instructions)
6. [Evaluation Workflow](#evaluation-workflow)

---

## Architecture Overview

### How the System Works

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Browser                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ Chat UI     │───▶│ chat-core.js │───▶│ Anthropic API │  │
│  │ (HTML/CSS)  │    │              │    │ (Claude)      │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│         │                  │                               │
│         │                  ▼                               │
│         │           ┌──────────────┐                       │
│         │           │ localStorage │  ◀── Session data     │
│         │           │ (browser)    │      stays here       │
│         │           └──────────────┘                       │
│         │                  │                               │
│         ▼                  ▼                               │
│  ┌─────────────────────────────────────┐                   │
│  │ Export Button → Downloads .md file  │                   │
│  └─────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### Key Points

| Component | Location | Who Can Access |
|-----------|----------|----------------|
| Coach System Prompt | `docs/assets/js/chat-[coach].js` | You (via GitHub) |
| Chat Interface | `docs/coach/[coach].html` | Anyone with the URL |
| Session Data | User's browser localStorage | Only that user |
| Exported Transcripts | User downloads → sends to you | You (after user shares) |

### Implications

- **Updating instructions requires editing JavaScript files** (not the Specialists/ markdown files)
- **Session data is NOT automatically collected** - users must export and share
- **Each user's data is isolated** - you cannot see their sessions remotely

---

## Updating Coach Instructions

When you improve a coach's Instructions.md, you must also update the web version.

### Step 1: Edit the Source Instructions

Update the canonical instructions in the repo:
```
Specialists/Spanish Coach (CR)/Agent Files/Instructions.md
```

### Step 2: Update the JavaScript System Prompt

Open the corresponding JavaScript file:
```
docs/assets/js/chat-spanish.js
```

Find the `SPANISH_CR_SYSTEM_PROMPT` constant (or equivalent) and update it to match your Instructions.md changes.

### Step 3: Update Version Number

In `docs/assets/js/config.js`, update the version:
```javascript
coaches: {
  spanish_cr: {
    id: 'spanish_cr',
    name: 'Spanish Coach (Costa Rica)',
    version: 'v1.1',  // ← Increment this
    // ...
  }
}
```

### Step 4: Commit and Deploy

```bash
git add docs/assets/js/chat-spanish.js docs/assets/js/config.js
git commit -m "Update Spanish Coach to v1.1: [describe changes]"
git push origin main
```

GitHub Pages will redeploy automatically (1-2 minutes).

### Keeping Files in Sync

To avoid divergence, consider this workflow:

1. Design changes in Instructions.md first
2. Test locally with the Rust CLI agent
3. Once validated, copy the system prompt to the JavaScript file
4. Deploy to web

**Future improvement:** We could fetch Instructions.md at runtime, but this adds complexity and latency.

---

## Adding a New Coach

### Step 1: Create the JavaScript File

Copy an existing coach file as a template:
```bash
cp docs/assets/js/chat-spanish.js docs/assets/js/chat-japanese.js
```

Edit `chat-japanese.js`:
1. Rename the system prompt constant: `JAPANESE_KYOTO_SYSTEM_PROMPT`
2. Replace the prompt content with your Japanese Coach instructions
3. Update the config reference: `CONFIG.coaches.japanese_kyoto`

### Step 2: Add to Config

In `docs/assets/js/config.js`, ensure the coach is defined:
```javascript
coaches: {
  // ... existing coaches ...
  japanese_kyoto: {
    id: 'japanese_kyoto',
    name: 'Japanese Coach (Kyoto)',
    tagline: 'Explore Kyoto dialect with cultural depth',
    version: 'v1.0',
    model: 'claude-sonnet-4-20250514'
  }
}
```

### Step 3: Create the HTML Page

Copy the Spanish coach page:
```bash
cp docs/coach/spanish.html docs/coach/japanese.html
```

Edit `japanese.html`:
1. Update the title and header text
2. Change the script import at the bottom:
   ```html
   <script src="../assets/js/chat-japanese.js"></script>
   ```
3. Update any coach-specific styling or badges

### Step 4: Update the Landing Page

Edit `docs/coach/index.html`:
- Remove the "Coming Soon" styling from the Japanese card
- Add a working link: `<a href="japanese.html" class="btn btn-primary">Start Learning</a>`

### Step 5: Deploy

```bash
git add docs/
git commit -m "Add Japanese Coach (Kyoto) to Language Lab"
git push origin main
```

---

## Data Collection & Retrieval

### Where Data Lives

| Data Type | Storage Location | Persistence |
|-----------|------------------|-------------|
| Session transcripts | User's browser localStorage | Until user clears browser data |
| Exported files | User's downloads folder | Until user deletes |
| Evaluation results | Repo: `Specialists/[Coach]/Agent Files/Interactions/` | Permanent (in git) |

### How Users Export Data

1. During or after a chat session, click **"Export Session"**
2. A markdown file downloads: `session_[timestamp]_[id].md`
3. User sends this file to you (email, file share, or PR)

### How You Retrieve Data

**Option A: Users Send Files Directly**
- Users email or share exported .md files
- You save them to `Specialists/[Coach]/Agent Files/Interactions/`

**Option B: Users Submit Pull Requests**
- Testers fork the repo or create a branch
- They add their exported files to `Interactions/`
- They submit a PR
- You review and merge

**Option C: Users Paste Transcripts**
- For quick feedback, users can copy/paste from the chat
- Less structured but faster

### Viewing localStorage (For Debugging)

Users can view their stored data:
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage** → select the site
4. Look for `claude_agents_sessions`

### Clearing Data

Users can clear their session history:
```javascript
// In browser console
localStorage.removeItem('claude_agents_sessions');
```

---

## Tester Instructions

Share this section with external testers.

### Getting Started

1. **Get an API Key**
   - Go to [console.anthropic.com](https://console.anthropic.com)
   - Create an account and generate an API key
   - Your key starts with `sk-ant-api03-...`

2. **Start a Session**
   - Visit the coach page (e.g., `/coach/spanish.html`)
   - Enter your API key
   - Click "Start Learning"

3. **Chat Naturally**
   - The coach will greet you and ask about your background
   - Respond naturally - no special format needed
   - The coach adjusts to your level

### Providing Feedback

**During the Session:**
- Click **"Give Feedback"** to open the feedback form
- Rate the session and note any errors or vocabulary learned

**After the Session:**
- Click **"Export Session"** to download the transcript
- Send the file to the project owner

### What Helps Most

- **Note specific errors:** "The coach said X but should have said Y"
- **Describe your level:** "I'm intermediate but the coach treated me as beginner"
- **Mention what worked:** "The cultural explanation of pura vida was great"

### Privacy

- Your API key stays in your browser only
- Session data is stored locally on your device
- Only you can access your data unless you export and share it

---

## Evaluation Workflow

How to process collected session data through the Bayesian evaluation framework.

### Step 1: Collect Interaction Files

Gather exported session files from testers and save them:
```
Specialists/Spanish Coach (CR)/Agent Files/Interactions/
├── session_2025-01-17_abc123.md
├── session_2025-01-18_def456.md
└── ...
```

### Step 2: Run Evaluation

For each interaction, use the Evaluator Prompt:

1. Open the Evaluator Prompt template:
   ```
   Project Team (PT)/Team Files/Evaluator_Prompt.md
   ```

2. Fill in the context:
   - Agent: Spanish Coach (CR)
   - Agent Purpose: Costa Rican Spanish language coaching
   - Task Type: [routine | moderate | complex]
   - Paste the interaction transcript

3. Run through Claude (Opus recommended) to get judgment

### Step 3: Record Observation

Update the coach's Evaluation Framework:
```
Specialists/Spanish Coach (CR)/Agent Files/Evaluation_Framework.md
```

Add to the YAML front matter:
```yaml
observations:
  - id: OBS-001
    timestamp: 2025-01-17T10:30:00Z
    task_type: moderate
    interaction_ref: Interactions/session_2025-01-17_abc123.md
    evaluator_judgment:
      understanding: good
      understanding_failure_type: none
      output_quality: good
      rationale: "Coach correctly assessed intermediate level..."
```

Update hypothesis counters:
```yaml
hypotheses:
  - id: H1
    # ...
    observation_count: 1
    consistent_count: 1  # If this observation supports H1
    inconsistent_count: 0
```

### Step 4: Check Status Thresholds

Hypothesis status transitions:
- `untested` → `testing`: First observation recorded
- `testing` → `supported`: 5+ observations, >80% consistent
- `testing` → `refuted`: 5+ observations, >40% inconsistent

### Step 5: Update Global View

Run rollup to update system-level summary:
```
Project Team (PT)/Team Files/Global_Evaluation.md
```

Update the agent's entry with new observation count and hypothesis status.

### Step 6: Iterate

If observations reveal issues:
1. Update the coach Instructions.md
2. Sync changes to the JavaScript system prompt
3. Deploy updated version
4. Collect new observations to verify improvement

---

## Quick Reference

### File Locations

| Purpose | Path |
|---------|------|
| Web coach system prompt | `docs/assets/js/chat-[coach].js` |
| Web coach HTML | `docs/coach/[coach].html` |
| Web config | `docs/assets/js/config.js` |
| Canonical instructions | `Specialists/[Coach]/Agent Files/Instructions.md` |
| Evaluation framework | `Specialists/[Coach]/Agent Files/Evaluation_Framework.md` |
| Collected interactions | `Specialists/[Coach]/Agent Files/Interactions/` |
| Evaluator prompt | `Project Team (PT)/Team Files/Evaluator_Prompt.md` |

### Commands

```bash
# Preview locally
cd docs && docker-compose up

# Deploy changes
git add docs/
git commit -m "Update message"
git push origin main

# Stop local preview
docker-compose down
```
