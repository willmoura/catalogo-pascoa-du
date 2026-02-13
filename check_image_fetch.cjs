
const http = require('http');

function checkUrl(port) {
    const options = {
        hostname: 'localhost',
        port: port,
        path: '/products/charge.png',
        method: 'HEAD'
    };

    const req = http.request(options, (res) => {
        console.log(`Port ${port}: Status ${res.statusCode}`);
    });

    req.on('error', (e) => {
        // console.log(`Port ${port}: Error ${e.message}`);
    });

    req.end();
}

console.log("Checking ports 3000-3010...");
for (let i = 3000; i < 3010; i++) {
    checkUrl(i);
}
