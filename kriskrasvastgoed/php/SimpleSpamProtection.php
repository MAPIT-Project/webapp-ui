<?php
// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

class SimpleSpamProtection {
    private static $spamKeywords = [
        'seo', 'https://t.me', 'automatically generated', 'web traffic', 
        'click here', 'reviewed your domain', 'monkeydigital', 'bitcoin',
        'cryptocurrency', 'investment', 'loan', 'casino', 'gambling',
        'viagra', 'cialis', 'pharmacy', 'weight loss', 'make money',
        'work from home', 'forex', 'trading', 'crypto', 'nft',
        'onlyfans', 'adult', 'xxx', 'porn', 'sex', 'dating'
    ];
    
    private static $sessionFile = 'simple_spam_sessions.json';
    
    /**
     * Simple spam check - only the most obvious spam
     */
    public static function isSpam($data, $ip) {
        // Check honeypot field - most reliable bot detector
        if (!empty($data['website'])) {
            self::logAttempt($ip, 'honeypot');
            return true;
        }
        
        // Check for obvious spam keywords in message/bericht only
        if (isset($data['bericht']) && self::containsObviousSpam($data['bericht'])) {
            self::logAttempt($ip, 'keywords');
            return true;
        }
        
        // Check for obvious spam keywords in message/bericht only (contact form)
        if (isset($data['message']) && self::containsObviousSpam($data['message'])) {
            self::logAttempt($ip, 'keywords');
            return true;
        }
        
        // Very basic rate limiting - only block extreme abuse
        if (self::isExtremeAbuse($ip)) {
            self::logAttempt($ip, 'extreme_abuse');
            return true;
        }
        
        return false;
    }
    
    /**
     * Check for obvious spam keywords only
     */
    private static function containsObviousSpam($text) {
        $text = strtolower($text);
        $obviousSpam = ['seo', 'https://t.me', 'monkeydigital', 'bitcoin', 'casino', 'viagra', 'cialis'];
        
        foreach ($obviousSpam as $keyword) {
            if (strpos($text, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Only block extreme abuse (20+ submissions in 1 hour)
     */
    private static function isExtremeAbuse($ip) {
        $sessions = self::loadSessions();
        $currentTime = time();
        $recentCount = 0;
        
        foreach ($sessions as $entry) {
            if ($entry['ip'] === $ip && ($currentTime - $entry['timestamp']) < 3600) {
                $recentCount++;
            }
        }
        
        // Log this submission
        $sessions[] = [
            'ip' => $ip,
            'timestamp' => $currentTime
        ];
        
        // Clean old entries
        $sessions = array_filter($sessions, function($entry) use ($currentTime) {
            return ($currentTime - $entry['timestamp']) < 3600;
        });
        
        self::saveSessions($sessions);
        
        return $recentCount >= 20;
    }
    
    /**
     * Log spam attempt
     */
    private static function logAttempt($ip, $reason) {
        $sessions = self::loadSessions();
        $sessions[] = [
            'ip' => $ip,
            'timestamp' => time(),
            'spam' => true,
            'reason' => $reason
        ];
        self::saveSessions($sessions);
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