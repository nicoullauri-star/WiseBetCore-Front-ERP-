
import os

filepath = r"c:\Users\nicou\Downloads\wisebetultimogit\WiseBetCore-Front-ERP--main\components\TradingZoneModal.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'Caja Disponible (USD)' in line:
        new_lines.append(line.replace('(USD)', ''))
    elif '${p.balance.toLocaleString()}</span>' in line:
        new_lines.append(line)
        # Find indentation
        indent = line[:line.find('<span')]
        new_lines.append(f'{indent}</div>\n')
        new_lines.append('\n')
        new_lines.append(f'{indent}<div className="flex justify-between items-center p-3 py-4 bg-[#00ff88]/5 rounded-2xl border border-[#00ff88]/10 group/stake relative overflow-hidden">\n')
        new_lines.append(f'{indent}    <div className="absolute top-0 right-0 w-16 h-16 bg-[#00ff88]/10 blur-2xl rounded-full" />\n')
        new_lines.append(f'{indent}    <div className="relative z-10 flex items-center gap-3">\n')
        new_lines.append(f'{indent}       <Target size={14} className="text-[#00ff88]" />\n')
        new_lines.append(f'{indent}       <span className="text-[9px] font-black text-[#00ff88] uppercase tracking-widest">Stake Promedio</span>\n')
        new_lines.append(f'{indent}    </div>\n')
        new_lines.append(f'{indent}    <span className="relative z-10 text-lg font-black text-[#00ff88] italic drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">${{p.averageStake}}</span>\n')
        new_lines.append(f'{indent}</div>\n')
        # We need to skip the next line which is the old </div>
        skip_next = True
        continue
    else:
        new_lines.append(line)

# This simple logic might skip too much or too little. 
# Let's try a safer approach: find the exact line indices.

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

target = 'Caja Disponible (USD)'
text = text.replace(target, 'Caja Disponible')

# Find the balance line
balance_str = '${p.balance.toLocaleString()}</span>'
balance_idx = text.find(balance_str)
if balance_idx != -1:
    # Find the next </div>
    div_idx = text.find('</div>', balance_idx)
    if div_idx != -1:
        end_of_div = text.find('\n', div_idx) + 1
        
        # Get indentation from balance line
        line_start = text.rfind('\n', 0, balance_idx) + 1
        indent = text[line_start:balance_idx]
        # Wait, balance line has <span before balance_str
        span_idx = text.rfind('<span', 0, balance_idx)
        indent = text[line_start:span_idx]
        
        insertion = f'\n{indent}<div className="flex justify-between items-center p-3 py-4 bg-[#00ff88]/5 rounded-2xl border border-[#00ff88]/10 group/stake relative overflow-hidden">\n'
        insertion += f'{indent}    <div className="absolute top-0 right-0 w-16 h-16 bg-[#00ff88]/10 blur-2xl rounded-full" />\n'
        insertion += f'{indent}    <div className="relative z-10 flex items-center gap-3">\n'
        insertion += f'{indent}       <Target size={14} className="text-[#00ff88]" />\n'
        insertion += f'{indent}       <span className="text-[9px] font-black text-[#00ff88] uppercase tracking-widest">Stake Promedio</span>\n'
        insertion += f'{indent}    </div>\n'
        insertion += f'{indent}    <span className="relative z-10 text-lg font-black text-[#00ff88] italic drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">${{p.averageStake}}</span>\n'
        insertion += f'{indent}</div>\n'
        
        text = text[:end_of_div] + insertion + text[end_of_div:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
print("Sucessfully updated TradingZoneModal.tsx")
