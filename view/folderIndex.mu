<!DOCTYPE html>
<html>
<head><title>KoM Reports</title></head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/css/bootstrap-combined.min.css" rel="stylesheet">
        <style>
    body { padding-top: 10px; font-size: 14px;}
          table { width: 100%; }
          td, th {text-align: left; white-space: nowrap;}
          td.numeric, th.numeric { text-align: right; }
          h2, h3 {margin-top: 0.5em;}
          section {padding-top: 10px;}
    </style>

    <link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/css/bootstrap-responsive.min.css" rel="stylesheet">

<style>
  a:link { text-decoration: none; }
  body {line-height: 0.9em; padding-left: 5px;}
  li {margin-top: 3px;}
  .table td {padding: 5px;}
</style>
<body bgcolor="white" style="text-decoration: none">
    {{> header }}
<div style="font-size: 1.4em; ">
<h3>{{name}} Reports - {{now}}</h3>
<h5>Members: {{fileCount}}</h5>
<hr>
<table class="table" style="width: 400px;">
{{#files}}
  <tr>
    <td><a href="{{file}}">{{name}}</a></td><td>{{stats.mDate}} {{stats.mTime}}</td>
  </tr>
{{/files}}
</table>
</div>
<hr></body>
</html>

