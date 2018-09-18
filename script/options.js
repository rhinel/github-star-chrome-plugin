(async function() {
  // 获取token
  const { user_name, access_token } = await window.getStorage([
    'user_name', 'access_token'
  ]);

  // input
  const user_name_input = document.querySelector('#user_name');
  const access_token_input = document.querySelector('#access_token');
  if (user_name) user_name_input.value = user_name;
  if (access_token) access_token_input.value = access_token;

  // save button
  const save_options_button = document.querySelector('#save_options');
  const save_message = document.querySelector('#save_message');

  // save function
  async function save_func() {
    try {
      if (!access_token_input.value) {
        await Promise.reject(new Error('请输入token。'));
      }

      await window.setStorage({
        user_name: user_name_input.value,
        access_token: access_token_input.value
      });

      save_message.innerHTML = '保存成功！';
    } catch (e) {
      console.log('save_func error: ', e);
      save_message.innerHTML = e.message || e;
    }
  }

  // save
  save_options_button.onclick = save_func;
})();
