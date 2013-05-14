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

    <link href="http://elvery.net/demo/responsive-tables/assets/css/bootstrap-responsive.min.css" rel="stylesheet">

  </head>
  <body>

    <div class="container-fluid">
      <section>
        <ul class="unstyled">
          <li>Start Time: {{startTime.time}} {{startTime.dayOfWeek}}</li>
          <li>End Time: <strong>{{endTime.time}}</strong></li>
          <li>Game Time Now: {{nowTime.time}}</li>
        </ul>
      </section>
      <header>
        <h2>{{titleLabel}}</h2>
      </header>
      <section>
        <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered">
          <thead>
            <tr>
              <th>F</th><th>W</th><th>S</th><th>O</th><th>T</th><th>Totals</th>
            </tr>
          </thead>
          <tbody>
            {{#players}}
            <tr>
              <td class="numeric">{{loot.foodStr}}</td>
              <td class="numeric">{{loot.woodStr}}</td>
              <td>{{loot.stoneStr}}</td>
              <td>{{loot.oreStr}}</td>
              <td>{{loot.totalStr}}</td>
              <th>{{n}}</th>
            </tr>
            {{/players}}
            <tr>
              <td>{{loserTotals.foodStr}}</td>
              <td>{{loserTotals.woodStr}}</td>
              <td>{{loserTotals.stoneStr}}</td>
              <td>{{loserTotals.oreStr}}</td>
              <td>{{loserTotals.totalStr}}</td>
              <th>Totals</th>
            </tr>
         </tbody>
        </table>
      </section>
    </div>
  </body>
</html>

