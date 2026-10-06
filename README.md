# 🐱 Mathe-Kätzchen

Spielerisch Mathe üben für die **2. Klasse Volksschule (Österreich)** – Kätzchen sammeln mit Fischlein 🐟.
Reine Web-App (PWA) ohne Server: läuft auf GitHub Pages, wird am Handy installiert und funktioniert offline.

- **Kind (Kalea):** Lehrplan 2. Klasse (Österreich) in 14 Bereichen mit je 3 Levels: Zahlen bis 100, Plus, Minus,
  Ergänzen, Rechenrätsel (Rechendreiecke, Zahlenmauern, Zahlenhäuser, Zahlenfamilien, „Die kleine Aufgabe hilft“),
  Verdoppeln & Halbieren, Einmaleins & Teilen, Geld, Uhr, Zeit & Kalender, Längen, Formen & Körper, Zahlenfolgen,
  Rechengeschichten. Kätzchen-Leben (Futter, Pflege, Herzen, Wachsen), Laden, Erfolge, Jahreszeiten.
- **Eltern (🔒 PIN, Start 1234):** Fortschritt, Lernzettel fotografieren → Claude baut ein Lernpaket,
  KI-Pakete erstellen, Pakete prüfen/freischalten, Einstellungen, Sicherung.

## Daten & Datenschutz

Alle Daten (Profile, Fortschritt, Lernpakete) liegen **nur im Browser des Geräts** (localStorage).
Der Anthropic-API-Key wird im Elternbereich eingegeben, nur auf dem Gerät gespeichert und direkt an
`api.anthropic.com` geschickt – er ist nie Teil dieses Repos und nicht in Sicherungsdateien enthalten.
Sicherung/Wiederherstellung: Elternbereich → ⚙️ Einstellungen → 💾 Sicherung.

## Installieren

- **iPhone:** Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“
- **Android:** Seite in Chrome öffnen → ⋮ → „App installieren“

## Update veröffentlichen

Dateien ändern, in `service-worker.js` die Versionsnummer von `CACHE` erhöhen, committen und pushen.
GitHub Pages ist nach ca. 1 Minute aktuell; die App lädt beim nächsten Öffnen mit Internet die neue Version.

## Lokal testen

```bash
python -m http.server 8093
```
