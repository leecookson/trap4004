<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Loser/Farmer Report</title>

    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" type="image/ico" href="http://www.datatables.net/favicon.ico" />

    <link href="http://elvery.net/demo/responsive-tables/assets/css/bootstrap.min.css" rel="stylesheet">
	<style>
    body { padding-top: 10px;}
	  table { width: 100%; }
	  td, th {text-align: left; white-space: nowrap;}
	  td.numeric, th.numeric { text-align: right; }
	  h2, h3 {margin-top: 1em;}
	  section {padding-top: 40px;}
    </style>

    <link href="http://elvery.net/demo/responsive-tables/assets/css/bootstrap-responsive.min.css" rel="stylesheet">
	<link href="http://elvery.net/demo/responsive-tables/assets/css/no-more-tables.css" rel="stylesheet">

    <script type="text/javascript" charset="utf-8" language="javascript" src="http://www.datatables.net/release-datatables/media/js/jquery.js"></script>
    <script type="text/javascript" charset="utf-8" language="javascript" src="http://www.datatables.net/release-datatables/media/js/jquery.dataTables.js"></script>
    <script type="text/javascript" charset="utf-8" language="javascript" src="http://www.datatables.net/media/blog/bootstrap_2/DT_bootstrap.js"></script>
  </head>
  <body>

  <div class="container-fluid">
  <section>
    <ul class="nav">
      <li>Start Time: {{startTime.time}} {{startTime.dayOfWeek}}</li>
    </ul>
    <ul class="nav">
      <li>End Time: {{endTime.time}}</li>
    </ul>
    <ul class="nav">
      <li>Game Time Now: {{nowTime.time}}</li>
    </ul>
  </section>
  <header>
    <h2>{{titleLabel}}</h2>
  </header>
  <section id="no-more-tables">
    <table cellpadding="0" cellspacing="0" border="0" class="table table-striped table-bordered cf">
      <thead>
        <tr><td>F</td><td>W</td><td>S</td><td>O</td><td>T</td><td>Totals</tr>
      </thead>
      <tbody>
        {{#players}}
        <tr>
          <td>{{loot.foodStr}}</td><td>{{loot.woodStr}}</td><td>{{loot.stoneStr}}</td><td>{{loot.oreStr}}</td><td>{{loot.totalStr}}</td><td>{{n}}</td></tr>
        </tr>
        {{/players}}
        <tr><td>{{loserTotals.foodStr}}</td><td>{{loserTotals.woodStr}}</td><td>{{loserTotals.stoneStr}}</td><td>{{loserTotals.oreStr}}</td><td>{{loserTotals.totalStr}}</td><td>Totals</tr>
     </tbody>
    </table>
    </section>
    </div>
  </body>
</html>

