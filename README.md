Of course! Here's the English version of your project description:

---

# Flask MySQL Docker Application

**A web application based on Flask and MySQL, with Docker containers for a unified working environment.**

---

## Project Description

This project presents a simple Flask application that connects to a MySQL database and enables:

* Data input through a basic form
* Saving the data to the database
* Viewing all submitted data

The entire project is packaged using Docker and Docker Compose, making it easy to install and run in any environment.

---

## Technologies

* **Backend**: Python, Flask
* **Database**: MySQL
* **Frontend**: HTML, CSS, JavaScript
* **Containerization**: Docker, Docker Compose

---

## Project Structure

```
.
├── app.py                     # Main Flask application file
├── docker-compose.yml         # Docker Compose configuration file
├── requirements.txt           # Required Python libraries
├── .env                       # Environment variables file (excluded from Git)
├── .gitignore                 # Git ignore file
│
├── WEB-APP/
│   ├── TEMPLATES/
│   │   ├── index.html         # Data input form
│   │   └── view_data.html     # Data display page
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── script.js
│   └── Dockerfile             # Dockerfile for the application
│
└── DB-WEB/
    ├── Dockerfile             # Dockerfile for the database
    └── init.sql               # Database initialization script
```

---

## Installation & Running

### Prerequisites

* Docker
* Docker Compose
* Git

### Steps to Install

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/flask-mysql-docker-app.git
cd flask-mysql-docker-app
```

Start the services:

```bash
docker-compose up --build
```

### Access the Application

Open a browser at:
**[http://localhost:5000](http://localhost:5000)**

---

## Notes

* MySQL data is stored in a Docker volume, so it persists even if the containers are stopped.
* The web app will auto-reload during development when code changes are made.

---

## Contributing

We welcome contributions and improvements! Please follow these steps:

1. Fork the repository
2. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Ensure everything works correctly
5. Push your changes to your branch:

   ```bash
   git push origin feature/your-feature-name
   ```
6. Open a Pull Request on GitHub

**Note**: All Pull Requests will be reviewed and approved by the project maintainers before merging into the main repository.



---

## Contact

If you have any questions or suggestions, please open an issue on GitHub.

---
