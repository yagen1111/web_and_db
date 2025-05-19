# DB-WEB/Dockerfile

FROM mysql:8.0

# הגדרת משתני סביבה
ENV MYSQL_ROOT_PASSWORD=root_password
ENV MYSQL_DATABASE=webapp_db
ENV MYSQL_USER=webapp_user
ENV MYSQL_PASSWORD=secure_password

# העתקת קובץ האתחול
COPY initdb.sql /docker-entrypoint-initdb.d/

# הגדרת אזור זמן
ENV TZ=Asia/Jerusalem

# חשיפת פורט MySQL
EXPOSE 3306