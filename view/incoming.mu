<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Incoming Hits by Alliance</title>

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
    {{> header }}

    <div class="container-fluid">
      <section>
        <ul class="unstyled">
          <li>Earliest: {{earliestTime}}</li>
          <li>Latest: <strong>{{latestTime}}</strong></li>
          <li>Now: {{gameTime}}</li>
        </ul>
      </section>
      <header>
        <h2>Incoming Hits by Alliance</h2>

      </header>

      {{#allianceHits}}
      <h4>{{name}} - {{totalLootFarmed}} res farmed - {{totalMightKilled}} killed - {{totalMightLost}} lost</h4>
      <pre>
hit member              our coord   res unitSnt time  ene coord mgtLost mgtKild ratio Hro Bst Other
----------              --------- ----- ------- ----- --------- ------- ------- ----- ------  ------
{{#hits}}
{{reportLine}}
{{/hits}}
      </pre>
      <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">
        <thead><tr>
          <th>Attacker</th>
          <th>From</th>
          <th>Sent</th>
          <th>Hero</th>
          <th>Res</th>
          <th>MtLst</th>
          <th>Time</th>
          <th>Ratio</th>
          <th>MtKld</th>
          <th>Hero</th>
          <th>Coords</th>
          <th>Defender</th>
        </tr></thead>

        {{#reports}}
          {{>row}}
        {{/reports}}
      </table>
      {{/allianceHits}}
    </div>
  </body>
</html>

