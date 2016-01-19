
var source = null;
window.addEventListener('message', function(e) {
  if ('value' in e.data) {
    showResults(e.data.value);
  } else if ('keycode' in e.data) {
    navigateResults(e.data.keycode);

    var currentSelected = results.childNodes[_current];
    Services.urlbar.method('navigate', {
      url: currentSelected.url,
      load: e.data.keycode === 13
    });
  }
});


function createEngine(infos) {
  let engine = document.createElement('span');
  engine.id = infos.name;
  engine.className = 'engine';
  engine.style.backgroundImage = 'url(' + infos.icons[0] + ')';
  engine.setAttribute('suggestion', infos.suggestion);
  engine.setAttribute('url', infos.url);
  engine.setAttribute('description', infos.description);

  let container = document.getElementById('engines-container');
  container.appendChild(engine);

  if (container.childNodes.length === 1) {
    container.firstChild.classList.add('selected');
  }
}

let engines = [];

Services.suggestions.method('getPlugins').then(function(plugins) {
  plugins.forEach(function(plugin) {
    createEngine(plugin);
  });

  engines = plugins;
});

function selectEngine(shortcut) {
  let engines = document.querySelectorAll('.engine');
  Array.prototype.forEach.call(engines, function(engine) {
    let match = engine.id[0].toLowerCase() === shortcut;
    engine.classList.toggle('selected', match);
  });
}

function getSelectedEngine() {
  return document.querySelector('.engine.selected');
}

function getSuggestionsDescription(value) {
  let desc = '';
  if (getSelectedEngine()) {
    desc = getSelectedEngine().getAttribute('description');
  }

  return desc;
}

function getSuggestionsUrl(value) {
  let url = '';
  if (getSelectedEngine()) {
    url = getSelectedEngine().getAttribute('suggestion');
    url = url.replace('{searchTerms}', value);
    url = url.replace('{moz:locale}', 'en-US');
  }

  return url;
}

function getNavigationUrl(value) {
  let url = '';
  if (getSelectedEngine()) {
    url = getSelectedEngine().getAttribute('url');
    url = url.replace('{searchTerms}', value);
    url = url.replace(/ /g, '%20');
    url = url.replace('{moz:locale}', 'en-US');
  }

  return url;
}


function navigateResults(keycode) {
  switch (keycode) {
    case 38:
      selectPrevious();
      break;

    case 40:
      selectNext();
      break;
  }
}

var _current = 0;
function selectPrevious() {
  var currentSelected = results.childNodes[_current];
  if (_current <= 0) {
    return;
  }

  currentSelected.removeAttribute('selected');
  results.childNodes[--_current].setAttribute('selected', 'true');
}

function selectNext() {
  var currentSelected = results.childNodes[_current];
  if (_current >= results.childNodes.length - 1) {
    return;
  }

  currentSelected.removeAttribute('selected');
  results.childNodes[++_current].setAttribute('selected', 'true');
}

function showResults(value) {
  let values = value.split(' ');
  if (values.length >= 2 && values[0].length === 1) {
    selectEngine(values[0]);
    values.shift();
    value = values.join(' ');
  }

  let results = document.getElementById('results');
  results.innerHTML = '';

  createElement(value, getNavigationUrl(value), getSuggestionsDescription(), 'suggestion');

  let url = getSuggestionsUrl(value);
  
  let promises = [
      Services.history.method('getMatches', value)
    , Services.suggestions.method('get', url)
  ]

  Promise.all(promises).then(([histories, suggestions]) => {
    let historyCount = 5;
    for (let i = 0; i < Math.min(histories.length, historyCount); i++) {
      createElement(histories[i].url, histories[i].url, histories[i].title, 'history');
    }

    let suggestionsCount = Math.min(6 - results.childNodes.length, 3);
    for (let i = 0; i < Math.min(suggestions.length, suggestionsCount); i++) {
      createElement(suggestions[i], getNavigationUrl(suggestions[i]), getSuggestionsDescription(), 'suggestion');
    }

    _current = 0;
    results.childNodes[0].setAttribute('selected', 'true');
  });
}

function createElement(value, url, title, type) {
  var element = document.createElement('li');
  element.className = 'result ' + type;
  element.url = url;

  var text = document.createElement('span');
  text.className = 'text';
  text.textContent = value;
  element.appendChild(text);

  if (title) {
    var text2 = document.createElement('span');
    text2.className = 'title';
    text2.textContent = ' - ' + title;
    element.appendChild(text2);
  }

  var results = document.getElementById('results');
  results.appendChild(element);

  return element;
}


addEventListener('load', function() {
  window.frameElement.dispatchEvent(new CustomEvent('load'));
});
