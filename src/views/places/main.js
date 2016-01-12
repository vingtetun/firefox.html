
var source = null;
window.addEventListener('message', function(e) {
  if ('value' in e.data) {
    showResults(e.data.value);
  } else if ('keycode' in e.data) {
    navigateResults(e.data.keycode);

    var currentSelected = results.childNodes[_current];
    Services.urlbar.method('navigate', {
      url: currentSelected.firstChild.textContent,
      load: e.data.keyCode === 13
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

function showResults(value) {
  let results = document.getElementById('results');
  results.innerHTML = '';

  createElement(value, 'Yahoo Search', 'suggestion');

  let promises = [
      Services.history.method('getMatches', value)
    , Services.suggestions.method('get', value)
  ]

  Promise.all(promises).then(([histories, suggestions]) => {
    let historyCount = 5;
    for (let i = 0; i < Math.min(histories.length, historyCount); i++) {
      createElement(histories[i].url, histories[i].title, 'history');
    }

    let suggestionsCount = Math.min(6 - results.childNodes.length, 3);
    for (let i = 0; i < Math.min(suggestions.length, suggestionsCount); i++) {
      createElement(suggestions[i], '', 'suggestion');
    }

    _current = 0;
    results.childNodes[0].setAttribute('selected', 'true');
  });
}

function createElement(value, title, type) {
  var element = document.createElement('li');
  element.className = 'result ' + type;

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
