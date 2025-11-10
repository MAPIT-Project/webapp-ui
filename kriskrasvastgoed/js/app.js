$(document).ready(function(){
	// Huur aanvraag formulier functionaliteit
	let tenantCount = 0;
	
	// Voeg extra huurder toe
	$('#addTenantBtn').click(function() {
		tenantCount++;
		const tenantHtml = `
			<div class="extra-tenant" id="tenant_${tenantCount}">
				<button type="button" class="remove-tenant" data-tenant="${tenantCount}">×</button>
				<h4>Extra Huurder ${tenantCount}</h4>
				
				<div class="form-group">
					<label for="gender_tenant_${tenantCount}">Aanhef *</label>
					<div class="radio-group">
						<div class="radio-group-item">
							<input type="radio" id="gender_tenant_${tenantCount}_man" name="tenant_${tenantCount}_gender" value="Man" required>
							<label for="gender_tenant_${tenantCount}_man">Man</label>
						</div>
						<div class="radio-group-item">
							<input type="radio" id="gender_tenant_${tenantCount}_vrouw" name="tenant_${tenantCount}_gender" value="Vrouw">
							<label for="gender_tenant_${tenantCount}_vrouw">Vrouw</label>
						</div>
						<div class="radio-group-item">
							<input type="radio" id="gender_tenant_${tenantCount}_anders" name="tenant_${tenantCount}_gender" value="Anders">
							<label for="gender_tenant_${tenantCount}_anders">Anders</label>
						</div>
					</div>
				</div>
				
				<div class="form-group">
					<label for="name_tenant_${tenantCount}">Volledige naam *</label>
					<input type="text" id="name_tenant_${tenantCount}" name="tenant_${tenantCount}_name" required>
				</div>
				
				<div class="form-group">
					<label for="email_tenant_${tenantCount}">E-mailadres</label>
					<input type="email" id="email_tenant_${tenantCount}" name="tenant_${tenantCount}_email">
				</div>
				
				<div class="form-group">
					<label for="phone_tenant_${tenantCount}">Telefoonnummer</label>
					<input type="tel" id="phone_tenant_${tenantCount}" name="tenant_${tenantCount}_phone">
				</div>
				
				<div class="form-group">
					<label for="birthdate_tenant_${tenantCount}">Geboortedatum</label>
					<input type="date" id="birthdate_tenant_${tenantCount}" name="tenant_${tenantCount}_birthdate">
				</div>
				
				<div class="form-group">
					<label for="address_tenant_${tenantCount}">Straat + huisnummer</label>
					<input type="text" id="address_tenant_${tenantCount}" name="tenant_${tenantCount}_address">
				</div>
				
				<div class="form-group">
					<label for="postcode_tenant_${tenantCount}">Postcode</label>
					<input type="text" id="postcode_tenant_${tenantCount}" name="tenant_${tenantCount}_postcode" pattern="[0-9]{4}[A-Z]{2}">
				</div>
				
				<div class="form-group">
					<label for="city_tenant_${tenantCount}">Plaats</label>
					<input type="text" id="city_tenant_${tenantCount}" name="tenant_${tenantCount}_city">
				</div>
				
				<div class="form-group">
					<label for="id_upload_tenant_${tenantCount}">Upload identiteitsbewijs</label>
					<input type="file" id="id_upload_tenant_${tenantCount}" name="tenant_${tenantCount}_id_upload" accept=".jpg,.jpeg,.png,.pdf">
					<small>Accepteert JPG, PNG of PDF (max 5MB)</small>
				</div>
			</div>
		`;
		
		$('#extraTenants').append(tenantHtml);
	});
	
	// Verwijder extra huurder
	$(document).on('click', '.remove-tenant', function() {
		const tenantId = $(this).data('tenant');
		$(`#tenant_${tenantId}`).remove();
	});
	
	// Formulier validatie voor postcode
	$(document).on('input', 'input[pattern="[0-9]{4}[A-Z]{2}"]', function() {
		let value = $(this).val().toUpperCase();
		$(this).val(value);
	});
	
	// Update extra tenants count bij form submission
	$('#rentalApplicationForm').submit(function() {
		$('<input>').attr({
			type: 'hidden',
			name: 'extra_tenants_count',
			value: tenantCount
		}).appendTo('#rentalApplicationForm');
	});
	
	// Smooth scroll voor anker links
	$('a[href^="#"]').click(function(event) {
		if (this.hash !== "") {
			event.preventDefault();
			var hash = this.hash;
			$('html, body').animate({
				scrollTop: $(hash).offset().top
			}, 800, function(){
				window.location.hash = hash;
			});
		}
	});
});

console.log("Deze website is gemaakt door Anmar Noah Ram - anmar.noah@gmail.com")