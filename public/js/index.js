//constant vars
//settings
var debug = false;
var version = '0.2.9';

var defaultTextHeight = 18;
var viewportMargin = 20;
var defaultExtraKeys = {
    "Enter": "newlineAndIndentContinueMarkdownList"
};

var idleTime = 300000; //5 mins
var doneTypingDelay = 400;
var finishChangeDelay = 400;
var cursorActivityDelay = 50;
var cursorAnimatePeriod = 100;
var supportCodeModes = ['javascript', 'htmlmixed', 'htmlembedded', 'css', 'xml', 'clike', 'clojure', 'ruby', 'python', 'shell', 'php', 'sql', 'coffeescript', 'yaml', 'jade', 'lua', 'cmake', 'nginx', 'perl', 'sass', 'r', 'dockerfile'];
var supportHeaders = [
    {
        text: '# h1',
        search: '#'
    },
    {
        text: '## h2',
        search: '##'
    },
    {
        text: '### h3',
        search: '###'
    },
    {
        text: '#### h4',
        search: '####'
    },
    {
        text: '##### h5',
        search: '#####'
    },
    {
        text: '###### h6',
        search: '######'
    },
    {
        text: '###### tags: `example`',
        search: '###### tags:'
    }
];
var supportReferrals = [
    {
        text: '[reference link]',
        search: '[]'
    },
    {
        text: '[reference]: url "title"',
        search: '[]:'
    },
    {
        text: '[^footnote link]',
        search: '[^]'
    },
    {
        text: '[^footnote reference]: url "title"',
        search: '[^]:'
    },
    {
        text: '^[inline footnote]',
        search: '^[]'
    },
    {
        text: '[link text][reference]',
        search: '[][]'
    },
    {
        text: '[link text](url "title")',
        search: '[]()'
    },
    {
        text: '![image text][reference]',
        search: '![][]'
    },
    {
        text: '![image text](url "title")',
        search: '![]()'
    }
];
var supportExternals = [
    {
        text: '{%youtube youtubeid %}',
        search: 'youtube'
    },
    {
        text: '{%vimeo vimeoid %}',
        search: 'vimeo'
    },
    {
        text: '{%gist gistid %}',
        search: 'gist'
    }
];
var supportGenerals = [
    {
        command: function () {
            return moment().format('llll');
        },
        search: 'time'
    }
];
var modeType = {
    edit: {},
    view: {},
    both: {}
}
var statusType = {
    connected: {
        msg: "CONNECTED",
        label: "label-warning",
        fa: "fa-wifi"
    },
    online: {
        msg: "ONLINE",
        label: "label-primary",
        fa: "fa-users"
    },
    offline: {
        msg: "OFFLINE",
        label: "label-danger",
        fa: "fa-plug"
    }
}
var defaultMode = modeType.both;

//global vars
var loaded = false;
var isDirty = false;
var editShown = false;
var visibleXS = false;
var visibleSM = false;
var visibleMD = false;
var visibleLG = false;
var isTouchDevice = 'ontouchstart' in document.documentElement;
var currentMode = defaultMode;
var currentStatus = statusType.offline;
var lastInfo = {
    needRestore: false,
    cursor: null,
    scroll: null,
    edit: {
        scroll: {
            left: null,
            top: null
        },
        cursor: {
            line: null,
            ch: null
        }
    },
    view: {
        scroll: {
            left: null,
            top: null
        }
    },
    history: null
};
var personalInfo = {};
var onlineUsers = [];

//editor settings
var textit = document.getElementById("textit");
if (!textit) throw new Error("There was no textit area!");
var editor = CodeMirror.fromTextArea(textit, {
    mode: 'gfm',
    keyMap: "sublime",
    viewportMargin: viewportMargin,
    styleActiveLine: true,
    lineNumbers: true,
    lineWrapping: true,
    showCursorWhenSelecting: true,
    indentUnit: 4,
    indentWithTabs: true,
    continueComments: "Enter",
    theme: "monokai",
    inputStyle: "textarea",
    matchBrackets: true,
    autoCloseBrackets: true,
    matchTags: {
        bothTags: true
    },
    autoCloseTags: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    extraKeys: defaultExtraKeys,
    readOnly: true
});
inlineAttachment.editors.codemirror4.attach(editor);
defaultTextHeight = parseInt($(".CodeMirror").css('line-height'));

//ui vars
var ui = {
    spinner: $(".ui-spinner"),
    content: $(".ui-content"),
    toolbar: {
        shortStatus: $(".ui-short-status"),
        status: $(".ui-status"),
        new: $(".ui-new"),
        pretty: $(".ui-pretty"),
        download: {
            markdown: $(".ui-download-markdown")
        },
        save: {
            dropbox: $(".ui-save-dropbox")
        },
        import: {
            dropbox: $(".ui-import-dropbox"),
            clipboard: $(".ui-import-clipboard")
        },
        mode: $(".ui-mode"),
        edit: $(".ui-edit"),
        view: $(".ui-view"),
        both: $(".ui-both")
    },
    area: {
        edit: $(".ui-edit-area"),
        view: $(".ui-view-area"),
        codemirror: $(".ui-edit-area .CodeMirror"),
        markdown: $(".ui-view-area .markdown-body")
    }
};

//page actions
var opts = {
    lines: 11, // The number of lines to draw
    length: 20, // The length of each line
    width: 2, // The line thickness
    radius: 30, // The radius of the inner circle
    corners: 0, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#000', // #rgb or #rrggbb or array of colors
    speed: 1.1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: true, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '50%', // Top position relative to parent
    left: '50%' // Left position relative to parent
};
var spinner = new Spinner(opts).spin(ui.spinner[0]);

//idle
var idle = new Idle({
    onAway: idleStateChange,
    onAwayBack: idleStateChange,
    awayTimeout: idleTime
});
ui.area.codemirror.on('touchstart', function () {
    idle.onActive();
});

function idleStateChange() {
    emitUserStatus();
    updateOnlineStatus();
}

loginStateChangeEvent = function () {
    location.reload(true);
}

//visibility
var wasFocus = false;
Visibility.change(function (e, state) {
    var hidden = Visibility.hidden();
    if (hidden) {
        if (editorHasFocus()) {
            wasFocus = true;
            editor.getInputField().blur();
        }
    } else {
        if (wasFocus) {
            editor.focus();
            wasFocus = false;
        }
    }
});

//when page ready
$(document).ready(function () {
    idle.checkAway();
    checkResponsive();
    //if in smaller screen, we don't need advanced scrollbar
    var scrollbarStyle;
    if (visibleXS) {
        scrollbarStyle = 'native';
    } else {
        scrollbarStyle = 'overlay';
    }
    if (scrollbarStyle != editor.getOption('scrollbarStyle')) {
        editor.setOption('scrollbarStyle', scrollbarStyle);
        clearMap();
    }
    checkEditorStyle();
    changeMode(currentMode);
    /* we need this only on touch devices */
    if (isTouchDevice) {
        /* cache dom references */
        var $body = jQuery('body');

        /* bind events */
        $(document)
            .on('focus', 'textarea, input', function () {
                $body.addClass('fixfixed');
            })
            .on('blur', 'textarea, input', function () {
                $body.removeClass('fixfixed');
            });
    }
});
//when page resize
var windowResizeDelay = 200;
var windowResizeTimer = null;
$(window).resize(function () {
    clearTimeout(windowResizeTimer);
    windowResizeTimer = setTimeout(function () {
        windowResize();
    }, windowResizeDelay);
});
//when page unload
$(window).unload(function () {
    emitRefresh();
});

function windowResize() {
    checkResponsive();
    checkEditorStyle();
    if (loaded) {
        editor.setOption('viewportMargin', Infinity);
        setTimeout(function () {
            clearMap();
            syncScrollToView();
            editor.setOption('viewportMargin', viewportMargin);
        }, windowResizeDelay);
    }
}

function editorHasFocus() {
    return $(editor.getInputField()).is(":focus");
}

//768-792px have a gap
function checkResponsive() {
    visibleXS = $(".visible-xs").is(":visible");
    visibleSM = $(".visible-sm").is(":visible");
    visibleMD = $(".visible-md").is(":visible");
    visibleLG = $(".visible-lg").is(":visible");

    if (visibleXS && currentMode == modeType.both)
        if (editorHasFocus())
            changeMode(modeType.edit);
        else
            changeMode(modeType.view);

    emitUserStatus();
}

function checkEditorStyle() {
    var scrollbarStyle = editor.getOption('scrollbarStyle');
    if (scrollbarStyle == 'overlay' || currentMode == modeType.both) {
        ui.area.codemirror.css('height', '');
    } else if (scrollbarStyle == 'native') {
        ui.area.codemirror.css('height', 'auto');
        $('.CodeMirror-gutters').css('height', $('.CodeMirror-sizer').height());
    }
}

function showStatus(type, num) {
    currentStatus = type;
    var shortStatus = ui.toolbar.shortStatus;
    var status = ui.toolbar.status;
    var label = $('<span class="label"></span>');
    var fa = $('<i class="fa"></i>');
    var msg = "";
    var shortMsg = "";

    shortStatus.html("");
    status.html("");

    switch (currentStatus) {
    case statusType.connected:
        label.addClass(statusType.connected.label);
        fa.addClass(statusType.connected.fa);
        msg = statusType.connected.msg;
        break;
    case statusType.online:
        label.addClass(statusType.online.label);
        fa.addClass(statusType.online.fa);
        shortMsg = num;
        msg = num + " " + statusType.online.msg;
        break;
    case statusType.offline:
        label.addClass(statusType.offline.label);
        fa.addClass(statusType.offline.fa);
        msg = statusType.offline.msg;
        break;
    }

    label.append(fa);
    var shortLabel = label.clone();

    shortLabel.append(" " + shortMsg);
    shortStatus.append(shortLabel);

    label.append(" " + msg);
    status.append(label);
}

function toggleMode() {
    switch (currentMode) {
    case modeType.edit:
        changeMode(modeType.view);
        break;
    case modeType.view:
        changeMode(modeType.edit);
        break;
    case modeType.both:
        changeMode(modeType.view);
        break;
    }
}

function changeMode(type) {
    saveInfo();
    if (type)
        currentMode = type;
    checkEditorStyle();
    var responsiveClass = "col-lg-6 col-md-6 col-sm-6";
    var scrollClass = "ui-scrollable";
    ui.area.codemirror.removeClass(scrollClass);
    ui.area.edit.removeClass(responsiveClass);
    ui.area.view.removeClass(scrollClass);
    ui.area.view.removeClass(responsiveClass);
    switch (currentMode) {
    case modeType.edit:
        ui.area.edit.show();
        ui.area.view.hide();
        if (!editShown) {
            editor.refresh();
            editShown = true;
        }
        break;
    case modeType.view:
        ui.area.edit.hide();
        ui.area.view.show();
        break;
    case modeType.both:
        ui.area.codemirror.addClass(scrollClass);
        ui.area.edit.addClass(responsiveClass).show();
        ui.area.view.addClass(scrollClass);
        ui.area.view.addClass(responsiveClass).show();
        break;
    }
    if (currentMode != modeType.view && visibleLG) {
        //editor.focus();
        editor.refresh();
    } else {
        editor.getInputField().blur();
    }
    if (changeMode != modeType.edit)
        updateView();
    restoreInfo();

    windowResize();

    ui.toolbar.both.removeClass("active");
    ui.toolbar.edit.removeClass("active");
    ui.toolbar.view.removeClass("active");
    var modeIcon = ui.toolbar.mode.find('i');
    modeIcon.removeClass('fa-toggle-on').removeClass('fa-toggle-off');
    if (ui.area.edit.is(":visible") && ui.area.view.is(":visible")) { //both
        ui.toolbar.both.addClass("active");
        modeIcon.addClass('fa-eye');
    } else if (ui.area.edit.is(":visible")) { //edit
        ui.toolbar.edit.addClass("active");
        modeIcon.addClass('fa-toggle-off');
    } else if (ui.area.view.is(":visible")) { //view
        ui.toolbar.view.addClass("active");
        modeIcon.addClass('fa-toggle-on');
    }
}

//button actions
var noteId = window.location.pathname.split('/')[1];
var url = window.location.origin + '/' + noteId;
//pretty
ui.toolbar.pretty.attr("href", url + "/pretty");
//download
//markdown
ui.toolbar.download.markdown.click(function () {
    var filename = renderFilename(ui.area.markdown) + '.md';
    var markdown = editor.getValue();
    var blob = new Blob([markdown], {
        type: "text/markdown;charset=utf-8"
    });
    saveAs(blob, filename);
});
//save to dropbox
ui.toolbar.save.dropbox.click(function () {
    var filename = renderFilename(ui.area.markdown) + '.md';
    var options = {
        files: [
            {
                'url': url + "/download",
                'filename': filename
            }
        ]
    };
    Dropbox.save(options);
});
//import from dropbox
ui.toolbar.import.dropbox.click(function () {
    var options = {
        success: function (files) {
            ui.spinner.show();
            var url = files[0].link;
            importFromUrl(url);
        },
        linkType: "direct",
        multiselect: false,
        extensions: ['.md', '.html']
    };
    Dropbox.choose(options);
});
//import from clipboard
ui.toolbar.import.clipboard.click(function () {
    //na
});
//fix for wrong autofocus
$('#clipboardModal').on('shown.bs.modal', function () {
    $('#clipboardModal').blur();
});
$("#clipboardModalClear").click(function () {
    $("#clipboardModalContent").html('');
});
$("#clipboardModalConfirm").click(function () {
    var data = $("#clipboardModalContent").html();
    if (data) {
        parseToEditor(data);
        $('#clipboardModal').modal('hide');
        $("#clipboardModalContent").html('');
    }
});

function parseToEditor(data) {
    var parsed = toMarkdown(data);
    if (parsed)
        editor.replaceRange(parsed, {
            line: 0,
            ch: 0
        }, {
            line: editor.lastLine(),
            ch: editor.lastLine().length
        }, '+input');
}

function importFromUrl(url) {
    //console.log(url);
    if (url == null) return;
    if (!isValidURL(url)) {
        alert('Not valid URL :(');
        return;
    }
    $.ajax({
        method: "GET",
        url: url,
        success: function (data) {
            parseToEditor(data);
        },
        error: function () {
            alert('Import failed :(');
        },
        complete: function () {
            ui.spinner.hide();
        }
    });
}

function isValidURL(str) {
        var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        if (!pattern.test(str)) {
            return false;
        } else {
            return true;
        }
    }
    //mode
ui.toolbar.mode.click(function () {
    toggleMode();
});
//edit
ui.toolbar.edit.click(function () {
    changeMode(modeType.edit);
});
//view
ui.toolbar.view.click(function () {
    changeMode(modeType.view);
});
//both
ui.toolbar.both.click(function () {
    changeMode(modeType.both);
});

//socket.io actions
var socket = io.connect();
//overwrite original event for checking login state
var on = socket.on;
socket.on = function () {
    if (!checkLoginStateChanged())
        on.apply(socket, arguments);
};
var emit = socket.emit;
socket.emit = function () {
    if (!checkLoginStateChanged())
        emit.apply(socket, arguments);
};
socket.on('info', function (data) {
    console.error(data);
    location.href = "./404.html";
});
socket.on('disconnect', function (data) {
    showStatus(statusType.offline);
    if (loaded) {
        saveInfo();
        lastInfo.history = editor.getHistory();
    }
    if (!editor.getOption('readOnly'))
        editor.setOption('readOnly', true);
});
socket.on('reconnect', function (data) {
    //sync back any change in offline
    emitUserStatus(true);
    cursorActivity();
    socket.emit('online users');
});
socket.on('connect', function (data) {
    personalInfo['id'] = socket.id;
    showStatus(statusType.connected);
    socket.emit('version');
});
socket.on('version', function (data) {
    if (data != version)
        location.reload(true);
});
socket.on('refresh', function (data) {
    saveInfo();

    var body = data.body;
    body = LZString.decompressFromUTF16(body);
    if (body)
        editor.setValue(body);
    else
        editor.setValue("");

    if (!loaded) {
        editor.clearHistory();
        ui.spinner.hide();
        ui.content.fadeIn();
        changeMode();
        loaded = true;
        emitUserStatus(); //send first user status
        updateOnlineStatus(); //update first online status
    } else {
        //if current doc is equal to the doc before disconnect
        if (LZString.compressToUTF16(editor.getValue()) !== data.body)
            editor.clearHistory();
        else {
            if (lastInfo.history)
                editor.setHistory(lastInfo.history);
        }
        lastInfo.history = null;
    }

    updateView();

    if (editor.getOption('readOnly'))
        editor.setOption('readOnly', false);

    restoreInfo();
});
socket.on('change', function (data) {
    data = LZString.decompressFromUTF16(data);
    data = JSON.parse(data);
    editor.replaceRange(data.text, data.from, data.to, "ignoreHistory");
    isDirty = true;
    clearTimeout(finishChangeTimer);
    finishChangeTimer = setTimeout(finishChange, finishChangeDelay);
});
socket.on('online users', function (data) {
    data = LZString.decompressFromUTF16(data);
    data = JSON.parse(data);
    if (debug)
        console.debug(data);
    onlineUsers = data.users;
    updateOnlineStatus();
    $('.other-cursors').children().each(function (key, value) {
        var found = false;
        for (var i = 0; i < data.users.length; i++) {
            var user = data.users[i];
            if ($(this).attr('id') == user.id)
                found = true;
        }
        if (!found)
            $(this).stop(true).fadeOut("normal", function () {
                $(this).remove();
            });
    });
    for (var i = 0; i < data.users.length; i++) {
        var user = data.users[i];
        if (user.id != socket.id)
            buildCursor(user);
        else
            personalInfo = user;
    }
});
socket.on('user status', function (data) {
    if (debug)
        console.debug(data);
    for (var i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].id == data.id) {
            onlineUsers[i] = data;
        }
    }
    updateOnlineStatus();
    if (data.id != socket.id)
        buildCursor(data);
});
socket.on('cursor focus', function (data) {
    if (debug)
        console.debug(data);
    for (var i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].id == data.id) {
            onlineUsers[i].cursor = data;
        }
    }
    if (data.id != socket.id)
        buildCursor(data);
    //force show
    var cursor = $('#' + data.id);
    if (cursor.length > 0) {
        cursor.stop(true).fadeIn();
    }
});
socket.on('cursor activity', function (data) {
    if (debug)
        console.debug(data);
    for (var i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].id == data.id) {
            onlineUsers[i].cursor = data;
        }
    }
    if (data.id != socket.id)
        buildCursor(data);
});
socket.on('cursor blur', function (data) {
    if (debug)
        console.debug(data);
    for (var i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].id == data.id) {
            onlineUsers[i].cursor = null;
        }
    }
    if (data.id != socket.id)
        buildCursor(data);
    //force hide
    var cursor = $('#' + data.id);
    if (cursor.length > 0) {
        cursor.stop(true).fadeOut();
    }
});

var options = {
    valueNames: ['id', 'name'],
    item: '<li class="ui-user-item">\
            <span class="id" style="display:none;"></span>\
            <a href="#">\
                <span class="pull-left"><i class="fa fa-square ui-user-icon"></i></span><span class="ui-user-name name"></span><span class="pull-right"><i class="fa fa-circle ui-user-status"></i></span>\
            </a>\
           </li>'
};
var onlineUserList = new List('online-user-list', options);
var shortOnlineUserList = new List('short-online-user-list', options);

function updateOnlineStatus() {
    if (!loaded) return;
    var _onlineUsers = deduplicateOnlineUsers(onlineUsers);
    showStatus(statusType.online, _onlineUsers.length);
    var items = onlineUserList.items;
    //update or remove current list items
    for (var i = 0; i < items.length; i++) {
        var found = false;
        var foundindex = null;
        for (var j = 0; j < _onlineUsers.length; j++) {
            if (items[i].values().id == _onlineUsers[j].id) {
                foundindex = j;
                found = true;
                break;
            }
        }
        var id = items[i].values().id;
        if (found) {
            onlineUserList.get('id', id)[0].values(_onlineUsers[foundindex]);
            shortOnlineUserList.get('id', id)[0].values(_onlineUsers[foundindex]);
        } else {
            onlineUserList.remove('id', id);
            shortOnlineUserList.remove('id', id);
        }
    }
    //add not in list items
    for (var i = 0; i < _onlineUsers.length; i++) {
        var found = false;
        for (var j = 0; j < items.length; j++) {
            if (items[j].values().id == _onlineUsers[i].id) {
                found = true;
                break;
            }
        }
        if (!found) {
            onlineUserList.add(_onlineUsers[i]);
            shortOnlineUserList.add(_onlineUsers[i]);
        }
    }
    //sorting
    sortOnlineUserList(onlineUserList);
    sortOnlineUserList(shortOnlineUserList);
    //render list items
    renderUserStatusList(onlineUserList);
    renderUserStatusList(shortOnlineUserList);
}

function sortOnlineUserList(list) {
    //sort order by isSelf, login state, idle state, alphabet name, color brightness
    list.sort('', {
        sortFunction: function (a, b) {
            var usera = a.values();
            var userb = b.values();
            var useraIsSelf = (usera.id == personalInfo.id || (usera.login && usera.userid == personalInfo.userid));
            var userbIsSelf = (userb.id == personalInfo.id || (userb.login && userb.userid == personalInfo.userid));
            if (useraIsSelf && !userbIsSelf) {
                return -1;
            } else if(!useraIsSelf && userbIsSelf) {
                return 1;
            } else {
                if (usera.login && !userb.login)
                    return -1;
                else if (!usera.login && userb.login)
                    return 1;
                else {
                    if (!usera.idle && userb.idle)
                        return -1;
                    else if (usera.idle && !userb.idle)
                        return 1;
                    else {
                        if (usera.name.toLowerCase() < userb.name.toLowerCase()) {
                            return -1;
                        } else if (usera.name.toLowerCase() > userb.name.toLowerCase()) {
                            return 1;
                        } else {
                            if (usera.color.toLowerCase() < userb.color.toLowerCase())
                                return -1;
                            else if (usera.color.toLowerCase() > userb.color.toLowerCase())
                                return 1;
                            else
                                return 0;
                        }
                    }
                }
            }
        }
    });
}

function renderUserStatusList(list) {
    var items = list.items;
    for (var j = 0; j < items.length; j++) {
        var item = items[j];
        var userstatus = $(item.elm).find('.ui-user-status');
        var usericon = $(item.elm).find('.ui-user-icon');
        usericon.css('color', item.values().color);
        userstatus.removeClass('ui-user-status-offline ui-user-status-online ui-user-status-idle');
        if (item.values().idle)
            userstatus.addClass('ui-user-status-idle');
        else
            userstatus.addClass('ui-user-status-online');
    }
}

function deduplicateOnlineUsers(list) {
    var _onlineUsers = [];
    for (var i = 0; i < list.length; i++) {
        var user = $.extend({}, list[i]);
        if (!user.userid)
            _onlineUsers.push(user);
        else {
            var found = false;
            for (var j = 0; j < _onlineUsers.length; j++) {
                if (_onlineUsers[j].userid == user.userid) {
                    //keep self color when login
                    if (user.id == personalInfo.id) {
                        _onlineUsers[j].color = user.color;
                    }
                    //keep idle state if any of self client not idle
                    if (!user.idle) {
                        _onlineUsers[j].idle = user.idle;
                    }
                    found = true;
                    break;
                }
            }
            if (!found)
                _onlineUsers.push(user);
        }
    }
    return _onlineUsers;
}

var userStatusCache = null;

function emitUserStatus(force) {
    if (!loaded) return;
    var type = null;
    if (visibleXS)
        type = 'xs';
    else if (visibleSM)
        type = 'sm';
    else if (visibleMD)
        type = 'md';
    else if (visibleLG)
        type = 'lg';

    personalInfo['idle'] = idle.isAway;
    personalInfo['type'] = type;

    for (var i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].id == personalInfo.id) {
            onlineUsers[i] = personalInfo;
        }
    }

    var userStatus = {
        idle: idle.isAway,
        type: type
    };

    if (force || JSON.stringify(userStatus) != JSON.stringify(userStatusCache)) {
        socket.emit('user status', userStatus);
        userStatusCache = userStatus;
    }
}

function checkCursorTag(coord, ele) {
    var curosrtagMargin = 60;
    var viewport = editor.getViewport();
    var viewportHeight = (viewport.to - viewport.from) * editor.defaultTextHeight();
    var editorWidth = ui.area.codemirror.width();
    var editorHeight = ui.area.codemirror.height();
    var width = ele.width();
    var height = ele.height();
    var left = coord.left;
    var top = coord.top;
    var offsetLeft = -3;
    var offsetTop = defaultTextHeight;
    if (width > 0 && height > 0) {
        if (left + width + offsetLeft > editorWidth - curosrtagMargin) {
            offsetLeft = -(width + 4);
        }
        if (top + height + offsetTop > Math.max(viewportHeight, editorHeight) + curosrtagMargin && top - height > curosrtagMargin) {
            offsetTop = -(height);
        }
    }
    ele[0].style.left = offsetLeft + 'px';
    ele[0].style.top = offsetTop + 'px';
}

function buildCursor(user) {
    if (!user.cursor) return;
    var coord = editor.charCoords(user.cursor, 'windows');
    coord.left = coord.left < 4 ? 4 : coord.left;
    coord.top = coord.top < 0 ? 0 : coord.top;
    var iconClass = 'fa-user';
    switch (user.type) {
    case 'xs':
        iconClass = 'fa-mobile';
        break;
    case 'sm':
        iconClass = 'fa-tablet';
        break;
    case 'md':
        iconClass = 'fa-desktop';
        break;
    case 'lg':
        iconClass = 'fa-desktop';
        break;
    }
    if ($('.other-cursors').length <= 0) {
        $("<div class='other-cursors'>").insertAfter('.CodeMirror-cursors');
    }
    if ($('#' + user.id).length <= 0) {
        var cursor = $('<div id="' + user.id + '" class="other-cursor" style="display:none;"></div>');
        cursor.attr('data-line', user.cursor.line);
        cursor.attr('data-ch', user.cursor.ch);
        cursor.attr('data-offset-left', 0);
        cursor.attr('data-offset-top', 0);

        var cursorbar = $('<div class="cursorbar">&nbsp;</div>');
        cursorbar[0].style.height = defaultTextHeight + 'px';
        cursorbar[0].style.borderLeft = '2px solid ' + user.color;

        var icon = '<i class="fa ' + iconClass + '"></i>';

        var cursortag = $('<div class="cursortag">' + icon + '&nbsp;<span class="name">' + user.name + '</span></div>');
        //cursortag[0].style.background = color;
        cursortag[0].style.color = user.color;

        cursor.attr('data-mode', 'state');
        cursor.hover(
            function () {
                if (cursor.attr('data-mode') == 'hover')
                    cursortag.stop(true).fadeIn("fast");
            },
            function () {
                if (cursor.attr('data-mode') == 'hover')
                    cursortag.stop(true).fadeOut("fast");
            });

        function switchMode(ele) {
            if (ele.attr('data-mode') == 'state')
                ele.attr('data-mode', 'hover');
            else if (ele.attr('data-mode') == 'hover')
                ele.attr('data-mode', 'state');
        }

        function switchTag(ele) {
            if (ele.css('display') === 'none')
                ele.stop(true).fadeIn("fast");
            else
                ele.stop(true).fadeOut("fast");
        }
        var hideCursorTagDelay = 2000;
        var hideCursorTagTimer = null;

        function hideCursorTag() {
            if (cursor.attr('data-mode') == 'hover')
                cursortag.fadeOut("fast");
        }
        cursor.on('touchstart', function (e) {
            var display = cursortag.css('display');
            cursortag.stop(true).fadeIn("fast");
            clearTimeout(hideCursorTagTimer);
            hideCursorTagTimer = setTimeout(hideCursorTag, hideCursorTagDelay);
            if (display === 'none') {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        cursortag.on('mousedown touchstart', function (e) {
            if (cursor.attr('data-mode') == 'state')
                switchTag(cursortag);
            switchMode(cursor);
            e.preventDefault();
            e.stopPropagation();
        });

        cursor.append(cursorbar);
        cursor.append(cursortag);

        cursor[0].style.left = coord.left + 'px';
        cursor[0].style.top = coord.top + 'px';
        $('.other-cursors').append(cursor);

        if (!user.idle)
            cursor.stop(true).fadeIn();

        checkCursorTag(coord, cursortag);
    } else {
        var cursor = $('#' + user.id);
        cursor.attr('data-line', user.cursor.line);
        cursor.attr('data-ch', user.cursor.ch);

        var cursorbar = cursor.find('.cursorbar');
        cursorbar[0].style.height = defaultTextHeight + 'px';
        cursorbar[0].style.borderLeft = '2px solid ' + user.color;

        var cursortag = cursor.find('.cursortag');
        cursortag.find('i').removeClass().addClass('fa').addClass(iconClass);
        cursortag.find(".name").text(user.name);

        if (cursor.css('display') === 'none') {
            cursor[0].style.left = coord.left + 'px';
            cursor[0].style.top = coord.top + 'px';
        } else {
            cursor.animate({
                "left": coord.left,
                "top": coord.top
            }, {
                duration: cursorAnimatePeriod,
                queue: false
            });
        }

        if (user.idle && cursor.css('display') !== 'none')
            cursor.stop(true).fadeOut();
        else if (!user.idle && cursor.css('display') === 'none')
            cursor.stop(true).fadeIn();

        checkCursorTag(coord, cursortag);
    }
}

//editor actions
editor.on('beforeChange', function (cm, change) {
    if (debug)
        console.debug(change);
});
editor.on('change', function (i, op) {
    if (debug)
        console.debug(op);
    if (op.origin != 'setValue' && op.origin != 'ignoreHistory') {
        socket.emit('change', LZString.compressToUTF16(JSON.stringify(op)));
    }
    isDirty = true;
    clearTimeout(doneTypingTimer);
    doneTypingTimer = setTimeout(doneTyping, doneTypingDelay);
});
editor.on('focus', function (cm) {
    for (var i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].id == personalInfo.id) {
            onlineUsers[i].cursor = editor.getCursor();
        }
    }
    personalInfo['cursor'] = editor.getCursor();
    socket.emit('cursor focus', editor.getCursor());
});
var cursorActivityTimer = null;
editor.on('cursorActivity', function (cm) {
    clearTimeout(cursorActivityTimer);
    cursorActivityTimer = setTimeout(cursorActivity, cursorActivityDelay);
});

function cursorActivity() {
    if (editorHasFocus() && !Visibility.hidden()) {
        for (var i = 0; i < onlineUsers.length; i++) {
            if (onlineUsers[i].id == personalInfo.id) {
                onlineUsers[i].cursor = editor.getCursor();
            }
        }
        personalInfo['cursor'] = editor.getCursor();
        socket.emit('cursor activity', editor.getCursor());
    }
}
editor.on('blur', function (cm) {
    for (var i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].id == personalInfo.id) {
            onlineUsers[i].cursor = null;
        }
    }
    personalInfo['cursor'] = null;
    socket.emit('cursor blur');
});

function saveInfo() {
    var scrollbarStyle = editor.getOption('scrollbarStyle');
    var left = $(document.body).scrollLeft();
    var top = $(document.body).scrollTop();
    switch (currentMode) {
    case modeType.edit:
        if (scrollbarStyle == 'native') {
            lastInfo.edit.scroll.left = left;
            lastInfo.edit.scroll.top = top;
        } else {
            lastInfo.edit.scroll = editor.getScrollInfo();
        }
        break;
    case modeType.view:
        lastInfo.view.scroll.left = left;
        lastInfo.view.scroll.top = top;
        break;
    case modeType.both:
        lastInfo.edit.scroll = editor.getScrollInfo();
        lastInfo.view.scroll.left = ui.area.view.scrollLeft();
        lastInfo.view.scroll.top = ui.area.view.scrollTop();
        break;
    }
    lastInfo.edit.cursor = editor.getCursor();
    lastInfo.needRestore = true;
}

function restoreInfo() {
    var scrollbarStyle = editor.getOption('scrollbarStyle');
    if (lastInfo.needRestore) {
        var line = lastInfo.edit.cursor.line;
        var ch = lastInfo.edit.cursor.ch;
        editor.setCursor(line, ch);

        switch (currentMode) {
        case modeType.edit:
            if (scrollbarStyle == 'native') {
                $(document.body).scrollLeft(lastInfo.edit.scroll.left);
                $(document.body).scrollTop(lastInfo.edit.scroll.top);
            } else {
                var left = lastInfo.edit.scroll.left;
                var top = lastInfo.edit.scroll.top;
                editor.scrollIntoView();
                editor.scrollTo(left, top);
            }
            break;
        case modeType.view:
            $(document.body).scrollLeft(lastInfo.view.scroll.left);
            $(document.body).scrollTop(lastInfo.view.scroll.top);
            break;
        case modeType.both:
            var left = lastInfo.edit.scroll.left;
            var top = lastInfo.edit.scroll.top;
            editor.scrollIntoView();
            editor.scrollTo(left, top);
            ui.area.view.scrollLeft(lastInfo.view.scroll.left);
            ui.area.view.scrollTop(lastInfo.view.scroll.top);
            break;
        }

        lastInfo.needRestore = false;
    }
}

//view actions
var doneTypingTimer = null;
var finishChangeTimer = null;
var input = editor.getInputField();
//user is "finished typing," do something
function doneTyping() {
    emitRefresh();
    updateView();
}

function finishChange() {
    updateView();
}

function emitRefresh() {
    var value = editor.getValue();
    socket.emit('refresh', LZString.compressToUTF16(value));
}

var lastResult = null;

function updateView() {
    if (currentMode == modeType.edit || !isDirty) return;
    var value = editor.getValue();
    var result = postProcess(md.render(value)).children().toArray();
    //ui.area.markdown.html(result);
    //finishView(ui.area.markdown);
    partialUpdate(result, lastResult, ui.area.markdown.children().toArray());
    if (result && lastResult && result.length != lastResult.length)
        updateDataAttrs(result, ui.area.markdown.children().toArray());
    lastResult = $(result).clone();
    finishView(ui.area.view);
    writeHistory(ui.area.markdown);
    isDirty = false;
    clearMap();
    buildMap();
}

function updateDataAttrs(src, des) {
    //sync data attr startline and endline
    for (var i = 0; i < src.length; i++) {
        copyAttribute(src[i], des[i], 'data-startline');
        copyAttribute(src[i], des[i], 'data-endline');
    }
}

function partialUpdate(src, tar, des) {
    if (!src || src.length == 0 || !tar || tar.length == 0 || !des || des.length == 0) {
        ui.area.markdown.html(src);
        return;
    }
    if (src.length == tar.length) { //same length
        for (var i = 0; i < src.length; i++) {
            copyAttribute(src[i], des[i], 'data-startline');
            copyAttribute(src[i], des[i], 'data-endline');
            var rawSrc = cloneAndRemoveDataAttr(src[i]);
            var rawTar = cloneAndRemoveDataAttr(tar[i]);
            if (rawSrc.outerHTML != rawTar.outerHTML) {
                //console.log(rawSrc);
                //console.log(rawTar);
                $(des[i]).replaceWith(src[i]);
            }
        }
    } else { //diff length
        var start = 0;
        var end = 0;
        //find diff start position
        for (var i = 0; i < tar.length; i++) {
            //copyAttribute(src[i], des[i], 'data-startline');
            //copyAttribute(src[i], des[i], 'data-endline');
            var rawSrc = cloneAndRemoveDataAttr(src[i]);
            var rawTar = cloneAndRemoveDataAttr(tar[i]);
            if (!rawSrc || !rawTar || rawSrc.outerHTML != rawTar.outerHTML) {
                start = i;
                break;
            }
        }
        //find diff end position
        var srcEnd = 0;
        var tarEnd = 0;
        for (var i = 0; i < src.length; i++) {
            //copyAttribute(src[i], des[i], 'data-startline');
            //copyAttribute(src[i], des[i], 'data-endline');
            var rawSrc = cloneAndRemoveDataAttr(src[i]);
            var rawTar = cloneAndRemoveDataAttr(tar[i]);
            if (!rawSrc || !rawTar || rawSrc.outerHTML != rawTar.outerHTML) {
                start = i;
                break;
            }
        }
        //tar end
        for (var i = 1; i <= tar.length + 1; i++) {
            var srcLength = src.length;
            var tarLength = tar.length;
            //copyAttribute(src[srcLength - i], des[srcLength - i], 'data-startline');
            //copyAttribute(src[srcLength - i], des[srcLength - i], 'data-endline');
            var rawSrc = cloneAndRemoveDataAttr(src[srcLength - i]);
            var rawTar = cloneAndRemoveDataAttr(tar[tarLength - i]);
            if (!rawSrc || !rawTar || rawSrc.outerHTML != rawTar.outerHTML) {
                tarEnd = tar.length - i;
                break;
            }
        }
        //src end
        for (var i = 1; i <= src.length + 1; i++) {
            var srcLength = src.length;
            var tarLength = tar.length;
            //copyAttribute(src[srcLength - i], des[srcLength - i], 'data-startline');
            //copyAttribute(src[srcLength - i], des[srcLength - i], 'data-endline');
            var rawSrc = cloneAndRemoveDataAttr(src[srcLength - i]);
            var rawTar = cloneAndRemoveDataAttr(tar[tarLength - i]);
            if (!rawSrc || !rawTar || rawSrc.outerHTML != rawTar.outerHTML) {
                srcEnd = src.length - i;
                break;
            }
        }
        //check if tar end overlap tar start
        var overlap = 0;
        for (var i = start; i >= 0; i--) {
            var rawTarStart = cloneAndRemoveDataAttr(tar[i - 1]);
            var rawTarEnd = cloneAndRemoveDataAttr(tar[tarEnd + 1 + start - i]);
            if (rawTarStart && rawTarEnd && rawTarStart.outerHTML == rawTarEnd.outerHTML)
                overlap++;
            else
                break;
        }
        if (debug)
            console.log('overlap:' + overlap);
        //show diff content
        if (debug) {
            console.log('start:' + start);
            console.log('tarEnd:' + tarEnd);
            console.log('srcEnd:' + srcEnd);
        }
        tarEnd += overlap;
        srcEnd += overlap;
        var repeatAdd = (start - srcEnd) < (start - tarEnd);
        var repeatDiff = Math.abs(srcEnd - tarEnd) - 1;
        //push new elements
        var newElements = [];
        if (srcEnd >= start) {
            for (var j = start; j <= srcEnd; j++) {
                if (!src[j]) continue;
                newElements.push(src[j].outerHTML);
            }
        } else if (repeatAdd) {
            for (var j = srcEnd - repeatDiff; j <= srcEnd; j++) {
                if (!des[j]) continue;
                newElements.push(des[j].outerHTML);
            }
        }
        //push remove elements
        var removeElements = [];
        if (tarEnd >= start) {
            for (var j = start; j <= tarEnd; j++) {
                if (!des[j]) continue;
                removeElements.push(des[j]);
            }
        } else if (!repeatAdd) {
            for (var j = start; j <= start + repeatDiff; j++) {
                if (!des[j]) continue;
                removeElements.push(des[j]);
            }
        }
        //add elements
        if (debug) {
            console.log('ADD ELEMENTS');
            console.log(newElements.join('\n'));
        }
        if (des[start])
            $(newElements.join('')).insertBefore(des[start]);
        else
            $(newElements.join('')).insertAfter(des[start - 1]);
        //remove elements
        if (debug)
            console.log('REMOVE ELEMENTS');
        for (var j = 0; j < removeElements.length; j++) {
            if (debug) {
                console.log(removeElements[j].outerHTML);
            }
            if (removeElements[j])
                removeElements[j].remove();
        }
    }
}

function cloneAndRemoveDataAttr(el) {
    if (!el) return;
    var rawEl = $(el).clone()[0];
    rawEl.removeAttribute('data-startline');
    rawEl.removeAttribute('data-endline');
    return rawEl;
}

function copyAttribute(src, des, attr) {
    if (src && src.getAttribute(attr) && des)
        des.setAttribute(attr, src.getAttribute(attr));
}

if ($('.cursor-menu').length <= 0) {
    $("<div class='cursor-menu'>").insertAfter('.CodeMirror-cursors');
}

var upSideDown = false;
var menuMargin = 60;

function checkCursorMenu() {
    var dropdown = $('.cursor-menu .dropdown-menu');
    var cursor = editor.getCursor();
    var scrollInfo = editor.getScrollInfo();
    if (!dropdown.hasClass('other-cursor'))
        dropdown.addClass('other-cursor');
    dropdown.attr('data-line', cursor.line);
    dropdown.attr('data-ch', cursor.ch);
    var coord = editor.charCoords({
        line: cursor.line,
        ch: cursor.ch
    }, 'windows');
    var viewport = editor.getViewport();
    var viewportHeight = (viewport.to - viewport.from) * editor.defaultTextHeight();
    var editorWidth = ui.area.codemirror.width();
    var editorHeight = ui.area.codemirror.height();
    var width = dropdown.width();
    var height = dropdown.height();
    var left = coord.left;
    var top = coord.top;
    var offsetLeft = 0;
    var offsetTop = defaultTextHeight;
    if (left + width + offsetLeft > editorWidth - menuMargin)
        offsetLeft = -(left + width - editorWidth + menuMargin);
    if (top + height + offsetTop > Math.max(viewportHeight, editorHeight) + menuMargin && top - height > menuMargin) {
        offsetTop = -(height + defaultTextHeight);
        upSideDown = true;
    } else {
        upSideDown = false;
    }
    dropdown.attr('data-offset-left', offsetLeft);
    dropdown.attr('data-offset-top', offsetTop);
    dropdown[0].style.left = left + offsetLeft + 'px';
    dropdown[0].style.top = top + offsetTop + 'px';
}

var isInCode = false;

function check(text) {
    var cursor = editor.getCursor();
    text = [];
    for (var i = 0; i < cursor.line; i++)
        text.push(editor.getLine(i));
    text = text.join('\n') + '\n' + editor.getLine(cursor.line).slice(0, cursor.ch);
    //console.log(text);
    var match;
    match = text.match(/`{3,}/g);
    if (match && match.length % 2) {
        isInCode = true;
    } else {
        match = text.match(/`/g);
        if (match && match.length % 2) {
            isInCode = true;
        } else {
            isInCode = false;
        }
    }
}

$(editor.getInputField())
    .textcomplete([
        { // emoji strategy
            match: /(?:^|\n|)\B:([\-+\w]*)$/,
            search: function (term, callback) {
                callback($.map(emojify.emojiNames, function (emoji) {
                    return emoji.indexOf(term) === 0 ? emoji : null;
                }));
                checkCursorMenu();
            },
            template: function (value) {
                return '<img class="emoji" src="/vendor/emojify/images/' + value + '.png"></img> ' + value;
            },
            replace: function (value) {
                return ':' + value + ':';
            },
            index: 1,
            context: function (text) {
                check(text);
                return !isInCode;
            }
    },
        { // Code block language strategy
            langs: supportCodeModes,
            match: /(^|\n)```(\w*)$/,
            search: function (term, callback) {
                callback($.map(this.langs, function (lang) {
                    return lang.indexOf(term) === 0 ? lang : null;
                }));
                checkCursorMenu();
            },
            replace: function (lang) {
                return '$1```' + lang + '=\n\n```';
            },
            done: function () {
                editor.doc.cm.moveV(-1, "line");
            },
            context: function () {
                return isInCode;
            }
    },
        { //header
            match: /(?:^|\n)(\s{0,3})(#{1,6}\w*)$/,
            search: function (term, callback) {
                callback($.map(supportHeaders, function (header) {
                    return header.search.indexOf(term) === 0 ? header.text : null;
                }));
                checkCursorMenu();
            },
            replace: function (value) {
                return '$1' + value;
            },
            context: function (text) {
                return !isInCode;
            }
    },
        { //referral
            match: /(^|\n|\s)(\!|\!|\[\])(\w*)$/,
            search: function (term, callback) {
                callback($.map(supportReferrals, function (referral) {
                    return referral.search.indexOf(term) === 0 ? referral.text : null;
                }));
                checkCursorMenu();
            },
            replace: function (value) {
                return '$1' + value;
            },
            context: function (text) {
                return !isInCode;
            }
    },
        { //externals
            match: /(^|\n|\s)\{\}(\w*)$/,
            search: function (term, callback) {
                callback($.map(supportExternals, function (external) {
                    return external.search.indexOf(term) === 0 ? external.text : null;
                }));
                checkCursorMenu();
            },
            replace: function (value) {
                return '$1' + value;
            },
            context: function (text) {
                return !isInCode;
            }
    },
        { //blockquote personal info & general info
            match: /(^|\n|\s|\>.*)\[(\w*)=$/,
            search: function (term, callback) {
                var list = typeof personalInfo[term] != 'undefined' ? [personalInfo[term]] : [];
                $.map(supportGenerals, function (general) {
                    if (general.search.indexOf(term) === 0)
                        list.push(general.command());
                });
                callback(list);
                checkCursorMenu();
            },
            replace: function (value) {
                return '$1[$2=' + value;
            },
            context: function (text) {
                return !isInCode;
            }
    },
        { //blockquote quick start tag
            match: /(^.*(?!>)\n|)(\>\s{0,1})$/,
            search: function (term, callback) {
                var self = '[name=' + personalInfo.name + '] [time=' + moment().format('llll') + '] [color=' + personalInfo.color + ']';
                callback([self]);
                checkCursorMenu();
            },
            template: function (value) {
                return '[Your name, time, color tags]';
            },
            replace: function (value) {
                return '$1$2' + value;
            },
            context: function (text) {
                return !isInCode;
            }
    }
], {
        appendTo: $('.cursor-menu')
    })
    .on({
        'textComplete:select': function (e, value, strategy) {
            //NA
        },
        'textComplete:show': function (e) {
            checkCursorMenu();
            $(this).data('autocompleting', true);
            editor.setOption("extraKeys", {
                "Up": function () {
                    return CodeMirror.PASS;
                },
                "Right": function () {
                    editor.doc.cm.execCommand("goCharRight");
                },
                "Down": function () {
                    return CodeMirror.PASS;
                },
                "Left": function () {
                    editor.doc.cm.execCommand("goCharLeft");
                },
                "Enter": function () {
                    return CodeMirror.PASS;
                },
                "Backspace": function () {
                    editor.doc.cm.execCommand("delCharBefore");
                    checkCursorMenu();
                }
            });
        },
        'textComplete:hide': function (e) {
            $(this).data('autocompleting', false);
            editor.setOption("extraKeys", defaultExtraKeys);
        }
    });