# Huur Aanvraag Pagina - Privé Toegang

## Overzicht
De huuraanvraag pagina is bewust **niet** zichtbaar in de publieke navigatie. Dit is een privé formulier dat alleen toegankelijk moet zijn voor mensen die de directe link ontvangen via e-mail of andere communicatiekanalen.

## Toegang
- **Productie**: `https://kriskrasvastgoed.nl/form`
- **Test**: `http://localhost:8000/form_test` (alleen voor lokale testing)

## Gebruik
1. Stuur de directe link naar geïnteresseerde huurders
2. Zij kunnen het formulier invullen zonder dat het publiekelijk vindbaar is
3. Alle aanvragen worden per e-mail verstuurd naar `anmar.noah@gmail.com`

## Beveiliging
- De pagina is niet gekoppeld aan de publieke navigatie
- Formulier bevat reCAPTCHA bescherming
- Server-side validatie van alle ingevoerde gegevens
- Bestandsupload beveiligd met type- en groottecontrole

## Testen
Gebruik het testscript voor Linux Mint:
```bash
./test_linux_mint.sh
```
En open dan `http://localhost:8000/form_test` in je browser.