// 获取 starred方法
// 暴露调用API
let gettingStar = false;

async function getFetchStarred(_page, _data) {
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
    return getFetchStarred(page + 1, updata);
  }

  // 设定本次请求时间和数据
  const backData = {
    getStarrdTime: Date.now(),
    starredData: updata
  };

  await window.setStorage(backData);

  // 返回数据
  return backData;
}

async function onmsgGetFetchStarred() {
  if (gettingStar) return Promise.reject(new Error('正在请求中 ...'));
  gettingStar = true;

  try {
    const backData = await getFetchStarred();
    gettingStar = false;
    return backData;
  } catch (e) {
    console.log('onmsgGetFetchStarred error: ', e);
    gettingStar = false;
    return Promise.reject(new Error('请求出错。'));
  }
}

window.onmsgGetFetchStarred = onmsgGetFetchStarred;

// 安装后回调
// 启动配置页面请求配置
chrome.runtime.onInstalled.addListener(async function() {
  chrome.runtime.openOptionsPage(function() {
    console.log('opening OptionsPage: ', true);
  });
});
