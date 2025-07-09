
  const tabBar = document.getElementById('tabBar');
  const iframeContainer = document.getElementById('iframeContainer');
  let tabs = [];
  let tabCount = 0;
  let currentTabId = null;

  function getFavicon(url) {
    try {
      const domain = new URL(url).origin;
      return `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
    } catch {
      return 'images/default-icon.png'; 
    }
  }

  function addTab(url = 'default.html') {
    const tabId = ++tabCount;


    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.classList.add('pre-show');
    tab.dataset.id = tabId;
    const favicon = document.createElement('img');
    favicon.className = 'tab-favicon';
    favicon.src = getFavicon(url);
    favicon.style.width = '16px';
    favicon.style.height = '16px';
    favicon.style.marginRight = '6px';
    tab.appendChild(favicon);
    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-title';
    titleSpan.textContent = `Tab ${tabId}`;
    tab.appendChild(titleSpan);
    const closeBtn = document.createElement('img');
    closeBtn.className = 'close-btn';
    closeBtn.src = 'images/x.png'; 
    closeBtn.alt = 'Close';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeTab(tabId);
    };
    tab.appendChild(closeBtn);
    tab.onclick = () => switchTab(tabId);

    const addBtn = tabBar.querySelector('.add-tab');
    tabBar.insertBefore(tab, addBtn);
    requestAnimationFrame(() => {
    tab.classList.remove('pre-show');
    tab.classList.add('show');
    });


    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.position = 'absolute';
    iframe.style.top = 0;
    iframe.style.left = 0;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'none';
    iframe.dataset.tabId = tabId;

    iframe.onload = () => {
      const currentTab = tabs.find(t => t.id === tabId);
      
      if (!currentTab) return;

      const docTitle = (() => {
        try {
          return iframe.contentDocument?.title || 'Untitled'; 
        } catch {
          return new URL(iframe.src).hostname;
        }
      })();

      const faviconUrl = (() => {
        try {
          const doc = iframe.contentDocument;
          const tag = doc.querySelector("link[rel~='icon']");
          return tag?.href || getFavicon(iframe.src);
        } catch {
          return getFavicon(iframe.src);
        }
      })();

      titleSpan.textContent = docTitle;
      favicon.src = faviconUrl;
    };

    iframeContainer.appendChild(iframe);

    tabs.push({ id: tabId, tabElement: tab, iframe });

    switchTab(tabId);
  }

  

  function switchTab(tabId) {
    tabs.forEach(({ id, tabElement, iframe }) => {
      const isActive = id === tabId;
      tabElement.classList.toggle('active', isActive);
      iframe.style.display = isActive ? 'block' : 'none';
      if (isActive) {
        iframe.id = 'iframeWindow';
      } else {
        iframe.removeAttribute('id');
      }
    });
    currentTabId = tabId;
  }

  function closeTab(tabId) {
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;

    const { tabElement, iframe } = tabs[index];
    tabElement.classList.toggle('show');
    tabElement.style.width = '0px'; 
      tabElement.addEventListener('transitionend', function handleTransitionEnd(e) {
    if (e.propertyName === 'width') {
      tabElement.removeEventListener('transitionend', handleTransitionEnd);
      tabElement.remove();
    }
  });
    iframe.remove();
    tabs.splice(index, 1);

    if (currentTabId === tabId) {
      if (tabs.length > 0) {
        switchTab(tabs[Math.max(0, index - 1)].id);
      } else {
        currentTabId = null;
      }
    }
  }

  function getActiveIframe() {
    const tab = tabs.find(t => t.id === currentTabId);
    return tab ? tab.iframe : null;
  }

  function reloadTab() {
    const iframe = getActiveIframe();
    try {
      iframe?.contentWindow.location.reload();
    } catch {
      console.warn('Reload blocked');
    }
  }

  function goBack() {
    const iframe = getActiveIframe();
    try {
      iframe?.contentWindow.history.back();
    } catch {
      console.warn('Back blocked');
    }
  }

  function goForward() {
    const iframe = getActiveIframe();
    try {
      iframe?.contentWindow.history.forward();
    } catch {
      console.warn('Forward blocked');
    }
  }

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'set-url-input') {
      const urlInput = document.getElementById('urlInput');
      urlInput.value = event.data.text;
      urlInput.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      }));
    }
  });



function openPopup() {
  document.getElementById('popupOverlay').classList.toggle('show')
  showMenu(1);
}

function closePopup() {
  document.getElementById('popupOverlay').classList.toggle('show')
}

document.getElementById('closePopupBtn').addEventListener('click', closePopup);

function showMenu(index) {
  document.querySelectorAll('.menu-page').forEach(page => page.style.display = 'none');
  document.getElementById(`menu${index}`).style.display = 'block';
  document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.menu-btn')[index - 1].classList.add('active');
}


  addTab();

