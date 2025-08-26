# Family Hub Dashboard

A smart home dashboard to manage family schedules, tasks, and presence, with widgets for weather and public transport. This project is a single-page application built with React, TypeScript, and Tailwind CSS, using Dexie.js for client-side database storage.

## Features

- **Interactive Calendar:** View events in a responsive month, week, day, or agenda layout. Click any day to add a new event.
- **iCal Integration:** Subscribe to external calendars (like public holidays or school schedules) via iCal URL. Calendars automatically refresh every 5 minutes.
- **Event Import:** Preview events from an iCal URL and selectively import them into the main calendar.
- **Task Management:** A simple and effective to-do list widget for managing household tasks.
- **Live Weather Widget:** Get real-time weather and a 7-day forecast for any location. Supports searching for cities or using your device's GPS.
- **Train Departures Widget:** See live train departure times from a selected source to multiple destinations.
- **Personalization:**
    - Filter the calendar view by household member.
    - Light and Dark mode support.
    - Customizable widgets and preferences.
- **Offline First:** All data is stored locally in the browser using Dexie.js (IndexedDB), making the app fast and available offline.

## Compatibility

This is a modern web application designed to run in any up-to-date web browser. It is fully compatible with desktop and mobile operating systems, including:

-   **Desktop:** Windows, macOS, Linux (via Chrome, Firefox, Edge, Safari)
-   **Mobile:** Android 9+, iOS 13+ (via Chrome, Safari, or other modern browsers)

## Running Locally

This project uses modern web standards and can be run without a complex build setup.

1.  **Prerequisites:** You need a simple local web server to serve the files correctly due to browser security policies around ES Modules. If you have Node.js installed, you can use the `serve` package.

2.  **Installation (if you don't have a local server):**
    ```bash
    npm install -g serve
    ```

3.  **Running the App:**
    -   Navigate to the project's root directory in your terminal.
    -   Run the following command:
        ```bash
        serve .
        ```
    -   Open your web browser and go to the URL provided by the server (usually `http://localhost:3000`).

    **Note on Features:** Some browser features like **voice recording** and **geolocation ("Use Current Location")** require a secure context. They will only work if the app is served over **HTTPS**. The `serve` package can often handle this for you with the `-s` flag:
    ```bash
    serve -s .
    ```
    You may need to accept a browser security warning for the self-signed certificate.

The application will initialize its local database and be ready to use.