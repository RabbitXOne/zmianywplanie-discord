[EN] A script that automatically logs into the VULCAN journal every hour and checks whether changes to the timetable have been sent in the message module.

The project was prepared specifically for students of mechanikryki.pl

A “Regular school account” is required, not an eduVulcan account

The following environment variables are required to be added for the application to work properly:

- VULCAN_SYMBOL= e.g. powiatrycki
- VULCAN_LOGIN= login to the account
- VULCAN_PASSWORD= password for the logbook
- DISCORD_WEBHOOK= webhook URL on Discord
- DISCORD_ROLE= id of the role to mention in the message if the search phrase was found
- SEARCH_FOR= what phrase to search for in a PDF with changes, e.g., III DBT

NOTE: Any update, even the slightest, to the UONET+ or OneDrive log user interface may cause the app to not function properly.

Translated with DeepL.com (free version)

[PL] Skrypt, który co godzinę automatycznie loguje się do dziennika VULCAN i sprawdza czy w module wiadomości zostały wysłane zmiany w planie lekcji.

Projekt został przygotowany specjalnie dla uczniów mechanikryki.pl

Wymagane jest «Zwykłe konto szkolne», a nie konto eduVulcan

Do poprawnego działania aplikacji wymagane jest dodanie następujących zmiennych środowiskowych:

- VULCAN_SYMBOL= np. powiatrycki
- VULCAN_LOGIN= login do konta
- VULCAN_PASSWORD= hasło do dziennika
- DISCORD_WEBHOOK= adres URL webhooka na Discordzie
- DISCORD_ROLE= id roli, o której wspomnieć w wiadomości, jeśli znaleziono szukaną frazę
- SEARCH_FOR= jakiej frazy wyszukiwać w pliku PDF ze zmianami, np. III DBT

UWAGA: Każda, nawet najdrobniejsza aktualizacja interfejsu użytkownika dziennika UONET+ lub OneDrive może spowodować, że aplikacja nie będzie działać poprawnie.

![image](https://github.com/user-attachments/assets/f30cf6f5-53f9-4790-aa33-fedc739c0209)
