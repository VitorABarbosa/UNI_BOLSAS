"""
One-shot helper to port Claude Design - Reference/Uni Bolsas/js/styles.jsx
into a CSS chunk we append to app/globals.css.

Run: python scripts/port-styles.py
Outputs scripts/_ported-styles.css next to this script for inspection.

Not committed to git (added to .gitignore output is _ported-styles.css).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'Claude Design - Reference' / 'Uni Bolsas' / 'js' / 'styles.jsx'
OUT = ROOT / 'scripts' / '_ported-styles.css'


def camel_to_kebab(name: str) -> str:
    out = []
    for i, ch in enumerate(name):
        if ch.isupper() and i > 0:
            out.append('-')
            out.append(ch.lower())
        else:
            out.append(ch.lower() if ch.isupper() else ch)
    return ''.join(out)


def main() -> int:
    src = SRC.read_text(encoding='utf-8')

    m = re.search(r'const STYLES = `\n', src)
    if not m:
        print('ERROR: could not find STYLES template literal start', file=sys.stderr)
        return 1
    start = m.end()
    end = src.rfind('`;')
    if end == -1:
        end = src.rfind('`')
    content = src[start:end]

    # ${TOKENS.camelCase} -> var(--color-kebab-case)
    content = re.sub(
        r'\$\{TOKENS\.(\w+)\}',
        lambda m: f'var(--color-{camel_to_kebab(m.group(1))})',
        content,
    )

    # Strip the Google Fonts @import — Next layout already loads them.
    content = re.sub(
        r"^@import url\('https://fonts\.googleapis\.com[^']*'\);\s*\n",
        '',
        content,
        flags=re.MULTILINE,
    )

    # Drop the global resets: html/body/* — they conflict with shadcn @layer base
    # already in globals.css. We keep all uni-* classes.
    # Match top-level rules: `* { ... }`, `html, body { ... }`, `body { ... }`
    content = re.sub(r'^\* \{[^}]*\}\s*\n', '', content, flags=re.MULTILINE)
    content = re.sub(r'^html, body \{[^}]*\}\s*\n', '', content, flags=re.MULTILINE)
    content = re.sub(r'^body \{[^}]*\}\s*\n', '', content, flags=re.MULTILINE)

    # Pull out @keyframes blocks (need to live top-level, outside @layer).
    keyframes = []
    def grab_keyframe(m):
        keyframes.append(m.group(0))
        return ''
    content = re.sub(
        r'@keyframes\s+[\w-]+\s*\{(?:[^{}]|\{[^{}]*\})*\}',
        grab_keyframe,
        content,
    )

    # Pull out @media blocks (handle nested braces by counting).
    media_blocks = []
    out_chunks = []
    i = 0
    while i < len(content):
        if content[i:i+6] == '@media':
            brace_pos = content.find('{', i)
            if brace_pos == -1:
                out_chunks.append(content[i:])
                break
            depth = 1
            j = brace_pos + 1
            while j < len(content) and depth > 0:
                if content[j] == '{':
                    depth += 1
                elif content[j] == '}':
                    depth -= 1
                j += 1
            media_blocks.append(content[i:j])
            i = j
        else:
            out_chunks.append(content[i])
            i += 1
    content = ''.join(out_chunks)

    def indent(text: str, prefix: str = '  ') -> str:
        return '\n'.join(prefix + line if line.strip() else line for line in text.splitlines())

    keyframes_section = '\n\n'.join(keyframes)
    media_section = '\n\n'.join(media_blocks)

    output = (
        '\n/* =========================================================================\n'
        ' * Uni Bolsas — Public site styles\n'
        ' * Ported from Claude Design - Reference/Uni Bolsas/js/styles.jsx (1821 lines).\n'
        ' * BEM-like uni-* names preserved so reference can be diffed side-by-side.\n'
        ' * Keyframes top-level (cannot live inside @layer). Media queries grouped at\n'
        ' * the end of @layer components.\n'
        ' * ========================================================================= */\n'
        '\n'
        f'{keyframes_section}\n\n'
        '@layer components {\n'
        f'{indent(content.strip())}\n\n'
        f'{indent(media_section)}\n'
        '}\n'
    )

    OUT.write_text(output, encoding='utf-8')
    print(f'Keyframes pulled: {len(keyframes)}')
    print(f'Media blocks pulled: {len(media_blocks)}')
    print(f'Wrote: {OUT}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
