<!DOCTYPE html>
<html lang="en">
  <head>
    <title>{{titleLabel}} Report</title>

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/css/bootstrap-combined.min.css" rel="stylesheet">
    <style>
      body { padding-top: 10px;}
      table { width: 100%; }
      td, th {text-align: left; white-space: nowrap;}
      td.numeric, th.numeric { text-align: right; }
      h2, h3 {margin-top: 0.5em;}
      section {padding-top: 10px;}
    </style>

    <link href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/css/bootstrap-responsive.min.css" rel="stylesheet">
    <style>
      .table td, .table th {padding: 5px;}
    </style>

  </head>
  <body>
    {{> header }}

    <div class="container-fluid">
      <section>
        <ul class="unstyled">
          <li>Start Time: {{startTime.time}} {{startTime.dayOfWeek}}</li>
          <li>End Time: <strong>{{endTime.time}}</strong></li>
          <li>Time Now: {{nowTime.time}}</li>
          <li>Total Res: {{totals.totalStr}}</li>
        </ul>
      </section>
      <header>
        <h2>{{titleLabel}}</h2>
      </header>
      <section>
        <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">
          <thead>
            <tr>
              <th class="numeric">F</th>
              <th class="numeric">W</th>
              <th class="numeric">S</th>
              <th class="numeric">O</th>
              <th class="numeric">T</th>
              <th>Totals</th>
            </tr>
          </thead>
          <tbody>
            {{#players}}
            <tr>
              <td class="numeric">{{loot.foodStr}}</td>
              <td class="numeric">{{loot.woodStr}}</td>
              <td class="numeric">{{loot.stoneStr}}</td>
              <td class="numeric">{{loot.oreStr}}</td>
              <td class="numeric">{{loot.totalStr}}</td>
              <th><a href="ally/{{fn}}.html">{{n}}</a></th>
            </tr>
            {{/players}}
            <tr>
              <td class="numeric">{{totals.foodStr}}</td>
              <td class="numeric">{{totals.woodStr}}</td>
              <td class="numeric">{{totals.stoneStr}}</td>
              <td class="numeric">{{totals.oreStr}}</td>
              <td class="numeric">{{totals.totalStr}}</td>
              <th>Totals</th>
            </tr>
         </tbody>
        </table>
      </section>
    </div>
  </body>
</html>

