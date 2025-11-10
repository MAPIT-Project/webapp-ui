<?php
print $_PUT
?>

<!DOCTYPE html>
<html lang="en" >
<head>
  <meta charset="UTF-8">
  <title>Opleveren</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/5.0.0/normalize.min.css">
<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-beta.2/css/bootstrap.css'>
<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.1.2/css/intlTelInput.css'>
<link rel='stylesheet' href='https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css'>
<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/jquery-nice-select/1.1.0/css/nice-select.min.css'><link rel="stylesheet" href="./style.css">
</head>
<body>
<!-- partial:index.partial.html -->
<!-- Multi step form --> 
<section class="multi_step_form">  
  <form id="msform" action="https://aiosupply.nl/public/user/opleveren/upload" method="POST" enctype="application/x-www-form-urlencoded"> 
    <!-- Tittle -->
    <div class="tittle">
      <h2>Inspectierapport</h2>
      <p>Exclusief formulier voor Kris Kras Nederland Vastgoedbeheer</p>
    </div>
    <!-- progressbar -->
    <ul id="progressbar">
      <li class="active">Toegangscode</li>  
      <li>Inspectierapport</li>
      <li>Afbeeldingen</li> 
    </ul>
    <!-- fieldsets -->
    <fieldset>
      <h3>Toegangscode</h3>
      <div class="done_text"> 
        <h6>Je hebt een code nodig om het formulier te verzenden<br>Voer de toegangscode in</h6> 
      </div>  
      <div class="code_group"> 
        <input type="text" name="number1" class="form-control accessBtn" maxlength="1" onClick="this.select()" placeholder="0">
        <input type="text" name="number2" class="form-control accessBtn" maxlength="1" onClick="this.select()" placeholder="0">
        <input type="text" name="number3" class="form-control accessBtn" maxlength="1" onClick="this.select()" placeholder="0">
        <input type="text" name="number4" class="form-control accessBtn" maxlength="1" onClick="this.select()" placeholder="0">
        <input type="text" name="number5" class="form-control accessBtn" maxlength="1" onClick="this.select()" onChange="if (this.value.length > 0) {document.getElementById('firstNext').disabled = false}" placeholder="0">
      </div> 
      <button type="button" class="action-button previous_button" onclick="location.href='https://kriskrasvastgoed.nl/'">Terug</button>
      <button type="button" class="next action-button" id="firstNext" hidden>Volgende</button>  
    </fieldset>
    
    <fieldset>
      <h3>Inspectierapport</h3>
      <h6>Het formulier voor de begin/eind inspectie</h6> 
      <div class="form-group" style="margin-bottom: 0.1rem;"> 
        <h3 style="text-align: left; margin-left: 0.1%;">Naam huurder(s)</h3>
      </div> 
      <div class="form-group fg_2" style="margin-bottom: 1.5rem; padding-top: 0px;"> 
        <input type="text" name="fullName" class="form-control" placeholder="Naam">
      </div> 
      <div class="form-group" style="margin-bottom: 0.1rem;"> 
        <h3 style="text-align: left; margin-left: 0.1%; width: 49%; float: left; margin-right: 1rem">Adres woonruimte</h3>
		<h3 style="text-align: left; margin-left: 0.1%;" style="margin-bottom: 0.1rem;">Stad</h3>
      </div> 
      <div class="form-group fg_2" style="margin-bottom: 1.5rem; padding-top: 0px;"> 
        <input type="text" name="adres" class="form-control" style="width: 49%; float: left; margin-right: 1rem" placeholder="Straat + Huisnr.">
		<input type="text" name="stad" class="form-control" style="width: 49%;" placeholder="Stad">
      </div>
      <div class="form-group" style="margin-bottom: 0.1rem;"> 
        <h3 style="text-align: left; margin-left: 0.1%;" style="margin-bottom: 0.1rem;">Opmerkingen</h3>
      </div> 
	  <div class="form-group fg_3" style="margin-bottom: 1.5rem; padding-top: 0px;"> 
        <input type="text" name="opmerkingen" class="form-control" placeholder="Opmerkingen">
      </div> 
      <button type="button" class="action-button previous previous_button">Terug</button> 
      <button type="button" class="next action-button">Volgende</button>
    </fieldset>
    <fieldset>
      <h3>Afbeeldingen Uploaden</h3>
      <h6>Upload hier de foto's,  maximale upload-size: 128MB</h6>
      <div class="input-group"> 
        <div class="custom-file">
          <script>
function showFiles(){
  if(document.getElementById('upload').value !== "") {

    console.log(document.getElementById('upload').files);
    var tempFiles = document.getElementById('upload').files;

    for (i = 0; i < tempFiles.length; i++) {
      document.getElementById('switchVisibility').innerHTML += '<li><a href="#"><i class="ion-paperclip"></i>' + tempFiles[i]['name'] + '</a></li>';
    }
	document.getElementById('switchVisibility').hidden = false
  }
}
</script>
          <input type="file" name="image" class="custom-file-input" id="upload" onChange="showFiles()" multiple>
          <label class="custom-file-label" for="upload"><i class="ion-android-cloud-outline"></i>Selecteer Bestanden</label>
        </div>
      </div>
      <ul class="file_added" id="switchVisibility" hidden>
        <li>Bestanden:</li>
      </ul>
      <button type="button" class="action-button previous previous_button">Terug</button>
      <input type="submit" value="Verzenden" name="submitt" class="action-button"> 
    </fieldset>  
  </form>  
</section> 
<!-- End Multi step form -->
<!-- partial -->
<script src='https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.0.0-beta/js/bootstrap.min.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.3/jquery.easing.min.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/12.1.2/js/intlTelInput.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js'></script>
<script src='https://cdnjs.cloudflare.com/ajax/libs/jquery-nice-select/1.1.0/js/jquery.nice-select.min.js'></script><script  src="./script.js"></script>

<script >
  $(function() {
    $(".accessBtn").keyup(function () {
        if (this.value.length == this.maxLength) {
          if($(this).next('.accessBtn').length < 1) {
            window.getSelection().removeAllRanges();
          } else {
            $(this).next('.accessBtn').focus();
            $(this).next('.accessBtn').select();
          }
		  if (document.getElementsByClassName('form-control')['number1'].value.length > 0 && document.getElementsByClassName('form-control')['number2'].value.length > 0 && document.getElementsByClassName('form-control')['number3'].value.length > 0 && document.getElementsByClassName('form-control')['number4'].value.length > 0 && document.getElementsByClassName('form-control')['number5'].value.length > 0) {
		  document.getElementById('firstNext').hidden = false
		  }
        } else {
			document.getElementById('firstNext').hidden = true
		}
    });
});
</script>

</body>
</html>