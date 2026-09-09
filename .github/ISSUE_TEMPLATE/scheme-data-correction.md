---
name: Scheme Data Correction
about: Report incorrect, outdated, or unclear data for a specific welfare scheme —
  eligibility rules, benefit amounts, documents, or application links.
title: ''
labels: ''
assignees: ''

---

## Which scheme is affected?

Scheme ID (from `Backend/data/schemes.json`, e.g. `pm-kisan-001`):

Scheme name:

## What's incorrect?

- [ ] Eligibility rule (age, income, occupation, category, disability, state, gender)
- [ ] Benefit amount / value estimate
- [ ] Required documents
- [ ] Application URL (broken or wrong)
- [ ] Issuing authority
- [ ] Other (describe below)

## Current value in schemes.json


## What it should be


## Source

Link to the official government page or notification confirming the correct value. Unverified corrections can't be merged — see `Backend/tests/test_eligibility_agent.py` for how rule changes need matching test coverage.

## Does this affect other schemes too?

If this is a systemic issue (e.g. a whole category was scraped incorrectly), note that here so it's not treated as a one-off.
