# Tusaidiane - Msiba Olele Form

A beautiful, responsive web application for collecting, verifying, and exporting member registration data for the "Tusaidiane - Msiba Olele" community group.

## Overview

This application features:
- A dynamic, multi-step digital registration form for members to provide their details (personal info, dependents, origin, signatures).
- Automatic client-side PDF generation of the filled form allowing members to immediately download their signed declaration.
- A secure Admin Portal (Dashboard) to view, manage, delete, and individually export member forms.
- A bulk Export to CSV functionality so admins can effortlessly maintain a "perfect memory" of all names and entries safely.
- Data persistence via the browser's native IndexedDB (completely offline and private).

## Technologies Used

- **HTML5 & CSS3**: Custom styles (no bulky external CSS frameworks like Tailwind used) ensuring maximum performance and full control.
- **Vanilla JavaScript (ES6)**: Application logic, DOM manipulation, form validation, and state management.
- **IndexedDB**: Persistent local storage for the form submissions.
- **html2pdf.js**: To generate beautifully formatted, multi-page PDFs matching the physical forms.
- **Signature Pad**: Allows capturing digital signatures directly on the canvas.
- **Vite**: Superfast development server and optimized build tool.

## Installation and Setup

Since this project utilizes Vite, ensure you have [Node.js](https://nodejs.org/) installed on your machine.

1. **Install Dependencies:**
   Navigate into the project directory and run:
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open the Local network URL provided in your terminal (usually `http://localhost:5173`) in your web browser.

3. **Build for Production:**
   To compile and minify the project for publishing:
   ```bash
   npm run build
   ```
   The compiled static files will be placed in the `/dist` directory.

## Using the Admin Portal

To view the collected registrations, navigate to the **Admin Portal** using the floating button found on the bottom-right of the form.

**Default Login Credentials:**
- **Username:** `admin`
- **Password:** `msiba2026`

*Note: In a production environment with a backend, these credentials should be authenticated securely against a server database. Because this app operates entirely on the client-side (IndexedDB), the admin gate acts as a soft barrier to prevent accidental public access to the records dashboard.*

### Exporting Records
Once logged into the Admin Portal, you can click **"Pakua Orodha (CSV)"** to instantly download an Excel-compatible spreadsheet containing all the registered names and details perfectly formatted for your permanent record keeping.

## Deployment

Because this is a static site application, you can deploy the `dist/` folder to any static hosting provider like:
- **GitHub Pages**
- **Vercel**
- **Netlify**
- **Firebase Hosting**

Enjoy capturing perfect records for Tusaidiane - Msiba Olele!
