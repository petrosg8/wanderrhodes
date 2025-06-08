import re
from pathlib import Path

IN_FILE = Path('rhodes_knowledge_base_first.xml')
OUT_FILE = Path('rhodes_knowledge_base.xml')

patterns = [
    r"Mr Local[^:\n]*recommendation[s]?:?",
    r"Share post",
    r"Quick view",
    r"Bookmark",
    r"Visit",
    r"Profile",
    r"Reviews0",
    r"prev next",
    r"Website",
    r"Leave a review",
    r"Get directions",
    r"Share",
    r"Location",
    r"Report",
    r"Details",
    r"Activities",
    r"No comments yet\."
]
regex = re.compile('|'.join(patterns), flags=re.IGNORECASE)

clean_lines = []
with IN_FILE.open('r', encoding='utf-8') as f:
    for line in f:
        indent = re.match(r'\s*', line).group(0)
        content = line.strip()
        content = regex.sub('', content)
        content = re.sub(r'\s{2,}', ' ', content)
        clean_lines.append(f"{indent}{content}\n" if content else '\n')

OUT_FILE.write_text(''.join(clean_lines), encoding='utf-8')
print(f"Wrote cleaned XML to {OUT_FILE}")
