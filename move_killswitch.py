with open('server/index.js', 'r', encoding='utf8') as f:
    c = f.read()

start = c.find('// ============================================================\n// ENTERPRISE KILL-SWITCH (DUAL-KEY)')
end = c.find('const cors = require(\'cors\');')

if start != -1 and end != -1:
    block_to_remove = c[start:end]
    c = c.replace(block_to_remove, '')
    
    target = "app.use(express.json({ limit: '10mb' }));\n"
    c = c.replace(target, target + block_to_remove)
    
    with open('server/index.js', 'w', encoding='utf8') as f:
        f.write(c)
    print('Moved kill-switch successfully')
else:
    print('Could not find boundaries')
