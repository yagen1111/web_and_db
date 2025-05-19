## Contribution Guidelines

Thank you for considering contributing to the project! Here are some guidelines to help make the process smooth and easy.

---

## Contribution Process

1. **Fork** the repository to your GitHub account (click the "Fork" button at the top right of the repository page).

2. **Clone** your fork to your local machine:

   ```bash
   git clone https://github.com/YOUR_USERNAME/flask-mysql-docker-app.git
   cd flask-mysql-docker-app
   ```

3. **Add the original repository as a remote:**

   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/flask-mysql-docker-app.git
   ```

4. **Create a new branch** for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

   or:

   ```bash
   git checkout -b fix/your-fix-name
   ```

5. Make the desired changes to the code.

6. **Run the application** and make sure everything works properly:

   ```bash
   docker-compose up --build
   ```

7. **Stage your changes:**

   ```bash
   git add .
   ```

8. **Commit your changes** with a clear message:

   ```bash
   git commit -m "Add feature X" or "Fix bug Y"
   ```

9. **Push your changes** to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

10. **Open a Pull Request** on GitHub:

    * Go to the original repository page
    * Click on "Pull requests" and then "New pull request"
    * Click on "compare across forks"
    * Select your fork and the branch you created
    * Click "Create pull request"
    * Add a title and description explaining your changes
    * Click "Create pull request"

---

## Code Standards

* Use **4 spaces** for indentation (no tabs)
* Add **comments** to complex sections of code
* Follow **PEP 8** for Python code style
* Make sure the application **runs inside Docker** before submitting a Pull Request

---

## Testing

* Ensure all new features work and existing functionality is not broken
* Test your code in a **clean Docker environment**
* If you added a new feature, include instructions in the **README** or other documentation

---

## Questions or Issues?

If you have any questions or run into any issues during the contribution process, please open an **Issue** and we’ll be happy to help.

---

**Thanks again for your contribution!**
