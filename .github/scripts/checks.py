"""Rules shared by the pull request validator and the translation workflow.

Standard library only. Every input is untrusted data: nothing here runs, imports
or checks out contributed content, and anything repeated in a message goes
through safe() first so it cannot inject workflow commands, mentions or markup.
"""
import json
import re
import struct
import subprocess

IMAGE_ROOT = 'icons/'
NAMES_DIR = 'names/'
LANGUAGES_FILE = 'names/languages.json'
IMAGE_EXT = '.webp'
# Split into category folders. The old copies stay on the CDN for games that still use those URLs.
RETIRED_FOLDERS = ('icons/items/shop/', 'icons/items/items/', 'icons/items/rp/', 'icons/items/ui/')

LANG_RE = re.compile(r'[a-z]{2,3}(-[A-Z]{2})?')
NAME_MAX = 120
NAMES_FILE_MAX = 1024 * 1024
PATH_MAX = 200
MIN_SIDE = 32

# Measured on the 2,656 images of the first commit. Icons under items/ top out
# at 22,754 bytes and 256x256; the largest artwork is 320,084 bytes and 750x1050.
ICON_LIMITS = {'bytes': 64 * 1024, 'side': 512, 'pixels': 512 * 512}
ART_LIMITS = {'bytes': 512 * 1024, 'side': 1600, 'pixels': 1500000}

_UNSAFE_NAME = re.compile('[\x00-\x1f\x7f-\x9f  ‪-‮⁦-⁩﻿\ud800-\udfff]')
_ENTITY = re.compile(r'&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);', re.I)
_CORE_CHUNKS = {b'VP8X', b'VP8 ', b'VP8L', b'ALPH', b'ICCP'}
_ANIMATION_CHUNKS = {b'ANIM', b'ANMF'}


def safe(value, limit=120):
    """A string that is safe to print in logs, annotations and comments."""
    return re.sub(r'[^A-Za-z0-9_./-]', '?', str(value))[:limit]


def git(repo, *args):
    return subprocess.run(['git', '-C', repo, '-c', 'core.quotepath=off', *args], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout


def limits_for(path):
    return ICON_LIMITS if path.startswith('icons/items/') else ART_LIMITS


def parse_json(text):
    """Parse strictly: no duplicate keys, no NaN or Infinity. Raises ValueError with a message free of input."""

    def pairs(items):
        out = {}
        for key, value in items:
            if key in out:
                raise ValueError('duplicate key ' + safe(key))
            out[key] = value
        return out

    def constant(_):
        raise ValueError('NaN and Infinity are not allowed')

    try:
        return json.loads(text, object_pairs_hook=pairs, parse_constant=constant)
    except json.JSONDecodeError as err:
        raise ValueError(f'not valid JSON: {err.msg} at line {err.lineno}') from None
    except RecursionError:
        raise ValueError('not valid JSON: nested too deeply') from None


def dump_names(names):
    return json.dumps(dict(sorted(names.items())), ensure_ascii=False, indent=1) + '\n'


def known_keys(paths):
    """Keys a names file may use: every image without its extension, and every folder holding images."""
    keys = set()
    for path in paths:
        if path.startswith(IMAGE_ROOT) and path.endswith(IMAGE_EXT):
            keys.add(path[: -len(IMAGE_EXT)])
            parts = path.split('/')
            for depth in range(1, len(parts)):
                keys.add('/'.join(parts[:depth]))
    return keys


def name_problem(value):
    """Why a display name is refused, or None."""
    if not isinstance(value, str):
        return 'must be a string'
    if not value.strip():
        return 'is empty'
    if value != value.strip():
        return 'has spaces at the start or end'
    if len(value) > NAME_MAX:
        return f'is longer than {NAME_MAX} characters'
    if _UNSAFE_NAME.search(value):
        return 'contains a control or text direction character'
    if '<' in value or '>' in value:
        return 'contains angle brackets (no HTML)'
    if _ENTITY.search(value):
        return 'contains an HTML entity'
    if '://' in value:
        return 'contains a link'
    return None


def names_problems(names, keys):
    """Problems of a names object against the known keys."""
    if not isinstance(names, dict):
        return ['must be a JSON object']
    problems = []
    for key, value in names.items():
        if key not in keys:
            problems.append(f'unknown key {safe(key)}: it is not an existing image or folder')
            continue
        problem = name_problem(value)
        if problem:
            problems.append(f'the name for {safe(key)} {problem}')
    return problems


def languages_problems(languages):
    """Problems of the languages.json object."""
    if not isinstance(languages, dict) or not languages:
        return ['must be a non-empty JSON object']
    problems = []
    for code, label in languages.items():
        if not LANG_RE.fullmatch(code):
            problems.append(f'{safe(code)} is not a language code like tr or pt-BR')
        problem = name_problem(label)
        if problem:
            problems.append(f'the label of {safe(code)} {problem}')
    return problems


def _frame_size(fourcc, payload):
    if fourcc == b'VP8 ':
        if len(payload) < 10 or payload[0] & 1 or payload[3:6] != b'\x9d\x01\x2a':
            return None
        return struct.unpack('<H', payload[6:8])[0] & 0x3fff, struct.unpack('<H', payload[8:10])[0] & 0x3fff
    if len(payload) < 5 or payload[0] != 0x2f:
        return None
    bits = struct.unpack('<I', payload[1:5])[0]
    return (bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1


def inspect_webp(data, limits):
    """Check a file from its bytes alone. Returns (errors, warnings). Reads headers, does not decode pixels."""
    if len(data) > limits['bytes']:
        return [f'{len(data)} bytes, the limit here is {limits["bytes"]}'], []
    if len(data) < 20 or data[:4] != b'RIFF' or data[8:12] != b'WEBP':
        return ['not a WebP file: the bytes do not start with RIFF....WEBP'], []
    if struct.unpack('<I', data[4:8])[0] + 8 != len(data):
        return ['the RIFF size does not match the file, it is cut short or has data appended'], []

    chunks = []
    pos = 12
    while pos < len(data):
        if pos + 8 > len(data):
            return ['broken WebP: a chunk header runs past the end of the file'], []
        fourcc = data[pos:pos + 4]
        size = struct.unpack('<I', data[pos + 4:pos + 8])[0]
        end = pos + 8 + size
        padded = end + (size & 1)
        if padded > len(data):
            return ['broken WebP: a chunk runs past the end of the file'], []
        chunks.append((fourcc, data[pos + 8:end]))
        pos = padded

    errors = []
    warnings = []
    names = [fourcc for fourcc, _ in chunks]
    if not chunks or names[0] not in (b'VP8X', b'VP8 ', b'VP8L'):
        return ['broken WebP: the first chunk is not an image header'], []

    canvas = None
    if names[0] == b'VP8X':
        head = chunks[0][1]
        if len(head) != 10:
            return ['broken WebP: bad VP8X header'], []
        canvas = (int.from_bytes(head[4:7], 'little') + 1, int.from_bytes(head[7:10], 'little') + 1)
        if head[0] & 0x02:
            errors.append('animated WebP is not accepted')
    if _ANIMATION_CHUNKS.intersection(names):
        if not errors:
            errors.append('animated WebP is not accepted')
    frames = [chunk for chunk in chunks if chunk[0] in (b'VP8 ', b'VP8L')]
    if errors:
        return errors, warnings
    if len(frames) != 1:
        return ['broken WebP: expected exactly one image'], []
    size = _frame_size(*frames[0])
    if size is None or not size[0] or not size[1]:
        return ['broken WebP: bad image header'], []
    if canvas and canvas != size:
        return ['broken WebP: the declared size differs from the image inside'], []

    width, height = size
    if min(width, height) < MIN_SIDE:
        errors.append(f'{width}x{height} is too small, each side needs at least {MIN_SIDE} pixels')
    if max(width, height) > limits['side'] or width * height > limits['pixels']:
        errors.append(f'{width}x{height} is too large, the limit here is {limits["side"]} per side and {limits["pixels"]} pixels')
    extra = sorted({safe(fourcc.decode('latin-1').strip()) for fourcc in names if fourcc not in _CORE_CHUNKS})
    if extra:
        warnings.append('carries extra data chunks (' + ', '.join(extra) + '), strip metadata before submitting')
    return errors, warnings
