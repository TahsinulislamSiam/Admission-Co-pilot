"""
Repair the truncated professor.json into a canonical seed file.

professor.json is a fragment: it opens inside Imperial's faculty list and is cut
off mid-entry near the end, so it cannot be parsed as JSON. This script extracts
every complete faculty object by brace counting, attributes each to the nearest
preceding "university" header (or to the email domain for the leading Imperial
entries, whose header is missing), and writes server/db/seed/professors.json.
"""
import json
import re
from pathlib import Path

SRC = Path("professor.json")
OUT = Path("server/db/seed/professors.json")

text = SRC.read_text(encoding="utf-8")

# --- where each university block starts -------------------------------------
headers = [
    (m.start(), json.loads('"' + m.group(1) + '"'))
    for m in re.finditer(r'"university"\s*:\s*"([^"]+)"', text)
]


def block_meta(header_pos):
    """Rank / location / website for the block that owns this header."""
    start = text.rfind("{", 0, header_pos)
    if start == -1:
        return {}
    chunk = extract(start)
    try:
        block = json.loads(chunk)
    except json.JSONDecodeError:
        block = {}
        for field in ("rank_qs_2027",):
            m = re.search(field + r'"\s*:\s*(\d+)', chunk)
            if m:
                block[field] = int(m.group(1))
        m = re.search(r'"city"\s*:\s*"([^"]*)"', chunk)
        if m:
            block["location"] = {"city": m.group(1)}
        m = re.search(r'"country"\s*:\s*"([^"]*)"', chunk)
        if m:
            block.setdefault("location", {})["country"] = m.group(1)
        m = re.search(r'"website"\s*:\s*"([^"]*)"', chunk)
        if m:
            block["website"] = m.group(1)
        m = re.search(r'"faculty_directory"\s*:\s*"([^"]*)"', chunk)
        if m:
            block["faculty_directory"] = m.group(1)
    return block

# --- every object that begins with a faculty "name" -------------------------
def extract(offset):
    """Brace-count the object starting at `offset`; close it if truncated."""
    depth = 0
    in_str = False
    esc = False
    for i in range(offset, len(text)):
        ch = text[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue
        if ch == '"':
            in_str = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[offset : i + 1]
    # truncated: close the open string/array/object
    tail = text[offset:]
    if in_str:
        tail += '"'
    tail = tail.rstrip().rstrip(",")
    if '"research_fields": [' in tail and not re.search(r"\]\s*$", tail):
        tail = tail + "]"
    return tail + "}"


entries = []
for m in re.finditer(r'\{\s*"name"\s*:', text):
    raw = extract(m.start())
    try:
        obj = json.loads(raw)
    except json.JSONDecodeError as exc:
        print("skip unparsable entry:", exc)
        continue
    uni = next((name for pos, name in reversed(headers) if pos < m.start()), None)
    if uni is None:  # leading Imperial entries: header was cut off
        email = obj.get("email") or ""
        uni = "Imperial College London" if "imperial.ac.uk" in email else None
    if uni is None:
        print("skip unattributable entry:", obj.get("name"))
        continue
    entries.append((uni, obj))

# --- rebuild university blocks ---------------------------------------------
blocks = {}
order = []
for uni, obj in entries:
    if uni not in blocks:
        meta = next((block_meta(pos) for pos, name in headers if name == uni), {})
        blocks[uni] = {
            "rank_qs_2027": meta.get("rank_qs_2027"),
            "university": uni,
            "location": meta.get("location") or {"city": None, "country": None},
            "website": meta.get("website"),
            "faculty_directory": meta.get("faculty_directory"),
            "faculty": [],
        }
        order.append(uni)
    blocks[uni]["faculty"].append(obj)
    prof_url = obj.get("profile_url")
    if prof_url and not blocks[uni]["faculty_directory"]:
        blocks[uni]["faculty_directory"] = prof_url

# Known, non-invented details for the block whose header was truncated
imp = blocks.get("Imperial College London")
if imp:
    imp["location"] = {"city": "London", "country": "United Kingdom"}
    imp["website"] = "https://www.imperial.ac.uk/"
    imp["faculty_directory"] = imp["faculty_directory"] or "https://www.imperial.ac.uk/computing/"

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    json.dumps({"universities": [blocks[u] for u in order]}, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

total = sum(len(b["faculty"]) for b in blocks.values())
print(f"wrote {OUT} — {len(blocks)} universities, {total} professors")
for u in order:
    print(f"  {u}: {len(blocks[u]['faculty'])}")
