<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Alli Might</title>

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

  </head>
  <body>

    <div class="container-fluid">
      <section>
        <ul class="unstyled">
          <li>Now: {{now}}</li>
        </ul>
      </section>
      <header>
        <h2>Alli Might</h2>

      </header>

      <pre>
name            might      last login
----            -----      ----------
{{alliList}}
      </pre>
    </div>
  </body>
</html>
