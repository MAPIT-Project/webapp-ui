<?php
require_once '../php/SpamProtection.php';

// Simple authentication - in production, use proper authentication
session_start();
if (!isset($_SESSION['admin_logged_in'])) {
    if ($_POST['password'] === 'spam_admin_2024') {
        $_SESSION['admin_logged_in'] = true;
    } else {
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <title>Spam Protection Admin - Login</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
                input { width: 100%; padding: 10px; margin: 10px 0; box-sizing: border-box; }
                button { background: #333; color: white; padding: 10px 20px; border: none; cursor: pointer; }
                .error { color: red; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h2>Spam Protection Admin</h2>
            <form method="post">
                <input type="password" name="password" placeholder="Admin Password" required>
                <button type="submit">Login</button>
            </form>
            <?php if ($_POST) { echo '<div class="error">Invalid password</div>'; } ?>
        </body>
        </html>
        <?php
        exit;
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: spam_dashboard.php');
    exit;
}

// Handle IP unblocking
if (isset($_POST['unblock_ip'])) {
    $blockedIPs = SpamProtection::loadBlockedIPs();
    $ipToUnblock = $_POST['unblock_ip'];
    $blockedIPs = array_filter($blockedIPs, function($ip) use ($ipToUnblock) {
        return $ip !== $ipToUnblock;
    });
    SpamProtection::saveBlockedIPs($blockedIPs);
    header('Location: spam_dashboard.php?unblocked=' . urlencode($ipToUnblock));
    exit;
}

// Get data
$sessions = SpamProtection::loadSessions();
$blockedIPs = SpamProtection::loadBlockedIPs();

// Filter spam attempts
$spamAttempts = array_filter($sessions, function($session) {
    return isset($session['spam']) && $session['spam'] === true;
});

// Group by IP
$spamByIP = [];
foreach ($spamAttempts as $attempt) {
    $ip = $attempt['ip'];
    if (!isset($spamByIP[$ip])) {
        $spamByIP[$ip] = [];
    }
    $spamByIP[$ip][] = $attempt;
}

// Get recent activity (last 24 hours)
$recentActivity = array_filter($sessions, function($session) {
    return (time() - $session['timestamp']) < 86400; // 24 hours
});
?>
<!DOCTYPE html>
<html>
<head>
    <title>Spam Protection Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #007bff; }
        .stat-label { color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .alert { padding: 15px; margin-bottom: 20px; border-radius: 4px; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
        .badge-danger { background: #dc3545; color: white; }
        .badge-warning { background: #ffc107; color: #212529; }
        .timestamp { font-family: monospace; color: #666; }
        .ip-address { font-family: monospace; background: #f1f1f1; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Spam Protection Dashboard</h1>
            <a href="?logout=1" class="btn btn-secondary">Logout</a>
        </div>

        <?php if (isset($_GET['unblocked'])): ?>
            <div class="alert alert-success">
                IP <?php echo htmlspecialchars($_GET['unblocked']); ?> has been unblocked.
            </div>
        <?php endif; ?>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number"><?php echo count($blockedIPs); ?></div>
                <div class="stat-label">Blocked IPs</div>
            </div>
            <div class="stat-card">
                <div class="stat-number"><?php echo count($spamAttempts); ?></div>
                <div class="stat-label">Total Spam Attempts</div>
            </div>
            <div class="stat-card">
                <div class="stat-number"><?php echo count($recentActivity); ?></div>
                <div class="stat-label">Last 24h Activity</div>
            </div>
            <div class="stat-card">
                <div class="stat-number"><?php echo count($spamByIP); ?></div>
                <div class="stat-label">Unique Spam IPs</div>
            </div>
        </div>

        <h2>Blocked IP Addresses</h2>
        <table>
            <thead>
                <tr>
                    <th>IP Address</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($blockedIPs)): ?>
                    <tr><td colspan="3">No blocked IPs</td></tr>
                <?php else: ?>
                    <?php foreach ($blockedIPs as $ip): ?>
                        <tr>
                            <td><span class="ip-address"><?php echo htmlspecialchars($ip); ?></span></td>
                            <td><span class="badge badge-danger">Blocked</span></td>
                            <td>
                                <form method="post" style="display:inline;">
                                    <input type="hidden" name="unblock_ip" value="<?php echo htmlspecialchars($ip); ?>">
                                    <button type="submit" class="btn btn-success" onclick="return confirm('Unblock this IP?')">Unblock</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>

        <h2>Recent Spam Attempts (Last 24h)</h2>
        <table>
            <thead>
                <tr>
                    <th>IP Address</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Attempts</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($spamByIP)): ?>
                    <tr><td colspan="4">No recent spam attempts</td></tr>
                <?php else: ?>
                    <?php foreach ($spamByIP as $ip => $attempts): ?>
                        <?php 
                        $recentAttempts = array_filter($attempts, function($attempt) {
                            return (time() - $attempt['timestamp']) < 86400;
                        });
                        if (!empty($recentAttempts)):
                            $latestAttempt = end($recentAttempts);
                        ?>
                        <tr>
                            <td><span class="ip-address"><?php echo htmlspecialchars($ip); ?></span></td>
                            <td><span class="timestamp"><?php echo date('Y-m-d H:i:s', $latestAttempt['timestamp']); ?></span></td>
                            <td><?php echo htmlspecialchars($latestAttempt['reason'] ?? 'Unknown'); ?></td>
                            <td><span class="badge badge-warning"><?php echo count($recentAttempts); ?></span></td>
                        </tr>
                        <?php endif; ?>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
            <p>Spam Protection System v1.0 | Last updated: <?php echo date('Y-m-d H:i:s'); ?></p>
        </div>
    </div>
</body>
</html>