// 设定公共方法
function setStorage(data) {
  return new Promise(resolve => chrome.storage.local.set(data, resolve));
}

function getStorage(data) {
  return new Promise(resolve => chrome.storage.local.get(data, resolve));
}

async function sendMessage(msg) {
  return new Promise(resolve => chrome.runtime.sendMessage(msg, resolve));
}

window.setStorage = setStorage;
window.getStorage = getStorage;
window.sendMessage = sendMessage;
