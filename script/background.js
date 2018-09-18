// 暴露调用API

// 检查状态方法
async function getCheckStatus() {
  // 获取存储status
  const {
    user_name, access_token,
    getStarrdTime, intervalTime,
    starredData
  } = await window.getStorage([
    'user_name', 'access_token',
    'getStarrdTime', 'intervalTime',
    'starredData'
  ]);

  // 检查status
  if (!user_name) await Promise.reject(new Error('user_name不存在。'));
  if (!access_token) await Promise.reject(new Error('access_token不存在。'));

  let backData;

  if (
    !getStarrdTime
    || getStarrdTime + (intervalTime || 60) * 60 * 1000 < Date.now()
  ) {
    backData = {};
  } else {
    backData = {
      getStarrdTime,
      starredData
    };
  }

  // 返回数据
  return backData;
}

// 获取 starred方法
async function getFetchStarredOne(_page, _data) {
  // token page url
  const { user_name, access_token } = await window.getStorage([
    'user_name', 'access_token'
  ]);
  const page = _page || 1;
  const baseUrl =
    `https://api.github.com/users/${user_name}/starred`
    + `?access_token=${access_token}&page=${page}`;

  // 请求
  const response = await fetch(baseUrl);

  // 更新数据
  const updata = [
    ..._data || [],
    ...await response.clone()['json'](),
  ];

  // 判断页数
  const total = response.headers.get('Link')
    .split(',')[1].match(/(page=)(\d+)(>)/)[2];

  console.log('fetching starred: page total', page, total);

  // 请求下一页
  if (Number(total) > page) {
    return getFetchStarredOne(page + 1, updata);
  }

  // 设定本次请求时间和数据
  const backData = {
    getStarrdTime: Date.now(),
    starredData: updata
  };

  await window.setStorage(backData);

  // 返回数据
  // 返回数据
  return backData;
}

async function getFetchStarred() {
  // 判断标识为0，为请求中，阻止，其他地方判断不存在
  const { getStarrdTime } = await window.getStorage([
    'getStarrdTime'
  ]);
  if (getStarrdTime === 0) {
    await Promise.reject(new Error('正在请求中 ...'));
  }
  await window.setStorage({
    getStarrdTime: 0
  });

  return window.sendMessage({
    callFun: 'dealFetchData',
    ...await getFetchStarredOne()
  });
}

window.onmsgGetCheckStatus = getCheckStatus;
window.onmsgGetFetchStarred = getFetchStarred;

// 安装后回调
// 启动配置页面请求配置
chrome.runtime.onInstalled.addListener(async function() {
  chrome.runtime.openOptionsPage(function() {
    console.log('opening OptionsPage: ', true);
  });
});
