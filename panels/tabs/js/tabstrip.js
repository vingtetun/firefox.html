/**
 * tabstrip.js
 *
 * This code controls the UI of the tabs.
 * A tab is: a favicon, a title and the close button.
 * The web content is *not* handled here.
 *
 */


require(['tabs'], function(Tabs) {
  'use strict';

  function isMaximized() {
    return window.outerHeight === screen.availHeight &&
           window.outerWidth === screen.availWidth;
  }

  let link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'style/tabstrip.css';
  let defaultStyleSheet = document.querySelector('link[title=default]');
  document.head.insertBefore(link, defaultStyleSheet.nextSibling);

  // Build the container. A hbox on top of the deck.
  // <hbox class='tabstrip'></hbox>
  // Tabs will be appended in there.
  let tabstrip = document.createElement('hbox');
  tabstrip.className = 'tabstrip toolbar';

  let tabscontainer = document.createElement('hbox');
  tabscontainer.setAttribute('flex', 1);
  tabscontainer.className = 'tabscontainer';
  tabstrip.appendChild(tabscontainer);

  let windowcontrols = document.createElement('hbox');
  windowcontrols.className = 'windowcontrols';
  windowcontrols.setAttribute('align', 'center');
  windowcontrols.setAttribute('valign', 'center');
  tabstrip.appendChild(windowcontrols);

  {
    let element = document.createElement('button');
    element.className = 'controls minimize';
    windowcontrols.appendChild(element);
    element.addEventListener('click', function() {
      window.minimize();
    });
  }


  {
    let element = document.createElement('button');
    if (isMaximized()) {
      element.className = 'controls restore';
    } else {
      element.className = 'controls maximize';
    }

    element.addEventListener('click', function() {
      if (isMaximized()) {
        window.restore();
        element.className = 'controls maximize';
      } else {
        window.maximize();
        element.className = 'controls restore';
      }
    });

    windowcontrols.appendChild(element);
  }

  {
    let element = document.createElement('button');
    element.className = 'controls close';
    windowcontrols.appendChild(element);
    element.addEventListener('click', function() {
      window.close();
    });
  }

  let outervbox = document.querySelector('#outervbox');
  outervbox.insertBefore(tabstrip, outervbox.firstChild);

  // Where will store the tab objects, with their linked
  // <tab-iframe>
  const allTabs = new Map();

  // Tab JS object. This should use web components.
  // issue #64
  function Tab(config={}) {
    let hbox = document.createElement('hbox');
    hbox.className = 'tab';
    hbox.setAttribute('align', 'center');

    let throbber = document.createElement('div');
    throbber.className = 'throbber';

    let favicon = document.createElement('img');
    favicon.className = 'favicon';

    let title = document.createElement('hbox');
    title.className = 'title';

    let button = document.createElement('button');
    button.className = 'close-button';
    button.title = 'Close Tab';

    button.onmouseup = (event) => {
      if (event.button == 0) {
        event.stopPropagation();
        Tabs.remove(config.uuid);
      }
    };

    hbox.onmousedown = (event) => {
      if (event.button == 0) {
        Tabs.select(config.uuid);
      }
    };

    hbox.onmouseup = (event) => {
      if (event.button == 1) {
        event.stopPropagation();
        Tabs.remove(config.uuid);
      }
    }

    hbox.appendChild(throbber);
    hbox.appendChild(favicon);
    hbox.appendChild(title);
    hbox.appendChild(button);

    this.config = config;
    this.dom = hbox;

    tabscontainer.appendChild(this.dom);
    this.updateDom();
  }

  Tab.prototype = {
    destroy: function() {
      this.config = null;
      this.dom.remove();
    },

    select: function() {
      this.dom.classList.add('selected');
    },

    move: function(direction) {
      let dom = this.dom;

      if (direction === -1 && dom.previousSibling) {
        dom.parentNode.insertBefore(dom, dom.previousSibling);
      } else if (direction === 1 && dom.nextSibling) {
        dom.parentNode.insertBefore(dom, dom.nextSibling.nextSibling);
      }
    },

    unselect: function() {
      this.dom.classList.remove('selected');
    },

    updateDom: function() {
      if (this.config.loading) {
        this.dom.classList.add('loading');
      } else {
        this.dom.classList.remove('loading');
      }

      let title = this.config.title;
      if (!title) {
        if (this.config.url) {
          title = this.config.url;
        } else {
          title = 'New Tab';
        }
      }
      this.dom.querySelector('.title').textContent = title;
      this.dom.title = title;

      let faviconImg = this.dom.querySelector('.favicon');
      if (this.config.favicon) {
        faviconImg.src = this.config.favicon;
      } else {
        faviconImg.removeAttribute('src');
      }
    },
  };

  Tabs.on('update', (event, detail) => {
    let tab = allTabs.get(detail.uuid);
    if (tab) {
      tab.config = detail;
      tab.updateDom();
    }
  });

  Tabs.on('move', (event, detail) => {
    let tab = allTabs.get(detail.uuid);
    if (tab) {
      tab.move(detail.direction);
    }
  });

  Tabs.on('add', (event, detail) => {
    let tab = new Tab(detail);
    allTabs.set(detail.uuid, tab);
    if (detail.uuid == Tabs.getSelected().uuid) {
      tab.select();
    }
  });

  Tabs.on('remove', (event, detail) => {
    let tab = allTabs.get(detail.uuid);
    if (tab) {
      tab.destroy();
      allTabs.delete(detail.uuid);
    }
  });

  Tabs.on('select', (event, detail) => {
    let tab = allTabs.get(detail.uuid);
    if (tab) {
      tab.select();
    }
  });

  Tabs.on('unselect', (event, detail) => {
    let tab = allTabs.get(detail.uuid);
    if (tab) {
      tab.unselect();
    }
  });

  for (let config of Tabs) {
    let tab = new Tab(config);
    allTabs.set(config.uuid, tab);
  }

  let config = Tabs.getSelected();
  if (config) {
    let tab = allTabs.get(config.uuid);
    tab.select();
  }

  /* Build curved tabs */

  link.addEventListener('load', onDocumentLoaded);

  function onDocumentLoaded() {
    link.removeEventListener('load', onDocumentLoaded);
    BuildCurvedTabs();
  }

  function BuildCurvedTabs() {
    let curveDummyElt = document.querySelector('.dummy-tab-curve');
    let style = window.getComputedStyle(curveDummyElt);

    let curveBorder = style.getPropertyValue('--curve-border');
    let curveGradientStart = style.getPropertyValue('--curve-gradient-start');
    let curveGradientEnd = style.getPropertyValue('--curve-gradient-end');
    let curveHoverBorder = style.getPropertyValue('--curve-hover-border');
    let curveHoverGradientStart = style.getPropertyValue('--curve-hover-gradient-start');
    let curveHoverGradientEnd = style.getPropertyValue('--curve-hover-gradient-end');

    let c1 = document.createElement('canvas');
    c1.id = 'canvas-tab-selected';
    c1.hidden = true;
    c1.width = 3 * 28;
    c1.height = 28;
    drawBackgroundTab(c1, curveGradientStart, curveGradientEnd, curveBorder);
    document.body.appendChild(c1);

    let c2 = document.createElement('canvas');
    c2.id = 'canvas-tab-hover';
    c2.hidden = true;
    c2.width = 3 * 28;
    c2.height = 28;
    drawBackgroundTab(c2, curveHoverGradientStart, curveHoverGradientEnd, curveHoverBorder);
    document.body.appendChild(c2);


    function drawBackgroundTab(canvas, bg1, bg2, borderColor) {
      canvas.width = window.devicePixelRatio * canvas.width;
      canvas.height = window.devicePixelRatio * canvas.height;
      let ctx = canvas.getContext('2d');
      let r = canvas.height;
      ctx.save();
      ctx.beginPath();
      drawCurve(ctx, r);
      ctx.lineTo(3 * r, r);
      ctx.lineTo(0, r);
      ctx.closePath();
      ctx.clip();

      // draw background
      let lingrad = ctx.createLinearGradient(0, 0, 0, r);
      lingrad.addColorStop(0, bg1);
      lingrad.addColorStop(1, bg2);
      ctx.fillStyle = lingrad;
      ctx.fillRect(0, 0, 3 * r, r);

      // draw border
      ctx.restore();
      ctx.beginPath();
      drawCurve(ctx, r);
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    }

    function drawCurve(ctx, r) {
      let firstLine = 1 / window.devicePixelRatio;
      ctx.moveTo(r * 0, r * 0.984);
      ctx.bezierCurveTo(r * 0.27082458, r * 0.95840561,
                        r * 0.3853096, r * 0.81970962,
                        r * 0.43499998, r * 0.5625);
      ctx.bezierCurveTo(r * 0.46819998, r * 0.3905,
                        r * 0.485, r * 0.0659,
                        r * 0.95,  firstLine);
      ctx.lineTo(r + r * 1.05, firstLine);
      ctx.bezierCurveTo(3 * r - r * 0.485, r * 0.0659,
                        3 * r - r * 0.46819998, r * 0.3905,
                        3 * r - r * 0.43499998, r * 0.5625);
      ctx.bezierCurveTo(3 * r - r * 0.3853096, r * 0.81970962,
                        3 * r - r * 0.27082458, r * 0.95840561,
                        3 * r - r * 0, r * 0.984);
    }
  }

});
