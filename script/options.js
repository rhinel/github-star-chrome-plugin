(async function() {
  // 获取token
  const { access_token } = await window.getStorage('access_token');

  // input
  const access_token_input = document.querySelector('#access_token');
  if (access_token) access_token_input.value = access_token;

  // save button
  const save_options_button = document.querySelector('#save_options');
  const save_message = document.querySelector('#save_message');
  save_options_button.onclick = async function() {
    try {
      if (!access_token_input.value) {
        await Promise.reject(new Error('请输入token。'));
      }

      await window.setStorage({
        access_token: access_token_input.value
      });

      save_message.innerHTML = '保存成功！';
    } catch (e) {
      save_message.innerHTML = e.message || e;
    }
  };
})();
