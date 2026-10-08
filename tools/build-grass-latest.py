# Builds the Grass artboards (Grass-Board1/2/3.dc.html) from Figma's "Latest Boards" page
# (frames 79:1462 Signature, 79:1565 Build Your Own, 79:1618 Beverages). Positions are Figma's.
#
# Usage: python3 tools/build-grass-latest.py design            # the real boards (grass photos)
#        python3 tools/build-grass-latest.py <dir> --flat      # Figma's flat Forest ground, for diffing
import os, sys

out = sys.argv[1]
FLAT = '--flat' in sys.argv
os.makedirs(out, exist_ok=True)

# Reuse the page shell and the Beverages layout from the A2/A3 generator.
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-a2-a3.py')).read()
_ns = {'__file__': __file__}
exec(_src[:_src.index('FILES = {')], _ns)
page, a3, centred, MID, HOTL = _ns['page'], _ns['a3'], _ns['centred'], _ns['MID'], _ns['HOTL']

WHITE, SUN, FOREST = '#ffffff', '#f9e14d', '#283628'
PHOTO = {'salads': '0695e19f2e566c2e77d4f26eb2678687', 'build': '2a611a6d12b65f1438500960e75abc6a',
         'beverages': '1fdc0cef2f78fa30b9235178c842f0ea'}
C = dict(name='Option D', bg=FOREST if FLAT else '#1d2716', ink=WHITE, acc=SUN, pill=SUN, pillink=FOREST,
         logo=None, **({} if FLAT else {'photo': PHOTO}))
SVG = {  # canvas blob ids (design/manifest.json maps them to design/assets/latest/*.svg)
    'signature': '785d005b75f4317f0b6ec7020c4adb53', 'byo-title': 'c11200030f0aea173da8649dd41449f5',
    'bowl': '3ff096f6f66275b3bd557e0ec1fc2256', 'wrap': '972072b70a5b7d1dc3f88fd336290b94',
    'vegan': '6bc40656b6bca6c96d5123724c60deb2', 'byo-bowl': 'b2d3f952a40f20808f9f82bd27e0aca3',
    'byo-wrap': 'a36936847bd4606c7bcc754290e8df81',
}
img = lambda key, w, h, extra='': f'<img src="/_blob/{SVG[key]}" alt="" style="display: block; width: {w}px; height: {h}px; flex-shrink: 0{extra}">'

# ------------------------------------------------------------------ Board 1: Signature
def signature():
    def item(x, y, name, price, icons, desc, tracking=-1, vegan=False):
        icon_html = ''.join(img('bowl', 76, 76) if i == 'bowl' else img('wrap', 72, 72) for i in icons)
        icons_area = (f'<div style="flex: 1 0 0; min-width: 1px; display: flex; align-items: center; gap: 10px; height: 76px">'
                      f'<div style="flex: 1 0 0; display: flex; align-items: center; gap: 10px">{icon_html}</div>'
                      + (img('vegan', 76, 76) if vegan else '') + '</div>')
        return (f'<div style="position: absolute; left: {x}px; top: {y}px; width: 1731px; display: flex; flex-direction: column; gap: 36px">'
                f'<div style="display: flex; align-items: flex-start; gap: 36px; height: 76px">'
                f'<span style="{HOTL}; font-size: 106px; line-height: 73.6px; white-space: nowrap">{name}</span>'
                f'{icons_area}'
                f'<span style="position: relative; top: 1px; font-size: 106px; font-weight: 600; line-height: 73.6px; color: {SUN}; white-space: nowrap">{price}</span></div>'
                f'<p style="margin: 0; font-size: 58px; font-weight: 400; line-height: 70px; letter-spacing: {tracking}px; font-feature-settings: \'liga\' 1">{desc}</p></div>\n')
    L, R, Y = 168, 2029, 177
    b = f'<img src="/_blob/{SVG["signature"]}" alt="Signature" style="position: absolute; left: {L}px; top: {Y}px; width: 1277px; height: 328.678px; display: block">\n'
    b += item(R, Y, 'Strawberry Fields', '$13.75', ['bowl'],
              'Spinach, tri-color quinoa, citrus-herb charred chicken, sliced strawberries, sliced almonds, avocado, feta cheese crumbles, almond brittle, citrus-poppyseed vinaigrette')
    b += item(L, Y + 463.68, 'Baja Bowl', '$14.75', ['bowl'],
              'Spinach + tri-color quinoa, citrus-herb chicken, charred corn, black beans, avocado, sweet potato, pico, cilantro, cotija cakes, lime wedge, chili-lime vinaigrette')
    b += item(R, Y + 463.68, 'High Plains', '$15.75', ['bowl'],
              'Spinach + kale, blackened chicken, full-slice bacon, hardboiled eggs, charred Colorado corn, cherry tomatoes, avocado, shredded cheddar, focaccia croutons, Colorado ranch dressing, hot honey drizzle, charred poblano chili')
    b += item(L, Y + 990.68, 'Trans-Pacific', '$13.75', ['bowl', 'wrap'],
              'Kale + brown rice + fresh herbs (mint, thai basil, cilantro), grilled tofu, watermelon radish, carrot ribbons, cucumber, edamame, bean sprouts, toasted coconut flakes, crushed peanut, crispy shallots, coconut-peanut-lime dressing', vegan=True)
    b += item(R, Y + 990.68, 'Coastal Caesar', '$10.95', ['bowl', 'wrap'],
              'Shredded kale + romaine (or tri-colored quinoa), heirloom cherry tomatoes, focaccia croutons, shaved parmesan, parmesan-pecorino waffles, lemon wedge, vegan caesar dressing')
    b += item(L, Y + 1517.68, 'Blue Zone', '$14.95', ['bowl'],
              'Baby spinach + romaine hearts, miso-glazed salmon, sweet potato, watermelon radish, carrot ribbons, avocado, pickled ginger, mushroom hand roll, sesame-miso dressing')
    b += item(R, Y + 1517.68, 'Fields Notes', '$15.95', ['bowl'],
              'Kale + spinach (or tri-colored quinoa), black pepper steak, sweet potato, grilled portobello, thinly sliced apples, blue cheese crumbles, sliced almonds, dried cherries, honey-thyme dressing, hot honey drizzle', tracking=-2)
    return b

# ------------------------------------------------------------------ Board 2: Build Your Own
def build():
    big = lambda x, y, t, color=SUN: f'<p style="position: absolute; left: {x}px; top: {y}px; margin: 0; font-size: 326px; font-weight: 600; line-height: 73.6px; color: {color}; white-space: nowrap">{t}</p>\n'
    step = lambda x, y, html: f'<p style="position: absolute; left: {x}px; top: {y + 1}px; margin: 0; {HOTL}; font-size: 150px; line-height: 123.6px; white-space: nowrap">{html}</p>\n'
    def base_row(y, icon, label, pill, pill_w):
        return (f'<div style="position: absolute; left: 163px; top: {y}px; display: flex; align-items: center; gap: 36px; height: 92px">'
                f'<div style="display: flex; align-items: center; width: 84px; height: 84px">{icon}</div>'
                f'<span style="{HOTL}; font-size: 90px; line-height: 73.6px; white-space: nowrap">{label}</span>'
                f'<div style="display: flex; align-items: center; height: 92px; padding: 0 26px; border-radius: 1000px; background: {SUN}; color: {FOREST}">'
                f'<span style="width: {pill_w}px; {HOTL}; font-size: 46px; letter-spacing: 3px; line-height: 121.8px; white-space: nowrap">{pill}</span></div></div>\n')
    body = lambda x, y, lines, lh='123.6px', color=WHITE: (f'<p style="position: absolute; left: {x}px; top: {y}px; margin: 0; font-size: 80px; font-weight: 400; '
                                                      f'line-height: {lh}; color: {color}; white-space: pre">' + '<br>'.join(lines) + '</p>\n')
    b = f'<img src="/_blob/{SVG["byo-title"]}" alt="Build your own" style="position: absolute; left: 163px; top: 183px; width: 1556.78px; height: 268.119px; display: block">\n'
    b += f'<p style="position: absolute; left: 163px; top: 545px; width: 545px; margin: 0; {HOTL}; font-size: 102px; line-height: 104.6px; text-align: center; white-space: nowrap">STARTS AT</p>\n'
    b += big(989, 546, '$9.85', WHITE)
    b += big(163, 962, '#1') + step(587, 884, f'CHOOSE<br>YOUR <span style="color: {SUN}">BASE</span>')
    b += base_row(1259, img('byo-bowl', 84, 84), 'GREENS ONLY', 'PICK 2 GREENS', 378)
    b += base_row(1407, img('byo-bowl', 84, 84), 'GREENS + grains', '1 green + 1 grain', 455)
    b += base_row(1555, img('byo-wrap', 84, 76), 'WRAPPED', '1 green + 1 grain', 455)
    b += body(163, 1713, ['Romaine · Arugula · Kale · Baby Spinach'])
    b += body(163, 1837, ['Brown Rice · Quinoa + Farro Blend'], color=SUN)
    b += big(1887, 294, '#2') + step(2369, 209, 'add<br>protein')
    b += body(1887, 513, ['Citrus Herb Char Chicken ·  Blackened Chicken', 'Sesame Miso Tofu ·  Black Pepper Steak', 'Miso Glazed Salmon · Smoked Bacon · Falafel Balls '])
    b += big(1887, 1125, '#3') + step(2371, 1040, 'pick six<br>ingredients')
    b += body(1887, 1364, ['Always fresh, local when possible.  Globally', 'inspired ingredients from fields around the world.'], lh='97px')
    b += big(1887, 1798, '#4') + step(2371, 1713, 'choose<br>a dressing')
    return b

# ------------------------------------------------------------------ Board 3: Beverages
def beverages():
    b = a3(C)
    b = b.replace(f'line-height: 121.8px; white-space: nowrap">check the', f'line-height: 121.8px; color: {SUN}; white-space: nowrap">check the')
    return b

def clean(html):  # a3() always adds the logo; this board has none
    return '\n'.join(l for l in html.split('\n') if '/_blob/None' not in l)

for name, board, title, fn in [('Grass-Board1.dc.html', 'salads', 'Board 1: Signature', signature),
                               ('Grass-Board2.dc.html', 'build', 'Board 2: Build Your Own', build),
                               ('Grass-Board3.dc.html', 'beverages', 'Board 3: Beverages + more', beverages)]:
    html = clean(page(C, board, f'Option D {title}', fn()))
    open(os.path.join(out, name), 'w').write(html)
print('wrote 3 Grass artboards to', out, '(flat Forest ground)' if FLAT else '')
