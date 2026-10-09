/* @ds-bundle: {"format":4,"namespace":"ClassicPlus","components":[{"name":"VectorText"},{"name":"Logo"},{"name":"IntroScreen"},{"name":"ScopeGrid"},{"name":"Searchlight"},{"name":"ProgressSky"},{"name":"PixelBurst"},{"name":"GhostTrail"},{"name":"VectorShapes"},{"name":"BrickWall"},{"name":"Hud"},{"name":"Overlay"},{"name":"ShopCard"},{"name":"UpgradeIcons"},{"name":"FireButton"},{"name":"Synth"},{"name":"GameStage"}]} */
(function(){
  // Classic Plus: the shared canvas kit behind CP Asteroids and CP Breakout.
  // Values are lifted from the two games. Every draw call takes its 2D
  // context explicitly; nothing here owns a global canvas or game loop.
  var TWO_PI = Math.PI * 2;
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function rand(min, max){ return Math.random() * (max - min) + min; }
  function lerp(a, b, t){ return a + (b - a) * t; }

  var COLORS = {
    void: '#000000', fieldNight: '#1f1a0f', fieldSpace: '#10141f',
    ink: '#f5f5f5', inkPure: '#ffffff', inkMuted: 'rgba(255,255,255,0.6)',
    inkFaint: 'rgba(245,245,245,0.3)', inkGhost: 'rgba(245,245,245,0.09)',
    frame: '#4a4a4a', boundary: 'rgba(150,190,220,0.10)', phosphor: '#39ff88',
    grid: 'rgba(255,255,255,0.03)', gridPhosphor: 'rgba(57,255,136,0.03)', gridPhosphorCenter: 'rgba(57,255,136,0.06)',
    signal: 'rgb(150,235,255)', dust: 'rgb(165,120,255)', coin: 'rgb(255,225,60)', coinShort: 'rgba(255,225,60,0.55)',
    hostile: '#ff3b3b', alert: '#f06e64', station: '#5a8787', missile: 'rgb(255,150,60)', exhaust: 'rgb(210,210,220)',
    brickRed: '#e6483f', brickOrange: '#e69a3f', brickGreen: '#57cf6b', brickYellow: '#e8d94a',
    brickHard: '#9471bf', brickCracked: '#e85fa0', brickSteel: '#818181',
    scrim: 'rgba(0,0,0,0.6)', scrimShop: 'rgba(5,7,12,0.75)',
    card: 'rgba(255,255,255,0.05)', cardSelected: 'rgba(150,235,255,0.10)', cardEdge: 'rgba(255,255,255,0.6)',
    cardEdgeOff: 'rgba(255,255,255,0.25)', button: 'rgba(255,255,255,0.08)'
  };
  // Every shadowBlur in Asteroids is multiplied by this, so glow is tuned in one place.
  var GLOW_SCALE = 0.55;

  // ---------- Stage ----------
  function setupCanvas(canvas, w, h){
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }
  // HUD and menu text were sized for a 700px reference; scale to the real canvas.
  function uiScale(W, H){ return Math.max(0.55, Math.min(1.4, Math.min(W, H) / 700)); }
  // Asteroid counts scale with area against a 700x700 reference, so density stays constant.
  function gameplayScale(W, H){ return Math.max(0.7, Math.min(4.0, (W * H) / (700 * 700))); }
  function blinkOn(now, periodMs){ return Math.floor((now === undefined ? Date.now() : now) / (periodMs || 500)) % 2 === 0; }

  // ---------- VectorText ----------
  // The original 1979 Atari Asteroids arcade font, designed by Ed Logg.
  // Data preserved by Trammell Hudson: https://trmm.net/Asteroids_font/
  // 8x12 grid, y-up, "FONT_UP" lifts the pen.
  var VECTOR_FONT = {
    "0": [[0,0],[8,0],[8,12],[0,12],[0,0],[8,12],"FONT_LAST"],
    "1": [[4,0],[4,12],[3,10],"FONT_LAST"],
    "2": [[0,12],[8,12],[8,7],[0,5],[0,0],[8,0],"FONT_LAST"],
    "3": [[0,12],[8,12],[8,0],[0,0],"FONT_UP",[0,6],[8,6],"FONT_LAST"],
    "4": [[0,12],[0,6],[8,6],"FONT_UP",[8,12],[8,0],"FONT_LAST"],
    "5": [[0,0],[8,0],[8,6],[0,7],[0,12],[8,12],"FONT_LAST"],
    "6": [[0,12],[0,0],[8,0],[8,5],[0,7],"FONT_LAST"],
    "7": [[0,12],[8,12],[8,6],[4,0],"FONT_LAST"],
    "8": [[0,0],[8,0],[8,12],[0,12],[0,0],"FONT_UP",[0,6],[8,6],"FONT_LAST"],
    "9": [[8,0],[8,12],[0,12],[0,7],[8,5],"FONT_LAST"],
    "A": [[0,0],[0,8],[4,12],[8,8],[8,0],"FONT_UP",[0,4],[8,4],"FONT_LAST"],
    "B": [[0,0],[0,12],[4,12],[8,10],[4,6],[8,2],[4,0],[0,0],"FONT_LAST"],
    "C": [[8,0],[0,0],[0,12],[8,12],"FONT_LAST"],
    "D": [[0,0],[0,12],[4,12],[8,8],[8,4],[4,0],[0,0],"FONT_LAST"],
    "E": [[8,0],[0,0],[0,12],[8,12],"FONT_UP",[0,6],[6,6],"FONT_LAST"],
    "F": [[0,0],[0,12],[8,12],"FONT_UP",[0,6],[6,6],"FONT_LAST"],
    "G": [[6,6],[8,4],[8,0],[0,0],[0,12],[8,12],"FONT_LAST"],
    "H": [[0,0],[0,12],"FONT_UP",[0,6],[8,6],"FONT_UP",[8,12],[8,0],"FONT_LAST"],
    "I": [[0,0],[8,0],"FONT_UP",[4,0],[4,12],"FONT_UP",[0,12],[8,12],"FONT_LAST"],
    "J": [[0,4],[4,0],[8,0],[8,12],"FONT_LAST"],
    "K": [[0,0],[0,12],"FONT_UP",[8,12],[0,6],[6,0],"FONT_LAST"],
    "L": [[8,0],[0,0],[0,12],"FONT_LAST"],
    "M": [[0,0],[0,12],[4,8],[8,12],[8,0],"FONT_LAST"],
    "N": [[0,0],[0,12],[8,0],[8,12],"FONT_LAST"],
    "O": [[0,0],[0,12],[8,12],[8,0],[0,0],"FONT_LAST"],
    "P": [[0,0],[0,12],[8,12],[8,6],[0,5],"FONT_LAST"],
    "Q": [[0,0],[0,12],[8,12],[8,4],[0,0],"FONT_UP",[4,4],[8,0],"FONT_LAST"],
    "R": [[0,0],[0,12],[8,12],[8,6],[0,5],"FONT_UP",[4,5],[8,0],"FONT_LAST"],
    "S": [[0,2],[2,0],[8,0],[8,5],[0,7],[0,12],[6,12],[8,10],"FONT_LAST"],
    "T": [[0,12],[8,12],"FONT_UP",[4,12],[4,0],"FONT_LAST"],
    "U": [[0,12],[0,2],[4,0],[8,2],[8,12],"FONT_LAST"],
    "V": [[0,12],[4,0],[8,12],"FONT_LAST"],
    "W": [[0,12],[2,0],[4,4],[6,0],[8,12],"FONT_LAST"],
    "X": [[0,0],[8,12],"FONT_UP",[0,12],[8,0],"FONT_LAST"],
    "Y": [[0,12],[4,6],[8,12],"FONT_UP",[4,6],[4,0],"FONT_LAST"],
    "Z": [[0,12],[8,12],[0,0],[8,0],"FONT_UP",[2,6],[6,6],"FONT_LAST"],
    ".": [[3,0],[4,0],"FONT_LAST"],
    ",": [[2,0],[4,2],"FONT_LAST"],
    "-": [[2,6],[6,6],"FONT_LAST"],
    "+": [[1,6],[7,6],"FONT_UP",[4,9],[4,3],"FONT_LAST"],
    "!": [[4,0],[3,2],[5,2],[4,0],"FONT_UP",[4,4],[4,12],"FONT_LAST"],
    "#": [[0,4],[8,4],[6,2],[6,10],[8,8],[0,8],[2,10],[2,2],"FONT_LAST"],
    "^": [[2,6],[4,12],[6,6],"FONT_LAST"],
    "=": [[1,4],[7,4],"FONT_UP",[1,8],[7,8],"FONT_LAST"],
    "*": [[0,0],[4,12],[8,0],[0,8],[8,8],[0,0],"FONT_LAST"],
    "_": [[0,0],[8,0],"FONT_LAST"],
    "/": [[0,0],[8,12],"FONT_LAST"],
    "\\": [[0,12],[8,0],"FONT_LAST"],
    "@": [[8,4],[4,0],[0,4],[0,8],[4,12],[8,8],[4,4],[3,6],"FONT_LAST"],
    "$": [[6,2],[2,6],[6,10],"FONT_UP",[4,12],[4,0],"FONT_LAST"],
    "&": [[8,0],[4,12],[8,8],[0,4],[4,0],[8,4],"FONT_LAST"],
    "[": [[6,0],[2,0],[2,12],[6,12],"FONT_LAST"],
    "]": [[2,0],[6,0],[6,12],[2,12],"FONT_LAST"],
    "(": [[6,0],[2,4],[2,8],[6,12],"FONT_LAST"],
    ")": [[2,0],[6,4],[6,8],[2,12],"FONT_LAST"],
    "%": [[0,0],[8,12],"FONT_UP",[2,10],[2,8],"FONT_UP",[6,4],[6,2],"FONT_LAST"],
    "<": [[6,0],[2,6],[6,12],"FONT_LAST"],
    ">": [[2,0],[6,6],[2,12],"FONT_LAST"],
    "|": [[4,0],[4,5],"FONT_UP",[4,6],[4,12],"FONT_LAST"],
    ":": [[4,9],[4,7],"FONT_UP",[4,5],[4,3],"FONT_LAST"],
    ";": [[4,9],[4,7],"FONT_UP",[4,5],[1,2],"FONT_LAST"],
    "'": [[2,6],[6,10],"FONT_LAST"],
    "?": [[0,8],[4,12],[8,8],[4,4],"FONT_UP",[4,1],[4,0],"FONT_LAST"],
    " ": ["FONT_LAST"]
  };

  function drawVectorChar(ctx, ch, x, y, size){
    var pts = VECTOR_FONT[ch];
    if (!pts) return;
    var penUp = true;
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var pt = pts[i];
      if (pt === 'FONT_LAST') break;
      if (pt === 'FONT_UP') { penUp = true; continue; }
      var sx = x + pt[0] * size;
      var sy = y - pt[1] * size; // font is y-up internally; canvas is y-down
      if (penUp) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      penUp = false;
    }
    ctx.stroke();
  }

  // y is the baseline. Glyphs are 8 units wide on a 12-unit advance.
  // opts: color, align ('left'|'center'|'right'), glow (6), lineWidth (2),
  // uiScale (1, scales glow and line width), glowScale (GLOW_SCALE),
  // alignOn ('ink' default: centre/right on the drawn strokes, dropping the
  // last glyph's 4-unit trailing gap; 'advance': the source games' behaviour).
  function drawVectorText(ctx, str, x, y, size, opts){
    opts = opts || {};
    var color = opts.color || '#fff';
    var align = opts.align || 'left';
    var ui = opts.uiScale || 1;
    var glowScale = opts.glowScale !== undefined ? opts.glowScale : GLOW_SCALE;
    str = String(str).toUpperCase();
    var charWidth = 12 * size;
    var totalWidth = opts.alignOn === 'advance' ? str.length * charWidth : inkWidth(str, size);
    var startX = x;
    if (align === 'center') startX = x - totalWidth / 2;
    else if (align === 'right') startX = x - totalWidth;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = (opts.glow !== undefined ? opts.glow : 6) * ui * glowScale;
    ctx.lineWidth = (opts.lineWidth || 2) * ui;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (var i = 0; i < str.length; i++) drawVectorChar(ctx, str[i], startX + i * charWidth, y, size);
    ctx.restore();
  }
  // Advance width (what a string occupies in a row of text) and ink width (the strokes only).
  function measureVectorText(str, size){ return String(str).length * 12 * size; }
  function inkWidth(str, size){ var n = String(str).length; return n ? n * 12 * size - 4 * size : 0; }
  // Greedy word wrap: the font is monospaced, so width is character count.
  function wrapVectorText(text, size, maxWidth){
    var maxChars = Math.max(1, Math.floor(maxWidth / (12 * size)));
    var words = String(text).split(' '), rows = [], current = '';
    for (var i = 0; i < words.length; i++) {
      var candidate = current ? current + ' ' + words[i] : words[i];
      if (candidate.length <= maxChars || !current) current = candidate;
      else { rows.push(current); current = words[i]; }
    }
    if (current) rows.push(current);
    return rows;
  }

  // ---------- Logo ----------
  var LOGO_PATHS = [
    "m 98.150911,175.37773 c 0.0161,-0.0666 0.87711,-3.13534 1.913439,-6.81936 1.47752,-5.25239 1.91772,-6.76223 2.03935,-6.9948 0.18769,-0.35887 0.53653,-0.69313 0.83109,-0.79632 0.29152,-0.10212 0.82051,-0.13368 1.16172,-0.0693 0.52041,0.0982 0.88114,0.38526 1.14519,0.91133 0.103,0.20521 0.58973,1.90719 3.26432,11.41456 l 0.68969,2.45163 -1.11691,0.0117 c -0.6143,0.006 -1.12499,0.003 -1.13486,-0.006 -0.01,-0.01 -0.25025,-0.85241 -0.53418,-1.87231 l -0.51623,-1.85436 -2.23336,-0.0114 -2.23336,-0.0114 -0.24844,0.88693 c -0.13663,0.4878 -0.37161,1.33018 -0.52217,1.87195 l -0.27374,0.98503 -1.130369,0.0117 -1.13037,0.0117 z m 7.102449,-5.86716 c -0.0453,-0.21645 -1.55763,-5.44996 -1.58194,-5.47427 -0.013,-0.013 -0.0311,-0.0155 -0.0402,-0.006 -0.009,0.0101 -0.36457,1.23969 -0.78992,2.73255 -0.42536,1.49288 -0.7837,2.74879 -0.79632,2.79092 -0.0216,0.072 0.075,0.0766 1.60531,0.0766 h 1.62825 z m 5.48662,-0.33929 v -6.32609 h -1.53227 -1.53227 v -1.09447 -1.09448 h 4.18091 4.18091 v 1.09392 1.09392 l -1.54322,0.0115 -1.54321,0.0115 -0.0111,6.31514 -0.0111,6.31514 h -1.09433 -1.09433 z m 3.94012,6.29236 c 0,-0.0194 0.85628,-3.07795 1.90284,-6.79683 1.41444,-5.02609 1.94268,-6.84222 2.05803,-7.07562 0.1864,-0.37716 0.53202,-0.71522 0.84235,-0.82394 0.29151,-0.10212 0.8205,-0.13368 1.16171,-0.0693 0.51978,0.0981 0.88119,0.38535 1.14427,0.90952 0.0632,0.12588 0.2806,0.8154 0.48316,1.53227 0.20256,0.71686 1.0603,3.7617 1.90609,6.76631 0.84578,3.00461 1.54887,5.49181 1.56241,5.52712 0.0212,0.0554 -0.13191,0.0642 -1.11747,0.0642 h -1.1421 l -0.0279,-0.11105 c -0.0153,-0.0611 -0.24919,-0.90328 -0.51969,-1.87156 l -0.49181,-1.76051 -2.2038,-0.0114 c -1.29652,-0.007 -2.22035,0.005 -2.244,0.0288 -0.0221,0.0221 -0.27038,0.8645 -0.55172,1.87197 l -0.51152,1.83177 -1.12543,0.0117 c -0.61899,0.006 -1.12544,-0.004 -1.12544,-0.0235 z m 7.12146,-5.95307 c -0.0507,-0.23967 -1.55285,-5.4455 -1.57872,-5.47137 -0.0146,-0.0146 -0.0336,-0.0184 -0.0422,-0.008 -0.009,0.01 -0.36423,1.23968 -0.79023,2.73255 -0.42598,1.49286 -0.78471,2.74878 -0.79716,2.79092 -0.0213,0.072 0.0755,0.0766 1.60561,0.0766 h 1.62825 z m 5.18125,-0.59102 c 5.7e-4,-7.10958 -0.006,-6.9028 0.23273,-7.37334 0.1327,-0.26187 0.44784,-0.56061 0.71697,-0.67966 0.38998,-0.17251 0.78179,-0.20717 2.36007,-0.20878 1.13347,-0.001 1.58406,0.0142 1.86834,0.0638 1.3008,0.22684 2.36449,1.0354 2.91793,2.21804 0.61232,1.30848 0.56384,3.26556 -0.11145,4.49818 -0.33466,0.61086 -0.74461,1.01649 -1.45098,1.43566 -0.57299,0.34003 -0.70429,0.43714 -0.80238,0.59342 -0.10796,0.17201 -0.0899,0.42137 0.0505,0.69646 0.051,0.10001 0.86048,1.33316 1.79879,2.74032 0.93831,1.40716 1.69973,2.56303 1.69205,2.56859 -0.008,0.006 -0.5853,0.001 -1.28358,-0.009 l -1.26959,-0.0196 -1.71366,-2.58875 c -0.94251,-1.42382 -1.75667,-2.67467 -1.80925,-2.77968 -0.32636,-0.65171 -0.24151,-1.52054 0.19046,-1.95048 0.12986,-0.12924 0.3318,-0.2461 0.72132,-0.41743 0.93756,-0.41235 1.44385,-0.77396 1.80857,-1.29173 0.29565,-0.41971 0.40631,-0.79266 0.40328,-1.35916 -0.006,-1.19058 -0.53134,-1.94261 -1.49937,-2.14779 -0.19654,-0.0417 -0.59126,-0.0618 -1.22202,-0.0623 -1.04417,-5.7e-4 -1.17252,0.0254 -1.32179,0.27023 -0.0875,0.14352 -0.0884,0.20377 -0.0885,6.26305 l -1.6e-4,6.11814 h -1.09448 -1.09448 l 5.7e-4,-6.57782 z m 10.55001,-0.84275 v -7.42056 h 1.09448 1.09448 v 7.42056 7.42057 h -1.09448 -1.09448 z m 3.21468,-8.02878 c -0.63804,-0.28978 -0.70191,-1.18152 -0.11352,-1.58469 0.12974,-0.0889 0.20675,-0.10549 0.48927,-0.10549 0.29487,0 0.35634,0.0145 0.50989,0.12099 0.4443,0.3079 0.52764,0.93252 0.17763,1.33116 -0.26844,0.30573 -0.70101,0.40257 -1.06327,0.23803 z m 0.59852,-0.0552 c 0.39237,-0.13309 0.58548,-0.42079 0.55601,-0.82834 -0.0394,-0.54536 -0.57629,-0.8819 -1.07463,-0.67368 -0.31592,0.132 -0.49271,0.4026 -0.49271,0.75415 0,0.35533 0.21402,0.6234 0.61291,0.76767 0.10993,0.0398 0.24216,0.0332 0.39842,-0.0198 z m -0.57354,-0.75945 v -0.54723 h 0.25431 c 0.3216,0 0.41989,0.0667 0.41989,0.28507 0,0.11905 -0.028,0.1867 -0.10229,0.24682 -0.0925,0.0749 -0.0959,0.09 -0.0359,0.15853 0.0664,0.0757 0.20825,0.33462 0.20825,0.37999 0,0.0132 -0.0294,0.0241 -0.0653,0.0241 -0.0359,0 -0.12644,-0.10835 -0.20118,-0.24078 -0.0903,-0.16002 -0.16386,-0.24079 -0.21927,-0.24079 -0.0719,0 -0.0834,0.0332 -0.0834,0.24079 0,0.21159 -0.0106,0.24078 -0.0876,0.24078 -0.0829,0 -0.0875,-0.0292 -0.0875,-0.54724 z m 0.45655,-0.0907 c 0.15376,-0.15375 0.0424,-0.36899 -0.191,-0.36899 -0.0793,0 -0.0904,0.0269 -0.0904,0.21889 0,0.20259 0.008,0.2189 0.10632,0.2189 0.0585,0 0.13727,-0.0309 0.17511,-0.0688 z M 98.700721,155.1445 v -2.49092 l 0.29551,-0.0502 c 0.92506,-0.15724 2.302759,-0.56957 3.237019,-0.96878 2.9739,-1.27077 5.61456,-3.61997 7.81705,-6.95428 0.59811,-0.90546 1.19701,-2.27502 1.63106,-3.72992 1.07647,-3.60821 1.68337,-8.84555 1.68493,-14.54043 l 4.5e-4,-1.60888 h 1.25488 1.25489 l -0.029,3.81973 c -0.0636,8.37432 -0.29192,11.88615 -0.96953,14.91204 -0.57113,2.55038 -1.70301,4.9927 -3.15763,6.81336 -0.48272,0.60419 -1.89158,2.01971 -2.55641,2.56847 -2.59295,2.14031 -5.46102,3.63964 -8.34906,4.36463 -0.6404,0.16076 -1.738319,0.35613 -2.001339,0.35613 h -0.11281 z m 18.168349,-13.92626 v -16.41715 h 2.38596 2.38596 v 16.41718 16.41718 h -2.38596 -2.38596 z m 22.19602,16.34527 c -4.57629,-0.69678 -9.82575,-3.89642 -12.67601,-7.72625 -1.20937,-1.62501 -2.25666,-4.0189 -2.77474,-6.34251 -0.6868,-3.08034 -0.96396,-7.68775 -0.96584,-16.056 l -5.7e-4,-2.63769 h 1.24771 1.24771 v 1.78462 c 0,8.1359 1.21445,14.84359 3.26522,18.03452 1.18712,1.84712 2.80938,3.66835 4.40712,4.94766 1.90651,1.52656 4.33834,2.62838 6.69816,3.03483 l 0.29551,0.0509 v 2.49092 2.49092 l -0.16417,-0.005 c -0.0903,-0.002 -0.35133,-0.0328 -0.58008,-0.0676 z",
    "m 93.572536,191.32601 -1.326956,1.32696 h -2.653913 l -1.326956,-1.32696 v -2.65391 l 1.326956,-1.32696 h 2.653913 l 1.326956,1.32696 v 0.44232 h -1.769275 v -0.88464 h -1.769275 v 3.53855 h 1.769275 v -0.88464 h 1.769275 z m 7.077104,1.32696 h -5.307829 v -5.30783 h 1.769275 v 4.42319 h 3.538554 z m 7.0771,0 h -1.76928 v -0.88464 h -1.76927 v 0.88464 h -1.76928 v -3.09623 l 2.21159,-2.2116 h 0.88464 l 2.2116,2.2116 z m -1.76928,-1.76928 v -1.76927 h -1.76927 v 1.76927 z m 8.84638,0.44232 -1.32696,1.32696 h -3.09623 v -0.88464 h 2.65391 v -1.76927 h -2.21159 l -1.32696,-1.32696 1.32696,-1.32696 h 3.09623 v 0.88464 h -2.65391 v 0.88464 h 2.21159 l 1.32696,1.32696 z m 7.0771,0 -1.32696,1.32696 h -3.09623 v -0.88464 h 2.65391 v -1.76927 h -2.21159 l -1.32696,-1.32696 1.32696,-1.32696 h 3.09623 v 0.88464 h -2.65391 v 0.88464 h 2.21159 l 1.32696,1.32696 z m 7.07709,1.32696 h -5.30782 v -0.88464 h 1.76927 v -3.53855 h -1.76927 v -0.88464 h 5.30782 v 0.88464 h -1.76927 v 3.53855 h 1.76927 z m 7.07711,-1.32696 -1.32696,1.32696 h -2.65391 l -1.32696,-1.32696 v -2.65391 l 1.32696,-1.32696 h 2.65391 l 1.32696,1.32696 v 0.44232 h -1.76928 v -0.88464 h -1.76927 v 3.53855 h 1.76927 v -0.88464 h 1.76928 z m 7.0771,0 -1.32696,1.32696 h -3.09623 v -0.88464 h 2.65391 v -1.76927 h -2.21159 l -1.32696,-1.32696 1.32696,-1.32696 h 3.09623 v 0.88464 h -2.65391 v 0.88464 h 2.21159 l 1.32696,1.32696 z",
    "m 153.96671,190.76919 h -3.08045 v 3.08045 h -3.08045 v -3.08045 h -3.08045 v -1.54023 h 3.08045 v -3.08045 h 3.08045 v 3.08045 h 3.08045 z"
  ];
  var LOGO_OFFSET_X = -88.264707, LOGO_OFFSET_Y = -124.80106;
  var LOGO_SRC_WIDTH = 65.702026, LOGO_SRC_HEIGHT = 69.048576;
  var logoPath2D = null;
  function drawLogo(ctx, cx, cy, targetWidth, opts){
    opts = opts || {};
    if (!logoPath2D) logoPath2D = LOGO_PATHS.map(function(d){ return new Path2D(d); });
    var scale = targetWidth / LOGO_SRC_WIDTH;
    var targetHeight = LOGO_SRC_HEIGHT * scale;
    var color = opts.color || '#fff';
    ctx.save();
    ctx.globalAlpha = opts.alpha === undefined ? 1 : opts.alpha;
    ctx.translate(cx - targetWidth / 2, cy - targetHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(LOGO_OFFSET_X, LOGO_OFFSET_Y);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = (opts.glow !== undefined ? opts.glow : 5) * GLOW_SCALE / scale;
    for (var i = 0; i < logoPath2D.length; i++) ctx.fill(logoPath2D[i]);
    ctx.restore();
  }
  function logoSvg(fill){
    fill = fill || COLORS.ink;
    var labels = ['', ' aria-label="CLASSICS"', ' aria-label="+"'];
    return '<svg viewBox="0 0 65.702026 69.048576" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Atari Classics+">' +
      '<g transform="translate(-88.264707,-124.80106)">' +
      LOGO_PATHS.map(function(d, i){ return '<path fill="' + fill + '" d="' + d + '"' + labels[i] + '/>'; }).join('') +
      '</g></svg>';
  }

  // ---------- IntroScreen ----------
  // The boot card every Classic Plus game opens on: logo over the 36px grid,
  // a dim vector-font hint, dismissed by tap, key, or after 2.6s.
  function drawHintCanvas(canvas, text, size){
    size = size || 0.75;
    var dpr = window.devicePixelRatio || 1;
    var padX = 6, padY = 6;
    var cssWidth = Math.ceil(measureVectorText(text, size) + padX * 2);
    var cssHeight = Math.ceil(12 * size + padY * 2);
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawVectorText(ctx, text, cssWidth / 2, cssHeight - padY, size, { color: COLORS.ink, align: 'center', lineWidth: 1.3, glow: 0 });
  }
  function mountIntro(container, opts){
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'cp-intro' + (opts.inline ? ' cp-intro--inline' : '');
    el.innerHTML = logoSvg();
    var hint = document.createElement('canvas');
    hint.className = 'cp-intro-hint';
    el.appendChild(hint);
    container.appendChild(el);
    drawHintCanvas(hint, opts.hint || 'TAP OR PRESS ANY KEY');
    var dismissed = false;
    function dismiss(){
      if (dismissed) return;
      dismissed = true;
      el.style.pointerEvents = 'none';
      // The game gets input back at once; the fade is only the card leaving. Reduced motion skips it.
      if (opts.onDismiss) opts.onDismiss();
      if (motion.reduced) { el.className += ' cp-intro--still'; el.style.display = 'none'; return; }
      el.style.opacity = '0';
      setTimeout(function(){ el.style.display = 'none'; }, 500);
    }
    el.addEventListener('click', dismiss);
    el.addEventListener('touchstart', dismiss, { passive: true });
    if (!opts.inline) window.addEventListener('keydown', dismiss, { once: true });
    var auto = opts.autoDismissMs === undefined ? 2600 : opts.autoDismissMs;
    if (auto > 0) setTimeout(dismiss, auto);
    return { el: el, dismiss: dismiss };
  }

  // ---------- ScopeGrid ----------
  // Faint oscilloscope graticule behind everything, drifting a little
  // opposite the player so it eases rather than snaps.
  function createScopeGrid(opts){
    opts = opts || {};
    var g = {
      spacing: opts.spacing || 80,
      color: opts.color || COLORS.grid,
      centerColor: opts.centerColor || null,
      parallaxMax: opts.parallaxMax !== undefined ? opts.parallaxMax : 24,
      ease: opts.ease !== undefined ? opts.ease : 0.05,
      ox: 0, oy: 0
    };
    g.draw = function(ctx, W, H, focusX, focusY){
      // Reduced motion: the grid holds still.
      var still = focusX === undefined || motion.reduced;
      var tx = still ? 0 : ((focusX - W / 2) / (W / 2)) * g.parallaxMax;
      var ty = still || focusY === undefined ? 0 : ((focusY - H / 2) / (H / 2)) * g.parallaxMax;
      g.ox += (tx - g.ox) * g.ease;
      g.oy += (ty - g.oy) * g.ease;
      ctx.save();
      ctx.translate(g.ox, g.oy);
      ctx.lineWidth = 1;
      ctx.strokeStyle = g.color;
      ctx.beginPath();
      for (var x = g.spacing; x < W; x += g.spacing) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
      for (var y = g.spacing; y < H; y += g.spacing) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
      ctx.stroke();
      if (g.centerColor) {
        ctx.strokeStyle = g.centerColor;
        ctx.beginPath();
        ctx.moveTo(W / 2 + 0.5, 0); ctx.lineTo(W / 2 + 0.5, H);
        ctx.moveTo(0, H / 2 + 0.5); ctx.lineTo(W, H / 2 + 0.5);
        ctx.stroke();
      }
      ctx.restore();
    };
    return g;
  }
  function drawVignette(ctx, W, H){
    var v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(0.7, 'rgba(0,0,0,0.55)');
    v.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  // Every playfield gets the same edge: the cabinet's 2px `frame`, drawn just inside the rect.
  // Pass x, y to frame a playfield that doesn't start at the canvas corner (a column game's field).
  function drawPlayAreaBoundary(ctx, W, H, x, y){
    x = x || 0; y = y || 0;
    ctx.save();
    ctx.strokeStyle = COLORS.frame;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, W - 2, H - 2);
    ctx.restore();
  }

  // ---------- ProgressSky ----------
  // The ground colour reports progress. Breakout warms from night to day as
  // the wall comes down; Asteroids steps hue every three waves.
  var SUNRISE = [
    { t: 0.00, color: [31, 26, 15] },    // night: the space ground's sister, warm at the same brightness
    { t: 0.30, color: [24, 26, 48] },    // deep indigo
    { t: 0.55, color: [64, 38, 74] },    // purple dawn
    { t: 1.00, color: [37, 56, 67] }     // deep morning blue: dark so bricks keep 3:1
  ];
  function skyAt(progress, stops){
    stops = stops || SUNRISE;
    progress = clamp(progress, 0, 1);
    for (var i = 0; i < stops.length - 1; i++) {
      var a = stops[i], b = stops[i + 1];
      if (progress >= a.t && progress <= b.t) {
        var k = (progress - a.t) / (b.t - a.t);
        return 'rgb(' + Math.round(lerp(a.color[0], b.color[0], k)) + ',' + Math.round(lerp(a.color[1], b.color[1], k)) + ',' + Math.round(lerp(a.color[2], b.color[2], k)) + ')';
      }
    }
    var last = stops[stops.length - 1].color;
    return 'rgb(' + last[0] + ',' + last[1] + ',' + last[2] + ')';
  }
  function createSunriseSky(opts){
    opts = opts || {};
    var s = { progress: 0, ease: opts.ease || 0.015, stops: opts.stops || SUNRISE };
    s.update = function(target){ s.progress += (target - s.progress) * s.ease; return s; };
    s.color = function(){ return skyAt(s.progress, s.stops); };
    // The DOM vignette fades out as day breaks.
    s.vignetteOpacity = function(){ return clamp(1 - s.progress, 0, 1); };
    return s;
  }
  function createHueSky(opts){
    opts = opts || {};
    var s = { start: opts.start || 220, step: opts.step || 60, every: opts.every || 3,
      saturation: opts.saturation || 36, lightness: opts.lightness || 12, ease: opts.ease || 0.02 };
    s.hue = s.start;
    s.target = function(level){ return (s.start + Math.floor((level - 1) / s.every) * s.step) % 360; };
    s.update = function(level){
      var diff = ((s.target(level) - s.hue + 540) % 360) - 180;
      s.hue = (s.hue + diff * s.ease + 360) % 360;
      return s;
    };
    s.color = function(){ return 'hsl(' + s.hue.toFixed(1) + ',' + s.saturation + '%,' + s.lightness + '%)'; };
    return s;
  }

  // ---------- PixelBurst ----------
  // Hard-edged square chips, snapped to whole pixels. No blur on the chip
  // itself; Asteroids dust adds a faint glow, Breakout crumbs none.
  var BURST_PRESETS = {
    crumble: { count: 44, size: 2, jitter: 0.6, friction: 0.90, gravity: 0.05, minDrift: 0.15,
      weightMin: 0.5, weightMax: 2.2, swayAmpMin: 0.3, swayAmpMax: 0.7, swaySpeedMin: 0.0015, swaySpeedMax: 0.0035,
      lifetimeMs: 9000, baseAlpha: 0.55, glow: 0 },
    debris: { count: 16, speedMin: 1, speedMax: 4.5, lifeMin: 360, lifeMax: 700, sizeMin: 1, sizeMax: 3,
      friction: 0.96, gravity: 0, color: COLORS.dust, glow: 4, max: 500 }
  };
  // Debris chips are gameplay matter (dust): they never fade below this, so they keep 3:1 on every space ground.
  var BURST_DEBRIS_MIN_ALPHA = 0.75;
  function createPixelBurst(preset, overrides){
    var p = {}, base = BURST_PRESETS[preset] || BURST_PRESETS.crumble, k;
    for (k in base) p[k] = base[k];
    if (overrides) for (k in overrides) p[k] = overrides[k];
    var sys = { kind: BURST_PRESETS[preset] ? preset : 'crumble', opts: p, list: [] };
    // gravity (debris only): px per frame added to vy, per burst; defaults to the preset's.
    sys.burst = function(x, y, w, h, color, count, gravity){
      var now = performance.now(), n = count || p.count, g = gravity === undefined ? (p.gravity || 0) : gravity;
      for (var i = 0; i < n; i++) {
        if (sys.kind === 'debris') {
          var a = rand(0, TWO_PI), sp = rand(p.speedMin, p.speedMax), life = rand(p.lifeMin, p.lifeMax);
          sys.list.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: life, maxLife: life, size: rand(p.sizeMin, p.sizeMax), color: color || p.color, g: g });
        } else {
          var weight = rand(p.weightMin, p.weightMax);
          sys.list.push({ x: x + Math.random() * (w || 0), y: y + Math.random() * (h || 0),
            vx: (Math.random() - 0.5) * p.jitter, vy: (Math.random() - 0.5) * p.jitter,
            startTime: now, color: color || COLORS.ink, weight: weight,
            swayPhase: rand(0, TWO_PI), swayAmp: rand(p.swayAmpMin, p.swayAmpMax) / weight, swaySpeed: rand(p.swaySpeedMin, p.swaySpeedMax) });
        }
      }
      if (p.max && sys.list.length > p.max) sys.list.splice(0, sys.list.length - p.max);
    };
    sys.update = function(now, H){
      now = now || performance.now();
      if (sys.kind === 'debris') {
        for (var i = sys.list.length - 1; i >= 0; i--) {
          var d = sys.list[i];
          d.vx *= p.friction; d.vy = d.vy * p.friction + d.g; d.x += d.vx; d.y += d.vy; d.life--;
          if (d.life <= 0) sys.list.splice(i, 1);
        }
        return;
      }
      sys.list = sys.list.filter(function(c){ return now - c.startTime < p.lifetimeMs && (H === undefined || c.y < H + p.size * 2); });
      for (var j = 0; j < sys.list.length; j++) {
        var c = sys.list[j];
        c.vx *= p.friction; c.vy *= p.friction; c.vy += p.gravity * c.weight;
        var speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
        if (speed > 0.0001 && speed < p.minDrift) { c.vx *= p.minDrift / speed; c.vy *= p.minDrift / speed; }
        c.x += c.vx; c.y += c.vy;
        c.x += Math.sin(now * c.swaySpeed + c.swayPhase) * c.swayAmp;
      }
    };
    sys.draw = function(ctx, now, H){
      now = now || performance.now();
      ctx.save();
      if (sys.kind === 'debris') {
        ctx.shadowColor = 'rgba(165,120,255,0.8)';
        ctx.shadowBlur = p.glow * GLOW_SCALE;
        for (var i = 0; i < sys.list.length; i++) {
          var d = sys.list[i], t = d.life / d.maxLife;
          var size = Math.max(1, Math.round(d.size * (0.5 + t * 0.5)));
          ctx.globalAlpha = BURST_DEBRIS_MIN_ALPHA + t * (1 - BURST_DEBRIS_MIN_ALPHA);
          ctx.fillStyle = d.color;
          ctx.fillRect(Math.round(d.x - size / 2), Math.round(d.y - size / 2), size, size);
        }
      } else {
        for (var j = 0; j < sys.list.length; j++) {
          var c = sys.list[j], tt = (now - c.startTime) / p.lifetimeMs;
          var fallFade = H === undefined ? 1 : Math.min(1, (H + p.size * 2 - c.y) / 40);
          var timeFade = tt < 0.85 ? 1 : Math.max(0, 1 - (tt - 0.85) / 0.15);
          ctx.globalAlpha = Math.min(fallFade, timeFade) * p.baseAlpha;
          ctx.fillStyle = c.color;
          ctx.fillRect(c.x - p.size / 2, c.y - p.size / 2, p.size, p.size);
        }
      }
      ctx.restore();
    };
    return sys;
  }

  // ---------- GhostTrail ----------
  // Hard-edged phosphor remnants behind a moving rect, spaced by velocity.
  var GHOST = { count: 5, step: 1.3, alphas: [0.32, 0.23, 0.15, 0.09, 0.05], minSpeed: 0.4, smoothing: 0.85 };
  function smoothVelocity(prev, v){ return prev * GHOST.smoothing + v * (1 - GHOST.smoothing); }
  function drawGhosts(ctx, x, y, w, h, vx, vy, color){
    if (Math.abs(vx) < GHOST.minSpeed && Math.abs(vy) < GHOST.minSpeed) return;
    ctx.save();
    if (color) ctx.fillStyle = color;
    for (var i = 0; i < GHOST.count; i++) {
      var d = (i + 1) * GHOST.step;
      ctx.globalAlpha = GHOST.alphas[i];
      ctx.fillRect(x - vx * d, y - vy * d, w, h);
    }
    ctx.restore();
  }

  // ---------- VectorShapes ----------
  function strokeGlow(ctx, color, blur, lineWidth){
    ctx.strokeStyle = color; ctx.shadowColor = color;
    ctx.shadowBlur = blur * GLOW_SCALE; ctx.lineWidth = lineWidth || 2;
  }
  function shipPath(ctx, r){
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(-r * 0.7, r * 0.6);
    ctx.lineTo(-r * 0.4, 0);
    ctx.lineTo(-r * 0.7, -r * 0.6);
    ctx.closePath();
  }
  // angle 0 points right; -PI/2 points up (the spawn heading).
  function drawShip(ctx, x, y, angle, opts){
    opts = opts || {};
    var r = opts.r || 14, scale = opts.scale || 1;
    ctx.save();
    ctx.globalAlpha = opts.alpha === undefined ? 1 : opts.alpha;
    ctx.translate(x, y);
    if (opts.shield) {
      var pulse = 0.7 + 0.3 * Math.sin((opts.now || Date.now()) / 120);
      ctx.save();
      ctx.strokeStyle = 'rgba(150,235,255,' + pulse + ')';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(150,235,255,1)';
      ctx.shadowBlur = 10 * GLOW_SCALE;
      ctx.beginPath(); ctx.arc(0, 0, r * 3.4, 0, TWO_PI); ctx.stroke();
      ctx.restore();
    }
    ctx.rotate(angle === undefined ? -Math.PI / 2 : angle);
    ctx.scale(scale, scale);
    strokeGlow(ctx, opts.color || '#fff', 8, 2 / scale);
    shipPath(ctx, r);
    ctx.stroke();
    ctx.restore();
  }
  var ASTEROID_RADIUS = { large: 45, medium: 25, small: 13 };
  function makeAsteroid(size, x, y){
    var verts = [], n = Math.floor(rand(8, 13));
    for (var i = 0; i < n; i++) verts.push(rand(0.75, 1.25));
    return { x: x || 0, y: y || 0, r: ASTEROID_RADIUS[size] || 45, size: size, angle: rand(0, TWO_PI), spin: rand(-0.02, 0.02), verts: verts };
  }
  function drawAsteroid(ctx, a, alpha){
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    strokeGlow(ctx, '#fff', 6, 2);
    ctx.beginPath();
    for (var i = 0, n = a.verts.length; i < n; i++) {
      var ang = (i / n) * TWO_PI, rr = a.r * a.verts[i];
      if (i === 0) ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr); else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
  var SAUCER_PATHS = [
    "m 76.199996,110.06667 h 8.466667 l 4.233334,-1.95834 -4.233333,-2.27499 h -8.466666 l -4.233333,2.27499 z",
    "m 76.199996,105.83333 2.116667,-1.73601 h 4.233333 l 2.116667,1.73601 z",
    "m 77.196126,110.09995 0.539615,1.80789 h 5.395177 l 0.539615,-1.80789 z"
  ];
  var STATION = {
    cx: 115.7317, cy: 127.3619, width: 41.6259,
    rects: [{ x: 105.3252, y: 106.54888, w: 20.81296, h: 41.625919 }, { x: 94.918701, y: 116.95538, w: 41.62592, h: 20.81296 }],
    arrows: [
      "m 97.452968,122.15861 5.203252,5.20323 -5.203252,5.20324 z",
      "m 120.93491,109.08317 -5.20322,5.20323 -5.20325,-5.20323 z",
      "m 134.01035,132.56508 -5.20323,-5.20322 5.20323,-5.20325 z",
      "m 110.52844,145.64052 5.20322,-5.20322 5.20325,5.20322 z"
    ],
    engines: [
      "m 100.88394,138.53033 -2.358222,3.51413 2.523342,2.52334 3.51413,-2.35822 z",
      "m 100.88394,116.19339 -2.358222,-3.51413 2.523342,-2.52334 3.51413,2.35822 z",
      "m 130.57938,138.53033 2.35825,3.51413 -2.52334,2.52334 -3.51416,-2.35822 z",
      "m 130.57938,116.19339 2.35825,-3.51413 -2.52334,-2.52334 -3.51416,2.35822 z"
    ]
  };
  var p2dCache = {};
  function p2d(d){ return p2dCache[d] || (p2dCache[d] = new Path2D(d)); }
  function drawSaucer(ctx, x, y, r){
    r = r || 32;
    var scale = (r * 2) / 16.93;
    ctx.save();
    ctx.translate(x, y); ctx.scale(scale, scale); ctx.translate(-80.43, -108.0);
    ctx.strokeStyle = COLORS.hostile; ctx.shadowColor = COLORS.hostile;
    ctx.lineWidth = 2 / scale; ctx.shadowBlur = 6 * GLOW_SCALE / scale;
    for (var i = 0; i < SAUCER_PATHS.length; i++) ctx.stroke(p2d(SAUCER_PATHS[i]));
    ctx.restore();
  }
  function drawStation(ctx, x, y, width, angle, color, alpha){
    color = color || COLORS.station;
    var scale = width / STATION.width;
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.translate(x, y); ctx.rotate(angle || 0); ctx.scale(scale, scale); ctx.translate(-STATION.cx, -STATION.cy);
    ctx.strokeStyle = color; ctx.shadowColor = color; ctx.lineWidth = 2 / scale; ctx.shadowBlur = 6 * GLOW_SCALE / scale;
    STATION.rects.forEach(function(r){ ctx.strokeRect(r.x, r.y, r.w, r.h); });
    STATION.arrows.concat(STATION.engines).forEach(function(d){ ctx.stroke(p2d(d)); });
    ctx.restore();
  }
  // Currency pickup: a chunky 9px yellow square, distinct from dust.
  function drawPickup(ctx, x, y, size){
    size = size || 9;
    ctx.save();
    ctx.fillStyle = COLORS.coin; ctx.shadowColor = COLORS.coin; ctx.shadowBlur = 8 * GLOW_SCALE;
    ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    ctx.restore();
  }
  function drawBullet(ctx, x, y, color){
    ctx.save();
    color = color || '#fff';
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 6 * GLOW_SCALE;
    ctx.beginPath(); ctx.arc(x, y, 2, 0, TWO_PI); ctx.fill();
    ctx.restore();
  }
  function drawDrone(ctx, x, y){
    ctx.save(); ctx.translate(x, y);
    strokeGlow(ctx, COLORS.signal, 6, 2);
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, TWO_PI); ctx.stroke();
    ctx.restore();
  }
  function drawMissile(ctx, x, y, angle){
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle || 0);
    strokeGlow(ctx, COLORS.missile, 6, 2);
    ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, 3.5); ctx.lineTo(-5, -3.5); ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  // ---------- BrickWall ----------
  var BRICKS = {
    R: { type: 'color', color: COLORS.brickRed, points: 7 },
    O: { type: 'color', color: COLORS.brickOrange, points: 5 },
    G: { type: 'color', color: COLORS.brickGreen, points: 3 },
    Y: { type: 'color', color: COLORS.brickYellow, points: 1 },
    H: { type: 'hard', color: COLORS.brickHard, points: 5, hp: 2 },
    X: { type: 'indestructible', color: COLORS.brickSteel, points: 0 }
  };
  var WALL = { cols: 8, brickH: 16, gap: 3, rowGap: 4, top: 70, side: 20 };
  // Level text: one row per line, '.' empty, R/O/G/Y colour, H hard, X steel.
  function parseWall(text, W, layout){
    layout = layout || WALL;
    var brickW = (W - 2 * layout.side - (layout.cols - 1) * layout.gap) / layout.cols;
    var rows = String(text).trim().split('\n'), bricks = [];
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        var def = BRICKS[rows[r][c]];
        if (!def) continue;
        bricks.push({ x: layout.side + c * (brickW + layout.gap), y: layout.top + r * (layout.brickH + layout.rowGap),
          w: brickW, h: layout.brickH, row: r, col: c, type: def.type, color: def.color, points: def.points,
          hp: def.hp, maxHp: def.hp, hit: false, special: false });
      }
    }
    return bricks;
  }
  function drawBrick(ctx, b){
    if (b.hit) return;
    ctx.fillStyle = b.type === 'hard' && b.hp < b.maxHp ? COLORS.brickCracked : b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    drawBrickMarks(ctx, b);
    if (b.special) {
      var mw = b.w * 0.38, mh = b.h * 0.5;
      ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x + b.w / 2 - mw / 2, b.y + b.h / 2 - mh / 2, mw, mh);
      ctx.restore();
    }
  }
  // The points ladder is never told by colour alone: dark notches cut into the top edge, one per
  // step (Y 1pt = 1, G 3pt = 2, O 5pt = 3, R 7pt = 4). Hard bricks add an inner frame, and a crack
  // once hit; steel has no notches and is hatched. Marks are BRICK_MARK, at least 3:1 on every brick.
  // Pass x, y, w, h to mark a brick drawn somewhere else (a falling brick).
  var BRICK_MARK = 'rgba(0,0,0,0.62)';
  function brickTier(points){ return points >= 7 ? 4 : points >= 5 ? 3 : points >= 3 ? 2 : points >= 1 ? 1 : 0; }
  function drawBrickMarks(ctx, b, x, y, w, h){
    x = x === undefined ? b.x : x; y = y === undefined ? b.y : y; w = w || b.w; h = h || b.h;
    ctx.save();
    ctx.fillStyle = BRICK_MARK; ctx.strokeStyle = BRICK_MARK;
    if (b.type === 'indestructible') {
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.lineWidth = 2; ctx.beginPath();
      for (var k = -h; k < w; k += 9) { ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + h, y); }
      ctx.stroke(); ctx.restore();
      return;
    }
    var tier = brickTier(b.points);
    for (var i = 0; i < tier; i++) ctx.fillRect(Math.round(x + w * (i + 1) / (tier + 1) - 1.5), y, 3, 5);
    if (b.type === 'hard') {
      ctx.lineWidth = 1.5; ctx.strokeRect(x + 2.75, y + 6.75, w - 5.5, h - 9.5);
      if (b.hp < b.maxHp) {
        ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(x + w * 0.30, y + 6); ctx.lineTo(x + w * 0.42, y + h * 0.62);
        ctx.lineTo(x + w * 0.55, y + h * 0.5); ctx.lineTo(x + w * 0.68, y + h);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawPaddle(ctx, x, y, w, h){ ctx.fillStyle = COLORS.ink; ctx.fillRect(x, y, w || 70, h || 20); }
  function drawBall(ctx, x, y, color, size){ ctx.fillStyle = color || COLORS.ink; ctx.fillRect(x, y, size || 14, size || 14); }
  function drawCatchMeter(ctx, W, y, filled, layout){
    layout = layout || WALL;
    var brickW = (W - 2 * layout.side - (layout.cols - 1) * layout.gap) / layout.cols;
    ctx.save();
    for (var col = 0; col < layout.cols; col++) {
      var x = layout.side + col * (brickW + layout.gap);
      // Filled slots are ink-muted (4.5:1 on every sky step), empty ones a ghost outline: told by fill and brightness.
      if (col < filled) { ctx.fillStyle = COLORS.inkMuted; ctx.fillRect(x, y, brickW, layout.brickH); }
      else { ctx.strokeStyle = COLORS.inkGhost; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, brickW - 1, layout.brickH - 1); }
    }
    ctx.restore();
  }

  // ---------- Hud ----------
  function drawLifeIcons(ctx, x, y, count, opts){
    opts = opts || {};
    var ui = opts.uiScale || 1;
    if (opts.kind === 'paddle') {
      var w = 18, h = 7, gap = 6, max = opts.max || count;
      ctx.save();
      for (var i = 0; i < max; i++) {
        var lx = x + i * (w + gap), ly = y - h;
        if (i < count) { ctx.fillStyle = COLORS.ink; ctx.fillRect(lx, ly, w, h); }
        else { ctx.strokeStyle = COLORS.inkFaint; ctx.lineWidth = 1; ctx.strokeRect(lx + 0.5, ly + 0.5, w - 1, h - 1); }
      }
      ctx.restore();
      return;
    }
    var size = 9 * ui, spacing = 22 * ui;
    for (var j = 0; j < count; j++) {
      ctx.save();
      ctx.translate(x + size + j * spacing, y);
      ctx.rotate(-Math.PI / 2);
      ctx.strokeStyle = '#fff'; ctx.shadowColor = '#fff';
      ctx.shadowBlur = 6 * ui * GLOW_SCALE; ctx.lineWidth = 2 * ui;
      shipPath(ctx, size); ctx.stroke();
      ctx.restore();
    }
  }
  // Currency: amount padded to three digits, right-aligned before a stroked square.
  function drawCurrency(ctx, rightX, baselineY, amount, ui){
    ui = ui || 1;
    var iconSize = 15 * ui, iconX = rightX - iconSize, iconY = baselineY - iconSize;
    ctx.save();
    ctx.strokeStyle = COLORS.coin; ctx.shadowColor = COLORS.coin;
    ctx.shadowBlur = 6 * ui * GLOW_SCALE; ctx.lineWidth = 2 * ui;
    ctx.strokeRect(iconX + 0.5, iconY + 0.5, iconSize, iconSize);
    ctx.restore();
    drawVectorText(ctx, String(amount).padStart(3, '0'), iconX - 10 * ui, baselineY, 1.1 * ui, { align: 'right', color: COLORS.coin, glow: 6, uiScale: ui });
  }
  // Two layouts. "spend" (Asteroids, has currency): SCORE: top-left, lives
  // under it, WAVE centred, currency top-right. "chase" (Breakout): lives
  // top-left, combo centred, bare score top-right.
  function drawHud(ctx, W, s){
    s = s || {};
    var ui = s.uiScale || 1;
    if (s.currency !== undefined) {
      drawVectorText(ctx, 'SCORE:' + (s.score || 0), 20 * ui, 34 * ui, 1.3 * ui, { glow: 6, uiScale: ui });
      if (s.wave !== undefined) drawVectorText(ctx, 'WAVE ' + String(s.wave).padStart(2, '0'), W / 2, 34 * ui, 1.1 * ui, { align: 'center', glow: 6, uiScale: ui });
      drawLifeIcons(ctx, 24 * ui, 66 * ui, s.lives === undefined ? 3 : s.lives, { kind: 'ship', uiScale: ui });
      drawCurrency(ctx, s.right !== undefined ? s.right : W - 20 * ui, 34 * ui, s.currency, ui);
      var y = 96 * ui;
      if (s.meter) { drawVectorText(ctx, s.meter, 20 * ui, y, 0.8 * ui, { color: COLORS.dust, glow: 6, uiScale: ui }); y += 20 * ui; }
      if (s.buff) { drawVectorText(ctx, s.buff, 20 * ui, y, 0.85 * ui, { color: COLORS.dust, glow: 8, uiScale: ui }); y += 20 * ui; }
      if (s.next) drawVectorText(ctx, s.next, 20 * ui, y, 0.75 * ui, { color: COLORS.dust, glow: 3, uiScale: ui });
      return;
    }
    drawLifeIcons(ctx, 16, 44, s.lives === undefined ? 3 : s.lives, { kind: 'paddle', max: s.maxLives || 3 });
    drawVectorText(ctx, String(s.score || 0), s.right !== undefined ? s.right : W - 16, 44, 1.3, { color: COLORS.ink, align: 'right', glow: 1, lineWidth: 2, glowScale: 1 });
    if (s.combo >= 2) drawVectorText(ctx, s.combo + 'X', W / 2, 44, 1.3, { color: COLORS.ink, align: 'center', glow: 2, glowScale: 1 });
  }

  // Third layout, "labelled" (Code Breaker): a row of stats, each a small dim
  // label over a big value. stats: [{ label, value, x, align, color, alpha }].
  function drawStatHud(ctx, stats, opts){
    opts = opts || {};
    var labelY = opts.labelY || 20, valueY = opts.valueY || 44;
    for (var i = 0; i < stats.length; i++) {
      var st = stats[i], al = st.align || 'left';
      drawVectorText(ctx, st.label, st.x, labelY, 0.75, { align: al, color: COLORS.inkMuted, lineWidth: 1.2, glow: 0 });
      ctx.save();
      if (st.alpha !== undefined) ctx.globalAlpha *= st.alpha;
      drawVectorText(ctx, st.value, st.x, valueY, 1.25, { align: al, color: st.color || COLORS.ink, lineWidth: 2 });
      ctx.restore();
    }
  }

  // ---------- Searchlight ----------
  // Ambient light: every 10-26s a soft patch of light sweeps across the field,
  // as if a spotlight shone through a window. Additive, peaking at 7.5% alpha.
  // The one gradient besides the vignette and the warp streaks.
  function createSearchlight(opts){
    opts = opts || {};
    var sl = { peak: opts.peak || 0.075, light: null, next: null, rgb: opts.rgb || '235,240,255' };
    sl.draw = function(ctx, W, H, t){
      if (motion.reduced) return;   // reduced motion: no sweeping light
      if (sl.next === null) sl.next = t + 6 + Math.random() * 8;
      if (!sl.light && t >= sl.next) {
        sl.light = { t0: t, dur: 6 + Math.random() * 2.5, dir: Math.random() < 0.5 ? -1 : 1,
          y: 0.25 + Math.random() * 0.4, rot: (35 + Math.random() * 15) * Math.PI / 180 * (Math.random() < 0.5 ? -1 : 1) };
      }
      var L = sl.light; if (!L) return;
      var u = (t - L.t0) / L.dur;
      if (u >= 1) { sl.light = null; sl.next = t + 10 + Math.random() * 16; return; }
      var env = Math.sin(Math.PI * u), a = sl.peak * env * env;
      var ww = Math.max(W, H) * 1.2, wh = ww * 1.25, travel = W + ww * 1.6;
      var cx = L.dir > 0 ? -ww * 0.8 + travel * u : W + ww * 0.8 - travel * u;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(cx, H * L.y); ctx.rotate(L.rot); ctx.scale(1, wh / ww);
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, ww / 2);
      g.addColorStop(0, 'rgba(' + sl.rgb + ',' + a.toFixed(3) + ')');
      g.addColorStop(0.35, 'rgba(' + sl.rgb + ',' + (a * 0.75).toFixed(3) + ')');
      g.addColorStop(0.7, 'rgba(' + sl.rgb + ',' + (a * 0.3).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + sl.rgb + ',0)');
      ctx.fillStyle = g; ctx.fillRect(-ww / 2, -ww / 2, ww, ww);
      ctx.restore();
    };
    // For a static frame (docs, thumbnails): place the sweep at u (0..1).
    sl.pose = function(t, u){ sl.light = { t0: t - u * 7, dur: 7, dir: 1, y: 0.45, rot: 0.7 }; sl.next = t; };
    return sl;
  }

  // ---------- Overlay ----------
  // Centre messages as stacked vector lines; dy is offset from H/2 at uiScale 1.
  var OVERLAYS = {
    portraitTitle: [{ text: 'BREAKOUT', size: 2.2, dy: -10, glow: 2 }, { text: 'CLICK OR SPACE TO LAUNCH', size: 0.9, dy: 40, glow: 1 }],
    portraitLevel: [{ text: 'LEVEL 2', size: 1.4, dy: -10, glow: 2 }, { text: 'CLICK OR SPACE TO LAUNCH', size: 0.85, dy: 30, glow: 1 }],
    portraitAreaComplete: [{ text: 'AREA COMPLETE', size: 1.4, dy: 0, glow: 2 }],
    portraitGameOver: [{ text: 'GAME OVER', size: 2.0, dy: -40, glow: 2 }, { text: 'SCORE 1240', size: 1.1, dy: 45, glow: 1 }, { text: 'CLICK OR SPACE TO RESTART', size: 0.85, dy: 85, glow: 1 }],
    wideTitle: [{ text: 'ASTEROIDS', size: 4, dy: -40, glow: 9 }, { text: 'ARROWS ROTATE + THRUST', size: 1, dy: 30, glow: 4 },
      { text: 'DRAG TO FLY   SHIFT HYPERSPACE', size: 1, dy: 55, glow: 4 }, { text: 'PRESS ENTER OR TAP TO START', size: 1, dy: 95, glow: 4, blink: true }],
    wideGameOver: [{ text: 'GAME OVER', size: 3.5, dy: -10, glow: 9 }, { text: 'SCORE:12880', size: 1.3, dy: 40, glow: 5 }, { text: 'PRESS ENTER OR TAP TO RESTART', size: 1, dy: 80, glow: 4, blink: true }]
  };
  // opts: scrim (portrait screens dim the field to scrim), uiScale, now.
  // Portrait lines use raw glow (glowScale 1); wide lines use GLOW_SCALE.
  function drawOverlay(ctx, W, H, lines, opts){
    opts = opts || {};
    var ui = opts.uiScale || 1, now = opts.now === undefined ? Date.now() : opts.now;
    if (opts.scrim) { ctx.fillStyle = COLORS.scrim; ctx.fillRect(0, 0, W, H); }
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (l.blink && !blinkOn(now)) continue;
      drawVectorText(ctx, l.text, W / 2, H / 2 + l.dy * ui, l.size * ui, { align: 'center', color: l.color || COLORS.ink, glow: l.glow, uiScale: ui, glowScale: opts.scrim ? 1 : GLOW_SCALE });
    }
  }

  // ---------- UpgradeIcons ----------
  // Line icons on a unit box of side s around (cx, cy). Caller sets stroke and fill.
  var ICONS = {
    fireRate: function(ctx, cx, cy, s){ ctx.beginPath();
      ctx.moveTo(cx - s*0.32, cy + s*0.32); ctx.lineTo(cx - s*0.32, cy - s*0.05);
      ctx.moveTo(cx, cy + s*0.32); ctx.lineTo(cx, cy - s*0.22);
      ctx.moveTo(cx + s*0.32, cy + s*0.32); ctx.lineTo(cx + s*0.32, cy - s*0.4); ctx.stroke(); },
    extraLife: function(ctx, cx, cy, s){ ctx.save(); ctx.translate(cx, cy); ctx.rotate(-Math.PI/2); ctx.beginPath();
      ctx.moveTo(s*0.42, 0); ctx.lineTo(-s*0.30, s*0.26); ctx.lineTo(-s*0.16, 0); ctx.lineTo(-s*0.30, -s*0.26); ctx.closePath(); ctx.stroke(); ctx.restore(); },
    missile: function(ctx, cx, cy, s){ ctx.beginPath(); ctx.arc(cx, cy, s*0.32, 0, TWO_PI);
      ctx.moveTo(cx - s*0.5, cy); ctx.lineTo(cx - s*0.32, cy); ctx.moveTo(cx + s*0.32, cy); ctx.lineTo(cx + s*0.5, cy);
      ctx.moveTo(cx, cy - s*0.5); ctx.lineTo(cx, cy - s*0.32); ctx.moveTo(cx, cy + s*0.32); ctx.lineTo(cx, cy + s*0.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, s*0.05, 0, TWO_PI); ctx.fill(); },
    drone: function(ctx, cx, cy, s){ ctx.beginPath(); ctx.arc(cx, cy, s*0.07, 0, TWO_PI); ctx.fill();
      ctx.save(); ctx.setLineDash([s*0.06, s*0.06]); ctx.beginPath(); ctx.arc(cx, cy, s*0.4, 0, TWO_PI); ctx.stroke(); ctx.restore();
      ctx.beginPath(); ctx.arc(cx + s*0.4, cy, s*0.08, 0, TWO_PI); ctx.fill(); },
    thrust: function(ctx, cx, cy, s){ ctx.beginPath(); ctx.moveTo(cx, cy - s*0.4); ctx.lineTo(cx - s*0.25, cy + s*0.1); ctx.lineTo(cx + s*0.25, cy + s*0.1); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s*0.12, cy + s*0.1); ctx.lineTo(cx - s*0.12, cy + s*0.35); ctx.moveTo(cx + s*0.12, cy + s*0.1); ctx.lineTo(cx + s*0.12, cy + s*0.4); ctx.stroke(); },
    maxSpeed: function(ctx, cx, cy, s){ ctx.beginPath();
      ctx.moveTo(cx - s*0.35, cy - s*0.3); ctx.lineTo(cx - s*0.05, cy); ctx.lineTo(cx - s*0.35, cy + s*0.3);
      ctx.moveTo(cx + s*0.05, cy - s*0.3); ctx.lineTo(cx + s*0.35, cy); ctx.lineTo(cx + s*0.05, cy + s*0.3); ctx.stroke(); },
    buffDuration: function(ctx, cx, cy, s){ ctx.beginPath(); ctx.moveTo(cx - s*0.3, cy - s*0.4); ctx.lineTo(cx + s*0.3, cy - s*0.4); ctx.lineTo(cx, cy);
      ctx.lineTo(cx + s*0.3, cy + s*0.4); ctx.lineTo(cx - s*0.3, cy + s*0.4); ctx.lineTo(cx, cy); ctx.closePath(); ctx.stroke(); },
    magnet: function(ctx, cx, cy, s){ var r = s*0.28, a1 = Math.PI*0.15, a2 = Math.PI*0.85;
      ctx.beginPath(); ctx.arc(cx, cy, r, a1, a2, false); ctx.stroke();
      var x1 = cx + Math.cos(a1)*r, y1 = cy + Math.sin(a1)*r, x2 = cx + Math.cos(a2)*r, y2 = cy + Math.sin(a2)*r;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1, y1 - s*0.32); ctx.moveTo(x2, y2); ctx.lineTo(x2, y2 - s*0.32); ctx.stroke(); },
    dustValue: function(ctx, cx, cy, s){ ctx.strokeRect(cx - s*0.4 - s*0.1, cy - s*0.25, s*0.5, s*0.5);
      ctx.beginPath(); ctx.moveTo(cx + s*0.12, cy - s*0.4); ctx.lineTo(cx + s*0.44, cy - s*0.4);
      ctx.moveTo(cx + s*0.28, cy - s*0.56); ctx.lineTo(cx + s*0.28, cy - s*0.24); ctx.stroke(); }
  };
  function drawIcon(ctx, name, cx, cy, s, opts){
    opts = opts || {};
    var ui = opts.uiScale || 1, color = opts.color || '#fff';
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.shadowColor = color;
    ctx.lineWidth = 2 * ui; ctx.shadowBlur = 6 * ui * GLOW_SCALE;
    ICONS[name](ctx, cx, cy, s);
    ctx.restore();
  }

  // ---------- ShopCard ----------
  var SHOP = { cardW: 190, cardH: 180, gapX: 36, gapY: 28, leaveGap: 30, leaveW: 180, leaveH: 46, lockedAlpha: 0.3 };
  function shopLayout(W, H, ui){
    ui = ui || 1;
    var cw = SHOP.cardW * ui, ch = SHOP.cardH * ui, gx = SHOP.gapX * ui, gy = SHOP.gapY * ui;
    var totalW = 2 * cw + gx, totalH = 2 * ch + gy, fullH = totalH + (SHOP.leaveGap + SHOP.leaveH) * ui;
    var x0 = W / 2 - totalW / 2, y0 = H / 2 - fullH / 2, cards = [];
    for (var i = 0; i < 4; i++) cards.push({ x: x0 + (i % 2) * (cw + gx), y: y0 + Math.floor(i / 2) * (ch + gy), w: cw, h: ch });
    return { cards: cards, top: y0, leave: { x: W / 2 - 90 * ui, y: y0 + totalH + 30 * ui, w: SHOP.leaveW * ui, h: SHOP.leaveH * ui } };
  }
  function framedRect(ctx, r, selected, fill){
    ctx.fillStyle = selected ? COLORS.cardSelected : fill;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  // u: { name, desc, cost (null when locked), lockLabel, icon (ICONS key) }
  function drawShopCard(ctx, card, u, opts){
    opts = opts || {};
    var ui = opts.uiScale || 1, fade = opts.fade === undefined ? 1 : opts.fade;
    var locked = u.cost === null || u.cost === undefined;
    var affordable = !locked && (opts.currency || 0) >= u.cost;
    var selected = !!opts.selected;
    ctx.save();
    // Locked dims the frame and icon to opacity-locked; its words stay at full strength so they read at 4.5:1.
    ctx.globalAlpha = fade * (locked ? SHOP.lockedAlpha : 1);
    framedRect(ctx, card, selected, COLORS.card);
    ctx.strokeStyle = selected ? COLORS.signal : (affordable ? COLORS.cardEdge : COLORS.cardEdgeOff);
    ctx.lineWidth = selected ? 3 : 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = (selected ? 14 : 0) * GLOW_SCALE;
    ctx.strokeRect(card.x, card.y, card.w, card.h);
    ctx.shadowBlur = 0;
    if (u.icon && ICONS[u.icon]) drawIcon(ctx, u.icon, card.x + card.w / 2, card.y + 58 * ui, 70 * ui, { uiScale: ui });
    ctx.globalAlpha = fade;
    drawVectorText(ctx, u.name, card.x + card.w / 2, card.y + 112 * ui, 0.85 * ui, { align: 'center', color: locked ? COLORS.inkMuted : COLORS.ink, glow: locked ? 0 : 3, uiScale: ui });
    // Descriptions sit at the 0.75 text floor and wrap to the card (three rows fit above the lock label).
    if (u.desc) wrapVectorText(u.desc, 0.75 * ui, card.w - 16 * ui).slice(0, 3).forEach(function(row, i){
      drawVectorText(ctx, row, card.x + card.w / 2, card.y + (126 + i * 13) * ui, 0.75 * ui, { align: 'center', color: COLORS.inkMuted, uiScale: ui });
    });
    if (locked) {
      drawVectorText(ctx, u.lockLabel || 'OWNED', card.x + card.w / 2, card.y + card.h - 12 * ui, 0.75 * ui, { align: 'center', color: COLORS.signal, glow: 4, uiScale: ui });
    } else {
      var costColor = affordable ? COLORS.coin : COLORS.coinShort;
      var iconX = card.x + card.w / 2 + 18 * ui;
      drawVectorText(ctx, String(u.cost), iconX - 8 * ui, card.y + card.h - 10 * ui, 0.85 * ui, { align: 'right', color: costColor, glow: 3, uiScale: ui });
      ctx.strokeStyle = costColor; ctx.lineWidth = 2 * ui;
      ctx.strokeRect(iconX, card.y + card.h - 23 * ui, 13 * ui, 13 * ui);
    }
    ctx.restore();
  }
  function drawShopButton(ctx, r, label, selected, ui){
    ui = ui || 1;
    ctx.save();
    framedRect(ctx, r, selected, COLORS.button);
    ctx.strokeStyle = selected ? COLORS.signal : COLORS.cardEdge;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = (selected ? 14 : 0) * GLOW_SCALE;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.restore();
    drawVectorText(ctx, label || 'LEAVE', r.x + r.w / 2, r.y + r.h / 2 + 7 * ui, 1.2 * ui, { align: 'center', glow: 4, uiScale: ui });
  }
  function drawPageArrow(ctx, r, direction, selected){
    ctx.save();
    if (selected) { ctx.fillStyle = COLORS.cardSelected; ctx.fillRect(r.x, r.y, r.w, r.h); }
    ctx.strokeStyle = selected ? COLORS.signal : COLORS.cardEdge;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = (selected ? 14 : 0) * GLOW_SCALE;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.shadowBlur = 0;
    var size = Math.min(r.w, r.h) * 0.5, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    ctx.beginPath();
    if (direction < 0) { ctx.moveTo(cx + size*0.4, cy - size*0.55); ctx.lineTo(cx - size*0.4, cy); ctx.lineTo(cx + size*0.4, cy + size*0.55); }
    else { ctx.moveTo(cx - size*0.4, cy - size*0.55); ctx.lineTo(cx + size*0.4, cy); ctx.lineTo(cx - size*0.4, cy + size*0.55); }
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  // ---------- FireButton ----------
  function fireButtonGeometry(H, ui){
    ui = ui || 1;
    var radius = 56 * ui, margin = 26 * ui;
    return { cx: margin + radius, cy: H - margin - radius, radius: radius };
  }
  // Idle at 50% white: 4.8:1 on the space grounds, so the button is findable before it is pressed (3:1 for controls).
  var FIRE_IDLE = 'rgba(255,255,255,0.5)';
  function drawFireButton(ctx, g, active, ui){
    ui = ui || 1;
    ctx.save();
    ctx.strokeStyle = active ? 'rgba(255,255,255,0.85)' : FIRE_IDLE;
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = (active ? 10 : 0) * ui * GLOW_SCALE;
    ctx.lineWidth = 2 * ui;
    ctx.beginPath(); ctx.arc(g.cx, g.cy, g.radius, 0, TWO_PI); ctx.stroke();
    ctx.restore();
  }

  // ---------- Synth ----------
  // Oscillators and gain envelopes only; no samples. Call unlock() from a
  // click or key handler before anything plays.
  var PING_SCALE = [220.00, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00]; // A3 to A4, natural minor
  function createSynth(){
    var ac = null, master = null, delay = null;
    var syn = { scale: PING_SCALE };
    syn.unlock = function(){
      if (!ac) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return syn;
        ac = new AC();
        master = ac.createGain(); master.gain.value = syn.muted ? 0 : 0.6 * syn.volume; master.connect(ac.destination);
        delay = ac.createDelay(1.0); delay.delayTime.value = 0.2;
        var fb = ac.createGain(); fb.gain.value = 0.19;
        var wet = ac.createGain(); wet.gain.value = 0.15;
        delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
      }
      if (ac.state === 'suspended') ac.resume();
      return syn;
    };
    syn.context = function(){ return ac; };
    // Mute silences every voice, including beeps that skip the master bus. The Shell drives this.
    syn.muted = false;
    syn.volume = 1;
    function level(){ if (master) master.gain.value = syn.muted ? 0 : 0.6 * syn.volume; }
    syn.setMuted = function(m){ syn.muted = !!m; level(); return syn; };
    // The player's VOLUME setting (0..1). Beeps skip the master bus, so they scale here too.
    syn.setVolume = function(v){ syn.volume = Math.max(0, Math.min(1, v)); level(); return syn; };
    // Asteroids' blip: fixed frequency, exponential fade.
    syn.beep = function(freq, duration, type, vol){
      if (!ac || syn.muted) return;
      var osc = ac.createOscillator(), gain = ac.createGain();
      osc.type = type || 'square'; osc.frequency.value = freq;
      gain.gain.value = (vol !== undefined ? vol : 0.15) * syn.volume;
      osc.connect(gain); gain.connect(ac.destination);
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration); osc.stop(ac.currentTime + duration);
    };
    // Breakout's swept tone: attack, pitch glide, exponential decay into the master bus.
    function sweep(type, f0, f1, peak, decay, glideFrac, echo, filterFreq){
      if (!ac || syn.muted) return;
      var now = ac.currentTime, osc = ac.createOscillator(), gain = ac.createGain(), node = osc;
      osc.type = type;
      osc.frequency.setValueAtTime(f0, now);
      if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), now + decay * (glideFrac || 0.8));
      if (filterFreq) { var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterFreq; osc.connect(f); node = f; }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      node.connect(gain); gain.connect(master);
      if (echo && delay) gain.connect(delay);
      osc.start(now); osc.stop(now + decay + 0.02);
    }
    function arp(notes, peak, noteMs, decayMs){
      if (!ac || syn.muted) return;
      var now = ac.currentTime;
      notes.forEach(function(freq, i){
        var start = now + i * noteMs / 1000, osc = ac.createOscillator(), gain = ac.createGain();
        osc.type = 'triangle'; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(peak, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + decayMs / 1000);
        osc.connect(gain); gain.connect(master); osc.start(start); osc.stop(start + decayMs / 1000 + 0.02);
      });
    }
    syn.sfx = {
      // Breakout
      ping: function(freq){ sweep('sine', freq || PING_SCALE[Math.floor(Math.random() * PING_SCALE.length)], null, 0.22, 0.071, 0, true, 1270); },
      tap: function(intensity){ intensity = clamp(intensity || 0, 0, 1);
        sweep(intensity > 0.5 ? 'triangle' : 'square', 245 - intensity * 60, 85 - intensity * 80, 0.09 + intensity * 0.12, 0.055 + intensity * 0.4, 0.8); },
      thud: function(){ sweep('sine', 110, 70, 0.16, 0.1, 0.8); },
      crack: function(){ sweep('square', 420, 260, 0.17, 0.03, 0.7); },
      catch: function(){ arp([PING_SCALE[5], PING_SCALE[7]], 0.28, 110, 350); },
      powerUp: function(){ arp([PING_SCALE[2], PING_SCALE[4], PING_SCALE[7]], 0.3, 90, 420); },
      // Asteroids
      fire: function(){ syn.beep(880, 0.048, 'sine', 0.1); },
      bangLarge: function(){ syn.beep(120, 0.158, 'sine', 0.18); },
      bangMedium: function(){ syn.beep(238, 0.154, 'sine', 0.16); },
      bangSmall: function(){ syn.beep(370, 0.25, 'sine', 0.14); },
      explodeShip: function(){ syn.beep(60, 0.48, 'sawtooth', 0.2); },
      extraLife: function(){ syn.beep(741, 0.315, 'triangle', 0.15); },
      saucer: function(){ syn.beep(424, 0.173, 'triangle', 0.08); },
      collect: function(){ syn.beep(1200, 0.04, 'sine', 0.04); },
      pickup: function(){ syn.beep(700, 0.081, 'square', 0.12); setTimeout(function(){ syn.beep(1050, 0.104, 'square', 0.12); }, 60); },
      buffUp: function(){ syn.beep(500, 0.12, 'triangle', 0.18); setTimeout(function(){ syn.beep(750, 0.18, 'triangle', 0.18); }, 90); },
      heartbeat1: function(){ syn.beep(55, 0.13, 'triangle', 0.16); },
      heartbeat2: function(){ syn.beep(50.5, 0.13, 'triangle', 0.16); }
    };
    return syn;
  }

  // ---------- Shell ----------
  // The frame around every game: title, how to play, settings, pause, sound, won/lost, restart.
  // The game keeps its own loop. Each frame it asks shell.tick(now) for dt (0 unless
  // playing, scaled by the player's speed setting), draws its field, then calls
  // shell.draw(ctx, W, H, ui) to lay the shell on top.
  // While the state is anything but 'playing', the game never sees a key or a tap.
  var SHELL = {
    restartGuardMs: 1200, // the result screen holds this long before a key can restart
    maxDt: 0.05,          // one frame never advances the game more than 50ms
    button: 40,           // HUD button hit box height (and pause/settings width), logical px at uiScale 1
    inset: 8,             // the sound hit box reaches this far past the HUD margin
    minTouchCss: 44,      // every hit box is at least this many CSS px, however far the canvas is scaled down
    hudGap: 24,           // ink to ink: HUD value to the first button (data and controls read as two groups)
    buttonGap: 12,        // ink to ink between buttons
    // The HUD row each layout's buttons join: cy is the middle of the row's big value
    // (baseline - cap height / 2), edge the HUD's right margin, glow its value glow.
    bars: {
      portrait: { cy: 44 - 12 * 1.3 / 2, edge: 16, cap: 12 * 1.3, glow: 1, glowScale: 1 },   // drawHud chase
      wide:     { cy: 34 - 12 * 1.3 / 2, edge: 20, cap: 12 * 1.3, glow: 6, glowScale: GLOW_SCALE }, // drawHud spend
      column:   { cy: 44 - 12 * 1.25 / 2, edge: 14, cap: 12 * 1.25, glow: 6, glowScale: GLOW_SCALE } // drawStatHud
    },
    // Every action is one key press: no Shift combinations (no ?), so a player never needs two hands or two tries.
    // The player can rebind each of these in SETTINGS > KEYS; Esc always pauses and always goes back.
    keys: { pause: ['p'], mute: ['m'], restart: ['r'], help: ['h'], settings: ['s'] },
    labels: { pause: 'PAUSE', mute: 'SOUND', restart: 'RESTART', help: 'HOW TO PLAY', settings: 'SETTINGS' },
    passKeys: ['shift', 'control', 'alt', 'meta', 'capslock', 'tab', 'fn', 'os', 'altgraph', 'numlock', 'scrolllock', 'contextmenu'],
    reservedKeys: ['escape', 'enter'],   // menus need these; never rebound
    // Player settings, shared by every Classics+ game on this device.
    defaults: { volume: 1, speed: 1, timer: 'on', holds: 'hold', steering: 1, messages: 'normal', motion: null },
    speeds: [1, 0.75, 0.5],
    steerings: [0.5, 0.75, 1, 1.25, 1.5, 2],
    styles: {
      // Breakout's cabinet: dim with scrim, raw glows.
      portrait: { scrim: true, glowScale: 1, title: 2.2, head: 1.6, score: 1.1, body: 0.85, small: 0.75, gTitle: 2, gBody: 1, input: 'CLICK OR SPACE' },
      // Asteroids' field: dim with scrim so screen text never sits on a rock's stroke, GLOW_SCALE glows, blinking prompt.
      wide: { scrim: true, glowScale: GLOW_SCALE, title: 3.5, head: 2.6, score: 1.3, body: 1, small: 0.75, gTitle: 9, gBody: 4, input: 'PRESS ENTER OR TAP' },
      // Code Breaker's keypad column: a deep scrim (its cards and keypad are busy), GLOW_SCALE glows.
      column: { scrim: true, scrimColor: 'rgba(0,0,0,0.86)', glowScale: GLOW_SCALE, title: 3, head: 2, score: 1.6, body: 0.85, small: 0.75, gTitle: 9, gBody: 3, input: 'PRESS ANY KEY OR TAP', resumeInput: 'PRESS P OR TAP' }
    }
  };

  function shellStore(id){
    var prefix = 'classicplus:' + id + ':';
    return {
      get: function(k, d){ try { var v = localStorage.getItem(prefix + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
      set: function(k, v){ try { localStorage.setItem(prefix + k, JSON.stringify(v)); } catch (e) {} }
    };
  }

  // Reduced motion is one switch for the whole kit: the OS setting by default, the player's
  // SETTINGS > MOTION once chosen. ScopeGrid stops drifting, Searchlight stops sweeping,
  // prompts stop blinking; games read ClassicPlus.motionReduced() for their own effects.
  var motion = { reduced: !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) };
  function motionReduced(){ return motion.reduced; }
  function setMotionReduced(r){ motion.reduced = !!r; }

  // Key names as the vector font can draw them.
  function keyName(k){
    var names = { ' ': 'SPACE', arrowleft: 'LEFT', arrowright: 'RIGHT', arrowup: 'UP', arrowdown: 'DOWN', escape: 'ESC', enter: 'ENTER', backspace: 'BKSP', delete: 'DEL' };
    if (names[k]) return names[k];
    var up = String(k).toUpperCase();
    for (var i = 0; i < up.length; i++) if (!VECTOR_FONT[up[i]]) return 'KEY';
    return up;
  }

  // Both glyphs are one cap height tall and stroked like a HUD value, so they read as part of the row.
  function glyphStyle(ctx, alpha, ui, bar){
    ctx.globalAlpha = alpha; ctx.strokeStyle = COLORS.ink; ctx.fillStyle = COLORS.ink; ctx.lineWidth = 2 * ui; ctx.lineJoin = 'round';
    ctx.shadowColor = COLORS.ink; ctx.shadowBlur = bar.glow * ui * bar.glowScale;
  }
  function drawPauseGlyph(ctx, r, paused, alpha, ui, bar){
    var cx = r.cx, cy = r.cy, s = bar.cap / 2 * ui;
    ctx.save(); glyphStyle(ctx, alpha, ui, bar);
    ctx.beginPath();
    if (paused) { ctx.moveTo(cx - s * 0.7, cy - s); ctx.lineTo(cx + s, cy); ctx.lineTo(cx - s * 0.7, cy + s); ctx.closePath(); }
    else { ctx.rect(cx - s * 0.75, cy - s, s * 0.5, s * 2); ctx.rect(cx + s * 0.25, cy - s, s * 0.5, s * 2); }
    ctx.stroke(); ctx.restore();
  }
  // Settings: three slider tracks with their knobs, one cap high and one cap wide.
  function drawSettingsGlyph(ctx, r, alpha, ui, bar){
    var cx = r.cx, cy = r.cy, s = bar.cap / 2 * ui, knobs = [0.35, -0.45, 0.1];
    ctx.save(); glyphStyle(ctx, alpha, ui, bar);
    ctx.beginPath();
    for (var i = 0; i < 3; i++) { var y = cy + (i - 1) * s * 0.85; ctx.moveTo(cx - s, y); ctx.lineTo(cx + s, y); }
    ctx.stroke();
    for (var j = 0; j < 3; j++) { ctx.beginPath(); ctx.arc(cx + knobs[j] * s * 1.6, cy + (j - 1) * s * 0.85, s * 0.28, 0, TWO_PI); ctx.fill(); }
    ctx.restore();
  }
  // Code Breaker's speaker: a cone with two waves, or a cross when muted.
  function drawSoundGlyph(ctx, r, muted, alpha, ui, bar){
    var u = ui * bar.cap / 20, x = r.cx - 12.5 * u, y = r.cy;
    ctx.save(); glyphStyle(ctx, muted ? alpha * 0.6 : alpha, ui, bar);
    ctx.beginPath(); ctx.moveTo(x, y - 4*u); ctx.lineTo(x + 5*u, y - 4*u); ctx.lineTo(x + 11*u, y - 10*u); ctx.lineTo(x + 11*u, y + 10*u); ctx.lineTo(x + 5*u, y + 4*u); ctx.lineTo(x, y + 4*u); ctx.closePath(); ctx.stroke();
    ctx.beginPath();
    if (muted) { ctx.moveTo(x + 16*u, y - 5*u); ctx.lineTo(x + 24*u, y + 5*u); ctx.moveTo(x + 24*u, y - 5*u); ctx.lineTo(x + 16*u, y + 5*u); }
    else { ctx.moveTo(x + 16*u, y - 6*u); ctx.lineTo(x + 19*u, y - 2*u); ctx.lineTo(x + 19*u, y + 2*u); ctx.lineTo(x + 16*u, y + 6*u);
      ctx.moveTo(x + 21*u, y - 10*u); ctx.lineTo(x + 25*u, y - 4*u); ctx.lineTo(x + 25*u, y + 4*u); ctx.lineTo(x + 21*u, y + 10*u); }
    ctx.stroke(); ctx.restore();
  }

  // Screen text is a string or a list of coloured spans: [{ text: 'A', color: COLORS.signal }, { text: ' + B = 11' }].
  // Spans without a colour take the line's.
  function shellSpans(t){ return typeof t === 'string' || typeof t === 'number' ? [{ text: String(t) }] : (t || []); }
  function shellPlain(t){ return shellSpans(t).map(function(x){ return x.text; }).join(''); }

  function createShell(opts){
    opts = opts || {};
    var style = SHELL.styles[opts.layout] || SHELL.styles.portrait;
    var store = shellStore(opts.id || 'game'), shared = shellStore('all');
    var guardMs = opts.restartGuardMs === undefined ? SHELL.restartGuardMs : opts.restartGuardMs;
    var digits = opts.scoreDigits === undefined ? 6 : opts.scoreDigits;
    var last = null, endedAt = 0, practice = false, helpFrom = 'title', startAfterHelp = false, view = { W: 0, H: 0, ui: 1 }, introUp = false, live = null;
    var k;

    // ---- actions: the shell's own, then the game's ----
    // A game action: { id, label, keys: ['h'], hold: false, group: 'move', fixed: false, display: '0-9' }.
    // hold actions are read with shell.isDown(id) and can become toggles in SETTINGS; press
    // actions call opts.onAction(id). fixed actions (digits, slot letters) are listed in HOW
    // TO PLAY but never rebound or routed: the game reads those keys itself.
    var actions = [];
    for (k in SHELL.keys) actions.push({ id: k, label: SHELL.labels[k], keys: ((opts.keys && opts.keys[k]) || SHELL.keys[k]).slice(), shell: true });
    (opts.actions || []).forEach(function(a){ actions.push({ id: a.id, label: a.label || a.id.toUpperCase(), keys: (a.keys || []).slice(), hold: !!a.hold, group: a.group, fixed: !!a.fixed, display: a.display }); });
    var defaultKeys = {};
    actions.forEach(function(a){ defaultKeys[a.id] = a.keys.slice(); });
    var savedKeys = store.get('keys', {});
    actions.forEach(function(a){ if (!a.fixed && savedKeys[a.id] && savedKeys[a.id].length) a.keys = savedKeys[a.id].slice(); });
    function action(id){ for (var i = 0; i < actions.length; i++) if (actions[i].id === id) return actions[i]; return null; }
    function actionFor(key){ for (var i = 0; i < actions.length; i++) if (actions[i].keys.indexOf(key) >= 0) return actions[i]; return null; }
    function keyOf(id){ var a = action(id); return a ? (a.display || keyName(a.keys[0] || '')) : ''; }
    var hasHolds = actions.some(function(a){ return a.hold; });

    // ---- settings: shared across games ----
    var settings = {}, savedSettings = shared.get('settings', {});
    for (k in SHELL.defaults) settings[k] = savedSettings[k] !== undefined ? savedSettings[k] : SHELL.defaults[k];
    if (settings.motion) setMotionReduced(settings.motion === 'reduced');
    function saveSettings(){ shared.set('settings', settings); }
    function applyAudio(){
      if (opts.synth && opts.synth.setVolume) opts.synth.setVolume(settings.volume);
      if (opts.synth && opts.synth.setMuted) opts.synth.setMuted(shell.muted);
    }

    var shell = {
      state: 'title',            // 'title' | 'howto' | 'settings' | 'playing' | 'paused' | 'won' | 'lost'
      score: 0,
      best: store.get('best', 0),
      newBest: false,
      practice: false,           // the last run went untimed (TIMER OFF), so it kept no best score
      muted: !!store.get('muted', false),
      time: 0,                   // game seconds; frozen whenever the state is not 'playing'
      result: null,              // what the game passed to win() / lose()
      layout: opts.layout || 'portrait',
      settings: settings
    };
    applyAudio();

    function emit(name, arg){ var f = opts['on' + name]; if (f) f(arg, shell); }
    function announce(text){ if (live) { live.textContent = ''; live.textContent = text; } }
    function pad(n){ return digits ? String(Math.max(0, Math.floor(n))).padStart(digits, '0') : String(n); }
    function unlock(){ if (opts.synth && opts.synth.unlock) opts.synth.unlock(); }
    function canRestart(){ return Date.now() - endedAt >= guardMs; }
    function set(state){ shell.state = state; }

    shell.isPlaying = function(){ return shell.state === 'playing'; };
    shell.isOver = function(){ return shell.state === 'won' || shell.state === 'lost'; };
    shell.setScore = function(n){ shell.score = n; return shell; };
    shell.addScore = function(n){ shell.score += n; return shell; };
    shell.keyFor = keyOf;
    // What the player chose; games read these instead of the raw settings.
    shell.speed = function(){ return settings.speed; };
    shell.timerOn = function(){ return !opts.timer || settings.timer !== 'off'; };
    shell.steering = function(){ return settings.steering; };
    shell.messagesStay = function(){ return settings.messages === 'stay'; };
    shell.reducedMotion = motionReduced;

    // ---- holds ----
    var down = {};
    shell.isDown = function(id){ return shell.state === 'playing' && !!down[id]; };
    function clearHolds(all){ for (var id in down) if (all || settings.holds !== 'toggle') down[id] = false; }
    // Let go of every held or toggled action, e.g. when the game opens its own menu mid-play.
    shell.releaseHolds = function(){ clearHolds(true); return shell; };
    // The game's own events (level up, life lost) through the shell's polite live region.
    shell.say = function(text){ announce(text); return shell; };
    function press(a, e){
      if (a.hold) {
        if (settings.holds === 'toggle') {
          if (e.repeat) return;
          var on = !down[a.id];
          if (on && a.group) actions.forEach(function(b){ if (b.group === a.group) down[b.id] = false; });
          down[a.id] = on;
        } else down[a.id] = true;
        // A hold also reports each fresh press, so a game's menus and grid moves can use the player's keys.
        if (!e.repeat && opts.onAction) opts.onAction(a.id, shell);
        return;
      }
      if (!e.repeat && opts.onAction) opts.onAction(a.id, shell);
    }

    shell.start = function(){
      // The first time anyone plays this game on this device, HOW TO PLAY comes first.
      if (opts.howTo && opts.firstRunHowTo !== false && !store.get('seenHowTo', false) && shell.state === 'title') {
        startAfterHelp = true; shell.showHowTo(); return shell;
      }
      shell.score = 0; shell.time = 0; shell.result = null; shell.newBest = false;
      practice = !shell.timerOn();   // a run that starts, or ever goes, untimed keeps no best score
      clearHolds(true); set('playing'); unlock();
      emit('Start');
      announce('Go.');
      return shell;
    };
    shell.restart = function(){ set('title'); store.set('seenHowTo', true); return shell.start(); };
    shell.pause = function(){
      if (shell.state !== 'playing') return shell;
      clearHolds(false); set('paused'); emit('Pause');
      announce('Paused. Score ' + shell.score + '.');
      return shell;
    };
    shell.resume = function(){
      if (shell.state !== 'paused') return shell;
      set('playing'); last = null; emit('Resume');
      return shell;
    };
    shell.togglePause = function(){ return shell.state === 'paused' ? shell.resume() : shell.pause(); };
    function end(state, result){
      if (shell.state !== 'playing' && shell.state !== 'paused') return shell;
      result = result || {};
      if (result.score !== undefined) shell.score = result.score;
      shell.result = result;
      shell.practice = practice;
      shell.newBest = !practice && shell.score > 0 && shell.score > shell.best;
      if (shell.newBest) { shell.best = shell.score; store.set('best', shell.best); }
      endedAt = Date.now(); clearHolds(true);
      set(state); emit('End', result);
      announce(result.say || ((result.title ? shellPlain(result.title) : (state === 'won' ? 'All clear' : 'Game over')) + '. Score ' + shell.score + '. ' + (practice ? 'Practice, timer off.' : shell.newBest ? 'New best.' : 'Best ' + shell.best + '.')));
      return shell;
    };
    shell.win = function(result){ return end('won', result); };
    shell.lose = function(result){ return end('lost', result); };
    shell.showHowTo = function(){
      if (shell.state === 'howto') return shell;
      if (shell.state === 'playing') shell.pause();
      helpFrom = shell.state; set('howto');
      announce((opts.howTo || []).map(shellPlain).join('. ') + '. ' + keyOf('settings') + ' opens settings.');
      return shell;
    };
    shell.closeHowTo = function(){
      if (shell.state !== 'howto') return shell;
      store.set('seenHowTo', true);
      set(helpFrom);
      if (startAfterHelp) { startAfterHelp = false; shell.start(); }
      return shell;
    };
    shell.setMuted = function(m){
      shell.muted = !!m; store.set('muted', shell.muted);
      applyAudio();
      emit('Mute', shell.muted);
      announce(shell.muted ? 'Sound off.' : 'Sound on.');
      return shell;
    };
    shell.toggleMute = function(){ unlock(); return shell.setMuted(!shell.muted); };

    // Seconds of game time for this frame: 0 unless playing, never more than maxDt,
    // scaled by the player's SPEED setting so the whole game slows together.
    shell.tick = function(now){
      if (now === undefined) now = performance.now();
      var dt = last === null ? 0 : Math.min(SHELL.maxDt, Math.max(0, (now - last) / 1000));
      last = now;
      if (shell.state !== 'playing') return 0;
      dt *= settings.speed;
      shell.time += dt;
      return dt;
    };

    // ---- settings screen ----
    var menu = { page: 'main', sel: 0, from: 'title', listening: null, note: '' };
    function pct(v){ return Math.round(v * 100) + '%'; }
    function cycle(list, v, dir){ var i = list.indexOf(v); if (i < 0) i = 0; return list[Math.max(0, Math.min(list.length - 1, i + dir))]; }
    function mainRows(){
      var rows = [
        { id: 'volume', label: 'VOLUME', value: function(){ return shell.muted ? 'MUTED' : pct(settings.volume); },
          change: function(d){ if (shell.muted && d > 0) { shell.setMuted(false); return; } settings.volume = Math.round(Math.max(0, Math.min(1, settings.volume + d * 0.1)) * 10) / 10; applyAudio(); return 'Volume ' + pct(settings.volume); } },
        { id: 'speed', label: 'GAME SPEED', value: function(){ return pct(settings.speed); },
          change: function(d){ settings.speed = cycle(SHELL.speeds, settings.speed, d); return 'Game speed ' + pct(settings.speed); } }
      ];
      if (opts.timer) rows.push({ id: 'timer', label: 'TIMER', value: function(){ return settings.timer === 'off' ? 'OFF' : 'ON'; },
        change: function(){ settings.timer = settings.timer === 'off' ? 'on' : 'off'; if (settings.timer === 'off' && menu.from === 'paused') practice = true; return 'Timer ' + settings.timer + (settings.timer === 'off' ? ', practice: no best score' : ''); } });
      if (hasHolds) rows.push({ id: 'holds', label: 'HELD KEYS', value: function(){ return settings.holds === 'toggle' ? 'TAP ON/OFF' : 'HOLD'; },
        change: function(){ settings.holds = settings.holds === 'toggle' ? 'hold' : 'toggle'; clearHolds(true); return settings.holds === 'toggle' ? 'Held keys: tap on, tap off' : 'Held keys: hold'; } });
      if (opts.steering) rows.push({ id: 'steering', label: 'STEERING', value: function(){ return pct(settings.steering); },
        change: function(d){ settings.steering = cycle(SHELL.steerings, settings.steering, d); return 'Steering ' + pct(settings.steering); } });
      rows.push(
        { id: 'messages', label: 'MESSAGES', value: function(){ return settings.messages === 'stay' ? 'STAY' : 'NORMAL'; },
          change: function(){ settings.messages = settings.messages === 'stay' ? 'normal' : 'stay'; return settings.messages === 'stay' ? 'Messages stay until you act' : 'Messages normal'; } },
        { id: 'motion', label: 'MOTION', value: function(){ return motion.reduced ? 'REDUCED' : 'FULL'; },
          change: function(){ settings.motion = motion.reduced ? 'full' : 'reduced'; setMotionReduced(settings.motion === 'reduced'); return 'Motion ' + settings.motion; } },
        { id: 'keys', label: 'KEYS', value: function(){ return '>'; }, activate: function(){ menu.page = 'keys'; menu.sel = 0; menu.note = ''; return 'Keys. Choose an action, then press its new key.'; } },
        { id: 'back', label: 'BACK', value: function(){ return ''; }, activate: closeSettings });
      return rows;
    }
    function keyRows(){
      var rows = actions.filter(function(a){ return !a.fixed; }).map(function(a){
        return { id: 'key:' + a.id, label: a.label, value: function(){ return menu.listening === a.id ? 'PRESS A KEY' : keyName(a.keys[0] || ''); },
          activate: function(){ menu.listening = a.id; menu.note = ''; return 'Press the new key for ' + a.label.toLowerCase() + '. Escape cancels.'; } };
      });
      rows.push({ id: 'reset', label: 'RESET KEYS', value: function(){ return ''; }, activate: function(){
        actions.forEach(function(a){ a.keys = defaultKeys[a.id].slice(); }); store.set('keys', {}); return 'Keys reset.'; } });
      rows.push({ id: 'back', label: 'BACK', value: function(){ return ''; }, activate: function(){ menu.page = 'main'; menu.sel = 0; menu.listening = null; menu.note = ''; return 'Settings.'; } });
      return rows;
    }
    function rows(){ return menu.page === 'keys' ? keyRows() : mainRows(); }
    shell.openSettings = function(){
      if (shell.state === 'settings') return shell;
      if (shell.state === 'playing') shell.pause();
      menu.from = shell.state; menu.page = 'main'; menu.sel = 0; menu.listening = null; menu.note = '';
      set('settings'); announce('Settings. Up and down choose, left and right change, Escape goes back.');
      return shell;
    };
    function closeSettings(){
      menu.listening = null; saveSettings();
      if (shell.state === 'settings') set(menu.from);
      return 'Settings closed.';
    }
    shell.closeSettings = function(){ closeSettings(); return shell; };
    function rowSay(r){ return r.label.toLowerCase() + (r.value() ? ', ' + r.value().toLowerCase() : ''); }
    function menuMove(d){ var R = rows(); menu.sel = (menu.sel + d + R.length) % R.length; announce(rowSay(R[menu.sel])); }
    function menuChange(d){ var r = rows()[menu.sel]; var said = r.change ? r.change(d) : (d > 0 && r.activate ? r.activate() : null); saveSettings(); if (said) announce(said); }
    function menuActivate(){ var r = rows()[menu.sel]; var said = r.activate ? r.activate() : r.change ? r.change(1) : null; saveSettings(); if (said) announce(said); }
    // Rebinding takes one plain key press. Esc cancels; Enter, modifiers and Tab are refused;
    // a key another action uses is swapped with it; a key the game reserves is refused.
    function rebind(key){
      var a = action(menu.listening); menu.listening = null;
      if (!a) return;
      if (SHELL.reservedKeys.indexOf(key) >= 0 || SHELL.passKeys.indexOf(key) >= 0) { menu.note = keyName(key) + ' IS KEPT FOR MENUS'; announce(menu.note); return; }
      var other = actionFor(key);
      if (other && other.fixed) { menu.note = keyName(key) + ' IS ' + other.label; announce(menu.note); return; }
      if (other && other !== a) { other.keys = [a.keys[0]].concat(other.keys.filter(function(x){ return x !== key && x !== a.keys[0]; })); menu.note = 'SWAPPED WITH ' + other.label; }
      else menu.note = '';
      a.keys = [key];
      var saved = {}; actions.forEach(function(b){ if (!b.fixed) saved[b.id] = b.keys; }); store.set('keys', saved);
      announce(a.label.toLowerCase() + ' is now ' + keyName(key).toLowerCase() + (other && other !== a ? '. Swapped with ' + other.label.toLowerCase() : '') + '.');
    }

    // ---- HUD buttons: settings, pause and sound end the HUD row ----
    // Centred on the row's value line, sound flush with the HUD's right margin, pause and
    // settings to its left. The HUD's right-aligned value moves left to shell.hudRight(W, ui).
    // opts.buttons(W, H, ui) -> { settings, pause, mute } overrides; opts.buttons = false hides them.
    var bar = SHELL.bars[shell.layout] || SHELL.bars.portrait;
    function rowRight(W, ui){
      if (shell.layout === 'column') { var colW = Math.min(W, 460); return (W - colW) / 2 + colW - bar.edge; }
      return W - bar.edge * ui;
    }
    // Laid out by ink: value, hudGap, settings, buttonGap, pause, buttonGap, sound, the HUD margin.
    // Settings ink is 1 cap wide, pause 0.75, the speaker 1.25. Hit boxes are taller and meet halfway.
    // On a touch screen, when neighbouring hit boxes could not each be minTouchCss wide, the gaps
    // open up until they can: the glyphs move apart rather than the boxes overlapping. A mouse keeps
    // the compact row (its boxes still never overlap; see touchRow).
    function inks(W, ui){
      var cap = bar.cap * ui, touch = SHELL.minTouchCss / (view.css || 1), g = SHELL.buttonGap * ui;
      if (isTouch()) g = Math.max(g, touch - 0.75 * cap);   // pause's box (its ink plus half of each gap) is at least touch wide
      var sR = rowRight(W, ui), sL = sR - 1.25 * cap, pR = sL - g, pL = pR - 0.75 * cap, gR = pL - g, gL = gR - cap;
      return { sL: sL, sR: sR, pL: pL, pR: pR, gL: gL, gR: gR, cy: bar.cy * ui, touch: touch };
    }
    shell.buttons = function(W, H, ui){
      ui = ui || 1;
      if (opts.buttons) return opts.buttons(W, H, ui);
      var k = inks(W, ui), b = SHELL.button * ui, y = k.cy - b / 2, m1 = (k.pR + k.sL) / 2, m2 = (k.gR + k.pL) / 2;
      var reach = isTouch() ? k.touch : 0, mw = Math.max(k.sR + SHELL.inset * ui - m1, reach), gw = Math.max(b, reach);  // outer boxes grow outward only
      return {
        mute: { x: m1, y: y, w: mw, h: b, cx: (k.sL + k.sR) / 2, cy: k.cy },
        pause: { x: m2, y: y, w: m1 - m2, h: b, cx: (k.pL + k.pR) / 2, cy: k.cy },
        settings: { x: m2 - gw, y: y, w: gw, h: b, cx: (k.gL + k.gR) / 2, cy: k.cy }
      };
    };
    // Where the HUD's right-aligned value (score, currency, the last stat) should end: hudGap
    // before the settings glyph's ink (its hit box may reach further left).
    shell.hudRight = function(W, ui){
      ui = ui || 1;
      if (opts.buttons === false) return rowRight(W, ui);
      if (opts.buttons) {
        var ob = opts.buttons(W, view.H, ui), r = ob.settings || ob.pause;
        return (r.cx !== undefined ? r.cx - (ob.settings ? 0.5 : 0.375) * bar.cap * ui : r.x) - SHELL.hudGap * ui;
      }
      return inks(W, ui).gL - SHELL.hudGap * ui;
    };
    shell.hudCenterY = function(ui){ return bar.cy * (ui || 1); };
    function inRect(x, y, r){ return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

    // ---- input ----
    function onKey(e){
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var key = (e.key || '').toLowerCase(), st = shell.state;
      if (introUp) { if (SHELL.passKeys.indexOf(key) < 0) { e.preventDefault(); e.stopImmediatePropagation(); unlock(); dismissIntro(); } return; }
      if (st === 'settings' && menu.listening) {
        if (SHELL.passKeys.indexOf(key) >= 0 && key !== 'tab') return;   // wait for the real key
        e.preventDefault(); e.stopImmediatePropagation();
        if (key === 'escape') { menu.listening = null; announce('Cancelled.'); return; }
        rebind(key); return;
      }
      // A bare modifier is not "any key" (a Shift press must not start the game), and Tab keeps moving focus.
      if (SHELL.passKeys.indexOf(key) >= 0) { if (st !== 'playing') e.stopImmediatePropagation(); return; }
      var a = actionFor(key);
      if (a && a.id === 'mute') { e.preventDefault(); e.stopImmediatePropagation(); shell.toggleMute(); return; }
      if (st === 'playing') {
        if (key === 'escape' || (a && a.id === 'pause')) { e.preventDefault(); e.stopImmediatePropagation(); shell.pause(); return; }
        if (a && a.id === 'settings') { e.preventDefault(); e.stopImmediatePropagation(); shell.openSettings(); return; }
        if (a && !a.shell && !a.fixed) { e.preventDefault(); e.stopImmediatePropagation(); press(a, e); }
        return; // every other key belongs to the game
      }
      // Not playing: the shell takes every key.
      e.preventDefault(); e.stopImmediatePropagation();
      if (st === 'settings') {
        if (key === 'escape' || (a && a.id === 'settings')) { if (menu.page === 'keys') { menu.page = 'main'; menu.sel = 0; announce('Settings.'); } else announce(closeSettings()); return; }
        if (key === 'arrowup') { menuMove(-1); return; }
        if (key === 'arrowdown') { menuMove(1); return; }
        if (key === 'arrowleft') { menuChange(-1); return; }
        if (key === 'arrowright') { menuChange(1); return; }
        if ((key === 'enter' || key === ' ') && !e.repeat) menuActivate();
        return;
      }
      if (e.repeat) return;
      unlock();
      if (st === 'howto') { shell.closeHowTo(); return; }
      if (a && a.id === 'help') { shell.showHowTo(); return; }
      if (a && a.id === 'settings') { shell.openSettings(); return; }
      if (st === 'title') { shell.start(); return; }
      if (st === 'paused') {
        if (a && a.id === 'restart') shell.restart();
        else if (key === 'escape' || (a && a.id === 'pause') || key === 'enter' || key === ' ') shell.resume();
        return;
      }
      if (shell.isOver() && canRestart()) shell.restart();
    }
    function onKeyUp(e){
      var a = actionFor((e.key || '').toLowerCase());
      if (a && a.hold && settings.holds !== 'toggle') { down[a.id] = false; if (shell.state === 'playing') e.stopImmediatePropagation(); }
    }
    // Returns true when the tap was the shell's. Wired automatically when opts.canvas is set.
    shell.pointer = function(x, y){
      var st = shell.state, b = touchRow(shell.buttons(view.W, view.H, view.ui));
      unlock();
      if (introUp) { dismissIntro(); return true; }
      if (st === 'settings') { menuPointer(x, y); return true; }
      if (inRect(x, y, b.mute)) { shell.toggleMute(); return true; }
      if (st !== 'howto' && inRect(x, y, b.settings)) { shell.openSettings(); return true; }
      if ((st === 'playing' || st === 'paused') && inRect(x, y, b.pause)) { shell.togglePause(); return true; }
      if (st === 'playing') return false;
      if (st === 'howto') shell.closeHowTo();
      else if (st === 'title') shell.start();
      else if (st === 'paused') shell.resume();
      else if (shell.isOver() && canRestart()) shell.restart();
      return true;
    };
    // Grow a hit box about its centre to minTouchCss on screen (view.css = CSS px per logical px).
    function touchable(r){
      if (!r) return r;
      var min = SHELL.minTouchCss / (view.css || 1), w = Math.max(r.w, min), h = Math.max(r.h, min);
      return { x: r.x - (w - r.w) / 2, y: r.y - (h - r.h) / 2, w: w, h: h, cx: r.cx };
    }
    // Grow all three, then make neighbours meet halfway instead of overlapping, so a tap
    // always lands on the button nearest the finger (a custom opts.buttons layout included).
    function touchRow(b){
      var out = { mute: touchable(b.mute), pause: touchable(b.pause), settings: touchable(b.settings) };
      var row = [out.settings, out.pause, out.mute].filter(Boolean).sort(function(p, q){ return p.x - q.x; });
      for (var i = 1; i < row.length; i++) {
        var L = row[i - 1], R = row[i], lr = L.x + L.w;
        if (lr > R.x) { var mid = (lr + R.x) / 2; L.w = mid - L.x; R.w = R.x + R.w - mid; R.x = mid; }
      }
      return out;
    }
    // Touch: opts.touch when the game says so, otherwise a coarse pointer or the first touch tap.
    var touchSeen = !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    function isTouch(){ return opts.touch !== undefined ? !!opts.touch : touchSeen; }
    function measureCss(){ if (opts.canvas && view.W) { var r = opts.canvas.getBoundingClientRect(); if (r.width) view.css = r.width / view.W; } }
    function onPointer(e){
      var c = opts.canvas, r = c.getBoundingClientRect();
      if (!r.width || !view.W) return;
      view.css = r.width / view.W;
      if (e.pointerType === 'touch') touchSeen = true;
      var x = (e.clientX - r.left) * view.W / r.width, y = (e.clientY - r.top) * view.H / r.height;
      if (shell.pointer(x, y)) { e.preventDefault(); e.stopImmediatePropagation(); }
    }
    function autoPause(){ clearHolds(false); if (shell.state === 'playing') shell.pause(); }
    function onVisibility(){
      var ac = opts.synth && opts.synth.context && opts.synth.context();
      if (document.hidden) { autoPause(); if (ac) ac.suspend(); }
      else if (ac && !shell.muted) ac.resume();
    }

    var intro = null;
    function dismissIntro(){ if (intro) intro.dismiss(); }
    shell.attach = function(){
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('keyup', onKeyUp, true);
      if (opts.canvas) {
        // Capture on the target runs before the game's own listener, so a consumed tap never reaches it.
        opts.canvas.addEventListener('pointerdown', onPointer, true);
        if (!opts.canvas.hasAttribute('tabindex')) opts.canvas.setAttribute('tabindex', '0');
      }
      if (opts.autoPause !== false) { window.addEventListener('blur', autoPause); document.addEventListener('visibilitychange', onVisibility); }
      if (!live && typeof document !== 'undefined') {
        live = document.createElement('div');
        live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
        live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;';
        document.body.appendChild(live);
      }
      if (opts.intro) {
        introUp = true;
        var io = typeof opts.intro === 'object' ? opts.intro : {};
        intro = mountIntro(document.body, { hint: io.hint, autoDismissMs: io.autoDismissMs,
          onDismiss: function(){ introUp = false; if (opts.canvas) opts.canvas.focus({ preventScroll: true }); if (io.onDismiss) io.onDismiss(); } });
        intro.el.addEventListener('pointerdown', function(e){ e.preventDefault(); unlock(); dismissIntro(); });
      }
      return shell;
    };
    shell.detach = function(){
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
      if (opts.canvas) opts.canvas.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('blur', autoPause); document.removeEventListener('visibilitychange', onVisibility);
      if (live && live.parentNode) live.parentNode.removeChild(live);
      live = null;
      return shell;
    };
    if (opts.attach !== false) shell.attach();

    // ---- screens ----
    // Paused only resumes on pause, Enter, Space or a tap (a stray key must not unpause),
    // so a layout whose input words say ANY KEY names the pause key there instead.
    function prompt(verb){
      if (opts.prompts && opts.prompts[verb]) return opts.prompts[verb];
      var input = verb === 'RESUME' && style.resumeInput ? 'PRESS ' + keyOf('pause') + ' OR TAP' : style.input;
      return input + ' TO ' + verb;
    }
    function keyLegend(){
      var rows = [];
      if (opts.actions) actions.forEach(function(a){ if (!a.shell) rows.push([a.display || keyName(a.keys[0] || ''), a.label]); });
      else (opts.controls || []).forEach(function(r){ rows.push(r); });
      ['pause', 'mute', 'help', 'settings'].forEach(function(id){ rows.push([keyOf(id), action(id).label]); });
      return rows;
    }
    // The player-facing accessibility list: what SETTINGS can change in this game.
    function settingsSummary(){
      var s = ['SPEED'];
      if (opts.timer) s.push('TIMER');
      if (hasHolds) s.push('HELD KEYS');
      if (opts.steering) s.push('STEERING');
      s.push('KEYS', 'MOTION');
      return keyOf('settings') + ' SETTINGS: ' + s.join(', ');
    }
    function screenLines(){
      var st = shell.state, L = [], ink = COLORS.ink, faint = COLORS.inkMuted;
      function line(text, size, o){ o = o || {}; L.push({ text: text, size: size, color: o.color || ink, glow: o.glow === undefined ? style.gBody : o.glow, blink: o.blink, gap: o.gap || 0, alpha: o.alpha, table: o.table }); }
      if (st === 'title') {
        line(opts.title || 'CLASSIC PLUS', style.title, { glow: style.gTitle, gap: 18 });
        (opts.howTo || []).slice(0, 3).forEach(function(t){ line(t, style.body, { color: faint }); });
        line(prompt('START'), style.body, { blink: true, gap: 22 });
        if (shell.best > 0) line('BEST ' + pad(shell.best), style.small, { color: faint, gap: 14 });
        line(keyOf('help') + ' HOW TO PLAY   ' + keyOf('settings') + ' SETTINGS   ' + keyOf('mute') + ' SOUND', style.small, { color: faint, gap: shell.best > 0 ? 6 : 14, glow: 0 });
      } else if (st === 'howto') {
        line('HOW TO PLAY', style.head, { glow: style.gTitle, gap: 18 });
        (opts.howTo || []).forEach(function(t){ line(t, style.body); });
        var rws = keyLegend(), kw = 0;
        rws.forEach(function(r){ kw = Math.max(kw, r[0].length); });
        rws.forEach(function(r, i){ line(r[0].toUpperCase().padEnd(kw + 2, ' ') + r[1], style.small, { color: faint, table: true, gap: i ? 0 : 18 }); });
        line(settingsSummary(), style.small, { color: faint, gap: 12 });
        line(prompt(startAfterHelp ? 'START' : 'GO BACK'), style.body, { blink: true, gap: 22 });
      } else if (st === 'paused') {
        line('PAUSED', style.head, { glow: style.gTitle, gap: 14 });
        line('SCORE ' + pad(shell.score), style.score);
        line(prompt('RESUME'), style.body, { blink: true, gap: 22 });
        line(keyOf('restart') + ' RESTART   ' + keyOf('help') + ' HELP   ' + keyOf('settings') + ' SETTINGS', style.small, { color: faint, gap: 10, glow: 0 });
      } else if (shell.isOver()) {
        var res = shell.result || {};
        line(res.title || (st === 'won' ? 'ALL CLEAR' : 'GAME OVER'), style.title, { glow: style.gTitle, gap: 18 });
        line(pad(shell.score), style.score, { glow: style.gBody + 1 });
        (res.lines || []).slice(0, 2).forEach(function(t){ line(t, style.small, { color: faint }); });
        if (shell.practice) line('PRACTICE - TIMER OFF', style.small, { color: faint, gap: 10 });
        else if (shell.newBest) line('NEW BEST', style.body, { color: COLORS.signal, glow: style.gTitle, gap: 10 });
        else line('BEST ' + pad(shell.best), style.small, { color: faint, gap: 10 });
        // The prompt waits out the restart guard; its row is kept so nothing jumps when it appears.
        line(prompt('PLAY AGAIN'), style.body, { blink: true, gap: 22, alpha: canRestart() ? 1 : 0 });
      }
      return L;
    }
    function drawLines(ctx, L, W, H, ui){
      var total = 0, i, l, maxW = W - 32 * ui, now = Date.now();
      // Body and small lines wrap rather than shrink below the text floor; only titles shrink to fit.
      var wrapped = [];
      L.forEach(function(x){
        if (typeof x.text === 'string' && !x.table && x.size <= style.body && inkWidth(x.text, x.size * ui) > maxW) {
          wrapVectorText(x.text, x.size * ui, maxW).forEach(function(row, n){ var c = {}; for (var key in x) c[key] = x[key]; c.text = row; if (n) c.gap = 0; wrapped.push(c); });
        } else wrapped.push(x);
      });
      L = wrapped;
      for (i = 0; i < L.length; i++) {
        l = L[i];
        l.plain = shellPlain(l.text);
        l.px = Math.min(l.size * ui, maxW / Math.max(1, inkWidth(l.plain, 1)));
        total += l.gap * ui + 12 * l.px + (i < L.length - 1 ? 10 * ui : 0);
      }
      var tableW = 0;
      for (i = 0; i < L.length; i++) if (L[i].table) tableW = Math.max(tableW, inkWidth(L[i].plain, L[i].px));
      var y = H / 2 - total / 2;
      for (i = 0; i < L.length; i++) {
        l = L[i]; y += l.gap * ui + 12 * l.px;
        var show = !(l.blink && !motion.reduced && !blinkOn(now)) && l.alpha !== 0;
        if (show) {
          ctx.save(); if (l.alpha !== undefined) ctx.globalAlpha = l.alpha;
          // Spans are set one after another from the line's left ink edge, monospaced.
          var sx = l.table ? W / 2 - tableW / 2 : W / 2 - inkWidth(l.plain, l.px) / 2, sp = shellSpans(l.text);
          for (var j = 0; j < sp.length; j++) {
            drawVectorText(ctx, sp[j].text, sx, y, l.px, { align: 'left', alignOn: 'advance', color: sp[j].color || l.color, glow: l.glow, uiScale: ui, glowScale: style.glowScale });
            sx += String(sp[j].text).length * 12 * l.px;
          }
          ctx.restore();
        }
        y += 10 * ui;
      }
    }

    // Settings: a two-column list, label left and value right, the chosen row in signal with
    // < > around a value that can change. Every row is at least minTouchCss tall on screen.
    function menuLayout(W, H, ui){
      var R = rows(), rowH = Math.max(34 * ui, SHELL.minTouchCss / (view.css || 1)), colW = Math.min(W - 56 * ui, 380 * ui);
      var top = 0, headH = 2 * 12 * style.small * ui + 70 * ui, footH = 3 * 12 * style.small * ui + 30 * ui;
      rowH = Math.min(rowH, Math.max(28 * ui, (H - headH - footH) / R.length));
      top = Math.max(headH, (H - R.length * rowH - footH + headH) / 2);
      return { R: R, rowH: rowH, colW: colW, x0: (W - colW) / 2, top: top };
    }
    function menuPointer(x, y){
      if (menu.listening) { menu.listening = null; announce('Cancelled.'); return; }
      var M = menuLayout(view.W, view.H, view.ui), i = Math.floor((y - M.top) / M.rowH);
      if (i < 0 || i >= M.R.length || x < M.x0 - 20 || x > M.x0 + M.colW + 20) { if (y > M.top + M.R.length * M.rowH) { menu.sel = M.R.length - 1; menuActivate(); } return; }
      menu.sel = i;
      var r = M.R[i];
      if (r.change && x > M.x0 + M.colW * 0.5) menuChange(x < M.x0 + M.colW * 0.75 ? -1 : 1);
      else menuActivate();
    }
    function drawSettings(ctx, W, H, ui){
      measureCss();
      var M = menuLayout(W, H, ui), faint = COLORS.inkMuted, size = style.small * ui;
      if (menu.sel >= M.R.length) menu.sel = 0;
      var title = menu.page === 'keys' ? 'KEYS' : 'SETTINGS', ts = Math.min(style.head * ui, (W - 32 * ui) / inkWidth(title, 1));
      drawVectorText(ctx, title, W / 2, M.top - 30 * ui, ts, { align: 'center', color: COLORS.ink, glow: style.gTitle, uiScale: ui, glowScale: style.glowScale });
      for (var i = 0; i < M.R.length; i++) {
        var r = M.R[i], on = i === menu.sel, y = M.top + i * M.rowH + M.rowH / 2 + 6 * size, col = on ? COLORS.signal : COLORS.ink;
        if (on) { ctx.save(); ctx.fillStyle = COLORS.cardSelected; ctx.fillRect(M.x0 - 10 * ui, M.top + i * M.rowH + 2 * ui, M.colW + 20 * ui, M.rowH - 4 * ui); ctx.restore(); }
        var label = r.label, value = r.value(), ls = Math.min(size, (M.colW * 0.55) / Math.max(1, inkWidth(label, 1)));
        drawVectorText(ctx, label, M.x0, y, ls, { color: col, glow: on ? 4 : 0, uiScale: ui, glowScale: style.glowScale });
        if (value) {
          var shown = on && r.change ? '< ' + value + ' >' : value, vs = Math.min(size, (M.colW * 0.45) / Math.max(1, inkWidth(shown, 1)));
          drawVectorText(ctx, shown, M.x0 + M.colW, y, vs, { align: 'right', color: menu.listening && on ? COLORS.coin : col, glow: on ? 4 : 0, uiScale: ui, glowScale: style.glowScale });
        }
      }
      var fy = M.top + M.R.length * M.rowH + 24 * ui, hint = menu.listening ? 'PRESS ONE KEY   ESC CANCELS' : 'UP DOWN CHOOSE   LEFT RIGHT CHANGE';
      [menu.note, hint, menu.listening ? '' : 'ENTER SELECT   ESC BACK'].forEach(function(t, j){
        if (!t) return;
        var s2 = Math.min(size, (W - 32 * ui) / inkWidth(t, 1));
        drawVectorText(ctx, t, W / 2, fy + j * 18 * ui, s2, { align: 'center', color: j === 0 ? COLORS.coin : faint, glow: 0, uiScale: ui, glowScale: style.glowScale });
      });
    }

    shell.draw = function(ctx, W, H, ui){
      ui = ui || 1; view.W = W; view.H = H; view.ui = ui; measureCss();
      var st = shell.state;
      if (st !== 'playing') {
        if (style.scrim || st === 'settings') { ctx.fillStyle = style.scrimColor || COLORS.scrim; ctx.fillRect(0, 0, W, H); }
        if (st === 'settings') { ctx.fillStyle = COLORS.scrim; ctx.fillRect(0, 0, W, H); drawSettings(ctx, W, H, ui); }
        else drawLines(ctx, screenLines(), W, H, ui);
      }
      if (opts.buttons !== false && st !== 'howto' && st !== 'settings') {
        var b = shell.buttons(W, H, ui);
        if (b.settings) drawSettingsGlyph(ctx, b.settings, 1, ui, bar);
        if (b.pause && (st === 'playing' || st === 'paused')) drawPauseGlyph(ctx, b.pause, st === 'paused', 1, ui, bar);
        if (b.mute) drawSoundGlyph(ctx, b.mute, shell.muted, 1, ui, bar);
      }
    };
    return shell;
  }

  window.ClassicPlus = {
    COLORS: COLORS, GLOW_SCALE: GLOW_SCALE, TWO_PI: TWO_PI,
    clamp: clamp, rand: rand, lerp: lerp,
    setupCanvas: setupCanvas, uiScale: uiScale, gameplayScale: gameplayScale, blinkOn: blinkOn,
    VECTOR_FONT: VECTOR_FONT, drawVectorText: drawVectorText, measureVectorText: measureVectorText, inkWidth: inkWidth, wrapVectorText: wrapVectorText,
    LOGO_PATHS: LOGO_PATHS, drawLogo: drawLogo, logoSvg: logoSvg,
    mountIntro: mountIntro, drawHintCanvas: drawHintCanvas,
    createScopeGrid: createScopeGrid, drawVignette: drawVignette, drawPlayAreaBoundary: drawPlayAreaBoundary,
    SUNRISE: SUNRISE, skyAt: skyAt, createSunriseSky: createSunriseSky, createHueSky: createHueSky,
    BURST_PRESETS: BURST_PRESETS, createPixelBurst: createPixelBurst,
    GHOST: GHOST, drawGhosts: drawGhosts, smoothVelocity: smoothVelocity,
    drawShip: drawShip, makeAsteroid: makeAsteroid, drawAsteroid: drawAsteroid, drawSaucer: drawSaucer, drawStation: drawStation,
    drawPickup: drawPickup, drawBullet: drawBullet, drawDrone: drawDrone, drawMissile: drawMissile,
    BRICKS: BRICKS, WALL: WALL, parseWall: parseWall, drawBrick: drawBrick, drawBrickMarks: drawBrickMarks, BRICK_MARK: BRICK_MARK, drawPaddle: drawPaddle, drawBall: drawBall, drawCatchMeter: drawCatchMeter,
    drawLifeIcons: drawLifeIcons, drawCurrency: drawCurrency, drawHud: drawHud, drawStatHud: drawStatHud, createSearchlight: createSearchlight,
    OVERLAYS: OVERLAYS, drawOverlay: drawOverlay,
    ICONS: ICONS, drawIcon: drawIcon,
    FIRE: { idle: FIRE_IDLE }, BURST: { debrisMinAlpha: BURST_DEBRIS_MIN_ALPHA },
    SHOP: SHOP, shopLayout: shopLayout, drawShopCard: drawShopCard, drawShopButton: drawShopButton, drawPageArrow: drawPageArrow,
    fireButtonGeometry: fireButtonGeometry, drawFireButton: drawFireButton,
    PING_SCALE: PING_SCALE, createSynth: createSynth,
    SHELL: SHELL, createShell: createShell, keyName: keyName, motionReduced: motionReduced, setMotionReduced: setMotionReduced
  };
})();
