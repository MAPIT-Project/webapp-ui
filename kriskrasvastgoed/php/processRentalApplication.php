<?php
require_once 'SimpleSpamProtection.php';

if(isset($_POST['submit'])) {
    // Get client IP
    $clientIP = SimpleSpamProtection::getClientIP();
    
    // Check for spam using simple protection
    if (SimpleSpamProtection::isSpam($_POST, $clientIP)) {
        $spamMessage = "Uw aanvraag is gemarkeerd als spam en niet verwerkt.";
        header("Location:https://kriskrasvastgoed.nl/form?feedback=$spamMessage#submit");
        exit();
    }
    
    // Enhanced reCAPTCHA validation - check if reCAPTCHA was submitted
    $skipRecaptcha = (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || $_SERVER['HTTP_HOST'] === '127.0.0.1');
    
    if (!$skipRecaptcha && (!isset($_POST["g-recaptcha-response"]) || empty($_POST["g-recaptcha-response"]))) {
        $fouteCaptcha = "CAPTCHA is verplicht. Probeer het opnieuw.";
        header("Location: https://kriskrasvastgoed.nl/form?feedback=" . urlencode($fouteCaptcha) . "#submit");
        exit();
    }
    
    // Only validate reCAPTCHA if not skipping
    if (!$skipRecaptcha) {
        $response = $_POST["g-recaptcha-response"];
        $url = 'https://www.google.com/recaptcha/api/siteverify';
        $data = array(
            'secret' => '6LfVYu4ZAAAAAMf57Y2QRQc4dw1cx0bplsbCw4Zq',
            'response' => $_POST["g-recaptcha-response"],
            'remoteip' => $clientIP
        );
        $options = array(
            'http' => array (
                'method' => 'POST',
                'content' => http_build_query($data)
            )
        );
        $context  = stream_context_create($options);
        $verify = file_get_contents($url, false, $context);
        $captcha_success=json_decode($verify);
        
        // Debug logging - remove in production
        error_log("reCAPTCHA Response: " . $verify);
        error_log("reCAPTCHA Success: " . ($captcha_success->success ? 'true' : 'false'));
        if (isset($captcha_success->score)) {
            error_log("reCAPTCHA Score: " . $captcha_success->score);
        }
        if (isset($captcha_success->{'error-codes'})) {
            error_log("reCAPTCHA Error Codes: " . implode(', ', $captcha_success->{'error-codes'}));
        }
        
        // Check success - for reCAPTCHA v2 we only check success, for v3 we also check score
        if ($captcha_success->success==false || (isset($captcha_success->score) && $captcha_success->score < 0.5)) {
            $fouteCaptcha = "CAPTCHA is ongeldig. Probeer het opnieuw.";
            header("Location: https://kriskrasvastgoed.nl/form?feedback=" . urlencode($fouteCaptcha) . "#submit");
            exit();
        }
    }
    
    // Basis validatie van verplichte velden
    $required_fields = array(
        'gender_main', 'name_main', 'email_main', 'phone_main', 
        'birthdate_main', 'address_main', 'postcode_main', 'city_main',
        'gender_contact', 'name_contact', 'address_contact', 
        'postcode_contact', 'city_contact', 'phone_contact', 'consent'
    );
    
    foreach ($required_fields as $field) {
        if (empty($_POST[$field])) {
            $veldLeeg = "Niet alle verplichte velden zijn ingevuld";
            header("Location: https://kriskrasvastgoed.nl/form?feedback=" . urlencode($veldLeeg) . "#submit");
            exit();
        }
    }
    
    // Email validatie
    if (!filter_var($_POST['email_main'], FILTER_VALIDATE_EMAIL)) {
        $fouteEmail = "Ongeldig e-mailadres";
        header("Location: https://kriskrasvastgoed.nl/form?feedback=" . urlencode($fouteEmail) . "#submit");
        exit();
    }
    
    // Postcode validatie (Nederlands formaat: 1234AB)
    if (!preg_match('/^[0-9]{4}[A-Z]{2}$/', strtoupper($_POST['postcode_main'])) ||
        !preg_match('/^[0-9]{4}[A-Z]{2}$/', strtoupper($_POST['postcode_contact']))) {
        $foutePostcode = "Ongeldig postcode formaat (1234AB)";
        header("Location: https://kriskrasvastgoed.nl/form?feedback=" . urlencode($foutePostcode) . "#submit");
        exit();
    }
    
    // Geboortedatum validatie (minimaal 18 jaar)
    $birthdate = new DateTime($_POST['birthdate_main']);
    $today = new DateTime();
    $age = $today->diff($birthdate)->y;
    if ($age < 18) {
        $leeftijdFout = "U moet minimaal 18 jaar zijn om een huuraanvraag in te dienen";
        header("Location: https://kriskrasvastgoed.nl/form?feedback=" . urlencode($leeftijdFout) . "#submit");
        exit();
    }
    
    // Bestandsupload validatie
    if (!isset($_FILES['id_upload_main']) || $_FILES['id_upload_main']['error'] !== UPLOAD_ERR_OK) {
        $uploadFout = "Er is een fout opgetreden bij het uploaden van het identiteitsbewijs";
        header("Location: https://kriskrasvastgoed.nl/form?feedback=" . urlencode($uploadFout) . "#submit");
        exit();
    }
    
    $max_file_size = 5 * 1024 * 1024; // 5MB
    $allowed_types = array('image/jpeg', 'image/png', 'application/pdf');
    
    if ($_FILES['id_upload_main']['size'] > $max_file_size) {
        $bestandsGrootteFout = "Het bestand is te groot (max 5MB)";
        header("Location: https://kriskrasvastgoed.nl/form?feedback=" . urlencode($bestandsGrootteFout) . "#submit");
        exit();
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $file_type = finfo_file($finfo, $_FILES['id_upload_main']['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($file_type, $allowed_types)) {
        $bestandsTypeFout = "Alleen JPG, PNG of PDF bestanden zijn toegestaan";
        header("Location:https://kriskrasvastgoed.nl/form?feedback=$bestandsTypeFout#submit");
        exit();
    }
    
    // Verwerk extra huurders
    $extra_tenants = array();
    if (isset($_POST['extra_tenants_count']) && is_numeric($_POST['extra_tenants_count'])) {
        for ($i = 1; $i <= $_POST['extra_tenants_count']; $i++) {
            $tenant_prefix = "tenant_" . $i . "_";
            $tenant_data = array();
            
            $tenant_fields = array('gender', 'name', 'email', 'phone', 'birthdate', 'address', 'postcode', 'city');
            foreach ($tenant_fields as $field) {
                if (!empty($_POST[$tenant_prefix . $field])) {
                    $tenant_data[$field] = $_POST[$tenant_prefix . $field];
                }
            }
            
            // Upload ID voor extra huurder indien aanwezig
            if (isset($_FILES[$tenant_prefix . 'id_upload']) && $_FILES[$tenant_prefix . 'id_upload']['error'] === UPLOAD_ERR_OK) {
                $tenant_file = $_FILES[$tenant_prefix . 'id_upload'];
                if ($tenant_file['size'] <= $max_file_size) {
                    $tenant_finfo = finfo_open(FILEINFO_MIME_TYPE);
                    $tenant_file_type = finfo_file($tenant_finfo, $tenant_file['tmp_name']);
                    finfo_close($tenant_finfo);
                    
                    if (in_array($tenant_file_type, $allowed_types)) {
                        $tenant_data['id_upload'] = $tenant_file;
                    }
                }
            }
            
            if (!empty($tenant_data)) {
                $extra_tenants[] = $tenant_data;
            }
        }
    }
    
    // Genereer unieke bestandsnamen
    $upload_dir = sys_get_temp_dir() . '/rental_uploads/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    $main_id_path = $upload_dir . 'main_id_' . uniqid() . '_' . basename($_FILES['id_upload_main']['name']);
    move_uploaded_file($_FILES['id_upload_main']['tmp_name'], $main_id_path);
    
    $attachments = array($main_id_path);
    
    // Verwerk uploads van extra huurders
    foreach ($extra_tenants as &$tenant) {
        if (isset($tenant['id_upload'])) {
            $tenant_id_path = $upload_dir . 'tenant_id_' . uniqid() . '_' . basename($tenant['id_upload']['name']);
            move_uploaded_file($tenant['id_upload']['tmp_name'], $tenant_id_path);
            $attachments[] = $tenant_id_path;
            $tenant['id_upload_path'] = $tenant_id_path;
            unset($tenant['id_upload']); // Verwijder de tijdelijke file data
        }
    }
    
    // Bereid e-mail inhoud voor
    $email_content = "<html><body>";
    $email_content .= "<h2>Gegevens voor Huurovereenkomst ontvangen</h2>";
    
    // Hoofdhuurder informatie
    $email_content .= "<h3>Hoofdhuurder</h3>";
    $email_content .= "<p><strong>Aanhef:</strong> " . htmlspecialchars($_POST['gender_main']) . "</p>";
    $email_content .= "<p><strong>Naam:</strong> " . htmlspecialchars($_POST['name_main']) . "</p>";
    $email_content .= "<p><strong>E-mail:</strong> " . htmlspecialchars($_POST['email_main']) . "</p>";
    $email_content .= "<p><strong>Telefoon:</strong> " . htmlspecialchars($_POST['phone_main']) . "</p>";
    $email_content .= "<p><strong>Geboortedatum:</strong> " . htmlspecialchars($_POST['birthdate_main']) . "</p>";
    $email_content .= "<p><strong>Adres:</strong> " . htmlspecialchars($_POST['address_main']) . "</p>";
    $email_content .= "<p><strong>Postcode:</strong> " . htmlspecialchars($_POST['postcode_main']) . "</p>";
    $email_content .= "<p><strong>Plaats:</strong> " . htmlspecialchars($_POST['city_main']) . "</p>";
    
    // Extra huurders
    if (!empty($extra_tenants)) {
        $email_content .= "<h3>Extra Huurders</h3>";
        foreach ($extra_tenants as $index => $tenant) {
            $email_content .= "<h4>Huurder " . ($index + 1) . "</h4>";
            foreach ($tenant as $key => $value) {
                if ($key !== 'id_upload_path') {
                    $email_content .= "<p><strong>" . ucfirst($key) . ":</strong> " . htmlspecialchars($value) . "</p>";
                }
            }
        }
    }
    
    // Contactpersoon
    $email_content .= "<h3>Contactpersoon in geval van calamiteiten</h3>";
    $email_content .= "<p><strong>Aanhef:</strong> " . htmlspecialchars($_POST['gender_contact']) . "</p>";
    $email_content .= "<p><strong>Naam:</strong> " . htmlspecialchars($_POST['name_contact']) . "</p>";
    $email_content .= "<p><strong>Adres:</strong> " . htmlspecialchars($_POST['address_contact']) . "</p>";
    $email_content .= "<p><strong>Postcode:</strong> " . htmlspecialchars($_POST['postcode_contact']) . "</p>";
    $email_content .= "<p><strong>Plaats:</strong> " . htmlspecialchars($_POST['city_contact']) . "</p>";
    $email_content .= "<p><strong>Telefoon:</strong> " . htmlspecialchars($_POST['phone_contact']) . "</p>";
    
    $email_content .= "<p><strong>Toestemming gegeven:</strong> Ja</p>";
    $email_content .= "<p><strong>Datum van aanvraag:</strong> " . date('d-m-Y H:i:s') . "</p>";
    $email_content .= "</body></html>";
    
    // Stuur e-mail
    $to = "info@kriskrasvastgoed.nl";
    $subject = "Huurovereenkomst gegevens van " . htmlspecialchars($_POST['name_main']);
    
    // Voorbereiden van de e-mail met bijlagen
    $boundary = uniqid('np');
    
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "From: contact@kriskrasvastgoed.nl\r\n";
    $headers .= "Reply-To: " . htmlspecialchars($_POST['email_main']) . "\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=" . $boundary . "\r\n";
    
    $message = "--" . $boundary . "\r\n";
    $message .= "Content-type: text/html; charset=iso-8859-1\r\n";
    $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
    $message .= $email_content . "\r\n\r\n";
    
    // Voeg bijlagen toe
    foreach ($attachments as $file_path) {
        if (file_exists($file_path)) {
            $file_name = basename($file_path);
            $file_size = filesize($file_path);
            $handle = fopen($file_path, "r");
            $content = fread($handle, $file_size);
            fclose($handle);
            $encoded_content = chunk_split(base64_encode($content));
            
            $message .= "--" . $boundary . "\r\n";
            $message .= "Content-Type: " . mime_content_type($file_path) . "; name=\"" . $file_name . "\"\r\n";
            $message .= "Content-Transfer-Encoding: base64\r\n";
            $message .= "Content-Disposition: attachment; filename=\"" . $file_name . "\"\r\n\r\n";
            $message .= $encoded_content . "\r\n\r\n";
        }
    }
    
    $message .= "--" . $boundary . "--";
    
    $success = mail($to, $subject, $message, $headers);
    
    // Ruim tijdelijke bestanden op
    foreach ($attachments as $file_path) {
        if (file_exists($file_path)) {
            unlink($file_path);
        }
    }
    
    // Stuur feedback naar gebruiker
    if ($success) {
        $succesBericht = "Uw huuraanvraag is succesvol ingediend. We nemen zo spoedig mogelijk contact met u op.";
        header("Location:https://kriskrasvastgoed.nl/form?feedback=$succesBericht#submit");
    } else {
        $foutMelding = "Sorry er is iets fout gegaan bij het verzenden van uw aanvraag. Probeer het opnieuw.";
        header("Location:https://kriskrasvastgoed.nl/form?feedback=$foutMelding#submit");
    }
} else {
    // Debug informatie voor algemene fout
    echo "<h1>Algemene Fout Debug Informatie</h1>";
    echo "<h2>Fout: Formulier niet verzonden</h2>";
    echo "<h3>Request Method:</h3><pre>";
    echo $_SERVER['REQUEST_METHOD'] . "\n";
    echo "</pre>";
    echo "<h3>POST Data:</h3><pre>";
    var_dump($_POST);
    echo "</pre>";
    echo "<h3>GET Data:</h3><pre>";
    var_dump($_GET);
    echo "</pre>";
    echo "<h3>Server Info:</h3><pre>";
    echo "HTTP_HOST: " . $_SERVER['HTTP_HOST'] . "\n";
    echo "REQUEST_URI: " . $_SERVER['REQUEST_URI'] . "\n";
    echo "HTTP_REFERER: " . (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'Niet ingesteld') . "\n";
    echo "</pre>";
    
    error_log("Algemene fout: Formulier niet verzonden. Request method: " . $_SERVER['REQUEST_METHOD']);
    
    // Optioneel: toch redirecten bij algemene fout
    // header("Location:https://kriskrasvastgoed.nl/form?feedback=Er gaat iets mis#submit");
    exit();
}
?>