# Usage: python3 tools/build-a2-a3.py design   (then publish the 8 files to the canvas and `npm run render`)
# Builds the "Updated A2" (Build your own) and "Updated A3" (Beverages + more) artboards
# from Figma frames 21:106 / 28:611, for every colorway. Positions are Figma's.
import sys, os

HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
@font-face{{font-family:'Midstar';src:url(/_blob/45b3ad1ffe7fc92b2385368fc0bf6bdf) format('opentype');font-weight:400;font-display:block}}
@font-face{{font-family:'Heart of the Land';src:url(/_blob/f3c7382ec2b65213c904f17e0ad0b36d) format('opentype');font-weight:400;font-display:block}}
@font-face{{font-family:'Fredoka';src:url(/_blob/0473c4cbc0bb156a0b79e1694b8317a7) format('truetype');font-weight:300 700;font-display:block}}
body{{margin:0;font-family:'Fredoka', sans-serif;background:{bodybg};color:{ink}}}{extra_css}
</style>
</helmet>
'''
TAIL = '''</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":3840,"height":2160}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
'''

COLORWAYS = {
    'almond':   dict(letter='A', name='Option A', bg='#f4e9e1', ink='#283628', acc='#e84a28', pill='#f9e14d', pillink='#283628', logo='0ffc1961ac0103d2f7aff1e72a3ef272'),
    'forest':   dict(letter='B', name='Option B', bg='#283628', ink='#f4e9e1', acc='#f9e14d', pill='#f9e14d', pillink='#283628', logo='7691bf975cdcd8ee077e02717bda1264'),
    'sunshine': dict(letter='C', name='Option C', bg='#f9e14d', ink='#283628', acc='#5f2637', pill='#f4e9e1', pillink='#283628', logo='695c1e086e53ee9324fe717057fcd4bf'),
    'grass':    dict(letter='D', name='Option D', bg='#1d2716', ink='#f4e9e1', acc='#f9e14d', pill='#f9e14d', pillink='#283628', logo='7691bf975cdcd8ee077e02717bda1264',
                     photo={'build': '2a611a6d12b65f1438500960e75abc6a', 'beverages': '1fdc0cef2f78fa30b9235178c842f0ea'}),
}

MID = "font-family: 'Midstar', 'Fredoka', cursive; font-weight: 400"
HOTL = "font-family: 'Heart of the Land', 'Fredoka', sans-serif; font-weight: 400"

def root(c, board, body):
    photo = c.get('photo', {}).get(board)
    cls = ' class="grass-bg"' if photo else ''
    bgdecl = f'background-color: {c["bg"]}' if photo else f'background: {c["bg"]}'
    return (f'<div{cls} style="width: 3840px; height: 2160px; box-sizing: border-box; {bgdecl}; color: {c["ink"]}; '
            f"font-family: 'Fredoka', sans-serif; overflow: hidden; position: relative\">\n{body}</div>\n")

def page(c, board, title, body):
    photo = c.get('photo', {}).get(board)
    extra = f'\n.grass-bg{{background:{c["bg"]} url(/_blob/{photo}) center / cover no-repeat}}' if photo else ''
    return HEAD.format(title=title, bodybg=c['bg'], ink=c['ink'], extra_css=extra) + root(c, board, body) + TAIL

# Figma centres a 121.8px line inside a 122px box; +1px matches its glyph placement (measured on A1).
def centred(y, box_h, lh, lines=1, nudge=0):
    return round(y + (box_h - lh * lines) / 2 + nudge, 1)

# ------------------------------------------------------------------ A2: Build your own
def a2(c):
    I, A = c['ink'], c['acc']
    item = lambda t, w=400: f'<div style="height: 68px; font-size: 52px; font-weight: 400; line-height: 67.2px; white-space: nowrap">{t}</div>'
    def col(items, gap=10): return f'<div style="display: flex; flex-direction: column; gap: {gap}px">' + ''.join(item(t) for t in items) + '</div>'
    def addon(name, price, price_size=52):
        return (f'<div style="display: flex; justify-content: space-between; align-items: flex-start; height: 68px; font-size: 52px; font-weight: 500; line-height: 67.2px; white-space: nowrap">'
                f'<span>{name}</span><span style="color: {A}; font-size: {price_size}px">{price}</span></div>')
    def pill(label):
        return (f'<div style="display: flex; align-items: center; height: 122px; padding: 0 42px; border-radius: 1000px; background: {c["pill"]}; color: {c["pillink"]}">'
                f'<span style="{HOTL}; font-size: 62px; letter-spacing: 3px; line-height: 121.8px; white-space: nowrap">{label}</span></div>')
    def section_head(x, word, label):
        return (f'<div style="position: absolute; left: {x}px; top: 592px; display: flex; align-items: center; gap: 54px">'
                f'<span style="{HOTL}; font-size: 142px; line-height: 121.8px; white-space: nowrap">{word}</span>{pill(label)}</div>\n')
    group_head = lambda t: f'<div style="position: relative; top: 1px; height: 87.6875px; font-size: 78px; font-weight: 700; line-height: 73.6px; letter-spacing: 8px; white-space: nowrap">{t}</div>'
    b = ''
    b += f'<h2 style="position: absolute; left: 121px; top: {centred(215,122,121.8)}px; margin: 0; {MID}; font-size: 282px; line-height: 121.8px; color: {A}; white-space: nowrap">Build your own</h2>\n'
    b += f'<p style="position: absolute; left: 2491px; top: {centred(194,122,121.8,nudge=1)}px; margin: 0; {HOTL}; font-size: 142px; line-height: 121.8px; white-space: nowrap">Starts at</p>\n'
    b += f'<p style="position: absolute; left: 3302px; top: {centred(198,122,121.8)}px; margin: 0; font-size: 153px; font-weight: 700; line-height: 121.8px; color: {A}; white-space: nowrap">$9.75</p>\n'
    b += f'<p style="position: absolute; left: 2348px; top: {centred(333,122,121.8,nudge=1)}px; width: 1291px; margin: 0; font-size: 73px; font-weight: 500; line-height: 121.8px; text-align: right; white-space: nowrap">Includes base + 6 ingredients + dressing</p>\n'
    b += section_head(171, 'BASE', 'CHOOSE 2')
    b += section_head(1208, 'INGREDIENTS', 'CHOOSE 6')
    b += f'<p style="position: absolute; left: 3003px; top: 604px; width: 702px; margin: 0; {HOTL}; font-size: 102px; line-height: 97.8px; text-align: center; white-space: nowrap">add protein</p>\n'
    # Base: greens + grains
    b += ('<div style="position: absolute; left: 171px; top: 837px; width: 780px; display: flex; flex-direction: column; gap: 64px">\n'
          '<div style="display: flex; flex-direction: column; gap: 18px">' + group_head('GREENS') +
          '<div style="display: grid; grid-template-columns: 315px auto; column-gap: 94px">' +
          col(['Romaine', 'Baby Spinach', 'Arugula']) + col(['Shredded Kale', 'Spring Mix', 'Red Cabbage']) + '</div></div>\n'
          '<div style="display: flex; flex-direction: column; gap: 18px">' + group_head('GRAINS') +
          '<div style="display: grid; grid-template-columns: 261px auto; column-gap: 143px">' +
          col(['Brown Rice', 'Quinoa']) + col(['Farro', 'Wild Rice']) + '</div></div>\n'
          '<div style="position: relative; top: 1px; height: 68px; font-size: 52px; font-weight: 700; line-height: 67.2px; white-space: nowrap">+ Add one extra for $1.50</div>\n'
          '</div>\n')
    # Ingredients: two plain columns + priced add-ons
    addons = [('Sliced Strawberry', '+ $1'), ('Edamame', '+ $1'), ('Walnuts', '+ $1'), ('Pistachio Crunch', '+ $1'),
              ('Roasted Brussels', '+ $1.5'), ('Charred Broccoli', '+ $1.5'), ('Avocado', '+ $1.5'), ('Roasted Beetroot', '+ $1.5'),
              ('Goat Cheese', '+ $1.5'), ('Feta', '+ $1.5'), ('Brie', '+ $2')]
    b += ('<div style="position: absolute; left: 1208px; top: 837px; display: grid; grid-template-columns: 417px 478px 623px; column-gap: 94px; align-items: start">\n' +
          col(['Cucumber', 'Cherry Tomato', 'Carrot', 'Charred Corn', 'Jalapeño', 'Pink Lady Apple', 'Chickpeas', 'Pumpkin Seeds', 'Tortilla Chips', 'Roasted Seaweed']) + '\n' +
          col(['Black Beans', 'Mint', 'Cilantro', 'Radish', 'Fresh Lime', 'Steamed Broccoli', 'Sun-Dried Tomato', 'Sourdough Croutons', 'Pico de Gallo']) + '\n' +
          '<div style="display: flex; flex-direction: column; gap: 10px">' + ''.join(addon(n, p) for n, p in addons) + '</div>\n</div>\n')
    # Protein
    protein = [('Hardboiled Egg', '+ $2.5'), ('Smoked Bacon', '+ $3'), ('Roasted Tofu', '+ $3.5'), ('Grilled Chicken', '+ $4'),
               ('Blackened Chicken', '+ $4'), ('Grilled Steak', '+ $5'), ('Honey Glazed Salmon', '+ $5')]
    b += ('<div style="position: absolute; left: 3015px; top: 822px; width: 690px; display: flex; flex-direction: column; gap: 10px">' +
          ''.join(addon(n, p, 48) for n, p in protein) + '</div>\n')
    # Dressings
    b += (f'<div style="position: absolute; left: 171px; top: 1801px; display: flex; flex-direction: column; align-items: flex-start; {HOTL}; white-space: nowrap">'
          '<span style="font-size: 70px; line-height: 121.8px; margin-bottom: -23px">HOUSE-MADE</span>'
          '<span style="font-size: 142px; line-height: 121.8px">dressings</span></div>\n')
    dressings = ['Citrus Poppy', 'Hibachi Ginger', 'Cranberry Maple', 'Green Goddess', 'Classic Caesar', 'Buttermilk Ranch',
                 'Balsamic Shallot', 'Spicy Cashew', 'Tahini Peppercorn', 'Lemon Herb Vinaigrette']
    b += ('<div style="position: absolute; left: 1203px; top: 1800px; display: grid; grid-template-columns: 424px 549px 398px 357px; grid-auto-rows: 85px; column-gap: 146px; '
          'font-size: 52px; font-weight: 400; line-height: 67.2px; white-space: nowrap">' + ''.join(f'<span>{d}</span>' for d in dressings) + '</div>\n')
    return b

# ------------------------------------------------------------------ A3: Beverages + more
def a3(c):
    I, A = c['ink'], c['acc']
    def name_row(name, price, width):
        return (f'<div style="position: relative; top: 1px; display: flex; justify-content: space-between; align-items: flex-start; width: {width}px; height: 75.890625px; '
                f'font-size: 78px; font-weight: 700; line-height: 73.6px; white-space: nowrap"><span>{name}</span>'
                f'<span style="color: {A}; font-size: 70px; font-weight: 600">{price}</span></div>')
    desc = lambda lines: f'<p style="margin: 0; height: {65 if len(lines) == 1 else 129}px; font-size: 52px; font-weight: 400; line-height: 64.4px; white-space: nowrap">{"<br>".join(lines)}</p>'
    protein = lambda t: f'<div style="{HOTL}; font-size: 52px; line-height: 46.2px; letter-spacing: 5.04px; text-transform: uppercase; color: {A}; white-space: nowrap; height: 47px">{t}</div>'
    def item(name, price, width, prot=None, lines=None, gap=14):
        parts = [name_row(name, price, width)] + ([protein(prot)] if prot else []) + ([desc(lines)] if lines else [])
        return f'<div style="display: flex; flex-direction: column; gap: {gap}px">' + ''.join(parts) + '</div>'
    def column(x, y, w, title, items):
        return (f'<div style="position: absolute; left: {x}px; top: {y}px; width: {w}px; display: flex; flex-direction: column; gap: 86px">'
                f'<div style="position: relative; height: 92.296875px"><span style="position: absolute; left: 0; top: {centred(-25,122,121.8,nudge=1)}px; {HOTL}; font-size: 110px; line-height: 121.8px; white-space: nowrap">{title}</span></div>'
                f'<div style="display: flex; flex-direction: column; gap: 54px">' + ''.join(items) + '</div></div>\n')
    W = 1076.5  # prices in Figma end ~10px past the 1066.66 column
    b = f'<h2 style="position: absolute; left: 141px; top: {centred(215,122,121.8)}px; margin: 0; {MID}; font-size: 282px; line-height: 121.8px; color: {A}; white-space: nowrap">Beverages + more</h2>\n'
    b += column(189, 595, 986, 'Boxcar Coffee', [
        item('Drip Coffee', '$3.25 / $3.95', 986, lines=['Rotating Boxcar blend']),
        item('Cold Brew', '$4.75', 986, lines=['Smooth, bold, slow-steeped']),
        name_row('Nitro Cold Brew', '$5.25', 986), name_row('Oat Milk Latte', '$5.75', 986), name_row('Vanilla Sea Salt Latte', '$6.25', 986)])
    b += column(1365, 595, 1066.65625, 'COFFEE PLUS+', [
        item('Collagen Coffee', '$6.95', W, '12g protein', ['Cold brew, collagen peptides,', 'cinnamon, oat milk'], gap=26),
        item('Protein Coffee', '$7.50', W, '15g protein', ['Cold brew, vanilla protein, almond', 'butter, banana, oat milk']),
        item('Matcha Protein Latte', '$7.25', W, '15g protein', ['Ceremonial matcha, vanilla protein, oat milk'])])
    b += column(2622, 270, 1066.65625, 'SMOOTHIES', [
        item('Golden Hour', '$8.95', W, '12g protein', ['Banana, mango, pineapple, collagen,', 'coconut milk'], gap=26),
        item('Berry Bloom', '$8.95', W, '17g protein', ['Mixed berries, banana, almond butter,', 'protein, oat milk']),
        item('Green Fuel', '$9.25', W, '16g protein', ['Spinach, avocado, pineapple, mint,', 'protein, almond milk']),
        item('Mocha Charge', '$9.50', W, '20g protein', ['Cold brew, cacao, banana, protein, oat milk'])])
    b += f'<p style="position: absolute; left: 189px; top: {centred(1753,264,121.8,2)}px; margin: 0; {MID}; font-size: 160px; line-height: 121.8px; white-space: nowrap">check the<br>glass case</p>\n'
    b += '<p style="position: absolute; left: 901px; top: 1797px; margin: 0; font-size: 90px; font-weight: 400; line-height: 109px; white-space: nowrap">for snacks, fresh juices,<br>baked goods &amp; more</p>\n'
    b += f'<img src="/_blob/{c["logo"]}" alt="Fields, Grains + Greens" style="position: absolute; left: 3183px; top: 1803px; width: 548px; height: 274px; object-fit: contain; display: block">\n'
    return b

FILES = {  # colorway → (A2 file, A3 file) as the canvas names them
    'almond': ('Board2.dc.html', 'Board3.dc.html'),
    'forest': ('OptionB-Board2.dc.html', 'OptionB-Board3.dc.html'),
    'sunshine': ('OptionC-Board2.dc.html', 'OptionC-Board3.dc.html'),
    'grass': ('Grass-Board2.dc.html', 'Grass-Board3.dc.html'),
}
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
for cw, c in COLORWAYS.items():
    f2, f3 = FILES[cw]
    open(os.path.join(out, f2), 'w').write(page(c, 'build', f'{c["name"]} Board 2: Build Your Own', a2(c)))
    open(os.path.join(out, f3), 'w').write(page(c, 'beverages', f'{c["name"]} Board 3: Beverages + more', a3(c)))
print('wrote', len(FILES) * 2, 'artboards to', out)
