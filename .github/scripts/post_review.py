"""Leave the validation result on a pull request, for review.yml.

find: pick the open pull request whose head is the given commit, save its description and
print number= and base= for GITHUB_OUTPUT. post: keep one result comment up to date, request
changes while there are errors and dismiss that request once they are gone.

Everything from the pull request is data: messages come from validate_pr.py, which passes
paths through checks.safe(), and the GitHub API is called with JSON bodies, not shell text.
"""
import argparse
import json
import os
import re
import subprocess
import sys

MARKER = '<!-- hogwarts-icons-review -->'
BOT = 'github-actions[bot]'
SHA_RE = re.compile(r'[0-9a-f]{40}')


def gh(*args, payload=None):
    result = subprocess.run(['gh', 'api', *args] + (['--input', '-'] if payload is not None else []), input=json.dumps(payload).encode() if payload is not None else None, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if result.returncode:
        raise RuntimeError(result.stderr.decode('utf-8', 'replace')[:300])
    return json.loads(result.stdout or b'null')


def gh_list(path):
    """All pages of a list endpoint."""
    out = []
    page = 1
    while True:
        items = gh(f'{path}{"&" if "?" in path else "?"}per_page=100&page={page}')
        out.extend(items or [])
        if not items or len(items) < 100:
            return out
        page += 1


def load_pages(text):
    """gh api --paginate prints one JSON array per page back to back."""
    decoder = json.JSONDecoder()
    items, pos = [], 0
    while pos < len(text):
        while pos < len(text) and text[pos].isspace():
            pos += 1
        if pos >= len(text):
            break
        value, pos = decoder.raw_decode(text, pos)
        items.extend(value if isinstance(value, list) else [value])
    return items


def find(args):
    with open(args.pulls, encoding='utf-8') as handle:
        pulls = load_pages(handle.read())
    for pull in pulls:
        if (pull.get('head') or {}).get('sha') == args.sha:
            number = pull.get('number')
            base = (pull.get('base') or {}).get('sha') or ''
            if not isinstance(number, int) or not SHA_RE.fullmatch(base):
                return 1
            os.makedirs(args.out, exist_ok=True)
            with open(os.path.join(args.out, 'body.md'), 'w', encoding='utf-8') as out:
                out.write(str(pull.get('body') or '')[:200000])
            print(f'number={number}')
            print(f'base={base}')
            return 0
    print('No open pull request has this commit as its head.', file=sys.stderr)
    return 0


def comment_text(report, sha, repo):
    errors, warnings = report.get('errors') or [], report.get('warnings') or []
    lines = [MARKER, '']
    if errors:
        lines.append(f'### Automated check: {len(errors)} to fix before review')
        lines.append('')
        lines.append('Fix these, then push again or edit the description. The check runs again by itself.')
    else:
        lines.append('### Automated check: nothing to fix')
        lines.append('')
        lines.append('The owner still looks at every image before merging.')
    for title, entries in (('To fix', errors), ('Worth a look', warnings)):
        if entries:
            lines += ['', f'**{title}**', '']
            lines += [f'- `{path}`: {message}' for path, message in entries[:60]]
            if len(entries) > 60:
                lines.append(f'- and {len(entries) - 60} more')
    lines += ['', f'<sub>Checked commit {sha[:7]}. Rules: [CONTRIBUTING.md](https://github.com/{repo}/blob/main/CONTRIBUTING.md).</sub>']
    return '\n'.join(lines)


def post(args):
    if not SHA_RE.fullmatch(args.sha) or not re.fullmatch(r'[\w.-]+/[\w.-]+', args.repo):
        return 1
    with open(args.report, encoding='utf-8') as handle:
        report = json.load(handle)
    base = f'repos/{args.repo}'
    body = comment_text(report, args.sha, args.repo)

    mine = [c for c in gh_list(f'{base}/issues/{args.number}/comments') if (c.get('user') or {}).get('login') == BOT and MARKER in (c.get('body') or '')]
    if mine:
        gh('-X', 'PATCH', f'{base}/issues/comments/{mine[0]["id"]}', payload={'body': body})
    else:
        gh('-X', 'POST', f'{base}/issues/{args.number}/comments', payload={'body': body})

    reviews = [r for r in gh_list(f'{base}/pulls/{args.number}/reviews') if (r.get('user') or {}).get('login') == BOT and r.get('state') == 'CHANGES_REQUESTED']
    if report.get('errors'):
        if not reviews:
            gh('-X', 'POST', f'{base}/pulls/{args.number}/reviews', payload={'commit_id': args.sha, 'event': 'REQUEST_CHANGES', 'body': 'The automated check found things to fix: see its comment on this pull request.'})
    else:
        for review in reviews:
            try:
                gh('-X', 'PUT', f'{base}/pulls/{args.number}/reviews/{review["id"]}/dismissals', payload={'message': 'The automated check passes now.', 'event': 'DISMISS'})
            except RuntimeError as err:
                print(f'::warning::could not dismiss the earlier review: {err}')
    print(f'{len(report.get("errors") or [])} errors, {len(report.get("warnings") or [])} warnings posted')
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='cmd', required=True)
    p_find = sub.add_parser('find')
    p_find.add_argument('--pulls', required=True)
    p_find.add_argument('--sha', required=True)
    p_find.add_argument('--out', required=True)
    p_post = sub.add_parser('post')
    p_post.add_argument('--report', required=True)
    p_post.add_argument('--number', required=True, type=int)
    p_post.add_argument('--sha', required=True)
    p_post.add_argument('--repo', required=True)
    args = parser.parse_args()
    return find(args) if args.cmd == 'find' else post(args)


if __name__ == '__main__':
    sys.exit(main())
