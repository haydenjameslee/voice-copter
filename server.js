var connect = require('connect');
connect.createServer(
    connect.static(__dirname)
).listen(process.env.PORT || 5000);

console.log('listening on port 80');
