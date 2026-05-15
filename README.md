# VTU Result Scraper 🎓

A full-stack automated tool to scrape, track, and export student results from the VTU (Visvesvaraya Technological University) results portal. It automatically bypasses CAPTCHAs, stores student marks into a MongoDB database, and can export all the data straight into clean Excel sheets.

![VTU Scraper Application](frontend/public/vite.svg) *(Replace with actual screenshot if available)*

---

## 🌟 Key Features

- **Automated CAPTCHA Bypassing:** No need to type CAPTCHAs manually. The built-in OCR handles it automatically!
- **Bulk Scraping:** Generate a range of USNs (e.g., `1RF23CS001` to `1RF23CS200`) and scrape the entire batch in one go.
- **Revaluation Mode:** Check for updated marks! The scraper can compare new marks with existing records and only update subjects if the marks have improved.
- **Beautiful Dashboard:** A clean, modern UI to start jobs, view live progress, and search for specific student records.
- **Excel Exports:** Download perfectly formatted Excel reports of all scraped students for offline analysis.

---

## 🛠️ Prerequisites

To run this project as easily as possible, you do not need to install Python or Node.js manually. You just need **Docker**:

1. [Download and Install Docker Desktop](https://www.docker.com/products/docker-desktop)
2. Ensure Docker Desktop is running in the background.

---

## 🚀 How to Run the Project (The Easy Way)

This project is completely **Dockerized**. This means everything (the database, the backend, the frontend, and all complicated system dependencies like Tesseract OCR) is bundled together into one single command.

### Step 1: Open your terminal
Open a terminal (Command Prompt, PowerShell, or macOS/Linux Terminal) in the root folder of this project.

### Step 2: Start the application
Run the following command:

```bash
docker-compose up -d --build
```
*Note: The first time you run this, it will take a few minutes to download the necessary pieces and build the project. Grab a coffee! ☕*

### Step 3: Access the Application
Once the terminal finishes and says `Started`, you can access the application!

- **Frontend Dashboard:** Open your browser and go to [http://localhost](http://localhost)
- **Backend API Docs (Advanced):** Open [http://localhost:8000/docs](http://localhost:8000/docs)
- **Database:** MongoDB runs internally. If you want to connect a tool like MongoDB Compass, use the URI `mongodb://localhost:27017/`.

---

## 📖 How to Use the Dashboard

1. **Go to the "Scrape" tab**
   - Paste the direct URL to the exact VTU result page you want to scrape (e.g., *https://results.vtu.ac.in/D25J26Ecbcs/index.php*).
   - Enter the **College Code** (e.g., `1RF`), **Year** (e.g., `23`), and **Branch** (e.g., `CS`).
   - Enter the **Roll Range** (e.g., `1` to `150`).
   - Click **Start Scraping**.
2. **Watch the Magic happen!** 
   - You will see a live progress bar and a live log of which USNs succeeded, failed, or had invalid numbers.
3. **Download Excel:** 
   - Once the progress reaches 100%, an option to **Download Excel Report** will appear. 
   - You can also view all stored results in the **Results** tab at any time!

### What is "Revaluation Mode"?
If VTU releases revaluation results, check the **Revaluation Mode** switch before scraping. The scraper will look at the new marks and *only* overwrite the database if the new marks are higher than the old marks!

---

## 🛑 How to Stop the Application

To shut down the application and stop it from running in the background, open a terminal in the project folder and run:

```bash
docker-compose down
```

*(Note: Your scraped student data is safely preserved inside Docker even when you shut it down! Next time you start it back up, the data will still be there).*

### Want to wipe the database entirely?
If you want to start fresh and delete all saved data, run:
```bash
docker-compose down -v
```

---

## 📁 Where are my Excel files saved?
Every time you export an Excel sheet, a copy is automatically saved to the `exports/` folder right here in your project directory. 
