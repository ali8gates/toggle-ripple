# How to edit and share Ripple

A short guide for changing the text, adding scenarios, and sharing it with the team. No coding background needed for the text edits.

---

## 1. Where the text lives

Almost all the visible text is in two files.

**`index.html`** holds the fixed labels: the banner at the top, the section headings, the button labels, and the card titles. Open it in any text editor, find the words you want to change, type over them, and save. Search for the exact phrase you see on screen and you will find it.

**`app.js`** holds the scenario content: each event's title, its one line description, the ripple steps, and the trade thesis. Near the top of the file you will see a block that starts with `const SCENARIOS`. Each scenario has:

- `title` — the headline on the event card
- `desc` — the one line under the title
- `narrative.what` — the "what happened" paragraph
- `narrative.ripple` — the 1-hop, 2-hop, 3-hop steps
- `narrative.trade` — the non-obvious trade line

Change the text inside the quotation marks, keep the quotation marks, and save.

---

## 2. Preview your changes

Open `index.html` in your browser, or serve the folder and open the local address (see the README). Refresh after each save to see the change.

---

## 3. Add a new scenario

In `app.js`, copy one of the three existing blocks inside `SCENARIOS`, give it a new short key (for example `oilshock`), and edit its `nodes` and `edges`. Each node needs an `id`, a `label`, a `degree` (0 for the event, then 1, 2, 3 for each hop out), and a `ticker` if it should show a price. Add the ticker and its price to `quotes.json` so it appears on the live tape. To make it typable in the plain English box, add its keywords to the `NLP_MAP` list further down in `app.js`.

---

## 4. Share it with the team

You have three ways, from easiest to most custom.

**A. Send the folder.** Zip this folder and send it. Anyone can unzip it and double click `index.html`. It runs offline because the prices are baked in. This is the simplest way to hand it to a colleague.

**B. GitHub Pages (free hosting, clean link from your account).** Push this folder to a GitHub repository, then in the repository settings turn on Pages and point it at the main branch. GitHub gives you a link like `https://yourusername.github.io/reflexivity-ripple`. It is hosted from your account, free, and there is no mention of any tool that built it.

**C. Your own domain.** If you want something like `ripple.yourdomain.com`, host the same folder on a service such as Netlify or Vercel and point your domain at it.

---

## 5. A note on the plain English box

The box matches your typed question to the closest scenario using keywords. It is deliberately simple so it cannot fail in front of an audience. When this sits on the real graph, that box is where a language model reads the question and picks the entities. The behavior the team sees stays the same, but the matching gets much smarter.
