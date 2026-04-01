let obj = JSON.parse($response.body);
let random = Math.floor(Math.random() * (4500 - 3500 + 1)) + 3500;

if (obj.data) {
  obj.data.watch_time = random;
  obj.data.progress = random;
}

$done({ body: JSON.stringify(obj) });
