"""Layout regression check for the Arabic build.

For every screen, with all state revealed, assert that:
  * no text is clipped by its own `overflow: hidden` box
  * the fill-in-the-blank fragments on q7 / q7b do not sit on top
    of their blanks, each other, or the chip tray
  * header paragraphs stay inside their header artwork
"""
import asyncio, json, sys
from playwright.async_api import async_playwright

REVEAL = """() => {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('active');
    s.dataset.qState = 'main';
  });
  const st = document.createElement('style');
  st.textContent = '.screen *{opacity:1!important;visibility:visible!important;animation:none!important}';
  document.head.appendChild(st);
}"""

CLIPPED = """() => {
  const o = [];
  document.querySelectorAll('.screen *').forEach(el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    if (cs.overflow === 'visible' && cs.overflowY === 'visible') return;
    if (!(el.textContent || '').trim()) return;
    if (el.scrollHeight > el.clientHeight + 3 || el.scrollWidth > el.clientWidth + 3)
      o.push({c: el.className, sh: el.scrollHeight, ch: el.clientHeight,
              t: (el.textContent || '').trim().slice(0, 40)});
  });
  return o;
}"""

BOXES = """(sel) => {
  const out = {};
  sel.forEach(s => {
    const e = document.querySelector(s);
    if (!e) { out[s] = null; return; }
    const r = e.getBoundingClientRect();
    out[s] = [Math.round(r.left), Math.round(r.top),
              Math.round(r.right), Math.round(r.bottom)];
  });
  return out;
}"""

ROWS = [
    # q7 second row + the line under it
    ['#screen-q7 .q7-five-text', '#screen-q7 #q7-drop-2',
     '#screen-q7 .q7-manot-text', '#screen-q7 .q7-thirty-text',
     '#screen-q7 .q7-chips', '#screen-q7 .q7-submit-btn'],
    # q7 first row
    ['#screen-q7 .q7-batch-desc', '#screen-q7 #q7-drop-1', '#screen-q7 .q7-litrim'],
    # q7b rows
    ['#screen-q7b .q7b-blue-text', '#screen-q7b #q7b-drop-1', '#screen-q7b .q7b-blue-litrim'],
    ['#screen-q7b .q7b-yellow-text', '#screen-q7b #q7b-drop-2', '#screen-q7b .q7b-yellow-litrim'],
    # header paragraphs vs their artwork
    ['#screen-slide2 .slide2-text', '#screen-slide2 .slide2-header'],
    ['#screen-slide3 .slide3-header-text', '#screen-slide3 .slide3-header'],
    ['#screen-slide5 .s5-header-text', '#screen-slide5 .s5-header-bg'],
]

def overlaps(a, b):
    return a and b and not (a[2] <= b[0] or b[2] <= a[0] or a[3] <= b[1] or b[3] <= a[1])

async def main(root):
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--allow-file-access-from-files'])
        pg = await br.new_page(viewport={'width': 1920, 'height': 1080})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(f'file://{root}/index.html')
        await pg.wait_for_timeout(2500)
        await pg.evaluate(REVEAL)
        await pg.wait_for_timeout(1200)

        clipped = await pg.evaluate(CLIPPED)
        print('page errors :', errs or 'none')
        print('clipped text:', clipped or 'none')

        for row in ROWS:
            boxes = await pg.evaluate(BOXES, row)
            print()
            for k, v in boxes.items():
                print(f'   {k.split(" ")[-1]:28} {v}')
            names = [k for k in boxes]
            for i in range(len(names)):
                for j in range(i + 1, len(names)):
                    a, b = boxes[names[i]], boxes[names[j]]
                    # header artwork is meant to sit behind its text
                    if 'header' in names[j] or 'header' in names[i]:
                        continue
                    if overlaps(a, b):
                        print(f'   !! OVERLAP {names[i].split(" ")[-1]} x {names[j].split(" ")[-1]}')
        # header containment
        for txt, art in [('#screen-slide2 .slide2-text', '#screen-slide2 .slide2-header'),
                         ('#screen-slide3 .slide3-header-text', '#screen-slide3 .slide3-header'),
                         ('#screen-slide5 .s5-header-text', '#screen-slide5 .s5-header-bg')]:
            b = await pg.evaluate(BOXES, [txt, art])
            t, a = b[txt], b[art]
            if t and a and t[3] > a[3] - 2:
                print(f'   !! {txt} bottom {t[3]} spills past header artwork bottom {a[3]}')
        await br.close()

asyncio.run(main(sys.argv[1]))
