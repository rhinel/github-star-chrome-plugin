// 加载时请求刷新数据
// 获取刷新结果，或状态

// 获取dom对象
// wrap
const wrap = document.querySelector('.wrap');

// fetchBtn
const fetchBtn = document.querySelector('#click-refetch');

// groupWrap
const groupWrap = document.querySelector('#group-wrap');

// dataWrap
const dataWrap = document.querySelector('#data-wrap');

// dialogWrap
const dialogWrap = document.querySelector('#dialog-wrap');

// 状态机变量
const popupStatus = {
  reposDoId: ''
};

// 处理message-box方法
function dealMsg(...msg) {
  document.querySelector('#message-box')
    .innerHTML = msg.join('');
}

// 获取background方法
function getBgPage() {
  return new Promise(resolve => chrome.runtime.getBackgroundPage(resolve));
}

// 显示列表方法
async function dealData(data) {
  // 获取group数据
  const groupHtmlFragment = document.createDocumentFragment();
  const dataHtmlFragment = document.createDocumentFragment();
  let { groupConfig, groupSet } = await window.getStorage([
    'groupConfig', 'groupSet'
  ]);

  // 处理groupConfig
  if (!groupConfig) {
    groupConfig = {
      ungroup: {
        id: 'ungroup',
        name: '未分组',
        open: true
      }
    };

    await window.setStorage({
      groupConfig
    });
  }

  Object.keys(groupConfig).forEach(groupId => {
    const div = document.createElement('div');
    div.className = 'dialog-group-do';
    div.dataset.id = groupId;
    div.innerHTML = groupConfig[groupId].name;
    groupHtmlFragment.appendChild(div);

    const details = document.createElement('details');
    details.open = groupConfig[groupId].open;
    const summary = document.createElement('summary');
    summary.dataset.id = groupId;
    summary.innerHTML = groupConfig[groupId].name;
    details.appendChild(summary);
    groupConfig[groupId] = details;
    dataHtmlFragment.appendChild(details);
  });

  // 处理groupSet
  if (!groupSet) {
    groupSet = {};

    await window.setStorage({
      groupSet
    });
  }

  Object.keys(groupSet).forEach(reposId => {
    groupSet[reposId].valid = false;
  });

  // 处理data数据
  data.forEach(repos => {
    const div = document.createElement('div');
    div.className = 'repos-item';
    div.innerHTML = `
      <a class="repos-name" href="${repos.html_url}" target="_blank">
        ${repos.full_name}
      </a>
      <span class="repos-updatedat">${repos.pushed_at}</span>
      <button class="repos-do" data-id="${repos.id}">调整分组</button>
    `;

    let groupId;

    if (groupSet[repos.id]) {
      groupId = groupSet[repos.id].groupId;
      groupSet[repos.id].valid = true;
    } else {
      groupId = 'ungroup';
    }

    groupConfig[groupId].appendChild(div);
  });

  // 更新groupSet
  Object.keys(groupSet).forEach(reposId => {
    if (!groupSet[reposId].valid) {
      delete groupSet[reposId];
    }
  });

  await window.setStorage({
    groupSet
  });

  // 载入页面
  groupWrap.innerHTML = '';
  groupWrap.appendChild(groupHtmlFragment);
  dataWrap.innerHTML = '';
  dataWrap.appendChild(dataHtmlFragment);
}

// 监听方法

// 处理获取数据 方法
// 处理所有异常
async function dealFetchData(starrd) {
  try {
    fetchBtn.disabled = false;
    dealMsg(
      '列表刷新时间：',
      new Date(starrd.getStarrdTime).toLocaleString()
    );
    dealData(starrd.starredData);
  } catch (e) {
    console.log('dealFetchData error: ', e);
    dealMsg(e.message || e);
  }
}

// 交互方法

// wrapReset 方法
async function wrapReset() {
  popupStatus.reposDoId = '';
  dialogWrap.style.display = 'none';
}

// fetch 方法
// 处理所有异常
async function getRefetch(uncheck) {
  try {
    dealMsg('列表刷新中 ...');
    fetchBtn.disabled = true;
    let starrd = {};

    // 检查状态
    // 获取数据
    if (!uncheck) {
      starrd = await getBgPage()
        .then(_ => _.onmsgGetCheckStatus());
    }

    if (starrd.getStarrdTime) {
      return dealFetchData(starrd);
    }

    //  否则请求异步获取，从监听处处理
    await getBgPage()
      .then(_ => _.onmsgGetFetchStarred());
  } catch(e) {
    console.log('getRefetch error: ', e);
    dealMsg(e.message || e);
  }
}

// 处理打开关闭组 方法
// 处理所有异常
async function getGroupTypeChange(groupId) {
  try {
    // 获取
    const { groupConfig } = await window.getStorage([
      'groupConfig'
    ]);

    // 处理更新
    groupConfig[groupId].open = !groupConfig[groupId].open;

    await window.setStorage({
      groupConfig
    });
  } catch (e) {
    console.log('getGroupTypeChange error: ', e);
    // TODO handler error ?
  }
}

// 处理换组 方法
// 处理所有异常
async function getReposGroupChange(groupId) {
  try {
    // 检查
    // 获取
    const { reposDoId } = popupStatus;
    if (!reposDoId) {
      await Promise.reject(new Error('没有reposDoId。'));
    }
    const { groupSet } = await window.getStorage([
      'groupSet'
    ]);

    // 处理更新
    if (groupId === 'ungroup' && groupSet[reposDoId]) {
      delete groupSet[reposDoId];
    } else if (groupId !== 'ungroup') {
      groupSet[reposDoId] = {
        groupId,
        valid: true
      };
    }

    await window.setStorage({
      groupSet
    });

    // 清除状态
    wrapReset();
  } catch (e) {
    console.log('getReposGroupChange error: ', e);
    // TODO handler error ?
  }
}

(async function () {
  // 监听数据
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.callFun === 'dealFetchData') {
      return dealFetchData(msg);
    }
  });

  // 获取数据
  getRefetch();

  // 状态恢复
  wrap.onclick = wrapReset;

  // 刷新按钮
  fetchBtn.onclick = getRefetch;

  // repos事件
  dataWrap.onclick = function(evt) {
    // 代理repos-do事件
    if (evt.target.className === 'repos-do') {
      evt.stopPropagation();
      // getReposDo
      popupStatus.reposDoId = evt.target.dataset.id;
      dialogWrap.style.display = 'block';
      dialogWrap.style.top = evt.y + 'px';
      dialogWrap.style.right = (400 - evt.x) + 'px';
      // TODO handler error ?
      return;
    } else if (evt.target.nodeName === 'SUMMARY') {
      return getGroupTypeChange(evt.target.dataset.id);
    }
  };

  // dialog-group事件
  dialogWrap.onclick = function(evt) {
    evt.stopPropagation();
    if (evt.target.className === 'dialog-group-do') {
      return getReposGroupChange(evt.target.dataset.id);
    }
  };
})();
