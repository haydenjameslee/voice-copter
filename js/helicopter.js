'use strict';

var KEY = {
  'BACKSPACE': 8, 'TAB': 9, 'NUM_PAD_CLEAR': 12, 'ENTER': 13, 'SHIFT': 16,
  'CTRL': 17, 'ALT': 18, 'PAUSE': 19, 'CAPS_LOCK': 20, 'ESCAPE': 27,
  'SPACEBAR': 32, 'PAGE_UP': 33, 'PAGE_DOWN': 34, 'END': 35, 'HOME': 36,
  'ARROW_LEFT': 37, 'ARROW_UP': 38, 'ARROW_RIGHT': 39, 'ARROW_DOWN': 40,
  'PRINT_SCREEN': 44, 'INSERT': 45, 'DELETE': 46, 'SEMICOLON': 59,
  'WINDOWS_LEFT': 91, 'WINDOWS_RIGHT': 92, 'SELECT': 93,
  'NUM_PAD_ASTERISK': 106, 'NUM_PAD_PLUS_SIGN': 107,
  'NUM_PAD_HYPHEN-MINUS': 109, 'NUM_PAD_FULL_STOP': 110,
  'NUM_PAD_SOLIDUS': 111, 'NUM_LOCK': 144, 'SCROLL_LOCK': 145,
  'EQUALS_SIGN': 187, 'COMMA': 188, 'HYPHEN-MINUS': 189,
  'FULL_STOP': 190, 'SOLIDUS': 191, 'GRAVE_ACCENT': 192,
  'LEFT_SQUARE_BRACKET': 219, 'REVERSE_SOLIDUS': 220,
  'RIGHT_SQUARE_BRACKET': 221, 'APOSTROPHE': 222
};

var context;
var analyser;
var backgroundNoise;
var canvas;

(function () {
  /* 0 - 9 */
  for (var i = 48; i <= 57; i++) {
    KEY['' + (i - 48)] = i;
  }
  /* A - Z */
  for (i = 65; i <= 90; i++) {
    KEY['' + String.fromCharCode(i)] = i;
  }
  /* NUM_PAD_0 - NUM_PAD_9 */
  for (i = 96; i <= 105; i++) {
    KEY['NUM_PAD_' + (i - 96)] = i;
  }
  /* F1 - F12 */
  for (i = 112; i <= 123; i++) {
    KEY['F' + (i - 112 + 1)] = i;
  }
})();

var Heli = {};

Heli.Consts = [
  {name: 'State', consts: ['WAITING', 'PAUSED', 'PLAYING', 'DYING', 'BACKGROUND']},
  {name: 'Dir',   consts: ['UP', 'DOWN']}
];

Heli.FOOTER_HEIGHT = 20;
Heli.FPS           = 10;

Heli.Color = {
  BACKGROUND  : '#C3CCB5', BLOCK         : '#403B37',
  HOME_TEXT   : '#403B37', RAND_BLOCK    : '#403B37',
  USER        : '#FFFF00', TARGET_STROKE : '#B24524',
  DIALOG_TEXT : '#333333', FOOTER_BG     : '#403B37',
  FOOTER_TEXT : '#C3CCB5'
};

Heli.User = function (params) {

  var _distance = 0;
  var position = null;
  var _trail   = null;
  var momentum = 2;

  function finished() {
    var leaderboard = new Clay.Leaderboard( { id: 2638 } );
    if (_distance > bestDistance() && _distance > 25) {
      localStorage.bestDistance = _distance;
      var person = prompt("Please enter your name","");
      var options = {
          score: _distance,
          name: person
      }
      var show_options = { // all of these are optional
          recent: 3600, // Optional, to limit scores to ones posted in last x seconds
          sort: 'desc', // Optional, sorting by "asc" will show the lowest scores first (ex. for fastest times)
          filter: ['day', 'month'], // Optional, Array of filters to narrow down high scores
          cumulative: false, // Optional, if set to true grabs the sum of all scores for each player
          best: false, // Optional, if set to true grabs the best score from each player
          limit: 10, // Optional, how many scores to show (0 for all). Default is 10
          self: false, // Optional, Boolean if set to true shows just the scores of the player viewing
          friends: false, // Optional, Boolean if set to true shows just the scores of the player viewing AND their Clay.io friends
          showPersonal: true // Optional, Boolean on if the player's stats (rank & high score) should show below the name. Default is false
      };
      
      leaderboard.post( options, function( response ) {
          // Callback
        leaderboard.show( show_options, function( response ) { // Optional
          console.log( response );
        });
          console.log( response );
      });
    }
  }

  function bestDistance() {
    return parseInt(localStorage.bestDistance || 0, 10);
  }

  function distance() {
    return _distance;
  }

  function reset() {
    _distance = 0;
    position = 70;
    _trail = [];
    momentum = 0;
  }

  function move(thrusters) {

    _distance += 1;

    momentum += ((thrusters) ? 0.4 : -0.5);
    position += momentum;

    if (params.tick() % 2 === 0) {
      _trail.push(position);
    }

    if (_trail.length > 4) {
      _trail.shift();
    }

    return position;
  }

  function trail() {
    return _trail;
  }

  return {
    reset: reset,
    move: move,
    trail: trail,
    distance:distance,
    finished: finished,
    bestDistance: bestDistance
  };
};

Heli.Screen = function (params) {

  var _width = params.width;
  var _height = params.height;
  var _numLines = 30;
  var _direction = Heli.Dir.UP;
  var _lineWidth = _width / _numLines;
  var _lineHeight = _height / 100;
  var _gap = null;
  var _randomBlock = null;
  var magnitude = null;
  var changeDir = 0;
  var _blockY = null;
  var _blockHeight = 20;
  var heliHeight = (30 / params.height) * 100; // Convert px to %
  var _terrain = [];
  var img = new Image();
  var img2 = new Image();

  img.src = 'style/img/heli.png';
  img2.src = 'style/img/heli2.png';

  function width() { return _width; }
  function height() { return _height; }

  function init() {

    magnitude = null;
    changeDir = 0;
    _randomBlock = null;
    _gap = 80;
    _terrain = [];

    var size = (100 - _gap) / 2;
    var obj  = {top: size, bottom: size};

    for (var i = 0; i < _numLines; i += 1) {
      _terrain.push(obj);
    }
  }

  function draw(ctx) {
    ctx.fillStyle = Heli.Color.BACKGROUND;
    ctx.fillRect(0, 0, _width, _height);
    ctx.fill();
  }

  function toPix(userPos) {
    return _height - (_height * (userPos / 100));
  }

  function randomNum(low, high) {
    return low + Math.floor(Math.random() * (high - low));
  }

  function moveTerrain() {

    var toAdd, len, rand;
    var last = _terrain[Math.round(_terrain.length-1)];

    if (_randomBlock === null) {
      rand = Math.floor(Math.random() * 50);
      if (params.tick() % rand === 0) {
        _randomBlock = _numLines;
        _blockY = randomNum(last.bottom, 100-last.top);
      }
    } else {
      _randomBlock -= 1;
      if (_randomBlock < 0) {
        _randomBlock = null;
      }
    }

    if (changeDir === 0) {
      _direction = (_direction === Heli.Dir.DOWN) ? Heli.Dir.UP : Heli.Dir.DOWN;
      len = (_direction === Heli.Dir.DOWN) ? last.bottom : last.top;
      magnitude = randomNum(1, 4);
      changeDir = randomNum(5, len / magnitude);
      if (params.tick() % 2 === 0) {
        if (_direction === Heli.Dir.DOWN) {
          last.top += 1;
        } else {
          last.bottom += 1;
        }
      }
    }

    changeDir--;

    toAdd = (_direction === Heli.Dir.UP) ?
      {top: -magnitude, bottom: magnitude} :
      {top: magnitude, bottom: -magnitude};

    _terrain.push({
      top: last.top + toAdd.top,
      bottom: last.bottom + toAdd.bottom
    });

    _terrain.shift();
  }

  function drawTerrain(ctx) {

    ctx.fillStyle = Heli.Color.BLOCK;

    for (var obj, bottom, i = 0; i < _numLines; i += 1) {
      obj = _terrain[i];
      bottom = obj.bottom;
      ctx.fillRect(Math.floor(i * _lineWidth), 0,
                   Math.ceil(_lineWidth), obj.top * _lineHeight);
      ctx.fillRect(Math.floor(i * _lineWidth),
                   _height - bottom * _lineHeight,
                   Math.ceil(_lineWidth),
                   _height);
    }

    if (_randomBlock !== null) {
      var start = toPix(_blockY);
      ctx.fillStyle = Heli.Color.RAND_BLOCK;

      ctx.fillRect(_randomBlock * _lineWidth, start,
                   _lineWidth, start - toPix(_blockY + _blockHeight));
    }
  }

  function drawUser(ctx, user, trail, alternate) {

    var i, len, mid, image;

    mid = Math.round(_terrain.length * 0.25);
    image = (alternate && params.tick()) % 4 < 2 ? img : img2;

    ctx.fillStyle = Heli.Color.USER;
    ctx.beginPath();
    ctx.drawImage(image, mid * _lineWidth - 40,
                  toPix(user) - (heliHeight / 2));
    ctx.fill();
    ctx.closePath();
  }

  function collided(pos) {

    var midPoint = Math.round(_terrain.length * 0.25);
    var middle = _terrain[midPoint];
    var size = heliHeight / 2;

    var hitBlock = (_randomBlock === midPoint ||
                    _randomBlock === midPoint-1) &&
      (pos < (_blockY + size)) &&
      (pos > (_blockY - _blockHeight));

    return (pos > (100 - middle.top)) && 100 - middle.top ||
      pos < (middle.bottom + size) && (middle.bottom + size) ||
      hitBlock;
  }

  function drawTarget(ctx, pos, amount) {
    var mid = Math.round(_terrain.length * 0.25);

    ctx.strokeStyle = Heli.Color.TARGET_STROKE;
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.arc((mid * _lineWidth)-10, toPix(pos) + 10,
            50 - amount, 0, Math.PI * 2, false);
    ctx.stroke();
    ctx.closePath();
  }

  return {
    draw: draw,
    drawUser: drawUser,
    drawTerrain: drawTerrain,
    moveTerrain: moveTerrain,
    drawTarget: drawTarget,
    toPix: toPix,
    init: init,
    width: width,
    height: height,
    collided: collided
  };
};


var HELICOPTER = (function() {

  /* Generate Constants from Heli.Consts arrays */
  (function (glob, consts) {
    for (var x, i = 0; i < consts.length; i += 1) {
      glob[consts[i].name] = {};
      for (x = 0; x < consts[i].consts.length; x += 1) {
        glob[consts[i].name][consts[i].consts[x]] = x;
      }
    }
  })(Heli, Heli.Consts);

  var state = Heli.State.AUDIODETECT;
  var thrustersOn = false;
  var timer = null;
  var audio = null;
  var screen = null;
  var user = null;
  var pos = 0;
  var died = 0;
  var _tick = 0;
  var ctx;

  function keyDown(e) {

    if (e.keyCode === KEY.ENTER) {
      thrustersOn = true;
    }

    if (e.keyCode === KEY.S) {
      localStorage.soundDisabled = !soundDisabled();
    } else if (state === Heli.State.WAITING && e.keyCode === KEY.ENTER) {
      newGame();
    } else if (state === Heli.State.PLAYING && e.keyCode === KEY.P) {
      state = Heli.State.PAUSED;
      window.clearInterval(timer);
      timer = null;
      dialog('Paused');
    } else if (state === Heli.State.PAUSED && e.keyCode === KEY.P) {
      state = Heli.State.PLAYING;
      timer = window.setInterval(mainLoop, 1000/Heli.FPS);
    }
  }

  function keyUp(e) {
    if (e.keyCode === KEY.ENTER) {
      thrustersOn = false;
    }
  }

  function mouseDown(e) {
    if (e.target.nodeName === 'CANVAS' && state === Heli.State.WAITING) {
      listenToSound();
      newGame();
    } else if (e.target.nodeName === 'CANVAS' && state === Heli.State.BACKGROUND) {
      calibrateBackground();
    } 
  }

  function mouseUp(e) {
    thrustersOn = false;
  }

  function tick() {
    return _tick;
  }

  function newGame() {
    if (state != Heli.State.PLAYING) {
      user.reset();
      screen.init();
      timer = window.setInterval(mainLoop, 1000/Heli.FPS);
      state = Heli.State.PLAYING;
    }
  }

  function dialog(text) {
    var textWidth = ctx.measureText(text).width;
    var x = (screen.width() - textWidth) / 2;
    var y = (screen.height() / 2) - 7;

    ctx.fillStyle = Heli.Color.DIALOG_TEXT;
    ctx.font = '14px silkscreen';
    ctx.fillText(text, x, y);
  }

  function soundDisabled() {
    return localStorage.soundDisabled === 'true';
  }

  function mainLoop() {
    ++_tick;
    drawScore();
    if (state === Heli.State.PLAYING) {

      pos = user.move(thrustersOn);
      screen.moveTerrain();

      screen.draw(ctx);
      screen.drawTerrain(ctx);

      var tmp = screen.collided(pos);
      if (tmp !== false) {
        if (tmp !== true) {
          pos = tmp;
        }
        
        state = Heli.State.DYING;
        died = _tick;
        snapshot();
        user.finished();
      }
      screen.drawUser(ctx, pos, user.trail(), true);

    } else if (state === Heli.State.DYING && (_tick - died) > (Heli.FPS / 1)) {
      drawScore();
      dialog('Click to start again.');

      state = Heli.State.WAITING;
      window.clearInterval(timer);
      timer = null;
      drawScore();
    } else if (state === Heli.State.DYING) {

      screen.draw(ctx);
      screen.drawTerrain(ctx);
      screen.drawUser(ctx, pos, user.trail(), false);

      screen.drawTarget(ctx, pos, _tick - died);
    }
    drawScore();
    
  }


  function drawScore() {
    ctx.font = '12px silkscreen';
    var recordText = "Best: " + user.bestDistance() + "m";
    var distText = "Distance: " + user.distance() + "m";
    var textWidth = ctx.measureText(recordText).width;
    var textX = screen.height() + 15;

    //ctx.fillStyle = Heli.Color.FOOTER_BG;
    ctx.fillRect(0, screen.height(), screen.width(), Heli.FOOTER_HEIGHT);

    //ctx.fillStyle = Heli.Color.FOOTER_TEXT;
    ctx.fillText(distText, 20, 20);
    ctx.fillText(recordText, 20, 30);
  }

  function init(wrapper, root) {

    var width  = wrapper.offsetWidth;
    var height = wrapper.offsetHeight;
    canvas = document.createElement('canvas');

    canvas.setAttribute('width', width + 'px');
    canvas.setAttribute('height', height + 'px');

    wrapper.appendChild(canvas);

    ctx = canvas.getContext('2d');

    screen = new Heli.Screen({
      tick: tick,
      width: width,
      height: height
    });

    user = new Heli.User({"tick":tick});

    screen.init();
    screen.draw(ctx);

    dialog("Accept audio request above ^ to begin");

    // disable sound while it sucks
    if (typeof localStorage.soundDisabled === 'undefined') {
      localStorage.soundDisabled = true;
    }

  }

  function load(arr, loaded) {

    if (arr.length === 0) {
      loaded();
    } else {
      var x = arr.pop();
    }
  }

  function drawVisualizer(volume) {
    //window.webkitRequestAnimationFrame(drawVisualizer, canvas);
    //ctx.fillRect(canvas.width/4, canvas.height/3, 20, -volume);
  }

  function fallback(e) {
    alert("You must be using Chrome");
  }

  var video = document.querySelector('video');
  var localMediaStream = null;
  var snapCanvas = document.getElementById('snapcanvas');
  var snapCtx = snapCanvas.getContext('2d');

  function detectBackgroundScreen() {
    drawScore();
    window.AudioContext = window.AudioContext ||
                      window.webkitAudioContext;

    var context = new AudioContext();
    analyser = context.createAnalyser();
    navigator.getUserMedia  = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;
  
    if(!navigator.getUserMedia) {
      fallback();
    } else {
        navigator.getUserMedia(
        {video: true, audio: true},
        function(stream) {
          var microphone = context.createMediaStreamSource(stream);
          microphone.connect(analyser);

          video.src = window.URL.createObjectURL(stream);
          localMediaStream = stream;

          state = Heli.State.BACKGROUND;

          screen.draw(ctx);
          screen.drawTerrain(ctx);

          ctx.fillStyle = Heli.Color.HOME_TEXT;
          ctx.font = '58px silkscreenbold';

          var text = 'BE QUIET!';
          var textWidth = ctx.measureText(text).width,
          x = (screen.width() - textWidth) / 2,
          y = screen.height() / 3;

          ctx.fillText(text, x, y);

          ctx.font = '14px silkscreen';

          ctx.fillText('Click mouse to begin background noise calibration', x + 5, y + 66);
        }, 
        // errorCallback
        function(err) {
          if(err.name === "PERMISSION_DENIED") {
            alert("You must accept audio permissions");
          }
        }
      );
    }
  }

  function dataURLtoBlob(dataURL) {
    // Decode the dataURL    
    var binary = atob(dataURL.split(',')[1]);
    // Create 8-bit unsigned array
    var array = [];
    for(var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    // Return our Blob object
    return new Blob([new Uint8Array(array)], {type: 'image/png'});
  }

  function snapshot() {
    if (localMediaStream) {
      snapCtx.drawImage(video, 0, 0, 640, 480, 0, 0, 640, 480);
      snapCtx.font = "40pt Calibri";
      snapCtx.fillStyle = 'white';
      snapCtx.fillText("@VoiceCopter", 40, 60);
      // "image/webp" works in Chrome.
      // Other browsers will fall back to image/png.
      var imageUrl = snapCanvas.toDataURL('image/webp');
      document.getElementById('snapshot').src = imageUrl;
      document.getElementsByClassName('addthis_button_pinterest_share')[0].setAttribute("addthis:url", imageUrl);
      //document.querySelector('video').style.display = "none";

      //document.getElementsByTagName('meta')[2].setAttribute('content', imageUrl);
    }
  }

  function startScreen() {
    state = Heli.State.WAITING;
    screen.draw(ctx);
    screen.drawTerrain(ctx);

    drawScore();

    ctx.fillStyle = Heli.Color.HOME_TEXT;
    ctx.font = '58px silkscreenbold';

    var text = 'VoiceCopter';
    var textWidth = ctx.measureText(text).width,
    x = (screen.width() - textWidth) / 2,
    y = screen.height() / 3;

    ctx.fillText(text, x, y);

    var t  = 'Be loud to fly. Be silent to fall.';

    ctx.font = '12px silkscreen';

    ctx.fillText(t, x + 5, y + 20);

    ctx.fillText('Click mouse to start', x + 5, y + 66);
  }

 function calibrateBackground() {
    var volumes = [];

    screen.draw(ctx);
    screen.drawTerrain(ctx);

    ctx.fillStyle = Heli.Color.HOME_TEXT;
    ctx.font = '58px silkscreenbold';

    var text = 'BE QUIET!';
    var textWidth = ctx.measureText(text).width,
    x = (screen.width() - textWidth) / 2,
    y = screen.height() / 3;

    ctx.fillText(text, x, y);


    var interval = setInterval(function () {
      var freqByteData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqByteData);
      var volume = getAverageVolume(freqByteData);
      drawVisualizer(volume);
      volumes.push(volume);
      //console.log(volume);
    }, 100);

    setTimeout(function () {
      clearInterval(interval);
      var sum = 0;
      for(var i = 0; i < volumes.length; i++){
          sum += volumes[i];
      }

      backgroundNoise = sum/volumes.length;
      //state = Heli.state.VOCALS;
      //detectBaseScreen();
      console.log(backgroundNoise);
      if(backgroundNoise == 0) {
        alert("Your mic is not on")
        calibrateBackground();
      }
      startScreen();
    }, 5000);

   
  }
  function listenToSound() {

    setInterval(function () {
      var freqByteData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqByteData);

      var volume = getAverageVolume(freqByteData) - backgroundNoise;
      var vocals = 50;
      if (vocals <= (volume * 3)) {
        thrustersOn = true;
      } else {
        thrustersOn = false;
      }
      //console.log(volume);
    }, 100);
  }

  function getAverageVolume(array) {
    var values = 0;
    var average;
    var max = 0;
    var length = array.length;

    for (var i = 0; i < length; i++) {
      values += Math.abs(array[i]);
    }
    average = values / length;
    return average;
  }


  function loaded() {
    document.addEventListener('keydown', keyDown, true);
    document.addEventListener('keyup', keyUp, true);

    document.addEventListener('mousedown', mouseDown, true);
    document.addEventListener('mouseup', mouseUp, true);

    detectBackgroundScreen();
  }

  return {
    init: init
  };
}());
