<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<script src="https://www.google.com/recaptcha/api.js" async defer></script>
		<script>
			function onSubmit(token) {
				document.getElementById("i-recaptcha").submit();
			}
		</script>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <link rel="stylesheet" type="text/css" href="css/css.css"/>
		<title></title>
		<!--[if IE]><link href="/css/ie.css" rel="stylesheet" type="text/css" /><![endif]-->
		<!--[if IE 6]><script type="text/javascript" src="/css/png1.js"></script><![endif]-->
		<!--[if IE 6]><script type="text/javascript" src="/css/png2.js"></script><![endif]-->
		<meta name="robots" content="index,follow" />
		<meta name="language" content="nl, dutch" />
		<meta name="distribution" content="global" />
        <style>
label
{
  width:25%;
  text-align:left;
  float:left;
}
.formulier
{
  border:none;
  padding:5pt;
  width:35em;
}
.row
{
  padding:5pt;
}
</style>
	</head>
	<body>
    <?
$afbeeldingen = array('afb1.jpg','afb2.jpg','afb3.jpg');
closedir($dir_handle);


$background = "images/".urlencode($afbeeldingen[array_rand($afbeeldingen)]);
?>
		<div id="wrapper" style="background-image: url(<?=$background?>);">
			<div id="headerWrapper">
				<div id="master">
					<div id="header">
						<div id="logo"></div>
						<div id="topMenu"><a href="/">Home</a>&nbsp;&#124;&nbsp;<a href="contact.php">Contact</a></div>
<!--						<div id="language"><a href="en/van-herk-groep.html" id="en" class="active" title="EN">EN</a><a href="nl/van-herk-groep.html" id="nl" title="NL">NL</a></div>-->
					</div>
					<div id="mainMenu">
						<ul>
							<li><a href="/" class="lvl-1">Home</a></li>
							<!--<li><a href="tehuur.php" class="lvl-1">Te huur aangeboden</a></li>-->
							<li class="active"><a href="contact.php" class="lvl-1">Contact</a></li>
						</ul>
					</div>
					<div id="contentWrapper" class="clearfix">
						
						<div id="content">
							
							<div class="csc-header csc-header-n1">
								<h1 class="csc-firstHeader">Contactformulier</h1>
							</div>
							<?php
// Checks if form has been submitted
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    function post_captcha($user_response) {
        $fields_string = '';
        $fields = array(
            'secret' => '6LcWp5cUAAAAAPZTkLoTOv55kghBAhmFx-MKFfls',
            'response' => $user_response
        );
        foreach($fields as $key=>$value)
        $fields_string .= $key . '=' . $value . '&';
        $fields_string = rtrim($fields_string, '&');

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://www.google.com/recaptcha/api/siteverify');
        curl_setopt($ch, CURLOPT_POST, count($fields));
        curl_setopt($ch, CURLOPT_POSTFIELDS, $fields_string);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, True);

        $result = curl_exec($ch);
        curl_close($ch);

        return json_decode($result, true);
    }

    // Call the function post_captcha
    $res = post_captcha($_POST['g-recaptcha-response']);

    if (!$res['success']) {
        // What happens when the reCAPTCHA is not properly set up
        echo 'FOUT: Helaas ging er iets mis. Probeer het later opnieuw!';
    } else {
        // If CAPTCHA is successful...

        // Paste mail function or whatever else you want to happen here!
        echo '<br><p>Uw bericht is verzonden!</p><br>';
		$headers = "From: " . strip_tags($_POST['email']) . "rn";
	   $headers .= "Reply-To: ". strip_tags($_POST['email']) . "rn";
	   $headers .= "MIME-Version: 1.0rn";
	   $headers .= "Content-Type: text/html; charset=ISO-8859-1rn";
	   
	   $bericht .= '<html><body>';
	   $bericht .= "<h1>Nieuw bericht via website</h1> nn";
	   $bericht .= "<b>Naam:</b>  ".$_POST['naam']."<br/>";
	   $bericht .= "<b>E-mail:</b>  ".$_POST['email']."<br/>";
	   $bericht .= "<b>Onderwerp:</b>  ".$_POST['onderwerp']."<br/><br/>";
	   $bericht .= "<b>Bericht:</b> <br/>".$_POST['bericht']."n";
	   $bericht .= '</body></html>';
	   
	   $emailto = "kriskrasvast01@server22.firstfind.nl";
	   $onderwerp = $_POST['onderwerp'];
	   $result = mail($emailto, "Reactie via website: ".$onderwerp, $bericht, $headers);
	   if ($result) {
		 echo "";
	   } else {
		 echo "";
	   }
    }
} else { ?>
<!-- FORM GOES HERE -->
	<form id='i-recaptcha' class="formulier" action="contact.php" method="POST">
    <div class="row">
     <label for="naam">Naam:</label>
     <input type="text" id="naam" name="naam" size="25" />
    </div>
    <div class="row">
     <label for="email">E-mailadres:</label>
     <input type="text" id="email" name="email" size="25" />
    </div>
    <div class="row">
     <label for="onderwerp">Onderwerp:</label>
     <input type="text" id="onderwerp" name="onderwerp" size="25" />
    </div>
    <div class="row">
     <label for="bericht">Bericht:</label>
     <textarea id="bericht" name="bericht" cols="40" rows="10"></textarea>
    </div>
    <div class="row">
     <button class="g-recaptcha" data-sitekey="6LcWp5cUAAAAAFfUKr4xdjUVV0SgosafILpcY6ZR" data-callback="onSubmit">
    Verstuur
</button>
    </div>
	</form>
<?php } ?>
						</div>
						<div id="rightColumn">
							<h2>Meer informatie</h2>
							<p class="bodytext">Via het contactformulier kunt u contact met ons opnemen.</p>
						</div>
					</div>
					<div id="footer">Kris Kras Nederland Vastgoed Beheer</div>
						</div>
					</div>
				</div>
			</body>
		</html>