# AgriSolut

An application for monitoring plant health from images of leaves/plant. This version uses the Gemini API for plant disease detection.

## Architecture

The application now consists of a frontend and a backend:

-   **Frontend:** A static web application built with HTML, Tailwind CSS, and vanilla JavaScript. It allows users to upload an image of a plant leaf.
-   **Backend:** A Node.js server using Express. It receives the image from the frontend, sends it to the Gemini API for classification, and returns the results.

## How to Run

1.  **Install Dependencies:**
    -   Navigate to the project's root directory.
    -   Run `npm install` to install the backend dependencies.

2.  **Set Up API Key:**
    -   You will need a Gemini API key.
    -   Set the `API_KEY` environment variable to your Gemini API key.

3.  **Start the Server:**
    -   Run the following command:
        `API_KEY='YOUR_API_KEY' node server.js`
    -   Replace `YOUR_API_KEY` with your actual Gemini API key.

4.  **Access the Application:**
    -   Open your web browser and navigate to `http://localhost:3000`.

## Future Extensions

-   Include field monitoring using satellite imagery.
-   Add user accounts and a database to store past results.
-   Improve the UI/UX with more interactive elements.
