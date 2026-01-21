# Deploying to GitHub Pages

This guide walks through deploying the Claude Agents website to GitHub Pages.

## Prerequisites

- Repository pushed to GitHub (charrisonpro/Claude-Agents)
- The `docs/` folder contains your site files

## Step 1: Commit the docs folder

Make sure all your site files are committed:

```bash
cd /Users/connorharrison/Documents/GitHub/Claude-Agents
git add docs/
git commit -m "Add website for GitHub Pages deployment"
git push origin main
```

## Step 2: Enable GitHub Pages

1. Go to your repository on GitHub:
   https://github.com/charrisonpro/Claude-Agents

2. Click **Settings** (gear icon in the top menu)

3. In the left sidebar, scroll down and click **Pages**

4. Under **Source**, select:
   - **Branch:** `main`
   - **Folder:** `/docs`

5. Click **Save**

## Step 3: Wait for Deployment

GitHub will automatically build and deploy your site. This usually takes 1-2 minutes.

You'll see a green checkmark and a link when it's ready:
```
Your site is live at https://charrisonpro.github.io/Claude-Agents/
```

## Step 4: Verify the Site

Visit your live site:
- **Home:** https://charrisonpro.github.io/Claude-Agents/
- **Language Lab:** https://charrisonpro.github.io/Claude-Agents/coach/
- **Spanish Coach:** https://charrisonpro.github.io/Claude-Agents/coach/spanish.html

## Updating the Site

After making changes:

```bash
git add docs/
git commit -m "Update website"
git push origin main
```

GitHub Pages will automatically redeploy (usually within 1-2 minutes).

## Custom Domain (Optional)

To use a custom domain like `yourdomain.com`:

### Step 1: Add CNAME file

Create `docs/CNAME` with your domain:
```
yourdomain.com
```

### Step 2: Configure DNS

Add these DNS records at your domain registrar:

**For apex domain (yourdomain.com):**
```
Type: A
Name: @
Value: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: charrisonpro.github.io
```

### Step 3: Enable in GitHub Settings

1. Go to Settings → Pages
2. Under "Custom domain", enter your domain
3. Check "Enforce HTTPS" (after DNS propagates)

DNS propagation can take up to 48 hours, but usually completes within a few hours.

## Troubleshooting

### Site not updating?
- Check the Actions tab for build errors
- Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)
- Wait a few more minutes for cache to clear

### 404 errors on pages?
- Ensure all links use correct relative paths
- Check that filenames match exactly (case-sensitive)

### API calls not working?
- The Anthropic API requires `anthropic-dangerous-direct-browser-access: true` header
- Ensure you're using a valid API key
- Check browser console for CORS errors

### CSS/JS not loading?
- Verify paths in HTML files use `../assets/` correctly
- Check browser console for 404 errors on resources

## File Structure Reference

```
docs/
├── index.html              # https://[site]/
├── about.html              # https://[site]/about.html
├── projects.html           # https://[site]/projects.html
├── coach/
│   ├── index.html          # https://[site]/coach/
│   └── spanish.html        # https://[site]/coach/spanish.html
├── assets/
│   ├── css/
│   └── js/
├── CNAME                   # Custom domain (optional)
├── Dockerfile              # Local preview (not deployed)
└── docker-compose.yml      # Local preview (not deployed)
```

## Security Notes

- API keys entered by users are stored in their browser's localStorage only
- Keys are sent directly to Anthropic's API, never to your server
- The site is static - no server-side code runs on GitHub Pages
- Consider adding a privacy policy if collecting session data
