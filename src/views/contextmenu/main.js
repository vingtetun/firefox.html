
var targetURI = null;
var documentURI = null;

window.addEventListener('message', function(e) {
  var data = e.data;

  function dumpObject(obj, level = 0) {
    var indent = '';
    for (var i = 0; i < level; i++) {
      indent += '\t';
    }

    for (var key in obj) {
      if (typeof obj[key] == 'object') {
        dump(indent + key + '\n');
        dumpObject(obj[key], level + 1);
      } else {
        dump(indent + key + ': ' + obj[key] + '\n');
      }
    }
  }

  //dumpObject(data);

  var element = document.querySelector('.contextmenu');
  element.style.left = data.clientX + 'px';
  element.style.top = (data.clientY + 39) + 'px';
  element.style.visibility = 'visible';

  targetURI = data.systemTargets[0].data.uri;
  documentURI = data.systemTargets[0].data.documentURI;
});

addEventListener('click', function(e) {
  var bc = new BroadcastChannel('tabs');

  dump('click: ' + e.target + ':' + e.target.id + '\n');
  switch (e.target.id) {
    case 'open-in-new-tab':
      bc.postMessage({
        action: 'create',
        options: {
          url: targetURI
        }
      });
      break;

    case 'view-page-source':
      bc.postMessage({
        action: 'view-source'
      });
      break;

    default:
      break;
  }
});

addEventListener('load', function(e) {
  window.frameElement.dispatchEvent(new CustomEvent('load'));
});
