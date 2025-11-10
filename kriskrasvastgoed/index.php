<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Kris Kras Nederland Vastgoedbeheer</title>
	<meta name="description" content="Kris Kris Kras Nederland Vastgoedbeheer is een specialist op het gebied van vastgoedbeheer en woningverhuur. Naast het verhuren van woonruimte behoort vastgoedbeheer tot onze kernactiviteiten">
	<link rel="stylesheet" href="css/default.css">
	<script src="js/vendors/jquery.js"></script>
	<script src="vendors.jquery/jquery-3.5.1.js"></script>
	<script src="js/parallax/parallax.js"></script>
	<script src="https://www.google.com/recaptcha/api.js" async defer></script>
	<script src="js/app.js"></script>
</head>
<body>
	<div class="container">
		<header>
			<a href="/">Home</a>
			<a href="#overOns">Over ons</a>
			<a href="#contactusInfo">Contact</a>
		</header>
		<main>
			<div class="parallax-container" data-parallax="scroll" data-z-index="1" data-image-src="images/FirstBackground.jpg"></div>

			<div class="section-container" id="overOns">
				<section>
					<h3>.01</h3>
					<h1 style="margin-top: 0;">Over ons</h1>
					<div class="column-container">
						<p class="column">
							Kris Kras Nederland Vastgoedbeheer is een specialist op het gebied van vastgoedbeheer en woningverhuur.
							Naast het verhuren van woonruimte behoort vastgoedbeheer tot onze kernactiviteiten.
							Als professionele woningbeheerder houden wij ons bezig met woningmanagement in de ruimste zin van het woord.
						</p>
		
						<p class="column">
							Kris Kras Nederland Vastgoedbeheer ondersteunt hierin diverse opdrachtgevers bij het efficiënt beheren van woonruimte in het huursegment op diverse locaties in Nederland.
						</p>
					</div>	
				</section>
			</div>

			<div class="parallax-container" data-parallax="scroll" data-z-index="1" data-image-src="images/SecondBackground.jpg"></div>

			<div class="section-container" id="contactusInfo">
				<section class="contact">
					<h3>.02</h3>
					<h1>Contact</h1>
					<div class="column-container">
						<p class="column">
							Voor vragen of zaken kunt u het onderstaande contactformulier invullen. De ingevulde informatie komt bij ons terecht per mail. Indien nodig zullen wij contact met u opnemen op vervolg van uw bericht.
						</p>
					</div>
					<br>
					<form action="php/sendMessage" method="POST" id="contactForm">
						<!-- Honeypot field - hidden from humans but visible to bots -->
						<div style="display:none;">
							<label for="website">Website</label>
							<input type="text" id="website" name="website" autocomplete="off">
						</div>
						
						<label for="name">Naam *</label>
						<input type="text" id="name" name="Naam" placeholder="Uw naam..." required>
						
						<label for="emailadres">Email Adres *</label>
						<input type="email" id="emailadres" name="Emailadres" placeholder="Uw emailadres..." required>
						
						<label for="telefoonnummer">Telefoon nummer</label>
						<input type="tel" id="telefoonnummer" name="TelefoonNummer" placeholder="Uw telefoon nummer...">

						<label for="onderwerp" id="onderwerpLabel">Onderwerp</label>
						<input type="text" id="onderwerp" name="onderwerp" placeholder="Onderwerp">
						
						<label for="bericht">Bericht *</label>
						<textarea rows = "5" cols = "70" name = "bericht" id="bericht" required></textarea>

						<div class="g-recaptcha" data-sitekey="6LfVYu4ZAAAAAN1zveTgAzy5eUOD5KKlzUQ3ebZE"></div>
						<input type="submit" value="submit" name="submit" id="submit" required>
					</form>
					<?php
					if (!empty($_GET['feedback'])) {
						echo '<div class="feedback">' . htmlspecialchars($_GET['feedback']) . '</div>';
					}
							?>
				</section>
			</div>
		</main>
		<footer>
			<a href="/privacy">Privacy Policy</a>
		</footer>
	</div>
</body>
</html>