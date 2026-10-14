# Builds the Grass artboards (Grass-Board1/2/3.dc.html) from Figma's "LATEST BOARDS" page
# (frames 118:6885 Signature "Fields Gathered", 118:6937 Build Your Own "Field Trip",
# 118:7207 Beverages "Greens / Grains / Refreshers"). Positions and sizes are Figma's.
# Board 2's lettering and Board 3's titles are Figma's vector exports in design/assets/field-trip/.
#
# Usage: python3 tools/build-grass-latest.py design            # the real boards (grass photos)
#        python3 tools/build-grass-latest.py <dir> --flat      # Figma's flat Forest ground, for diffing
import os, sys

out = sys.argv[1]
FLAT = '--flat' in sys.argv
os.makedirs(out, exist_ok=True)

# Reuse the page shell from the A2/A3 generator.
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'build-a2-a3.py')).read()
_ns = {'__file__': __file__}
exec(_src[:_src.index('FILES = {')], _ns)
page, MID, HOTL = _ns['page'], _ns['MID'], _ns['HOTL']

WHITE, SUN, FOREST = '#ffffff', '#f9e14d', '#283628'
PHOTO = {'salads': '0695e19f2e566c2e77d4f26eb2678687', 'build': '2a611a6d12b65f1438500960e75abc6a',
         'beverages': '1fdc0cef2f78fa30b9235178c842f0ea'}
C = dict(name='Option D', bg=FOREST if FLAT else '#1d2716', ink=WHITE, acc=SUN, pill=SUN, pillink=FOREST,
         logo=None, **({} if FLAT else {'photo': PHOTO}))
SVG = {  # canvas blob ids; design/manifest.json maps them to design/assets/field-trip/<name>.svg
    'path83': 'e8e5569f9b638941f0e20ddb220637fa', 'pick-your-field': '87556bebb815afa87b42b1a3df49b64d',
    'start-your-journey': 'd3dadc5b83c4e631985603d8f383f132', 'step1': '043eb4097ea4fbbed468e78b36cc57d0',
    'harvest-six': '9240a0a1a88607506a1b915aae2cc5e2', 'take-flight': '86da30189b32b81cc9cd994ac522dec9',
    'step2': 'b92ff74f402cb85a646d44c6ceefe775', 'fuel-up': 'ad655828f0255e157e34d0bf1b94e8e0',
    'upgrade-your-trip': '557d01355f5f21efddbcf34be44b75c4', 'step3': '1930219e5e916519dba999c597027e06',
    'final-approach': 'c11d339c245c38f08e455628926aec01', 'choose-dressing': '57f81c19b6f882c40fc6bcaf33f0e765',
    'step4': '82acaa3b98e91ade47c420b69f10c778', 'ticket': 'c471642286c826d05fbfe6b57eee8e42',
    'field': 'ce2081d03a444539451a7f074eaeda77', 'build-your': 'd5087e917f100d683103ef86c27e6741',
    'starting-at': '5fb28923d7bcf1b7791bbbaee377c3f0', 'greens': '751d838a999f9ea7a5e48fad33dee1f2',
    'grains': '0302d84639b9b9fe61fc24b674f899a8', 'refreshers': '0c0b5a5a79884f3c833bd897562665e9',
}
W, H = 3840, 2160

def svg(key, x, y, w, h, alt='', transform=''):
    t = f'; transform: {transform}' if transform else ''
    return (f'<img src="/_blob/{SVG[key]}" alt="{alt}" style="position: absolute; left: {x:g}px; top: {y:g}px; '
            f'width: {w:g}px; height: {h:g}px; display: block{t}">\n')

def inset(top, right, bottom, left):  # Figma's percentage insets → (x, y, w, h) in board px
    return left * W / 100, top * H / 100, W * (1 - (left + right) / 100), H * (1 - (top + bottom) / 100)

# ------------------------------------------------------------------ Board 1: Fields Gathered
def signature():
    # Descriptions break where Figma breaks them, and like Figma join tt/ll with Fredoka's discretionary
    # ligatures; otherwise the browser's lines run up to 5px longer.
    def item(name, price, desc, tracking=-1):
        return (f'<div style="display: flex; flex-direction: column; gap: 36px">'
                f'<div style="display: flex; align-items: flex-start; gap: 36px">'
                f'<span style="{HOTL}; font-size: 106px; line-height: 73.6px; white-space: nowrap">{name}</span>'
                f'<span style="flex: 1 0 0; min-width: 1px; height: 76px"></span>'
                f'<span style="font-size: 106px; font-weight: 600; line-height: 73.6px; color: {SUN}; white-space: nowrap">{price}</span></div>'
                f'<p style="margin: 0; font-size: 58px; font-weight: 400; line-height: 70px; letter-spacing: {tracking}px; white-space: nowrap; font-feature-settings: \'dlig\' 1">'
                + '<br>'.join(desc) + '</p></div>')
    b = (f'<h2 style="position: absolute; left: 130px; top: {283 - 60.9:g}px; width: 2142px; margin: 0; {MID}; font-size: 282px; '
         f'line-height: 121.8px; color: {SUN}; white-space: nowrap">Fields Gathered</h2>\n')
    b += (f'<p style="position: absolute; right: {W - 3709}px; top: 188px; margin: 0; {HOTL}; font-size: 106px; line-height: 120px; '
          f'text-align: right; white-space: nowrap">OUR FAVORITE<br>PLACES, IN A BOWL</p>\n')
    b += ('<div style="position: absolute; left: 130px; top: 619px; width: 3579px; display: grid; '
          'grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 130px; row-gap: 156px">')
    b += item('Strawberry Fields', '$13.75', ['Spinach, tri-color quinoa, citrus-herb charred chicken, sliced', 'strawberries, sliced almonds, avocado, feta cheese crumbles,', 'almond brittle, citrus-poppyseed vinaigrette'])
    b += item('Baja Bowl', '$14.75', ['Spinach + tri-color quinoa, citrus-herb chicken, charred corn, black', 'beans, avocado, sweet potato, pico, cilantro, cotija cakes, lime', 'wedge, chili-lime vinaigrette'])
    b += item('High Plains', '$15.75', ['Spinach + kale, blackened chicken, full-slice bacon, hardboiled eggs,', 'charred Colorado corn, cherry tomatoes, avocado, shredded', 'cheddar, focaccia croutons, Colorado ranch dressing, hot honey', 'drizzle, charred poblano chili'])
    b += item('Coastal Caesar', '$10.95', ['Shredded kale + romaine (or tri-colored quinoa), heirloom cherry', 'tomatoes, focaccia croutons, shaved parmesan, parmesan-pecorino', 'waffles, lemon wedge, vegan caesar dressing'])
    b += item('Blue Zone', '$14.95', ['Baby spinach + romaine hearts, miso-glazed salmon, sweet potato,', 'watermelon radish, carrot ribbons, avocado, pickled ginger,', 'mushroom hand roll, sesame-miso dressing'])
    b += item('Fields Notes', '$15.95', ['Kale + spinach (or tri-colored quinoa), black pepper steak, sweet', 'potato, grilled portobello, thinly sliced apples, blue cheese crumbles,', 'sliced almonds, dried cherries, honey-thyme dressing, hot honey drizzle'], tracking=-2)
    return b + '</div>\n'

# ------------------------------------------------------------------ Board 2: Build your Field Trip
def build():
    b = ''
    # The ticket outline: a 3076.5 x 1312.5 drawing turned 90deg, running off the bottom edge.
    x, y, w, h = inset(20.62, 59.39, -63.08, 6.43)
    b += svg('ticket', x + (w - h) / 2, y + (h - w) / 2, h, w, transform='rotate(90deg)')
    # "Field", tilted -3.39deg, centred in its box.
    x, y, w, h = inset(26.9, 62.67, 48.81, 8.47)
    b += svg('field', x + (w - 1082.86) / 2, y + (h - 461.455) / 2, 1082.86, 461.455, alt='Field', transform='rotate(-3.39deg)')
    b += svg('build-your', 308, 215.93, 1170.026, 112.288, alt='Build your')
    b += svg('starting-at', 421.38, 1492.99, 919.999, 470.846, alt='Starting at $9.95')
    x, y, w, h = inset(48.29, 49.35, 51.66, 50.57)  # a stray 3x1 px path in Figma, kept for fidelity
    b += svg('path83', x, y, w, h, transform='scaleY(-1)')
    # Four steps in a column centred 121.22px below the middle, 197px apart. In each step the pill,
    # heading and line sit at Figma's offsets inside a box as tall as the lowest of them.
    steps = [
        [('step1', 0, 0, 231, 128.452, '1'), ('pick-your-field', 284.26, 11, 1155.853, 100.109, 'Pick your field'),
         ('start-your-journey', 0.57, 158.97, 1773.219, 68.396, 'Start your journey with 2 greens or 1 green and 1 grain')],
        [('step2', 0, 0, 231, 129.712, '2'), ('harvest-six', 278.88, 13.57, 899.122, 100.109, 'Harvest six'),
         ('take-flight', 0, 165.28, 1159.329, 67.752, 'Take flight with six field ingredients')],
        [('step3', 0, 0, 231, 130.972, '3'), ('upgrade-your-trip', 283, 17.01, 1432.159, 100.109, 'Upgrade your trip'),
         ('fuel-up', 5.6, 165.45, 1360.129, 67.678, 'Fuel up with proteins and premium extras')],
        [('step4', 0, 0, 231, 128.485, '4'), ('final-approach', 281, 12.26, 1208.695, 100.109, 'Final approach'),
         ('choose-dressing', 0, 156.31, 1019.711, 67.605, 'Choose a house-made dressing')],
    ]
    heights = [max(t + h for _, _, t, _, h, _ in s) for s in steps]
    y = H / 2 + 121.22 - (sum(heights) + 197 * (len(steps) - 1)) / 2
    for s, sh in zip(steps, heights):
        for key, l, t, w, h, alt in s:
            b += svg(key, 1827 + l, round(y + t, 3), w, h, alt=alt)
        y += sh + 197
    return b

# ------------------------------------------------------------------ Board 3: Greens, Grains, Refreshers
def beverages():
    def names(x, y, items):
        return (f'<div style="position: absolute; left: {x}px; top: {y}px; display: flex; flex-direction: column; gap: 30px; '
                f'{HOTL}; font-size: 100px; line-height: 121.8px; white-space: nowrap">'
                + ''.join(f'<div>{t}</div>' for t in items) + '</div>\n')
    def drink(name, price, desc):
        return (f'<div style="display: flex; flex-direction: column; gap: 24px">'
                f'<div style="display: flex; align-items: center; justify-content: space-between; white-space: nowrap">'
                f'<span style="{HOTL}; font-size: 100px; line-height: 121.8px">{name}</span>'
                f'<span style="font-size: 98px; font-weight: 600; line-height: 73.6px; color: {SUN}">{price}</span></div>'
                f'<p style="margin: 0; font-size: 62px; font-weight: 400; line-height: 64.4px">{desc}</p></div>')
    b = svg('greens', 246, 220, 830.253, 273.316, alt='Greens')
    b += names(326, 527.5, ['ROMAINE HEARTS', 'ARUGULA', 'KALE', 'SPINACH'])
    b += svg('grains', 223, 1356, 853, 276.765, alt='Grains')
    b += names(326, 1667.5, ['WILD RICE', 'TRI-COLOR QUINOA'])
    b += svg('refreshers', 1870, 230, 1306, 326.165, alt='Refreshers')
    b += '<div style="position: absolute; left: 1878px; top: 809px; width: 1521px; display: flex; flex-direction: column; gap: 96px">'
    b += drink('Arnold Palmer', '$8.95', 'Sweet tea &amp; lemonade')
    b += drink('Valencia', '$8.95', 'Fresh orange juice &amp; lemon')
    b += drink('Flamingo', '$9.25', 'Tropical hibiscus &amp; lemonade')
    b += drink('Bluebird', '$9.50', 'Refreshing blueberry lavender iced tea')
    return b + '</div>\n'

def clean(html):  # the shell adds a logo when there is one; these boards have none
    return '\n'.join(l for l in html.split('\n') if '/_blob/None' not in l)

for name, board, title, fn in [('Grass-Board1.dc.html', 'salads', 'Board 1: Fields Gathered', signature),
                               ('Grass-Board2.dc.html', 'build', 'Board 2: Build your Field Trip', build),
                               ('Grass-Board3.dc.html', 'beverages', 'Board 3: Greens, Grains + Refreshers', beverages)]:
    html = clean(page(C, board, f'Option D {title}', fn()))
    open(os.path.join(out, name), 'w').write(html)
print('wrote 3 Grass artboards to', out, '(flat Forest ground)' if FLAT else '')
