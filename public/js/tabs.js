  const tabBar = document.getElementById('tabBar');
  const iframeContainer = document.getElementById('iframeContainer');
  let tabs = [];
  let tabCount = 0;
  let currentTabId = null;

  function addTab(url = 'default.html') {
    const tabId = ++tabCount;


    const tab = document.createElement('div');
    tab.className = 'tab';
    tab.dataset.id = tabId;
    tab.textContent = `Tab ${tabId}`;

    const closeBtn = document.createElement('img');
    closeBtn.className = 'close-btn';
    closeBtn.src = 'images/x.png';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeTab(tabId);
    };
    tab.appendChild(closeBtn);

    tab.onclick = () => switchTab(tabId);
    const addBtn = tabBar.querySelector('.add-tab');
    tabBar.insertBefore(tab, addBtn);


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

    iframeContainer.appendChild(iframe);

    tabs.push({ id: tabId, tabElement: tab, iframe });

    switchTab(tabId);
    
  }

  function getActiveIframe() {
  const tab = tabs.find(t => t.id === currentTabId);
  return tab ? tab.iframe : null;
}

function goBack() {
  const iframe = getActiveIframe();
  try {
    iframe?.contentWindow.history.back();
  } catch (e) {
    console.warn('cant go back');
  }
}

function goForward() {
  const iframe = getActiveIframe();
  try {
    iframe?.contentWindow.history.forward();
  } catch (e) {
    console.warn('cant go forward');
  }
}

function reloadTab() {
  const iframe = getActiveIframe();
  try {
    iframe?.contentWindow.location.reload();
  } catch (e) {
    console.warn('cant reload');
  }
}


function switchTab(tabId) {
  tabs.forEach(({ id, tabElement, iframe }) => {
    tabElement.classList.toggle('active', id === tabId);
    iframe.style.display = id === tabId ? 'block' : 'none';


    if (id === tabId) {
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
    tabElement.remove();
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

  addTab();