var express = require('express');
var app = express();
var PouchDB = require('pouchdb');

app.use('/db', require('express-pouchdb')(PouchDB));

var db = new PouchDB('chat');

db.info().then(function (info) {
    console.log('database started at /db/chat', info);
});

process.on('uncaughtException', function (err) {
    console.log(err);
});
db.setMaxListeners(10);
db.changes({
    since: 'now',
    live: true,
    include_docs: true
}).on('change', function (change) {
    console.log(change);
}).on('complete', function (info) {
    console.log(info);
}).on('error', function (err) {
    console.log(err);
});

app.use(express.static('public'));

app.listen(3000, function () {
    console.log('Server started on port 3000!');
});