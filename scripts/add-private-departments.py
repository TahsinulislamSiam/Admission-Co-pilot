import json, io, sys

PATH = 'src/mocks/seed/private.json'


NEW = {
    'NSU':   [('Accounting and Finance', 'hum'), ('Marketing', 'hum'),
              ('Public Health', 'sci'), ('Statistics', 'sci'),
              ('Political Science', 'hum')],
    'BRACU': [('Pharmacy', 'lab'), ('Public Health', 'sci'),
              ('Anthropology', 'hum'), ('Governance and Development', 'hum'),
              ('Mathematics and Natural Sciences', 'sci')],
    'AUST':  [('Electrical and Computer Engineering', 'lab'),
              ('Software Engineering', 'lab'), ('Biomedical Engineering', 'lab'),
              ('Mathematics', 'sci')],
    'AIUB':  [('Pharmacy', 'lab'), ('Media and Mass Communication', 'hum'),
              ('Public Health', 'sci'), ('Statistics', 'sci'),
              ('Tourism and Hospitality Management', 'hum')],
    'EWU':   [('Civil Engineering', 'lab'), ('Social Relations', 'hum'),
              ('Mathematics', 'sci'), ('Media and Communication', 'hum')],
    'UIU':   [('Civil Engineering', 'lab'), ('Mechanical Engineering', 'lab'),
              ('Pharmacy', 'lab'), ('English', 'hum'), ('Media Studies', 'hum')],
    'IUB':   [('Pharmacy', 'lab'), ('Public Health', 'sci'),
              ('Anthropology', 'hum'), ('Mathematics', 'sci'),
              ('Accounting and Finance', 'hum')],
    'DIU':   [('Civil Engineering', 'lab'), ('Mechanical Engineering', 'lab'),
              ('Architecture', 'lab'),
              ('Journalism and Mass Communication', 'hum'),
              ('Public Health', 'sci')],
    'BUBT':  [('Civil Engineering', 'lab'), ('Mechanical Engineering', 'lab'),
              ('Pharmacy', 'lab'), ('Mathematics', 'sci'),
              ('Journalism and Media Studies', 'hum')],
    'SEU':   [('Civil Engineering', 'lab'), ('Mechanical Engineering', 'lab'),
              ('Architecture', 'lab'), ('Public Health', 'sci'),
              ('Journalism and Mass Communication', 'hum')],
}

LAB_HINTS = ('Engineering', 'Pharmacy', 'Architecture', 'Biotechnology',
             'Microbiology', 'Nutrition', 'Information Studies')
HUM_HINTS = ('Business', 'Economics', 'English', 'Law', 'Communication',
             'Governance', 'Social', 'Media', 'Tourism', 'Accounting')

def tier_of_existing(name):
    if any(h in name for h in LAB_HINTS):
        return 'lab'
    if any(h in name for h in HUM_HINTS):
        return 'hum'
    return 'sci'

BASIS = ('Planning estimate derived from this university\'s existing cost bands '
         'for comparable programmes; not an official published total. '
         'Confirm the current fee breakdown with the university.')

d = json.load(io.open(PATH, encoding='utf-8'))
added_total = 0

for u in d['universities']:
    sn = u['short_name']
    if sn not in NEW:
        continue

    # build tier -> list of existing cost ranges
    tiers = {}
    for c in u['department_costs']:
        tiers.setdefault(tier_of_existing(c['department']), []).append(
            c['estimated_total_degree_cost_bdt'])

    uni_range = u['estimated_total_degree_cost_bdt']
    have = {c['department'] for c in u['department_costs']}

    for name, tier in NEW[sn]:
        if name in have:
            print(f'  skip (exists) {sn}: {name}')
            continue
        pool = tiers.get(tier) or tiers.get('sci') or []
        if pool:
            rng = {'min': min(r['min'] for r in pool),
                   'max': max(r['max'] for r in pool)}
        else:
            rng = dict(uni_range)

        u['department_costs'].append({
            'department': name,
            'estimated_total_degree_cost_bdt': rng,
            'cost_type': 'estimated_total_program_cost',
            'includes': ('Indicative tuition and typical academic fees; confirm '
                         'admission, lab, semester and other charges separately'),
            'basis': BASIS,
        })
        u['departments'].append(name)
        have.add(name)
        added_total += 1

# keep the flat department list identical to department_costs order
for u in d['universities']:
    u['departments'] = [c['department'] for c in u['department_costs']]

io.open(PATH, 'w', encoding='utf-8', newline='\n').write(
    json.dumps(d, ensure_ascii=False, indent=2) + '\n')

print(f'\nadded {added_total} departments')
for u in d['universities']:
    print(f"  {u['short_name']}: {len(u['department_costs'])} depts")
