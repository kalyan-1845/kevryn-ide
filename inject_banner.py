import re

with open('client/src/App.js', 'r', encoding='utf8') as f:
    c = f.read()

if 'TopBroadcastBanner' not in c:
    c = c.replace('import KevRynBackground from \'./components/KevRynBackground\';', 'import KevRynBackground from \'./components/KevRynBackground\';\nimport TopBroadcastBanner from \'./components/TopBroadcastBanner\';')

if '<TopBroadcastBanner' not in c:
    c = c.replace('return ( <div className="app-root"', 'return (\n        <>\n          <TopBroadcastBanner activeBroadcast={activeBroadcast} setActiveBroadcast={setActiveBroadcast} />\n          <div className="app-root"')

    c = re.sub(r'</div>\s*</Router>\s*\);\s*}', '</div>\n        </>\n    );\n}', c)

with open('client/src/App.js', 'w', encoding='utf8') as f:
    f.write(c)
