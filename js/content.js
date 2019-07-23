chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  // console.log(sender.tab ?"from a content script:" + sender.tab.url :"from the extension");
  console.log(message, sender);
  // 卡在怎么获取到 codemirror 实例然后 setVAlue 再模拟点击事件了
  sendResponse('我收到了你的消息！from content');
});
