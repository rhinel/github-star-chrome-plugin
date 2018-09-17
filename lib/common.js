// 设定公共方法
function setStorage(data) {
  return new Promise(resolve => chrome.storage.local.set(data, resolve));
}

function getStorage(data) {
  return new Promise(resolve => chrome.storage.local.get(data, resolve));
}

window.setStorage = setStorage;
window.getStorage = getStorage;
