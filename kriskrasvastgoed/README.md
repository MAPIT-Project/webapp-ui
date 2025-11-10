# Lokale Testomgeving voor Kris Kras Vastgoed Website

## Vereisten
- PHP 7.x of 8.x
- Webserver (Apache/Nginx) of PHP's ingebouwde server
- MySQL/MariaDB (optioneel voor de huurobjecten functionaliteit)

## Methode 1: PHP's ingebouwde development server (Snelste)

1. Open terminal in de `public_html` map
2. Start de PHP server:
   ```bash
   php -S localhost:8000
   ```
3. Open browser naar: `http://localhost:8000`

## Methode 2: XAMPP/MAMP/WAMP (Aanbevolen voor volledige test)

1. Installeer XAMPP (Windows/Mac) of MAMP (Mac)
2. Kopieer de `public_html` map naar de htdocs/www map
3. Start Apache server via het control panel
4. Open browser naar: `http://localhost/public_html`

## Methode 3: Docker (Geavanceerd)

1. Maak een `docker-compose.yml` bestand:
   ```yaml
   version: '3'
   services:
     web:
       image: php:7.4-apache
       ports:
         - "8000:80"
       volumes:
         - .:/var/www/html
   ```
2. Run: `docker-compose up`
3. Open browser naar: `http://localhost:8000`

## Testen van de huuraanvraag functionaliteit

### Front-end test
1. Navigeer naar `http://localhost:8000/form`
2. Test de volgende functionaliteiten:
   - Formulier velden en validatie
   - Extra huurders toevoegen/verwijderen
   - Bestandsupload interface
   - Responsive design (verklein browser venster)

### Server-side test (met aanpassingen)

Omdat de mailfunctie lokaal niet werkt, maak deze aanpassingen:

1. **Maak een testversie van het processing script:**
   ```bash
   cp php/processRentalApplication.php php/processRentalApplication_test.php
   ```

2. **Pas het testscript aan** (vervang de mail functie):
   ```php
   // Vervang dit:
   $success = mail($to, $subject, $message, $headers);
   
   // Door dit:
   file_put_contents('test_email_output.html', $message);
   $success = true;
   
   // Voeg toe na de mail sectie:
   echo "<h2>Email content opgeslagen in test_email_output.html</h2>";
   echo "<a href='test_email_output.html' target='_blank'>Bekijk email content</a>";
   ```

3. **Pas het formulier aan** in `form.php`:
   ```php
   // Verander:
   <form action="php/processRentalApplication" method="POST" enctype="multipart/form-data" id="rentalApplicationForm">
   
   // Naar:
   <form action="php/processRentalApplication_test" method="POST" enctype="multipart/form-data" id="rentalApplicationForm">
   ```

### reCAPTCHA test
De reCAPTCHA zal lokaal niet werken zonder geldige keys. Voor testing:
1. Vraag test keys aan op: https://www.google.com/recaptcha/admin/create
2. Of tijdelijk uitschakelen door in `php/processRentalApplication_test.php`:
   ```php
   // Vervang:
   if ($captcha_success->success==false) {
   
   // Door:
   if (false && $captcha_success->success==false) {
   ```

## Probleemoplossing

### "Page not found" errors
- Controleer of de `.htaccess` regels werken (alleen op Apache)
- Voor PHP server: gebruik directe URLs zoals `localhost:8000/form.php`

### PHP errors
- Controleer PHP versie: `php -v`
- Enable error reporting in `php.ini`:
  ```ini
  display_errors = On
  error_reporting = E_ALL
  ```

### Upload directory permissions
- Maak temp directory aan:
  ```bash
  mkdir -p /tmp/rental_uploads
  chmod 777 /tmp/rental_uploads
  ```

## Volgende stappen na lokale test
1. Test alle functionaliteiten
2. Controleer de gegenereerde email output
3. Upload naar hosting met de originele (niet-test) bestanden
4. Vervang test reCAPTCHA keys met productie keys