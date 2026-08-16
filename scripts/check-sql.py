"""마이그레이션 SQL 이 Supabase 에서 돌기 전에 문법을 본다.

붙여넣고 RUN 을 눌렀는데 에러가 나면 대표님이 직접 겪는다.
여기서 미리 걸러낸다. 두 가지를 본다.

1. PostgreSQL 문법으로 파싱되는가
2. -- 주석이 섞여 있지 않은가
   복사해서 붙여넣을 때 -- 가 - 하나로 뭉개지면 그 줄부터 전부 깨진다.
   그래서 지금 배포하는 SQL 에는 -- 주석을 쓰지 않는다.
   옛 파일(13번 이전)은 이미 실행이 끝났고 규칙이 생기기 전에 만든 것이라
   문법만 본다.
"""
import glob
import re
import sys


def distributed(name):
    """지금도 대표님이 복사해 붙여넣는 SQL 인가"""
    if name.startswith('migration_ALL'):
        return True
    m = re.match(r'migration_(\d+)_', name)
    return bool(m) and int(m.group(1)) >= 20

try:
    import pglast
except ImportError:
    print('pglast 가 없어 SQL 검사를 건너뜁니다. pip install pglast')
    sys.exit(0)

files = sorted(glob.glob('migration_*.sql'))
if not files:
    print('검사할 SQL 이 없습니다.')
    sys.exit(0)

failed = []
for f in files:
    src = open(f, encoding='utf-8').read()
    dash = src.count('--')
    try:
        n = len(pglast.parse_sql(src))
    except Exception as e:
        print('✗ %s — 문법 오류' % f)
        print('    %s' % str(e).replace('\n', ' ')[:200])
        failed.append(f)
        continue
    if dash and distributed(f):
        print('✗ %s — `--` 주석이 %d 개 있습니다. 붙여넣을 때 깨질 수 있어 금지합니다.' % (f, dash))
        failed.append(f)
        continue
    print('✓ %s — %d 구문%s' % (f, n, (' (옛 파일, -- %d개는 넘어감)' % dash) if dash else ''))

# ── 앱 안에 문자열로 박아 둔 준비 SQL ────────────────────────────
#   대표님이 홈 맨 위 배너에서 복사해 붙여넣는 것은 .sql 파일이 아니라
#   app/index.html 안의 HX_SQL 이다. 정작 손으로 실행하는 그 SQL 을
#   아무도 안 보고 있었다 — 여기서 같이 본다.
def embedded_blocks():
    """app/index.html 의 HX_SQL 을 덩이별로 뽑는다"""
    try:
        src = open('app/index.html', encoding='utf-8').read()
    except OSError:
        return []
    k = src.find('var HX_SQL={')
    if k < 0:
        return []
    end = src.find('\n};', k)
    if end < 0:
        return []
    body, out = src[k:end], []
    for m in re.finditer(r"'(\d+)':\{(.*?)lines:\[(.*?)\n \]\}", body, re.S):
        key, head, lines = m.group(1), m.group(2), m.group(3)
        lab = re.search(r'label:"([^"]*)"', head)
        rows = re.findall(r'"((?:[^"\\]|\\.)*)"', lines)
        sql = '\n'.join(r.replace('\\"', '"').replace("\\'", "'").replace('\\\\', '\\')
                        for r in rows)
        out.append(('HX_SQL[%s] %s' % (key, lab.group(1) if lab else ''), sql))
    return out

blocks = embedded_blocks()
if not blocks:
    print('\n※ app/index.html 에서 준비 SQL 을 못 찾았습니다 — 배너 SQL 검사를 건너뜁니다.')
else:
    print()
    for name, sql in blocks:
        try:
            n = len(pglast.parse_sql(sql))
        except Exception as e:
            print('✗ %s — 문법 오류' % name)
            print('    %s' % str(e).replace('\n', ' ')[:200])
            failed.append(name)
            continue
        if '--' in sql:
            print('✗ %s — `--` 주석이 있습니다. 붙여넣을 때 깨집니다.' % name)
            failed.append(name)
            continue
        print('✓ %s — %d 구문' % (name, n))

if failed:
    print('\n문제가 있는 SQL: %s' % ', '.join(failed))
    sys.exit(1)
print('\nSQL 검사 통과 — 파일 %d 개 · 앱 안 준비 SQL %d 덩이' % (len(files), len(blocks)))
