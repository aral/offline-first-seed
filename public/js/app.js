window.onload = function () {
    var errors;
    var connection;
    var offline;
    var db = initDB();
    var button;
    var data;
    var rows = {};

    initUI();
    initData();
    listenToChanges();
    initServiceWorker();

    function initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/serviceWorker.js').then(function (registration) {
                // Registration was successful
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                setOfflineStatus('ready');
            }).catch(function (err) {
                // registration failed :(
                setOfflineStatus('failed');
                console.log('ServiceWorker registration failed: ', err);
            });
        } else {
            setOfflineStatus('unsupported');
        }
    }

    function setOfflineStatus(status) {
        offline.classList.remove('blue', 'red', 'green');
        if (status == 'ready') {
            offline.classList.add('green');
        } else {
            offline.classList.add('red');
        }
        offline.innerHTML = 'offline: ' + status;
    }

    function appendError(message) {
        errors.innerHTML += "<li class='collection-item'>" + message + "</li>";
    }

    function log() {
        console.log.apply(console, arguments);
        var res = [];
        for (var i = 0; i < arguments.length; i++) {
            var argument = arguments[i];
            try {
                res.push(JSON.stringify(argument));
            } catch (e) {
                console.log(argument);
                res.push(argument.toString());
            }
        }
        appendError(res.join(','));
    }

    function initDB() {
        var db = new PouchDB('chat');
        db.info().then(function (info) {
            log(info);
        });
        connectRemote(db);
        return db;
    }

    var syncState = 'offline';

    function connectRemote(db) {
        var remoteDB = new PouchDB('http://localhost:3000/db/chat');
        var sync = db.sync(remoteDB, {
            live: true,
            retry: true,
            back_off_function: function (lastTimeout) {
                log('backoff', arguments);
                changeState('offline');
                return lastTimeout == 0 ? 100 : Math.min(lastTimeout * 2, 1000);
            }
        }).on('change', function (change) {
            log('change', change);
            console.log(sync, sync.pull.state, sync.push.state);
        }).on('error', function (err) {
            log('error', err);
            changeState('error');
            console.log(sync, sync.pull.state, sync.push.state);
        }).on('complete', function (err) {
            log('complete', err);
            changeState('complete');
            console.log(sync, sync.pull.state, sync.push.state);
        }).on('paused', function (err) {
            log('paused', arguments);
            changeState('in sync');
            console.log(sync, sync.pull.state, sync.push.state);
        }).on('active', function (err) {
            log('active', err);
            changeState('syncing');
            console.log(sync, sync.pull.state, sync.push.state);
        }).on('denied', function (err) {
            log('denied', err);
            changeState('denied');
            console.log(sync, sync.pull.state, sync.push.state);
        });
        console.log(sync);
    }

    function changeState(state) {
        connection.classList.remove('blue', 'red', 'green');
        if (state == 'syncing') {
            connection.classList.add('blue');
        } else if (state == 'in sync') {
            connection.classList.add('green');
        } else {
            connection.classList.add('red');
        }
        syncState = state;
        connection.innerHTML = state;
    }

    function initUI() {
        errors = document.getElementById('log');
        connection = document.getElementById('connection');
        offline = document.getElementById('offline');
        button = document.getElementById('add');
        data = document.getElementById('chat');
        button.addEventListener('click', addMessage);
        document.getElementById('clear').addEventListener('click', clearLog);
    }

    function clearLog() {
        errors.innerHTML = '';
    }

    function addMessage(e) {
        e.preventDefault();
        var data = getFormData(document.querySelector('form'));
        data.time = new Date().getTime();
        db.post(data).then(function (response) {
            log(response);
        }).catch(function (error) {
            log(error);
        });
        e.preventDefault();
    }

    function getFormData(form) {
        var data = {};
        var inputs = form.querySelectorAll('input');
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            var name = input.attributes.getNamedItem('name').value;
            data[name] = input.value;
        }
        return data;
    }

    function formatTime(time) {
        var date = new Date(time);
        return date.toLocaleString();
    }

    function createRow(row) {
        return '<div class="circle blue darken-4 white-text">' +
            '<div class="valign-wrapper full-h"><div class="valign center-align full-w">' + row.nick + '</div></div>' +
            '</div>' +
            '<p class="grey-text comment-time">' + formatTime(row.time) + '</p>' +
            '<span class="title">' + row.message + '</span>' +
            '<a href="#!" class="button-delete secondary-content waves-effect waves-light"><i class="material-icons">delete</i></a>';
    }

    function removeRow(row) {
        if (rows[row._id]) {
            rows[row._id].remove();
            rows[row._id] = null;
        }
    }

    function upsertRow(row) {
        if (rows[row._id]) {
            rows[row._id].innerHTML = createRow(row);
        } else {
            var div = document.createElement('div');
            div.innerHTML = "<li class='collection-item avatar'>" +
                createRow(row) +
                "</li>";
            var rowElement = div.firstChild;
            data.appendChild(rowElement);
            rows[row._id] = rowElement;
        }
        rows[row._id].getElementsByClassName('button-delete')[0].addEventListener('click', function () {
            db.remove(row._id, row._rev);
        });
    }

    function initData() {
        db.allDocs({
            include_docs: true,
            attachments: true
        }).then(function (result) {
            result.rows.sort(function (a, b) {
                return a.doc.time - b.doc.time;
            });
            for (var i = 0; i < result.rows.length; i++) {
                upsertRow(result.rows[i].doc);
            }
        }).catch(function (err) {
            log('error getting all changes', err);
        });
    }

    function listenToChanges() {
        db.changes({
            since: 'now',
            live: true,
            include_docs: true
        }).on('change', function (change) {
            if (change.deleted) {
                removeRow(change.doc);
            } else {
                upsertRow(change.doc);
            }

        }).on('complete', function (info) {
            log(info);
        }).on('error', function (err) {
            log(err);
        });
    }
};








