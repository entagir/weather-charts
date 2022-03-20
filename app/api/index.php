<?php
// Yandex Weather API (v2, forecast)
header("Access-Control-Allow-Origin: *");

$opts = array(
  'http' => array(
    'method' => "GET",
    'header' => "X-Yandex-API-Key: YANDEX_WEATHER_API_KEY"
  )
);

$url = "https://api.weather.yandex.ru/v2/forecast?lat=".
    $_GET['lat'].'&lon='.$_GET['lon'].'&lang='.$_GET['lang'].
    '&limit='.$_GET['limit'].'&hours='.$_GET['hours'];

$context = stream_context_create($opts);
$contents = file_get_contents($url, false, $context);

echo $contents;
?>
