// 加载时请求刷新数据
// 获取刷新结果，或状态

// 检查状态方法
// 异步获取方法放在background.js中
async function checkStatus() {
  // 获取存储status
  const statusStorage = await window.getStorage([
    'user_name', 'access_token',
    'getStarrdTime', 'intervalTime',
    'starredData'
  ]);

  const {
    user_name, access_token,
    getStarrdTime, intervalTime,
    starredData
  } = statusStorage;

  // 检查status
  if (!user_name) await Promise.reject(new Error('user_name不存在。'));
  if (!access_token) await Promise.reject(new Error('access_token不存在。'));

  if (
    !getStarrdTime
    || getStarrdTime + (intervalTime || 60) * 60 * 1000 < Date.now()
  ) {
    return {};
  }

  return {
    getStarrdTime,
    starredData
  };
}

// 获取background方法
function getBgPage() {
  return new Promise(resolve => chrome.runtime.getBackgroundPage(resolve));
}

// 处理message-box方法
function dealMsg(...msg) {
  document.querySelector('#message-box')
    .innerHTML = msg.join('');
}

// 显示列表方法
function dealData(data) {
  const htmlFragment = document.createDocumentFragment();
  data.forEach(repos => {
    const div = document.createElement('div');
    div.className = 'repos-item';
    div.innerHTML = `
      <span class="repos-name">${repos.full_name}</span>
      <span class="repos-updatedat">${repos.pushed_at}</span>
    `;
    htmlFragment.appendChild(div);
  });

  document.querySelector('#data-wrap').innerHTML = '';
  document.querySelector('#data-wrap').appendChild(htmlFragment);
}

(async function () {
  try {
    let starrd;
    // 检查状态
    starrd = await checkStatus();

    if (!starrd.getStarrdTime) {
      dealMsg('列表刷新中 ...');
      starrd = await getBgPage()
        .then(_ => _.onmsgGetFetchStarred());
    }

    // 获取数据
    dealMsg(
      '列表刷新时间：',
      new Date(starrd.getStarrdTime).toLocaleString()
    );
    console.log('popup get starrd: ', starrd.starredData);
    dealData(starrd.starredData);

  } catch(e) {
    console.log('init error: ', e);
    dealMsg(e.message || e);
  }
})();
