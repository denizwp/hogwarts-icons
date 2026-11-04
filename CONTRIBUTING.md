# Contributing

You can add icons by pull request and translate icon names into your language. These images reach players' screens in live games, so nothing merges on its own. The owner reviews and approves every change, and can refuse any image.

## Terms

In the pull request, state where each image came from:

- **Made by me:** you made the image or hold the rights to it, and Wychwood and anyone else may use it in non-commercial projects. If an AI tool made the image or part of it, say so. AI-made images are allowed when declared.
- **From the game:** a file from Hogwarts Legacy.
- **From a mod:** a file from a mod. Name the mod.

Game and mod files are accepted, but this project does not license them and their rights stay with their owners. Your non-commercial permission applies only to what you made. If you edited a game or mod file, it covers your changes and not the original.

The made-by-me terms also cover translations: you wrote them, and they may be used the same way. Nothing here grants rights to the Harry Potter or Wizarding World names, characters or marks. See [ASSETS.md](ASSETS.md).

## Adding icons

1. Fork the repository and create a branch.
2. Add `.webp` files in the folder under `icons/` that fits. Most icons belong in `icons/items/`.
3. Open a pull request and fill in the template.

To convert an image: `cwebp -q 85 -metadata none input.png -o my_icon.webp`.

### Rules

| | Under `icons/items/` | Elsewhere under `icons/` |
|---|---|---|
| File size | 64 KiB | 512 KiB |
| Longest side | 512 px | 1600 px |
| Total pixels | 262,144 | 1,500,000 |
| Shortest side | 32 px | 32 px |

- Real WebP files only, not renamed PNGs. No animation, and strip metadata.
- Paths use letters, digits, `_`, `-` and `.`. Keep `.webp` in lower case.
- [ASSETS.md](ASSETS.md) uses file name prefixes to say where a file came from. Use `UI_T_` for files from the game and `MOD_` for files from mods, in a folder under `icons/items/` other than `shop` and `cards`. The `wy_` prefix is reserved for this project.
- Do not change the paths of existing files, because games use those URLs directly.

**Replacing an image** changes what players see at a URL already in use. **Changing anything in `.github/` or a file at the repository root** changes the site or the automation. All of these fail the check on purpose: say why in the pull request, and the owner merges exceptions by hand.

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
