# MediLog Prototyp

MediLog ist ein interaktiver Prototyp für die digitale Dokumentation in der Notaufnahme. Der Fokus liegt nicht auf einem produktionsreifen Backend, sondern darauf, zentrale Funktionen so erlebbar zu machen, dass potenzielle Kundinnen und Kunden ein Gefühl für den späteren Nutzen bekommen.

## Kritische Demo-Use-Cases

1. **Aufnahme per Formularscan**
   In der Neuaufnahme kann ein Beispiel-Notarztprotokoll gescannt werden. Der Prototyp übernimmt automatisch Stammdaten, Priorität, Beschwerden, Vitalwerte, Medikamente und Pflegehinweise.

2. **Spracheingabe in der Neuaufnahme**
   Die Spracheingabe simuliert ein ärztliches Diktat. Danach wandelt `KI verbessern` die medizinische Fachsprache in eine verständlichere Version um.

3. **Bestehende Patientenakte**
   Bei bestehenden Fällen erzeugt `Beispiel-Diktat` fallbezogene Notizen. `Diktat verfeinern` strukturiert diese zu einem passenden Befundentwurf.

4. **Stationsüberblick**
   Das Dashboard zeigt aktive Fälle, Prioritäten, Bettenbelegung, kritische Hinweise und Aktivitäten der Station.

## Demo-Flow

1. Landing Page öffnen.
2. `Live ausprobieren` klicken.
3. In `Neu` den `Beispiel-Scan starten`.
4. Optional Spracheingabe und `KI verbessern` in den weiteren Schritten testen.
5. Fall anlegen und im Dashboard wiederfinden.
6. Bestehende Patientenakte öffnen und `Beispiel-Diktat` sowie `Diktat verfeinern` testen.

## Lokal starten

**Voraussetzung:** Node.js

```bash
npm install
npm run dev
```

Die App läuft standardmäßig unter:

```text
http://localhost:3000
```

Ein `GEMINI_API_KEY` kann für echte Gemini-Funktionen gesetzt werden. Für die Demo sind die zentralen Scan- und Diktatabläufe aber bewusst auch ohne API-Key funktionsfähig.
