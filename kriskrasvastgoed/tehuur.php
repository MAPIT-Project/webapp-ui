<?php include('mysql.inc'); ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <link rel="stylesheet" type="text/css" href="css/css.css"/>
		<title></title>
		<!--[if IE]><link href="/css/ie.css" rel="stylesheet" type="text/css" /><![endif]-->
		<!--[if IE 6]><script type="text/javascript" src="/css/png1.js"></script><![endif]-->
		<!--[if IE 6]><script type="text/javascript" src="/css/png2.js"></script><![endif]-->
		<meta name="robots" content="index,follow" />
		<meta name="language" content="nl, dutch" />
		<meta name="distribution" content="global" />
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
							<li class="active"><a href="tehuur.php" class="lvl-1">Te huur aangeboden</a></li>
							<li><a href="contact.php" class="lvl-1">Contact</a></li>
						</ul>
					</div>
					<div id="contentWrapper" class="clearfix">
						
						<div id="content">
							
							<div class="csc-header csc-header-n1">
								<h1 class="csc-firstHeader">Te huur aangeboden</h1>
							</div>
							<p class="bodytext">
                            Doorzoek onze beschikbare locaties:<br />

                            <form id="Form1" method="get">
			<table width="740" border="0" cellspacing="0" cellpadding="0">
				<tr>
					<td align="center">
						<BLOCKQUOTE dir="ltr" style="MARGIN-RIGHT: 0px">
							<P align="left"><strong>Locatie</strong><br><select name="locatie" id="ddlLocatie"><option value="nvt">Geen voorkeur</option>
							<?php
							$result = mysql_query("SELECT * FROM huur_locaties ORDER BY beschrijving",$MYSQL['connection']) or die(mysql_error());
								while($row = mysql_fetch_row($result))  {
									$locatieID = $row[0];
									$naam = $row[1];
									echo "<option value=\"$locatieID\">$naam</option>";
								} ?>
								
									
								</select></P>
						</BLOCKQUOTE>
					</td>
					<td>
						<BLOCKQUOTE dir="ltr" style="MARGIN-RIGHT: 0px">
							<P><strong>Huurprijs</strong><br><select name="huurprijs" id="ddlHuurprijs"><option value="nvt">Geen voorkeur</option>
							<?php
							$result = mysql_query("SELECT * FROM huur_prijzen ORDER BY beschrijving",$MYSQL['connection']) or die(mysql_error());
								while($row = mysql_fetch_row($result))  {
									$huurPrijsID = $row[0];
									$naam = $row[1];
									echo "<option value=\"$huurPrijsID\">$naam</option>";
								} ?>
								
									
								</select>
						</BLOCKQUOTE>
					</td>
					<td>
						<BLOCKQUOTE dir="ltr" style="MARGIN-RIGHT: 0px">
							<P><strong>Aantal kamers</strong><br><select id="ddlAantalKamers" name="aantalKamers"><option value="nvt">Geen voorkeur</option>
							<?php
							$result = mysql_query("SELECT * FROM huur_aantalKamers ORDER BY beschrijving",$MYSQL['connection']) or die(mysql_error());
								while($row = mysql_fetch_row($result))  {
									$aantalKamersID = $row[0];
									$naam = $row[1];
									echo "<option value=\"$aantalKamersID\">$naam</option>";
								} ?>
								
									
								</select></P>
						</BLOCKQUOTE>
			
					<td>
                    <BLOCKQUOTE dir="ltr" style="MARGIN-RIGHT: 0px"><p>
<br />
<input type="submit" value="Nu zoeken" /></p></BLOCKQUOTE></td>
		
				</tr>
			</table>
		</form>
                            
                            
<?php
$soort = 'huur';
$kolomkoppen = array('naam','adres','plaats','kamers','prijs','status');
/*
POST-waarden zijn:
- locatieID
- huurprijsID
- aantalKamersID

*/
include('mysql.inc');

$voorwaarden = array();

$locatieID = $_GET['locatie'];
if($locatieID != 'nvt' && strlen($locatieID)>=1)
	array_push($voorwaarden," locatieID='$locatieID'");
	
$huurprijsID = $_GET['huurprijs'];
if($huurprijsID != 'nvt' && strlen($huurprijsID)>=1)
	array_push($voorwaarden," prijsID='$huurprijsID'");
	
$aantalKamersID = $_GET['aantalKamers'];
if($aantalKamersID != 'nvt' && strlen($aantalKamersID)>=1)
	array_push($voorwaarden," aantalKamersID='$aantalKamersID'");

$aantal_voorwaarden = count($voorwaarden);
for($i=0;$i<$aantal_voorwaarden;$i++) {
	if($i == 0)
		$filter .= 'WHERE';
	$filter .= $voorwaarden[$i];
	
	if($i<$aantal_voorwaarden-1)
		$filter .= ' AND';
}
if(isset($_GET['locatie'])) {
	$result = mysql_query("SELECT * FROM huur_objecten $filter",$MYSQL['connection']) or die(mysql_error());
	if(mysql_num_rows($result)==0)
		echo 'Helaas kunnen we u op dit moment geen woonruimte aanbieden.<br />Onze excuses hiervoor, probeert u het later nog eens.';
	else {
		echo '<table class="kriskras" cellspacing="0" rules="all" border="0" id="dgrObjecten" style="border-width:0px;width:100%;border-collapse:collapse;">
	
		<tr style="font-weight:bold;">
	
			<td>Naam</td><td>Adres</td><td>Plaats</td><td>Kamers</td><td>Huurprijs</td><td>Status</td>
	
		</tr>
	';
		while($row = mysql_fetch_array($result))  {
			echo '<tr>';
			foreach($kolomkoppen as $kolom) { 
				if($kolom=='naam')
					echo "<td><a href='object.php?id=".$row['ID']."&soort=$soort'>".$row[$kolom]."</a></td>";		
				else if($kolom=='prijs')
					echo "<td>&euro; ".$row[$kolom]."</td>";		
					
				else
					echo "<td>".$row[$kolom]."</td>";
			}
			echo '</tr>';
				
		}
		echo '</table>';
	}
}?>                            </p>
						</div>
						<div id="rightColumn">
							<h2>Meer informatie</h2>
							<p class="bodytext">Heeft u vragen of wilt u meer informatie klik hier voor onze <a href="contact.php" class="internal-link">contactgegevens</a>.</p>
						</div>
					</div>
					<div id="footer">Kris Kras Nederland vastgoed beheer</div>
						</div>
					</div>
				</div>
			</body>
		</html>