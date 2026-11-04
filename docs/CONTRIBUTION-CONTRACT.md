# Contribution contract

What the site (`index.html`, `docs.html`, `catalog.js`, `catalog.css`) and the repository automation agree on. If you change one side, change this file too.

Repository: `denizwp/hogwarts-icons`. CDN base: `https://cdn.tools.deniz.cyou/`.

## Names files

| Repository path | Served at | Content |
|---|---|---|
| `names/<lang>.json` | `/names/<lang>.json` | Display names for one language |
| `names/languages.json` | `/names/languages.json` | The languages that can be translated into |

`names.en.json` at the root is gone from the repository and replaced by `names/en.json`. The old copy stays on the CDN because deploys never delete, but it no longer updates. The site must read `/names/en.json`.

### `names/<lang>.json`

A flat JSON object, UTF-8, sorted by key, one space of indent, LF line endings:

```json
{
 "wychwood/herbs/dittany": "Dittany",
 "wychwood/items/shop/wy_anahtar": "Key"
}
```

- A key is a repository path without the extension: an image (`wychwood/items/shop/wy_anahtar` for `wychwood/items/shop/wy_anahtar.webp`) or a folder that contains images (`wychwood/herbs/dittany`). Folder keys label the tree.
- A value is the display name. It is plain text; render it with `textContent`, never `innerHTML`.
- Files are partial. A missing key is normal, and a missing file (404) means an empty translation.

Fallback for an image: the language's name, then what the site shows today (`pretty(file)` in English, the file name in Turkish). Do not fall back to another language unless the page says so.

`names/tr.json` exists but is small. It holds only names where the game's own Turkish label is the file name with its spelling restored (`wy_anahtar` to `Anahtar`), so most Turkish icons still use the file name.

### `names/languages.json`

```json
{ "en": "English", "tr": "Türkçe" }
```

Keys are language codes, values are the language's own name. A code outside this file is refused. Adding one is a pull request the owner reviews.

### Rules for a name

Check these in the client so people see problems before they submit. The server checks them again.

- Key is a known image or folder key from the catalog.
- After trimming, 1 to 120 characters. Send the trimmed value.
- No `<` or `>`, no HTML entity such as `&amp;` (a bare `&` is fine), no `://`.
- No control characters, no line breaks, no bidirectional override characters (U+202A to U+202E, U+2066 to U+2069).

## Translation issue form

Template: `.github/ISSUE_TEMPLATE/translation.yml`, applied label `translation`.

| Field id | Type | Prefill | Meaning |
|---|---|---|---|
| `payload` | textarea, `render: json` | Yes | The JSON body below |
| `terms` | required checkbox | No | The person must tick it on GitHub |

The issue title carries no data. The automation ignores it, so it can be anything.

## JSON body

```json
{
  "lang": "tr",
  "names": {
    "wychwood/items/shop/wy_anahtar": "Anahtar"
  }
}
```

- Exactly the two keys `lang` and `names`. Anything else is refused.
- `lang` must be a key of `names/languages.json`.
- `names` holds only the entries this person added or changed, at least one. Entries merge over the current file. A translation cannot delete a name.
- At most 60,000 characters of JSON in one issue.

## Building the prefilled URL

```js
var REPO = 'https://github.com/denizwp/hogwarts-icons';
var URL_LIMIT = 8000;

function issueUrl(body) {
  var base = REPO + '/issues/new?template=translation.yml&title=' +
    encodeURIComponent('[translation] ' + body.lang);
  var full = base + '&payload=' + encodeURIComponent(JSON.stringify(body));
  return full.length <= URL_LIMIT ? { url: full, prefilled: true } : { url: base, prefilled: false };
}
```

The form field id is the query parameter name. Use `encodeURIComponent`, not `URLSearchParams`, and measure the encoded length: a non-Latin letter costs 6 or more characters once encoded.

### Above the limit

Long URLs fail at GitHub or in the browser, so never send one above about 8 KB.

1. Up to 60,000 characters of JSON: copy the JSON to the clipboard, show it in a read-only box with a copy button, then open `base` (the URL with no `payload`) and tell the person to paste it into the "Translation data" field.
2. Above 60,000 characters: split `names` into parts of whole entries, each with its own `lang` and at most 60,000 characters, and offer each part as its own issue. Each part becomes its own pull request.

Tell the person they need a GitHub account and must tick the terms box. The repository is private for now, so these links work only for people with access until it goes public.

## What happens next

The workflow checks the issue and replies in a comment. If the data is good, it opens a pull request from `translation/issue-<number>`. If not, the comment lists the problems, and editing the issue runs it again. Nothing merges without the owner. After merge, the deploy publishes `names/`, so a client should fetch names with `cache: 'no-cache'`.
