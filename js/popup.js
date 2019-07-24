function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}

function b64EncodeUnicode(str) {
  // first we use encodeURIComponent to get percent-encoded UTF-8,
  // then we convert the percent encodings into raw bytes which
  // can be fed into btoa.
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
    function toSolidBytes(match, p1) {
      return String.fromCharCode('0x' + p1);
    }));
}

function getTime() {
  var today = new Date();//获得当前日期
  var year = today.getFullYear();//获得年份
  var month = today.getMonth() + 1;//此方法获得的月份是从0---11，所以要加1才是当前月份
  var day = today.getDate();//获得当前日期
  var hour = today.getHours();
  var min = today.getMinutes();

  return `${year}-${month}-${day} ${hour}:${min}`;
}

function initHide() {
  $('#repo-area').hide();
  $('#warning').hide();
  $('#select-area').hide();
  $('#loading').hide();
  $('#re-setting').hide();
  $('#saving').hide();
  $('.card').hide();
}

initHide();

function setUserArea(data) {
  const { email, avatar_url, name, repos_url } = data;
  $('#token-area').hide();
  $('#repo-area img').attr('src', avatar_url);
  $('#username').text('hi, ' + name + '(' + email + ')');
  $('#repo-area').show();
}

var bg = chrome.extension.getBackgroundPage();
var savedInfo = {};

function getSavedInfo() {
  savedInfo = bg.getSavedInfo();

  if (savedInfo.token) {
    $.ajaxSetup({
      headers: {
        Authorization: 'token ' + savedInfo.token
      }
    });
  }

  if (savedInfo.user) {
    setUserArea(savedInfo.user);
    $('#re-setting').show();
  }

  if (savedInfo.repo) {
    $('#re-setting a').text(savedInfo.repo.full_name).attr('href', savedInfo.repo.html_url);
    $('#re-setting').show();
  }
}

getSavedInfo();

$('#check-btn').click(e => {
  $('#loading').show();

  const token = $('#token').val();
  $.ajaxSetup({
    headers: {
      Authorization: 'token ' + token
    }
  });
  $.get('https://api.github.com/user').done(function (data) {
    bg.saveUser({
      ...data, token
    });
    setUserArea(data);

    $.get(data.repos_url).done(data => {
      $('#loading').hide();

      if (data.length > 0) {
        //DONE TODO sync data to background.js
        bg.setRepos(data);
        data.forEach((repo) => $('#repo-select').append("<option value='" + repo.id + "'>" + repo.name + "</option>"))
        $('#select-area').show();
      } else {
        //DONE TODO show warning for empty array
        $('#repo-select').hide();
        $('#finish-btn').hide();
        $('#warning').text('Please create one repo on Github！').show();
      }

    });
  });
});


$('#finish-btn').click(e => {
  const repoId = $('#repo-select').val();
  bg.setRepo(repoId);

  getSavedInfo();
  $('#select-area').hide();
});

$('#reset-btn').click(e => {
  bg.clearUserAndRepo();
  clearInterval(countTimer);

  initHide();
  // 该 show 的 show
  $('#token-area').show();
});


function getCurrentTabId(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (callback) callback(tabs.length ? tabs[ 0 ] : null);
  });
}

var page;
getCurrentTabId((data) => page = data);
// 调用 github api 更新 readme ，with 当前 page{title, url}
/**
 * 1.getReadme
 * 2.updateReadme
 * 3.postUpdated
 */

var countTimer;

function runSave(tag) {
  $('#saving').show();
  $('.card').hide();

  $.get(savedInfo.repo.url + '/readme').done(data => {
    let content = b64DecodeUnicode(data.content);
    const newContent = content + `\n -${tag ? ' '+tag : ''}` + ` [${page.title}](${page.url}) at ${getTime()}`;

    $.ajax({
      method: 'PUT',
      url: savedInfo.repo.url + '/contents/README.md',
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({
        content: b64EncodeUnicode(newContent),
        sha: data.sha,
        message: 'Update README file',
        committer: {
          name: savedInfo.user.name,
          email: savedInfo.user.email
        },
      }),
      success: function (result) {
        // 结束后发送一个通知
        $('#saving').hide();
        setTimeout(() => window.close(), 1000);
        chrome.notifications.create(null, {
          type: 'basic',
          iconUrl: 'img/cheshire_cat_saved.png',
          title: 'Saved！',
          message: "Current page has been saved to the selected repo's README.md."
        });
      }
    })
  });

  clearInterval(countTimer);
  $('.auto-save span').text(3);
}

// 并在页面有 loading
if (savedInfo.user && savedInfo.repo) {
  $('.card').show();
  countTimer = setInterval(() => {
    var time = + $('.auto-save span').text();
    if (time > 1) {
      $('.auto-save span').text(time - 1);
    } else {
      runSave();
    }
    }, 1000);
}

$('.tag').click(e=> {
  runSave($(e.target).attr('data-text'));
});

