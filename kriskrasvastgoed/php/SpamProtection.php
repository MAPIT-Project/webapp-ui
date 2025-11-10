<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

class SpamProtection {
    private static $spamKeywords = [
        'seo', 'https://t.me', 'automatically generated', 'web traffic', 
        'click here', 'reviewed your domain', 'monkeydigital', 'bitcoin',
        'cryptocurrency', 'investment', 'loan', 'casino', 'gambling',
        'viagra', 'cialis', 'pharmacy', 'weight loss', 'make money',
        'work from home', 'forex', 'trading', 'crypto', 'nft',
        'onlyfans', 'adult', 'xxx', 'porn', 'sex', 'dating',
        'lottery', 'winner', 'prize', 'congratulations', 'free money',
        'guaranteed', 'risk free', 'no risk', 'quick money', 'easy money',
        'get rich', 'millionaire', 'billionaire', 'profit', 'earnings',
        'investment opportunity', 'business opportunity', 'mlm', 'pyramid',
        'scheme', 'scam', 'fraud', 'hack', 'crack', 'software',
        'download', 'free download', 'torrent', 'streaming', 'movies',
        'series', 'watch online', 'free watch', 'premium account',
        'account hack', 'password hack', 'credit card', 'bank account',
        'transfer', 'wire transfer', 'western union', 'money transfer',
        'urgent', 'act now', 'limited time', 'exclusive', 'special offer',
        'discount', 'sale', 'promotion', 'coupon', 'voucher', 'deal',
        'cheap', 'best price', 'lowest price', 'free shipping', 'delivery',
        'order now', 'buy now', 'shop now', 'visit website', 'check out',
        'link', 'url', 'http', 'https', 'www', '.com', '.net', '.org',
        '.info', '.biz', '.xyz', '.top', '.club', '.online', '.site'
    ];
    
    private static $sessionFile = 'spam_protection_sessions.json';
    private static $blockedIPsFile = 'blocked_ips.json';
    
    /**
     * Check if the submission is spam using multiple methods
     */
    public static function isSpam($data, $ip) {
        // Debug logging
        $debug_log = "Spam check for IP: $ip\n";
        
        // Check honeypot field
        if (self::checkHoneypot($data)) {
            $debug_log .= "BLOCKED: Honeypot triggered\n";
            file_put_contents('spam_debug.log', $debug_log, FILE_APPEND);
            self::logSpamAttempt($ip, 'honeypot');
            return true;
        }
        $debug_log .= "Honeypot: OK\n";
        
        // Check submission time (too fast is suspicious)
        if (self::isSubmissionTooFast($data)) {
            $debug_log .= "BLOCKED: Submission too fast\n";
            file_put_contents('spam_debug.log', $debug_log, FILE_APPEND);
            self::logSpamAttempt($ip, 'too_fast');
            return true;
        }
        $debug_log .= "Time check: OK\n";
        
        // Check rate limiting
        if (self::isRateLimited($ip)) {
            $debug_log .= "BLOCKED: Rate limited\n";
            file_put_contents('spam_debug.log', $debug_log, FILE_APPEND);
            self::logSpamAttempt($ip, 'rate_limit');
            return true;
        }
        $debug_log .= "Rate limit: OK\n";
        
        // Check if IP is blocked
        if (self::isIPBlocked($ip)) {
            $debug_log .= "BLOCKED: IP is blocked\n";
            file_put_contents('spam_debug.log', $debug_log, FILE_APPEND);
            return true;
        }
        $debug_log .= "IP block: OK\n";
        
        // Check for spam keywords
        if (self::containsSpamKeywords($data)) {
            $debug_log .= "BLOCKED: Spam keywords found\n";
            file_put_contents('spam_debug.log', $debug_log, FILE_APPEND);
            self::logSpamAttempt($ip, 'keywords');
            return true;
        }
        $debug_log .= "Keywords: OK\n";
        
        // Check CSRF token
        $csrfResult = self::validateCSRFToken($data);
        if ($csrfResult === false) {
            $debug_log .= "BLOCKED: CSRF token invalid\n";
            file_put_contents('spam_debug.log', $debug_log, FILE_APPEND);
            self::logSpamAttempt($ip, 'csrf');
            return true;
        }
        $debug_log .= "CSRF: OK\n";
        
        $debug_log .= "PASSED: Not spam\n";
        file_put_contents('spam_debug.log', $debug_log, FILE_APPEND);
        return false;
    }
    
    /**
     * Check if honeypot field is filled (indicates bot)
     */
    private static function checkHoneypot($data) {
        return !empty($data['website']);
    }
    
    /**
     * Check if form was submitted too quickly (less than 3 seconds)
     */
    private static function isSubmissionTooFast($data) {
        if (!isset($data['form_timestamp'])) {
            return true; // No timestamp means suspicious
        }
        
        $submissionTime = time() - (int)$data['form_timestamp'];
        return $submissionTime < 3; // Less than 3 seconds is suspicious
    }
    
    /**
     * Check rate limiting (max 3 submissions per 10 minutes per IP)
     */
    private static function isRateLimited($ip) {
        $sessions = self::loadSessions();
        $currentTime = time();
        
        // Clean old entries
        $sessions = array_filter($sessions, function($entry) use ($currentTime) {
            return ($currentTime - $entry['timestamp']) < 600; // 10 minutes
        });
        
        // Count submissions from this IP
        $ipSubmissions = array_filter($sessions, function($entry) use ($ip) {
            return $entry['ip'] === $ip;
        });
        
        if (count($ipSubmissions) >= 3) {
            return true;
        }
        
        // Add this submission
        $sessions[] = [
            'ip' => $ip,
            'timestamp' => $currentTime
        ];
        
        self::saveSessions($sessions);
        return false;
    }
    
    /**
     * Check if IP is blocked
     */
    private static function isIPBlocked($ip) {
        $blockedIPs = self::loadBlockedIPs();
        return in_array($ip, $blockedIPs);
    }
    
    /**
     * Check for spam keywords in form data
     */
    private static function containsSpamKeywords($data) {
        $textToCheck = '';
        
        // Combine all text fields for checking
        foreach ($data as $key => $value) {
            if (is_string($value) && !in_array($key, ['csrf_token', 'form_timestamp'])) {
                $textToCheck .= ' ' . strtolower($value);
            }
        }
        
        foreach (self::$spamKeywords as $keyword) {
            if (strpos($textToCheck, strtolower($keyword)) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Validate CSRF token
     */
    private static function validateCSRFToken($data) {
        if (!isset($data['csrf_token']) || !isset($_SESSION['csrf_tokens'])) {
            return false;
        }
        
        return in_array($data['csrf_token'], $_SESSION['csrf_tokens']);
    }
    
    /**
     * Log spam attempt and potentially block IP
     */
    private static function logSpamAttempt($ip, $reason) {
        $sessions = self::loadSessions();
        $spamAttempts = 0;
        
        // Count recent spam attempts from this IP
        $currentTime = time();
        foreach ($sessions as $entry) {
            if ($entry['ip'] === $ip && 
                isset($entry['spam']) && 
                ($currentTime - $entry['timestamp']) < 3600) { // 1 hour
                $spamAttempts++;
            }
        }
        
        // Log this attempt
        $sessions[] = [
            'ip' => $ip,
            'timestamp' => $currentTime,
            'spam' => true,
            'reason' => $reason
        ];
        
        // Block IP if too many spam attempts
        if ($spamAttempts >= 5) {
            self::blockIP($ip);
        }
        
        self::saveSessions($sessions);
    }
    
    /**
     * Block an IP address
     */
    private static function blockIP($ip) {
        $blockedIPs = self::loadBlockedIPs();
        if (!in_array($ip, $blockedIPs)) {
            $blockedIPs[] = $ip;
            self::saveBlockedIPs($blockedIPs);
        }
    }
    
    /**
     * Load sessions from file
     */
    private static function loadSessions() {
        if (!file_exists(self::$sessionFile)) {
            return [];
        }
        
        $json = file_get_contents(self::$sessionFile);
        return json_decode($json, true) ?: [];
    }
    
    /**
     * Save sessions to file
     */
    private static function saveSessions($sessions) {
        file_put_contents(self::$sessionFile, json_encode($sessions));
    }
    
    /**
     * Load blocked IPs from file
     */
    private static function loadBlockedIPs() {
        if (!file_exists(self::$blockedIPsFile)) {
            return [];
        }
        
        $json = file_get_contents(self::$blockedIPsFile);
        return json_decode($json, true) ?: [];
    }
    
    /**
     * Save blocked IPs to file
     */
    private static function saveBlockedIPs($blockedIPs) {
        file_put_contents(self::$blockedIPsFile, json_encode($blockedIPs));
    }
    
    /**
     * Generate and store CSRF token
     */
    public static function generateCSRFToken() {
        if (!isset($_SESSION)) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_tokens'])) {
            $_SESSION['csrf_tokens'] = [];
        }
        
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_tokens'][] = $token;
        
        // Keep only last 10 tokens
        if (count($_SESSION['csrf_tokens']) > 10) {
            $_SESSION['csrf_tokens'] = array_slice($_SESSION['csrf_tokens'], -10);
        }
        
        return $token;
    }
    
    /**
     * Get client IP address
     */
    public static function getClientIP() {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                $ip = trim($ips[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
?>