# Builds the Grass artboards from Figma's "LATEST BOARDS" page. The live boards (Grass-Board1/2/3.dc.html) are
# frames "FINAL - 1" (122:810, House Bowls), "FINAL - 2" (122:876, Grow your Own) and
# "FINAL - 3" (122:1217, ingredients, proteins and refreshers). Archived Layout 2 (Layout2-Board1/2/3.dc.html)
# is the earlier second row, frames 3, 1, 2.
# Positions and sizes are Figma's.
# Board 1's title, board 2's lettering and board 3's divider are Figma's vector exports in design/assets/field-trip/.
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
    'fields-gathered': 'd4c09801249a440e80340860ae861576', 'divider': '1fe0f9f8527c0305a1e2ffc981ed1a79', 'vegetarian': 'd2dec4c0f276c9386569d90015b3cd96',
    'grow': '8c29fd317d8ef291630e8202bd968c62', 'your-own': '1faa17dbedd032f0236d6f7cf1808667',
    'starts-at-5': '4a434b974d175caee23269bc4049669e', 'price-5': '0575dd7d02b41bafc639db7ec6e4b3ba',
    'fields-gathered-stacked': '10d4524056454e5605159847b99ab544', 'price-3': '8fc42b18a74e921aa0aa763704b07bf7', 'path83': 'e8e5569f9b638941f0e20ddb220637fa', 'step1': '043eb4097ea4fbbed468e78b36cc57d0',
    'step2': 'b92ff74f402cb85a646d44c6ceefe775', 'step3': '1930219e5e916519dba999c597027e06',
    'step4': '82acaa3b98e91ade47c420b69f10c778', 'pick-your-field-2': '8647c1e19b696e6485f31781ef9752ea',
    'start-with-2': '440895a9671bd08cc77240a45189ed86', 'harvest-six-2': '4202076a8f8917de7b9c51e698782702',
    'take-flight-2': 'fedcbef7ad9de04a483209a6c0224590', 'fuel-up-2': '09bccdd41df448deb0ca6d1c4d548a3a',
    'upgrade-your-trip-2': 'c55a452476105e9acc95b6d2ea1df7c2', 'final-approach-2': '521ab94e2c2d4a0a48c52a74091ab5db',
    'choose-dressing-2': '8c9433b7a78cc3434d82dbc50fcebfa9', 'ticket-2': '1f3e71b203b69e21c8ed1af643aa3a62',
    'field-2': '52d4baa60b25ff2a85f0cfdd9cfb8b64', 'trip': '088367d6b171719a7f6558c6dfe4cb27',
    'price-2': '0c1cbce504853417f3c1de6f7a1607c9',
   
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
    def item(name, price, desc):
        return (f'<div style="display: flex; flex-direction: column; gap: 36px">'
                f'<div style="display: flex; align-items: flex-start; gap: 36px">'
                f'<span style="{HOTL}; font-size: 106px; line-height: 73.6px; white-space: nowrap">{name}</span>'
                f'<span style="flex: 1 0 0; min-width: 1px; height: 76px"></span>'
                f'<span style="position: relative; top: 1px; font-size: 106px; font-weight: 600; line-height: 73.6px; color: {SUN}; white-space: nowrap">{price}</span></div>'
                f'<p style="margin: 0; font-size: 68px; font-weight: 400; line-height: normal; letter-spacing: -1px; white-space: nowrap; font-feature-settings: \'dlig\' 1">'
                + '<br>'.join(desc) + '</p></div>')
    b = (f'<h2 style="position: absolute; left: 137px; top: {292 - 60.9:g}px; margin: 0; {MID}; font-size: 273px; line-height: 121.8px; '
         f'color: {SUN}; white-space: nowrap">House Bowls</h2>\n')
    b += (f'<p style="position: absolute; right: {W - 3709}px; top: 185px; margin: 0; {HOTL}; font-size: 106px; line-height: 120px; '
          f'text-align: right; white-space: nowrap">OUR FAVORITE<br>PLACES, IN A BOWL</p>\n')
    b += ('<div style="position: absolute; left: 130px; top: 589px; width: 3579px; display: grid; '
          'grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 130px; row-gap: 107px">')
    b += item('Strawberry Fields', '$13.25', ['Spinach, tri-color quinoa, citrus-herb chicken,', 'strawberries, walnuts, avocado, crumbled feta, almond', 'brittle, citrus-poppyseed vinaigrette'])
    b += item('Baja', '$13.50', ['Spinach, citrus-herb chicken, grilled corn, black beans,', 'avocado, roasted sweet potato, pico de gallo, cotija', 'waffles, chili-lime vinaigrette, lime wedge'])
    b += item('High Plains', '$14.50', ['Spinach + kale, blackened chicken, applewood bacon,', 'hardboiled egg, grilled corn, cherry tomatoes, avocado,', 'grilled poblano, sourdough croutons, Colorado ranch, hot', 'honey drizzle'])
    b += item('Coastal Caesar', '$12.95', ['Shredded kale + romaine hearts, blackened chicken,', 'cherry tomatoes, sourdough croutons, parmesan, vegan', 'caesar dressing, lemon wedge'])
    b += item('Blue Zone', '$15.75', ['Spinach + romaine hearts, miso-glazed salmon, roasted', 'sweet potato, watermelon radish, carrot ribbons, toasted', 'nori puffs, avocado, edamame, sesame-miso dressing'])
    b += item('Fields Notes', '$13.50', ['Kale + spinach, roasted sweet potato, roasted broccoli,', 'mixed mushrooms, apple, blue cheese, almonds, fields', 'honey vinaigrette, hot honey drizzle'])
    b += '</div>\n'
    b += svg('vegetarian', 2764, 1593, 95, 95, alt='Vegetarian')  # beside FIELDS NOTES, as in Figma
    b += (f'<p style="position: absolute; left: 62px; top: {H - 122}px; margin: 0; font-size: 58px; font-weight: 500; line-height: normal; '
          f'letter-spacing: -1px; color: {SUN}; white-space: nowrap; font-feature-settings: \'dlig\' 1">All bowls can be made vegetarian upon request</p>\n')
    return b

# ------------------------------------------------------------------ Board 2: Grow your Own (FINAL - 2)
def build():
    hotl = lambda x, y, size, html, extra='': (f'<p style="position: absolute; left: {x}px; top: {y}px; margin: 0; {HOTL}; font-size: {size}px; '
                                              f'line-height: 123.6px;{extra} white-space: nowrap">{html}</p>\n')
    b = svg('grow', 210, 275, 804, 325.732, alt='Grow')
    b += svg('your-own', 463, 494, 1080, 293, alt='your Own')
    b += svg('starts-at-5', 1126, 837, 362.957, 39.592, alt='Starts at')
    b += svg('price-5', 1201, 925, 288.089, 109.314, alt='$9.95')
    b += hotl(292, 1675 + 1, 80, 'ORDER ONLINE @')
    b += hotl(292, 1772 + 1, 100, f'<span style="color: {SUN}">FIELDSBOWLS.COM</span>')
    x, y, w, h = inset(47.18, 54.22, 52.77, 45.7)  # the stray 3x1 px path, as in Figma
    b += svg('path83', x, y, w, h, transform='scaleY(-1)')
    # Four steps: a number pill, a Heart of the Land heading, and a Fredoka line with the key words
    # in medium-weight yellow.
    yel = lambda t: f'<span style="font-weight: 500; color: {SUN}">{t}</span>'
    line = lambda y, html: (f'<p style="position: absolute; left: 2131.03px; top: {y}px; margin: 0; font-size: 74px; font-weight: 400; line-height: normal; '
                            f'letter-spacing: -1px; white-space: nowrap; font-feature-settings: \'dlig\' 1">{html}</p>\n')
    for key, px, py, ph, head, hy, text, ty in [
        ('step1', 1847.03, 405, 128.452, f'PICK YOUR <span style="color: {SUN}">FIELD BASE</span>', 404, yel('Select 2') + ' greens and/or grains', 550),
        ('step2', 1848.03, 816, 129.712, f'HARVEST 6 <span style="color: {SUN}">TOPPINGS</span>', 816, 'Pick up to' + yel(' 6 field ingredients'), 962),
        ('step3', 1848.03, 1227, 130.972, f'<span style="color: {SUN}">UPGRADE</span> YOUR CROP', 1228, 'Add ' + yel('proteins + premium extras'), 1374),
        ('step4', 1848.03, 1645, 128.485, 'DRESS YOUR FIELD', 1640, 'Choose a ' + yel('house-made dressing'), 1786),
    ]:
        b += svg(key, px, py, 231, ph, alt=key[-1])
        b += hotl(2131.03, hy + 1, 120, head)  # Figma's glyphs sit 1px lower
        b += line(ty, text)
    b += ('<p style="position: absolute; right: 395px; top: 979px; margin: 0; font-size: 55px; font-weight: 400; line-height: normal; '
          'letter-spacing: -1px; text-align: right; white-space: nowrap">+$0.85 each<br>for extras</p>\n')
    return b

# ------------------------------------------------------------------ Board 3: Ingredients, Proteins + Refreshers (FINAL - 3)
def beverages():
    title = lambda x, cy, t: (f'<h2 style="position: absolute; left: {x}px; top: {cy - 59.9:g}px; margin: 0; {MID}; font-size: 133px; '
                              f'line-height: 121.8px; color: {SUN}; white-space: nowrap">{t}</h2>\n')
    def grid(x, y, width, row_gap, rows):
        cells = ''.join(f'<div style="color: {SUN if c.startswith("*") else WHITE}">{c.lstrip("*")}</div>' for r in rows for c in r)
        return (f'<div style="position: absolute; left: {x}px; top: {y}px; width: {width}px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); '
                f'column-gap: 76px; row-gap: {row_gap}px; align-items: start; font-size: 68px; font-weight: 400; line-height: normal; white-space: nowrap">{cells}</div>\n')
    b = title(177, 259, 'Greens + Grains')
    b += grid(217, 403, 1841, 53, [['Romaine Hearts', 'Arugula', 'Kale'], ['Baby Spinach', 'Wild Rice', 'Tri-Color Quinoa']])
    b += title(177, 812, 'Field Ingredients')
    b += grid(217, 981, 1868, 49, [['Cucumber', 'Carrot Ribbons', 'Red Onion'], ['Edamame', 'Black Beans', 'Grilled Corn'],
                                   ['Cherry Tomatoes', 'Grilled Poblano', 'Roasted Chickpeas'],
                                   ['Roasted<br>Broccoli', 'Roasted Sweet<br>Potato', 'Watermelon<br>Radish'],
                                   ['Pico de Gallo', 'Green Apples', 'Strawberries'], ['Cilantro', 'Chives', '']])
    b += title(2333, 260, 'Proteins')
    b += ('<div style="position: absolute; left: 2361px; top: 403px; width: 1275px; display: flex; flex-direction: column; gap: 38px; font-size: 68px">'
          + ''.join(f'<div style="display: flex; align-items: center; justify-content: space-between; white-space: nowrap">'
                    f'<span style="font-weight: 400; line-height: normal">{n}</span>'
                    f'<span style="font-weight: 600; line-height: 73.6px; color: {SUN}">{pr}</span></div>'
                    for n, pr in [('Citrus-Herb Chicken', '+$4.25'), ('Blackened Chicken', '+$4.50'), ('Sesame Miso Alaskan Salmon', '+$6.50'),
                                  ('Smoked Applewood Bacon', '+$2.85'), ('Hot Honey Tofu', '+$3.50'),
                                  ('Roasted Shiitake Mushroom Mix', '+$2.00'), ('Hardboiled Egg', '+$1.25')]) + '</div>\n')
    b += title(2323, 1384, 'Refreshers')
    b += ('<p style="position: absolute; left: 3393px; top: 1375px; margin: 0; font-size: 106px; font-weight: 600; line-height: 73.6px; '
          'white-space: nowrap">$4.50</p>\n')
    for x, y, name, desc in [(2361, 1567, 'PALM SPRINGS', 'iced tea + lemonade'), (3123, 1567, 'VALENCIA', 'orange'),
                             (2361, 1806, 'FLAMINGO', 'hibiscus lemonade'), (3123, 1806, 'BLUEBIRD', 'blueberry iced tea')]:
        b += (f'<div style="position: absolute; left: {x}px; top: {y + 1}px; width: 717px; white-space: nowrap">'
              f'<div style="margin-bottom: -13px; {HOTL}; font-size: 80px; line-height: 121.8px; color: {SUN}">{name}</div>'
              f'<div style="font-size: 68px; font-weight: 400; line-height: normal">{desc}</div></div>\n')
    b += ('<p style="position: absolute; left: 109px; top: 2009px; transform: translateY(-50%); margin: 0; font-size: 54px; font-weight: 400; '
          'line-height: normal; white-space: nowrap">We only use Italian olive oil in our marinades and dressings.<br>'
          'All proteins ethically sourced and sustainable</p>\n')
    return b

# ================================================================== Layout 2: the second row
# Figma frames 121:403 "1", 121:470 "2", 121:564 "3": the bowls split over two boards with Refreshers,
# and Field Trip. On the TVs Field Trip comes first (left), then 1 and 2: Layout2-Board1/2/3.dc.html.

def bowls2(x, width, items):
    """Three bowls in Figma's equal-height grid (229 to 1930, 246 between rows)."""
    def item(name, price, desc):
        return (f'<div style="display: flex; flex-direction: column; gap: 52px">'
                f'<div style="display: flex; align-items: flex-start; gap: 36px">'
                f'<span style="position: relative; top: 1px; {HOTL}; font-size: 112px; line-height: 73.6px; white-space: nowrap">{name}</span>'
                f'<span style="flex: 1 0 0; min-width: 1px; height: 76px"></span>'
                f'<span style="position: relative; top: 1px; font-size: 106px; font-weight: 600; line-height: 73.6px; color: {SUN}; white-space: nowrap">{price}</span></div>'
                f'<p style="margin: 0; font-size: 72px; font-weight: 400; line-height: normal; letter-spacing: -1px; white-space: nowrap; '
                f'font-feature-settings: \'dlig\' 1">' + '<br>'.join(desc) + '</p></div>')
    return (f'<div style="position: absolute; left: {x}px; top: 229px; width: {width}px; height: 1701px; display: grid; '
            f'grid-template-rows: repeat(3, minmax(0, 1fr)); row-gap: 246px">' + ''.join(item(*i) for i in items) + '</div>\n')

def signature2():
    b = svg('fields-gathered-stacked', 197, 229, 1114.92, 541.554, alt='Fields Gathered')
    b += (f'<p style="position: absolute; left: 220px; top: 850px; margin: 0; {HOTL}; font-size: 106px; line-height: 120px; '
          f'white-space: nowrap">OUR FAVORITE<br>PLACES, IN A BOWL</p>\n')
    b += ('<p style="position: absolute; left: 204px; top: 1916px; margin: 0; font-size: 72px; font-weight: 500; line-height: normal; '
          'letter-spacing: -1px; white-space: nowrap; font-feature-settings: \'dlig\' 1">All meals can be made vegan</p>\n')
    b += bowls2(1643, 1986, [
        ('Strawberry Fields', '$13.25', ['Spinach + tri-color quinoa, citrus-herb char chicken,', 'sliced strawberries, walnuts, avocado, crumbled',
                                         'feta, almond brittle pieces, citrus-poppyseed', 'vinaigrette']),
        ('High Plains', '$14.50', ['Spinach + kale, blackened chicken, applewood bacon,', 'sliced hardboiled egg, charred corn, tri-color cherry',
                                   'tomatoes, avocado, grilled poblano, sourdough', 'focaccia croutons, Colorado ranch, hot honey drizzle']),
        ('Blue Zone', '$15.75', ['Spinach + romaine hearts, miso-glazed salmon,', 'roasted sweet potato, watermelon radish, carrot',
                                 'ribbons, toasted nori puffs, avocado, edamame,', 'sesame-miso dressing']),
    ])
    return b

def bowls_refreshers2():
    b = bowls2(208, 1888, [
        ('Baja BOWL', '$13.50', ['Spinach, citrus-herb char chicken, charred corn,', 'black beans, avocado, roasted sweet potato,',
                                 'house-made pico de gallo, crispy cotija waffles,', 'chili-lime vinaigrette, fresh lime wedge']),
        ('COASTAL CAESAR', '$12.95', ['Shredded kale + romaine hearts, blackened chicken,', 'tri-color cherry tomatoes, sourdough focaccia',
                                      'croutons, shaved parmesan, vegan caesar dressing,', 'fresh lemon wedge']),
        ('FIELDS NOTES', '$13.50', ['Kale + spinach, roasted sweet potato, roasted', 'broccoli, mixed mushrooms, sliced apple, blue',
                                    'cheese crumbles, sliced almonds, honey-thyme', 'dressing, hot honey drizzle']),
    ])
    b += (f'<h2 style="position: absolute; left: 2350px; top: {327 - 60.9:g}px; margin: 0; {MID}; font-size: 253px; line-height: 121.8px; '
          f'color: {SUN}; white-space: nowrap">Refreshers</h2>\n')
    b += ('<p style="position: absolute; left: 2340px; top: 545px; margin: 0; font-size: 72px; font-weight: 500; line-height: normal; '
          'letter-spacing: -1px; white-space: nowrap; font-feature-settings: \'dlig\' 1">House-made, globally-inspired</p>\n')
    def drink(name, price, desc):
        return (f'<div style="display: flex; flex-direction: column; gap: 24px">'
                f'<div style="display: flex; align-items: center; justify-content: space-between; height: 74px; line-height: 73.6px; white-space: nowrap">'
                f'<span style="{HOTL}; font-size: 112px">{name}</span>'
                f'<span style="font-size: 98px; font-weight: 600; color: {SUN}">{price}</span></div>'
                f'<p style="margin: -1px 0 0; height: {87 * len(desc) + 1}px; font-size: 72px; font-weight: 400; line-height: normal; letter-spacing: -1px; '
                f'white-space: nowrap; font-feature-settings: \'dlig\' 1">' + '<br>'.join(desc) + '</p></div>')
    b += '<div style="position: absolute; left: 2349px; top: 760px; width: 1310px; display: flex; flex-direction: column; gap: 139px">'
    b += drink('Arnold Palmer', '$8.95', ['Sweet tea &amp; lemonade'])
    b += drink('Valencia', '$8.95', ['Fresh orange juice &amp; lemon'])
    b += drink('Flamingo', '$9.25', ['Tropical hibiscus &amp; lemonade'])
    b += drink('Bluebird', '$9.50', ['Refreshing blueberry lavender', 'iced tea'])
    return b + '</div>\n'

def field_trip2():
    # Same Field Trip pieces as Layout 1's board 2 (Figma re-exports them identical to 0.0002 px), arranged
    # with the price beside STARTS AT and a Greens + Grains list underneath.
    x, y, w, h = inset(18.94, 59.15, 54.49, 5.1)
    b = svg('ticket-2', x, y, w, h)
    b += svg('field-2', 324.02, 516.26, 746.523, 318.129, alt='Field')
    b += svg('trip', 1281.49 + (111.911 - 324.073) / 2, 529.37 + (326.294 - 104.83) / 2, 324.073, 104.83, alt='Trip', transform='rotate(88.74deg)')
    b += f'<p style="position: absolute; left: 221px; top: 233px; margin: 0; {HOTL}; font-size: 130px; line-height: 123.6px; white-space: nowrap">BUILD YOUR</p>\n'
    b += f'<p style="position: absolute; left: 324px; top: 1037px; margin: 0; {HOTL}; font-size: 100px; line-height: 123.6px; letter-spacing: 17px; white-space: nowrap">STARTS AT</p>\n'
    b += svg('price-3', 1041, 1038, 527.543, 200.174, alt='$9.95')
    b += f'<p style="position: absolute; left: 221px; top: 1439px; margin: 0; {HOTL}; font-size: 118px; line-height: 123.6px; white-space: nowrap">GREENS + GRAINS</p>\n'
    b += (f'<p style="position: absolute; left: 227px; top: 1591px; margin: 0; font-size: 80px; font-weight: 400; line-height: 123.6px; white-space: nowrap">'
          f'Romaine Hearts · Arugula<br>Baby Spinach · Kale<br><span style="color: {SUN}">Wild Rice · Tri-Color Quinoa</span></p>\n')
    x, y, w, h = inset(48.11, 49.35, 51.85, 50.57)  # the stray 3x1 px path, as in Figma
    b += svg('path83', x, y, w, h, transform='scaleY(-1)')
    for key, x, y, w, h, alt in [
        ('step1', 1937, 377, 231, 128.452, '1'),
        ('pick-your-field-2', 2219.52, 387.93, 1148.769, 99.496, 'Pick your field'),
        ('start-with-2', 2217.27, 535.99, 1333.993, 67.19, 'Start with 2 greens or 1 green and 1 grain'),
        ('step2', 1928, 816.18, 231, 129.712, '2'),
        ('harvest-six-2', 2205.17, 829.67, 893.611, 99.496, 'Harvest six'),
        ('take-flight-2', 2202.31, 980.45, 1152.224, 67.336, 'Take flight with six field ingredients'),
        ('step3', 1920, 1260.79, 231, 130.972, '3'),
        ('upgrade-your-trip-2', 2201.27, 1277.69, 1423.38, 99.496, 'Upgrade your trip'),
        ('fuel-up-2', 2201.27, 1425.22, 1351.792, 67.263, 'Fuel up with proteins and premium extras'),
        ('step4', 1920, 1705.48, 231, 128.485, '4'),
        ('final-approach-2', 2199.28, 1717.66, 1201.287, 99.496, 'Final approach'),
        ('choose-dressing-2', 2199.28, 1860.84, 1013.461, 67.191, 'Choose a house-made dressing'),
    ]:
        b += svg(key, x, y, w, h, alt=alt)
    return b

def clean(html):  # the shell adds a logo when there is one; these boards have none
    return '\n'.join(l for l in html.split('\n') if '/_blob/None' not in l)

for name, board, title, fn in [('Grass-Board1.dc.html', 'salads', 'Board 1: House Bowls', signature),
                               ('Grass-Board2.dc.html', 'build', 'Board 2: Grow your Own', build),
                               ('Grass-Board3.dc.html', 'beverages', 'Board 3: Ingredients, Proteins + Refreshers', beverages)]:
    html = clean(page(C, board, f'Option D {title}', fn()))
    open(os.path.join(out, name), 'w').write(html)
# Layout 2 runs Field Trip first (left TV), then Figma's frames 1 and 2.
for name, board, title, fn in [('Layout2-Board1.dc.html', 'salads', 'Board 1: Build your Field Trip', field_trip2),
                               ('Layout2-Board2.dc.html', 'build', 'Board 2: Fields Gathered', signature2),
                               ('Layout2-Board3.dc.html', 'beverages', 'Board 3: Bowls + Refreshers', bowls_refreshers2)]:
    html = clean(page(C, board, f'Option E {title}', fn()))
    open(os.path.join(out, name), 'w').write(html)
print('wrote 6 Grass artboards (layouts 1 and 2) to', out, '(flat Forest ground)' if FLAT else '')
