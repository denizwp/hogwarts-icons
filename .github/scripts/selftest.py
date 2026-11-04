"""Run the validator and the translation script against good and bad samples.

Builds a throwaway git repository in a temp folder. Does not touch this checkout
or the network, apart from the read-only scan of real files at the end.

    python .github/scripts/selftest.py
"""
import json
import os
import shutil
import stat
import struct
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True
import checks  # noqa: E402
import translation  # noqa: E402
import validate_pr  # noqa: E402


def riff(*chunks):
    body = b'WEBP'
    for fourcc, payload in chunks:
        body += fourcc + struct.pack('<I', len(payload)) + payload + (b'\0' if len(payload) & 1 else b'')
    return b'RIFF' + struct.pack('<I', len(body)) + body


def vp8l(width=128, height=128, pad=40):
    bits = (width - 1) | ((height - 1) << 14)
    return (b'VP8L', b'\x2f' + struct.pack('<I', bits) + b'\0' * pad)


def webp(width=128, height=128, pad=40):
    return riff(vp8l(width, height, pad))


def vp8x(width, height, flags=0):
    payload = bytes([flags, 0, 0, 0]) + (width - 1).to_bytes(3, 'little') + (height - 1).to_bytes(3, 'little')
    return (b'VP8X', payload)


class Repo:
    def __init__(self):
        self.path = tempfile.mkdtemp(prefix='hogwarts-selftest-')
        self.git('init', '-q', '-b', 'main')
        self.git('config', 'user.email', 'selftest@example.invalid')
        self.git('config', 'user.name', 'selftest')
        self.git('config', 'core.autocrlf', 'false')
        self.git('config', 'core.protectNTFS', 'false')
        self.write('icons/items/shop/wy_anahtar.webp', webp())
        self.write('icons/herbs/dittany/olgun.webp', webp(600, 1200))
        self.write('names/en.json', json.dumps({'icons/items/shop/wy_anahtar': 'Key', 'icons/herbs': 'Herbs'}, indent=1) + '\n')
        self.write('names/tr.json', json.dumps({'icons/items/shop/wy_anahtar': 'Anahtar'}, indent=1, ensure_ascii=False) + '\n')
        self.write('names/languages.json', json.dumps({'en': 'English', 'tr': 'Türkçe'}, ensure_ascii=False) + '\n')
        self.write('index.html', '<!doctype html>\n')
        self.git('add', '-A')
        self.git('commit', '-q', '-m', 'base')

    def git(self, *args):
        return subprocess.run(['git', '-C', self.path, *args], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout.decode()

    def write(self, rel, data):
        target = os.path.join(self.path, rel)
        os.makedirs(os.path.dirname(target) or self.path, exist_ok=True)
        with open(target, 'wb') as out:
            out.write(data if isinstance(data, bytes) else data.encode('utf-8'))

    def blob(self, data):
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(data if isinstance(data, bytes) else data.encode('utf-8'))
        try:
            return self.git('hash-object', '-w', '--no-filters', tmp.name).strip()
        finally:
            os.unlink(tmp.name)

    def case(self, entries, removals=()):
        """Commit raw index entries to a side branch, whatever their path. Returns the head commit."""
        self.git('checkout', '-q', '--detach', 'main')
        lines = ''
        for path, data, *mode in entries:
            lines += f'{mode[0] if mode else "100644"} {self.blob(data)}\t{path}\n'
        for path in removals:
            lines += f'0 {"0" * 40}\t{path}\n'
        subprocess.run(['git', '-C', self.path, 'update-index', '--add', '--index-info'], input=lines.encode('utf-8'), check=True)
        self.git('commit', '-q', '-m', 'case')
        head = self.git('rev-parse', 'HEAD').strip()
        self.git('reset', '-q', '--hard', 'main')
        return head

    def close(self):
        def retry(func, path, _):
            os.chmod(path, stat.S_IWRITE)
            func(path)
        shutil.rmtree(self.path, onerror=retry)


def names_json(data):
    return json.dumps(data, ensure_ascii=False, indent=1) + '\n'


KEY = 'icons/items/shop/wy_anahtar'
GOOD_IMAGE = 'icons/items/shop/yeni_ikon.webp'
VALIDATOR_CASES = [
    # (title, entries, removals, expected error text or None, expected warning text or None)
    ('good: new icon', [(GOOD_IMAGE, webp())], (), None, None),
    ('good: lossy VP8 icon', [(GOOD_IMAGE, riff((b'VP8 ', b'\0\0\0\x9d\x01\x2a' + struct.pack('<HH', 128, 128) + b'\0' * 30)))], (), None, None),
    ('good: VP8X with alpha', [(GOOD_IMAGE, riff(vp8x(128, 128, 0x10), (b'ALPH', b'\0\0'), vp8l()))], (), None, None),
    ('good: large artwork', [('icons/cards/frame/yeni.webp', webp(750, 1050))], (), None, None),
    ('good: names edit', [('names/tr.json', names_json({KEY: 'Anahtar deneme'}))], (), None, None),
    ('good: new image plus its name', [(GOOD_IMAGE, webp()), ('names/en.json', names_json({KEY: 'Key', 'icons/items/shop/yeni_ikon': 'New'}))], (), None, None),
    ('good: folder key', [('names/tr.json', names_json({'icons/herbs': 'Otlar', KEY: 'Anahtar'}))], (), None, None),
    ('good: bare ampersand', [('names/en.json', names_json({KEY: 'Currency & Chests'}))], (), None, None),
    ('good: translation bot names only', [('names/tr.json', names_json({'icons/herbs/dittany/olgun': 'Olgun', KEY: 'Anahtar'}))], (), None, None),
    ('good: UI_T_ file in a game folder', [('icons/items/gear/UI_T_New.webp', webp())], (), None, None),
    ('good: MOD_ file in a game folder', [('icons/items/spells/MOD_New_UI_T_Spell.webp', webp())], (), None, None),
    ('good: UI_T_ file in a new items folder', [('icons/items/broom/UI_T_New.webp', webp())], (), None, None),
    ('bad: overwrite', [(KEY + '.webp', webp(128, 128, 60))], (), 'REPLACES', None),
    ('bad: .github change', [('.github/workflows/validate.yml', 'name: x\n')], (), 'automation', None),
    ('bad: .github new file', [('.github/scripts/x.py', 'x = 1\n')], (), 'automation', None),
    ('bad: root change', [('index.html', '<!doctype html><p>x\n')], (), 'root', None),
    ('bad: root new file', [('catalog.js', '// x\n')], (), 'root', None),
    ('bad: root dotfile', [('.gitignore', 'x\n')], (), 'root', None),
    ('bad: root removal', [], ['index.html'], 'root', None),
    ('bad: deploy change', [('deploy/publish.sh', 'x\n')], (), 'deploy scripts', None),
    ('flag: other folder', [('docs/x.md', 'x\n')], (), None, 'outside'),
    ('flag: wy_ prefix', [('icons/items/shop/wy_yeni.webp', webp())], (), None, 'reserved'),
    ('flag: wy_ prefix in a game folder', [('icons/items/gear/wy_yeni.webp', webp())], (), None, 'reserved'),
    ('flag: UI_T_ file in shop', [('icons/items/shop/UI_T_New.webp', webp())], (), None, 'belong'),
    ('flag: MOD_ file in cards', [('icons/items/cards/MOD_New.webp', webp())], (), None, 'belong'),
    ('flag: UI_T_ file in artwork', [('icons/lobby/UI_T_New.webp', webp(580, 340))], (), None, 'belong'),
    ('flag: metadata chunk', [(GOOD_IMAGE, riff(vp8x(128, 128), vp8l(), (b'EXIF', b'abcd')))], (), None, 'extra data'),
    ('flag: language list', [('names/languages.json', names_json({'en': 'English', 'tr': 'Türkçe', 'de': 'Deutsch'}))], (), None, 'languages'),
    ('bad: png under icons', [('icons/items/shop/a.png', b'\x89PNG\r\n\x1a\n')], (), 'only .webp', None),
    ('bad: svg under icons', [('icons/x.svg', '<svg onload="alert(1)"/>')], (), 'only .webp', None),
    ('bad: html under icons', [('icons/x.html', '<script>1</script>')], (), 'only .webp', None),
    ('bad: png renamed .webp', [(GOOD_IMAGE, b'\x89PNG\r\n\x1a\n' + b'\0' * 64)], (), 'not a WebP', None),
    ('bad: html renamed .webp', [(GOOD_IMAGE, b'<html><script>alert(1)</script></html>')], (), 'not a WebP', None),
    ('bad: upper case .WEBP', [('icons/items/shop/a.WEBP', webp())], (), 'only .webp', None),
    ('bad: data appended', [(GOOD_IMAGE, webp() + b'<script>alert(1)</script>')], (), 'appended', None),
    ('bad: cut short', [(GOOD_IMAGE, webp()[:-10])], (), 'cut short', None),
    ('bad: chunk past the end', [(GOOD_IMAGE, b'RIFF' + struct.pack('<I', 16) + b'WEBPVP8L' + struct.pack('<I', 9999) + b'\x2f\0\0\0')], (), 'past the end', None),
    ('bad: size lie in VP8X', [(GOOD_IMAGE, riff(vp8x(64, 64), vp8l(4000, 4000)))], (), 'differs', None),
    ('bad: animated', [(GOOD_IMAGE, riff(vp8x(128, 128, 0x02), (b'ANIM', b'\0' * 6), (b'ANMF', b'\0' * 16)))], (), 'animated', None),
    ('bad: icon too many pixels', [(GOOD_IMAGE, webp(1024, 1024))], (), 'too large', None),
    ('bad: icon too many bytes', [(GOOD_IMAGE, webp(128, 128, 70 * 1024))], (), 'bytes', None),
    ('bad: artwork too many pixels', [('icons/cards/huge.webp', webp(4000, 4000))], (), 'too large', None),
    ('bad: artwork too many bytes', [('icons/cards/huge.webp', webp(750, 1050, 600 * 1024))], (), 'bytes', None),
    ('bad: too small', [(GOOD_IMAGE, webp(8, 8))], (), 'too small', None),
    ('bad: space in path', [('icons/items/shop/a b.webp', webp())], (), 'unsafe', None),
    ('bad: unicode in path', [('icons/items/shop/şapka.webp', webp())], (), 'unsafe', None),
    ('bad: dots in path', [('icons/items/..evil/a.webp', webp())], (), '..', None),
    ('bad: hidden folder', [('icons/.hidden/a.webp', webp())], (), 'unsafe', None),
    ('bad: Windows name', [('icons/items/aux.webp', webp())], (), 'reserved', None),
    ('bad: case collision', [('icons/items/shop/WY_ANAHTAR.webp', webp())], (), 'upper or lower', None),
    ('bad: symlink', [('icons/items/shop/link.webp', '/etc/passwd', '120000')], (), 'symbolic', None),
    ('bad: executable', [(GOOD_IMAGE, webp(), '100755')], (), 'executable', None),
    ('bad: removes image', [], [KEY + '.webp'], 'removing', None),
    ('bad: removes names', [], ['names/tr.json'], 'removing', None),
    ('bad: secret script', [('.cdn-guncelle.sh', 'x\n')], (), 'never enter', None),
    ('bad: zip', [('wychwood.zip', b'PK')], (), 'never enter', None),
    ('bad: names not JSON', [('names/tr.json', '{not json')], (), 'not valid JSON', None),
    ('bad: names is a list', [('names/tr.json', '["a"]')], (), 'JSON object', None),
    ('bad: names number value', [('names/tr.json', names_json({KEY: 5}))], (), 'must be a string', None),
    ('bad: names nested value', [('names/tr.json', names_json({KEY: {'a': 'b'}}))], (), 'must be a string', None),
    ('bad: duplicate key', [('names/tr.json', '{"%s": "a", "%s": "b"}' % (KEY, KEY))], (), 'duplicate', None),
    ('bad: unknown key', [('names/tr.json', names_json({'icons/items/shop/yok': 'x'}))], (), 'unknown key', None),
    ('bad: key with extension', [('names/tr.json', names_json({KEY + '.webp': 'x'}))], (), 'unknown key', None),
    ('bad: proto key', [('names/tr.json', names_json({'__proto__': 'x'}))], (), 'unknown key', None),
    ('bad: html value', [('names/tr.json', names_json({KEY: '<img src=x onerror=alert(1)>'}))], (), 'no HTML', None),
    ('bad: entity value', [('names/tr.json', names_json({KEY: 'a &lt;b'}))], (), 'entity', None),
    ('bad: link value', [('names/tr.json', names_json({KEY: 'https://spam.example'}))], (), 'link', None),
    ('bad: long value', [('names/tr.json', names_json({KEY: 'a' * 121}))], (), 'longer than', None),
    ('bad: line break value', [('names/tr.json', names_json({KEY: 'a\nb'}))], (), 'control', None),
    ('bad: bidi value', [('names/tr.json', names_json({KEY: 'a‮b'}))], (), 'control', None),
    ('bad: empty value', [('names/tr.json', names_json({KEY: ' '}))], (), 'empty', None),
    ('bad: not in language list', [('names/de.json', names_json({KEY: 'Schlüssel'}))], (), 'not listed', None),
    ('bad: file name not a language', [('names/evil.json', names_json({KEY: 'x'}))], (), 'language code', None),
    ('bad: nested names folder', [('names/x/tr.json', '{}')], (), 'names/ holds only', None),
    ('bad: non-JSON in names', [('names/tr.txt', 'x')], (), 'names/ holds only', None),
    ('bad: language list loses en', [('names/languages.json', names_json({'tr': 'Türkçe'}))], (), 'en must stay', None),
    ('bad: injected workflow command in key', [('names/tr.json', names_json({'::set-output name=x::y': 'z'}))], (), 'unknown key', None),
]


def issue_body(payload, terms=True, render=True):
    text = payload if isinstance(payload, str) else json.dumps(payload, ensure_ascii=False, indent=2)
    fence = f'```json\n{text}\n```' if render else text
    tick = 'X' if terms else ' '
    return f'### Translation data\n\n{fence}\n\n### Terms\n\n- [{tick}] I wrote these translations and they may be used on the terms in CONTRIBUTING.md.\n'


GOOD = {'lang': 'tr', 'names': {KEY: 'Yeni Anahtar', 'icons/herbs/dittany/olgun': 'Olgun Diktamo'}}
TRANSLATION_CASES = [
    ('good: new and changed', issue_body(GOOD), 'ok', 'added=1 changed=1'),
    ('good: CRLF body', issue_body(GOOD).replace('\n', '\r\n'), 'ok', 'added=1 changed=1'),
    ('good: compact JSON', issue_body(json.dumps(GOOD, ensure_ascii=False, separators=(',', ':'))), 'ok', 'added=1 changed=1'),
    ('good: unfenced JSON', issue_body(GOOD, render=False), 'ok', 'added=1 changed=1'),
    ('good: new file for a listed language', issue_body({'lang': 'en', 'names': {'icons/herbs/dittany': 'Dittany'}}), 'ok', 'added=1 changed=0'),
    ('good: shell characters stay plain text', issue_body({'lang': 'tr', 'names': {KEY: '$(id) `id` ${{ github.token }}'}}), 'ok', 'added=0 changed=1'),
    ('none: same as current', issue_body({'lang': 'tr', 'names': {KEY: 'Anahtar'}}), 'nochange', ''),
    ('bad: no form heading', '{"lang":"tr","names":{}}', 'invalid', 'field is missing'),
    ('bad: empty field', '### Translation data\n\n_No response_\n\n### Terms\n\n- [X] ok\n', 'invalid', 'not valid JSON'),
    ('bad: terms not ticked', issue_body(GOOD, terms=False), 'invalid', 'terms box'),
    ('bad: not JSON', issue_body('hello'), 'invalid', 'not valid JSON'),
    ('bad: JSON list', issue_body('[1,2]'), 'invalid', 'must be an object'),
    ('bad: extra field', issue_body({'lang': 'tr', 'names': {KEY: 'x'}, 'run': 'rm -rf /'}), 'invalid', 'unexpected fields'),
    ('bad: duplicate key', issue_body('{"lang":"tr","lang":"en","names":{}}'), 'invalid', 'duplicate'),
    ('bad: language outside the list', issue_body({'lang': 'de', 'names': {KEY: 'x'}}), 'invalid', 'lang is not'),
    ('bad: path in language', issue_body({'lang': '../../.github/workflows/x', 'names': {KEY: 'x'}}), 'invalid', 'lang is not'),
    ('bad: languages as language', issue_body({'lang': 'languages', 'names': {KEY: 'x'}}), 'invalid', 'lang is not'),
    ('bad: shell in language', issue_body({'lang': 'tr$(id)', 'names': {KEY: 'x'}}), 'invalid', 'lang is not'),
    ('bad: language not a string', issue_body({'lang': ['tr'], 'names': {KEY: 'x'}}), 'invalid', 'lang is not'),
    ('bad: empty names', issue_body({'lang': 'tr', 'names': {}}), 'invalid', 'at least one'),
    ('bad: unknown key', issue_body({'lang': 'tr', 'names': {'icons/yok': 'x'}}), 'invalid', 'unknown key'),
    ('bad: key escaping the repo', issue_body({'lang': 'tr', 'names': {'../../etc/passwd': 'x'}}), 'invalid', 'unknown key'),
    ('bad: mention in key', issue_body({'lang': 'tr', 'names': {'@denizwp`hi`': 'x'}}), 'invalid', 'unknown key'),
    ('bad: HTML value', issue_body({'lang': 'tr', 'names': {KEY: '<b>x</b>'}}), 'invalid', 'no HTML'),
    ('bad: number value', issue_body({'lang': 'tr', 'names': {KEY: 5}}), 'invalid', 'must be a string'),
    ('bad: too long', issue_body('{"lang":"tr","names":{"a":"' + 'x' * 60001 + '"}}'), 'invalid', 'longer than'),
    ('bad: nested too deep', issue_body('[' * 50000), 'invalid', 'nested too deeply'),
]


def run_validator(repo):
    print('--- validator ---')
    failed = 0
    for title, entries, removals, want_error, want_warning in VALIDATOR_CASES:
        head = repo.case(entries, removals)
        report, _ = validate_pr.validate(repo.path, 'main', head)
        errors = ' | '.join(message for _, message in report.errors)
        warnings = ' | '.join(message for _, message in report.warnings)
        if want_error:
            good = want_error in errors
        else:
            good = not errors and (want_warning in warnings if want_warning else not warnings)
        failed += not good
        shown = errors or warnings or 'clean'
        print(f'{"ok  " if good else "FAIL"} {title:40} {shown[:96]}')
    return failed, len(VALIDATOR_CASES)


def run_translation(repo):
    print('--- translation ---')
    failed = 0
    out = tempfile.mkdtemp(prefix='hogwarts-selftest-out-')
    try:
        for title, body, want_status, want_text in TRANSLATION_CASES:
            repo.git('reset', '-q', '--hard', 'main')
            repo.git('clean', '-qfd')
            event = os.path.join(out, 'event.json')
            with open(event, 'w', encoding='utf-8') as handle:
                json.dump({'issue': {'number': 7, 'body': body}}, handle)
            for name in ('comment.md', 'pr_body.md'):
                path = os.path.join(out, name)
                if os.path.exists(path):
                    os.unlink(path)
            result = subprocess.run([sys.executable, '-I', '-B', os.path.join(HERE, 'translation.py'), '--event', event, '--out', out, '--repo', repo.path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, encoding='utf-8')
            comment = ''
            if os.path.exists(os.path.join(out, 'comment.md')):
                with open(os.path.join(out, 'comment.md'), encoding='utf-8') as handle:
                    comment = handle.read()
            changed = repo.git('status', '--porcelain', '--', 'names').strip()
            good = f'status={want_status}' in result.stdout and (want_text in result.stdout or want_text in comment)
            good = good and (bool(changed) == (want_status == 'ok'))
            if want_status == 'invalid':
                good = good and '@' not in comment and '`' not in comment and '<' not in comment
            failed += not good
            first = next((line for line in result.stdout.splitlines() if line.startswith('refused')), result.stdout.strip().splitlines()[-1] if result.stdout.strip() else result.stderr.strip()[:80])
            print(f'{"ok  " if good else "FAIL"} {title:40} {first[:96]}')
        repo.git('reset', '-q', '--hard', 'main')
    finally:
        shutil.rmtree(out, ignore_errors=True)
    return failed, len(TRANSLATION_CASES)


def scan_real_files():
    print('--- real files in this checkout ---')
    root = os.path.abspath(os.path.join(HERE, '..', '..'))
    failed = 0
    paths = [p.decode() for p in checks.git(root, 'ls-files', '-z', '--', 'icons').split(b'\0') if p]
    warned = 0
    for path in paths:
        with open(os.path.join(root, path), 'rb') as handle:
            errors, warnings = checks.inspect_webp(handle.read(), checks.limits_for(path))
        problem = validate_pr.path_problem(path)
        if errors or problem:
            failed += 1
            print('FAIL', path, errors, problem)
        warned += bool(warnings)
    print(f'{len(paths) - failed}/{len(paths)} images pass, {warned} carry extra data chunks')
    keys = checks.known_keys(paths)
    names_dir = os.path.join(root, 'names')
    for name in sorted(os.listdir(names_dir)):
        with open(os.path.join(names_dir, name), encoding='utf-8') as handle:
            data = checks.parse_json(handle.read())
        problems = checks.languages_problems(data) if name == 'languages.json' else checks.names_problems(data, keys)
        failed += len(problems)
        print(f'{"ok  " if not problems else "FAIL"} names/{name}: {len(data)} entries {problems[:3] if problems else ""}')
    return failed, len(paths)


def main():
    repo = Repo()
    total_failed = 0
    try:
        for step in (run_validator, run_translation):
            failed, count = step(repo)
            total_failed += failed
            print(f'{count - failed}/{count} as expected\n')
    finally:
        repo.close()
    failed, _ = scan_real_files()
    total_failed += failed
    print('\nRESULT:', 'all as expected' if not total_failed else f'{total_failed} unexpected')
    return 1 if total_failed else 0


if __name__ == '__main__':
    sys.exit(main())
