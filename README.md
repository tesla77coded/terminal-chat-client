# Terminal Chat (Client)

A secure, end-to-end encrypted, terminal-based chat application built with TypeScript, Node.js, and Ink.

**Note:** The backend server for this project can be found here: [https://github.com/tesla77coded/terminal-chat-backend.git](https://github.com/tesla77coded/terminal-chat-backend.git)


---

## ✨ Features

* **End-to-End Encryption**: All messages are encrypted using a hybrid RSA and AES-256-GCM system. The server never sees your plain text messages.
* **Real-Time Messaging**: Instant message delivery using WebSockets.
* **Persistent Sessions**: Stay logged in between sessions.
* **Modern Terminal UI**: Built with Ink and React, providing a responsive and user-friendly interface.
* **User Discovery**: Search for other users to start new conversations.
* **Unread Message Counts**: Keep track of new messages from all your contacts, sorted by recent activity.

---

## 🚀 Getting Started

### Prerequisites

For the best experience, your terminal environment should have:

* **A Modern Terminal Emulator**: A terminal that supports truecolor (24-bit color) is recommended for the best visual experience. Examples include Kitty, iTerm2, Alacritty, or Windows Terminal.
* **A Nerd Font**: To ensure emojis and other special characters render correctly, it is highly recommended to use a [Nerd Font](https://www.nerdfonts.com/).
* **Bun**: You must have the [Bun](https://bun.sh/) runtime installed to run the application from source.

### Installation & Usage

1.  **Download:**
    Download the latest release executable for your operating system (`terminal-chat-linux`, `terminal-chat-macos`, or `terminal-chat-win.exe`) from the [Releases](https://github.com/tesla77coded/terminal-chat-client/releases) page on GitHub.

2.  **Run:**
    Open your terminal, navigate to the folder where you downloaded the file, and run it:

    ```bash
    # For Linux/macOS (you may need to make it executable first)
    chmod +x ./terminal-chat-linux
    ./terminal-chat-linux

    # For Windows (in Command Prompt or PowerShell)
    .\terminal-chat-win.exe
    ```
3.  **Start Chatting**  To start a new conversation, use the search bar at the top to find a friend by their username and press Enter to select them and start chatting.
   
---

### (Optional) Global Access

To run the application from any directory without needing to navigate to its folder, you can add the executable to your system's PATH.

#### Linux & macOS

1.  Open a terminal and navigate to where you downloaded the file.
2.  Move the executable to `/usr/local/bin`, a standard location for user-installed programs. This command also renames the file to `terminal-chat` for convenience.
    ```bash
    # For Linux
    sudo mv ./terminal-chat-linux /usr/local/bin/terminal-chat

    # For macOS
    sudo mv ./terminal-chat-macos /usr/local/bin/terminal-chat
    ```
3.  You can now open any new terminal and start the application by typing `terminal-chat`.

#### Windows

1.  Create a permanent folder for your application, for example: `C:\Program Files\terminal-chat\`
2.  Move the `terminal-chat-win.exe` file into this new folder.
3.  Add the folder to your PATH:
    * Open the Start Menu and search for "**Environment Variables**".
    * Click on "**Edit the system environment variables**".
    * Click the "**Environment Variables...**" button.
    * In the "User variables" section, find and select the **`Path`** variable, then click **"Edit..."**.
    * Click **"New"** and paste in the path to your folder (e.g., `C:\Program Files\terminal-chat`).
    * Click **"OK"** on all windows to save.
4.  Open a **new** terminal window. You can now start the application from anywhere by typing `terminal-chat-win.exe`.

---

## 🛠️ For Developers (Running from Source)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/tesla77coded/terminal-chat-client.git](https://github.com/tesla77coded/terminal-chat-client.git)
    cd terminal-chat-client
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Run the application:**
    ```bash
    bun run start
    ```

---

## 💻 Tech Stack

* **UI Framework**: [Ink](https://github.com/vadimdemedes/ink) & [React](https://reactjs.org/)
* **Language**: TypeScript
* **Backend Communication**: Axios & WebSockets
* **Cryptography**: Node.js `crypto` module
* **Packaging**: Bun

---

## 👋 Say Hi!

This project was built by **tesla77**.

Want to see the app in action or have some feedback? Find me inside the app! Once you've registered, use the search bar to find the username `tesla77` and send a message.
