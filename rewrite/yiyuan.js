function rand() {
  return Math.floor(4500 + Math.random() * 500);
}

let body = $request.body;
try {
  let obj = JSON.parse(body);

  let r = rand();
  obj.playProgress = r;
  obj.playNow = r;
  obj.playedDuration = r;

  $done({ body: JSON.stringify(obj) });
} catch (e) {
  $done({ body });
}
