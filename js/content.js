chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  // console.log(sender.tab ?"from a content script:" + sender.tab.url :"from the extension");
  console.log(message, sender);
  // 卡在怎么获取到 codemirror 实例然后 setValue 再模拟点击事件了
  sendResponse('我收到了你的消息！from content');
});

// "content_scripts": [
//   {
//     "matches": ["https://github.com/*"],
//     "js": ["js/jQuery.js", "js/content.js"],
//     "run_at": "document_start"
//   }
// ],
//   "permissions": [
//   "contextMenus",
//   "tabs",
//   "notifications",
//   "webRequest",
//   "webRequestBlocking",
//   "storage",
//   "http://*/*",
//   "https://*/*"
// ],
