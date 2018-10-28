// 加载时请求刷新数据
// 获取刷新结果，或状态

// 获取dom对象
// wrap
const wrap = document.querySelector('#wrap');
const msgBox = document.querySelector('#message-box');
const fetchBtn = document.querySelector('#click-refetch');
const groupWrap = document.querySelector('#group-wrap');
const dataWrap = document.querySelector('#data-wrap');
const dialogWrap = document.querySelector('#dialog-wrap');
const addGroup = document.querySelector('#add-group');
const addGroupWarp = document.querySelector('#add-group-warp');
const addGroupInput = document.querySelector('#add-group-input');

// 状态机变量
const popupStatus = {
  // 当前处理的库对象
  reposDoId: ''
};

// 处理message-box方法
function dealMsg(...msg) {
  msgBox.innerHTML = msg.join('');
}

// 获取background方法
function getBgPage() {
  return new Promise(resolve => chrome.runtime.getBackgroundPage(resolve));
}

// 显示列表方法
async function dealData(data) {
  // 获取group数据
  const dataHtmlFragment = document.createDocumentFragment();
  let {
    groupConfig, groupSet
  } = await window.getStorage([
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
    const details = document.createElement('details');
    details.open = groupConfig[groupId].open;
    details.innerHTML = `
      <summary data-id="${groupId}">
        <span>${groupConfig[groupId].name}</span>
        <button
          class="button button--small group-del${groupId === 'ungroup' ? ' hidden' : ''}"
          data-id="${groupId}"
        >删除分组</button>
      </summary>
    `;
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
      <a
        class="repos-name"
        href="${repos.html_url}"
        target="_blank"
      >${repos.full_name}
      </a>
      <span class="repos-updatedat">${repos.pushed_at}</span>
      <button
        class="button button--white button--small repos-do"
        data-id="${repos.id}"
      >调整分组</button>
    `;

    let groupId;

    if (groupSet[repos.id]) {
      groupId = groupSet[repos.id].groupId;
    }

    if (groupId && groupConfig[groupId]) {
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
  dataWrap.innerHTML = '';
  dataWrap.appendChild(dataHtmlFragment);
}

// 显示分组方法
async function dealGroup() {
  // 获取group数据
  const groupHtmlFragment = document.createDocumentFragment();
  let {
    groupConfig
  } = await window.getStorage([
    'groupConfig'
  ]);

  Object.keys(groupConfig).forEach(groupId => {
    const div = document.createElement('div');
    div.className = 'dialog-group-do';
    div.dataset.id = groupId;
    div.innerHTML = groupConfig[groupId].name;
    groupHtmlFragment.appendChild(div);
  });

  // 载入页面
  groupWrap.innerHTML = '';
  groupWrap.appendChild(groupHtmlFragment);
}

// 监听方法

// 处理获取数据 方法
// 处理所有异常
async function dealFetchData(starrd) {
  try {
    fetchBtn.disabled = false;
    fetchBtn.classList.remove('button--disabled');
    dealMsg(
      '列表刷新时间：',
      new Date(starrd.getStarrdTime).toLocaleString()
    );
    await dealGroup();
    await dealData(starrd.starredData);
  } catch (e) {
    console.log('dealFetchData error: ', e);
    dealMsg(e.message || e);
  }
}

// 交互方法

// wrapReset 方法
// 处理所有异常
async function wrapReset() {
  try {
    // 处理状态
    popupStatus.reposDoId = '';
    dialogWrap.style.display = 'none';
    getAddGroupChange(true);
  } catch(e) {
    console.log('wrapReset error: ', e);
    // TODO handler error ?
  }
}

// fetch 方法
// 处理所有异常
async function getRefetch(uncheck) {
  try {
    dealMsg('列表刷新中 ...');
    fetchBtn.disabled = true;
    fetchBtn.classList.add('button--disabled');
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
    const {
      groupConfig
    } = await window.getStorage([
      'groupConfig'
    ]);

    // 处理更新
    // dom已更新
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
    const {
      groupSet, starredData
    } = await window.getStorage([
      'groupSet', 'starredData'
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

    // 更新dom数据
    await dealData(starredData);

    // 清除状态
    return wrapReset();
  } catch (e) {
    console.log('getReposGroupChange error: ', e);
    // TODO handler error ?
  }
}

// 处理add-group 切换方法
// 处理所有异常
async function getAddGroupChange(close) {
  try {
    // 处理变化
    if (close || addGroup.style.display === 'none') {
      addGroupInput.value = '';
      addGroup.style.display = 'flex';
      addGroupWarp.style.display = 'none';
    } else {
      addGroup.style.display = 'none';
      addGroupWarp.style.display = 'flex';
    }
  } catch (e) {
    console.log('getAddGroupChange error: ', e);
    // TODO handler error ?
  }
}

// 处理add-group-confirm 方法
// 处理所有异常
async function getAddGroupConfirm() {
  try {
    // 检查
    if (!addGroupInput.value) {
      await Promise.reject(new Error('请输入分组名称'));
    }

    // 处理更新
    const {
      groupConfig
    } = await window.getStorage([
      'groupConfig'
    ]);

    const newGroupId = Date.now();

    groupConfig[newGroupId] = {
      id: newGroupId,
      name: addGroupInput.value,
      open: true
    };

    await window.setStorage({
      groupConfig
    });

    // 更新dom数据
    await dealGroup();

    // 清除状态
    return getAddGroupChange(true);
  } catch (e) {
    console.log('getAddGroupConfirm error: ', e);
    // TODO handler error ?
  }
}

// 处理group-del 方法
// 处理所有异常
async function getGroupDel(groupId) {
  try {
    if (groupId === 'ungroup') return;

    const userConfirm = confirm('确认删除该组？内容将设置为未分组。');
    if (!userConfirm) return;

    // 获取
    const {
      groupConfig, starredData
    } = await window.getStorage([
      'groupConfig', 'starredData'
    ]);

    delete groupConfig[groupId];

    await window.setStorage({
      groupConfig
    });

    // 更新dom数据
    await dealGroup();
    await dealData(starredData);
  } catch (e) {
    console.log('getGroupDel error: ', e);
    // TODO handler error ?
  }
}

(async function () {
  // 监听数据
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.callFun === 'dealFetchData') {
      return dealFetchData(msg) || true;
    }
  });

  // 状态恢复
  wrap.onclick = wrapReset;

  // 刷新按钮
  fetchBtn.onclick = getRefetch;

  // repos事件
  dataWrap.onclick = function(evt) {
    // 代理repos-do事件
    if (evt.target.classList.contains('repos-do')) {
      evt.stopPropagation();
      // getReposDo
      // 添加状态变化
      popupStatus.reposDoId = evt.target.dataset.id;
      dialogWrap.style.display = 'block';
      dialogWrap.style.top = (window.scrollY + evt.y) + 'px';
      dialogWrap.style.right = (400 - evt.x) + 'px';
      // TODO handler error ?
      return;
    }

    if (evt.target.nodeName === 'SUMMARY') {
      return getGroupTypeChange(evt.target.dataset.id);
    }

    if (evt.target.classList.contains('group-del')) {
      return getGroupDel(evt.target.dataset.id);
    }
  };

  // dialog-group事件
  dialogWrap.onclick = function(evt) {
    evt.stopPropagation();
    // 以下事件可能需要主动调用wrapReset
    if (evt.target.className === 'dialog-group-do') {
      return getReposGroupChange(evt.target.dataset.id);
    }

    if (evt.target.id === 'add-group') {
      return getAddGroupChange();
    }

    if (evt.target.id === 'add-group-confirm') {
      return getAddGroupConfirm();
    }

    if (evt.target.id === 'add-group-cancel') {
      return getAddGroupChange();
    }
  };

  // 获取数据
  getRefetch();
})();
