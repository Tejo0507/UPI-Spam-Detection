<div align="center">

# 🛡️ UPI Spam Detection 

**A modern, robust web application to detect and prevent UPI payment spam using the Rabin-Karp string matching algorithm.**

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)]()
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)]()
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)]()

[Explore Features](#features) • [How it Works](#how-it-works) • [Installation](#installation) • [Tech Stack](#tech-stack)

</div>

---

## 📌 Overview

With the rise of Digital India, UPI (Unified Payments Interface) has become the primary mode of transactions. However, this has also led to an alarming increase in UPI spam and fraudulent payment requests. 

This project is a powerful front-to-back solution that analyzes incoming UPI payment request notes and metadata against a vast database of known spam signatures using the highly efficient **Rabin-Karp Algorithm**.

## ✨ Features

- 🔍 **Real-time Spam Detection**: Instantly analyzes text to flag potential spam triggers.
- ⚙️ **Rabin-Karp Powered**: Educates and utilizes the Rabin-Karp pattern matching algorithm for blazing-fast string matching.
- 🔐 **Secure Authentication**: Built-in user authentication flow.
- 📊 **Algorithm Visualization**: Interactive UI explaining how the detection algorithm works under the hood.
- 📱 **Responsive Design**: Modern, clean, and mobile-friendly interface.

## 🧠 How it Works

The core of our detection engine relies on checking transaction notes for common spam patterns (e.g., " कैशबैक", "Lottery", "Prize"). 

Instead of basic string searching, we implement the **Rabin-Karp algorithm** which hashes the search pattern and the text window. If the hashes match, it performs a character-by-character check, reducing the time complexity significantly for multiple pattern searches.

## 🛠 Tech Stack

### Frontend
* **HTML5 & CSS3**: For semantic structure and stylish, modern components.
* **Vanilla JavaScript**: DOM manipulation, interactive algorithms, and API handling.

### Backend
* **Node.js**: Server environment.
* *(Express likely serves the static files inside the `public/` directory)*

## 📂 Project Structure

```text
📦 UPI-Spam-Detection
 ┣ 📂 public
 ┃ ┣ 📂 css
 ┃ ┃ ┗ 📜 styles.css
 ┃ ┣ 📂 js
 ┃ ┃ ┣ 📜 algorithm.js    # Logic for algorithm visualization
 ┃ ┃ ┣ 📜 auth.js         # Authentication logic
 ┃ ┃ ┣ 📜 common.js       # Shared utilities
 ┃ ┃ ┣ 📜 detector.js     # Main spam detection engine
 ┃ ┃ ┣ 📜 keywords.js     # Dictionary of spam keywords
 ┃ ┃ ┗ 📜 rabinKarp.js    # Rabin-Karp pattern matching implementation
 ┃ ┣ 📜 404.html
 ┃ ┣ 📜 algorithm.html
 ┃ ┣ 📜 auth.html
 ┃ ┣ 📜 detector.html
 ┃ ┣ 📜 how-it-works.html
 ┃ ┗ 📜 index.html
 ┣ 📜 server.js           # Node.js backend server
 ┣ 📜 package.json        # Project metadata and dependencies
 ┗ 📜 README.md
```

## 🚀 Installation & Setup

Want to run the project locally? Follow these steps:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tejo0507/UPI-Spam-Detection.git
   cd UPI-Spam-Detection
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   # or
   node server.js
   ```

4. **Open in Browser**
   Navigate to `http://localhost:3000` (or the port specified in your console).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check [issues page](https://github.com/Tejo0507/UPI-Spam-Detection/issues) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
Made with ❤️ for safer digital payments.
</div>