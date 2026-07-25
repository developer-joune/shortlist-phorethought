#!/usr/bin/env python3
"""Uniqueness/shape lint for skills-taxonomy.json.

Checks:
  - skill_id matches shared-defs.schema.json's skillRef pattern
  - no duplicate skill_id values
  - category is one of shared-defs.schema.json's skillCategory enum (read from that
    file directly, not duplicated here, so this lint can't drift from the schema)
  - no alias collides with another entry's skill_id or another entry's alias

Run after editing skills-taxonomy.json:
    python3 lint-skills-taxonomy.py
"""
import json
import re
import sys
from pathlib import Path

SCHEMAS_DIR = Path(__file__).parent
TAXONOMY = SCHEMAS_DIR / "skills-taxonomy.json"
SHARED_DEFS = SCHEMAS_DIR / "shared-defs.schema.json"

SKILL_ID_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def main():
    taxonomy = json.loads(TAXONOMY.read_text())
    shared_defs = json.loads(SHARED_DEFS.read_text())
    valid_categories = set(shared_defs["$defs"]["skillCategory"]["enum"])

    skills = taxonomy["skills"]
    errors = []
    seen_ids = set()
    seen_aliases = {}

    for entry in skills:
        skill_id = entry.get("skill_id", "")

        if not SKILL_ID_PATTERN.match(skill_id):
            errors.append(f"'{skill_id}': does not match pattern ^[a-z0-9]+(-[a-z0-9]+)*$")

        if skill_id in seen_ids:
            errors.append(f"'{skill_id}': duplicate skill_id")
        seen_ids.add(skill_id)

        category = entry.get("category")
        if category not in valid_categories:
            errors.append(
                f"'{skill_id}': category '{category}' not in shared-defs skillCategory enum {sorted(valid_categories)}"
            )

        for alias in entry.get("aliases", []):
            if alias in seen_ids or alias == skill_id:
                errors.append(f"'{skill_id}': alias '{alias}' collides with a skill_id")
            if alias in seen_aliases:
                errors.append(f"'{skill_id}': alias '{alias}' already used by '{seen_aliases[alias]}'")
            seen_aliases[alias] = skill_id

    if errors:
        print(f"{len(errors)} issue(s) found in skills-taxonomy.json:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    print(f"OK: {len(skills)} skills, no duplicate skill_ids/aliases, all categories valid.")


if __name__ == "__main__":
    main()
