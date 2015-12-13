
var source = null;
window.addEventListener('message', function(e) {
  source = e.source;

  if ('value' in e.data) {
    showResults(e.data.value);
  } else if ('keycode' in e.data) {
    navigateResults(e.data.keycode);

    var currentSelected = results.childNodes[_current];
    source.postMessage({
      'selected_value': currentSelected.firstChild.textContent
    }, '*');
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

var runningXHR = null;

function showResults(value) {
  var results = document.getElementById('results');

  if (runningXHR && runningXHR.cancel) {
    runningXHR.cancel();
  }

  results.innerHTML = '';

  createElement(value, 'Yahoo Search', 'suggestion');

  Services.history.method('getMatches', value).then(historyEntries => {
    for (var i = 0; i < Math.min(historyEntries.length, 5); i++) {
      createElement(historyEntries[i].url, historyEntries[i].title, 'history');
    }

    var suggestionsCount = Math.min(6 - results.childNodes.length, 3);
    if (suggestionsCount > 0) {
      var xhr = new XMLHttpRequest({mozSystem: true});
      var url = 'http://ff.search.yahoo.com/gossip?output=fxjson&command=';
      xhr.open('GET', url + value, true);
      xhr.send();

      xhr.onload = function() {
        runningXHR = null;

        var data = JSON.parse(xhr.response)[1];
        for (var i = 0; i < Math.min(data.length, suggestionsCount); i++) {
          createElement(data[i], '', 'suggestion');
        }
      }
    }

    _current = 0;
    results.childNodes[0].setAttribute('selected', 'true');
    runningXHR = xhr;
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
