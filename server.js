var connect = require('connect');
connect.createServer(
    connect.static(__dirname)
).listen(80);

console.log('listening on port 80');