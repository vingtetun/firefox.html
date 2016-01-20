

define([
  '/src/shared/js/urlhelper.js',
  'engine-ui',
], function(UrlHelper, Engine) {

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

function processValue(value) {
  let rv = {
    shortcut: null,
    value: value,
    useSearchEngine: true
  };

  if (UrlHelper.isURL(value)) {
    if (UrlHelper.hasScheme(value)) {
      rv.value = value;
    } else {
      rv.value = 'http://' + value;
    }
    rv.url = rv.value;
    rv.useSearchEngine = false;
  } else if (value.length > 1 && value[1] == ' ') {
    let values = value.split(' ');
    rv.shortcut = values.shift();
    rv.value = values.join(' ');
  } else {
    rv.value = value;
  }

  return rv;
}

function showResults(value) {
  let results = document.getElementById('results');
  results.innerHTML = '';

  let infos = processValue(value);

  if (infos.shortcut) {
    Engine.selectWithShortcut(infos.shortcut);
  }

  if (infos.useSearchEngine) {
    let metadata = Engine.getMetadata(infos.value);
    infos.url = metadata.navigation;
    infos.description = metadata.description;
    infos.suggestions = metadata.suggestions;
  } else {
    infos.description = '';
    infos.suggestions = '';
  }

  if (infos.value === '') {
    return;
  }


  // XXX '' should be website or something like this
  createElement(infos.value, infos.url, infos.description, infos.useSearchEngine ? 'suggestion' : '');
  
  let promises = [Services.history.method('getMatches', infos.value)];
  if (infos.useSearchEngine) {
    promises.push(Services.suggestions.method('get', infos.suggestions));
  }

  Promise.all(promises).then(([histories, suggestions]) => {
    let historyCount = 5;
    for (let i = 0; i < Math.min(histories.length, historyCount); i++) {
      createElement(histories[i].url, histories[i].url, histories[i].title, 'history');
    }

    if (suggestions) {
      let suggestionsCount = Math.min(6 - results.childNodes.length, 3);
      for (let i = 0; i < Math.min(suggestions.length, suggestionsCount); i++) {

        let rv = Engine.getMetadata(suggestions[i]);
        createElement(suggestions[i], rv.navigation, rv.description, 'suggestion');
      }
    }

    for (let i = results.childElementCount; i < historyCount; i++) {
      createBlankElement();
    }

    _current = 0;
    results.childNodes[0].setAttribute('selected', 'true');
  });
}

function createBlankElement() {
  var element = document.createElement('li');
  element.className = 'result blank';

  var results = document.getElementById('results');
  results.appendChild(element);

  return element;
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
});
