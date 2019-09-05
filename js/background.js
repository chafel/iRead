var db = new Dexie("iReadDatabase");
db.version(1).stores({
  users: "id,name,&email,token",
  repos: "id,name,url",
  repoId: "id",
});

let repoId, repos=[], token, user;

function clearUserAndRepo() {
  db.users.clear();
  db.repoId.clear();
  db.repos.clear();
  repos = [];
  repoId = undefined;
  token = undefined;
  user = undefined;
}

async function getRepoInfo() {
  const repo = await db.repoId.toArray();
  repoId = repo[0] && repo[0].id;

  repos = await db.repos.toArray();
}
function getUserAndToken() {
  db.users.each((friend) => {
    user = friend;
    token = friend.token;
  });
}

function setRepos(data) {
  repos = data;
  db.repos.bulkAdd(repos);
}

function saveUser(data) {
  console.log('adding 1 user', data);
  user = data;
  token = data.token;
  db.users.add(data);
}

function setRepo(id) {
  repoId = id;
  db.repoId.add({ id });
}

// 监听来自content-script的消息
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
// {
//   console.log('收到来自content-script的消息：');
//   console.log(request, sender, sendResponse);
//   sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
// });
//
// function autoCheck () {
//   // do something you wanted
//   // 打开 github 后同步登陆状态
//   // 收到消息检查登陆状态执行后台打开新页面
//   // 完成更新文件后通知popup替换图标
//
//   // TODO 检查token是否失效，失效后icon上添加badge
// }

function getSavedInfo() {
    console.log(repos, repos.find(repo => repo.id === repoId))
    return {
      repo: repos.find(repo => repo.id === +repoId),
      user,
      token
    };
}

function init () {
  //DONE TODO 从持久化里拿 token，拿 repo 设置到内存里
  getUserAndToken();
  getRepoInfo().then(() => {
    // 拿到了所有信息
  });

  // Check whether new version is installed
  chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
      console.log("This is a first install!");
      chrome.tabs.create({url: "https://chafel.github.io/iRead?type=install"});
    }else if(details.reason == "update"){
      var thisVersion = chrome.runtime.getManifest().version;
      console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
      chrome.tabs.create({url: "https://chafel.github.io/iRead?type=update&v=" + thisVersion});
    }
  });
  // autoCheck();
  // 10min 执行一次
  // setInterval(autoCheck, 600000);
}

init();
