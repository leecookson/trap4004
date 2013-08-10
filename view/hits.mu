<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Hits for {{name}}</title>

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/css/bootstrap-combined.min.css" rel="stylesheet">
	<style>
    body { padding-top: 10px;}
	  table { width: 100%; }
	  td, th {text-align: left; white-space: nowrap;}
	  td.numeric, th.numeric { text-align: right; }
	  h2, h3 {margin-top: 0.5em;}
	  pre {font-size: 0.8em; font-weight: bold;}
	  section {padding-top: 10px;}
    </style>

    <link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/css/bootstrap-responsive.min.css" rel="stylesheet">

  </head>
  <body>
<!--
{ name: 'Leith',
  earliestTime: '03:58',
  latestTime: '02:53',
  gameTime: '03:58',
  totalResFarmed: '81m',
  totalResLost: '0',
  totalMightKilled: -1,
  totalMightLost: -1 }
-->
    <div class="container-fluid">
      {{>header}}
      <section>
        <ul class="unstyled">
          <li>Earliest: {{earliestTime}}</li>
          <li>Latest: <strong>{{latestTime}} {{latestDate}}</strong></li>
          <li>Now: {{gameTime}}</li>
          <li>Res Farmed: {{totalResFarmed}}</li>
          <li>Res Lost: {{totalResLost}}</li>
          <li>Might Killed: {{totalMightKilled}}</li>
          <li>Might Lost: {{totalMightLost}}</li>
          <li>Might: {{userMight}}</li>
        </ul>
      </section>
      <header>
        <h3>Hits for {{name}}</h3>

      </header>

      <pre>
  hit opponent             opp coord   res unitSnt time  own coord mgtLost mgtKild ratio Hro Bst Other
  ------------             --------- ----- ------- ----- --------- ------- ------- ----- ------- -----
{{table}}
      </pre>
    </div>
  </body>
</html>

