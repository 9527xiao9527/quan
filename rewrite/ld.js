let body = $response.body;
let obj = JSON.parse(body);

obj.Data.LastCurrentTime = 2816;
obj.Data.LearnStatus = 2;

$done({ body: JSON.stringify(obj) });
