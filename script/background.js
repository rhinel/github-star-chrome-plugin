function setStorage(data) {
  // eslint-disable-next-line no-undef
  return new Promise(resolve => chrome.storage.sync.set(data, resolve));
}

function getStorage(data) {
  // eslint-disable-next-line no-undef
  return new Promise(resolve => chrome.storage.sync.get(data, resolve));
}

// 获取 starred
async function getFetchStarred(_page, _data) {
  await setStorage({
    // eslint-disable-next-line no-undef
    access_token: token
  });

  const { access_token } = await getStorage('access_token');
  const page = _page || 1;
  const baseUrl =
    'https://api.github.com/users/rhinel/starred'
    + `?access_token=${access_token}&page=${page}`;

  const response = await fetch(baseUrl);

  const updata = [
    ..._data || [],
    ...await response.clone()['json'](),
  ];

  const total = response.headers.get('Link')
    .split(',')[1].match(/(page=)(\d+)(>)/)[2];

  console.log('fetching starred: page total', page, total);

  if (Number(total) > page) {
    return getFetchStarred(page + 1, updata);
  }

  return updata;
}

// eslint-disable-next-line no-undef
chrome.runtime.onInstalled.addListener(async function() {
  const data = await getFetchStarred();
  console.log('fetched starred: ', data);
});
