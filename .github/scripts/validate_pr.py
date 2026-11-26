"""Check what a pull request changes, reading its files as git objects only.

The pull request is never checked out or executed: paths, modes and blobs come
from the object database. Run this file from a checkout of the base branch.

    python .github/scripts/validate_pr.py --base origin/main --head HEAD
"""
import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import checks  # noqa: E402

MAX_FILES = 500
MAX_TOTAL_BYTES = 50 * 1024 * 1024
SEGMENT = re.compile(r'[A-Za-z0-9_](?:[A-Za-z0-9_.-]*[A-Za-z0-9_-])?')
WINDOWS_RESERVED = re.compile(r'(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?', re.I)
FORBIDDEN = re.compile(r'(^|/)(\.cdn-guncelle\.sh|cdn-guncelle\.bat|index\.json|[^/]*\.zip)$', re.I)
PROJECT_PREFIX = re.compile(r'^wy_', re.I)
SOURCE_PREFIX = re.compile(r'^(UI_T_|MOD_)', re.I)
SOURCE_FOLDER = re.compile(r'^icons/items/(?!cards/)[^/]+/')


class Report:
    def __init__(self):
        self.errors = []
        self.warnings = []

    def error(self, path, message):
        self.errors.append((label(path), message))

    def warn(self, path, message):
        self.warnings.append((label(path), message))


LABELS = ('(pull request)', '(description)')


def label(path):
    return path if path in LABELS else checks.safe(path)


def parse_tree(raw):
    tree = {}
    for entry in raw.split(b'\0'):
        if entry:
            meta, path = entry.split(b'\t', 1)
            mode, _kind, sha = meta.split()
            tree[path.decode('utf-8', 'replace')] = (mode.decode(), sha.decode())
    return tree


def parse_diff(raw):
    parts = raw.split(b'\0')
    changes = []
    for i in range(0, len(parts) - 1, 2):
        _old_mode, new_mode, _old_sha, new_sha, status = parts[i].decode().lstrip(':').split()
        changes.append((status[0], parts[i + 1].decode('utf-8', 'replace'), new_mode, new_sha))
    return changes


def path_problem(path):
    if len(path) > checks.PATH_MAX:
        return f'the path is longer than {checks.PATH_MAX} characters'
    if '..' in path:
        return 'the path contains ..'
    segments = path.split('/')
    start = 0
    if segments[0] == '.github':
        start = 1
    elif path == '.gitignore':
        return None
    for segment in segments[start:]:
        if not SEGMENT.fullmatch(segment):
            return 'unsafe characters in the path: use letters, digits, _ - and .'
        if WINDOWS_RESERVED.fullmatch(segment):
            return 'the path uses a name reserved on Windows'
    return None


def owner_only_problem(path):
    if path.startswith('.github/'):
        return 'changes repository automation. Read this diff first: the checks themselves can be altered here. The owner merges exceptions by hand'
    if path.startswith('deploy/'):
        return 'changes the deploy scripts, which run with the CDN key after merging. The owner merges exceptions by hand'
    if '/' not in path:
        return 'changes a file at the repository root. The owner merges exceptions by hand'
    return None


def check_names_file(repo, path, sha, head_tree, report):
    size = int(checks.git(repo, 'cat-file', '-s', sha))
    if size > checks.NAMES_FILE_MAX:
        report.error(path, f'{size} bytes, the limit is {checks.NAMES_FILE_MAX}')
        return
    try:
        data = checks.parse_json(checks.git(repo, 'cat-file', 'blob', sha).decode('utf-8'))
    except UnicodeDecodeError:
        report.error(path, 'not UTF-8')
        return
    except ValueError as err:
        report.error(path, str(err))
        return
    if path == checks.LANGUAGES_FILE:
        for problem in checks.languages_problems(data):
            report.error(path, problem)
        if isinstance(data, dict) and 'en' not in data:
            report.error(path, 'en must stay in the list')
        report.warn(path, 'changes which languages can be translated')
        return

    code = path[len(checks.NAMES_DIR):-len('.json')]
    if not checks.LANG_RE.fullmatch(code):
        report.error(path, 'names files are named after a language code, like tr.json or pt-BR.json')
        return
    languages = {}
    entry = head_tree.get(checks.LANGUAGES_FILE)
    if entry:
        try:
            languages = checks.parse_json(checks.git(repo, 'cat-file', 'blob', entry[1]).decode('utf-8'))
        except ValueError:
            languages = {}
    if not isinstance(languages, dict) or code not in languages:
        report.error(path, 'this language is not listed in names/languages.json')
    problems = checks.names_problems(data, checks.known_keys(head_tree))
    for problem in problems[:30]:
        report.error(path, problem)
    if len(problems) > 30:
        report.error(path, f'and {len(problems) - 30} more problems')
    if isinstance(data, dict) and list(data) != sorted(data):
        report.warn(path, 'keys are not sorted, which makes diffs and merges harder')


def game_icons(repo, base_tree):
    entry = base_tree.get(checks.GAME_ICONS_FILE)
    if not entry:
        return None
    return checks.parse_game_icons(checks.git(repo, 'cat-file', 'blob', entry[1]).decode('utf-8', 'replace'))


def check_new_image(path, sha, base_images, added_shas, known_game, report):
    """Duplicates of existing or other new images, and UI_T_ names the game does not have."""
    same = base_images.get(sha) or added_shas.get(sha)
    if same:
        report.error(path, f'the same file as {checks.safe(same)}, which is already there: use that URL instead of adding a copy')
    added_shas.setdefault(sha, path)
    file_name = path.rsplit('/', 1)[-1]
    parts = path.split('/')
    if known_game is None or not file_name.upper().startswith('UI_T_') or len(parts) < 4 or parts[1] != 'items' or parts[2] in checks.GAME_NAME_EXEMPT:
        return
    folders = known_game.get(file_name[: -len(checks.IMAGE_EXT)].lower())
    if not folders:
        report.error(path, 'UI_T_ means a file from the game, but the game has no icon by this name. Files you made need a name without UI_T_, mod files start with MOD_')
        return
    hinted = {checks.GAME_FOLDER_HINTS[f] for f in folders if f in checks.GAME_FOLDER_HINTS}
    if hinted and parts[2] not in hinted:
        report.warn(path, f'the game keeps this icon with its {", ".join(sorted(f for f in folders if f in checks.GAME_FOLDER_HINTS))}: it may belong in icons/items/{"/".join(sorted(hinted))}')


def validate(repo, base, head, body=None):
    report = Report()
    merge_base = checks.git(repo, 'merge-base', base, head).decode().strip()
    changes = parse_diff(checks.git(repo, 'diff-tree', '-r', '-z', '--no-renames', '--no-ext-diff', merge_base, head))
    base_tree = parse_tree(checks.git(repo, 'ls-tree', '-r', '-z', '--full-tree', base))
    head_tree = parse_tree(checks.git(repo, 'ls-tree', '-r', '-z', '--full-tree', head))
    if len(changes) > MAX_FILES:
        report.error('(pull request)', f'{len(changes)} files changed, the limit is {MAX_FILES}: split it up')

    known_game = game_icons(repo, base_tree)
    base_images = {}
    for path, (_mode, sha) in base_tree.items():
        if path.startswith(checks.IMAGE_ROOT) and path.endswith(checks.IMAGE_EXT):
            base_images.setdefault(sha, path)
    added_shas = {}
    added_images = []

    head_lower = {}
    for path in head_tree:
        head_lower.setdefault(path.lower(), []).append(path)

    total = 0
    for status, path, mode, sha in changes:
        problem = path_problem(path)
        if problem:
            report.error(path, problem)
        if FORBIDDEN.search(path):
            report.error(path, 'this file must never enter the repository')
        if mode in ('120000', '160000'):
            report.error(path, 'symbolic links and submodules are not allowed')
            continue
        is_image_area = path.startswith(checks.IMAGE_ROOT)
        is_names = path.startswith(checks.NAMES_DIR)
        owner_only = owner_only_problem(path)
        if owner_only:
            report.error(path, owner_only)

        if status == 'D':
            if is_image_area or is_names:
                report.error(path, 'removing this breaks URLs that are in use. Removal requests go through an issue')
            elif not owner_only:
                report.warn(path, 'removes a file outside the image and names folders')
            continue

        if len(head_lower.get(path.lower(), [])) > 1:
            report.error(path, 'another file differs from this path only by upper or lower case')

        size = int(checks.git(repo, 'cat-file', '-s', sha))
        total += size

        if is_image_area:
            if not path.endswith(checks.IMAGE_EXT):
                report.error(path, 'only .webp files are allowed under icons/')
                continue
            if mode != '100644':
                report.error(path, 'the file must not be executable')
            if path.startswith(checks.RETIRED_FOLDERS):
                report.error(path, 'this folder was split up: use a category folder, see CONTRIBUTING.md')
            existing = base_tree.get(path)
            if status == 'M' or (existing and existing[1] != sha):
                report.error(path, 'REPLACES an existing image at a URL games already use. The owner merges exceptions by hand')
            elif status == 'A':
                added_images.append(path)
                check_new_image(path, sha, base_images, added_shas, known_game, report)
                file_name = path.rsplit('/', 1)[-1]
                if PROJECT_PREFIX.match(file_name):
                    report.warn(path, 'new file with the wy_ prefix, which is reserved for this project')
                elif SOURCE_PREFIX.match(file_name) and not SOURCE_FOLDER.match(path):
                    report.warn(path, 'UI_T_ and MOD_ files belong in a folder under icons/items/, not in cards or the artwork folders')
            limits = checks.limits_for(path)
            if size > limits['bytes']:
                report.error(path, f'{size} bytes, the limit here is {limits["bytes"]}')
                continue
            errors, warnings = checks.inspect_webp(checks.git(repo, 'cat-file', 'blob', sha), limits)
            for message in errors:
                report.error(path, message)
            for message in warnings:
                report.warn(path, message)
        elif is_names:
            if not path.endswith('.json') or path.count('/') != 1:
                report.error(path, 'names/ holds only <language>.json files')
            elif mode != '100644':
                report.error(path, 'the file must not be executable')
            else:
                check_names_file(repo, path, sha, head_tree, report)
        elif not owner_only:
            report.warn(path, 'outside icons/ and names/')

    if body is not None:
        for problem in checks.template_problems(body, added_images):
            report.error('(description)', problem)

    if total > MAX_TOTAL_BYTES:
        report.error('(pull request)', f'{total} bytes added, the limit is {MAX_TOTAL_BYTES}: split it up')
    return report, len(changes)


def print_report(report, count):
    in_actions = os.environ.get('GITHUB_ACTIONS') == 'true'
    for level, entries in (('error', report.errors), ('warning', report.warnings)):
        for path, message in entries:
            if in_actions:
                location = f' file={path}' if not path.startswith('(') else ''
                print(f'::{level}{location}::{path}: {message}')
            else:
                print(f'{level.upper()} {path}: {message}')
    print(f'{count} files changed, {len(report.errors)} errors, {len(report.warnings)} warnings')

    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as out:
            out.write(f'### Validation: {len(report.errors)} errors, {len(report.warnings)} warnings, {count} files\n\n')
            for title, entries in (('Errors', report.errors), ('Look at these before approving', report.warnings)):
                if entries:
                    out.write(f'**{title}**\n\n')
                    for path, message in entries:
                        out.write(f'- `{path}`: {message}\n')
                    out.write('\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', default='.')
    parser.add_argument('--base', required=True)
    parser.add_argument('--head', required=True)
    parser.add_argument('--body-file', help='the pull request description, to check the template')
    parser.add_argument('--event', help='a pull_request event file: its description is checked like --body-file')
    parser.add_argument('--json', help='also write the report here as JSON')
    args = parser.parse_args()
    body = None
    if args.body_file:
        with open(args.body_file, encoding='utf-8', errors='replace') as handle:
            body = handle.read(200000)
    elif args.event:
        with open(args.event, encoding='utf-8') as handle:
            pull = json.load(handle).get('pull_request') or {}
        body = str(pull.get('body') or '')[:200000]
    report, count = validate(args.repo, args.base, args.head, body)
    print_report(report, count)
    if args.json:
        with open(args.json, 'w', encoding='utf-8') as out:
            json.dump({'files': count, 'errors': report.errors, 'warnings': report.warnings}, out)
    return 1 if report.errors else 0


if __name__ == '__main__':
    sys.exit(main())
