# KevRyn IDE - College Deployment Guide

This guide details how to install and run the KevRyn IDE and Live Monitor on a local college network server (Intranet).

## 1. Prerequisites
- **Node.js**: v18 or higher
- **MongoDB**: v6 or higher (running locally on port 27017)
- **Git**

## 2. Server Setup (Backend)
1. Open a terminal and navigate to the \server\ directory:
   \\\ash
   cd server
   \\\
2. Install dependencies:
   \\\ash
   npm install
   \\\
3. Create a \.env\ file in the \server\ directory with the following variables:
   \\\nv
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/kevryn_ide
   JWT_SECRET=super_secret_jwt_key_here
   CLIENT_URL=http://<YOUR_SERVER_IP>:3000
   KALYAN_KILL_KEY=KALYAN_MASTER_KEY
   RAVI_KILL_KEY=RAVI_MASTER_KEY
   \\\
   *(Replace \<YOUR_SERVER_IP>\ with the actual local IP address of your server machine so students can connect to it).*
4. Start the server:
   \\\ash
   npm run dev
   \\\

## 3. Client Setup (Frontend)
1. Open a new terminal and navigate to the \client\ directory:
   \\\ash
   cd client
   \\\
2. Install dependencies:
   \\\ash
   npm install
   \\\
3. Create a \.env\ file in the \client\ directory:
   \\\nv
   REACT_APP_SERVER_URL=http://<YOUR_SERVER_IP>:5000
   \\\
4. Start the frontend:
   \\\ash
   npm start
   \\\
   The client will run on \http://localhost:3000\.

## 4. Network Access for Students
To allow students in the lab to access the KevRyn IDE:
1. Find your server machine's IPv4 address (e.g., \192.168.1.50\).
2. Students can open their browsers and navigate to \http://192.168.1.50:3000\.
3. Faculty can monitor the lab in real-time from the dashboard.

## 5. Daily Data Backups
To ensure no student data or grades are lost, run the automated backup script daily.
From the \server\ directory, run:
\\\ash
npm run backup
\\\
This will export all MongoDB collections as JSON files into a \server/backups/\ directory timestamped for that day.
