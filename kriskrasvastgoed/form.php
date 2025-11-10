<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Huurovereenkomst gegevens formulier - Kris Kras Nederland Vastgoedbeheer</title>
	<meta name="description" content="Huurovereenkomst gegevens formulier voor Kris Kras Nederland Vastgoedbeheer">
	<link rel="stylesheet" href="css/default.css">
	<script src="js/vendors/jquery.js"></script>
	<script src="vendors.jquery/jquery-3.5.1.js"></script>
	<script src="https://www.google.com/recaptcha/api.js" async defer></script>
	<script src="js/app.js"></script>
</head>
<body>
	<div class="container">
		<header>
			<a href="/" style="color: black;">Home</a>
			<a href="#overOns" style="color: black;">Over ons</a>
			<a href="#contactusInfo" style="color: black;">Contact</a>
		</header>
		<main>
			<div class="section-container">
				<section>
					<h3>.01</h3>
					<h1 style="margin-top: 0;">Gegevens Huurovereenkomst</h1>
					<p>Vul hieronder uw gegevens in zodat wij de huurovereenkomst kunnen opstellen. Velden met een * zijn verplicht.</p>
					
					<form action="php/processRentalApplication" method="POST" enctype="multipart/form-data" id="rentalApplicationForm">
						<!-- Honeypot field - hidden from humans but visible to bots -->
						<div style="display:none;">
							<label for="website">Website</label>
							<input type="text" id="website" name="website" autocomplete="off">
						</div>
						
						<!-- Hoofdhuurder -->
						<fieldset class="tenant-section">
							<legend>Hoofdhuurder</legend>
							
							<div class="form-group">
								<label for="gender_main">Aanhef *</label>
								<div class="radio-group">
									<div class="radio-group-item">
										<input type="radio" id="gender_main_man" name="gender_main" value="Man" style="width: auto;" required>
										<label for="gender_main_man">Man</label>
									</div>
									<div class="radio-group-item">
										<input type="radio" id="gender_main_vrouw" name="gender_main" value="Vrouw" style="width: auto;">
										<label for="gender_main_vrouw">Vrouw</label>
									</div>
									<div class="radio-group-item">
										<input type="radio" id="gender_main_anders" name="gender_main" value="Anders" style="width: auto;">
										<label for="gender_main_anders">Anders</label>
									</div>
								</div>
							</div>
							
							<div class="form-group">
								<label for="name_main">Volledige naam *</label>
								<input type="text" id="name_main" name="name_main" required>
							</div>
							
							<div class="form-group">
								<label for="email_main">E-mailadres *</label>
								<input type="email" id="email_main" name="email_main" required>
							</div>
							
							<div class="form-group">
								<label for="phone_main">Telefoonnummer *</label>
								<input type="tel" id="phone_main" name="phone_main" required>
							</div>
							
							<div class="form-group">
								<label for="birthdate_main">Geboortedatum *</label>
								<input type="date" id="birthdate_main" name="birthdate_main" required>
							</div>
							
							<div class="form-group">
								<label for="address_main">Straat + huisnummer *</label>
								<input type="text" id="address_main" name="address_main" required>
							</div>
							
							<div class="form-group">
								<label for="postcode_main">Postcode *</label>
								<input type="text" id="postcode_main" name="postcode_main" pattern="[0-9]{4}[A-Z]{2}" required>
							</div>
							
							<div class="form-group">
								<label for="city_main">Plaats *</label>
								<input type="text" id="city_main" name="city_main" required>
							</div>
							
							<div class="form-group">
								<label for="id_upload_main">Upload identiteitsbewijs *</label>
								<input type="file" id="id_upload_main" name="id_upload_main" accept=".jpg,.jpeg,.png,.pdf" required>
								<small>Accepteert JPG, PNG of PDF (max 5MB)</small>
								<small class="form-note">
								Voeg ook een kopie van uw identiteitsbewijs toe. Wij adviseren hiervoor de 
								<a href="https://www.rijksoverheid.nl/onderwerpen/identiteitsfraude/vraag-en-antwoord/veilige-kopie-identiteitsbewijs" target="_blank" rel="noopener noreferrer">
									KopieID-app
								</a>
									van de overheid te gebruiken.
								</small>
							</div>
						</fieldset>
						
						<!-- Extra huurders -->
						<fieldset class="tenant-section">
							<legend>Extra Huurders</legend>
							<div id="extraTenants">
								<!-- Extra huurders worden hier dynamisch toegevoegd -->
							</div>
							<button type="button" id="addTenantBtn" class="secondary-btn">Extra huurder toevoegen</button>
						</fieldset>
						
						<!-- Contactpersoon in geval van calamiteiten -->
						<fieldset class="tenant-section">
							<legend>Contactpersoon in geval van calamiteiten</legend>
							
							<div class="form-group">
								<label for="gender_contact">Aanhef *</label>
								<div class="radio-group">
									<div class="radio-group-item">
										<input type="radio" id="gender_contact_man" name="gender_contact" value="Man" style="width: auto;" required>
										<label for="gender_contact_man">Man</label>
									</div>
									<div class="radio-group-item">
										<input type="radio" id="gender_contact_vrouw" name="gender_contact" value="Vrouw" style="width: auto;">
										<label for="gender_contact_vrouw">Vrouw</label>
									</div>
									<div class="radio-group-item">
										<input type="radio" id="gender_contact_anders" name="gender_contact" value="Anders" style="width: auto;">
										<label for="gender_contact_anders">Anders</label>
									</div>
								</div>
							</div>
							
							<div class="form-group">
								<label for="name_contact">Volledige naam *</label>
								<input type="text" id="name_contact" name="name_contact" required>
							</div>
							
							<div class="form-group">
								<label for="address_contact">Straat + huisnummer *</label>
								<input type="text" id="address_contact" name="address_contact" required>
							</div>
							
							<div class="form-group">
								<label for="postcode_contact">Postcode *</label>
								<input type="text" id="postcode_contact" name="postcode_contact" pattern="[0-9]{4}[A-Z]{2}" required>
							</div>
							
							<div class="form-group">
								<label for="city_contact">Plaats *</label>
								<input type="text" id="city_contact" name="city_contact" required>
							</div>
							
							<div class="form-group">
								<label for="phone_contact">Telefoonnummer *</label>
								<input type="tel" id="phone_contact" name="phone_contact" required>
							</div>
						</fieldset>
						
						<!-- Toestemming -->
						<div class="form-group">
							<input type="checkbox" id="consent" name="consent" style="width: auto;" required>
							<label for="consent">Ik ga akkoord met de verwerking van mijn persoonsgegevens conform de AVG *</label>
						</div>
						
						<!-- reCAPTCHA -->
						<div class="form-group">
							<div class="g-recaptcha" data-sitekey="6LfVYu4ZAAAAAN1zveTgAzy5eUOD5KKlzUQ3ebZE"></div>
						</div>
						
						<div class="form-group">
							<input type="submit" value="Indienen" name="submit" id="submit" class="primary-btn">
						</div>
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