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
	  table tbody tr td.true.numeric, table tbody tr th.true.numeric { background: #ffb; }
	  td.middle, th.middle { background: #fed; }
	  table tbody th.defender.incoming, table tbody td.defender.incoming, table tbody th.attacker.outgoing, table tbody td.attacker.outgoing{ background: #efd; }
	  table tbody th.attacker.incoming, table tbody td.attacker.incoming, table tbody th.defender.outgoing, table tbody td.defender.outgoing{ background: #fdd; }
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
        <tr>
          <th class="attacker {{inOut}}"><a href="{{byLink}}">{{by}}</a></th>
          <td>{{item.side1XCoord}},{{item.side1YCoord}}</td>
          <td class="numeric">{{stats.attUnits}}</td>
          <td>{{item.s1hero}} {{item.s1atkBoostSym}} {{item.s1defBoostSym}}</td>
          <td class="numeric {{stats.max}} {{stats.capacity}}">{{stats.totalFarmed}}</td>
          <td class="numeric">{{stats.attMightLost}}</td>
          <td class="middle">{{stats.hitTime}}</td>
          <td class="numeric">{{stats.ratioShort}}</td>
          <td class="numeric">{{stats.defMightLost}}</td>
          <td>{{item.s0hero}} {{item.s0atkBoostSym}} {{item.s0defBoostSym}}</td>
          <td>{{item.side0XCoord}},{{item.side0YCoord}}</td>
          <th class="defender {{inOut}}"><a href="{{onLink}}.html">{{on}}</a></th>
        </tr>
        {{/reports}}
      </table>
      <pre>
  hit opponent             opp coord   res unitSnt time  own coord mgtLost mgtKild ratio Hro Bst Other
  ------------             --------- ----- ------- ----- --------- ------- ------- ----- ------- -----
{{table}}
      </pre>
    </div>
  </body>
</html>

