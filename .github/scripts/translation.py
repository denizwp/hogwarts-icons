"""Turn a translation issue into a change to names/<lang>.json.

The issue body is data: it is read from the event file, parsed as JSON and
checked against the base branch. Nothing from it reaches a shell. The workflow
receives only values this script has checked, through the step output file.

    python .github/scripts/translation.py --event event.json --out out_dir [--repo .]
"""
import argparse
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import checks  # noqa: E402

FIELD_LABEL = 'Translation data'
TERMS_LABEL = 'Terms'
PAYLOAD_MAX = 60000
SHOWN_PROBLEMS = 30
CONTRACT = 'docs/CONTRIBUTION-CONTRACT.md'


class Refused(Exception):
    def __init__(self, *problems):
        super().__init__('refused')
        self.problems = list(problems)


def section(body, label):
    """The lines under a '### label' heading of an issue form body, or None."""
    lines = body.replace('\r\n', '\n').split('\n')
    heading = '### ' + label
    if heading not in lines:
        return None
    start = lines.index(heading) + 1
    out = []
    fenced = False
    for line in lines[start:]:
        if line.startswith('```'):
            fenced = not fenced
        elif line.startswith('### ') and not fenced:
            break
        out.append(line)
    return out


def extract_payload(body):
    lines = section(body, FIELD_LABEL)
    if lines is None:
        raise Refused(f'the "{FIELD_LABEL}" field is missing: please use the issue form')
    text = list(lines)
    while text and not text[0].strip():
        text.pop(0)
    if text and text[0].startswith('```'):
        text = text[1:]
        for i, line in enumerate(text):
            if line.strip() == '```':
                text = text[:i]
                break
    return '\n'.join(text).strip()


def terms_accepted(body):
    lines = section(body, TERMS_LABEL)
    return bool(lines) and any(re.match(r'- \[[xX]\] ', line) for line in lines)


def tracked_paths(repo):
    raw = checks.git(repo, 'ls-files', '-z', '--', checks.IMAGE_ROOT)
    return [path.decode('utf-8', 'replace') for path in raw.split(b'\0') if path]


def read_json_file(path):
    with open(path, encoding='utf-8') as handle:
        return checks.parse_json(handle.read())


def check_issue(event, repo):
    """Validate the issue. Returns (lang, merged names, added, changed)."""
    issue = event.get('issue')
    body = issue.get('body') if isinstance(issue, dict) else None
    if not isinstance(body, str):
        raise Refused('the issue has no body')
    text = extract_payload(body)
    if not terms_accepted(body):
        raise Refused('the terms box is not ticked')
    if len(text) > PAYLOAD_MAX:
        raise Refused(f'the JSON is longer than {PAYLOAD_MAX} characters: split it into several issues')
    try:
        payload = checks.parse_json(text)
    except ValueError as err:
        raise Refused(str(err)) from None
    if not isinstance(payload, dict):
        raise Refused('the JSON must be an object with lang and names')
    extra = set(payload) - {'lang', 'names'}
    if extra:
        raise Refused('unexpected fields: ' + ', '.join(sorted(checks.safe(key) for key in extra)))

    languages = read_json_file(os.path.join(repo, checks.LANGUAGES_FILE))
    lang = payload.get('lang')
    if not isinstance(lang, str) or not checks.LANG_RE.fullmatch(lang) or lang not in languages:
        raise Refused('lang is not one of the languages in names/languages.json')
    names = payload.get('names')
    if not isinstance(names, dict) or not names:
        raise Refused('names must be an object with at least one entry')
    problems = checks.names_problems(names, checks.known_keys(tracked_paths(repo)))
    if problems:
        raise Refused(*problems)

    target = os.path.join(repo, checks.NAMES_DIR, lang + '.json')
    current = read_json_file(target) if os.path.exists(target) else {}
    added = sum(1 for key in names if key not in current)
    changed = sum(1 for key, value in names.items() if key in current and current[key] != value)
    return lang, {**current, **names}, added, changed


def refusal_comment(problems):
    lines = ['This translation could not be used:', '']
    lines += [f'- {problem}' for problem in problems[:SHOWN_PROBLEMS]]
    if len(problems) > SHOWN_PROBLEMS:
        lines.append(f'- and {len(problems) - SHOWN_PROBLEMS} more')
    lines += ['', f'Edit this issue to try again. The rules are in {CONTRACT} in the repository.']
    return '\n'.join(lines) + '\n'


def set_output(values):
    path = os.environ.get('GITHUB_OUTPUT')
    if path:
        with open(path, 'a', encoding='utf-8') as out:
            for key, value in values.items():
                out.write(f'{key}={value}\n')
    print(' '.join(f'{key}={value}' for key, value in values.items()))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--event', required=True)
    parser.add_argument('--out', required=True)
    parser.add_argument('--repo', default='.')
    args = parser.parse_args()
    os.makedirs(args.out, exist_ok=True)

    with open(args.event, encoding='utf-8') as handle:
        event = json.load(handle)
    number = event['issue']['number']
    if not isinstance(number, int) or isinstance(number, bool) or number < 1:
        raise SystemExit('bad issue number')

    def write(name, text):
        with open(os.path.join(args.out, name), 'w', encoding='utf-8', newline='\n') as out:
            out.write(text)

    try:
        lang, merged, added, changed = check_issue(event, args.repo)
    except Refused as refused:
        write('comment.md', refusal_comment(refused.problems))
        for problem in refused.problems[:SHOWN_PROBLEMS]:
            print('refused:', problem)
        set_output({'status': 'invalid', 'number': number})
        return 0
    except (OSError, ValueError, subprocess.CalledProcessError) as err:
        raise SystemExit(f'could not read the repository: {type(err).__name__}') from None

    if not added and not changed:
        write('comment.md', 'Every name in this issue already matches the current file, so there is nothing to change.\n')
        set_output({'status': 'nochange', 'number': number, 'lang': lang})
        return 0

    target = os.path.join(args.repo, checks.NAMES_DIR, lang + '.json')
    with open(target, 'w', encoding='utf-8', newline='\n') as out:
        out.write(checks.dump_names(merged))
    write('pr_body.md', f'Icon names for `{lang}` from #{number}: {added} added, {changed} changed.\n\nCloses #{number}\n')
    set_output({'status': 'ok', 'number': number, 'lang': lang, 'added': added, 'changed': changed})
    return 0


if __name__ == '__main__':
    sys.exit(main())
