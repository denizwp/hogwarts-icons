# Contributing

You can add icons by pull request and translate icon names into your language. These images reach players' screens in live games, so nothing merges on its own. The owner reviews and approves every change, and can refuse any image.

## Terms

By contributing, you confirm that:

- You made the image, or you hold the rights to submit it.
- Wychwood and anyone else may use it in non-commercial projects.
- If an AI tool made the image or part of it, you say so in the pull request. AI-made images are allowed when declared.

The same terms cover translations: you wrote them, and they may be used the same way. Nothing here grants rights to the Harry Potter or Wizarding World names, characters or marks. See [ASSETS.md](ASSETS.md).

**Files extracted from the game:** whether new ones are accepted is not settled yet. Open an issue and ask before you submit any.

## Adding icons

1. Fork the repository and create a branch.
2. Add `.webp` files in the folder under `wychwood/` that fits. Most icons belong in `wychwood/items/`.
3. Open a pull request and fill in the template.

To convert an image: `cwebp -q 85 -metadata none input.png -o my_icon.webp`.

### Rules

| | Under `wychwood/items/` | Elsewhere under `wychwood/` |
|---|---|---|
| File size | 64 KiB | 512 KiB |
| Longest side | 512 px | 1600 px |
| Total pixels | 262,144 | 1,500,000 |
| Shortest side | 32 px | 32 px |

- Real WebP files only, not renamed PNGs. No animation, and strip metadata.
- Paths use letters, digits, `_`, `-` and `.`. Keep `.webp` in lower case.
- Do not start new file names with `UI_T_`, `MOD_` or `wy_`. [ASSETS.md](ASSETS.md) uses those prefixes to say where a file came from.
- Do not change the paths of existing files, because games use those URLs directly.

**Replacing an image** changes what players see at a URL already in use, so say why in the pull request. The check flags it for the owner.

**Removing an image** is not done by pull request. Rights holders can open an issue.

### Automated check

Every pull request runs `.github/workflows/validate.yml`. It reads your files as data and checks the rules above. To run the same check locally:

```
python .github/scripts/validate_pr.py --base origin/main --head HEAD
```

It reads file headers and does not look at the picture itself, so the owner still does.

## Translating names

The easiest way is the catalog site, which fills in the [translation form](.github/ISSUE_TEMPLATE/translation.yml) for you. A workflow checks the data and opens a pull request for the owner. If something is wrong, it replies on your issue, and editing the issue runs it again.

You can also edit `names/<lang>.json` by pull request. To add a language, add it to `names/languages.json` in the same pull request.

Format and rules are in [docs/CONTRIBUTION-CONTRACT.md](docs/CONTRIBUTION-CONTRACT.md). In short: a name is plain text of up to 120 characters, with no HTML and no links, and its key must be an existing image or folder path without the extension.
