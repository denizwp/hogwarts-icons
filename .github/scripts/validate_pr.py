"""Check what a pull request changes, reading its files as git objects only.

The pull request is never checked out or executed: paths, modes and blobs come
from the object database. Run this file from a checkout of the base branch.

    python .github/scripts/validate_pr.py --base origin/main --head HEAD
"""
import argparse
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
RESERVED_PREFIX = re.compile(r'^(UI_T_|MOD_|wy_)', re.I)


class Report:
    def __init__(self):
        self.errors = []
        self.warnings = []

    def error(self, path, message):
        self.errors.append((checks.safe(path), message))

    def warn(self, path, message):
        self.warnings.append((checks.safe(path), message))


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


def validate(repo, base, head):
    report = Report()
    merge_base = checks.git(repo, 'merge-base', base, head).decode().strip()
    changes = parse_diff(checks.git(repo, 'diff-tree', '-r', '-z', '--no-renames', '--no-ext-diff', merge_base, head))
    base_tree = parse_tree(checks.git(repo, 'ls-tree', '-r', '-z', '--full-tree', base))
    head_tree = parse_tree(checks.git(repo, 'ls-tree', '-r', '-z', '--full-tree', head))
    if len(changes) > MAX_FILES:
        report.error('(pull request)', f'{len(changes)} files changed, the limit is {MAX_FILES}: split it up')

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

        if status == 'D':
            if is_image_area or is_names:
                report.error(path, 'removing this breaks URLs that are in use. Removal requests go through an issue')
            else:
                report.warn(path, 'removes a file outside the image and names folders')
            continue

        if len(head_lower.get(path.lower(), [])) > 1:
            report.error(path, 'another file differs from this path only by upper or lower case')

        size = int(checks.git(repo, 'cat-file', '-s', sha))
        total += size

        if is_image_area:
            if not path.endswith(checks.IMAGE_EXT):
                report.error(path, 'only .webp files are allowed under wychwood/')
                continue
            if mode != '100644':
                report.error(path, 'the file must not be executable')
            existing = base_tree.get(path)
            if status == 'M' or (existing and existing[1] != sha):
                report.warn(path, 'REPLACES an existing image at a URL games already use')
            elif status == 'A' and RESERVED_PREFIX.match(path.rsplit('/', 1)[-1]):
                report.warn(path, 'new file with a prefix ASSETS.md reserves (UI_T_, MOD_, wy_)')
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
        elif path.startswith('.github/'):
            report.warn(path, 'changes repository automation: read this diff first, the checks themselves can be altered here')
        elif '/' not in path:
            report.warn(path, 'changes a file at the repository root')
        else:
            report.warn(path, 'outside wychwood/ and names/')

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
    args = parser.parse_args()
    report, count = validate(args.repo, args.base, args.head)
    print_report(report, count)
    return 1 if report.errors else 0


if __name__ == '__main__':
    sys.exit(main())
