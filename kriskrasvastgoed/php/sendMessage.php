<?php
require_once 'SimpleSpamProtection.php';

if(isset($_POST['submit'])) {
    // Get client IP
    $clientIP = SimpleSpamProtection::getClientIP();
    
    // Check for spam using simple protection
    if (SimpleSpamProtection::isSpam($_POST, $clientIP)) {
        $spamMessage = "Uw bericht is gemarkeerd als spam en niet verzonden.";
        header("Location:https://kriskrasvastgoed.nl/index.php?feedback=$spamMessage#submit");
        exit();
    }
    
    // Enhanced reCAPTCHA validation - check if reCAPTCHA was submitted
    $skipRecaptcha = (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || $_SERVER['HTTP_HOST'] === '127.0.0.1');
    
    if (!$skipRecaptcha && (!isset($_POST["g-recaptcha-response"]) || empty($_POST["g-recaptcha-response"]))) {
        $fouteCaptcha = "CAPTCHA is verplicht. Probeer het opnieuw.";
        header("Location: https://kriskrasvastgoed.nl/index.php?feedback=" . urlencode($fouteCaptcha) . "#submit");
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
        
        if ($captcha_success->success==false || $captcha_success->score < 0.5) {
            $fouteCaptcha = "CAPTCHA is ongeldig. Probeer het opnieuw.";
            header("Location: https://kriskrasvastgoed.nl/index.php?feedback=" . urlencode($fouteCaptcha) . "#submit");
            exit();
        }
    }
    
    // Sanitize and validate input
    $naam = filter_var($_POST['Naam'], FILTER_SANITIZE_STRING);
    $email = filter_var($_POST['Emailadres'], FILTER_SANITIZE_EMAIL);
    $bericht = filter_var($_POST['bericht'], FILTER_SANITIZE_STRING);
    $onderwerp = filter_var($_POST['onderwerp'], FILTER_SANITIZE_STRING);
    $telefoonnummer = filter_var($_POST['TelefoonNummer'], FILTER_SANITIZE_STRING);
    
    // Enhanced validation
    if (empty($naam) || empty($email) || empty($bericht)) {
        $vulAllesIn = "Vul alstublieft alle verplichte velden in!";
        header("Location:https://kriskrasvastgoed.nl/index.php?feedback=$vulAllesIn#submit");
        exit();
    }
    
    // Email validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $fouteEmail = "Ongeldig e-mailadres";
        header("Location:https://kriskrasvastgoed.nl/index.php?feedback=$fouteEmail#submit");
        exit();
    }
    
    // Check for suspicious patterns in name and phone
    if (strlen($naam) > 100 || strlen($telefoonnummer) > 20) {
        $suspiciousInput = "Ongeldige invoer gedetecteerd";
        header("Location:https://kriskrasvastgoed.nl/index.php?feedback=$suspiciousInput#submit");
        exit();
    }
    
    // Check for excessive URLs in message
    $urlCount = preg_match_all('/https?:\/\//', $bericht);
    if ($urlCount > 2) {
        $tooManyUrls = "Te veel links in het bericht";
        header("Location:https://kriskrasvastgoed.nl/index.php?feedback=$tooManyUrls#submit");
        exit();
    }
    
    $mailInhoud="Verzonden door: $email \nNaam: $naam \nTelefoonnummer: $telefoonnummer \nMessage: $bericht";
    
    $ontvanger = "info@kriskrasvastgoed.nl";
    $onderwerp = "Contact Form";
    $mailkoptekst = "From: $email \r\n";
    $mailkoptekst .= "Reply-To: $email \r\n";
    $mailkoptekst .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $mailkoptekst .= "X-Priority: 3\r\n";
    $mailkoptekst .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    $success = mail($ontvanger, $onderwerp, $mailInhoud, $mailkoptekst);
    
    $succesBericht = "Bericht verzonden!";
    $foutMelding = "Sorry er is iets fout gegaan, probeer het opnieuw!";
    
    if (!$success) {
        header("Location:https://kriskrasvastgoed.nl/index.php?feedback=$foutMelding#submit");
    } else {
        header("Location:https://kriskrasvastgoed.nl/index.php?feedback=$succesBericht#submit");
        
        // Send to Discord webhook
        $webhookurl = "https://discord.com/api/webhooks/839638428646899753/gouwrMOYzZUT10zQZXAegmu9JzJYzhjFTsVPZqCVJxsZ7ehNK190gTITUC35POXYrRCb";
        
        $json_data = json_encode([
            "content" => $mailInhoud
        ]);
        
        $ch = curl_init($webhookurl);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-type: application/json'));
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
        
        $response = curl_exec($ch);
        curl_close($ch);
    }
} else {
    header("Location:https://kriskrasvastgoed.nl/index.php?feedback=Er gaat iets mis#submit");
    exit();
}
?>