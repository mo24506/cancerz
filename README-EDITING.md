# CancerZ Academy — Free Editable Website

This is a 100% free, static website. It uses only HTML, CSS, JavaScript and the supplied logo.
There is no paid theme, WordPress subscription, framework license, or build step.

## Files

- `index.html` — all page content and structure
- `styles.css` — layout, typography, colors, cards, responsive design
- `script.js` — mobile menu, course filters, course popup, demo signup interaction
- `assets/logo-original.jpg` — the original uploaded logo
- `assets/logo-cropped.jpg` — a whitespace-trimmed copy of the same logo artwork, used in the layout

## How to edit the website exactly

### 1. Change the colors
Open `styles.css` and go to the very top:

```css
:root{
  --navy:#1B2D64;
  --purple:#6B3B8F;
  --teal:#00A29E;
  ...
}
```

Change the HEX value after any variable. The entire website will update.

Suggested brand palette:
- Navy: `#1B2D64`
- Deep Navy: `#0E1A43`
- Purple: `#6B3B8F`
- Teal: `#00A29E`
- Soft Teal: `#3CA8A5`
- White: `#FFFFFF`

### 2. Change the text
Open `index.html` in any text editor such as VS Code, Notepad++, or even Notepad.
Search for the sentence you want to change and replace it.

Examples:
- Website title: search `CancerZ Academy`
- Hero headline: search `Learn science.`
- Course names: search `Foundations of Cancer Biology`
- Footer copyright: search `© 2026 CancerZ Academy`

### 3. Add / remove courses
Inside `index.html`, find:

```html
<div class="course-grid">
```

Each `<article class="course-card"> ... </article>` is one course.
Copy one card, paste it, then change its title, description, category and duration.

Available filter categories are:
- `biology`
- `data`
- `research`

For a new card, keep this format:

```html
<article class="course-card" data-category="biology">
  ...
</article>
```

### 4. Replace the logo
Put your new logo inside `assets/` and update these image paths in `index.html`:

```html
<img src="assets/logo-cropped.jpg" alt="CancerZ logo" />
```

The site is already using the supplied logo. `logo-original.jpg` is kept as the untouched source.

### 5. Change the navigation
In `index.html`, look for:

```html
<nav id="mainNav" class="main-nav">
```

Edit the links and section names there.

### 6. Change the course popup
Open `script.js` and find the `descriptions` object.
Add or edit the description for each course.

### 7. Connect the signup form
The signup form is currently a front-end demo so the site works without any service.
To collect real emails, replace the `<form id="signupForm">` behavior with your preferred free email service/form endpoint.

### 8. Put the website online for free

#### Option A — GitHub Pages (recommended)
1. Create a free GitHub account.
2. Create a new public repository.
3. Upload the contents of this folder.
4. Open **Settings → Pages**.
5. Choose **Deploy from a branch**.
6. Select `main` and `/root`.
7. Save.
8. GitHub will give you a live public URL.

#### Option B — Netlify
1. Create a free Netlify account.
2. Choose **Add new site → Deploy manually**.
3. Drag the whole folder into the upload area.
4. Netlify gives you a live URL.

## Editing visually

If you do not want to edit code:
- VS Code is free and works very well for this project.
- Cursor also has a free tier and can edit the code using natural language.
- You can also upload the folder to GitHub and edit individual files from the browser.

## Important

This is a front-end website template. Course enrollment, authentication, payment, student dashboards, video hosting, certificates, and databases are not connected yet.
