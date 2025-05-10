# Attendance System

## Overview
The Attendance System is a web application designed to manage attendance for students, faculty, and administrators. It provides functionalities for user registration, login, attendance marking, and dashboard views tailored to different user roles.

## Features
- **User Registration and Login**: Secure authentication for students, faculty, and admin users.
- **Dashboards**:
  - **Student Dashboard**: View enrolled courses and attendance statistics.
  - **Faculty Dashboard**: Manage attendance records and view assigned courses.
  - **Admin Dashboard**: Oversee user accounts and generate reports.
- **Attendance Management**: Mark attendance and retrieve attendance data.

## Technology Stack
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd attendance-system
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Set up the database:
   - Create a PostgreSQL database and run the SQL schema located in `db/schema.sql`.

5. Configure environment variables:
   - Copy `.env.example` to `.env` and fill in the required details.

6. Start the server:
   ```
   npm start
   ```

## Usage
- Access the application via your web browser at `http://localhost:3000`.
- Use the registration form to create a new account.
- Log in using your credentials to access the respective dashboard.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.