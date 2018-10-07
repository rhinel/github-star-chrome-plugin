// 设定公共方法

function setStorage(data) {
  return new Promise(resolve => chrome.storage.local.set(data, resolve));
}

function getStorage(data) {
  return new Promise(resolve => chrome.storage.local.get(data, resolve));
}

function sendMessage(msg) {
  return new Promise(resolve => chrome.runtime.sendMessage(msg, res => {
    if (res) return resolve(res);
    // https://bugs.chromium.org/p/chromium/issues/detail?id=586155
    console.log('chrome.runtime.lastError: ', chrome.runtime.lastError.message);
    return resolve();
  }));
}

window.setStorage = setStorage;
window.getStorage = getStorage;
window.sendMessage = sendMessage;
